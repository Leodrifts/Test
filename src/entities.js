import { SPRITES } from './textures.js';
import { cellBlocked } from './player.js';
import { hasLineOfSight } from './util.js';
import { sfxEnemyAlert, sfxEnemyPain, sfxEnemyDeath } from './audio.js';

const ENEMY_STATS = {
  imp: {
    health: 60, speed: 1.7, sight: 10, meleeRange: 1.15, meleeDmg: [10, 20],
    rangedRange: 8, rangedCooldown: 1.8, projectileSpeed: 4.2, projectileDmg: [8, 16],
    painChance: 0.6, heightRatio: 0.95, widthRatio: 0.85, pitch: 1,
  },
  trooper: {
    health: 30, speed: 1.4, sight: 10, meleeRange: 0, meleeDmg: [0, 0],
    rangedRange: 9, rangedCooldown: 1.1, hitscanDmg: [5, 15],
    painChance: 0.7, heightRatio: 0.85, widthRatio: 0.75, pitch: 1.35,
  },
};

let idCounter = 1;

export class Enemy {
  constructor(def) {
    this.id = idCounter++;
    this.type = def.type;
    this.x = def.x; this.y = def.y;
    this.angle = def.angle || 0;
    const s = ENEMY_STATS[def.type];
    this.stats = s;
    this.health = s.health;
    this.state = 'idle';
    this.painTimer = 0;
    this.attackTimer = 0;
    this.cooldown = Math.random() * 0.6;
    this.walkTimer = 0;
    this.walkFrame = 0;
    this.dead = false;
    this.deathSettle = 0;
    this.alerted = false;
  }

  get spriteKey() {
    if (this.state === 'dead') return `${this.type}_dead`;
    if (this.painTimer > 0) return `${this.type}_pain`;
    if (this.state === 'attack') return `${this.type}_attack`;
    if (this.state === 'chase') return this.walkFrame ? `${this.type}_walk2` : `${this.type}_walk1`;
    return `${this.type}_idle`;
  }

  takeDamage(amount, player) {
    if (this.dead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      player.kills++;
      sfxEnemyDeath(this.stats.pitch);
      return;
    }
    if (Math.random() < this.stats.painChance) {
      this.painTimer = 0.3;
    }
    if (this.state === 'idle') {
      this.state = 'chase';
      sfxEnemyAlert(this.stats.pitch);
    }
  }

  update(dt, player, map, projectiles) {
    if (this.dead) return;
    if (this.painTimer > 0) { this.painTimer -= dt; return; }
    this.cooldown -= dt;

    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const angToPlayer = Math.atan2(dy, dx);
    const los = dist < this.stats.sight + 4 && hasLineOfSight(map, this.x, this.y, player.x, player.y);

    if (this.state === 'idle') {
      if (los && dist < this.stats.sight && !player.dead) {
        this.state = 'chase';
        sfxEnemyAlert(this.stats.pitch);
      }
      return;
    }

    if (this.state === 'attack') {
      this.attackTimer -= dt;
      this.angle = angToPlayer;
      if (this.attackTimer <= 0) this.state = 'chase';
      return;
    }

    if (this.state === 'chase') {
      this.angle = angToPlayer;
      const meleeReach = this.stats.meleeRange;
      const canMelee = meleeReach > 0 && dist < meleeReach;
      const canRanged = dist < this.stats.rangedRange;

      if (!player.dead && los && this.cooldown <= 0 && (canMelee || canRanged)) {
        this.performAttack(player, projectiles, canMelee, dist);
        this.cooldown = this.stats.rangedCooldown + Math.random() * 0.4;
        this.state = 'attack';
        this.attackTimer = 0.45;
        return;
      }

      if (dist > (meleeReach > 0 ? meleeReach * 0.8 : 2.2)) {
        const stepDist = this.stats.speed * dt;
        const mx = Math.cos(angToPlayer) * stepDist;
        const my = Math.sin(angToPlayer) * stepDist;
        this.tryMove(map, mx, my);
        this.walkTimer += dt;
        if (this.walkTimer > 0.22) { this.walkTimer = 0; this.walkFrame = this.walkFrame ? 0 : 1; }
      }
    }
  }

  performAttack(player, projectiles, canMelee, dist) {
    if (this.type === 'imp') {
      if (canMelee) {
        player.hurt(rand(...this.stats.meleeDmg));
      } else {
        projectiles.push(new Projectile(this.x, this.y, this.angle, this.stats));
      }
    } else if (this.type === 'trooper') {
      const falloff = Math.max(0.15, 1 - dist / (this.stats.rangedRange + 2));
      if (Math.random() < falloff) {
        player.hurt(rand(...this.stats.hitscanDmg));
      }
    }
  }

  tryMove(map, dx, dy) {
    const r = 0.28;
    const nx = this.x + dx, ny = this.y + dy;
    if (!cellBlocked(map, nx + Math.sign(dx) * r, this.y)) this.x = nx;
    if (!cellBlocked(map, this.x, ny + Math.sign(dy) * r)) this.y = ny;
  }

  get sprite() { return { image: SPRITES[this.spriteKey], x: this.x, y: this.y, heightRatio: this.dead ? 0.35 : this.stats.heightRatio, widthRatio: this.dead ? 0.9 : this.stats.widthRatio }; }
}

function rand(min, max) { return min + Math.random() * (max - min); }

export class Projectile {
  constructor(x, y, angle, stats) {
    this.x = x; this.y = y;
    this.dirX = Math.cos(angle); this.dirY = Math.sin(angle);
    this.speed = stats.projectileSpeed;
    this.dmg = stats;
    this.dead = false;
    this.life = 5;
  }

  update(dt, map, player) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    const step = this.speed * dt;
    this.x += this.dirX * step;
    this.y += this.dirY * step;
    if (cellBlocked(map, this.x, this.y)) { this.dead = true; return; }
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 0.4 && !player.dead) {
      player.hurt(rand(...this.dmg.projectileDmg));
      this.dead = true;
    }
  }

  get sprite() { return { image: SPRITES.fireball, x: this.x, y: this.y, heightRatio: 0.25, widthRatio: 0.25, floatOffset: 0.4 }; }
}

export class Item {
  constructor(def) {
    this.id = idCounter++;
    this.type = def.type;
    this.kind = def.kind;
    this.x = def.x; this.y = def.y;
    this.amount = def.amount;
    this.collected = false;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt) { this.bob += dt * 2; }

  get sprite() {
    return {
      image: SPRITES[this.type], x: this.x, y: this.y,
      heightRatio: 0.5, widthRatio: 0.5,
      floatOffset: 0.06 + Math.sin(this.bob) * 0.02,
    };
  }
}
