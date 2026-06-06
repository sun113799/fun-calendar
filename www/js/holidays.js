// ===== 公历节日 =====
const SOLAR_HOLIDAYS = [
  { month: 1, day: 1, name: '元旦', emoji: '🎉' },
  { month: 2, day: 14, name: '情人节', emoji: '💕' },
  { month: 3, day: 8, name: '妇女节', emoji: '🌸' },
  { month: 3, day: 12, name: '植树节', emoji: '🌳' },
  { month: 4, day: 1, name: '愚人节', emoji: '😜' },
  { month: 5, day: 1, name: '劳动节', emoji: '💪' },
  { month: 5, day: 4, name: '青年节', emoji: '🔥' },
  { month: 6, day: 1, name: '儿童节', emoji: '🧒' },
  { month: 7, day: 1, name: '建党节', emoji: '🚩' },
  { month: 8, day: 1, name: '建军节', emoji: '⭐' },
  { month: 9, day: 10, name: '教师节', emoji: '📚' },
  { month: 10, day: 1, name: '国庆节', emoji: '🇨🇳' },
  { month: 10, day: 31, name: '万圣节', emoji: '🎃' },
  { month: 11, day: 11, name: '光棍节', emoji: '🛒' },
  { month: 12, day: 25, name: '圣诞节', emoji: '🎄' },
  { month: 12, day: 31, name: '跨年夜', emoji: '🌙' },
];

// ===== 农历节日 =====
const LUNAR_HOLIDAYS = [
  { month: 1, day: 1, name: '春节', emoji: '🧧' },
  { month: 1, day: 15, name: '元宵节', emoji: '🏮' },
  { month: 5, day: 5, name: '端午节', emoji: '🎋' },
  { month: 7, day: 7, name: '七夕', emoji: '💫' },
  { month: 7, day: 15, name: '中元节', emoji: '🕯️' },
  { month: 8, day: 15, name: '中秋节', emoji: '🥮' },
  { month: 9, day: 9, name: '重阳节', emoji: '🌺' },
  { month: 12, day: 29, name: '除夕', emoji: '🧨' },
  { month: 12, day: 30, name: '除夕', emoji: '🧨' },
];

/**
 * 查询某一天是否是节日（公历 + 农历）
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {{ name: string, type: 'solar'|'lunar', emoji: string } | null}
 */
function getHoliday(year, month, day) {
  // 先查公历节日
  for (const h of SOLAR_HOLIDAYS) {
    if (h.month === month && h.day === day) {
      return { name: h.name, type: 'solar', emoji: h.emoji };
    }
  }

  // 再查农历节日
  const lunar = solarToLunar(year, month, day);
  for (const h of LUNAR_HOLIDAYS) {
    if (h.month === lunar.lunarMonth && h.day === lunar.lunarDay) {
      return { name: h.name, type: 'lunar', emoji: h.emoji };
    }
  }

  return null;
}

/**
 * 获取下一个节日（从明天开始往后找 365 天）
 * @returns {{ name: string, emoji: string, daysUntil: number, targetDate: string }}
 */
function getNextHoliday() {
  const today = new Date();
  const searchDate = new Date(today);
  searchDate.setDate(searchDate.getDate() + 1); // 从明天开始找

  for (let i = 0; i < 365; i++) {
    const sy = searchDate.getFullYear();
    const sm = searchDate.getMonth() + 1;
    const sd = searchDate.getDate();
    const holiday = getHoliday(sy, sm, sd);
    if (holiday) {
      const targetStr = `${sy}-${String(sm).padStart(2, '0')}-${String(sd).padStart(2, '0')}`;
      return {
        name: holiday.name,
        emoji: holiday.emoji,
        daysUntil: i + 1,
        targetDate: targetStr,
      };
    }
    searchDate.setDate(searchDate.getDate() + 1);
  }

  // 兜底：返回下一个元旦
  const year = today.getFullYear();
  const nextNewYear = new Date(year + 1, 0, 1);
  const daysUntilNewYear = Math.ceil((nextNewYear - today) / (24 * 60 * 60 * 1000));
  return { name: '元旦', emoji: '🎉', daysUntil: daysUntilNewYear, targetDate: `${year + 1}-01-01` };
}

// ===== 法定休息日（联网自动更新 + localStorage缓存） =====
var _restDaysCache = null; // { restDays: Set, workDays: Set, until: timestamp }
var REST_API_URL = 'https://raw.githubusercontent.com/sun113799/fun-calendar/master/holidays.json';

function _ensureRestCache() {
  // 先读缓存
  if (!_restDaysCache) {
    try {
      var raw = localStorage.getItem('fun_calendar_holidays');
      if (raw) _restDaysCache = JSON.parse(raw);
    } catch(e) {}
  }
  // 缓存过期或不存在 → 异步拉取
  if (!_restDaysCache || Date.now() > (_restDaysCache.until || 0)) {
    _fetchRestDays();
  }
  return _restDaysCache;
}

function _fetchRestDays() {
  try {
    fetch(REST_API_URL + '?t=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var restSet = {};
        var workSet = {};
        var maxDate = '';
        for (var year in data.restDays) {
          for (var holiday in data.restDays[year]) {
            data.restDays[year][holiday].forEach(function(d) {
              restSet[d] = true; if (d > maxDate) maxDate = d;
            });
          }
        }
        for (var year in data.workDays) {
          data.workDays[year].forEach(function(d) { workSet[d] = true; });
        }
        // 缓存7天或到最后一个节假日之后
        var until = Date.now() + 7 * 86400000;
        _restDaysCache = { restDays: restSet, workDays: workSet, until: until };
        try { localStorage.setItem('fun_calendar_holidays', JSON.stringify(_restDaysCache)); } catch(e) {}
      }).catch(function() {
        // 网络失败，用内置兜底延长缓存
        if (_restDaysCache) { _restDaysCache.until = Date.now() + 86400000; }
      });
  } catch(e) {}
}

// 启动时拉取
_ensureRestCache();

/** 获取法定休息日状态 */
function getRestDay(year, month, day) {
  var key = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  var cache = _restDaysCache;
  if (!cache) {
    // 首次加载还没拉到，用内置兜底
    return _getRestDayFallback(key);
  }
  if (cache.restDays[key]) return '休';
  if (cache.workDays[key]) return '班';
  return null;
}

/** 内置兜底（2025-2026） */
function _getRestDayFallback(key) {
  var fallback = {
    '2025-01-01':1,'2025-01-28':1,'2025-01-29':1,'2025-01-30':1,'2025-01-31':1,
    '2025-02-01':1,'2025-02-02':1,'2025-02-03':1,'2025-02-04':1,'2025-04-04':1,
    '2025-04-05':1,'2025-04-06':1,'2025-05-01':1,'2025-05-02':1,'2025-05-03':1,
    '2025-05-04':1,'2025-05-05':1,'2025-05-31':1,'2025-06-01':1,'2025-06-02':1,
    '2025-10-01':1,'2025-10-02':1,'2025-10-03':1,'2025-10-04':1,'2025-10-05':1,
    '2025-10-06':1,'2025-10-07':1,'2025-10-08':1,
    '2026-01-01':1,'2026-01-02':1,'2026-01-03':1,'2026-02-17':1,'2026-02-18':1,
    '2026-02-19':1,'2026-02-20':1,'2026-02-21':1,'2026-02-22':1,'2026-02-23':1,
    '2026-04-05':1,'2026-04-06':1,'2026-04-07':1,'2026-05-01':1,'2026-05-02':1,
    '2026-05-03':1,'2026-05-04':1,'2026-05-05':1,'2026-06-19':1,'2026-06-20':1,
    '2026-06-21':1,'2026-09-25':1,'2026-09-26':1,'2026-09-27':1,'2026-10-01':1,
    '2026-10-02':1,'2026-10-03':1,'2026-10-04':1,'2026-10-05':1,'2026-10-06':1,'2026-10-07':1,
  };
  var workFallback = {
    '2025-01-26':1,'2025-02-08':1,'2025-04-27':1,'2025-09-28':1,'2025-10-11':1,
    '2026-02-15':1,'2026-02-28':1,'2026-04-26':1,'2026-09-20':1,'2026-10-10':1,
  };
  if (fallback[key]) return '休';
  if (workFallback[key]) return '班';
  return null;
}
