import { Entity, Tile } from '../types';
import { GAME_CONFIG } from '../../../assets/constants';
export const checkCollision = (a: Entity, b: Entity) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export const tryMove = (entity: Entity, dx: number, dy: number, map: Tile[][]) => {
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const newX = entity.x + dx; const newY = entity.y + dy;
  if (newX < 0 || newX + entity.width > MAP_WIDTH * TILE_SIZE) return { x: entity.x, y: entity.y };
  if (newY < 0 || newY + entity.height > MAP_HEIGHT * TILE_SIZE) return { x: entity.x, y: entity.y };
  const startCol = Math.floor(newX / TILE_SIZE); const endCol = Math.floor((newX + entity.width - 0.1) / TILE_SIZE);
  const startRow = Math.floor(newY / TILE_SIZE); const endRow = Math.floor((newY + entity.height - 0.1) / TILE_SIZE);
  for (let y = startRow; y <= endRow; y++) for (let x = startCol; x <= endCol; x++) if (map[y]?.[x]?.solid) return { x: entity.x, y: entity.y };
  return { x: newX, y: newY };
};
export const checkAttackHit = (at: Entity, tg: Entity, sh: string, rg: number, w: number, ang: number) => {
  const dx = (tg.x + tg.width/2) - (at.x + at.width/2); const dy = (tg.y + tg.height/2) - (at.y + at.height/2);
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > rg) return false;
  let ad = Math.abs(Math.atan2(dy, dx) - ang);
  while (ad > Math.PI) ad -= 2 * Math.PI;
  if (sh === 'arc' && Math.abs(ad) > Math.PI / 4) return false;
  return true;
};
