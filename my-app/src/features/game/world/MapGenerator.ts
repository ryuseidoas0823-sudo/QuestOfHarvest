import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest, NPCEntity, Item, ResourceNode, ResourceType, CraftingRecipe } from '../types';
import { generateRandomItem, generateMaterial } from '../lib/ItemGenerator';
import { generateCompanion } from '../lib/CompanionGenerator';

interface MapResult {
  map: Tile[][];
  chests: Chest[];
  npcs: NPCEntity[];
  resources: ResourceNode[]; // 追加
  spawnPoint: { x: number, y: number };
  bossSpawn?: { x: number, y: number };
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  center: { x: number, y: number };
}

const initMap = (width: number, height: number, defaultType: TileType, solid: boolean): Tile[][] => {
  const map: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ x, y, type: defaultType, solid });
    }
    map.push(row);
  }
  return map;
};

// --- World Map Generation ---

export const generateWorldChunk = (worldX: number, worldY: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;
  const map = initMap(MAP_WIDTH, MAP_HEIGHT, 'mountain', true);
  const resources: ResourceNode[] = [];

  // 1. 地形生成
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.60;
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  let safety = 0;
  while (totalFloor < targetFloor && safety < 100000) {
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }
    
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
    safety++;
  }

  // 2. 水場 (省略)
  // ...

  // 3. 資源配置 (木、岩)
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (!map[y][x].solid && map[y][x].type === 'grass') {
        const rand = Math.random();
        // 木の配置 (10%)
        if (rand < 0.1) {
          resources.push({
            id: `tree_${x}_${y}`, type: 'resource', resourceType: 'tree',
            x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE,
            color: '#2e7d32', speed: 0, dead: false, hp: 30, maxHp: 30, tier: 1
          });
        }
        // 岩の配置 (3%)
        else if (rand < 0.13) {
          resources.push({
            id: `rock_${x}_${y}`, type: 'resource', resourceType: 'rock',
            x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE,
            color: '#9e9e9e', speed: 0, dead: false, hp: 50, maxHp: 50, tier: 1
          });
        }
      }
    }
  }

  // 4. 接続処理 (省略)
  // ...

  // 5. 施設配置
  if (Math.random() < 0.05) {
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }
  else if (Math.random() < 0.08) {
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', () => ({ maxDepth: 5 }));
  }
  else if (Math.random() < 0.08) { // 鉱山への入り口
    placeSpecialTile(map, spawnPoint, 'mine_entrance', () => ({ maxDepth: 3 }));
  }

  const chests = generateChests(map, 5);
  return { map, chests, npcs: [], resources, spawnPoint };
};

// --- Mine Dungeon Generation ---

export const generateMineMap = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  // 鉱山は壁(岩)が多い
  let map = initMap(MAP_WIDTH, MAP_HEIGHT, 'wall', true);
  const resources: ResourceNode[] = [];

  // セル・オートマトンで洞窟生成
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (Math.random() < 0.40) { // 床率低め
        map[y][x].type = 'dirt';
        map[y][x].solid = false;
      }
    }
  }

  // 平滑化
  for (let i = 0; i < 4; i++) {
    const nextMap = JSON.parse(JSON.stringify(map));
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        let wallCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (map[y+dy][x+dx].solid) wallCount++;
          }
        }
        if (wallCount > 4) { nextMap[y][x].type = 'wall'; nextMap[y][x].solid = true; }
        else if (wallCount < 4) { nextMap[y][x].type = 'dirt'; nextMap[y][x].solid = false; }
      }
    }
    map = nextMap;
  }

  // 資源配置 (鉱石)
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (!map[y][x].solid) {
        const rand = Math.random();
        // 鉄鉱石 (5%)
        if (rand < 0.05) {
          resources.push({
            id: `iron_${x}_${y}`, type: 'resource', resourceType: 'iron_ore',
            x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE,
            color: '#795548', speed: 0, dead: false, hp: 80, maxHp: 80, tier: 2
          });
        }
        // 金鉱石 (1%, 深層のみ)
        else if (level > 2 && rand < 0.06) {
          resources.push({
            id: `gold_${x}_${y}`, type: 'resource', resourceType: 'gold_ore',
            x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE,
            color: '#ffd700', speed: 0, dead: false, hp: 120, maxHp: 120, tier: 3
          });
        }
        // 岩 (10%)
        else if (rand < 0.16) {
          resources.push({
            id: `rock_${x}_${y}`, type: 'resource', resourceType: 'rock',
            x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE,
            color: '#9e9e9e', speed: 0, dead: false, hp: 50, maxHp: 50, tier: 1
          });
        }
      }
    }
  }

  // スポーン地点とゴールの探索 (簡易)
  let startX = Math.floor(MAP_WIDTH/2), startY = Math.floor(MAP_HEIGHT/2);
  // ... (省略: 確実に床を探す処理)
  for(let r=0; r<20; r++) { if(!map[startY][startX].solid) break; startX++; }
  if(map[startY][startX].solid) { map[startY][startX].solid=false; map[startY][startX].type='dirt'; }

  const spawnPoint = { x: startX * TILE_SIZE, y: startY * TILE_SIZE };
  
  // ゴール（階段またはボス）
  let endX = startX, endY = startY;
  // 遠くを探す簡易ロジック
  for(let i=0; i<100; i++) {
      let tx = Math.floor(Math.random()*(MAP_WIDTH-2))+1;
      let ty = Math.floor(Math.random()*(MAP_HEIGHT-2))+1;
      if(!map[ty][tx].solid) { endX = tx; endY = ty; }
  }

  let bossSpawn;
  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
  } else {
    map[endY][endX].type = 'stairs_down';
  }

  const chests = generateChests(map, 3);
  return { map, chests, npcs: [], resources, spawnPoint, bossSpawn };
};

// --- Town Generation ---

export const generateTownMap = (playerLevel: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map = initMap(MAP_WIDTH, MAP_HEIGHT, 'grass', false);
  const npcs: NPCEntity[] = [];

  // 外枠
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        map[y][x].type = 'wall';
        map[y][x].solid = true;
      }
    }
  }

  const cx = Math.floor(MAP_WIDTH / 2);
  const cy = Math.floor(MAP_HEIGHT / 2);
  
  // 中央広場
  for(let y = cy - 6; y <= cy + 6; y++) {
    for(let x = cx - 6; x <= cx + 6; x++) {
      if (map[y] && map[y][x] && !map[y][x].solid) {
        map[y][x].type = 'dirt';
      }
    }
  }

  map[MAP_HEIGHT-2][cx].type = 'portal_out';
  map[MAP_HEIGHT-2][cx].solid = false;
  
  // 鍛冶屋のレシピ定義
  const blacksmithRecipes: CraftingRecipe[] = [
    { id: 'c_iron_sword', name: 'Iron Sword', category: 'weapon', cost: 100, description: 'Better than a stick.',
      result: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'uncommon', level: 5, value: 50, icon: '⚔️', weaponStats: { category: 'Sword', slash: 15, blunt: 0, pierce: 0, attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc', knockback: 1.0, hitRate: 0.95, critRate: 0.1 } },
      materials: [{ materialType: 'iron', count: 3 }, { materialType: 'wood', count: 2 }]
    },
    { id: 'c_pickaxe', name: 'Iron Pickaxe', category: 'weapon', cost: 150, description: 'Allows mining iron ore efficiently.',
      result: { id: 'iron_pick', name: 'Iron Pickaxe', type: 'weapon', rarity: 'uncommon', level: 5, value: 60, icon: '⛏️', weaponStats: { category: 'Pickaxe', slash: 5, blunt: 10, pierce: 5, attackSpeed: 0.5, range: 1.0, width: 1.0, shape: 'arc', knockback: 1.5, hitRate: 0.9, critRate: 0.05, miningPower: 2 } },
      materials: [{ materialType: 'iron', count: 4 }, { materialType: 'wood', count: 2 }]
    },
    { id: 'c_potion', name: 'Potion', category: 'consumable', cost: 10, description: 'Heals wounds.',
      result: { id: 'potion', name: 'Health Potion', type: 'consumable', rarity: 'common', level: 1, value: 20, icon: '🧪', specialEffect: { type: 'party_atk', value: 0, description: 'Heal 50 HP' } },
      materials: [{ materialType: 'wood', count: 1 }] // 仮レシピ
    }
  ];

  const roles = [
    { role: 'inn', name: 'Innkeeper', x: cx - 4, y: cy - 4 },
    { role: 'blacksmith', name: 'Blacksmith', x: cx + 4, y: cy - 4, recipes: blacksmithRecipes }, // 鍛冶屋
    { role: 'item', name: 'Alchemist', x: cx - 4, y: cy + 4 },
    { role: 'revive', name: 'Priest', x: cx + 4, y: cy + 4 },
    { role: 'recruit', name: 'Guild Master', x: cx, y: cy - 6 },
  ];

  roles.forEach(r => {
    if (r.x < 1 || r.x >= MAP_WIDTH - 1 || r.y < 1 || r.y >= MAP_HEIGHT - 1) return;
    
    for(let y=r.y-1; y<=r.y+1; y++) for(let x=r.x-1; x<=r.x+1; x++) { 
      if (map[y] && map[y][x]) map[y][x].type = 'shop_floor'; 
    }

    let inventory: Item[] = [];
    let recruits: any[] = [];

    if (r.role === 'item') {
      for(let i=0; i<5; i++) inventory.push(generateRandomItem(playerLevel));
      inventory = inventory.filter(i => i.type === 'consumable');
    } else if (r.role === 'recruit') {
      for(let i=0; i<3; i++) recruits.push(generateCompanion(playerLevel));
    }

    npcs.push({
      id: `npc_${r.role}`, type: 'npc', role: r.role as any, name: r.name,
      x: r.x * TILE_SIZE, y: r.y * TILE_SIZE, width: 24, height: 24, color: '#fff',
      speed: 0, dead: false, dialogue: ['Welcome!'], 
      shopInventory: inventory, 
      recruitList: recruits,
      craftingRecipes: r.recipes // クラフトレシピを渡す
    });
  });

  return { map, chests: [], npcs, resources: [], spawnPoint: { x: cx * TILE_SIZE, y: cy * TILE_SIZE } };
};

// --- Dungeon Generation (Room) ---
// 既存のDungeon生成はそのまま、resources: [] を返すように修正
export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  // ... (既存ロジックとほぼ同じ、ただしresources: []を追加して返す)
  // ここでは長くなるのでRoomDungeonは省略し、MineDungeonに注力
  // 実際には既存の generateRoomDungeon を呼び出し、戻り値に resources: [] を付与する
  return generateRoomDungeon(level, maxDepth);
};

const generateRoomDungeon = (level: number, maxDepth: number): MapResult => {
  // ... (既存のgenerateRoomDungeonロジックをコピーし、resources: [] を返り値に追加)
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map = initMap(MAP_WIDTH, MAP_HEIGHT, 'wall', true);
  const rooms: Room[] = [];
  const roomCount = 8 + Math.floor(Math.random() * 5);

  for(let i=0; i<roomCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const w = 6 + Math.floor(Math.random() * 8);
      const h = 6 + Math.floor(Math.random() * 8);
      const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

      const overlap = rooms.some(r => {
        return (x - 2 < r.x + r.w) && (x + w + 2 > r.x) &&
               (y - 2 < r.y + r.h) && (y + h + 2 > r.y);
      });

      if (!overlap) {
        rooms.push({ x, y, w, h, center: { x: Math.floor(x + w/2), y: Math.floor(y + h/2) } });
        for(let ry = y; ry < y + h; ry++) {
          for(let rx = x; rx < x + w; rx++) {
            map[ry][rx].type = 'dirt';
            map[ry][rx].solid = false;
          }
        }
        break;
      }
      attempts++;
    }
  }

  if (rooms.length > 1) {
    const connected = new Set<number>();
    connected.add(0);
    while (connected.size < rooms.length) {
      let minDist = Infinity;
      let r1Index = -1;
      let r2Index = -1;
      for (const uIdx of connected) {
        for (let vIdx = 0; vIdx < rooms.length; vIdx++) {
          if (connected.has(vIdx)) continue;
          const u = rooms[uIdx];
          const v = rooms[vIdx];
          const d = (u.center.x - v.center.x)**2 + (u.center.y - v.center.y)**2;
          if (d < minDist) { minDist = d; r1Index = uIdx; r2Index = vIdx; }
        }
      }
      if (r2Index !== -1) { connectRooms(map, rooms[r1Index], rooms[r2Index]); connected.add(r2Index); } else { break; }
    }
  }

  const startRoom = rooms[0];
  const spawnPoint = { x: startRoom.center.x * TILE_SIZE, y: startRoom.center.y * TILE_SIZE };
  let maxDist = 0;
  let endRoom = rooms[rooms.length - 1];
  rooms.forEach(r => {
    const d = (r.center.x - startRoom.center.x)**2 + (r.center.y - startRoom.center.y)**2;
    if (d > maxDist) { maxDist = d; endRoom = r; }
  });

  let bossSpawn;
  const endX = endRoom.center.x;
  const endY = endRoom.center.y;

  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
  } else {
    if (map[endY]?.[endX]) { map[endY][endX].type = 'stairs_down'; map[endY][endX].solid = false; }
  }

  const chests = generateChests(map, 3);
  return { map, chests, npcs: [], resources: [], spawnPoint, bossSpawn };
};

// Utilities (connectRooms, createHCorridor, etc. - 既存のまま)
const connectRooms = (map: Tile[][], r1: Room, r2: Room) => {
  const c1 = r1.center;
  const c2 = r2.center;
  if (Math.random() < 0.5) { createHCorridor(map, c1.x, c2.x, c1.y); createVCorridor(map, c1.y, c2.y, c2.x); } 
  else { createVCorridor(map, c1.y, c2.y, c1.x); createHCorridor(map, c1.x, c2.x, c2.y); }
};
const createHCorridor = (map: Tile[][], x1: number, x2: number, y: number) => {
  const start = Math.min(x1, x2); const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) { if (map[y] && map[y][x]) { map[y][x].type = 'dirt'; map[y][x].solid = false; } }
};
const createVCorridor = (map: Tile[][], y1: number, y2: number, x: number) => {
  const start = Math.min(y1, y2); const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) { if (map[y] && map[y][x]) { map[y][x].type = 'dirt'; map[y][x].solid = false; } }
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
  if (!map[dy][dx].solid) { map[dy][dx].type = type; map[dy][dx].meta = metaGen(dist); }
};
const createChest = (tx: number, ty: number): Chest => {
  const { TILE_SIZE } = GAME_CONFIG;
  return { id: `chest_${crypto.randomUUID()}`, x: tx * TILE_SIZE, y: ty * TILE_SIZE, opened: false, contents: [generateRandomItem(1)] };
};
const generateChests = (map: Tile[][], count: number): Chest[] => {
  const chests: Chest[] = [];
  const { MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  for (let i = 0; i < count; i++) {
    let cx, cy, attempts = 0;
    do { cx = Math.floor(Math.random() * (MAP_WIDTH-2))+1; cy = Math.floor(Math.random()*(MAP_HEIGHT-2))+1; attempts++; } 
    while (map[cy][cx].solid && attempts < 100);
    if (!map[cy][cx].solid) chests.push(createChest(cx, cy));
  }
  return chests;
};
