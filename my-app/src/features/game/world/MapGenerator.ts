import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest, NPCEntity, Item, EnemyEntity } from '../types';
import { generateRandomItem } from '../lib/ItemGenerator';
import { generateCompanion } from '../lib/CompanionGenerator';
import { generateEnemy } from '../lib/EnemyGenerator';

interface MapResult {
  map: Tile[][];
  chests: Chest[];
  npcs: NPCEntity[];
  spawnPoint: { x: number, y: number };
  bossSpawn?: { x: number, y: number };
}

/**
 * ワールドマップ生成
 * 敵・ダンジョン・村が配置される広いマップ
 */
export const generateWorldMap = (mapsSinceLastTown: number = 0): MapResult => {
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

  // 2. ドランカードウォークで平地生成（広さを確保）
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.55; // 55%を平地に（広め）
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  while (totalFloor < targetFloor) {
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }
    // ランダム移動
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
  }

  // 3. 地形装飾 & 壁生成
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x].type === 'grass') {
        const rand = Math.random();
        if (rand < 0.03) { map[y][x].type = 'wall'; map[y][x].solid = true; } // 壁は少なめ
        else if (rand < 0.15) { map[y][x].type = 'dirt'; }
      }
    }
  }

  // 安全地帯（スポーン地点周辺）
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

  // 4. ダンジョン入り口配置 (遠い場所に配置)
  const dungeonCount = 3 + Math.floor(Math.random() * 2);
  for(let i=0; i<dungeonCount; i++) {
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', (dist) => ({ 
      // 距離に応じて深度変化 (最低3階層、遠ければ+α)
      maxDepth: 3 + Math.floor(dist / 500) 
    }));
  }

  // 5. 村の配置判定
  // 最初のマップは必ず、それ以降はランダム
  let placeTown = false;
  if (mapsSinceLastTown === 0) {
    placeTown = true;
  } else if (mapsSinceLastTown >= 2) {
    // 2マップ目以降から確率発生、5マップ目で確定
    const chance = (mapsSinceLastTown - 1) * 0.25; 
    if (Math.random() < chance) placeTown = true;
  }

  if (placeTown) {
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }

  // 6. 宝箱 (ワールドマップはそこそこ配置)
  const chests = generateChests(map, 10);

  return { map, chests, npcs: [], spawnPoint };
};

/**
 * 村マップ生成
 * 敵なし、各種NPC配置
 */
export const generateTownMap = (playerLevel: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];
  const npcs: NPCEntity[] = [];

  // 全体を壁（柵）で囲う
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        row.push({ x, y, type: 'wall', solid: true });
      } else {
        row.push({ x, y, type: 'grass', solid: false });
      }
    }
    map.push(row);
  }

  // 中心部を舗装
  const cx = Math.floor(MAP_WIDTH / 2);
  const cy = Math.floor(MAP_HEIGHT / 2);
  for(let y = cy - 6; y <= cy + 6; y++) {
    for(let x = cx - 6; x <= cx + 6; x++) {
      map[y][x].type = 'dirt';
    }
  }

  // 出口ポータル
  map[MAP_HEIGHT-2][cx].type = 'portal_out';
  map[MAP_HEIGHT-2][cx].solid = false;
  
  // NPC配置（各役割を持ったNPCを作成）
  const roles = [
    { role: 'inn', name: 'Innkeeper', x: cx - 4, y: cy - 4 },
    { role: 'weapon', name: 'Blacksmith', x: cx + 4, y: cy - 4 },
    { role: 'item', name: 'Alchemist', x: cx - 4, y: cy + 4 },
    { role: 'revive', name: 'Priest', x: cx + 4, y: cy + 4 },
    { role: 'recruit', name: 'Guild Master', x: cx, y: cy - 6 },
  ];

  roles.forEach(r => {
    // 店の床装飾
    for(let y=r.y-1; y<=r.y+1; y++) {
      for(let x=r.x-1; x<=r.x+1; x++) {
        map[y][x].type = 'shop_floor';
      }
    }

    // 商品生成
    let inventory: Item[] = [];
    let recruits: any[] = [];

    if (r.role === 'weapon') {
      // レベル±10の装備
      for(let i=0; i<8; i++) {
        const itemLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 21) - 10);
        // 仮のランダムアイテム（実際は generateWeapon を推奨）
        inventory.push(generateRandomItem(itemLevel)); 
      }
      inventory = inventory.filter(i => i.type === 'weapon' || i.type === 'armor');
    } else if (r.role === 'item') {
      for(let i=0; i<5; i++) {
        inventory.push(generateRandomItem(playerLevel));
      }
      inventory = inventory.filter(i => i.type === 'consumable');
    } else if (r.role === 'recruit') {
      for(let i=0; i<3; i++) {
        recruits.push(generateCompanion(playerLevel));
      }
    }

    npcs.push({
      id: `npc_${r.role}`,
      type: 'npc',
      role: r.role as any,
      name: r.name,
      x: r.x * TILE_SIZE,
      y: r.y * TILE_SIZE,
      width: 24,
      height: 24,
      color: '#fff',
      speed: 0,
      dead: false,
      dialogue: ['Welcome!'],
      shopInventory: inventory,
      recruitList: recruits
    });
  });

  // 村人(Villager)も少し配置
  for(let i=0; i<3; i++) {
    const vx = cx + Math.floor((Math.random() - 0.5) * 10);
    const vy = cy + Math.floor((Math.random() - 0.5) * 10);
    if (!npcs.some(n => Math.abs(n.x - vx*TILE_SIZE) < 40 && Math.abs(n.y - vy*TILE_SIZE) < 40)) {
        npcs.push({
            id: `npc_villager_${i}`,
            type: 'npc',
            role: 'villager',
            name: 'Villager',
            x: vx * TILE_SIZE,
            y: vy * TILE_SIZE,
            width: 24,
            height: 24,
            color: '#ccc',
            speed: 0.5,
            dead: false,
            dialogue: ['Nice weather today.', 'Be careful outside.']
        });
    }
  }

  return { map, chests: [], npcs, spawnPoint: { x: cx * TILE_SIZE, y: cy * TILE_SIZE } };
};

/**
 * ダンジョンマップ生成
 * 部屋と通路、ボス、宝物殿（レア）
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
  const roomCount = 8 + Math.floor(Math.random() * 5); // 8-12部屋

  for(let i=0; i<roomCount; i++) {
    const w = 6 + Math.floor(Math.random() * 6);
    const h = 6 + Math.floor(Math.random() * 6);
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

  // スタート地点
  const startRoom = rooms[0];
  const spawnPoint = { 
    x: Math.floor(startRoom.x + startRoom.w/2) * TILE_SIZE, 
    y: Math.floor(startRoom.y + startRoom.h/2) * TILE_SIZE 
  };

  // ゴール地点
  const endRoom = rooms[rooms.length - 1];
  const endX = Math.floor(endRoom.x + endRoom.w/2);
  const endY = Math.floor(endRoom.y + endRoom.h/2);

  let bossSpawn;

  if (level >= maxDepth) {
    // 最深部はボス
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    // ボス部屋を広く整地
    for(let by = endY-3; by <= endY+3; by++) {
      for(let bx = endX-3; bx <= endX+3; bx++) {
        if(by>0 && by<MAP_HEIGHT-1 && bx>0 && bx<MAP_WIDTH-1) {
          map[by][bx].type = 'dirt';
          map[by][bx].solid = false;
        }
      }
    }
  } else {
    // 途中階層は下り階段
    if (map[endY][endX]) {
      map[endY][endX].type = 'stairs_down';
      map[endY][endX].solid = false;
    }
  }

  // 宝箱配置
  // 基本: 2～5個
  let chestCount = 2 + Math.floor(Math.random() * 4);
  const chests: Chest[] = [];

  // ★ 宝物殿 (Treasure Room) 判定
  // 5%の確率で、特定の部屋に大量の宝箱を配置
  const isTreasureRoom = Math.random() < 0.05;
  
  if (isTreasureRoom) {
    // スタートとゴール以外の部屋からランダムに選ぶ
    const targetRoomIdx = 1 + Math.floor(Math.random() * (rooms.length - 2));
    const tRoom = rooms[targetRoomIdx];
    
    if (tRoom) {
      // 宝物殿演出: 床を特別なものに変える（今回はshop_floorで代用）
      for(let ry = tRoom.y; ry < tRoom.y + tRoom.h; ry++) {
        for(let rx = tRoom.x; rx < tRoom.x + tRoom.w; rx++) {
          map[ry][rx].type = 'shop_floor';
        }
      }
      
      // 宝箱を10個前後追加
      const treasureCount = 8 + Math.floor(Math.random() * 5);
      for(let i=0; i<treasureCount; i++) {
        const tx = tRoom.x + 1 + Math.floor(Math.random() * (tRoom.w - 2));
        const ty = tRoom.y + 1 + Math.floor(Math.random() * (tRoom.h - 2));
        if (!map[ty][tx].solid) {
          chests.push(createChest(tx, ty));
        }
      }
    }
  }

  // 通常宝箱の配置
  const normalChests = generateChests(map, chestCount);
  chests.push(...normalChests);

  return { map, chests, npcs: [], spawnPoint, bossSpawn };
};

// --- Utilities ---

const createHCorridor = (map: Tile[][], x1: number, x2: number, y: number) => {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (map[y] && map[y][x]) {
      map[y][x].type = 'dirt';
      map[y][x].solid = false;
    }
  }
};

const createVCorridor = (map: Tile[][], y1: number, y2: number, x: number) => {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (map[y] && map[y][x]) {
      map[y][x].type = 'dirt';
      map[y][x].solid = false;
    }
  }
};

const placeSpecialTile = (map: Tile[][], spawn: {x:number,y:number}, type: any, metaGen: (dist:number)=>any) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  let dx, dy, dist;
  let attempts = 0;
  // 安全策: 無限ループ防止
  do {
    dx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
    dy = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
    dist = Math.sqrt((dx * TILE_SIZE - spawn.x)**2 + (dy * TILE_SIZE - spawn.y)**2);
    attempts++;
  } while ((map[dy][dx].solid || dist < 600) && attempts < 100);

  if (!map[dy][dx].solid) {
    map[dy][dx].type = type;
    map[dy][dx].meta = metaGen(dist);
  }
};

const createChest = (tx: number, ty: number): Chest => {
  const { TILE_SIZE } = GAME_CONFIG;
  return {
    id: `chest_${crypto.randomUUID()}`,
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE,
    opened: false,
    contents: [generateRandomItem(1), Math.random() > 0.7 ? generateRandomItem(1) : null].filter(Boolean) as any[]
  };
};

const generateChests = (map: Tile[][], count: number): Chest[] => {
  const chests: Chest[] = [];
  const { MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  
  for (let i = 0; i < count; i++) {
    let cx, cy;
    let attempts = 0;
    do {
      cx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
      cy = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
      attempts++;
    } while (map[cy][cx].solid && attempts < 100);

    if (!map[cy][cx].solid) {
      chests.push(createChest(cx, cy));
    }
  }
  return chests;
};
