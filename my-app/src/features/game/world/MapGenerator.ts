import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest, NPCEntity, Item } from '../types';
import { generateRandomItem } from '../lib/ItemGenerator';
import { generateCompanion } from '../lib/CompanionGenerator';

interface MapResult {
  map: Tile[][];
  chests: Chest[];
  npcs: NPCEntity[];
  spawnPoint: { x: number, y: number };
  bossSpawn?: { x: number, y: number };
}

/**
 * ワールドマップ生成（区画）
 */
export const generateWorldChunk = (worldX: number, worldY: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;
  const map: Tile[][] = [];

  // 1. 全体を山脈で初期化
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({ x, y, type: 'mountain', solid: true });
    }
    map.push(row);
  }

  // 2. 地形生成 (丁寧なドランカードウォーク)
  // ステップ数を増やし、より自然な形状を目指す
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.65; // 広めに確保
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  let safety = 0;
  // 試行回数を増やして確実に生成
  while (totalFloor < targetFloor && safety < 50000) {
    // 現在地を平地に
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }
    
    // ランダム移動 (重み付けなし)
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    
    // クランプ (端1マスは残す)
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
    safety++;
  }

  // 3. 隣接区画への接続口を確実に確保
  const gateSize = 4;
  const midX = Math.floor(MAP_WIDTH / 2);
  const midY = Math.floor(MAP_HEIGHT / 2);

  // 北
  if (worldY > 0) {
    for (let x = midX - gateSize; x <= midX + gateSize; x++) {
      for (let y = 0; y < 4; y++) { map[y][x].type = 'grass'; map[y][x].solid = false; }
    }
  }
  // 南
  if (worldY < WORLD_SIZE_H - 1) {
    for (let x = midX - gateSize; x <= midX + gateSize; x++) {
      for (let y = MAP_HEIGHT - 4; y < MAP_HEIGHT; y++) { map[y][x].type = 'grass'; map[y][x].solid = false; }
    }
  }
  // 西
  if (worldX > 0) {
    for (let y = midY - gateSize; y <= midY + gateSize; y++) {
      for (let x = 0; x < 4; x++) { map[y][x].type = 'grass'; map[y][x].solid = false; }
    }
  }
  // 東
  if (worldX < WORLD_SIZE_W - 1) {
    for (let y = midY - gateSize; y <= midY + gateSize; y++) {
      for (let x = MAP_WIDTH - 4; x < MAP_WIDTH; x++) { map[y][x].type = 'grass'; map[y][x].solid = false; }
    }
  }

  // 4. 地形装飾 (スムージング的な処理は省略するが、壁を適度に配置)
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (map[y][x].type === 'grass') {
        // 周囲がすべて山ならここも山に戻す（ノイズ除去）
        let mountainCount = 0;
        if (map[y-1][x].type === 'mountain') mountainCount++;
        if (map[y+1][x].type === 'mountain') mountainCount++;
        if (map[y][x-1].type === 'mountain') mountainCount++;
        if (map[y][x+1].type === 'mountain') mountainCount++;
        
        if (mountainCount >= 3) {
           map[y][x].type = 'mountain';
           map[y][x].solid = true;
        } else {
           // 装飾
           const rand = Math.random();
           if (rand < 0.03) { map[y][x].type = 'wall'; map[y][x].solid = true; }
           else if (rand < 0.15) { map[y][x].type = 'dirt'; }
        }
      }
    }
  }

  // 安全地帯
  for(let y = -3; y <= 3; y++) {
    for(let x = -3; x <= 3; x++) {
      const tx = Math.floor(spawnPoint.x / TILE_SIZE) + x;
      const ty = Math.floor(spawnPoint.y / TILE_SIZE) + y;
      if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        map[ty][tx].type = 'grass';
        map[ty][tx].solid = false;
      }
    }
  }

  // 5. 施設配置
  // 少し確率を上げて配置しやすくする
  if (Math.random() < 0.05) { // 5%
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }
  else if (Math.random() < 0.08) { // 8%
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', () => ({ 
      maxDepth: 3 + Math.floor(Math.random() * 5) 
    }));
  }

  const chests = generateChests(map, 5);

  return { map, chests, npcs: [], spawnPoint };
};

// ... generateTownMap は既存ロジックが良いのでそのまま ...
export const generateTownMap = (playerLevel: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];
  const npcs: NPCEntity[] = [];

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

  const cx = Math.floor(MAP_WIDTH / 2);
  const cy = Math.floor(MAP_HEIGHT / 2);
  
  for(let y = cy - 6; y <= cy + 6; y++) {
    for(let x = cx - 6; x <= cx + 6; x++) {
      if (y >= 1 && y < MAP_HEIGHT-1 && x >= 1 && x < MAP_WIDTH-1) {
        map[y][x].type = 'dirt';
      }
    }
  }

  map[MAP_HEIGHT-2][cx].type = 'portal_out';
  map[MAP_HEIGHT-2][cx].solid = false;
  
  const roles = [
    { role: 'inn', name: 'Innkeeper', x: cx - 4, y: cy - 4 },
    { role: 'weapon', name: 'Blacksmith', x: cx + 4, y: cy - 4 },
    { role: 'item', name: 'Alchemist', x: cx - 4, y: cy + 4 },
    { role: 'revive', name: 'Priest', x: cx + 4, y: cy + 4 },
    { role: 'recruit', name: 'Guild Master', x: cx, y: cy - 6 },
  ];

  roles.forEach(r => {
    if (r.x < 1 || r.x >= MAP_WIDTH - 1 || r.y < 1 || r.y >= MAP_HEIGHT - 1) return;
    for(let y=r.y-1; y<=r.y+1; y++) for(let x=r.x-1; x<=r.x+1; x++) { if (map[y] && map[y][x]) map[y][x].type = 'shop_floor'; }

    let inventory: Item[] = [];
    let recruits: any[] = [];

    if (r.role === 'weapon') {
      for(let i=0; i<6; i++) {
        const itemLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 11) - 5);
        inventory.push(generateRandomItem(itemLevel)); 
      }
      inventory = inventory.filter(i => i.type === 'weapon' || i.type === 'armor');
    } else if (r.role === 'item') {
      for(let i=0; i<5; i++) inventory.push(generateRandomItem(playerLevel));
      inventory = inventory.filter(i => i.type === 'consumable');
    } else if (r.role === 'recruit') {
      for(let i=0; i<3; i++) recruits.push(generateCompanion(playerLevel));
    }

    npcs.push({
      id: `npc_${r.role}`, type: 'npc', role: r.role as any, name: r.name,
      x: r.x * TILE_SIZE, y: r.y * TILE_SIZE, width: 24, height: 24, color: '#fff',
      speed: 0, dead: false, dialogue: ['Welcome!'], shopInventory: inventory, recruitList: recruits
    });
  });

  return { map, chests: [], npcs, spawnPoint: { x: cx * TILE_SIZE, y: cy * TILE_SIZE } };
};

/**
 * ダンジョンマップ生成（強化版）
 * 部屋の重なり防止と、確実な接続を行う
 */
export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];

  // 壁で初期化
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({ x, y, type: 'wall', solid: true });
    }
    map.push(row);
  }

  const rooms: {x: number, y: number, w: number, h: number}[] = [];
  const roomCount = 6 + Math.floor(Math.random() * 4); // 6-9部屋

  // 部屋配置 (重なりチェック付き)
  for(let i=0; i<roomCount; i++) {
    let attempts = 0;
    let placed = false;
    while (!placed && attempts < 50) {
      const w = 5 + Math.floor(Math.random() * 6); // 5-10
      const h = 5 + Math.floor(Math.random() * 6);
      const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

      // 重なりチェック
      const overlap = rooms.some(r => {
        return (x < r.x + r.w + 1) && (x + w + 1 > r.x) &&
               (y < r.y + r.h + 1) && (y + h + 1 > r.y);
      });

      if (!overlap) {
        rooms.push({x, y, w, h});
        // 部屋を掘る
        for(let ry = y; ry < y + h; ry++) {
          for(let rx = x; rx < x + w; rx++) {
            if (map[ry] && map[ry][rx]) {
              map[ry][rx].type = 'dirt';
              map[ry][rx].solid = false;
            }
          }
        }
        placed = true;
      }
      attempts++;
    }
  }

  // 部屋をソートして接続しやすくする（左上から順になど）
  // ここでは単純に配列順につなぐが、部屋生成時にある程度分散していればOK
  
  // 通路生成
  for(let i=0; i<rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i+1];
    const c1 = { x: Math.floor(r1.x + r1.w/2), y: Math.floor(r1.y + r1.h/2) };
    const c2 = { x: Math.floor(r2.x + r2.w/2), y: Math.floor(r2.y + r2.h/2) };

    if (Math.random() > 0.5) {
      createHCorridor(map, c1.x, c2.x, c1.y);
      createVCorridor(map, c1.y, c2.y, c2.x);
    } else {
      createVCorridor(map, c1.y, c2.y, c1.x);
      createHCorridor(map, c1.x, c2.x, c2.y);
    }
  }

  // スタート・ゴール
  const startRoom = rooms[0];
  const spawnPoint = { 
    x: Math.floor(startRoom.x + startRoom.w/2) * TILE_SIZE, 
    y: Math.floor(startRoom.y + startRoom.h/2) * TILE_SIZE 
  };

  const endRoom = rooms[rooms.length - 1];
  const endX = Math.floor(endRoom.x + endRoom.w/2);
  const endY = Math.floor(endRoom.y + endRoom.h/2);

  let bossSpawn;

  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    // ボスエリア拡張
    for(let by = endY-3; by <= endY+3; by++) {
      for(let bx = endX-3; bx <= endX+3; bx++) {
        if(map[by] && map[by][bx] && by > 0 && by < MAP_HEIGHT-1 && bx > 0 && bx < MAP_WIDTH-1) {
          map[by][bx].type = 'dirt';
          map[by][bx].solid = false;
        }
      }
    }
  } else {
    if (map[endY] && map[endY][endX]) {
      map[endY][endX].type = 'stairs_down';
      map[endY][endX].solid = false;
    }
  }

  // 宝物殿判定
  const chests: Chest[] = [];
  if (Math.random() < 0.05 && rooms.length > 3) {
    // スタート・ゴール以外
    const targetRoomIdx = 1 + Math.floor(Math.random() * (rooms.length - 2));
    const tRoom = rooms[targetRoomIdx];
    
    // 床変更
    for(let ry = tRoom.y; ry < tRoom.y + tRoom.h; ry++) {
      for(let rx = tRoom.x; rx < tRoom.x + tRoom.w; rx++) {
        map[ry][rx].type = 'shop_floor';
      }
    }
    
    for(let i=0; i<6; i++) {
        const tx = tRoom.x + 1 + Math.floor(Math.random() * (tRoom.w - 2));
        const ty = tRoom.y + 1 + Math.floor(Math.random() * (tRoom.h - 2));
        if (!map[ty][tx].solid) chests.push(createChest(tx, ty));
    }
  }

  chests.push(...generateChests(map, 3));

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
  
  do {
    dx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
    dy = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
    dist = Math.sqrt((dx * TILE_SIZE - spawn.x)**2 + (dy * TILE_SIZE - spawn.y)**2);
    attempts++;
  } while ((map[dy][dx].solid || dist < 300) && attempts < 100);

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
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  
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
