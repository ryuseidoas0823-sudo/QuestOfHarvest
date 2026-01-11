import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest } from '../types';
import { generateRandomItem } from '../lib/ItemGenerator';

/**
 * マップ生成ロジック（宝箱配置付き）
 */
export const generateMap = (): { map: Tile[][], chests: Chest[] } => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];
  const chests: Chest[] = [];

  // 1. 地形生成
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: TileType = 'grass';
      let solid = false;

      const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.random() * 0.5;
      
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        type = 'wall';
        solid = true;
      } else if (noise > 1.5) {
        type = 'wall'; 
        solid = true;
      } else if (noise < -0.8) {
        type = 'dirt'; 
      }

      row.push({ x, y, type, solid });
    }
    map.push(row);
  }

  // 2. 安全地帯確保
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

  // 3. 宝箱の配置 (10〜20個ランダム配置)
  const chestCount = 10 + Math.floor(Math.random() * 10);
  for (let i = 0; i < chestCount; i++) {
    let cx, cy;
    let attempts = 0;
    // 壁じゃない場所を探す
    do {
      cx = Math.floor(Math.random() * MAP_WIDTH);
      cy = Math.floor(Math.random() * MAP_HEIGHT);
      attempts++;
    } while ((map[cy][cx].solid || (Math.abs(cx - spawnX) < 5 && Math.abs(cy - spawnY) < 5)) && attempts < 100);

    if (!map[cy][cx].solid) {
      // 中身を生成（レベル1想定）
      const contents = [
        generateRandomItem(1),
        Math.random() > 0.5 ? generateRandomItem(1) : null
      ].filter(Boolean) as any[];

      chests.push({
        id: `chest_${i}`,
        x: cx * TILE_SIZE,
        y: cy * TILE_SIZE,
        opened: false,
        contents
      });
    }
  }

  return { map, chests };
};
