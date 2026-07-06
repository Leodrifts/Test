import { IW } from './raycaster.js';

const FOV_PLANE = 0.72;
const MOVE_SPEED = 3.2;
const RUN_MULT = 1.6;
const ROT_SPEED = 2.6;
const RADIUS = 0.22;

function effectiveSolid(cell) {
  if (!cell.solid) return false;
  if (cell.door) return !cell.door.open;
  return true;
}

export function cellBlocked(map, x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= map.width || cy >= map.height) return true;
  return effectiveSolid(map.cells[cy][cx]);
}

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = start.angle;
    this.updateVectors();

    this.health = 100;
    this.armor = 0;
    this.dead = false;

    this.ammo = { bullets: 50, shells: 0, cells: 0 };
    this.maxAmmo = { bullets: 200, shells: 50, cells: 100 };
    this.weapons = { fists: true, pistol: true, shotgun: false, chaingun: false };
    this.currentWeapon = 'pistol';
    this.keys = { blue: false, red: false, yellow: false };

    this.bobPhase = 0;
    this.bobAmount = 0;
    this.viewBob = 0;
    this.damageFlash = 0;
    this.pickupFlash = 0;
    this.moving = false;
    this.kills = 0;
    this.secrets = 0;
  }

  updateVectors() {
    this.dirX = Math.cos(this.angle);
    this.dirY = Math.sin(this.angle);
    this.planeX = -this.dirY * FOV_PLANE;
    this.planeY = this.dirX * FOV_PLANE;
  }

  get posX() { return this.x; }
  get posY() { return this.y; }

  tryMove(map, dx, dy) {
    if (dx !== 0) {
      const nx = this.x + dx;
      if (!cellBlocked(map, nx + Math.sign(dx) * RADIUS, this.y) &&
          !cellBlocked(map, nx + Math.sign(dx) * RADIUS, this.y - RADIUS) &&
          !cellBlocked(map, nx + Math.sign(dx) * RADIUS, this.y + RADIUS)) {
        this.x = nx;
      }
    }
    if (dy !== 0) {
      const ny = this.y + dy;
      if (!cellBlocked(map, this.x, ny + Math.sign(dy) * RADIUS) &&
          !cellBlocked(map, this.x - RADIUS, ny + Math.sign(dy) * RADIUS) &&
          !cellBlocked(map, this.x + RADIUS, ny + Math.sign(dy) * RADIUS)) {
        this.y = ny;
      }
    }
  }

  update(dt, input, map) {
    if (this.dead) return;

    let turn = 0;
    if (input.left) turn -= 1;
    if (input.right) turn += 1;
    turn += input.mouseDX * 0.0028;
    input.mouseDX = 0;
    this.angle += turn * ROT_SPEED * dt;
    this.updateVectors();

    let fwd = 0, strafe = 0;
    if (input.forward) fwd += 1;
    if (input.back) fwd -= 1;
    if (input.strafeLeft) strafe -= 1;
    if (input.strafeRight) strafe += 1;

    const running = input.run;
    const speed = MOVE_SPEED * (running ? RUN_MULT : 1) * dt;

    this.moving = fwd !== 0 || strafe !== 0;
    if (this.moving) {
      const len = Math.hypot(fwd, strafe) || 1;
      const nfwd = (fwd / len) * speed;
      const nstrafe = (strafe / len) * speed;
      const dx = this.dirX * nfwd + (-this.dirY) * nstrafe;
      const dy = this.dirY * nfwd + this.dirX * nstrafe;
      this.tryMove(map, dx, dy);
      this.bobPhase += dt * (running ? 14 : 9);
      this.bobAmount = 1;
    } else {
      this.bobAmount *= 0.85;
    }
    this.viewBob = Math.sin(this.bobPhase) * 6 * this.bobAmount;

    if (this.damageFlash > 0) this.damageFlash -= dt * 2.2;
    if (this.pickupFlash > 0) this.pickupFlash -= dt * 2.5;
  }

  hurt(amount) {
    if (this.dead) return;
    let dmg = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.66);
      this.armor -= absorbed;
      dmg -= absorbed;
    }
    this.health -= dmg;
    this.damageFlash = 1;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
  }

  heal(amount, cap = 100) {
    this.health = Math.min(cap, this.health + amount);
    this.pickupFlash = 1;
  }

  addArmor(amount) {
    this.armor = Math.min(200, this.armor + amount);
    this.pickupFlash = 1;
  }

  addAmmo(type, amount) {
    this.ammo[type] = Math.min(this.maxAmmo[type], this.ammo[type] + amount);
    this.pickupFlash = 1;
  }

  currentAmmoType() {
    return { pistol: 'bullets', chaingun: 'bullets', shotgun: 'shells', fists: null }[this.currentWeapon];
  }
}
