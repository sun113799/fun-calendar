// ===== LocalStorage 封装 v2 =====
// 事件加 time + remind 字段，支持 JSON 导入导出

var STORAGE_KEY = 'fun_calendar_data';
var STORAGE_VERSION = 2; // v2: 加了 time/remind 字段

// ===== 内部工具 =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getDateStr(year, month, day) {
  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, events: {}, moods: {} };
    var data = JSON.parse(raw);
    if (!data.version || data.version < 1) {
      console.info('日历数据版本过旧，已升级~');
      return { version: STORAGE_VERSION, events: {}, moods: {} };
    }
    // 升级 v1 -> v2
    if (data.version < 2) {
      data.version = 2;
      // 给旧事件补默认字段
      for (var d in data.events) {
        data.events[d].forEach(function(e) {
          if (!e.time) e.time = '';
          if (e.remind === undefined) e.remind = false;
        });
      }
    }
    return data;
  } catch (e) {
    console.warn('日历数据损坏，已自动重置~', e);
    return { version: STORAGE_VERSION, events: {}, moods: {} };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('数据保存失败（可能是存储空间满了）', e);
  }
}

// ===== 事件 CRUD =====

function getEvents(dateStr) {
  var data = loadData();
  return data.events[dateStr] || [];
}

function addEvent(dateStr, text, color, time, remind) {
  var data = loadData();
  if (!data.events[dateStr]) data.events[dateStr] = [];
  var event = {
    id: generateId(),
    text: text,
    color: color || '#FF9AA2',
    time: time || '',
    remind: remind || false,
    createdAt: new Date().toISOString(),
  };
  data.events[dateStr].push(event);
  saveData(data);
  return event;
}

function deleteEvent(dateStr, eventId) {
  var data = loadData();
  if (!data.events[dateStr]) return;
  data.events[dateStr] = data.events[dateStr].filter(function(e) { return e.id !== eventId; });
  if (data.events[dateStr].length === 0) delete data.events[dateStr];
  saveData(data);
}

// ===== 心情 =====

function getMood(dateStr) {
  var data = loadData();
  return data.moods[dateStr] || null;
}

function setMood(dateStr, emoji) {
  var data = loadData();
  if (emoji) {
    data.moods[dateStr] = emoji;
  } else {
    delete data.moods[dateStr];
  }
  saveData(data);
}

// ===== JSON 导入导出 =====

/** 导出所有数据为 JSON */
function exportAllData() {
  var data = loadData();
  return JSON.stringify({
    app: 'fun-calendar',
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    events: data.events,
    moods: data.moods,
  }, null, 2);
}

/** 触发 JSON 文件下载 */
function downloadBackup() {
  var json = exportAllData();
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '趣味日历备份_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  // 关闭设置面板
  var panel = document.getElementById('settingsPanel');
  if (panel) panel.classList.remove('active');
}

/** 从 JSON 字符串导入（合并，去重） */
function importData(jsonStr) {
  try {
    var imported = JSON.parse(jsonStr);
    if (imported.app !== 'fun-calendar' || !imported.events) {
      throw new Error('数据格式不正确，请选择趣味日历的备份文件');
    }
    var current = loadData();
    var count = 0;
    for (var date in imported.events) {
      if (!current.events[date]) {
        current.events[date] = imported.events[date];
        count += imported.events[date].length;
      } else {
        var existingIds = {};
        current.events[date].forEach(function(e) { existingIds[e.id] = true; });
        imported.events[date].forEach(function(evt) {
          if (!existingIds[evt.id]) {
            current.events[date].push(evt);
            count++;
          }
        });
      }
    }
    for (var moodDate in imported.moods || {}) {
      if (!current.moods[moodDate]) {
        current.moods[moodDate] = imported.moods[moodDate];
      }
    }
    saveData(current);
    return { success: true, count: count };
  } catch (e) {
    console.error('导入失败:', e);
    return { success: false, error: e.message };
  }
}

/** 处理文件导入 */
function handleFileImport(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var result = importData(e.target.result);
    if (result.success) {
      alert('导入成功！已合并 ' + result.count + ' 条事件');
      if (typeof renderCalendar === 'function') {
        renderCalendar(
          typeof appState !== 'undefined' ? appState.currentYear : new Date().getFullYear(),
          typeof appState !== 'undefined' ? appState.currentMonth : new Date().getMonth() + 1
        );
      }
      // 重排导入的未来提醒
      if (typeof rescheduleAllEventNotifications === 'function') {
        rescheduleAllEventNotifications();
      }
    } else {
      alert('导入失败：' + result.error);
    }
    var panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.remove('active');
  };
  reader.readAsText(file);
  event.target.value = ''; // 允许重复选同一个文件
}
