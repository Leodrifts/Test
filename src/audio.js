// Procedurally synthesized sound effects via WebAudio — no sampled/copyrighted audio.

let actx = null;
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

export function resumeAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume();
}

function noiseBuffer(duration, c) {
  const n = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function envGain(c, startVal, endVal, dur, when) {
  const g = c.createGain();
  g.gain.setValueAtTime(startVal, when);
  g.gain.exponentialRampToValueAtTime(Math.max(endVal, 0.0001), when + dur);
  return g;
}

export function sfxShoot(kind = 'pistol') {
  const c = ctx();
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(kind === 'shotgun' ? 0.35 : 0.15, c);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = kind === 'shotgun' ? 2200 : kind === 'chaingun' ? 2600 : 3200;
  const gain = envGain(c, kind === 'shotgun' ? 1.0 : 0.7, 0.001, kind === 'shotgun' ? 0.35 : 0.15, now);
  src.connect(filter); filter.connect(gain); gain.connect(c.destination);
  src.start(now);

  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(kind === 'shotgun' ? 140 : 220, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
  const og = envGain(c, 0.5, 0.001, 0.15, now);
  osc.connect(og); og.connect(c.destination);
  osc.start(now); osc.stop(now + 0.16);
}

export function sfxEmpty() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, now);
  const g = envGain(c, 0.25, 0.001, 0.06, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.07);
}

export function sfxEnemyAlert(pitch = 1) {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120 * pitch, now);
  osc.frequency.linearRampToValueAtTime(70 * pitch, now + 0.35);
  const g = envGain(c, 0.28, 0.001, 0.4, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.4);
}

export function sfxEnemyPain(pitch = 1) {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(90 * pitch, now + 0.18);
  const g = envGain(c, 0.3, 0.001, 0.2, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.2);
}

export function sfxEnemyDeath(pitch = 1) {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(40 * pitch, now + 0.5);
  const g = envGain(c, 0.32, 0.001, 0.55, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.55);

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.3, c);
  const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
  const ng = envGain(c, 0.25, 0.001, 0.3, now);
  src.connect(filter); filter.connect(ng); ng.connect(c.destination);
  src.start(now);
}

export function sfxPlayerHurt() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
  const g = envGain(c, 0.35, 0.001, 0.22, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.22);
}

export function sfxPickup() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.setValueAtTime(660, now + 0.06);
  osc.frequency.setValueAtTime(880, now + 0.12);
  const g = envGain(c, 0.2, 0.001, 0.24, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.2);
}

export function sfxDoor() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.linearRampToValueAtTime(160, now + 0.4);
  const g = envGain(c, 0.15, 0.001, 0.45, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.45);
}

export function sfxLocked() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(120, now);
  const g = envGain(c, 0.2, 0.001, 0.15, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.15);
  const osc2 = c.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(90, now + 0.15);
  const g2 = envGain(c, 0.2, 0.001, 0.15, now + 0.15);
  osc2.connect(g2); g2.connect(c.destination);
  osc2.start(now + 0.15); osc2.stop(now + 0.3);
}

export function sfxSwitch() {
  const c = ctx(); const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.setValueAtTime(750, now + 0.09);
  const g = envGain(c, 0.25, 0.001, 0.2, now);
  osc.connect(g); g.connect(c.destination);
  osc.start(now); osc.stop(now + 0.2);
}

export function sfxFanfare() {
  const c = ctx(); const now = c.currentTime;
  const notes = [392, 494, 587, 784];
  notes.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const start = now + i * 0.16;
    const g = envGain(c, 0.28, 0.001, 0.5, start);
    osc.connect(g); g.connect(c.destination);
    osc.start(start); osc.stop(start + 0.5);
  });
}

let droneStarted = false;
export function startAmbientDrone() {
  if (droneStarted) return;
  droneStarted = true;
  const c = ctx();
  const osc1 = c.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 55;
  const osc2 = c.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = 55.5;
  const g = c.createGain(); g.gain.value = 0.035;
  const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 300;
  osc1.connect(filter); osc2.connect(filter); filter.connect(g); g.connect(c.destination);
  osc1.start(); osc2.start();
}
