import { GAME_CONFIG } from '../../../assets/constants';
import { Entity, Tile, AttackShape } from '../types';

/**
 * 2つのエンティティ（矩形）間の衝突判定
 */
export const checkCollision = (rect1: Entity, rect2: Entity): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * 攻撃判定（範囲チェック）
 */
export const checkAttackHit = (
  attacker: Entity,
  target: Entity,
  shape: AttackShape,
  range: number,
  width: number, // Line: width(px), Arc: angle(deg)
  angle: number
): boolean => {
  const ax = attacker.x + attacker.width / 2;
  const ay = attacker.y + attacker.height / 2;
  const tx = target.x + target.width / 2;
  const ty = target.y + target.height / 2;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > range) return false;

  if (shape === 'arc') {
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - angle;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const halfAngle = (width * Math.PI / 180) / 2;
    return Math.abs(diff) <= halfAngle;
  } else {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const dot = dx * dirX + dy * dirY;
    if (dot < 0 || dot > range) return false;
    const cross = dx * dirY - dy * dirX;
    return Math.abs(cross) <= width / 2;
  }
};

export const checkMapCollision = (entity: Entity, map: Tile[][]): boolean => {
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const corners = [
    { x: entity.x, y: entity.y },
    { x: entity.x + entity.width, y: entity.y },
    { x: entity.x, y: entity.y + entity.height },
    { x: entity.x + entity.width, y: entity.y + entity.height },
  ];

  for (const corner of corners) {
    const tileX = Math.floor(corner.x / TILE_SIZE);
    const tileY = Math.floor(corner.y / TILE_SIZE);
    if (tileY < 0 || tileY >= MAP_HEIGHT || tileX < 0 || tileX >= MAP_WIDTH) return true;
    // mapデータが存在しない、または行・列が未定義の場合のガード
    if (!map[tileY] || !map[tileY][tileX]) return true; 
    if (map[tileY][tileX].solid) return true;
  }
  return false;
};

export const tryMove = (entity: Entity, dx: number, dy: number, map: Tile[][]): { x: number, y: number } => {
  const nextX = entity.x + dx;
  const nextY = entity.y + dy;
  
  let finalX = entity.x;
  if (!checkMapCollision({ ...entity, x: nextX }, map)) finalX = nextX;

  let finalY = entity.y;
  if (!checkMapCollision({ ...entity, x: finalX, y: nextY }, map)) finalY = nextY;

  return { x: finalX, y: finalY };
};
