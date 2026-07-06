import { Input, isTouchDevice } from './input.js';

const JOY_RADIUS = 46;
const LOOK_SENSITIVITY = 3.2;

function setActive(el, active) {
  if (!el) return;
  el.classList.toggle('active', active);
}

function setupJoystick() {
  const zone = document.getElementById('joystick-zone');
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');
  let touchId = null;
  let cx = 0, cy = 0;

  function start(e) {
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    const rect = base.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
    update(t);
    e.preventDefault();
  }

  function update(t) {
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    Input.touchMoveX = dx / JOY_RADIUS;
    Input.touchMoveY = -dy / JOY_RADIUS;
  }

  function move(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) { update(t); e.preventDefault(); }
    }
  }

  function end(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        touchId = null;
        knob.style.transform = 'translate(0, 0)';
        Input.touchMoveX = 0;
        Input.touchMoveY = 0;
      }
    }
  }

  zone.addEventListener('touchstart', start, { passive: false });
  zone.addEventListener('touchmove', move, { passive: false });
  zone.addEventListener('touchend', end, { passive: false });
  zone.addEventListener('touchcancel', end, { passive: false });
}

function setupLookPad() {
  const zone = document.getElementById('look-zone');
  let touchId = null;
  let lastX = 0, lastY = 0;

  function start(e) {
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    lastX = t.clientX; lastY = t.clientY;
    e.preventDefault();
  }

  function move(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        const dx = t.clientX - lastX;
        lastX = t.clientX; lastY = t.clientY;
        Input.mouseDX += dx * LOOK_SENSITIVITY;
        e.preventDefault();
      }
    }
  }

  function end(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) touchId = null;
    }
  }

  zone.addEventListener('touchstart', start, { passive: false });
  zone.addEventListener('touchmove', move, { passive: false });
  zone.addEventListener('touchend', end, { passive: false });
  zone.addEventListener('touchcancel', end, { passive: false });
}

function setupButtons() {
  const fireBtn = document.getElementById('btn-fire');
  fireBtn.addEventListener('touchstart', (e) => { Input.fireHeld = true; setActive(fireBtn, true); e.preventDefault(); }, { passive: false });
  fireBtn.addEventListener('touchend', (e) => { Input.fireHeld = false; setActive(fireBtn, false); e.preventDefault(); }, { passive: false });
  fireBtn.addEventListener('touchcancel', () => { Input.fireHeld = false; setActive(fireBtn, false); });

  const useBtn = document.getElementById('btn-use');
  useBtn.addEventListener('touchstart', (e) => { Input.usePressed = true; setActive(useBtn, true); e.preventDefault(); }, { passive: false });
  useBtn.addEventListener('touchend', (e) => { setActive(useBtn, false); e.preventDefault(); }, { passive: false });

  const runBtn = document.getElementById('btn-run');
  runBtn.addEventListener('touchstart', (e) => {
    Input.run = !Input.run;
    setActive(runBtn, Input.run);
    e.preventDefault();
  }, { passive: false });

  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.addEventListener('touchstart', (e) => { Input.pausePressed = true; e.preventDefault(); }, { passive: false });

  const mapBtn = document.getElementById('btn-map');
  mapBtn.addEventListener('touchstart', (e) => { Input.mapToggled = true; e.preventDefault(); }, { passive: false });

  const fsBtn = document.getElementById('btn-fullscreen');
  fsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); requestFullscreenAndLock(); }, { passive: false });

  for (const btn of document.querySelectorAll('.wbtn')) {
    btn.addEventListener('touchstart', (e) => {
      Input.weaponSwitch = btn.dataset.weapon;
      e.preventDefault();
    }, { passive: false });
  }
}

export function requestFullscreenAndLock() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  try {
    if (req) {
      const result = req.call(el);
      if (result && result.catch) result.catch(() => {});
    }
  } catch (err) { /* fullscreen not available — ignore */ }
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (err) { /* orientation lock not available — ignore */ }
}

export function initTouchControls() {
  const touch = isTouchDevice();
  if (touch) document.body.classList.add('touch');
  setupJoystick();
  setupLookPad();
  setupButtons();
  return touch;
}
