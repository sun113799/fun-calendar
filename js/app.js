// ===== 趣味日历 v2 · 主应用逻辑 =====
// 新增：PWA、通知、手势、安装引导、设置面板、时间选择器

var appState = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  selectedColor: '#FF9AA2',
  viewMode: 'month', // 'month' | 'week'
};

var EVENT_COLORS = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C4B5FD'];
var MOOD_EMOJIS = ['😊','😂','🥰','😎','🤔','😴','🎉','💪','🌈','💔','😢','😡'];
var modalOpenDate = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  renderAll();
  bindEvents();
  initSwipeGesture();
  initPWA();
  initNotifications();
});

function bindEvents() {
  document.querySelector('.prev-btn').addEventListener('click', goToPrevMonth);
  document.querySelector('.next-btn').addEventListener('click', goToNextMonth);
  document.getElementById('todayBtn').addEventListener('click', goToToday);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });
  document.getElementById('btnSaveEvent').addEventListener('click', saveNewEvent);
  document.getElementById('eventInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveNewEvent();
  });

  // 设置面板
  var settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      var panel = document.getElementById('settingsPanel');
      panel.classList.toggle('active');
    });
  }
}

// ===== 主题 =====
function initTheme() {
  var saved = localStorage.getItem('fun_calendar_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
  document.getElementById('themeToggle').addEventListener('click', function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      document.getElementById('themeToggle').textContent = '🌙';
      localStorage.setItem('fun_calendar_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('themeToggle').textContent = '☀️';
      localStorage.setItem('fun_calendar_theme', 'dark');
    }
  });
}

// ===== PWA 安装 =====
var deferredPrompt = null;

function initPWA() {
  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) { console.log('SW registered:', reg.scope); })
      .catch(function(err) { console.log('SW failed:', err); });
  }
}

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(showInstallBanner, 2000);
});

function showInstallBanner() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (document.querySelector('.install-banner')) return;

  var banner = document.createElement('div');
  banner.className = 'install-banner glass-card';
  banner.innerHTML = '<span>📲 把日历装到手机上~</span>' +
    '<button class="btn-install" id="btnInstall">安装</button>' +
    '<button class="btn-dismiss" id="btnDismiss">以后再说</button>';
  document.body.appendChild(banner);

  document.getElementById('btnInstall').onclick = async function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      var result = await deferredPrompt.userChoice;
      console.log('Install:', result.outcome);
      deferredPrompt = null;
    }
    banner.remove();
  };
  document.getElementById('btnDismiss').onclick = function() { banner.remove(); };
  setTimeout(function() { if (banner.parentNode) banner.remove(); }, 8000);
}

// ===== 通知初始化 =====
function initNotifications() {
  if (typeof requestNotificationPermission === 'function') {
    requestNotificationPermission().then(function(granted) {
      if (granted && typeof startNotificationChecker === 'function') {
        startNotificationChecker();
      }
    });
  }
  window.addEventListener('beforeunload', function() {
    if (typeof stopNotificationChecker === 'function') stopNotificationChecker();
  });
}

// ===== 渲染全部 =====
function renderAll() {
  renderCalendar(appState.currentYear, appState.currentMonth);
  renderQuote();
  renderCountdown();
}

// ===== 日历渲染 =====
function renderCalendar(year, month) {
  var grid = document.getElementById('daysGrid');
  var titleEl = document.getElementById('monthYearText');
  var today = new Date();
  var todayStr = getDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  titleEl.textContent = year + '年 ' + month + '月';

  var firstDay = new Date(year, month - 1, 1);
  var startDow = firstDay.getDay();
  var dim = daysInGregorianMonth(year, month);
  var dimPrev = daysInGregorianMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

  var html = '';
  var maxRows = (appState.viewMode === 'week') ? 1 : 6;

  for (var row = 0; row < maxRows; row++) {
    for (var col = 0; col < 7; col++) {
      var ci = row * 7 + col;
      var cellDate, cellMonth, cellYear, isOther = false;

      if (appState.viewMode === 'week') {
        // 周视图：以今天所在周为基准
        var todayDow = today.getDay();
        var weekStart = new Date(today);
        weekStart.setDate(today.getDate() - todayDow);
        var d = new Date(weekStart);
        d.setDate(weekStart.getDate() + col);
        cellYear = d.getFullYear();
        cellMonth = d.getMonth() + 1;
        cellDate = d.getDate();
        isOther = (cellMonth !== month);
      } else if (ci < startDow) {
        var pm = month === 1 ? 12 : month - 1;
        var py = month === 1 ? year - 1 : year;
        cellDate = dimPrev - startDow + ci + 1;
        cellMonth = pm; cellYear = py; isOther = true;
      } else if (ci >= startDow + dim) {
        var nm = month === 12 ? 1 : month + 1;
        var ny = month === 12 ? year + 1 : year;
        cellDate = ci - startDow - dim + 1;
        cellMonth = nm; cellYear = ny; isOther = true;
      } else {
        cellDate = ci - startDow + 1;
        cellMonth = month; cellYear = year;
      }

      var dateStr = getDateStr(cellYear, cellMonth, cellDate);
      var isToday = dateStr === todayStr;
      var isWeekend = col === 0 || col === 6;

      var lunarDisplay = '';
      var holidayBadge = '';
      var moodEmoji = '';
      var hasEvents = false;

      if (!isOther) {
        var st = getSolarTerm(cellYear, cellMonth, cellDate);
        var h = getHoliday(cellYear, cellMonth, cellDate);
        lunarDisplay = st ? st.name : getLunarDateDisplay(cellYear, cellMonth, cellDate);
        if (h) holidayBadge = '<span class="holiday-badge">' + h.emoji + ' ' + h.name + '</span>';
        var mood = getMood(dateStr);
        if (mood) moodEmoji = '<span class="mood-emoji">' + mood + '</span>';
        hasEvents = getEvents(dateStr).length > 0;
      }

      var cls = 'day-cell';
      if (isOther) cls += ' other-month';
      if (isToday && !isOther) cls += ' today';
      if (isWeekend && !isOther) cls += ' weekend';
      if (holidayBadge && !isOther) cls += ' holiday';

      html += '<div class="' + cls + '" data-date="' + dateStr + '" onclick="openModal(\'' + dateStr + '\')">' +
        '<span class="solar-date">' + cellDate + '</span>' +
        '<span class="lunar-date">' + lunarDisplay + '</span>' +
        holidayBadge + moodEmoji +
        (hasEvents ? '<span class="event-dot"></span>' : '') +
        '</div>';
    }
  }
  grid.innerHTML = html;
  grid.className = (appState.viewMode === 'week') ? 'days-grid view-mode-week' : 'days-grid';
}

// ===== 月份导航 =====
function goToPrevMonth() {
  animateSlide('right', function() {
    if (appState.currentMonth === 1) { appState.currentMonth = 12; appState.currentYear--; }
    else appState.currentMonth--;
    renderAll();
  });
}
function goToNextMonth() {
  animateSlide('left', function() {
    if (appState.currentMonth === 12) { appState.currentMonth = 1; appState.currentYear++; }
    else appState.currentMonth++;
    renderAll();
  });
}
function goToToday() {
  var t = new Date();
  appState.currentYear = t.getFullYear();
  appState.currentMonth = t.getMonth() + 1;
  renderAll();
}
function animateSlide(dir, cb) {
  var grid = document.getElementById('daysGrid');
  grid.classList.add('slide-' + dir);
  setTimeout(function() { cb(); grid.classList.remove('slide-' + dir); }, 150);
}

// ===== 触摸手势 =====
var touchStartX = 0, touchStartY = 0;
function initSwipeGesture() {
  var grid = document.getElementById('daysGrid');
  grid.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  grid.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goToPrevMonth(); else goToNextMonth();
      lightHaptic();
    }
  });
}
function lightHaptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

// ===== 弹窗 =====
function openModal(dateStr) {
  modalOpenDate = dateStr;
  var parts = dateStr.split('-');
  var y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
  var wdNames = ['日','一','二','三','四','五','六'];
  var dobj = new Date(y, m - 1, d);
  document.getElementById('modalDateDisplay').textContent =
    y + '年' + m + '月' + d + '日 星期' + wdNames[dobj.getDay()];

  var lunar = solarToLunar(y, m, d);
  var lunarStr = '农历 ' + getYearName(lunar.lunarYear) + ' ';
  if (lunar.isLeapMonth) lunarStr += '闰';
  lunarStr += LUNAR_MONTH_NAMES[lunar.lunarMonth] + getLunarDayName(lunar.lunarDay);
  document.getElementById('modalLunarInfo').textContent = lunarStr;

  var h = getHoliday(y, m, d);
  var st = getSolarTerm(y, m, d);
  var special = '';
  if (h) special = h.emoji + ' ' + h.name;
  if (st) special += (special ? ' · ' : '') + '🌿 ' + st.name;
  document.getElementById('modalHolidayInfo').textContent = special;

  renderMoodPicker(dateStr);
  renderEventList(dateStr);
  renderColorPicker();
  document.getElementById('eventInput').value = '';
  document.getElementById('eventTimeInput').value = '';
  document.getElementById('remindCheckbox').checked = false;

  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  renderCalendar(appState.currentYear, appState.currentMonth);
}

// ===== 心情 =====
function renderMoodPicker(dateStr) {
  var container = document.getElementById('moodPicker');
  var current = getMood(dateStr);
  var html = '';
  MOOD_EMOJIS.forEach(function(emoji) {
    var sel = emoji === current ? ' selected' : '';
    html += '<button class="mood-btn' + sel + '" onclick="selectMood(\'' + dateStr + '\',\'' + emoji + '\')">' + emoji + '</button>';
  });
  container.innerHTML = html;
}
function selectMood(dateStr, emoji) {
  setMood(dateStr, getMood(dateStr) === emoji ? '' : emoji);
  renderMoodPicker(dateStr);
  lightHaptic();
}

// ===== 事件列表 =====
function renderEventList(dateStr) {
  var container = document.getElementById('eventList');
  var events = getEvents(dateStr);
  if (events.length === 0) {
    container.innerHTML = '<li class="event-item" style="color:var(--text-muted);justify-content:center;">暂无备忘~ ✨</li>';
    return;
  }
  var html = '';
  events.forEach(function(evt) {
    var timeBadge = evt.time ? '<span class="event-time-badge">' + (evt.remind ? '⏰ ' : '') + evt.time + '</span>' : '';
    html += '<li class="event-item">' +
      '<span class="event-color-dot" style="background:' + evt.color + ';"></span>' +
      '<span class="event-text">' + escapeHtml(evt.text) + '</span>' +
      timeBadge +
      '<button class="event-delete" onclick="deleteEventAndRefresh(\'' + dateStr + '\',\'' + evt.id + '\')">✕</button>' +
      '</li>';
  });
  container.innerHTML = html;
}
function renderColorPicker() {
  var c = document.getElementById('eventColorRow');
  var html = '';
  EVENT_COLORS.forEach(function(color) {
    var sel = color === appState.selectedColor ? ' selected' : '';
    html += '<button class="color-dot-btn' + sel + '" style="background:' + color + ';" onclick="selectColor(\'' + color + '\')"></button>';
  });
  c.innerHTML = html;
}
function selectColor(color) { appState.selectedColor = color; renderColorPicker(); }

function saveNewEvent() {
  var input = document.getElementById('eventInput');
  var text = input.value.trim();
  if (!text || !modalOpenDate) return;
  var timeInput = document.getElementById('eventTimeInput');
  var remindCheck = document.getElementById('remindCheckbox');
  var time = timeInput ? timeInput.value : '';
  var remind = remindCheck ? remindCheck.checked : false;

  addEvent(modalOpenDate, text, appState.selectedColor, time, remind);
  input.value = '';
  if (timeInput) timeInput.value = '';
  if (remindCheck) remindCheck.checked = false;
  renderEventList(modalOpenDate);
  renderCalendar(appState.currentYear, appState.currentMonth);
  lightHaptic();
}
function deleteEventAndRefresh(dateStr, eventId) {
  deleteEvent(dateStr, eventId);
  renderEventList(dateStr);
  renderCalendar(appState.currentYear, appState.currentMonth);
}

// ===== 每日一言 =====
function renderQuote() {
  var q = getDailyQuote();
  document.getElementById('quoteText').textContent = '“' + q.text + '”';
  document.getElementById('quoteAuthor').textContent = '—— ' + q.author;
}

// ===== 倒计时 =====
function renderCountdown() {
  var next = getNextHoliday();
  document.getElementById('countdownText').textContent =
    '距离 ' + next.emoji + ' ' + next.name + ' 还有 ' + next.daysUntil + ' 天';
}

// ===== 工具 =====
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
