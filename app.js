// 情侣水滴打卡 app.js
// 本地存储饮水数据，支持情侣互动、成就、提醒、排行榜

const DEFAULT_DAILY_GOAL = 2000;
const DEFAULT_REMINDER_INTERVAL = 60; // 分钟

// 生成唯一用户ID作为同步码
function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 初始化数据存储
let waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
let settings = JSON.parse(localStorage.getItem('waterSettings') || '{}');
let coupleData = JSON.parse(localStorage.getItem('coupleData') || '{}');

// 当前激活用户（默认为用户自己）
let currentUser = 'user1';

// 初始化用户数据结构
if (!waterData.user1) {
    waterData = {
        user1: {
            history: {},
            streak: 0,
            bestDay: null,
            achievements: []
        },
        user2: {
            history: {},
            streak: 0,
            bestDay: null,
            achievements: []
        }
    };
    
    // 添加模拟数据，便于测试
    const currentDate = today;
    const yesterday = luxon.DateTime.local().minus({days: 1}).toFormat('yyyy-MM-dd');
    
    // 用户自己的模拟数据
    waterData.user1.history[currentDate] = {};
    waterData.user1.history[currentDate]['09'] = [200, 150];
    waterData.user1.history[currentDate]['12'] = [350];
    waterData.user1.history[currentDate]['15'] = [200, 100];
    waterData.user1.history[yesterday] = {};
    waterData.user1.history[yesterday]['10'] = [200, 300];
    waterData.user1.history[yesterday]['14'] = [250, 150];
    
    // 伴侣的模拟数据
    waterData.user2.history[currentDate] = {};
    waterData.user2.history[currentDate]['08'] = [250];
    waterData.user2.history[currentDate]['13'] = [300, 150];
    waterData.user2.history[yesterday] = {};
    waterData.user2.history[yesterday]['09'] = [200];
    waterData.user2.history[yesterday]['16'] = [350, 200];
    
    // 添加成就
    waterData.user1.achievements = ['first', 'streak3'];
    waterData.user2.achievements = ['first'];
    
    // 保存模拟数据
    localStorage.setItem('waterData', JSON.stringify(waterData));
}

// 初始化设置
if (!settings.user1) {
    settings = {
        user1: {
            name: '我',
            dailyGoal: DEFAULT_DAILY_GOAL,
            reminder: true,
            reminderInterval: DEFAULT_REMINDER_INTERVAL
        },
        user2: {
            name: '伴侣',
            dailyGoal: DEFAULT_DAILY_GOAL,
            reminder: true,
            reminderInterval: DEFAULT_REMINDER_INTERVAL
        },
        theme: 'default',
        userId: generateUserId(),
        partnerId: ''
    };
}

// 初始化情侣数据
if (!coupleData.messages) {
    coupleData = {
        messages: [
            {
                sender: 'user2',
                receiver: 'user1',
                message: '亲爱的，你今天喝水了吗？记得多喝水哦～',
                timestamp: luxon.DateTime.local().minus({hours: 2}).toISO()
            },
            {
                sender: 'user1',
                receiver: 'user2',
                message: '我们一起变得更健康吧！爱你哦❤️',
                timestamp: luxon.DateTime.local().minus({hours: 1}).toISO()
            }
        ],
        challenges: [
            {
                id: 'drink-together',
                name: '一起喝水挑战',
                status: 'active',
                progress: 2,
                goal: 5
            }
        ],
        weeklyCompetition: {
            user1: 1200,
            user2: 900,
            lastReset: luxon.DateTime.local().minus({days: 3}).toFormat('yyyy-MM-dd')
        }
    };
    
    // 保存模拟数据
    localStorage.setItem('coupleData', JSON.stringify(coupleData));
}

const today = luxon.DateTime.local().toFormat('yyyy-MM-dd');
const currentHour = luxon.DateTime.local().toFormat('HH');

// ----------------- DOM 元素 -----------------
// 水瓶和用户切换
const user1BtnEl = document.getElementById('user1-btn');
const user2BtnEl = document.getElementById('user2-btn');
const waterLevelUser1El = document.getElementById('water-level-user1');
const waterLevelUser2El = document.getElementById('water-level-user2');
const user1NameEl = document.getElementById('user1-name');
const user2NameEl = document.getElementById('user2-name');
const currentUserTitleEl = document.getElementById('current-user-title');

// 饮水数据和进度
const currentAmountEl = document.getElementById('current-amount');
const targetAmountEl = document.getElementById('target-amount');
const percentageEl = document.getElementById('percentage');
const currentHourAmountEl = document.getElementById('current-hour-amount');

// 统计和图表
const streakCountEl = document.getElementById('streak-count');
const totalDaysEl = document.getElementById('total-days');
const avgCompletionEl = document.getElementById('avg-completion');
const bestDayEl = document.getElementById('best-day');

// 情侣互动
const coupleMessageEl = document.getElementById('couple-message');
const sendEncouragementBtn = document.getElementById('send-encouragement');

// 排行榜和挑战
const tabChartsBtn = document.getElementById('tab-charts');
const tabCoupleBtn = document.getElementById('tab-couple');
const chartsTabEl = document.getElementById('charts-tab');
const coupleTabEl = document.getElementById('couple-tab');
const user1ProgressBarEl = document.getElementById('user1-progress-bar');
const user2ProgressBarEl = document.getElementById('user2-progress-bar');
const user1AmountCompEl = document.getElementById('user1-amount-comp');
const user2AmountCompEl = document.getElementById('user2-amount-comp');
const user1NameCompEl = document.getElementById('user1-name-comp');
const user2NameCompEl = document.getElementById('user2-name-comp');
const competitionResultEl = document.getElementById('competition-result');

// 成就和设置
const achievementsContainer = document.getElementById('achievements-container');
const achievementModal = document.getElementById('achievement-modal');
const achievementIcon = document.getElementById('achievement-icon');
const achievementTitle = document.getElementById('achievement-title');
const achievementDesc = document.getElementById('achievement-description');

// 设置相关
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsTabs = document.querySelectorAll('.settings-tab');
const personalSettingsEl = document.getElementById('personal-settings');
const coupleSettingsEl = document.getElementById('couple-settings');
const user1NameInputEl = document.getElementById('user1-name-input');
const user2NameInputEl = document.getElementById('user2-name-input');
const dailyGoalInput = document.getElementById('daily-goal');
const reminderToggle = document.getElementById('reminder-toggle');
const reminderIntervalInput = document.getElementById('reminder-interval');
const themeSelect = document.getElementById('theme-select');
const syncCodeEl = document.getElementById('sync-code');
const copySyncCodeBtn = document.getElementById('copy-sync-code');
const partnerSyncCodeEl = document.getElementById('partner-sync-code');
const connectPartnerBtn = document.getElementById('connect-partner');
const coupleToggle = document.getElementById('couple-challenge-toggle');
const saveSettingsBtn = document.getElementById('save-settings');
const settingsSavedMsgEl = document.getElementById('settings-saved-message');

// 其他元素
const closeBtns = document.querySelectorAll('.close-btn');
const reminderToast = document.getElementById('reminder-toast');
const toastCloseBtn = document.querySelector('.toast-close');
const customAmountInput = document.getElementById('custom-amount');
const addCustomBtn = document.getElementById('add-custom');
const waterOptionBtns = document.querySelectorAll('.water-option');

// ----------------- 饮水数据处理 -----------------
function getTodayTotal() {
    // 获取当前用户的数据
    const userData = waterData[currentUser] || waterData;
    if (!userData.history || !userData.history[today]) return 0;
    
    const hourObj = userData.history[today] || {};
    let sum = 0;
    Object.values(hourObj).forEach(arr => {
        sum += arr.reduce((a, b) => a + b, 0);
    });
    return sum;
}

function getHourTotal(hour) {
    // 获取当前用户的数据
    const userData = waterData[currentUser] || waterData;
    if (!userData.history || !userData.history[today]) return 0;
    
    const hourObj = userData.history[today] || {};
    return (hourObj[hour] || []).reduce((a, b) => a + b, 0);
}

// 获取当前用户的水滴数据
function getCurrentUserData() {
    return waterData[currentUser] || waterData; // 兼容旧数据
}

// 获取当前用户的设置
function getCurrentUserSettings() {
    return settings[currentUser] || settings; // 兼容旧设置
}

// 更新所有UI元素
function updateUI() {
    updateProgressUI();
    updateUserNames();
    updateWaterBottles();
    updateCoupleCompetition();
}

// 更新进度条和数据显示
function updateProgressUI() {
    const userSettings = getCurrentUserSettings();
    const total = getTodayTotal();
    const percent = Math.min(100, Math.round((total / userSettings.dailyGoal) * 100));
    
    // 更新数据显示
    currentAmountEl.textContent = total;
    targetAmountEl.textContent = userSettings.dailyGoal;
    percentageEl.textContent = percent + '%';
    currentHourAmountEl.textContent = getHourTotal(currentHour);
    
    // 更新标题
    currentUserTitleEl.textContent = currentUser === 'user1' ? 
        `${settings.user1.name}的饮水进度` : 
        `${settings.user2.name}的饮水进度`;
    
    // 更新水瓶高度
    updateWaterBottles();
}

// 更新用户名称
function updateUserNames() {
    user1NameEl.textContent = settings.user1.name;
    user2NameEl.textContent = settings.user2.name;
    user1NameCompEl.textContent = settings.user1.name;
    user2NameCompEl.textContent = settings.user2.name;
}

// 更新水瓶高度
function updateWaterBottles() {
    // 先获取元素，确保它们存在
    waterLevelUser1El = document.getElementById('water-level-user1');
    waterLevelUser2El = document.getElementById('water-level-user2');
    
    // 确保水瓶元素存在
    if (!waterLevelUser1El || !waterLevelUser2El) {
        console.error('Water bottle elements not found');
        return;
    }
    
    // 用户自己的水瓶
    const user1Total = getTodayTotalForUser('user1');
    const user1Percent = Math.min(95, Math.round((user1Total / settings.user1.dailyGoal) * 100)); // 最多只显示95%，避免溢出
    waterLevelUser1El.style.height = user1Percent + '%';
    
    // 伴侣的水瓶
    const user2Total = getTodayTotalForUser('user2');
    const user2Percent = Math.min(95, Math.round((user2Total / settings.user2.dailyGoal) * 100)); // 最多只显示95%，避免溢出
    waterLevelUser2El.style.height = user2Percent + '%';
    
    console.log('Water bottles updated:', user1Percent + '%', user2Percent + '%', waterLevelUser1El, waterLevelUser2El);
}

// 获取指定用户的今日总量
function getTodayTotalForUser(user) {
    const userData = waterData[user] || waterData;
    if (!userData.history || !userData.history[today]) return 0;
    
    const hourObj = userData.history[today] || {};
    let sum = 0;
    Object.values(hourObj).forEach(arr => {
        sum += arr.reduce((a, b) => a + b, 0);
    });
    return sum;
}

// 添加水滴记录
function addWater(amount) {
    // 初始化当前用户的数据结构
    if (!waterData[currentUser]) {
        waterData[currentUser] = { history: {} };
    }
    if (!waterData[currentUser].history) {
        waterData[currentUser].history = {};
    }
    if (!waterData[currentUser].history[today]) {
        waterData[currentUser].history[today] = {};
    }
    if (!waterData[currentUser].history[today][currentHour]) {
        waterData[currentUser].history[today][currentHour] = [];
    }
    
    // 添加水滴记录
    waterData[currentUser].history[today][currentHour].push(amount);
    
    // 更新情侣比赛数据
    if (currentUser === 'user1') {
        coupleData.weeklyCompetition.user1 += amount;
    } else {
        coupleData.weeklyCompetition.user2 += amount;
    }
    
    // 保存数据
    localStorage.setItem('waterData', JSON.stringify(waterData));
    localStorage.setItem('coupleData', JSON.stringify(coupleData));
    
    // 更新UI
    updateUI();
    updateStats();
    renderHourChart();
    renderWeeklyChart();
    updateCoupleCompetition();
    checkAchievements();
    
    // 动画效果
    showDrinkAnimation(amount);
    showEmojiFeedback(amount);
}

// ----------------- 统计与成就 -----------------
function updateStats() {
    const days = Object.keys(waterData.history);
    let streak = 0, maxStreak = 0, lastDay = null, totalDays = 0, sumPercent = 0, bestDay = null, bestAmount = 0;
    days.sort();
    days.forEach(date => {
        const total = waterData.history[date].reduce((a, b) => a + b, 0);
        const percent = Math.min(100, Math.round((total / settings.dailyGoal) * 100));
        sumPercent += percent;
        if (percent >= 100) {
            if (!lastDay || luxon.DateTime.fromISO(date).diff(luxon.DateTime.fromISO(lastDay), 'days').days === 1) {
                streak++;
            } else {
                streak = 1;
            }
            if (streak > maxStreak) maxStreak = streak;
            lastDay = date;
        }
        if (percent >= 100) totalDays++;
        if (total > bestAmount) {
            bestAmount = total;
            bestDay = date;
        }
    });
    streakCountEl.textContent = maxStreak;
    totalDaysEl.textContent = totalDays;
    avgCompletionEl.textContent = days.length ? Math.round(sumPercent / days.length) + '%' : '0%';
    bestDayEl.textContent = bestDay ? bestDay : '-';
}

// ----------------- Chart.js 饮水图表 -----------------
let weeklyChart;
function renderChart() {
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    const last7days = Array.from({length: 7}, (_, i) => luxon.DateTime.local().minus({days: 6 - i}).toFormat('yyyy-MM-dd'));
    const data = last7days.map(date => {
        const hourObj = waterData.history[date] || {};
        let sum = 0;
        Object.values(hourObj).forEach(arr => { sum += arr.reduce((a, b) => a + b, 0); });
        return sum;
    });
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7days.map(d => d.substr(5)),
            datasets: [{
                label: '每日饮水量 (ml)',
                data,
                backgroundColor: data.map(v => v >= settings.dailyGoal ? 'var(--primary-color)' : 'var(--secondary-color)'),
                borderRadius: 12
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(settings.dailyGoal, ...data, 2000)
                }
            }
        }
    });
}
// 新增：今日小时分布图
let hourChart;
function renderHourChart() {
    const ctx = document.getElementById('hourly-chart')?.getContext('2d');
    if (!ctx) return;
    const hours = Array.from({length: 24}, (_, i) => (i < 10 ? '0' : '') + i);
    const data = hours.map(h => getHourTotal(h));
    if (hourChart) hourChart.destroy();
    hourChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: '每小时饮水量 (ml)',
                data,
                backgroundColor: data.map(v => v > 0 ? 'var(--primary-color)' : '#eee'),
                borderRadius: 8
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: Math.max(...data, 400) } }
        }
    });
}

// ----------------- 成就系统 -----------------
const ACHIEVEMENTS = [
    {id: 'first', name: '第一次打卡', desc: '记录你的第一杯水！', icon: 'https://cdn-icons-png.flaticon.com/512/824/824239.png'},
    {id: 'streak3', name: '坚持3天', desc: '连续3天达成目标', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'},
    {id: 'streak7', name: '坚持7天', desc: '连续7天达成目标', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081578.png'},
    {id: 'goal2000', name: '喝满2L', desc: '单日饮水量达到2000ml', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081589.png'},
    {id: 'goal3000', name: '超越自我', desc: '单日饮水量达到3000ml', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081592.png'},
    {id: 'custom', name: '自定义饮水', desc: '使用自定义饮水量打卡', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081566.png'}
];

function checkAchievements() {
    let unlocked = waterData.achievements || [];
    let todayTotal = getTodayTotal();
    let streak = 0;
    // 连续天数
    const days = Object.keys(waterData.history).sort();
    for (let i = days.length - 1; i >= 0; i--) {
        const date = days[i];
        const total = waterData.history[date].reduce((a, b) => a + b, 0);
        if (total >= settings.dailyGoal) streak++;
        else break;
    }
    // 检查成就
    const newAchievements = [];
    if (!unlocked.includes('first') && todayTotal > 0) newAchievements.push('first');
    if (!unlocked.includes('streak3') && streak >= 3) newAchievements.push('streak3');
    if (!unlocked.includes('streak7') && streak >= 7) newAchievements.push('streak7');
    if (!unlocked.includes('goal2000') && todayTotal >= 2000) newAchievements.push('goal2000');
    if (!unlocked.includes('goal3000') && todayTotal >= 3000) newAchievements.push('goal3000');
    // 自定义饮水
    if (!unlocked.includes('custom') && waterData.history[today] && waterData.history[today].some(a => a % 50 !== 0)) newAchievements.push('custom');
    if (newAchievements.length > 0) {
        unlocked = unlocked.concat(newAchievements);
        waterData.achievements = unlocked;
        localStorage.setItem('waterData', JSON.stringify(waterData));
        renderAchievements();
        showAchievementModal(newAchievements[0]);
    } else {
        renderAchievements();
    }
}

function renderAchievements() {
    achievementsContainer.innerHTML = '';
    (ACHIEVEMENTS).forEach(a => {
        const unlocked = (waterData.achievements || []).includes(a.id);
        achievementsContainer.innerHTML += `<div class="achievement${unlocked ? ' unlocked' : ''}" data-id="${a.id}">
            <img src="${a.icon}" alt="${a.name}"/>
            <span class="achievement-name">${a.name}</span>
        </div>`;
    });
    // 点击成就弹窗
    document.querySelectorAll('.achievement').forEach(el => {
        el.onclick = () => {
            const id = el.getAttribute('data-id');
            showAchievementModal(id);
        };
    });
}

function showAchievementModal(id) {
    const a = ACHIEVEMENTS.find(a => a.id === id);
    if (!a) return;
    achievementIcon.src = a.icon;
    achievementTitle.textContent = a.name;
    achievementDesc.textContent = a.desc;
    achievementModal.style.display = 'flex';
    // 撒花动画
    for (let i = 0; i < 24; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = `hsl(${Math.random()*360},80%,70%)`;
        confetti.style.animation = `confettiFall 1.2s linear forwards`;
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 2000);
    }
}

// ----------------- 设置与主题 -----------------
settingsBtn.onclick = () => {
    dailyGoalInput.value = settings.dailyGoal;
    reminderToggle.checked = settings.reminder;
    reminderIntervalInput.value = settings.reminderInterval;
    themeSelect.value = settings.theme;
    settingsModal.style.display = 'flex';
};
closeBtns.forEach(btn => btn.onclick = () => btn.closest('.modal').style.display = 'none');
saveSettingsBtn.onclick = () => {
    settings.dailyGoal = parseInt(dailyGoalInput.value) || DEFAULT_DAILY_GOAL;
    settings.reminder = reminderToggle.checked;
    settings.reminderInterval = parseInt(reminderIntervalInput.value) || DEFAULT_REMINDER_INTERVAL;
    settings.theme = themeSelect.value;
    localStorage.setItem('waterSettings', JSON.stringify(settings));
    document.body.className = `theme-${settings.theme}`;
    settingsModal.style.display = 'none';
    updateProgressUI();
    renderChart();
};
// 主题切换
if (settings.theme && settings.theme !== 'default') {
    document.body.className = `theme-${settings.theme}`;
}

// ----------------- 饮水记录按钮 -----------------
waterOptionBtns.forEach(btn => {
    btn.onclick = () => {
        const amount = parseInt(btn.getAttribute('data-amount'));
        addWater(amount);
    };
});
addCustomBtn.onclick = () => {
    const amount = parseInt(customAmountInput.value);
    if (amount && amount > 0) {
        addWater(amount);
        customAmountInput.value = '';
    }
};

// ----------------- 饮水提醒 -----------------
let reminderTimer = null;
function setupReminder() {
    if (reminderTimer) clearInterval(reminderTimer);
    if (settings.reminder) {
        reminderTimer = setInterval(() => {
            showCuteReminder();
        }, settings.reminderInterval * 60 * 1000);
    }
}
toastCloseBtn.onclick = () => {
    reminderToast.style.display = 'none';
};
setupReminder();

// 可爱提醒弹窗
function showCuteReminder() {
    reminderToast.querySelector('p').textContent = randomReminderText();
    reminderToast.style.display = 'block';
}
function randomReminderText() {
    const arr = [
        '水精灵来提醒你啦～喝一口水，皮肤会更好哦！',
        '喝水时间到，补充水分是美丽秘诀！',
        '亲爱的，来点水润一下自己吧（＾▽＾）',
        '多喝水，元气满满每一天！',
        '小仙女要记得喝水哟～',
        '水水喝起来，活力一整天！',
        '一起变美从喝水开始！',
    ];
    return arr[Math.floor(Math.random() * arr.length)];
}

reminderToggle.onchange = () => {
    document.getElementById('reminder-interval-group').style.display = reminderToggle.checked ? 'block' : 'none';
};
document.getElementById('reminder-interval-group').style.display = reminderToggle.checked ? 'block' : 'none';

// ----------------- 动画与互动反馈 -----------------
function showDrinkAnimation(amount) {
    const container = document.getElementById('drink-animation-container');
    if (!container) return;
    container.innerHTML = '';
    const drop = document.createElement('div');
    drop.className = 'drink-drop';
    drop.innerHTML = '<svg width="40" height="40" viewBox="0 0 40 40"><ellipse cx="20" cy="30" rx="10" ry="14" fill="#4fc3f7"/><ellipse cx="20" cy="16" rx="7" ry="10" fill="#b3e5fc" opacity="0.7"/></svg>';
    container.appendChild(drop);
    drop.animate([
        {transform: 'translateY(-30px) scale(0.9)'},
        {transform: 'translateY(0) scale(1.1)'},
        {transform: 'translateY(10px) scale(1)'},
        {transform: 'translateY(0) scale(1)'}
    ], {duration: 700, easing: 'ease'});
    setTimeout(() => { drop.remove(); }, 800);
}
function showEmojiFeedback(amount) {
    const container = document.getElementById('drink-animation-container');
    if (!container) return;
    const emojiArr = ['💧','🌸','🥤','✨','😊','🧃','🥛','🦋','🍉','🍋'];
    const emoji = document.createElement('span');
    emoji.className = 'drink-emoji-feedback';
    emoji.textContent = emojiArr[Math.floor(Math.random()*emojiArr.length)];
    emoji.style.position = 'absolute';
    emoji.style.left = (Math.random()*80+10) + '%';
    emoji.style.top = (Math.random()*20+10) + '%';
    emoji.style.fontSize = '2.2rem';
    emoji.style.opacity = 0.85;
    emoji.animate([
        {transform:'scale(0.7) translateY(0)', opacity:0.9},
        {transform:'scale(1.2) translateY(-30px)', opacity:0.6},
        {transform:'scale(1) translateY(-60px)', opacity:0}
    ], {duration: 1200, easing:'ease-out'});
    container.appendChild(emoji);
    setTimeout(()=>emoji.remove(), 1300);
}

// ----------------- 情侣互动功能 -----------------
// 更新情侣比赛数据
function updateCoupleCompetition() {
    // 检查是否需要重置每周数据
    const lastReset = luxon.DateTime.fromISO(coupleData.weeklyCompetition.lastReset);
    const now = luxon.DateTime.local();
    const diffDays = now.diff(lastReset, 'days').days;
    
    if (diffDays >= 7) {
        // 重置每周数据
        coupleData.weeklyCompetition = {
            user1: 0,
            user2: 0,
            lastReset: now.toFormat('yyyy-MM-dd')
        };
        localStorage.setItem('coupleData', JSON.stringify(coupleData));
    }
    
    // 更新比赛条
    const user1Amount = coupleData.weeklyCompetition.user1;
    const user2Amount = coupleData.weeklyCompetition.user2;
    const total = user1Amount + user2Amount;
    
    if (total > 0) {
        const user1Percent = Math.round((user1Amount / total) * 100);
        const user2Percent = 100 - user1Percent;
        
        user1ProgressBarEl.style.width = user1Percent + '%';
        user2ProgressBarEl.style.width = user2Percent + '%';
        user1AmountCompEl.textContent = user1Amount + 'ml';
        user2AmountCompEl.textContent = user2Amount + 'ml';
        
        // 更新比赛结果
        if (user1Amount > user2Amount) {
            competitionResultEl.textContent = `${settings.user1.name}本周领先${user1Amount - user2Amount}ml！`;
        } else if (user2Amount > user1Amount) {
            competitionResultEl.textContent = `${settings.user2.name}本周领先${user2Amount - user1Amount}ml！`;
        } else {
            competitionResultEl.textContent = '两人打成平手，继续努力！';
        }
    } else {
        competitionResultEl.textContent = '本周比赛还未开始，喝水打卡吧！';
    }
}

// 发送鼓励消息
function sendEncouragement() {
    const sender = currentUser;
    const receiver = currentUser === 'user1' ? 'user2' : 'user1';
    const message = getRandomEncouragement();
    
    // 添加消息
    coupleData.messages.push({
        sender,
        receiver,
        message,
        timestamp: luxon.DateTime.local().toISO()
    });
    
    // 最多保存20条消息
    if (coupleData.messages.length > 20) {
        coupleData.messages.shift();
    }
    
    localStorage.setItem('coupleData', JSON.stringify(coupleData));
    
    // 显示发送成功提示
    showToast('鼓励消息已发送！');
}

// 随机鼓励消息
function getRandomEncouragement() {
    const messages = [
        '亲爱的，你今天喝水了吗？记得多喝水哦～',
        '我今天已经喝了两杯水了，你呢？一起努力吧！',
        '你是最棒的，继续保持健康饮水习惯！',
        '我们一起变得更健康吧！爱你哦❤️',
        '今天的水喝了吗？不要忘记了哦！',
        '我们比赛一下谁喝水多！赢家有奖哦～',
        '健康生活从喝水开始，爱你的我在给你加油！'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// 显示最新的鼓励消息
function showLatestEncouragement() {
    const receiver = currentUser;
    const messages = coupleData.messages.filter(m => m.receiver === receiver);
    
    if (messages.length > 0) {
        const latest = messages[messages.length - 1];
        const senderName = latest.sender === 'user1' ? settings.user1.name : settings.user2.name;
        
        coupleMessageEl.querySelector('.message-bubble').innerHTML = 
            `<strong>${senderName}:</strong> ${latest.message}`;
    }
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ----------------- 用户切换 -----------------
// 切换用户
function switchUser(user) {
    console.log('Switching to user:', user);
    currentUser = user;
    
    // 更新按钮状态
    if (user1BtnEl && user2BtnEl) {
        if (user === 'user1') {
            user1BtnEl.classList.add('active');
            user2BtnEl.classList.remove('active');
        } else {
            user1BtnEl.classList.remove('active');
            user2BtnEl.classList.add('active');
        }
    }
    
    // 更新UI
    updateUI();
    updateStats();
    renderHourChart();
    renderWeeklyChart();
    showLatestEncouragement();
    
    // 强制更新水瓶高度
    setTimeout(updateWaterBottles, 100);
}

// ----------------- 设置相关 -----------------
// 切换设置选项卡
function switchSettingsTab(tab) {
    settingsTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.settings-tab[data-tab="${tab}"]`).classList.add('active');
    
    // 显示对应的设置面板
    personalSettingsEl.style.display = tab === 'personal-settings' ? 'block' : 'none';
    coupleSettingsEl.style.display = tab === 'couple-settings' ? 'block' : 'none';
}

// 保存设置
function saveSettings() {
    // 保存用户名
    if (user1NameInputEl.value.trim()) {
        settings.user1.name = user1NameInputEl.value.trim();
    }
    if (user2NameInputEl.value.trim()) {
        settings.user2.name = user2NameInputEl.value.trim();
    }
    
    // 保存当前用户的设置
    settings.user1.dailyGoal = parseInt(dailyGoalInput.value) || DEFAULT_DAILY_GOAL;
    settings.user1.reminder = reminderToggle.checked;
    settings.user1.reminderInterval = parseInt(reminderIntervalInput.value) || DEFAULT_REMINDER_INTERVAL;
    
    // 保存主题
    settings.theme = themeSelect.value;
    document.body.className = `theme-${settings.theme}`;
    
    // 保存设置
    localStorage.setItem('waterSettings', JSON.stringify(settings));
    
    // 显示保存成功提示
    settingsSavedMsgEl.style.display = 'block';
    setTimeout(() => {
        settingsSavedMsgEl.style.display = 'none';
    }, 2000);
    
    // 更新UI
    updateUI();
    setupReminder();
}

// ----------------- 初始化 -----------------
function init() {
    // 先检查并初始化DOM元素
    initDomElements();
    
    // 初始化UI
    updateUI();
    updateStats();
    renderWeeklyChart();
    renderHourChart();
    renderAchievements();
    checkAchievements();
    setupReminder();
    updateCoupleCompetition();
    showLatestEncouragement();
    
    // 初始化设置面板
    if (user1NameInputEl) user1NameInputEl.value = settings.user1.name;
    if (user2NameInputEl) user2NameInputEl.value = settings.user2.name;
    if (dailyGoalInput) dailyGoalInput.value = settings.user1.dailyGoal;
    if (reminderToggle) reminderToggle.checked = settings.user1.reminder;
    if (reminderIntervalInput) reminderIntervalInput.value = settings.user1.reminderInterval;
    if (themeSelect) themeSelect.value = settings.theme;
    if (syncCodeEl) syncCodeEl.value = settings.userId;
    
    // 绑定事件
    bindEvents();
}

// 初始化DOM元素
function initDomElements() {
    // 水瓶和用户切换
    user1BtnEl = document.getElementById('user1-btn');
    user2BtnEl = document.getElementById('user2-btn');
    waterLevelUser1El = document.getElementById('water-level-user1');
    waterLevelUser2El = document.getElementById('water-level-user2');
    user1NameEl = document.getElementById('user1-name');
    user2NameEl = document.getElementById('user2-name');
    currentUserTitleEl = document.getElementById('current-user-title');
    
    // 饮水数据和进度
    currentAmountEl = document.getElementById('current-amount');
    targetAmountEl = document.getElementById('target-amount');
    percentageEl = document.getElementById('percentage');
    currentHourAmountEl = document.getElementById('current-hour-amount');
    
    console.log('DOM elements initialized:', {
        user1BtnEl, user2BtnEl, waterLevelUser1El, waterLevelUser2El,
        currentAmountEl, targetAmountEl, percentageEl
    });
}

// 绑定所有事件
function bindEvents() {
    // 绑定用户切换事件
    if (user1BtnEl) {
        user1BtnEl.addEventListener('click', function() {
            console.log('User 1 button clicked');
            switchUser('user1');
        });
    }
    
    if (user2BtnEl) {
        user2BtnEl.addEventListener('click', function() {
            console.log('User 2 button clicked');
            switchUser('user2');
        });
    }
    
    // 绑定设置选项卡切换
    if (settingsTabs) {
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => switchSettingsTab(tab.getAttribute('data-tab')));
        });
    }
    
    // 绑定数据图表切换
    if (tabChartsBtn && tabCoupleBtn && chartsTabEl && coupleTabEl) {
        tabChartsBtn.addEventListener('click', () => {
            tabChartsBtn.classList.add('active');
            tabCoupleBtn.classList.remove('active');
            chartsTabEl.classList.add('active');
            coupleTabEl.classList.remove('active');
        });
        
        tabCoupleBtn.addEventListener('click', () => {
            tabChartsBtn.classList.remove('active');
            tabCoupleBtn.classList.add('active');
            chartsTabEl.classList.remove('active');
            coupleTabEl.classList.add('active');
        });
    }
    
    // 绑定发送鼓励按钮
    if (sendEncouragementBtn) {
        sendEncouragementBtn.addEventListener('click', sendEncouragement);
    }
    
    // 绑定复制同步码按钮
    if (copySyncCodeBtn && syncCodeEl) {
        copySyncCodeBtn.addEventListener('click', () => {
            syncCodeEl.select();
            document.execCommand('copy');
            showToast('同步码已复制到剪贴板！');
        });
    }
    
    // 绑定关联伴侣按钮
    if (connectPartnerBtn && partnerSyncCodeEl) {
        connectPartnerBtn.addEventListener('click', () => {
            const code = partnerSyncCodeEl.value.trim();
            if (code) {
                settings.partnerId = code;
                localStorage.setItem('waterSettings', JSON.stringify(settings));
                showToast('关联成功！现在可以互相鼓励了！');
            }
        });
    }
    
    // 绑定保存设置按钮
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // 绑定水滴按钮
    if (waterOptionBtns) {
        waterOptionBtns.forEach(btn => {
            btn.onclick = () => {
                const amount = parseInt(btn.getAttribute('data-amount'));
                addWater(amount);
            };
        });
    }
    
    if (addCustomBtn && customAmountInput) {
        addCustomBtn.onclick = () => {
            const amount = parseInt(customAmountInput.value);
            if (amount && amount > 0) {
                addWater(amount);
                customAmountInput.value = '';
            }
        };
    }
}

window.onload = init;
