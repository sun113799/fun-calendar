// ===== 原生通知 — 保存事件时预定，系统到点自动弹出 =====
var _notifyPermitted = false;

/** 初始化：请求权限 */
async function requestNotificationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      var plugin = Capacitor.Plugins.LocalNotifications;
      // 请求权限
      if (plugin.requestPermissions) {
        var result = await plugin.requestPermissions();
        console.log('通知权限:', JSON.stringify(result));
        _notifyPermitted = (result.display === 'granted');
        return _notifyPermitted;
      }
      _notifyPermitted = true;
      return true;
    }
  } catch(e) {
    console.log('Capacitor通知初始化失败:', e);
  }
  // 浏览器降级
  if ('Notification' in window && Notification.permission === 'granted') return true;
  if ('Notification' in window && Notification.permission === 'denied') return false;
  if ('Notification' in window) {
    var r = await Notification.requestPermission();
    return r === 'granted';
  }
  return false;
}

/** 为事件预定系统通知 */
function scheduleEventNotification(event, dateStr) {
  if (!_notifyPermitted) return;
  if (!event.remind || !event.time) return;

  try {
    // 解析日期+时间
    var parts = dateStr.split('-');
    var y = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    var d = parseInt(parts[2]);
    var timeParts = event.time.split(':');
    var h = parseInt(timeParts[0]);
    var min = parseInt(timeParts[1]);

    var targetDate = new Date(y, m - 1, d, h, min, 0);

    // 已经过了就不预定
    if (targetDate.getTime() <= Date.now()) return;

    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{
          title: event.text,
          body: '主人~ 你设的提醒到时间啦！',
          id: parseInt(event.id.replace(/[^0-9]/g, '').slice(-8)) || Math.floor(Math.random() * 90000000 + 10000000),
          schedule: { at: targetDate },
          extra: { eventId: event.id, dateStr: dateStr }
        }]
      }).then(function() {
        console.log('预定通知成功: ' + event.text + ' @ ' + event.time);
      }).catch(function(err) {
        console.log('预定通知失败:', err);
      });
    }
  } catch(e) {
    console.log('预定通知异常:', e);
  }
}

/** 取消某个事件的通知 */
function cancelEventNotification(eventId) {
  if (!_notifyPermitted) return;
  try {
    var id = parseInt(eventId.replace(/[^0-9]/g, '').slice(-8));
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      Capacitor.Plugins.LocalNotifications.cancel({ notifications: [{ id: id }] });
    }
  } catch(e) {}
}

// 浏览器环境的polling降级（仅在浏览器中使用）
var _browserNotifyTimer = null;
var _browserNotified = {};

function startBrowserFallback() {
  if (_browserNotifyTimer) return;
  if (typeof Capacitor !== 'undefined') return; // APK里不用polling
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  _browserNotifyTimer = setInterval(function() {
    var t = new Date();
    var ds = t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
    var nt = String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0');
    var events = typeof getEvents === 'function' ? getEvents(ds) : [];
    events.forEach(function(ev) {
      if (!ev.remind || !ev.time || ev.time !== nt) return;
      var key = ds + '|' + ev.id;
      if (_browserNotified[key]) return;
      _browserNotified[key] = true;
      try { new Notification(ev.text, { body: '主人~ 提醒时间到！', tag: ev.id, requireInteraction: true }); } catch(e) {}
    });
    Object.keys(_browserNotified).forEach(function(k) { if (!k.startsWith(ds)) delete _browserNotified[k]; });
  }, 30000);
}

document.addEventListener('DOMContentLoaded', function() {
  requestNotificationPermission();
  setTimeout(startBrowserFallback, 2000);
});

// 占位兼容函数
function startNotificationChecker() { requestNotificationPermission(); }
function stopNotificationChecker() {}
