// ===== 趣味日历 v3 · 纯色可爱风 + 原生通知 =====

var appState = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  selectedColor: '#FF9AA2',
};

var EVENT_COLORS = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C4B5FD'];
var MOOD_EMOJIS = ['😊','😂','🥰','😎','🤔','😴','🎉','💪','🌈','💔','😢','😡'];
var modalOpenDate = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initYearMonthSelects();
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
  var sb = document.getElementById('settingsBtn');
  if (sb) {
    sb.addEventListener('click', function() {
      document.getElementById('settingsPanel').classList.toggle('active');
    });
  }
}

/** 初始化年月下拉选择器 */
function initYearMonthSelects() {
  var ys = document.getElementById('yearSelect');
  var ms = document.getElementById('monthSelect');
  // 年份：1900 ~ 2100
  for (var y = 1900; y <= 2100; y++) {
    var opt = document.createElement('option');
    opt.value = y; opt.textContent = y + '年';
    if (y === appState.currentYear) opt.selected = true;
    ys.appendChild(opt);
  }
  // 月份：1~12
  for (var m = 1; m <= 12; m++) {
    var opt = document.createElement('option');
    opt.value = m; opt.textContent = m + '月';
    if (m === appState.currentMonth) opt.selected = true;
    ms.appendChild(opt);
  }
  ys.addEventListener('change', function() {
    appState.currentYear = parseInt(ys.value);
    renderAll();
  });
  ms.addEventListener('change', function() {
    appState.currentMonth = parseInt(ms.value);
    renderAll();
  });
}

/** 更新下拉选择器的选中值 */
function updateSelects() {
  document.getElementById('yearSelect').value = appState.currentYear;
  document.getElementById('monthSelect').value = appState.currentMonth;
}

// ===== 6 主题（夜色独立暗色） =====
var THEMES = ['sakura', 'ocean', 'starry', 'forest', 'sunset'];
var THEME_LABELS = { sakura:'S', ocean:'O', starry:'T', forest:'F', sunset:'U' };

function initTheme() {
  var saved = localStorage.getItem('fun_calendar_theme') || 'sakura';
  document.documentElement.setAttribute('data-theme', saved);
  updateDarkBtnIcon(saved === 'night');

  // 主题循环（5个亮色主题）
  document.getElementById('themeBtn').addEventListener('click', function() {
    var cur = document.documentElement.getAttribute('data-theme') || 'sakura';
    // 如果在夜色，先切回之前的主题
    if (cur === 'night') {
      cur = localStorage.getItem('fun_calendar_last_light') || 'sakura';
    }
    var idx = THEMES.indexOf(cur);
    var next = THEMES[(idx + 1) % THEMES.length];
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fun_calendar_theme', next);
    localStorage.setItem('fun_calendar_last_light', next);
    updateDarkBtnIcon(false);
    resetEffects();
  });

  // 夜色切换
  document.getElementById('darkBtn').addEventListener('click', function() {
    var cur = document.documentElement.getAttribute('data-theme') || 'sakura';
    if (cur === 'night') {
      // 切回之前的亮色主题
      var prev = localStorage.getItem('fun_calendar_last_light') || 'sakura';
      document.documentElement.setAttribute('data-theme', prev);
      localStorage.setItem('fun_calendar_theme', prev);
      updateDarkBtnIcon(false);
    } else {
      // 切到夜色
      localStorage.setItem('fun_calendar_last_light', cur);
      document.documentElement.setAttribute('data-theme', 'night');
      localStorage.setItem('fun_calendar_theme', 'night');
      updateDarkBtnIcon(true);
    }
    resetEffects();
  });
}

function updateDarkBtnIcon(isNight) {
  document.getElementById('darkBtn').textContent = isNight ? '☀️' : '🌙';
}

function resetEffects() {
  setTimeout(function() {
    if (typeof _effectInstance !== 'undefined' && _effectInstance && _effectInstance.resetAll) {
      _effectInstance.resetAll();
    }
    if (typeof petalEffectInstance !== 'undefined' && petalEffectInstance && petalEffectInstance.resetAll) {
      petalEffectInstance.resetAll();
    }
  }, 200);
}

// ===== PWA =====
var deferredPrompt = null;
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
  }
}
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault(); deferredPrompt = e;
  setTimeout(showInstallBanner, 2000);
});
function showInstallBanner() {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (document.querySelector('.install-banner')) return;
  var b = document.createElement('div');
  b.className = 'install-banner';
  b.innerHTML = '<span>📲 把日历装到手机上~</span>' +
    '<button class="btn-install" id="btnInstall">安装</button>' +
    '<button class="btn-dismiss" id="btnDismiss">以后再说</button>';
  document.body.appendChild(b);
  document.getElementById('btnInstall').onclick = async function() {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
    b.remove();
  };
  document.getElementById('btnDismiss').onclick = function() { b.remove(); };
  setTimeout(function() { if (b.parentNode) b.remove(); }, 8000);
}

// ===== 通知 =====
function initNotifications() {
  if (typeof requestNotificationPermission === 'function') {
    requestNotificationPermission().then(function(granted) {
      if (granted && typeof rescheduleAllEventNotifications === 'function') {
        rescheduleAllEventNotifications();
      }
      if (granted && typeof startNotificationChecker === 'function') startNotificationChecker();
    });
  }
  window.addEventListener('beforeunload', function() {
    if (typeof stopNotificationChecker === 'function') stopNotificationChecker();
  });
}

// ===== 渲染 =====
function renderAll() {
  updateSelects();
  renderCalendar(appState.currentYear, appState.currentMonth);
  renderQuote();
  renderCountdown();
  if (typeof initWeather === 'function') initWeather();
}

function renderCalendar(year, month) {
  var grid = document.getElementById('daysGrid');
  var today = new Date();
  var todayStr = getDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  var firstDay = new Date(year, month - 1, 1);
  var startDow = firstDay.getDay();
  var dim = daysInGregorianMonth(year, month);
  var dimPrev = daysInGregorianMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

  // 用 DocumentFragment 减少重排
  var frag = document.createDocumentFragment();

  for (var row = 0; row < 6; row++) {
    for (var col = 0; col < 7; col++) {
      var ci = row * 7 + col;
      var cellDate, cellMonth, cellYear, isOther = false;

      if (ci < startDow) {
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
        if (h) holidayBadge = '<span class="holiday-badge">' + h.emoji + h.name + '</span>';
        var mood = getMood(dateStr);
        if (mood) moodEmoji = '<span class="mood-emoji">' + mood + '</span>';
        hasEvents = getEvents(dateStr).length > 0;
        // 法定休息日标记
        var restDay = getRestDay(cellYear, cellMonth, cellDate);
      }

      var cls = 'day-cell';
      if (isOther) cls += ' other-month';
      if (isToday && !isOther) cls += ' today';
      if (isWeekend && !isOther) cls += ' weekend';
      if (holidayBadge && !isOther) cls += ' holiday';

      var restBadge = '';
      if (!isOther && restDay) {
        restBadge = '<span class="rest-badge' + (restDay === '班' ? ' workday' : '') + '">' + restDay + '</span>';
      }

      var cell = document.createElement('div');
      cell.className = cls;
      cell.setAttribute('data-date', dateStr);
      cell.setAttribute('onclick', "openModal('" + dateStr + "')");
      cell.innerHTML = '<span class="solar-date">' + cellDate + '</span>' +
        '<span class="lunar-date">' + lunarDisplay + '</span>' +
        holidayBadge + restBadge + moodEmoji +
        (hasEvents ? '<span class="event-dot"></span>' : '');
      frag.appendChild(cell);
    }
  }

  grid.innerHTML = '';
  grid.appendChild(frag);
}

// ===== 导航 =====
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
  setTimeout(function() { cb(); grid.classList.remove('slide-' + dir); }, 120);
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
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goToPrevMonth(); else goToNextMonth();
    }
  });
}

// ===== 弹窗 =====
function openModal(dateStr) {
  modalOpenDate = dateStr;
  var parts = dateStr.split('-');
  var y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
  var wd = ['日','一','二','三','四','五','六'];
  var dobj = new Date(y, m - 1, d);
  document.getElementById('modalDateDisplay').textContent =
    y + '年' + m + '月' + d + '日 星期' + wd[dobj.getDay()];

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
  var ti = document.getElementById('eventTimeInput');
  if (ti) ti.value = '';
  var rc = document.getElementById('remindCheckbox');
  if (rc) rc.checked = false;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  renderCalendar(appState.currentYear, appState.currentMonth);
}

// ===== 心情 =====
function renderMoodPicker(dateStr) {
  var c = document.getElementById('moodPicker');
  var cur = getMood(dateStr);
  c.innerHTML = '';
  MOOD_EMOJIS.forEach(function(emoji) {
    var b = document.createElement('button');
    b.className = 'mood-btn' + (emoji === cur ? ' selected' : '');
    b.textContent = emoji;
    b.onclick = function() { selectMood(dateStr, emoji); };
    c.appendChild(b);
  });
}
function selectMood(dateStr, emoji) {
  setMood(dateStr, getMood(dateStr) === emoji ? '' : emoji);
  renderMoodPicker(dateStr);
}

// ===== 事件列表 =====
function renderEventList(dateStr) {
  var c = document.getElementById('eventList');
  var events = getEvents(dateStr);
  if (!events.length) {
    c.innerHTML = '<li class="event-item" style="color:var(--text-muted);justify-content:center;">暂无备忘~ ✨</li>';
    return;
  }
  c.innerHTML = '';
  events.forEach(function(evt) {
    var li = document.createElement('li');
    li.className = 'event-item';
    var timeHtml = evt.time ? '<span class="event-time-badge">' + (evt.remind ? '⏰' : '') + evt.time + '</span>' : '';
    li.innerHTML = '<span class="event-color-dot" style="background:' + evt.color + ';"></span>' +
      '<span class="event-text">' + escapeHtml(evt.text) + '</span>' + timeHtml +
      '<button class="event-delete">✕</button>';
    li.querySelector('.event-delete').onclick = function() { deleteEventAndRefresh(dateStr, evt.id); };
    c.appendChild(li);
  });
}
function renderColorPicker() {
  var c = document.getElementById('eventColorRow');
  c.innerHTML = '';
  EVENT_COLORS.forEach(function(color) {
    var b = document.createElement('button');
    b.className = 'color-dot-btn' + (color === appState.selectedColor ? ' selected' : '');
    b.style.background = color;
    b.onclick = function() { appState.selectedColor = color; renderColorPicker(); };
    c.appendChild(b);
  });
}

function saveNewEvent() {
  var input = document.getElementById('eventInput');
  if (!input) return;
  var text = input.value.trim();
  if (!text || !modalOpenDate) return;
  var ti = document.getElementById('eventTimeInput');
  var rc = document.getElementById('remindCheckbox');
  var evt = addEvent(modalOpenDate, text, appState.selectedColor, ti && ti.value ? ti.value : '', rc ? rc.checked : false);
  // 预定系统通知
  if (evt && evt.remind && typeof scheduleEventNotification === 'function') {
    scheduleEventNotification(evt, modalOpenDate);
  }
  var overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('active');
  renderCalendar(appState.currentYear, appState.currentMonth);
}
function deleteEventAndRefresh(dateStr, eventId) {
  if (typeof cancelEventNotification === 'function') {
    cancelEventNotification(eventId);
  }
  deleteEvent(dateStr, eventId);
  renderEventList(dateStr);
  renderCalendar(appState.currentYear, appState.currentMonth);
}

// ===== 每日一言 =====
function renderQuote() {
  var q = getDailyQuote();
  document.getElementById('quoteText').textContent = '"' + q.text + '"';
  document.getElementById('quoteAuthor').textContent = '—— ' + q.author;
}

// ===== 倒计时 =====
function renderCountdown() {
  var next = getNextHoliday();
  document.getElementById('countdownText').textContent =
    '距离 ' + next.emoji + ' ' + next.name + ' 还有 ' + next.daysUntil + ' 天';
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
