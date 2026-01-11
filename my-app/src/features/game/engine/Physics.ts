import { GAME_CONFIG } from '../../../assets/constants';
import { Entity, Tile } from '../types';

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
 * エンティティとマップ（壁など）との衝突判定
 * 衝突がある場合は true を返します
 */
export const checkMapCollision = (entity: Entity, map: Tile[][]): boolean => {
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;

  // エンティティの4隅の座標をチェック
  const corners = [
    { x: entity.x, y: entity.y }, // 左上
    { x: entity.x + entity.width, y: entity.y }, // 右上
    { x: entity.x, y: entity.y + entity.height }, // 左下
    { x: entity.x + entity.width, y: entity.y + entity.height }, // 右下
  ];

  for (const corner of corners) {
    const tileX = Math.floor(corner.x / TILE_SIZE);
    const tileY = Math.floor(corner.y / TILE_SIZE);

    // マップ範囲外のチェック
    if (tileY < 0 || tileY >= MAP_HEIGHT || tileX < 0 || tileX >= MAP_WIDTH) {
      return true; // 画面外は衝突扱い
    }

    // タイルの衝突属性チェック
    if (map[tileY][tileX].solid) {
      return true;
    }
  }

  return false;
};

/**
 * 移動を試行し、衝突があれば補正するか、元の位置に戻す
 * シンプルな実装として、移動後に衝突したら移動をキャンセルするロジックを返します
 */
export const tryMove = (
  entity: Entity, 
  dx: number, 
  dy: number, 
  map: Tile[][]
): { x: number, y: number } => {
  const nextX = entity.x + dx;
  const nextY = entity.y + dy;
  
  // X軸方向の移動をテスト
  const testEntityX = { ...entity, x: nextX };
  let finalX = entity.x;
  if (!checkMapCollision(testEntityX, map)) {
    finalX = nextX;
  }

  // Y軸方向の移動をテスト
  const testEntityY = { ...entity, x: finalX, y: nextY }; // Xは確定した値を使う
  let finalY = entity.y;
  if (!checkMapCollision(testEntityY, map)) {
    finalY = nextY;
  }

  return { x: finalX, y: finalY };
};
