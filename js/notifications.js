// ===== 日程提醒系统 =====
// 每30秒检查一次，匹配当前时间与事件设定的时间
// iOS Safari 不支持 Web Notification，降级为页面内提示

var NOTIFY_CHECK_INTERVAL = 30000;
var notifyTimer = null;
var notifiedEvents = {};

/** 请求通知权限 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持通知功能');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    var result = await Notification.requestPermission();
    return result === 'granted';
  } catch (e) {
    console.log('通知权限请求失败:', e);
    return false;
  }
}

/** 启动定时检查 */
function startNotificationChecker() {
  if (notifyTimer) return;
  checkAndNotify();
  notifyTimer = setInterval(checkAndNotify, NOTIFY_CHECK_INTERVAL);
}

/** 停止定时检查 */
function stopNotificationChecker() {
  if (notifyTimer) { clearInterval(notifyTimer); notifyTimer = null; }
}

/** 检查今天的事件，对到时间的发通知 */
function checkAndNotify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

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
      showNotification(event);
    }
  });

  // 清理非今天的通知记录
  var todayKey = dateStr;
  Object.keys(notifiedEvents).forEach(function(key) {
    if (!key.startsWith(todayKey)) delete notifiedEvents[key];
  });
}

/** 弹出系统通知 */
function showNotification(event) {
  var title = event.text;
  var options = {
    body: '主人~ 你设的提醒到时间啦！',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    tag: event.id,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };
  try {
    var n = new Notification(title, options);
    n.onclick = function() { window.focus(); n.close(); };
    setTimeout(function() { n.close(); }, 5000);
  } catch (e) {
    console.log('发送通知失败:', e);
  }
}

/** 页面可见性变化时重新检查 */
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) checkAndNotify();
});
