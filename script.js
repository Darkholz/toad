const scene = document.getElementById('scene');
const skyImage = document.getElementById('skyImage');
const rainLayer = document.getElementById('rainLayer');

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=38.0151&longitude=-7.8632&current=weather_code,is_day&timezone=Europe%2FLisbon';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

let currentSkySrc = '';

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function buildRain(count) {
  rainLayer.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const drop = document.createElement('span');
    drop.className = 'drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${random(0.8, 1.5)}s`;
    drop.style.animationDelay = `${-Math.random() * 2}s`;
    drop.style.opacity = `${random(0.35, 0.95)}`;
    rainLayer.appendChild(drop);
  }
}

buildRain(90);

function getCloudGroupFromWeatherCode(code) {
  if (code === 0) return 'cavok';
  if (code === 1) return 'few';
  if (code === 2) return 'sct';
  if (code === 3) return 'ovc';

  if ([45, 48].includes(code)) return 'ovc';

  if ([51, 53, 55, 56, 57].includes(code)) return 'bkn';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'bkn';

  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'bkn';

  if ([95, 96, 99].includes(code)) return 'ovc';

  return 'few';
}

function shouldShowFog(code) {
  return [45, 48].includes(code);
}

function shouldShowRain(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

function getSkyImageName(isDay, cloudGroup) {
  const prefix = isDay ? 'day' : 'night';
  return `${prefix}_${cloudGroup}.png?v=11`;
}

function applyVisualState(weatherCode, isDay) {
  const cloudGroup = getCloudGroupFromWeatherCode(weatherCode);
  const imageName = getSkyImageName(isDay, cloudGroup);

  if (currentSkySrc !== imageName) {
    currentSkySrc = imageName;
    skyImage.src = imageName;
  }

  scene.classList.remove('show-fog', 'show-rain');

  if (shouldShowFog(weatherCode)) {
    scene.classList.add('show-fog');
  }

  if (shouldShowRain(weatherCode)) {
    scene.classList.add('show-rain');
  }
}

async function applyLiveWeather() {
  try {
    const res = await fetch(WEATHER_URL, { cache: 'no-store' });
    const data = await res.json();

    const current = data && data.current ? data.current : null;
    if (!current) return;

    const weatherCode = Number(current.weather_code);
    const isDay = Number(current.is_day) === 1;

    applyVisualState(weatherCode, isDay);
  } catch (error) {
    if (!currentSkySrc) {
      currentSkySrc = 'day_few.png?v=11';
      skyImage.src = currentSkySrc;
    }

    scene.classList.remove('show-fog', 'show-rain');
  }
}

applyLiveWeather();
setInterval(applyLiveWeather, REFRESH_INTERVAL);
