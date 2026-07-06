// Procedurally generated textures — no external image assets.
// Every wall/floor/ceiling/sprite is drawn with canvas primitives + noise.

const TEX_SIZE = 64;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size = TEX_SIZE) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function noiseShade(ctx, size, seed, amount, base) {
  const rnd = mulberry32(seed);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount;
    d[i] = clampByte(d[i] + n);
    d[i + 1] = clampByte(d[i + 1] + n);
    d[i + 2] = clampByte(d[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function clampByte(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

function texBrick(seed, mortar, brick) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = mortar; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const rowH = 8, colW = 16;
  ctx.fillStyle = brick;
  for (let row = 0; row * rowH < TEX_SIZE; row++) {
    const offset = (row % 2) * (colW / 2);
    for (let x = -colW; x < TEX_SIZE + colW; x += colW) {
      ctx.fillRect(x + offset + 1, row * rowH + 1, colW - 2, rowH - 2);
    }
  }
  noiseShade(ctx, TEX_SIZE, seed, 18);
  return c;
}

function texPanel(seed, base, accent) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, TEX_SIZE - 8, TEX_SIZE - 8);
  ctx.strokeRect(14, 14, TEX_SIZE - 28, TEX_SIZE - 28);
  ctx.fillStyle = accent;
  ctx.fillRect(TEX_SIZE / 2 - 10, TEX_SIZE / 2 - 2, 20, 4);
  ctx.fillRect(TEX_SIZE / 2 - 2, TEX_SIZE / 2 - 10, 4, 20);
  noiseShade(ctx, TEX_SIZE, seed, 10);
  return c;
}

function texHazard(seed) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a3a1a'; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.fillStyle = '#d6c227';
  const stripeW = 12;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, TEX_SIZE, TEX_SIZE); ctx.clip();
  for (let x = -TEX_SIZE; x < TEX_SIZE * 2; x += stripeW * 2) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.transform(1, 0.6, 0, 1, 0, 0);
    ctx.fillRect(0, -TEX_SIZE, stripeW, TEX_SIZE * 3);
    ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, TEX_SIZE, 6);
  ctx.fillRect(0, TEX_SIZE - 6, TEX_SIZE, 6);
  noiseShade(ctx, TEX_SIZE, seed, 12);
  return c;
}

function texComputer(seed) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#161a1e'; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const rnd = mulberry32(seed);
  for (let y = 6; y < TEX_SIZE - 6; y += 10) {
    for (let x = 6; x < TEX_SIZE - 6; x += 14) {
      const lit = rnd() > 0.4;
      ctx.fillStyle = lit ? ['#2fff6e', '#ff5252', '#4fd0ff'][(rnd() * 3) | 0] : '#0c1114';
      ctx.fillRect(x, y, 9, 6);
    }
  }
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, TEX_SIZE - 2, TEX_SIZE - 2);
  return c;
}

function texDoor(seed, colorKey) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a3d2d'; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.strokeStyle = '#2a2115'; ctx.lineWidth = 2;
  for (let y = 6; y < TEX_SIZE; y += 14) ctx.strokeRect(4, y, TEX_SIZE - 8, 10);
  ctx.fillStyle = colorKey || '#8a7a54';
  ctx.fillRect(TEX_SIZE / 2 - 4, TEX_SIZE / 2 - 16, 8, 32);
  noiseShade(ctx, TEX_SIZE, seed, 14);
  return c;
}

function texMarble(seed) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8478'; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const rnd = mulberry32(seed);
  ctx.strokeStyle = 'rgba(60,55,50,0.5)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    let x = rnd() * TEX_SIZE, y = 0;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (rnd() - 0.5) * 20;
      y += TEX_SIZE / 8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  noiseShade(ctx, TEX_SIZE, seed, 8);
  return c;
}

function texGrate(seed) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#26241f'; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.strokeStyle = '#0d0c0a'; ctx.lineWidth = 3;
  for (let i = 0; i <= TEX_SIZE; i += 8) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, TEX_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(TEX_SIZE, i); ctx.stroke();
  }
  noiseShade(ctx, TEX_SIZE, seed, 10);
  return c;
}

function texCarpet(seed, color) {
  const c = makeCanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  noiseShade(ctx, TEX_SIZE, seed, 22);
  return c;
}

export const TEXTURES = {};
export const TEX_LIST = [];

function register(name, canvas) {
  TEXTURES[name] = canvas.getContext('2d').getImageData(0, 0, TEX_SIZE, TEX_SIZE);
  TEX_LIST.push(name);
  return TEXTURES[name];
}

export function buildTextures() {
  register('brick_red', texBrick(1, '#241414', '#7a2a2a'));
  register('brick_brown', texBrick(2, '#1e1812', '#6b4a2c'));
  register('tech_grey', texPanel(3, '#4a4e52', '#8fd6ff'));
  register('tech_green', texPanel(4, '#2c3a2c', '#5fff8a'));
  register('hazard', texHazard(5));
  register('computer', texComputer(6));
  register('door_blue', texDoor(7, '#3d8fff'));
  register('door_red', texDoor(8, '#ff3d3d'));
  register('door_yellow', texDoor(9, '#ffe23d'));
  register('door_plain', texDoor(10, '#8a7a54'));
  register('marble', texMarble(11));
  register('grate', texGrate(12));
  register('exit', texPanel(13, '#233', '#ff4444'));
  register('floor_tech', texGrate(20));
  register('floor_carpet', texCarpet(21, '#3a1414'));
  register('floor_marble', texMarble(22));
  register('ceiling_tech', texPanel(23, '#26282b', '#556'));
  register('ceiling_flat', texCarpet(24, '#232323'));
  register('slime', texCarpet(25, '#1f4a1f'));
  return TEXTURES;
}

export const TEX_SIZE_PX = TEX_SIZE;

// ---- Sprite generation (billboards for things) ----

function spriteCanvas(w = 64, h = 64) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function drawImpSprite(frame) {
  const c = spriteCanvas(); const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  const bob = frame === 'walk1' ? 1 : frame === 'walk2' ? -1 : 0;
  ctx.fillStyle = '#7a3a1a';
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.quadraticCurveTo(14, 40 + bob, 18, 26);
  ctx.quadraticCurveTo(20, 16, 32, 14);
  ctx.quadraticCurveTo(44, 16, 46, 26);
  ctx.quadraticCurveTo(50, 40 - bob, 44, 60);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = '#5c2c14';
  ctx.beginPath();
  ctx.ellipse(32, 16, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // horns
  ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(24, 8); ctx.lineTo(20, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 8); ctx.lineTo(44, 0); ctx.stroke();
  // eyes glow
  ctx.fillStyle = frame === 'attack' ? '#ffee55' : '#ffaa22';
  ctx.beginPath(); ctx.arc(27, 15, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(37, 15, 2.4, 0, Math.PI * 2); ctx.fill();
  if (frame === 'attack') {
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 30); ctx.lineTo(2, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 30); ctx.lineTo(62, 20); ctx.stroke();
  }
  if (frame === 'pain') {
    ctx.fillStyle = 'rgba(255,0,0,0.35)';
    ctx.fillRect(0, 0, 64, 64);
  }
  if (frame === 'dead') {
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = '#5c2410';
    ctx.beginPath();
    ctx.ellipse(32, 50, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a1608';
    ctx.beginPath(); ctx.ellipse(14, 46, 8, 6, 0.3, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

function drawTrooperSprite(frame) {
  const c = spriteCanvas(); const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#5a6a3a';
  ctx.fillRect(22, 22, 20, 32);
  ctx.fillStyle = '#3f4a2a';
  ctx.fillRect(20, 50, 24, 10);
  ctx.fillStyle = '#c9a878';
  ctx.beginPath(); ctx.ellipse(32, 16, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(24, 12, 16, 5);
  if (frame === 'attack') {
    ctx.fillStyle = '#444';
    ctx.fillRect(40, 28, 16, 5);
    ctx.fillStyle = '#ffdd66';
    ctx.beginPath(); ctx.arc(58, 30, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#333';
    ctx.fillRect(38, 26, 12, 5);
  }
  if (frame === 'pain') {
    ctx.fillStyle = 'rgba(255,0,0,0.35)';
    ctx.fillRect(0, 0, 64, 64);
  }
  if (frame === 'dead') {
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = '#4a5a2a';
    ctx.beginPath(); ctx.ellipse(32, 52, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a878';
    ctx.beginPath(); ctx.ellipse(12, 50, 7, 6, 0.2, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

function drawFireball() {
  const c = spriteCanvas(32, 32); const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, '#fff6c8');
  grad.addColorStop(0.4, '#ffb040');
  grad.addColorStop(1, 'rgba(200,40,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(16, 16, 15, 0, Math.PI * 2); ctx.fill();
  return c;
}

function drawItem(kind) {
  const c = spriteCanvas(48, 48); const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 48, 48);
  switch (kind) {
    case 'health': {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(10, 16, 28, 20);
      ctx.fillStyle = '#d63838';
      ctx.fillRect(20, 12, 8, 28);
      ctx.fillRect(10, 22, 28, 8);
      ctx.strokeStyle = '#888'; ctx.strokeRect(10, 16, 28, 20);
      break;
    }
    case 'armor': {
      ctx.fillStyle = '#3a7a3a';
      ctx.beginPath();
      ctx.moveTo(24, 8); ctx.lineTo(40, 16); ctx.lineTo(38, 34);
      ctx.lineTo(24, 42); ctx.lineTo(10, 34); ctx.lineTo(8, 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1f4a1f'; ctx.stroke();
      break;
    }
    case 'ammo': {
      ctx.fillStyle = '#7a5a1a';
      ctx.fillRect(10, 18, 28, 18);
      ctx.fillStyle = '#ffcc44';
      for (let i = 0; i < 4; i++) ctx.fillRect(12 + i * 6.5, 12, 4, 10);
      break;
    }
    case 'shell': {
      ctx.fillStyle = '#8a4a1a';
      ctx.fillRect(14, 10, 20, 26);
      ctx.fillStyle = '#c8c8b0';
      ctx.fillRect(14, 30, 20, 8);
      break;
    }
    case 'shotgun': {
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(6, 24, 36, 6);
      ctx.fillStyle = '#222'; ctx.fillRect(30, 20, 14, 4);
      break;
    }
    case 'chaingun': {
      ctx.fillStyle = '#333'; ctx.fillRect(8, 20, 32, 10);
      ctx.fillStyle = '#555';
      for (let i = 0; i < 4; i++) ctx.fillRect(34, 14 + i * 4, 10, 2);
      break;
    }
    case 'key_blue':
    case 'key_red':
    case 'key_yellow': {
      const color = kind === 'key_blue' ? '#3d8fff' : kind === 'key_red' ? '#ff3d3d' : '#ffe23d';
      ctx.strokeStyle = color; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(18, 18, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(25, 24); ctx.lineTo(38, 38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32, 31); ctx.lineTo(38, 31); ctx.stroke();
      break;
    }
  }
  return c;
}

export const SPRITES = {
  imp_idle: drawImpSprite('idle'),
  imp_walk1: drawImpSprite('walk1'),
  imp_walk2: drawImpSprite('walk2'),
  imp_attack: drawImpSprite('attack'),
  imp_pain: drawImpSprite('pain'),
  imp_dead: drawImpSprite('dead'),
  trooper_idle: drawTrooperSprite('idle'),
  trooper_walk1: drawTrooperSprite('walk1'),
  trooper_attack: drawTrooperSprite('attack'),
  trooper_pain: drawTrooperSprite('pain'),
  trooper_dead: drawTrooperSprite('dead'),
  fireball: drawFireball(),
  item_health: drawItem('health'),
  item_armor: drawItem('armor'),
  item_ammo: drawItem('ammo'),
  item_shell: drawItem('shell'),
  item_shotgun: drawItem('shotgun'),
  item_chaingun: drawItem('chaingun'),
  item_key_blue: drawItem('key_blue'),
  item_key_red: drawItem('key_red'),
  item_key_yellow: drawItem('key_yellow'),
};
