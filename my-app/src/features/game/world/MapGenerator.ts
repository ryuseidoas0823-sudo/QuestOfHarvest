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
 * 区画（チャンク）ごとのワールドマップ生成
 * worldX, worldY: 0 ~ 29 のワールド座標
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

  // 2. ドランカードウォークで地形生成
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.5;
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  let safety = 0;
  while (totalFloor < targetFloor && safety < 10000) {
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    
    // 端から1マス以内には行かない（接続処理のため確保）
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
    safety++;
  }

  // 3. 隣接区画への接続口を作成（重要）
  // ワールドの端でなければ、対応する方向のマップ端を平地にする
  const gateSize = 6; // 接続口の広さ
  const midX = Math.floor(MAP_WIDTH / 2);
  const midY = Math.floor(MAP_HEIGHT / 2);

  // 北 (上) への接続
  if (worldY > 0) {
    for (let x = midX - gateSize/2; x < midX + gateSize/2; x++) {
      for (let y = 0; y < 3; y++) { // 上端から数マス
        map[y][x].type = 'grass'; map[y][x].solid = false;
      }
    }
  }
  // 南 (下) への接続
  if (worldY < WORLD_SIZE_H - 1) {
    for (let x = midX - gateSize/2; x < midX + gateSize/2; x++) {
      for (let y = MAP_HEIGHT - 3; y < MAP_HEIGHT; y++) {
        map[y][x].type = 'grass'; map[y][x].solid = false;
      }
    }
  }
  // 西 (左) への接続
  if (worldX > 0) {
    for (let y = midY - gateSize/2; y < midY + gateSize/2; y++) {
      for (let x = 0; x < 3; x++) {
        map[y][x].type = 'grass'; map[y][x].solid = false;
      }
    }
  }
  // 東 (右) への接続
  if (worldX < WORLD_SIZE_W - 1) {
    for (let y = midY - gateSize/2; y < midY + gateSize/2; y++) {
      for (let x = MAP_WIDTH - 3; x < MAP_WIDTH; x++) {
        map[y][x].type = 'grass'; map[y][x].solid = false;
      }
    }
  }

  // 4. 地形装飾
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x].type === 'grass') {
        const rand = Math.random();
        if (rand < 0.03) { map[y][x].type = 'wall'; map[y][x].solid = true; }
        else if (rand < 0.15) { map[y][x].type = 'dirt'; }
      }
    }
  }

  // 安全地帯確保
  for(let y = -2; y <= 2; y++) {
    for(let x = -2; x <= 2; x++) {
      if (map[cy+y] && map[cy+y][cx+x]) {
        map[cy+y][cx+x].type = 'grass';
        map[cy+y][cx+x].solid = false;
      }
    }
  }

  // 5. 施設配置（ランダム）
  // 30x30=900区画あるので、確率は低めにする
  // 村: 2%
  if (Math.random() < 0.02) {
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }
  // ダンジョン: 3%
  else if (Math.random() < 0.03) {
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', () => ({ 
      maxDepth: 3 + Math.floor(Math.random() * 5) 
    }));
  }

  // 6. 宝箱
  const chests = generateChests(map, 3 + Math.floor(Math.random() * 3));

  return { map, chests, npcs: [], spawnPoint };
};

// ... generateTownMap, generateDungeonMap, createChest, generateChests は変更なし（既存のまま） ...
// (以前のコードと同じですが、generateWorldMap ではなく generateWorldChunk を使うため、このファイル内で完結させます)

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
  for(let y = cy - 5; y <= cy + 5; y++) for(let x = cx - 5; x <= cx + 5; x++) { map[y][x].type = 'dirt'; }

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
    for(let y=r.y-1; y<=r.y+1; y++) for(let x=r.x-1; x<=r.x+1; x++) { if(map[y][x]) map[y][x].type = 'shop_floor'; }
    let inventory: Item[] = [];
    let recruits: any[] = [];
    if (r.role === 'weapon') {
      for(let i=0; i<8; i++) inventory.push(generateRandomItem(playerLevel));
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

export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) { row.push({ x, y, type: 'wall', solid: true }); }
    map.push(row);
  }
  const rooms: any[] = [];
  const roomCount = 6 + Math.floor(Math.random() * 4);
  for(let i=0; i<roomCount; i++) {
    const w = 5 + Math.floor(Math.random() * 6);
    const h = 5 + Math.floor(Math.random() * 6);
    const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
    rooms.push({x, y, w, h});
    for(let ry = y; ry < y + h; ry++) for(let rx = x; rx < x + w; rx++) { map[ry][rx].type = 'dirt'; map[ry][rx].solid = false; }
  }
  for(let i=0; i<rooms.length - 1; i++) {
    const c1 = { x: Math.floor(rooms[i].x + rooms[i].w/2), y: Math.floor(rooms[i].y + rooms[i].h/2) };
    const c2 = { x: Math.floor(rooms[i+1].x + rooms[i+1].w/2), y: Math.floor(rooms[i+1].y + rooms[i+1].h/2) };
    if (Math.random() > 0.5) { createHCorridor(map, c1.x, c2.x, c1.y); createVCorridor(map, c1.y, c2.y, c2.x); }
    else { createVCorridor(map, c1.y, c2.y, c1.x); createHCorridor(map, c1.x, c2.x, c2.y); }
  }
  const startRoom = rooms[0];
  const spawnPoint = { x: Math.floor(startRoom.x + startRoom.w/2) * TILE_SIZE, y: Math.floor(startRoom.y + startRoom.h/2) * TILE_SIZE };
  const endRoom = rooms[rooms.length - 1];
  const endX = Math.floor(endRoom.x + endRoom.w/2);
  const endY = Math.floor(endRoom.y + endRoom.h/2);
  let bossSpawn;
  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    for(let by = endY-2; by <= endY+2; by++) for(let bx = endX-2; bx <= endX+2; bx++) { if(map[by] && map[by][bx]) { map[by][bx].type = 'dirt'; map[by][bx].solid = false; } }
  } else {
    if (map[endY] && map[endY][endX]) { map[endY][endX].type = 'stairs_down'; map[endY][endX].solid = false; }
  }
  // 宝物殿判定
  const chests: Chest[] = [];
  if (Math.random() < 0.05 && rooms.length > 2) {
    const tRoom = rooms[Math.floor(Math.random() * (rooms.length - 2)) + 1];
    for(let i=0; i<8; i++) {
        const tx = tRoom.x + 1 + Math.floor(Math.random() * (tRoom.w - 2));
        const ty = tRoom.y + 1 + Math.floor(Math.random() * (tRoom.h - 2));
        chests.push(createChest(tx, ty));
    }
  }
  chests.push(...generateChests(map, 3));
  return { map, chests, npcs: [], spawnPoint, bossSpawn };
};

const createHCorridor = (map: Tile[][], x1: number, x2: number, y: number) => {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { if (map[y] && map[y][x]) { map[y][x].type = 'dirt'; map[y][x].solid = false; } }
};
const createVCorridor = (map: Tile[][], y1: number, y2: number, x: number) => {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { if (map[y] && map[y][x]) { map[y][x].type = 'dirt'; map[y][x].solid = false; } }
};
const placeSpecialTile = (map: Tile[][], spawn: {x:number,y:number}, type: any, metaGen: (dist:number)=>any) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  let dx, dy, dist, attempts=0;
  do {
    dx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
    dy = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
    dist = Math.sqrt((dx * TILE_SIZE - spawn.x)**2 + (dy * TILE_SIZE - spawn.y)**2);
    attempts++;
  } while ((map[dy][dx].solid || dist < 300) && attempts < 50);
  if (!map[dy][dx].solid) { map[dy][dx].type = type; map[dy][dx].meta = metaGen(dist); }
};
const createChest = (tx: number, ty: number): Chest => {
  const { TILE_SIZE } = GAME_CONFIG;
  return {
    id: `chest_${crypto.randomUUID()}`,
    x: tx * TILE_SIZE, y: ty * TILE_SIZE,
    opened: false,
    contents: [generateRandomItem(1), Math.random() > 0.7 ? generateRandomItem(1) : null].filter(Boolean) as any[]
  };
};
const generateChests = (map: Tile[][], count: number): Chest[] => {
  const chests: Chest[] = [];
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  for (let i = 0; i < count; i++) {
    let cx, cy, attempts = 0;
    do {
      cx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
      cy = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
      attempts++;
    } while (map[cy][cx].solid && attempts < 50);
    if (!map[cy][cx].solid) chests.push(createChest(cx, cy));
  }
  return chests;
};
