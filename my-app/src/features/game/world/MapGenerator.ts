import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest } from '../types';
import { generateRandomItem } from '../lib/ItemGenerator';

interface MapResult {
  map: Tile[][];
  chests: Chest[];
  spawnPoint: { x: number, y: number };
  bossSpawn?: { x: number, y: number };
}

/**
 * ワールドマップ生成（山脈で区切られた平地）
 */
export const generateWorldMap = (): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];

  // 1. 全体を山脈で初期化
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({ x, y, type: 'mountain', solid: true });
    }
    map.push(row);
  }

  // 2. ドランカードウォーク（酔歩）法で平地を掘る
  // これにより全ての平地が連結され、到達不能エリアがなくなります
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.45; // 全体の45%を平地にする
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  while (totalFloor < targetFloor) {
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }

    // ランダムに移動
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++;
    else if (dir === 1) cx--;
    else if (dir === 2) cy++;
    else if (dir === 3) cy--;

    // 画面外に出ないようにクランプ
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
  }

  // 3. 一部の平地を「壁（破壊可能）」に変える & 土パッチを作る
  // 移動しやすくするため、壁の密度は低めにする
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x].type === 'grass') {
        const rand = Math.random();
        if (rand < 0.05) { // 5%の確率で壁
           map[y][x].type = 'wall';
           map[y][x].solid = true;
        } else if (rand < 0.15) {
           map[y][x].type = 'dirt';
        }
      }
    }
  }

  // スポーン地点周辺をクリア
  for(let y = -2; y <= 2; y++) {
    for(let x = -2; x <= 2; x++) {
      const tx = Math.floor(spawnPoint.x / TILE_SIZE) + x;
      const ty = Math.floor(spawnPoint.y / TILE_SIZE) + y;
      if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        map[ty][tx].type = 'grass';
        map[ty][tx].solid = false;
      }
    }
  }

  // 4. ダンジョン入り口配置
  // スポーン地点から遠い場所ほど深い階層にする
  const dungeonCount = 4;
  for(let i=0; i<dungeonCount; i++) {
    let dx, dy, dist;
    let attempts = 0;
    do {
      dx = Math.floor(Math.random() * MAP_WIDTH);
      dy = Math.floor(Math.random() * MAP_HEIGHT);
      dist = Math.sqrt((dx * TILE_SIZE - spawnPoint.x)**2 + (dy * TILE_SIZE - spawnPoint.y)**2);
      attempts++;
    } while ((map[dy][dx].solid || dist < 600) && attempts < 200);

    if (!map[dy][dx].solid) {
      map[dy][dx].type = 'dungeon_entrance';
      // 距離に応じて最大深度を決定 (例: 距離600pxで3階層、距離2000pxで10階層)
      const maxDepth = Math.floor(dist / 200) + 1;
      map[dy][dx].meta = { maxDepth };
    }
  }

  // 5. 宝箱配置
  const chests = generateChests(map, 15);

  return { map, chests, spawnPoint };
};

/**
 * ダンジョンマップ生成（部屋と通路）
 */
export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];

  // 全体を壁で初期化
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({ x, y, type: 'wall', solid: true });
    }
    map.push(row);
  }

  // 部屋生成
  const rooms: {x: number, y: number, w: number, h: number}[] = [];
  const roomCount = 8 + Math.floor(Math.random() * 5);

  for(let i=0; i<roomCount; i++) {
    const w = 4 + Math.floor(Math.random() * 6);
    const h = 4 + Math.floor(Math.random() * 6);
    const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

    // 部屋を掘る
    rooms.push({x, y, w, h});
    for(let ry = y; ry < y + h; ry++) {
      for(let rx = x; rx < x + w; rx++) {
        map[ry][rx].type = 'dirt'; // ダンジョン床は土
        map[ry][rx].solid = false;
      }
    }
  }

  // 通路でつなぐ
  for(let i=0; i<rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i+1];
    const c1 = { x: Math.floor(r1.x + r1.w/2), y: Math.floor(r1.y + r1.h/2) };
    const c2 = { x: Math.floor(r2.x + r2.w/2), y: Math.floor(r2.y + r2.h/2) };

    // 水平 -> 垂直
    if (Math.random() > 0.5) {
      createHCorridor(map, c1.x, c2.x, c1.y);
      createVCorridor(map, c1.y, c2.y, c2.x);
    } else {
      createVCorridor(map, c1.y, c2.y, c1.x);
      createHCorridor(map, c1.x, c2.x, c2.y);
    }
  }

  // スタート地点（最初の部屋の中心）
  const startRoom = rooms[0];
  const spawnPoint = { 
    x: Math.floor(startRoom.x + startRoom.w/2) * TILE_SIZE, 
    y: Math.floor(startRoom.y + startRoom.h/2) * TILE_SIZE 
  };

  // ゴール地点（最後の部屋の中心）
  const endRoom = rooms[rooms.length - 1];
  const endX = Math.floor(endRoom.x + endRoom.w/2);
  const endY = Math.floor(endRoom.y + endRoom.h/2);

  let bossSpawn;

  if (level >= maxDepth) {
    // 最深部はボス
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    // ボス周りを少し広く
    for(let by = endY-2; by <= endY+2; by++) {
      for(let bx = endX-2; bx <= endX+2; bx++) {
        if(by>0 && by<MAP_HEIGHT-1 && bx>0 && bx<MAP_WIDTH-1) {
          map[by][bx].type = 'dirt';
          map[by][bx].solid = false;
        }
      }
    }
  } else {
    // 途中階層は下り階段
    map[endY][endX].type = 'stairs_down';
  }

  const chests = generateChests(map, 5); // ダンジョンは少なめ

  return { map, chests, spawnPoint, bossSpawn };
};

// ユーティリティ: 水平通路
const createHCorridor = (map: Tile[][], x1: number, x2: number, y: number) => {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    map[y][x].type = 'dirt';
    map[y][x].solid = false;
  }
};

// ユーティリティ: 垂直通路
const createVCorridor = (map: Tile[][], y1: number, y2: number, x: number) => {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    map[y][x].type = 'dirt';
    map[y][x].solid = false;
  }
};

// ユーティリティ: 宝箱生成
const generateChests = (map: Tile[][], count: number): Chest[] => {
  const chests: Chest[] = [];
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  
  for (let i = 0; i < count; i++) {
    let cx, cy;
    let attempts = 0;
    do {
      cx = Math.floor(Math.random() * MAP_WIDTH);
      cy = Math.floor(Math.random() * MAP_HEIGHT);
      attempts++;
    } while (map[cy][cx].solid && attempts < 100);

    if (!map[cy][cx].solid) {
      chests.push({
        id: `chest_${crypto.randomUUID()}`,
        x: cx * TILE_SIZE,
        y: cy * TILE_SIZE,
        opened: false,
        contents: [generateRandomItem(1), Math.random() > 0.5 ? generateRandomItem(1) : null].filter(Boolean) as any[]
      });
    }
  }
  return chests;
};
