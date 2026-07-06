import { raymarch } from './util.js';
import { sfxShoot, sfxEmpty } from './audio.js';

export const WEAPON_ORDER = ['fists', 'pistol', 'shotgun', 'chaingun'];

export const WEAPON_DEFS = {
  fists: { label: 'FISTS', ammoType: null, fireRate: 0.4, auto: false, meleeRange: 1.2, dmg: [15, 28] },
  pistol: { label: 'PISTOL', ammoType: 'bullets', ammoPerShot: 1, fireRate: 0.28, auto: false, pellets: 1, spread: 0.02, dmg: [10, 18], range: 16 },
  shotgun: { label: 'SHOTGUN', ammoType: 'shells', ammoPerShot: 1, fireRate: 0.75, auto: false, pellets: 7, spread: 0.13, dmg: [4, 9], range: 12 },
  chaingun: { label: 'CHAINGUN', ammoType: 'bullets', ammoPerShot: 1, fireRate: 0.1, auto: true, pellets: 1, spread: 0.05, dmg: [7, 13], range: 16 },
};

function rand(min, max) { return min + Math.random() * (max - min); }

function findHitscanTarget(map, player, enemies, angle, range) {
  const wallDist = raymarch(map, player.x, player.y, angle, range, 0.1);
  let best = null, bestDist = Infinity;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.x - player.x, dy = e.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > wallDist || dist > range) continue;
    const bearing = Math.atan2(dy, dx);
    let diff = bearing - angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const angularRadius = Math.atan2(0.4, dist);
    if (Math.abs(diff) <= angularRadius && dist < bestDist) { best = e; bestDist = dist; }
  }
  return best;
}

export function fireWeapon(player, map, enemies) {
  const def = WEAPON_DEFS[player.currentWeapon];
  if (!def) return false;

  if (def.ammoType) {
    if (player.ammo[def.ammoType] < def.ammoPerShot) {
      sfxEmpty();
      return false;
    }
    player.ammo[def.ammoType] -= def.ammoPerShot;
  }

  if (player.currentWeapon === 'fists') {
    let best = null, bestDist = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist > def.meleeRange) continue;
      const bearing = Math.atan2(e.y - player.y, e.x - player.x);
      let diff = bearing - player.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < 0.7 && dist < bestDist) { best = e; bestDist = dist; }
    }
    if (best) best.takeDamage(rand(...def.dmg), player);
    return true;
  }

  sfxShoot(player.currentWeapon);
  const pellets = def.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spreadAngle = player.angle + (Math.random() - 0.5) * 2 * def.spread;
    const target = findHitscanTarget(map, player, enemies, spreadAngle, def.range);
    if (target) target.takeDamage(rand(...def.dmg), player);
  }
  return true;
}

// --- procedurally drawn first-person weapon viewmodels ---
function vcanvas(w = 160, h = 120) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

function drawFists() {
  const c = vcanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#c99a6b';
  ctx.beginPath(); ctx.ellipse(50, 100, 26, 30, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(118, 96, 26, 30, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a97e50';
  for (let i = 0; i < 4; i++) { ctx.fillRect(36 + i * 9, 66, 7, 20); ctx.fillRect(104 + i * 9, 62, 7, 20); }
  return c;
}

function drawPistol() {
  const c = vcanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#2b2b2e';
  ctx.fillRect(66, 40, 26, 55);
  ctx.fillRect(60, 90, 18, 30);
  ctx.fillStyle = '#111';
  ctx.fillRect(70, 30, 18, 14);
  ctx.fillStyle = '#555';
  ctx.fillRect(66, 44, 26, 6);
  return c;
}

function drawShotgun() {
  const c = vcanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a3a1c'; ctx.fillRect(40, 70, 90, 20);
  ctx.fillStyle = '#1c1c1c'; ctx.fillRect(90, 20, 20, 60);
  ctx.fillStyle = '#3a2a10'; ctx.fillRect(55, 85, 60, 24);
  ctx.fillStyle = '#666'; ctx.fillRect(96, 24, 8, 56);
  return c;
}

function drawChaingun() {
  const c = vcanvas(); const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(40, 60, 90, 34);
  ctx.fillStyle = '#111';
  for (let i = 0; i < 4; i++) ctx.fillRect(96 + i * 9, 20, 7, 46);
  ctx.fillStyle = '#444'; ctx.fillRect(30, 92, 40, 26);
  return c;
}

export const WEAPON_VIEWS = {
  fists: drawFists(),
  pistol: drawPistol(),
  shotgun: drawShotgun(),
  chaingun: drawChaingun(),
};

function flashCanvas() {
  const c = vcanvas(80, 80); const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(40, 40, 2, 40, 40, 38);
  g.addColorStop(0, 'rgba(255,255,220,0.95)');
  g.addColorStop(0.5, 'rgba(255,200,60,0.7)');
  g.addColorStop(1, 'rgba(255,120,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(40, 40, 38, 0, Math.PI * 2); ctx.fill();
  return c;
}
export const MUZZLE_FLASH = flashCanvas();
