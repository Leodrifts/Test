import { cellBlocked } from './player.js';

// March a ray forward in small steps and report how far it travels before
// hitting a solid cell. Used for line-of-sight checks and hitscan weapons;
// not perf critical (small enemy counts / infrequent weapon fire).
export function raymarch(map, x, y, angle, maxDist, step = 0.1) {
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x, py = y;
  let dist = 0;
  while (dist < maxDist) {
    px += dx; py += dy; dist += step;
    if (cellBlocked(map, px, py)) return dist;
  }
  return maxDist;
}

export function hasLineOfSight(map, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const wallDist = raymarch(map, x0, y0, angle, dist, 0.12);
  return wallDist >= dist - 0.35;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
