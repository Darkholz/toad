const scene = document.getElementById('scene');
const rainLayer = document.getElementById('rainLayer');

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

function weatherClassFromCode(code) {
  if (code === 0) return 'weather-clear';
  if ([1, 2].includes(code)) return 'weather-partly';
  if (code === 3) return 'weather-overcast';
  if ([45, 48].includes(code)) return 'weather-fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'weather-rain';
  return 'weather-partly';
}

async function applyLiveWeather() {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=38.0151&longitude=-7.8632&current=weather_code,is_day&timezone=Europe%2FLisbon';

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    const current = data && data.current ? data.current : null;
    if (!current) return;

    const weatherClass = weatherClassFromCode(Number(current.weather_code));
    const isDay = Number(current.is_day) === 1;

    scene.classList.remove(
      'weather-clear',
      'weather-partly',
      'weather-overcast',
      'weather-fog',
      'weather-rain',
      'day',
      'night'
    );

    scene.classList.add(weatherClass);
    scene.classList.add(isDay ? 'day' : 'night');
  } catch (error) {
    scene.classList.remove(
      'weather-clear',
      'weather-partly',
      'weather-overcast',
      'weather-fog',
      'weather-rain',
      'day',
      'night'
    );

    scene.classList.add('weather-partly', 'day');
  }
}

applyLiveWeather();
