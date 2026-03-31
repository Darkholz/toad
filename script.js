const fly = document.getElementById('fly');
const tongue = document.getElementById('tongue');
const frogWrap = document.getElementById('frogWrap');
const frogEyeVisible = document.getElementById('frogEyeVisible');
const frogEyeFar = document.getElementById('frogEyeFar');

let flyX = -120;
let flyY = window.innerHeight * 0.22;
let direction = 1;
let eating = false;
let phase = Math.random() * Math.PI * 2;

function blink(){
  frogEyeVisible.classList.add('closed');
  frogEyeFar.classList.add('closed');
  setTimeout(() => {
    frogEyeVisible.classList.remove('closed');
    frogEyeFar.classList.remove('closed');
  }, 180);
}

function scheduleBlink(){
  const next = 1800 + Math.random() * 3200;
  setTimeout(() => {
    blink();
    scheduleBlink();
  }, next);
}

function getMouthPoint(){
  const frogRect = frogWrap.getBoundingClientRect();
  return {
    x: frogRect.left + frogRect.width * 0.60,
    y: frogRect.top + frogRect.height * 0.45
  };
}

function placeTongue(targetX, targetY){
  const sceneRect = document.querySelector('.scene').getBoundingClientRect();
  const mouth = getMouthPoint();

  const x1 = mouth.x - sceneRect.left;
  const y1 = mouth.y - sceneRect.top;
  const x2 = targetX - sceneRect.left;
  const y2 = targetY - sceneRect.top;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  tongue.style.left = `${x1}px`;
  tongue.style.top = `${y1}px`;
  tongue.style.width = `${length}px`;
  tongue.style.transform = `rotate(${angle}deg)`;
  tongue.style.opacity = '1';
}

function hideTongue(){
  tongue.style.opacity = '0';
  tongue.style.width = '10px';
}

function eatFly(){
  if (eating) return;
  eating = true;

  const flyRect = fly.getBoundingClientRect();
  const targetX = flyRect.left + flyRect.width * 0.5;
  const targetY = flyRect.top + flyRect.height * 0.55;

  placeTongue(targetX, targetY);

  setTimeout(() => {
    fly.style.opacity = '0';
    fly.style.transform += ' scale(0.2)';
  }, 90);

  setTimeout(() => {
    hideTongue();
    flyX = -140;
    flyY = window.innerHeight * (0.18 + Math.random() * 0.16);
    phase = Math.random() * Math.PI * 2;
    fly.style.opacity = '1';
    fly.style.transform = 'rotate(0deg)';
    eating = false;
  }, 520);
}

function animateFly(){
  if (!eating) {
    const speed = Math.max(1.2, window.innerWidth / 700);
    flyX += speed * direction;
    phase += 0.045;
    flyY += Math.sin(phase) * 1.7;

    const minY = window.innerHeight * 0.14;
    const maxY = window.innerHeight * 0.42;
    flyY = Math.max(minY, Math.min(maxY, flyY));

    if (flyX > window.innerWidth + 120) {
      flyX = -140;
      flyY = window.innerHeight * (0.16 + Math.random() * 0.18);
      phase = Math.random() * Math.PI * 2;
    }

    const wingTilt = Math.sin(phase * 3.2) * 8;
    fly.style.left = `${flyX}px`;
    fly.style.top = `${flyY}px`;
    fly.style.transform = `rotate(${wingTilt}deg)`;

    const mouth = getMouthPoint();
    const dx = (flyX + fly.offsetWidth * 0.45) - mouth.x;
    const dy = (flyY + fly.offsetHeight * 0.5) - mouth.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 155 && Math.random() < 0.045) {
      eatFly();
    }
  }

  requestAnimationFrame(animateFly);
}

window.addEventListener('resize', () => {
  flyY = Math.min(flyY, window.innerHeight * 0.42);
});

scheduleBlink();
animateFly();
