// ===== 农历换算模块 =====
// 算法：以 1900-01-31（庚子年正月初一）为锚点，逐日推算
// 农历数据表 1900-2100，编码：bits 0-3=闰月，bits 4-15=12个月大小（1=30天），bit 16=闰月大小

var LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520  // 2100
];

// 1900-01-31 = 农历庚子年正月初一（锚点）
var BASE_YEAR = 1900;
var BASE_DATE = new Date(1900, 0, 31); // 注意：month 是 0-indexed

// 中文常量
var LUNAR_MONTH_NAMES = ['', '正月','二月','三月','四月','五月','六月',
  '七月','八月','九月','十月','冬月','腊月'];
var STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/** 农历日中文名 */
function getLunarDayName(day) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  var pre = Math.floor((day - 1) / 10);
  var suf = day % 10;
  var prefixes = ['初','十','廿','三'];
  var numbers  = ['','一','二','三','四','五','六','七','八','九','十'];
  return prefixes[pre] + numbers[suf];
}

/** 两个日期相差天数 */
function dayDiff(d1, d2) {
  return Math.floor((d2 - d1) / 86400000);
}

// ===== 数据解码 =====

/** 闰月月份（0=无闰月） */
function leapMonthOf(year) {
  return LUNAR_INFO[year - BASE_YEAR] & 0xF;
}

/** 闰月天数 */
function leapDaysOf(year) {
  if (leapMonthOf(year) === 0) return 0;
  return (LUNAR_INFO[year - BASE_YEAR] & 0x10000) ? 30 : 29;
}

/** 农历年总天数 */
function lunarYearDays(year) {
  var info = LUNAR_INFO[year - BASE_YEAR];
  var total = 0;
  // 12 个正常月：month 1 → bit 15, month 12 → bit 4
  // 即 bit = 16 - month
  for (var m = 1; m <= 12; m++) {
    total += (info & (0x10000 >> m)) ? 30 : 29;
  }
  total += leapDaysOf(year);
  return total;
}

/** 农历月天数（month=1-12 正常月，13=闰月） */
function lunarMonthDays(year, month) {
  var info = LUNAR_INFO[year - BASE_YEAR];
  if (month === 13) return leapDaysOf(year);
  // month 1 → bit 15 (0x8000), month 12 → bit 4 (0x10)
  return (info & (0x10000 >> month)) ? 30 : 29;
}

// ===== 核心换算 =====

/**
 * 公历 → 农历（以 1900-01-31 为锚点逐日推算）
 */
function solarToLunar(year, month, day) {
  var target = new Date(year, month - 1, day);
  var offset = dayDiff(BASE_DATE, target);

  if (offset < 0) return null; // 1900-01-31 之前不支持

  // 1. 找到农历年
  var lunarYear = BASE_YEAR;
  var yearDays;
  while (true) {
    yearDays = lunarYearDays(lunarYear);
    if (offset < yearDays) break;
    offset -= yearDays;
    lunarYear++;
  }

  // 2. 找到农历月
  var leap = leapMonthOf(lunarYear);
  var lunarMonth = 1;
  var isLeap = false;

  for (var m = 1; m <= 12; m++) {
    // 正常月
    var dim = lunarMonthDays(lunarYear, m);
    if (offset < dim) {
      lunarMonth = m;
      isLeap = false;
      break;
    }
    offset -= dim;

    // 闰月
    if (leap === m) {
      dim = leapDaysOf(lunarYear);
      if (dim > 0 && offset < dim) {
        lunarMonth = m;
        isLeap = true;
        break;
      }
      offset -= dim;
    }
  }

  return {
    lunarYear: lunarYear,
    lunarMonth: lunarMonth,
    lunarDay: offset + 1,
    isLeapMonth: isLeap
  };
}

/** 日历格子用：初一显示月份名，否则显示日名 */
function getLunarDateDisplay(year, month, day) {
  var r = solarToLunar(year, month, day);
  if (!r) return '';
  if (r.lunarDay === 1) {
    var name = LUNAR_MONTH_NAMES[r.lunarMonth];
    if (r.isLeapMonth) name = '闰' + name;
    return name;
  }
  return getLunarDayName(r.lunarDay);
}

/** 干支纪年 */
function getYearName(lunarYear) {
  return STEMS[(lunarYear - 4) % 10] + BRANCHES[(lunarYear - 4) % 12] + '年';
}

/** 公历闰年 */
function isGregorianLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 公历月天数 */
function daysInGregorianMonth(y, m) {
  var days = [31,28,31,30,31,30,31,31,30,31,30,31];
  if (m === 2 && isGregorianLeapYear(y)) return 29;
  return days[m - 1];
}
