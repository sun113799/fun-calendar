// ===== 实时天气（Open-Meteo 免费 API，无需 Key） =====
var _weatherCache = null;
var _weatherCacheTime = 0;

async function fetchWeather(lat, lon) {
  var now = Date.now();
  if (_weatherCache && (now - _weatherCacheTime) < 1800000) return _weatherCache; // 30分钟缓存

  try {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto';
    var resp = await fetch(url);
    var data = await resp.json();
    _weatherCache = data;
    _weatherCacheTime = now;
    return data;
  } catch(e) {
    console.log('天气获取失败:', e);
    return null;
  }
}

// WMO 天气代码 → 中文描述 + 图标
function getWeatherDesc(code) {
  var map = {
    0:  ['☀️','晴天'], 1: ['🌤️','少云'], 2: ['⛅','多云'], 3: ['☁️','阴天'],
    45: ['🌫️','雾'], 48: ['🌫️','霜雾'], 51: ['🌦️','小雨'], 53: ['🌧️','中雨'], 55: ['🌧️','大雨'],
    61: ['🌧️','阵雨'], 63: ['🌧️','中雨'], 65: ['⛈️','暴雨'], 71: ['❄️','小雪'], 73: ['❄️','中雪'],
    75: ['❄️','大雪'], 77: ['🌨️','雪粒'], 80: ['🌦️','阵雨'], 81: ['🌧️','中雨'], 82: ['⛈️','暴风雨'],
    85: ['🌨️','小阵雪'], 86: ['🌨️','大阵雪'], 95: ['⛈️','雷暴'], 96: ['⛈️','雷暴+冰雹'], 99: ['⛈️','强雷暴'],
  };
  return map[code] || ['🌈','未知'];
}

function renderWeather(data) {
  if (!data || !data.current) return '<div class="weather-card"><span>📍 无法获取天气</span></div>';
  var c = data.current;
  var w = getWeatherDesc(c.weather_code);
  var city = _weatherCity || '当前位置';
  return '<div class="weather-card">' +
    '<div class="weather-left">' +
      '<span class="weather-icon">' + w[0] + '</span>' +
      '<div class="weather-info">' +
        '<span class="weather-temp">' + Math.round(c.temperature_2m) + '°C</span>' +
        '<span class="weather-desc">' + w[1] + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="weather-right">' +
      '<span>💧 ' + (c.relative_humidity_2m || '?') + '%</span>' +
      '<span>💨 ' + (c.wind_speed_10m || '?') + 'km/h</span>' +
    '</div>' +
  '</div>';
}

var _weatherCity = null;

function initWeather() {
  if (!navigator.geolocation) {
    document.getElementById('weatherCard').innerHTML = renderWeather(null);
    return;
  }
  navigator.geolocation.getCurrentPosition(async function(pos) {
    var data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
    // 反向地理编码获取城市名
    try {
      var geoResp = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' +
        pos.coords.latitude + '&lon=' + pos.coords.longitude + '&format=json&accept-language=zh');
      var geoData = await geoResp.json();
      if (geoData && geoData.address) {
        _weatherCity = geoData.address.city || geoData.address.town || geoData.address.county || '';
      }
    } catch(e) {}
    document.getElementById('weatherCard').innerHTML = renderWeather(data);
  }, function() {
    document.getElementById('weatherCard').innerHTML = renderWeather(null);
  });
}
