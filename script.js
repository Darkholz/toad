const frogWrap = document.getElementById('frogWrap');
const statusEl = document.getElementById('status');
const app = document.getElementById('app');
const fly = document.getElementById('fly');
const pupilLeft = document.getElementById('pupilLeft');
const pupilRight = document.getElementById('pupilRight');

let busy = false;

function lookAt(x, y){
  [pupilLeft, pupilRight].forEach(pupil => {
    const rect = pupil.parentElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-5, Math.min(5, (x - cx) / 12));
    const dy = Math.max(-4, Math.min(4, (y - cy) / 12));
    pupil.style.transform = `translate(${dx}px, ${dy}px)`;
  });
}

document.addEventListener('mousemove', (e) => lookAt(e.clientX, e.clientY));

function setStatus(text){
  statusEl.textContent = text;
}

function clearModes(){
  frogWrap.className = 'frog-wrap idle';
  app.classList.remove('ripple-on');
}

function runMode(mode, text, duration = 1400){
  if (busy) return;
  busy = true;
  frogWrap.className = 'frog-wrap ' + mode;
  setStatus(text);

  if (mode === 'jump' || mode === 'croak') {
    app.classList.add('ripple-on');
  }

  setTimeout(() => {
    clearModes();
    setStatus('À espera...');
    busy = false;
  }, duration);
}

function resetFly(){
  fly.classList.remove('caught');
  fly.style.top = '170px';
  fly.style.left = '80px';
}

function doAction(action){
  if (action === 'random'){
    const actions = ['jump', 'dance', 'wave', 'croak', 'sleep', 'eat'];
    action = actions[Math.floor(Math.random() * actions.length)];
  }

  if (action === 'jump') runMode('jump', 'O sapo saltou!', 1100);
  if (action === 'dance') runMode('dance', 'O sapo está a dançar!', 2600);
  if (action === 'wave') runMode('wave', 'O sapo acenou!', 2200);
  if (action === 'croak') runMode('croak', 'Croac croac!', 1700);
  if (action === 'sleep') runMode('sleep', 'Shhh... o sapo está a dormir.', 2400);

  if (action === 'eat'){
    if (busy) return;
    busy = true;
    frogWrap.className = 'frog-wrap eat';
    setStatus('Nhac! O sapo apanhou a mosca.');
    fly.classList.add('caught');

    setTimeout(() => {
      clearModes();
      setStatus('À espera...');
      busy = false;
      setTimeout(resetFly, 1200);
    }, 1200);
  }
}

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => doAction(button.dataset.action));
});

setInterval(() => {
  if (!busy && Math.random() < 0.25) {
    doAction('random');
  }
}, 5000);
