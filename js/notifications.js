// ===== 原生通知 v3 — 稳定预定 + 启动重排 + allowWhileIdle =====
var _notifyPermitted = false;
var _rescheduledOnce = false;

/** 稳定通知 ID */
function getEventNotificationId(eventId) {
  var hash = 0;
  var text = String(eventId || '');
  for (var i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 2147483647) || 1;
}

/** 初始化：请求权限 */
async function requestNotificationPermission() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      var plugin = Capacitor.Plugins.LocalNotifications;
      if (plugin.checkPermissions) {
        var checked = await plugin.checkPermissions();
        if (checked.display === 'granted') { _notifyPermitted = true; return true; }
      }
      if (plugin.requestPermissions) {
        var result = await plugin.requestPermissions();
        _notifyPermitted = (result.display === 'granted');
        return _notifyPermitted;
      }
      _notifyPermitted = true; return true;
    }
  } catch(e) { console.log('Capacitor通知初始化失败:', e); }

  if ('Notification' in window && Notification.permission === 'granted') { _notifyPermitted = true; return true; }
  if ('Notification' in window && Notification.permission === 'denied') { _notifyPermitted = false; return false; }
  if ('Notification' in window) {
    var r = await Notification.requestPermission();
    _notifyPermitted = (r === 'granted');
    return _notifyPermitted;
  }
  return false;
}

/** 为事件预定系统通知（async，先申请权限再调度） */
async function scheduleEventNotification(event, dateStr) {
  if (!event.remind || !event.time) return;

  if (!_notifyPermitted) {
    var granted = await requestNotificationPermission();
    if (!granted) return;
  }

  try {
    var parts = dateStr.split('-');
    var y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
    var tp = event.time.split(':');
    var h = parseInt(tp[0]), min = parseInt(tp[1]);
    var targetDate = new Date(y, m - 1, d, h, min, 0);
    if (targetDate.getTime() <= Date.now()) return;

    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      var id = getEventNotificationId(event.id);
      // 先取消同id旧通知避免重复
      await Capacitor.Plugins.LocalNotifications.cancel({ notifications: [{ id: id }] });
      // 预定新通知
      await Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{
          title: event.text,
          body: '主人~ 你设的提醒到时间啦！',
          id: id,
          schedule: { at: targetDate, allowWhileIdle: true },
          extra: { eventId: event.id, dateStr: dateStr }
        }]
      });
      console.log('预定通知成功: ' + event.text + ' @ ' + event.time);
    }
  } catch(e) { console.log('预定通知异常:', e); }
}

/** 取消事件的通知 */
function cancelEventNotification(eventId) {
  try {
    var id = getEventNotificationId(eventId);
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      Capacitor.Plugins.LocalNotifications.cancel({ notifications: [{ id: id }] });
    }
  } catch(e) { console.log('取消通知异常:', e); }
}

/** 启动时重新调度所有未来提醒 */
async function rescheduleAllEventNotifications() {
  if (_rescheduledOnce) return;
  _rescheduledOnce = true;
  if (typeof loadData !== 'function') return;

  var granted = await requestNotificationPermission();
  if (!granted) return;

  var data = loadData();
  var now = Date.now();

  for (var dateStr in data.events) {
    data.events[dateStr].forEach(function(event) {
      if (!event.remind || !event.time) return;
      var parts = dateStr.split('-');
      var tp = event.time.split(':');
      var targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), parseInt(tp[0]), parseInt(tp[1]), 0);
      if (targetDate.getTime() > now) {
        scheduleEventNotification(event, dateStr);
      }
    });
  }
}

// ===== 浏览器降级 =====
var _browserNotifyTimer = null;
var _browserNotified = {};

function startBrowserFallback() {
  if (_browserNotifyTimer) return;
  if (typeof Capacitor !== 'undefined') return;
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

// 启动时：请求权限 → 重排所有提醒
document.addEventListener('DOMContentLoaded', function() {
  requestNotificationPermission().then(function(granted) {
    if (granted && typeof rescheduleAllEventNotifications === 'function') {
      rescheduleAllEventNotifications();
    }
  });
  setTimeout(startBrowserFallback, 2000);
});

// 兼容旧调用
function startNotificationChecker() { requestNotificationPermission(); }
function stopNotificationChecker() {}
