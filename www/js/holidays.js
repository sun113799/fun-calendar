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
