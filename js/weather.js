// ===== 实时天气 v3 — GPS精确定位 + 手动选城市 + 县区级 =====
var _weatherCache = null;
var _weatherCacheTime = 0;
var _weatherCity = '';
var _weatherLat = null;
var _weatherLon = null;

function getWeatherDesc(code) {
  var map = { 0:['☀️','晴天'],1:['🌤️','少云'],2:['⛅','多云'],3:['☁️','阴天'],
    45:['🌫️','雾'],48:['🌫️','霜雾'],51:['🌦️','小雨'],53:['🌧️','中雨'],55:['🌧️','大雨'],
    61:['🌧️','阵雨'],63:['🌧️','中雨'],65:['⛈️','暴雨'],71:['❄️','小雪'],73:['❄️','中雪'],
    75:['❄️','大雪'],77:['🌨️','雪粒'],80:['🌦️','阵雨'],81:['🌧️','中雨'],82:['⛈️','暴风雨'],
    85:['🌨️','小阵雪'],86:['🌨️','大阵雪'],95:['⛈️','雷暴'],96:['⛈️','雷暴+冰雹'],99:['⛈️','强雷暴'],
  }; return map[code] || ['🌈','未知'];
}

async function fetchWeather(lat, lon) {
  var now = Date.now();
  if (_weatherCache && (now - _weatherCacheTime) < 300000) return _weatherCache;
  try {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(4) + '&longitude=' + lon.toFixed(4) +
      '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto';
    var resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();
    _weatherCache = data; _weatherCacheTime = now;
    return data;
  } catch(e) { console.log('天气API失败:', e.message); return null; }
}

/** 用 Nominatim 搜索地点 → 坐标 */
async function geocodeLocation(query) {
  try {
    var url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
      '&format=json&limit=1&accept-language=zh&countrycodes=cn';
    var resp = await fetch(url);
    var results = await resp.json();
    if (results.length > 0) {
      return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), name: results[0].display_name.split(',')[0] };
    }
  } catch(e) { console.log('地理编码失败:', e.message); }
  return null;
}

/** 反向地理编码：坐标 → 地名 */
async function reverseGeocode(lat, lon) {
  try {
    var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon +
      '&format=json&accept-language=zh&zoom=12';
    var resp = await fetch(url);
    var data = await resp.json();
    if (data && data.address) {
      // 返回最细粒度的地名：区 > 县 > 市
      return data.address.district || data.address.county || data.address.city || data.address.town || data.address.state || '';
    }
  } catch(e) {}
  return '';
}

function renderWeatherCard(data, city) {
  if (!data || !data.current) {
    var locName = city || '未获取定位';
    return '<div class="weather-card" id="weatherCard">' +
      '<span style="margin-right:8px">📍</span>' +
      '<span style="flex:1">' + locName + ' — 点击右边按钮手动选城市</span>' +
      '<button class="weather-pick-btn" onclick="showCityPicker()" title="手动选城市">🔍</button>' +
      '</div>';
  }
  var c = data.current;
  var w = getWeatherDesc(c.weather_code);
  return '<div class="weather-card" id="weatherCard">' +
    '<div class="weather-left">' +
      '<span class="weather-icon">' + w[0] + '</span>' +
      '<div class="weather-info">' +
        '<span class="weather-city">' + (city || '') + '</span>' +
        '<span class="weather-temp">' + Math.round(c.temperature_2m) + '°</span>' +
        '<span class="weather-desc">' + w[1] + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="weather-right">' +
      '<button class="weather-pick-btn" onclick="showCityPicker()" title="切换城市">🔍</button>' +
      '<span>💧 ' + (c.relative_humidity_2m || '?') + '%</span>' +
      '<span>💨 ' + (c.wind_speed_10m || '?') + ' km/h</span>' +
    '</div>' +
  '</div>';
}

/** 加载天气：先读 localStorage 里保存的选择 */
async function loadWeather() {
  var card = document.getElementById('weatherCard');
  if (!card) return;

  // 检查是否有手动选择的城市
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('fun_calendar_weather_city')); } catch(e) {}

  if (saved && saved.lat && saved.lon) {
    _weatherCity = saved.name;
    _weatherLat = saved.lat; _weatherLon = saved.lon;
    var data = await fetchWeather(saved.lat, saved.lon);
    card.innerHTML = renderWeatherCard(data, saved.name);
    return;
  }

  // 尝试 GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async function(pos) {
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        _weatherLat = lat; _weatherLon = lon;
        _weatherCity = await reverseGeocode(lat, lon);
        var data = await fetchWeather(lat, lon);
        card.innerHTML = renderWeatherCard(data, _weatherCity);
      },
      function() {
        // GPS失败，显示提示
        card.innerHTML = renderWeatherCard(null, null);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  } else {
    card.innerHTML = renderWeatherCard(null, null);
  }
}

/** 手动搜索城市 */
async function searchCity() {
  var input = document.getElementById('citySearchInput');
  var query = (input ? input.value : '').trim();
  if (!query) return;

  var result = await geocodeLocation(query);
  if (result) {
    // 保存选择
    try { localStorage.setItem('fun_calendar_weather_city', JSON.stringify(result)); } catch(e) {}
    _weatherCity = result.name;
    _weatherLat = result.lat; _weatherLon = result.lon;
    _weatherCache = null; // 清缓存强制刷新
    var data = await fetchWeather(result.lat, result.lon);
    document.getElementById('weatherCard').innerHTML = renderWeatherCard(data, result.name);
    hideCityPicker();
  }
}

/** 清除手动选择，重新GPS */
function resetWeatherToGPS() {
  try { localStorage.removeItem('fun_calendar_weather_city'); } catch(e) {}
  _weatherCache = null; _weatherCity = ''; _weatherLat = null; _weatherLon = null;
  hideCityPicker();
  loadWeather();
}

/** 显示/隐藏城市选择器 */
function showCityPicker() {
  var box = document.getElementById('cityPickerBox');
  if (box) {
    box.style.display = (box.style.display === 'block') ? 'none' : 'block';
    if (box.style.display === 'block') {
      document.getElementById('citySearchInput').focus();
    }
  }
}
function hideCityPicker() {
  var box = document.getElementById('cityPickerBox');
  if (box) box.style.display = 'none';
}

function initWeather() {
  loadWeather();
}
