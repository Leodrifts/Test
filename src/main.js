import { buildTextures } from './textures.js';
import { buildMap } from './map.js';
import { Renderer, IW, IH } from './raycaster.js';
import { Player } from './player.js';
import { Enemy, Item, Projectile } from './entities.js';
import { attachInput, Input } from './input.js';
import { fireWeapon, WEAPON_DEFS, WEAPON_VIEWS, MUZZLE_FLASH } from './weapons.js';
import * as audio from './audio.js';

const STATE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', DEAD: 'dead', WIN: 'win', DYING: 'dying' };

const screen = document.getElementById('screen');
const ctx = screen.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const minimap = document.getElementById('minimap');
const mmCtx = minimap.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayBody = document.getElementById('overlay-body');
const startBtn = document.getElementById('start-btn');
const messagesEl = document.getElementById('messages');

const hpVal = document.getElementById('hp-val');
const arVal = document.getElementById('ar-val');
const ammoVal = document.getElementById('ammo-val');
const weaponVal = document.getElementById('weapon-val');
const keysVal = document.getElementById('keys-val');
const face = document.getElementById('face');

const textures = buildTextures();
const renderer = new Renderer(ctx, textures);

let game = null;
let state = STATE.MENU;
let mapZoomedOut = false;

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function showMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg';
  el.textContent = text;
  messagesEl.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function newGame() {
  const map = buildMap();
  const player = new Player(map.things.playerStart);
  const enemies = map.things.enemies.map((d) => new Enemy(d));
  const items = map.things.items.map((d) => new Item(d));
  const projectiles = [];
  const exitCells = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.cells[y][x].exit) exitCells.push({ x: x + 0.5, y: y + 0.5 });
    }
  }
  return {
    map, player, enemies, items, projectiles, exitCells,
    weaponCooldown: 0, prevFireHeld: false, recoil: 0, muzzleTimer: 0,
    totalEnemies: enemies.length, won: false, hazardTimer: 0,
  };
}

function startGame() {
  game = newGame();
  state = STATE.PLAYING;
  overlay.classList.add('hidden');
  audio.resumeAudio();
  audio.startAmbientDrone();
  screen.requestPointerLock();
}

startBtn.onclick = startGame;
window.addEventListener('keydown', (e) => {
  if (state === STATE.MENU && (e.code === 'Enter' || e.code === 'Space')) startGame();
});

attachInput(screen);

function pickupItem(item, player) {
  const messages = {
    health: () => { player.heal(item.amount); return `Picked up health.`; },
    megahealth: () => { player.heal(item.amount, 200); return `MEGA HEALTH!`; },
    armor: () => { player.addArmor(item.amount); return `Picked up armor.`; },
    ammo: () => { player.addAmmo('bullets', item.amount); return `Picked up bullets.`; },
    shell: () => { player.addAmmo('shells', item.amount); return `Picked up shells.`; },
    shotgun: () => { player.weapons.shotgun = true; player.addAmmo('shells', 8); player.currentWeapon = 'shotgun'; return `Got the SHOTGUN!`; },
    chaingun: () => { player.weapons.chaingun = true; player.addAmmo('bullets', 20); player.currentWeapon = 'chaingun'; return `Got the CHAINGUN!`; },
    key_blue: () => { player.keys.blue = true; return `Picked up the BLUE keycard.`; },
    key_red: () => { player.keys.red = true; return `Picked up the RED keycard.`; },
    key_yellow: () => { player.keys.yellow = true; return `Picked up the YELLOW keycard.`; },
  };
  const fn = messages[item.kind];
  const msg = fn ? fn() : 'Picked up item.';
  showMessage(msg);
  audio.sfxPickup();
}

function updateDoors(dt) {
  const { map, player } = game;
  for (const entry of map.doors) {
    const d = entry.d;
    const cx = entry.x + 0.5, cy = entry.y + 0.5;
    const dist = Math.hypot(player.x - cx, player.y - cy);

    if (d.opening) {
      d.timer += dt;
      if (d.timer >= 0.3) { d.open = true; d.opening = false; d.openTime = 0; }
      continue;
    }
    if (d.open) {
      if (d.kind === 'plain') {
        d.openTime += dt;
        if (d.openTime > 4 && dist > 1.6) { d.open = false; d.timer = 0; }
      }
      continue;
    }
    if (d.kind === 'plain') {
      if (dist < 1.3) { d.opening = true; d.timer = 0; audio.sfxDoor(); }
    } else if (Input.usePressed && dist < 1.4) {
      if (player.keys[d.kind]) {
        d.opening = true; d.timer = 0; audio.sfxDoor();
        showMessage(`${d.kind.toUpperCase()} door unlocked.`);
      } else {
        audio.sfxLocked();
        showMessage(`You need the ${d.kind} keycard.`);
      }
    }
  }
}

function checkExit() {
  if (!Input.usePressed) return;
  const { player, exitCells } = game;
  for (const c of exitCells) {
    if (Math.hypot(player.x - c.x, player.y - c.y) < 1.5) {
      winGame();
      return;
    }
  }
}

function winGame() {
  state = STATE.WIN;
  game.won = true;
  document.exitPointerLock();
  audio.sfxFanfare();
  overlayBody.innerHTML = `
    <h2>LEVEL COMPLETE</h2>
    <div class="stats">
      Kills: ${game.player.kills} / ${game.totalEnemies}<br>
      Health remaining: ${Math.round(game.player.health)}%<br>
    </div>`;
  startBtn.textContent = 'PLAY AGAIN';
  overlay.classList.remove('hidden');
}

function gameOverScreen() {
  state = STATE.DEAD;
  document.exitPointerLock();
  overlayBody.innerHTML = `
    <h2>YOU DIED</h2>
    <div class="stats">The facility claims another victim.<br>Kills: ${game.player.kills} / ${game.totalEnemies}</div>`;
  startBtn.textContent = 'TRY AGAIN';
  overlay.classList.remove('hidden');
}

function updateHUD() {
  const p = game.player;
  hpVal.textContent = `${Math.max(0, Math.round(p.health))}%`;
  arVal.textContent = `${Math.round(p.armor)}%`;
  const ammoType = p.currentAmmoType();
  ammoVal.textContent = ammoType ? p.ammo[ammoType] : '--';
  weaponVal.textContent = WEAPON_DEFS[p.currentWeapon].label;

  keysVal.innerHTML = '';
  for (const [k, color] of [['blue', '#3d8fff'], ['red', '#ff3d3d'], ['yellow', '#ffe23d']]) {
    if (p.keys[k]) {
      const dot = document.createElement('div');
      dot.className = 'key-dot';
      dot.style.background = color;
      keysVal.appendChild(dot);
    }
  }

  const pct = p.health;
  face.textContent = p.dead ? 'X_X' : pct > 66 ? ':)' : pct > 33 ? ':|' : pct > 0 ? '>:(' : 'X_X';
}

function drawMinimap() {
  mmCtx.clearRect(0, 0, 120, 120);
  const { map, player, enemies } = game;
  let scale, ox, oy, viewW, viewH;
  if (mapZoomedOut) {
    scale = 120 / Math.max(map.width, map.height);
    ox = 0; oy = 0; viewW = map.width; viewH = map.height;
  } else {
    viewW = 16; viewH = 16;
    scale = 120 / viewW;
    ox = player.x - viewW / 2; oy = player.y - viewH / 2;
  }
  const x0 = Math.max(0, Math.floor(ox)), x1 = Math.min(map.width - 1, Math.ceil(ox + viewW));
  const y0 = Math.max(0, Math.floor(oy)), y1 = Math.min(map.height - 1, Math.ceil(oy + viewH));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = map.cells[y][x];
      const px = (x - ox) * scale, py = (y - oy) * scale;
      if (c.door) {
        mmCtx.fillStyle = c.door.open ? 'rgba(120,180,120,0.5)' :
          c.door.kind === 'blue' ? '#3d8fff' : c.door.kind === 'red' ? '#ff3d3d' : c.door.kind === 'yellow' ? '#ffe23d' : '#8a7a54';
        mmCtx.fillRect(px, py, scale + 0.6, scale + 0.6);
      } else if (c.solid) {
        mmCtx.fillStyle = c.exit ? '#ff4444' : '#777';
        mmCtx.fillRect(px, py, scale + 0.6, scale + 0.6);
      } else {
        mmCtx.fillStyle = 'rgba(90,90,90,0.35)';
        mmCtx.fillRect(px, py, scale + 0.6, scale + 0.6);
      }
    }
  }
  for (const e of enemies) {
    if (e.dead) continue;
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist > (mapZoomedOut ? 999 : 9)) continue;
    mmCtx.fillStyle = '#ff2020';
    mmCtx.beginPath();
    mmCtx.arc((e.x - ox) * scale, (e.y - oy) * scale, 2.4, 0, Math.PI * 2);
    mmCtx.fill();
  }
  const px = (player.x - ox) * scale, py = (player.y - oy) * scale;
  mmCtx.save();
  mmCtx.translate(px, py);
  mmCtx.rotate(player.angle);
  mmCtx.fillStyle = '#4dff4d';
  mmCtx.beginPath();
  mmCtx.moveTo(6, 0); mmCtx.lineTo(-4, 4); mmCtx.lineTo(-4, -4);
  mmCtx.closePath(); mmCtx.fill();
  mmCtx.restore();
}

function drawWeaponViewmodel(dt) {
  const p = game.player;
  const img = WEAPON_VIEWS[p.currentWeapon];
  const targetW = { fists: 130, pistol: 120, shotgun: 190, chaingun: 200 }[p.currentWeapon];
  const scale = targetW / img.width;
  const w = img.width * scale, h = img.height * scale;
  const bob = p.viewBob;
  const recoilY = game.recoil * 14;
  const x = IW / 2 - w / 2;
  const y = IH - h * 0.62 + bob * 0.4 + recoilY;
  ctx.drawImage(img, x, y, w, h);

  if (game.muzzleTimer > 0) {
    const fw = 60, fh = 60;
    const fx = IW / 2 + w * 0.16 - fw / 2;
    const fy = y + h * 0.08;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(MUZZLE_FLASH, fx, fy, fw, fh);
    ctx.globalCompositeOperation = 'source-over';
  }
  game.recoil *= Math.max(0, 1 - dt * 10);
  if (game.muzzleTimer > 0) game.muzzleTimer -= dt;
}

function handleWeaponSwitch() {
  const p = game.player;
  if (Input.weaponSwitch) {
    if (p.weapons[Input.weaponSwitch]) p.currentWeapon = Input.weaponSwitch;
    Input.weaponSwitch = null;
  }
}

function handleFiring(dt) {
  const p = game.player;
  const def = WEAPON_DEFS[p.currentWeapon];
  game.weaponCooldown -= dt;
  const wantsFire = def.auto ? Input.fireHeld : (Input.fireHeld && !game.prevFireHeld);
  if (wantsFire && game.weaponCooldown <= 0 && !p.dead) {
    const fired = fireWeapon(p, game.map, game.enemies);
    if (fired) {
      game.weaponCooldown = def.fireRate;
      game.recoil = 1;
      game.muzzleTimer = 0.08;
    } else {
      game.weaponCooldown = 0.2;
    }
  }
  game.prevFireHeld = Input.fireHeld;
}

function update(dt) {
  const { player, map, enemies, items, projectiles } = game;

  player.update(dt, Input, map);
  handleWeaponSwitch();
  handleFiring(dt);
  updateDoors(dt);
  checkExit();

  for (const e of enemies) e.update(dt, player, map, projectiles);
  for (const it of items) it.update(dt);
  for (const pr of projectiles) pr.update(dt, map, player);
  game.projectiles = projectiles.filter((pr) => !pr.dead);

  for (const it of items) {
    if (it.collected) continue;
    if (Math.hypot(it.x - player.x, it.y - player.y) < 0.55) {
      it.collected = true;
      pickupItem(it, player);
    }
  }

  // slime / hazard damage
  const cx = Math.floor(player.x), cy = Math.floor(player.y);
  if (cy >= 0 && cy < map.height && cx >= 0 && cx < map.width && map.cells[cy][cx].hazard) {
    game.hazardTimer = (game.hazardTimer || 0) + dt;
    if (game.hazardTimer > 0.5) { player.hurt(2); game.hazardTimer = 0; }
  }

  if (Input.mapToggled) { mapZoomedOut = !mapZoomedOut; Input.mapToggled = false; }
  if (Input.usePressed) Input.usePressed = false;

  if (player.dead && state === STATE.PLAYING) {
    state = STATE.DYING;
    setTimeout(() => { if (state === STATE.DYING) gameOverScreen(); }, 900);
  }
}

function render(dt) {
  const { player, map, enemies, items, projectiles } = game;
  const sprites = [
    ...enemies.map((e) => e.sprite),
    ...items.filter((i) => !i.collected).map((i) => i.sprite),
    ...projectiles.map((p) => p.sprite),
  ];
  let flashTint = null;
  if (player.damageFlash > 0) flashTint = `rgba(255,0,0,${0.5 * clamp01(player.damageFlash)})`;
  else if (player.pickupFlash > 0) flashTint = `rgba(255,220,80,${0.25 * clamp01(player.pickupFlash)})`;

  renderer.render(map, player, sprites, flashTint);
  drawWeaponViewmodel(dt);
  drawMinimap();
  updateHUD();
}

let lastTime = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  dt = Math.min(dt, 0.05);

  if (Input.pausePressed) {
    Input.pausePressed = false;
    if (state === STATE.PLAYING) {
      state = STATE.PAUSED;
      document.exitPointerLock();
      overlayBody.innerHTML = `<h2>PAUSED</h2><div class="stats">Press ESC or click below to resume.</div>`;
      startBtn.textContent = 'RESUME';
      overlay.classList.remove('hidden');
      startBtn.onclick = resumeGame;
    } else if (state === STATE.PAUSED) {
      resumeGame();
    }
  }

  if (state === STATE.PLAYING || state === STATE.DYING) {
    update(dt);
    render(dt);
  }
}

function resumeGame() {
  state = STATE.PLAYING;
  overlay.classList.add('hidden');
  screen.requestPointerLock();
  startBtn.onclick = startGame;
}

requestAnimationFrame(loop);
