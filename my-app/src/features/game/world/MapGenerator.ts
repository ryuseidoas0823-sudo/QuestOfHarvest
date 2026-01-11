import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType } from '../types';

/**
 * マップ生成ロジック
 */
export const generateMap = (): Tile[][] => {
  const { MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const map: Tile[][] = [];

  // 1. ベースの地形生成
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: TileType = 'grass';
      let solid = false;

      // シンプルなパーリンノイズ風の地形生成
      const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.random() * 0.5;
      
      // マップの外枠は必ず壁にする
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        type = 'wall';
        solid = true;
      } 
      // ノイズに基づき壁（遺跡など）を生成
      else if (noise > 1.5) {
        type = 'wall'; 
        solid = true;
      } 
      // ノイズに基づき土（畑作可能エリア）を生成
      else if (noise < -0.8) {
        type = 'dirt'; 
      }

      row.push({ x, y, type, solid });
    }
    map.push(row);
  }

  // 2. プレイヤーの初期スポーン位置（5, 5）周辺を強制的に安全地帯にする
  // これにより「壁に埋まって動けない」事故を防ぎます
  const safeRadius = 2;
  const spawnX = 5;
  const spawnY = 5;

  for (let y = spawnY - safeRadius; y <= spawnY + safeRadius; y++) {
    for (let x = spawnX - safeRadius; x <= spawnX + safeRadius; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        map[y][x].type = 'grass';
        map[y][x].solid = false;
      }
    }
  }

  return map;
};
