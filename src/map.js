// Level "E1M1: The Facility" — built from carved rectangles (rooms/corridors)
// rather than hand ASCII-art, so geometry is easy to reason about & extend.

export const MAP_W = 36;
export const MAP_H = 30;

function makeGrid(w, h) {
  const cells = new Array(h);
  for (let y = 0; y < h; y++) {
    cells[y] = new Array(w);
    for (let x = 0; x < w; x++) {
      cells[y][x] = { solid: true, wallTex: 'brick_red', floorTex: 'floor_tech', ceilTex: 'ceiling_tech', door: null, hazard: false, exit: false };
    }
  }
  return cells;
}

function carve(cells, x0, y0, x1, y1, opts = {}) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = cells[y][x];
      c.solid = false;
      c.floorTex = opts.floorTex || 'floor_tech';
      c.ceilTex = opts.ceilTex || 'ceiling_tech';
      if (opts.hazard) c.hazard = true;
    }
  }
}

function paintWalls(cells, x0, y0, x1, y1, tex) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = cells[y][x];
      if (c.solid) c.wallTex = tex;
    }
  }
}

function pillar(cells, x, y, tex) {
  cells[y][x].solid = true;
  cells[y][x].wallTex = tex;
}

function door(cells, x, y, kind, tex) {
  const c = cells[y][x];
  c.solid = true;
  c.wallTex = tex;
  c.door = { kind, open: false, opening: false, closing: false, offset: 0, timer: 0 };
  return c.door;
}

function markExit(cells, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      cells[y][x].exit = true;
      cells[y][x].wallTex = 'exit';
    }
  }
}

export function buildMap() {
  const cells = makeGrid(MAP_W, MAP_H);

  // Hangar (start room)
  carve(cells, 2, 2, 9, 9, { floorTex: 'floor_tech', ceilTex: 'ceiling_tech' });
  // secret shaft + nook above corridor H1
  carve(cells, 11, 1, 11, 4, { floorTex: 'floor_tech' });
  carve(cells, 10, 1, 12, 1, { floorTex: 'floor_marble' });
  // Corridor Hangar -> Hall
  carve(cells, 10, 5, 13, 5, { floorTex: 'floor_tech' });
  // Main Hall (marble)
  carve(cells, 14, 2, 25, 11, { floorTex: 'floor_marble', ceilTex: 'ceiling_tech' });
  pillar(cells, 18, 5, 'marble');
  pillar(cells, 21, 8, 'marble');
  paintWalls(cells, 13, 1, 26, 12, 'marble');

  // Hangar -> Armory
  carve(cells, 5, 10, 5, 10, { floorTex: 'floor_tech' }); // will become door
  carve(cells, 4, 11, 5, 13, { floorTex: 'floor_tech' });
  carve(cells, 2, 14, 9, 19, { floorTex: 'floor_carpet' }); // Armory
  paintWalls(cells, 1, 9, 10, 20, 'brick_brown');
  door(cells, 5, 10, 'plain', 'door_plain');

  // Hall -> Blue Key Room
  carve(cells, 18, 12, 18, 12, { floorTex: 'floor_tech' }); // door cell
  carve(cells, 17, 13, 18, 15, { floorTex: 'floor_tech' });
  carve(cells, 14, 16, 21, 22, { floorTex: 'floor_tech' }); // Blue Key Room
  paintWalls(cells, 13, 11, 22, 23, 'tech_green');
  door(cells, 18, 12, 'plain', 'door_plain');

  // Hall -> Blue Door -> Tech corridor -> Tech Room
  door(cells, 26, 6, 'blue', 'door_blue');
  carve(cells, 27, 5, 27, 7, { floorTex: 'floor_tech' });
  carve(cells, 28, 2, 33, 10, { floorTex: 'floor_tech' }); // Tech Room
  paintWalls(cells, 27, 1, 34, 11, 'hazard');
  carve(cells, 29, 7, 31, 9, { floorTex: 'slime', hazard: true }); // slime pit

  // Tech Room -> Red Key Room
  carve(cells, 30, 11, 30, 11, {}); // door cell
  carve(cells, 30, 12, 31, 13, { floorTex: 'floor_tech' });
  carve(cells, 27, 14, 33, 19, { floorTex: 'floor_tech' }); // Red Key Room
  paintWalls(cells, 26, 10, 34, 20, 'tech_grey');
  door(cells, 30, 11, 'plain', 'door_plain');

  // Red Door -> corridor -> Final Chamber
  door(cells, 30, 20, 'red', 'door_red');
  carve(cells, 29, 21, 31, 22, { floorTex: 'floor_marble' });
  carve(cells, 18, 23, 33, 27, { floorTex: 'floor_marble', ceilTex: 'ceiling_flat' }); // Final Chamber
  paintWalls(cells, 17, 22, 34, 28, 'brick_red');

  markExit(cells, 17, 24, 17, 26);

  const doors = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (cells[y][x].door) doors.push({ x, y, d: cells[y][x].door });
    }
  }

  const things = {
    playerStart: { x: 5.0, y: 5.5, angle: 0 },
    items: [
      { type: 'item_ammo', kind: 'ammo', x: 4.5, y: 3.5, amount: 20 },
      { type: 'item_health', kind: 'health', x: 7.5, y: 3.5, amount: 25 },
      { type: 'item_health', kind: 'megahealth', x: 11.5, y: 1.5, amount: 100 },

      { type: 'item_shotgun', kind: 'shotgun', x: 5.5, y: 16.5, amount: 0 },
      { type: 'item_shell', kind: 'shell', x: 3.5, y: 18.0, amount: 8 },
      { type: 'item_shell', kind: 'shell', x: 8.0, y: 18.0, amount: 8 },
      { type: 'item_health', kind: 'health', x: 5.5, y: 18.5, amount: 25 },

      { type: 'item_health', kind: 'health', x: 15.5, y: 3.5, amount: 10 },
      { type: 'item_ammo', kind: 'ammo', x: 24.0, y: 3.5, amount: 20 },

      { type: 'item_key_blue', kind: 'key_blue', x: 17.5, y: 19.5, amount: 0 },
      { type: 'item_health', kind: 'health', x: 19.5, y: 21.0, amount: 25 },

      { type: 'item_chaingun', kind: 'chaingun', x: 30.5, y: 4.0, amount: 0 },
      { type: 'item_ammo', kind: 'ammo', x: 32.0, y: 4.0, amount: 30 },

      { type: 'item_key_red', kind: 'key_red', x: 30.5, y: 15.5, amount: 0 },
      { type: 'item_armor', kind: 'armor', x: 27.8, y: 17.5, amount: 50 },

      { type: 'item_health', kind: 'health', x: 20.5, y: 26.0, amount: 25 },
      { type: 'item_armor', kind: 'armor', x: 31.5, y: 26.0, amount: 25 },
    ],
    enemies: [
      { type: 'imp', x: 17.5, y: 9.0, angle: Math.PI },
      { type: 'imp', x: 23.5, y: 4.5, angle: Math.PI },

      { type: 'trooper', x: 15.5, y: 18.5, angle: 0 },
      { type: 'trooper', x: 20.0, y: 20.5, angle: Math.PI },

      { type: 'trooper', x: 29.0, y: 8.0, angle: -Math.PI / 2 },
      { type: 'imp', x: 32.2, y: 9.0, angle: Math.PI },

      { type: 'imp', x: 29.2, y: 16.0, angle: 0 },
      { type: 'imp', x: 32.2, y: 18.0, angle: Math.PI },

      { type: 'trooper', x: 22.0, y: 25.0, angle: Math.PI },
      { type: 'trooper', x: 28.0, y: 25.0, angle: Math.PI },
      { type: 'imp', x: 25.0, y: 24.0, angle: Math.PI },
    ],
  };

  return { cells, doors, things, width: MAP_W, height: MAP_H };
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}
