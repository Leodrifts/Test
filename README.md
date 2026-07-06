# DOOM — a from-scratch recreation

A browser-based recreation of the original DOOM's gameplay, built from
scratch with vanilla JavaScript and Canvas2D. Every wall texture, sprite,
and sound effect is generated procedurally at runtime — no ripped assets.

## Play

Serve the folder over HTTP (ES modules need it, `file://` won't work) and
open `index.html`:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

- `WASD` / arrow keys — move & turn
- Mouse (click to lock pointer) — look
- `Left Click` / `Ctrl` — fire
- `1`-`4` — switch weapon (fists, pistol, shotgun, chaingun)
- `E` — use / open locked doors
- `Shift` — run
- `Tab` — toggle minimap zoom
- `Esc` — pause

## How it's built

- `src/raycaster.js` — classic DDA raycasting engine rendering into a
  320×200 internal buffer (textured walls, floor/ceiling casting, and
  billboarded sprites with z-buffer occlusion) for the authentic chunky-pixel look.
- `src/textures.js` — procedural wall/floor/ceiling textures and enemy/item
  sprites drawn with Canvas2D primitives.
- `src/audio.js` — WebAudio-synthesized gunshots, growls, doors, pickups.
- `src/map.js` — the level: rooms, corridors, locked doors + keycards,
  enemy and item placement.
- `src/player.js`, `src/entities.js`, `src/weapons.js` — movement/collision,
  enemy AI (chase/attack/pain/death state machine), and the weapon roster.
- `src/main.js` — game loop, HUD, minimap, door/pickup/win logic.
