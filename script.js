const scene = document.getElementById('scene');
const skyImage = document.getElementById('skyImage');
const rainLayer = document.getElementById('rainLayer');
const fly = document.getElementById('fly');
const pondScene = document.getElementById('pondScene');
const yumBubble = document.getElementById('yumBubble');
const tongueFrame = document.getElementById('tongueFrame');

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=38.0151&longitude=-7.8632&current=weather_code,is_day&timezone=Europe%2FLisbon';

const REFRESH_INTERVAL = 5 * 60 * 1000;

let currentSkySrc = '';

let flyState = 'waiting';
let flyX = -100;
let flyY = window.innerHeight * 0.32;
let flyTargetX = 0;
let flyTargetY = 0;
let flyAnglePhase = 0;

let flyWaitingSince = performance.now();
let flyNextStartDelay = 300;
let hoverStartedAt = 0;
let sideSwitchAt = 0;
let preCatchStartedAt = 0;

let assetsReady = false;
let tongueAnimating = false;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomLoopDelay() {
  return random(2.5 * 60 * 1000, 5.5 * 60 * 1000);
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
  return `${prefix}_${cloudGroup}.png?`;
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
      currentSkySrc = 'day_few.png?';
      skyImage.src = currentSkySrc;
    }

    scene.classList.remove('show-fog', 'show-rain');
  }
}


function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hideTongueFrame() {
  if (!tongueFrame) return;
  tongueFrame.style.opacity = '0';
}

function getScreenProfile() {
  const w = window.innerWidth;

  if (w <= 640) return 'mobile';
  if (w <= 1280) return 'desktop-small';
  if (w <= 1600) return 'desktop-medium';
  return 'desktop-large';
}

function getTongueFrameOffsets(src) {
  const profile = getScreenProfile();

  const offsets = {
    mobile: {
      tongue_1: { x: 2, y: 10 },
      tongue_2: { x: -34, y: 22 },
      tongue_3: { x: 10, y: 6 }
    },
    'desktop-small': {
      tongue_1: { x: 0, y: 8 },
      tongue_2: { x: -24, y: 18 },
      tongue_3: { x: -48, y: 22 }
    },
    'desktop-medium': {
      tongue_1: { x: 2, y: 10 },
      tongue_2: { x: -34, y: 22 },
      tongue_3: { x: -76, y: 30 }
    },
    'desktop-large': {
      tongue_1: { x: 6, y: 12 },
      tongue_2: { x: -42, y: 26 },
      tongue_3: { x: -92, y: 36 }
    }
  };

  let frame = 'tongue_3';

  if (src.includes('tongue_1')) {
    frame = 'tongue_1';
  } else if (src.includes('tongue_2')) {
    frame = 'tongue_2';
  }

  return offsets[profile][frame];
}

async function setTongueFrame(src) {
  if (!tongueFrame) return;

  const base = getTongueBasePoint();

  await new Promise((resolve) => {
    const finalize = () => {
      requestAnimationFrame(() => {
        const width = tongueFrame.naturalWidth || tongueFrame.width || 120;
        const height = tongueFrame.naturalHeight || tongueFrame.height || 40;

        const frameOffset = getTongueFrameOffsets(src);

        tongueFrame.style.left = `${base.x - width + frameOffset.x}px`;
        tongueFrame.style.top = `${base.y - height * 0.72 + frameOffset.y}px`;
        tongueFrame.style.opacity = '1';

        resolve();
      });
    };

    if (
      tongueFrame.getAttribute('src') === src &&
      tongueFrame.complete &&
      tongueFrame.naturalWidth > 0
    ) {
      finalize();
      return;
    }

    tongueFrame.onload = finalize;
    tongueFrame.onerror = finalize;
    tongueFrame.src = src;
  });
}

async function playTongueCatch() {
  if (!tongueFrame || tongueAnimating) return;

  tongueAnimating = true;
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    setTongueFrame('tongue_3.png');
    await wait(30);
  } else {
    setTongueFrame('tongue_3.png');
    await wait(25);

    setTongueFrame('tongue_2.png');
    await wait(25);

    setTongueFrame('tongue_1.png');
    await wait(30);

    setTongueFrame('tongue_2.png');
    await wait(25);

    setTongueFrame('tongue_3.png');
    await wait(25);
  }

  hideTongueFrame();
  tongueAnimating = false;
}

function getPondRect() {
  return pondScene.getBoundingClientRect();
}

function getMouthPoint() {
  const rect = getPondRect();

  return {
    x: rect.left + rect.width * 0.505,
    y: rect.top + rect.height * 0.67
  };
}

function getTongueBasePoint() {
  const rect = getPondRect();
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    return {
      x: rect.left + rect.width * 0.8,
      y: rect.top + rect.height * 0.67
    };
  }

  return {
    x: rect.left + rect.width * 0.65,
    y: rect.top + rect.height * 0.73
  };
}

function getTongueTipPoint() {
  const rect = getPondRect();
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    return {
      x: rect.left + rect.width * 0.8,
      y: rect.top + rect.height * 0.64
    };
  }

  return {
    x: rect.left + rect.width * 0.65,
    y: rect.top + rect.height * 0.68
  };
}


function getPreCatchPoint() {
  const rect = getPondRect();
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    return {
      x: rect.left + rect.width * 0.6,
      y: rect.top + rect.height * 0.52
    };
  }

  return {
    x: rect.left + rect.width * 0.57,
    y: rect.top + rect.height * 0.60
  };
}

function showYumBubble() {
  if (!yumBubble) return;

  const isMobile = window.innerWidth <= 640;

  yumBubble.style.left = `${window.innerWidth * 0.52}px`;
  yumBubble.style.top = isMobile
    ? `${window.innerHeight * 0.58}px`
    : `${window.innerHeight * 0.64}px`;

  yumBubble.classList.add('show');

  setTimeout(() => {
    yumBubble.classList.remove('show');
  }, 1200);
}

function hideYumBubble() {
  if (!yumBubble) return;
  yumBubble.classList.remove('show');
}

function getLeftHoverArea() {
  const rect = getPondRect();

  return {
    minX: rect.left + rect.width * 0.16,
    maxX: rect.left + rect.width * 0.34,
    minY: rect.top + rect.height * 0.42,
    maxY: rect.top + rect.height * 0.58
  };
}

function getRightHoverArea() {
  const rect = getPondRect();
  const isMobile = window.innerWidth <= 640;

  if (isMobile) {
    return {
      minX: rect.left + rect.width * 0.68,
      maxX: rect.left + rect.width * 0.75,
      minY: rect.top + rect.height * 0.40,
      maxY: rect.top + rect.height * 0.60
    };
  }

  return {
    minX: rect.left + rect.width * 0.56,
    maxX: rect.left + rect.width * 0.74,
    minY: rect.top + rect.height * 0.46,
    maxY: rect.top + rect.height * 0.62
  };
}

function setTargetInArea(area) {
  flyTargetX = random(area.minX, area.maxX);
  flyTargetY = random(area.minY, area.maxY);
}

function startFlyLoop(now) {
  const isMobile = window.innerWidth <= 640;

  flyState = 'entering-left';
  fly.style.opacity = '1';
  flyX = -30;
  flyY = isMobile
    ? window.innerHeight * random(0.44, 0.54)
    : window.innerHeight * random(0.40, 0.50);

  setTargetInArea(getLeftHoverArea());
  hoverStartedAt = 0;
  sideSwitchAt = 0;
  preCatchStartedAt = 0;
  flyWaitingSince = now;
}

function resetFlyWaiting(now) {
  flyState = 'waiting';
  fly.style.opacity = '0';
  flyX = -100;
  flyY = window.innerHeight * 0.32;
  flyWaitingSince = now;
  flyNextStartDelay = getRandomLoopDelay();
  hoverStartedAt = 0;
  sideSwitchAt = 0;
  preCatchStartedAt = 0;
  hideYumBubble();
  hideTongueFrame();
}

function moveTowardsTarget(speedXFactor, speedYFactor, extraX = 0) {
  const dx = flyTargetX - flyX;
  const dy = flyTargetY - flyY;

  flyX += dx * speedXFactor + extraX;
  flyY += dy * speedYFactor;

  return { dx, dy };
}

function applyNaturalWobble() {
  flyAnglePhase += 0.1;
  flyX += Math.sin(flyAnglePhase * 1.7) * 0.7;
  flyY += Math.cos(flyAnglePhase * 2.1) * 0.5;
}

function animateFly(now) {
  if (!fly || !assetsReady) return;

  if (flyState === 'waiting') {
    if (now - flyWaitingSince >= flyNextStartDelay) {
      startFlyLoop(now);
    }
  }

  if (flyState === 'entering-left') {
    const { dx, dy } = moveTowardsTarget(0.06, 0.08, 1.8);

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      flyState = 'hovering-left';
      hoverStartedAt = now;
      setTargetInArea(getLeftHoverArea());
    }
  }

  if (flyState === 'hovering-left') {
    const { dx, dy } = moveTowardsTarget(0.025, 0.025);
    applyNaturalWobble();

    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setTargetInArea(getLeftHoverArea());
    }

    if (hoverStartedAt && now - hoverStartedAt > random(2500, 4500)) {
      flyState = 'crossing-right';
      sideSwitchAt = now;
      setTargetInArea(getRightHoverArea());
    }
  }

  if (flyState === 'crossing-right') {
    const { dx, dy } = moveTowardsTarget(0.022, 0.03, 0.9);
    applyNaturalWobble();

    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
      flyState = 'hovering-right';
      hoverStartedAt = now;
      setTargetInArea(getRightHoverArea());
    }
  }

  if (flyState === 'hovering-right') {
    const { dx, dy } = moveTowardsTarget(0.025, 0.025);
    applyNaturalWobble();
  
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setTargetInArea(getRightHoverArea());
    }
  
    if (hoverStartedAt && now - hoverStartedAt > random(5000, 9000)) {
      const preCatch = getPreCatchPoint();
      flyTargetX = preCatch.x;
      flyTargetY = preCatch.y;
      flyState = 'pre-catch';
      preCatchStartedAt = now;
    }
  }
  
  if (flyState === 'pre-catch') {
    const dx = flyTargetX - flyX;
    const dy = flyTargetY - flyY;
  
    flyX += dx * 0.045;
    flyY += dy * 0.045;
  
    flyAnglePhase += 0.08;
    flyX += Math.sin(flyAnglePhase * 1.4) * 0.35;
    flyY += Math.cos(flyAnglePhase * 1.8) * 0.25;
  
    if (
      (Math.abs(dx) < 6 && Math.abs(dy) < 6) ||
      (preCatchStartedAt && now - preCatchStartedAt > 1200)
    ) {
      flyState = 'caught';
    }
  }
  
  if (flyState === 'caught') {
    const tongueTip = getTongueTipPoint();
    const flyHalfW = fly.offsetWidth * 0.5;
    const flyHalfH = fly.offsetHeight * 0.5;

    let catchOffsetX = 0;
    let catchOffsetY = 0;

    if (window.innerWidth <= 640) {
      catchOffsetX = 18;
      catchOffsetY = -18;
    }

    const targetX = tongueTip.x - flyHalfW + catchOffsetX;
    const targetY = tongueTip.y - flyHalfH + catchOffsetY;

    const dx = targetX - flyX;
    const dy = targetY - flyY;

    flyX += dx * 0.30;
    flyY += dy * 0.30;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      flyState = 'digesting';

      fly.style.left = `${targetX}px`;
      fly.style.top = `${targetY}px`;
      fly.style.transform = `rotate(0deg) scale(0.85)`;

      playTongueCatch().then(() => {
        fly.style.opacity = '0';
        showYumBubble();

        setTimeout(() => {
          resetFlyWaiting(performance.now());
        }, 1200);
      });
    }
  }

  const wobble = Math.sin(now * 0.03) * 10;
  const scale = flyState === 'caught' ? 0.85 : 1;

  fly.style.left = `${flyX}px`;
  fly.style.top = `${flyY}px`;
  fly.style.transform = `rotate(${wobble}deg) scale(${scale})`;
}

function tick(now) {
  animateFly(now);
  requestAnimationFrame(tick);
}

function waitForImage(img) {
  return new Promise((resolve) => {
    if (!img) {
      resolve();
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === 'function') {
        img.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
      return;
    }

    img.addEventListener('load', () => {
      if (typeof img.decode === 'function') {
        img.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    }, { once: true });

    img.addEventListener('error', resolve, { once: true });
  });
}

async function initScene() {
  await applyLiveWeather();

  await waitForImage(pondScene);
  pondScene.classList.add('loaded');

  assetsReady = true;
  flyWaitingSince = performance.now();

  await new Promise(resolve => setTimeout(resolve, 120));

  await waitForImage(skyImage);
  skyImage.classList.add('loaded');
}

window.addEventListener('resize', () => {
  if (flyState === 'waiting') {
    flyY = window.innerHeight * 0.32;
  }
});

setInterval(applyLiveWeather, REFRESH_INTERVAL);
requestAnimationFrame(tick);
initScene();
