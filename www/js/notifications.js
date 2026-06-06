// ===== 原生通知（Capacitor LocalNotifications） =====
var NOTIFY_CHECK_INTERVAL = 30000;
var notifyTimer = null;
var notifiedEvents = {};
var _notifyReady = false;

/** 初始化 Capacitor 通知插件 */
function initNotifyPlugin() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      // 请求权限（Android 13+）
      var plugin = Capacitor.Plugins.LocalNotifications;
      if (plugin.requestPermissions) {
        plugin.requestPermissions().then(function(result) {
          console.log('通知权限:', result.display);
          _notifyReady = true;
        }).catch(function() {
          _notifyReady = true; // 老版本不需要权限
        });
      } else {
        _notifyReady = true;
      }
      return true;
    }
  } catch(e) {
    console.log('Capacitor 通知插件未就绪:', e);
  }
  return false;
}

/** 请求通知权限 */
async function requestNotificationPermission() {
  if (initNotifyPlugin()) {
    return true; // Capacitor 原生通知可用
  }
  // 浏览器降级
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    var result = await Notification.requestPermission();
    return result === 'granted';
  } catch(e) { return false; }
}

function startNotificationChecker() {
  if (notifyTimer) return;
  checkAndNotify();
  notifyTimer = setInterval(checkAndNotify, NOTIFY_CHECK_INTERVAL);
}

function stopNotificationChecker() {
  if (notifyTimer) { clearInterval(notifyTimer); notifyTimer = null; }
}

function checkAndNotify() {
  var today = new Date();
  var dateStr = getDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
  var nowHour = today.getHours();
  var nowMin = today.getMinutes();
  var nowTime = String(nowHour).padStart(2, '0') + ':' + String(nowMin).padStart(2, '0');

  var events = getEvents(dateStr);
  events.forEach(function(event) {
    if (!event.remind || !event.time) return;
    var notifyKey = dateStr + '|' + event.id;
    if (event.time === nowTime && !notifiedEvents[notifyKey]) {
      notifiedEvents[notifyKey] = true;
      sendNotification(event);
    }
  });

  Object.keys(notifiedEvents).forEach(function(key) {
    if (!key.startsWith(dateStr)) delete notifiedEvents[key];
  });
}

function sendNotification(event) {
  // 尝试原生通知
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
      Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{
          title: event.text,
          body: '主人~ 你设的提醒到时间啦！',
          id: Math.abs(hashCode(event.id)) % 2147483647,
          schedule: { at: new Date(Date.now() + 500) },
          sound: null,
        }]
      });
      return;
    }
  } catch(e) {}

  // 浏览器降级
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      var n = new Notification(event.text, {
        body: '主人~ 你设的提醒到时间啦！',
        icon: './assets/icons/icon-192.png',
        tag: event.id,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });
      n.onclick = function() { window.focus(); n.close(); };
      setTimeout(function() { n.close(); }, 5000);
    } catch(e) {}
  }
}

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

document.addEventListener('visibilitychange', function() {
  if (!document.hidden) checkAndNotify();
});
