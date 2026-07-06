export const Input = {
  forward: false, back: false, strafeLeft: false, strafeRight: false,
  left: false, right: false, run: false,
  fireHeld: false,
  usePressed: false,
  mapToggled: false,
  pausePressed: false,
  weaponSwitch: null,
  mouseDX: 0,
  pointerLocked: false,
  // analog movement from an on-screen joystick, -1..1 (forward/right positive)
  touchMoveX: 0,
  touchMoveY: 0,
};

export function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

const KEY_MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'strafeLeft',
  KeyD: 'strafeRight',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
  ControlLeft: 'fireHeld', ControlRight: 'fireHeld',
};

export function attachInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.code]) { Input[KEY_MAP[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyE') { Input.usePressed = true; e.preventDefault(); }
    if (e.code === 'Tab') { Input.mapToggled = true; e.preventDefault(); }
    if (e.code === 'Escape') { Input.pausePressed = true; }
    if (e.code === 'Digit1') Input.weaponSwitch = 'fists';
    if (e.code === 'Digit2') Input.weaponSwitch = 'pistol';
    if (e.code === 'Digit3') Input.weaponSwitch = 'shotgun';
    if (e.code === 'Digit4') Input.weaponSwitch = 'chaingun';
    if (e.code === 'Enter') Input.usePressed = true;
  });
  window.addEventListener('keyup', (e) => {
    if (KEY_MAP[e.code]) { Input[KEY_MAP[e.code]] = false; e.preventDefault(); }
  });

  if (isTouchDevice()) return;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) Input.fireHeld = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) Input.fireHeld = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      Input.mouseDX += e.movementX || 0;
    }
  });

  document.addEventListener('pointerlockchange', () => {
    Input.pointerLocked = document.pointerLockElement === canvas;
  });

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });
}
