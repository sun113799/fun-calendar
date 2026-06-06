// ===== 原生通知系统（Capacitor LocalNotifications） =====
// 在 APK 中使用 Android 原生通知，浏览器中降级为 Web Notification

var NOTIFY_CHECK_INTERVAL = 30000;
var notifyTimer = null;
var notifiedEvents = {};
var useNative = false;

/** 初始化：检测是否在 Capacitor 环境中 */
function initNotifyPlugin() {
  // 检查 Capacitor 是否可用
  if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications) {
    useNative = true;
    // 请求 Android 13+ 的通知权限
    if (Capacitor.Plugins.LocalNotifications.requestPermissions) {
      Capacitor.Plugins.LocalNotifications.requestPermissions().catch(function() {});
    }
    return true;
  }
  return false;
}

/** 请求通知权限 */
async function requestNotificationPermission() {
  if (initNotifyPlugin()) return true;
  // 浏览器降级
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    var result = await Notification.requestPermission();
    return result === 'granted';
  } catch (e) { return false; }
}

/** 启动定时检查 */
function startNotificationChecker() {
  if (notifyTimer) return;
  checkAndNotify();
  notifyTimer = setInterval(checkAndNotify, NOTIFY_CHECK_INTERVAL);
}

function stopNotificationChecker() {
  if (notifyTimer) { clearInterval(notifyTimer); notifyTimer = null; }
}

/** 检查今天的事件，匹配时间 */
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

  // 清理旧记录
  Object.keys(notifiedEvents).forEach(function(key) {
    if (!key.startsWith(dateStr)) delete notifiedEvents[key];
  });
}

/** 发送通知（原生优先，浏览器降级） */
function sendNotification(event) {
  if (useNative && Capacitor.Plugins.LocalNotifications) {
    Capacitor.Plugins.LocalNotifications.schedule({
      notifications: [{
        title: event.text,
        body: '主人~ 你设的提醒到时间啦！',
        id: parseInt(event.id.replace(/[^0-9]/g, '').slice(-8)) || Date.now() % 100000,
        schedule: { at: new Date() },
        sound: 'beep.wav',
        smallIcon: 'ic_stat_calendar',
      }]
    }).catch(function() {});
  } else if ('Notification' in window && Notification.permission === 'granted') {
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
    } catch (e) {}
  }
}

document.addEventListener('visibilitychange', function() {
  if (!document.hidden) checkAndNotify();
});
