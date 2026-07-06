// Core rendering engine: DDA raycasting for walls, floor/ceiling casting,
// and billboard sprite rendering with a per-column z-buffer.
// Renders into a 320x200 internal buffer for an authentic chunky-pixel look.

export const IW = 320;
export const IH = 200;
const HALF_IH = IH / 2;

function effectiveSolid(cell) {
  if (!cell.solid) return false;
  if (cell.door) return !cell.door.open;
  return true;
}

export class Renderer {
  constructor(ctx, textures) {
    this.ctx = ctx;
    this.textures = textures;
    this.imageData = ctx.createImageData(IW, IH);
    this.buf32 = new Uint32Array(this.imageData.data.buffer);
    this.zbuffer = new Float64Array(IW);
    this.texSize = 64;
  }

  render(map, player, sprites, flashTint) {
    this.castWallsFloorsCeilings(map, player);
    this.drawSprites(map, player, sprites);
    if (flashTint) {
      this.ctx.fillStyle = flashTint;
      this.ctx.fillRect(0, 0, IW, IH);
    }
  }

  castWallsFloorsCeilings(map, player) {
    const { posX, posY, dirX, dirY, planeX, planeY } = player;
    const buf32 = this.buf32;
    const texSize = this.texSize;
    const cells = map.cells;

    for (let x = 0; x < IW; x++) {
      const cameraX = (2 * x) / IW - 1;
      const rayDirX = dirX + planeX * cameraX;
      const rayDirY = dirY + planeY * cameraX;

      let mapX = Math.floor(posX);
      let mapY = Math.floor(posY);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let stepX, sideDistX, stepY, sideDistY;
      if (rayDirX < 0) { stepX = -1; sideDistX = (posX - mapX) * deltaDistX; }
      else { stepX = 1; sideDistX = (mapX + 1 - posX) * deltaDistX; }
      if (rayDirY < 0) { stepY = -1; sideDistY = (posY - mapY) * deltaDistY; }
      else { stepY = 1; sideDistY = (mapY + 1 - posY) * deltaDistY; }

      let side = 0;
      let hitCell = null;
      for (let i = 0; i < 256; i++) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX; mapX += stepX; side = 0;
        } else {
          sideDistY += deltaDistY; mapY += stepY; side = 1;
        }
        if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) { hitCell = null; break; }
        const c = cells[mapY][mapX];
        if (effectiveSolid(c)) { hitCell = c; break; }
      }

      let perpWallDist;
      if (!hitCell) {
        perpWallDist = 1e6;
      } else if (side === 0) {
        perpWallDist = (mapX - posX + (1 - stepX) / 2) / (rayDirX || 1e-9);
      } else {
        perpWallDist = (mapY - posY + (1 - stepY) / 2) / (rayDirY || 1e-9);
      }
      this.zbuffer[x] = perpWallDist;

      let lineHeight = hitCell ? Math.floor(IH / perpWallDist) : 0;
      let drawStart = Math.floor(-lineHeight / 2 + HALF_IH);
      let drawEnd = Math.floor(lineHeight / 2 + HALF_IH);
      if (drawStart < 0) drawStart = 0;
      if (drawEnd > IH - 1) drawEnd = IH - 1;
      if (drawStart > IH) drawStart = IH;
      if (drawEnd < 0) drawEnd = -1;

      // --- wall column ---
      let texImg = null, texX = 0;
      if (hitCell) {
        let wallX;
        if (side === 0) wallX = posY + perpWallDist * rayDirY;
        else wallX = posX + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        texX = Math.floor(wallX * texSize);
        if (side === 0 && rayDirX > 0) texX = texSize - texX - 1;
        if (side === 1 && rayDirY < 0) texX = texSize - texX - 1;
        texImg = this.textures[hitCell.wallTex];
        const shadeMul = side === 1 ? 0.72 : 1.0;
        const fog = Math.max(0.28, 1 - perpWallDist / 16);
        const mul = shadeMul * fog;

        const step = texSize / lineHeight;
        let texPos = (drawStart - HALF_IH + lineHeight / 2) * step;
        const data = texImg.data;
        for (let y = drawStart; y <= drawEnd; y++) {
          let texY = Math.floor(texPos) & (texSize - 1);
          texPos += step;
          const idx = (texY * texSize + texX) * 4;
          const r = data[idx] * mul, g = data[idx + 1] * mul, b = data[idx + 2] * mul;
          buf32[y * IW + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
      }

      // --- ceiling (above wall) ---
      for (let y = 0; y < drawStart; y++) {
        const p = HALF_IH - y;
        const rowDist = HALF_IH / p;
        const wx = posX + rowDist * rayDirX;
        const wy = posY + rowDist * rayDirY;
        const cx = Math.floor(wx), cy = Math.floor(wy);
        let tex = this.textures.ceiling_tech;
        if (cy >= 0 && cy < map.height && cx >= 0 && cx < map.width) {
          tex = this.textures[cells[cy][cx].ceilTex] || tex;
        }
        const tX = Math.floor((wx - cx) * texSize) & (texSize - 1);
        const tY = Math.floor((wy - cy) * texSize) & (texSize - 1);
        const idx = (tY * texSize + tX) * 4;
        const fog = Math.max(0.25, 1 - rowDist / 16);
        const data = tex.data;
        const r = data[idx] * fog, g = data[idx + 1] * fog, b = data[idx + 2] * fog;
        buf32[y * IW + x] = (255 << 24) | (b << 16) | (g << 8) | r;
      }

      // --- floor (below wall) ---
      for (let y = drawEnd + 1; y < IH; y++) {
        const p = y - HALF_IH;
        const rowDist = HALF_IH / p;
        const wx = posX + rowDist * rayDirX;
        const wy = posY + rowDist * rayDirY;
        const cx = Math.floor(wx), cy = Math.floor(wy);
        let tex = this.textures.floor_tech;
        if (cy >= 0 && cy < map.height && cx >= 0 && cx < map.width) {
          tex = this.textures[cells[cy][cx].floorTex] || tex;
        }
        const tX = Math.floor((wx - cx) * texSize) & (texSize - 1);
        const tY = Math.floor((wy - cy) * texSize) & (texSize - 1);
        const idx = (tY * texSize + tX) * 4;
        const fog = Math.max(0.25, 1 - rowDist / 16);
        const data = tex.data;
        const r = data[idx] * fog, g = data[idx + 1] * fog, b = data[idx + 2] * fog;
        buf32[y * IW + x] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
    }
  }

  drawSprites(map, player, sprites) {
    const { posX, posY, dirX, dirY, planeX, planeY } = player;
    const invDet = 1.0 / (planeX * dirY - dirX * planeY);
    const ctx = this.ctx;

    const withDist = sprites.map(s => {
      const dx = s.x - posX, dy = s.y - posY;
      return { s, dist: dx * dx + dy * dy };
    });
    withDist.sort((a, b) => b.dist - a.dist);

    for (const { s } of withDist) {
      const spriteX = s.x - posX;
      const spriteY = s.y - posY;
      const transformX = invDet * (dirY * spriteX - dirX * spriteY);
      const transformY = invDet * (-planeY * spriteX + planeX * spriteY);
      if (transformY <= 0.15) continue;

      const spriteScreenX = Math.floor((IW / 2) * (1 + transformX / transformY));
      const vMove = IH / transformY;
      const heightRatio = s.heightRatio ?? 0.9;
      const widthRatio = s.widthRatio ?? heightRatio;
      const spriteHeight = Math.abs(vMove * heightRatio);
      const spriteWidth = Math.abs(vMove * widthRatio);
      const vOffset = (s.floatOffset || 0) * vMove;

      const spriteBottomY = HALF_IH + vMove / 2 - vOffset;
      let drawStartY = Math.floor(spriteBottomY - spriteHeight);
      let drawEndY = Math.floor(spriteBottomY);
      const clipStartY = Math.max(0, drawStartY);
      const clipEndY = Math.min(IH - 1, drawEndY);

      let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
      let drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);
      const clipStartX = Math.max(0, drawStartX);
      const clipEndX = Math.min(IW - 1, drawEndX);

      const img = s.image;
      if (!img) continue;
      const iw = img.width, ih = img.height;
      const idata = img.__data || (img.__data = img.getContext('2d').getImageData(0, 0, iw, ih).data);
      const fog = Math.max(0.3, 1 - transformY / 14);

      for (let stripe = clipStartX; stripe <= clipEndX; stripe++) {
        if (transformY >= this.zbuffer[stripe]) continue;
        const texX = Math.floor(((stripe - drawStartX) * iw) / spriteWidth);
        if (texX < 0 || texX >= iw) continue;
        for (let y = clipStartY; y <= clipEndY; y++) {
          const texY = Math.floor(((y - drawStartY) * ih) / spriteHeight);
          if (texY < 0 || texY >= ih) continue;
          const idx = (texY * iw + texX) * 4;
          const a = idata[idx + 3];
          if (a < 10) continue;
          const r = idata[idx] * fog, g = idata[idx + 1] * fog, b = idata[idx + 2] * fog;
          this.buf32[y * IW + stripe] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
      }
    }
    ctx.putImageData(this.imageData, 0, 0);
  }
}
