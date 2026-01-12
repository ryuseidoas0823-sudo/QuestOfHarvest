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

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  center: { x: number, y: number };
}

/**
 * マップ配列を初期化するヘルパー
 */
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

/**
 * ワールドマップ生成（区画）
 * - ドランカードウォークによる地形生成
 * - 水場の追加
 */
export const generateWorldChunk = (worldX: number, worldY: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;
  const map = initMap(MAP_WIDTH, MAP_HEIGHT, 'mountain', true);

  // 1. 地形生成 (ドランカードウォーク)
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
    
    // ランダム移動
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
    safety++;
  }

  // 2. 水場の生成（プチ・ドランカードウォーク）
  // ランダムな位置から少しだけ水を広げる
  const lakeCount = Math.floor(Math.random() * 3); // 0~2個の池
  for (let i = 0; i < lakeCount; i++) {
    let lx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
    let ly = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
    let waterSize = 0;
    const targetWater = 20 + Math.floor(Math.random() * 30);
    
    // 平地からスタートする場合のみ生成
    if (!map[ly][lx].solid) {
      let wSafety = 0;
      while (waterSize < targetWater && wSafety < 500) {
        if (map[ly][lx].type !== 'water' && !map[ly][lx].solid) {
          map[ly][lx].type = 'water';
          map[ly][lx].solid = true; // 水は通れない
          waterSize++;
        }
        const dir = Math.floor(Math.random() * 4);
        if (dir === 0) lx++; else if (dir === 1) lx--; else if (dir === 2) ly++; else if (dir === 3) ly--;
        lx = Math.max(1, Math.min(MAP_WIDTH - 2, lx));
        ly = Math.max(1, Math.min(MAP_HEIGHT - 2, ly));
        wSafety++;
      }
    }
  }

  // 3. 隣接区画への接続口を確保
  const gateSize = 4;
  const midX = Math.floor(MAP_WIDTH / 2);
  const midY = Math.floor(MAP_HEIGHT / 2);

  const digGate = (startX: number, endX: number, startY: number, endY: number) => {
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (map[y] && map[y][x]) {
          map[y][x].type = 'grass';
          map[y][x].solid = false;
        }
      }
    }
  };

  if (worldY > 0) digGate(midX - gateSize, midX + gateSize, 0, 3); // 北
  if (worldY < WORLD_SIZE_H - 1) digGate(midX - gateSize, midX + gateSize, MAP_HEIGHT - 4, MAP_HEIGHT - 1); // 南
  if (worldX > 0) digGate(0, 3, midY - gateSize, midY + gateSize); // 西
  if (worldX < WORLD_SIZE_W - 1) digGate(MAP_WIDTH - 4, MAP_WIDTH - 1, midY - gateSize, midY + gateSize); // 東

  // 4. 地形装飾 & ノイズ除去
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (map[y][x].type === 'grass') {
        // 孤立した床を消す（周囲がほとんど山なら山に戻す）
        let mountainCount = 0;
        if (map[y-1][x].solid) mountainCount++;
        if (map[y+1][x].solid) mountainCount++;
        if (map[y][x-1].solid) mountainCount++;
        if (map[y][x+1].solid) mountainCount++;
        
        if (mountainCount >= 3) {
           map[y][x].type = 'mountain';
           map[y][x].solid = true;
        } else {
           // 装飾: 稀に壁や土
           const rand = Math.random();
           if (rand < 0.02) { map[y][x].type = 'wall'; map[y][x].solid = true; } // 岩
           else if (rand < 0.15) { map[y][x].type = 'dirt'; }
        }
      }
    }
  }

  // 5. 安全地帯確保 (スポーン地点周辺は必ず歩けるように)
  const sx = Math.floor(spawnPoint.x / TILE_SIZE);
  const sy = Math.floor(spawnPoint.y / TILE_SIZE);
  for(let y = -2; y <= 2; y++) {
    for(let x = -2; x <= 2; x++) {
      if (map[sy+y] && map[sy+y][sx+x]) {
        map[sy+y][sx+x].type = 'grass';
        map[sy+y][sx+x].solid = false;
      }
    }
  }

  // 6. 施設配置
  if (Math.random() < 0.05) {
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }
  else if (Math.random() < 0.08) {
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', () => ({ 
      maxDepth: 3 + Math.floor(Math.random() * 5) 
    }));
  }

  const chests = generateChests(map, 5);

  return { map, chests, npcs: [], spawnPoint };
};

/**
 * 村マップ生成
 * - 固定レイアウトに近い安全地帯
 */
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

  // 出口
  map[MAP_HEIGHT-2][cx].type = 'portal_out';
  map[MAP_HEIGHT-2][cx].solid = false;
  
  // NPC配置定義
  const roles = [
    { role: 'inn', name: 'Innkeeper', x: cx - 4, y: cy - 4 },
    { role: 'weapon', name: 'Blacksmith', x: cx + 4, y: cy - 4 },
    { role: 'item', name: 'Alchemist', x: cx - 4, y: cy + 4 },
    { role: 'revive', name: 'Priest', x: cx + 4, y: cy + 4 },
    { role: 'recruit', name: 'Guild Master', x: cx, y: cy - 6 },
  ];

  roles.forEach(r => {
    if (r.x < 1 || r.x >= MAP_WIDTH - 1 || r.y < 1 || r.y >= MAP_HEIGHT - 1) return;
    
    // 店の床
    for(let y=r.y-1; y<=r.y+1; y++) for(let x=r.x-1; x<=r.x+1; x++) { 
      if (map[y] && map[y][x]) map[y][x].type = 'shop_floor'; 
    }

    // 商品生成
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
 * ダンジョン生成（統合版）
 * - 確率で「部屋連結タイプ」か「洞窟タイプ」かを選択
 */
export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  // 30%の確率で洞窟、70%で部屋ダンジョン
  if (Math.random() < 0.3) {
    return generateCaveDungeon(level, maxDepth);
  } else {
    return generateRoomDungeon(level, maxDepth);
  }
};


/**
 * A. 部屋連結型ダンジョン生成
 * - 部屋を配置し、近い部屋同士を接続する
 */
const generateRoomDungeon = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map = initMap(MAP_WIDTH, MAP_HEIGHT, 'wall', true);
  const rooms: Room[] = [];
  const roomCount = 8 + Math.floor(Math.random() * 5); // 8-12部屋

  // 1. 部屋配置 (重なりチェック付き)
  for(let i=0; i<roomCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const w = 6 + Math.floor(Math.random() * 8); // 6-13
      const h = 6 + Math.floor(Math.random() * 8);
      const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

      // 余白を持って重なりチェック
      const overlap = rooms.some(r => {
        return (x - 2 < r.x + r.w) && (x + w + 2 > r.x) &&
               (y - 2 < r.y + r.h) && (y + h + 2 > r.y);
      });

      if (!overlap) {
        rooms.push({ x, y, w, h, center: { x: Math.floor(x + w/2), y: Math.floor(y + h/2) } });
        // 部屋を掘る
        for(let ry = y; ry < y + h; ry++) {
          for(let rx = x; rx < x + w; rx++) {
            map[ry][rx].type = 'dirt';
            map[ry][rx].solid = false;
          }
        }
        break; // 配置成功
      }
      attempts++;
    }
  }

  // 2. 部屋の接続 (最小全域木ライクなアプローチ: 各部屋から最も近い部屋につなぐ)
  // これにより、遠くの部屋への不自然な一本道を減らす
  if (rooms.length > 1) {
    // 連結を確認するためのセット
    const connected = new Set<number>();
    connected.add(0); // 最初の部屋を開始点とする

    // 全ての部屋が連結されるまで繰り返す（簡易的なプリム法）
    while (connected.size < rooms.length) {
      let minDist = Infinity;
      let r1Index = -1;
      let r2Index = -1;

      // 「連結済みグループ」に含まれる部屋(u)と、含まれない部屋(v)の間で、最短距離を探す
      for (const uIdx of connected) {
        for (let vIdx = 0; vIdx < rooms.length; vIdx++) {
          if (connected.has(vIdx)) continue;
          
          const u = rooms[uIdx];
          const v = rooms[vIdx];
          const d = (u.center.x - v.center.x)**2 + (u.center.y - v.center.y)**2;
          
          if (d < minDist) {
            minDist = d;
            r1Index = uIdx;
            r2Index = vIdx;
          }
        }
      }

      if (r2Index !== -1) {
        connectRooms(map, rooms[r1Index], rooms[r2Index]);
        connected.add(r2Index);
      } else {
        break; // 万が一孤立したらループ抜け
      }
    }

    // さらにランダムに数本通路を追加して、ループ構造を作る（探索の面白さアップ）
    for(let i=0; i<3; i++) {
      const r1 = rooms[Math.floor(Math.random() * rooms.length)];
      const r2 = rooms[Math.floor(Math.random() * rooms.length)];
      if (r1 !== r2) connectRooms(map, r1, r2);
    }
  }

  // 3. スタート・ゴール・宝箱
  const startRoom = rooms[0];
  const spawnPoint = { 
    x: startRoom.center.x * TILE_SIZE, 
    y: startRoom.center.y * TILE_SIZE 
  };

  // 一番遠い部屋をゴールにする
  let maxDist = 0;
  let endRoom = rooms[rooms.length - 1];
  rooms.forEach(r => {
    const d = (r.center.x - startRoom.center.x)**2 + (r.center.y - startRoom.center.y)**2;
    if (d > maxDist) {
      maxDist = d;
      endRoom = r;
    }
  });

  let bossSpawn;
  const endX = endRoom.center.x;
  const endY = endRoom.center.y;

  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    // ボス部屋装飾
    for(let by = endY-2; by <= endY+2; by++) {
      for(let bx = endX-2; bx <= endX+2; bx++) {
        if(map[by]?.[bx] && !map[by][bx].solid) map[by][bx].type = 'shop_floor'; // 床を変える
      }
    }
  } else {
    if (map[endY]?.[endX]) {
      map[endY][endX].type = 'stairs_down';
      map[endY][endX].solid = false;
    }
  }

  const chests = generateChests(map, 3 + Math.floor(Math.random() * 3));

  return { map, chests, npcs: [], spawnPoint, bossSpawn };
};

/**
 * B. 洞窟タイプダンジョン生成 (セル・オートマトン)
 */
const generateCaveDungeon = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  let map = initMap(MAP_WIDTH, MAP_HEIGHT, 'wall', true);

  // 1. ランダムに床を撒く (初期化)
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      // 45%の確率で床にする
      if (Math.random() < 0.45) {
        map[y][x].type = 'dirt';
        map[y][x].solid = false;
      }
    }
  }

  // 2. セル・オートマトンによる平滑化 (数回繰り返す)
  // ルール: 周囲の壁が4つより多ければ壁になる、そうでなければ床になる
  for (let i = 0; i < 5; i++) {
    const nextMap = JSON.parse(JSON.stringify(map)); // Deep copy
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        let wallCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (map[y+dy][x+dx].solid) wallCount++;
          }
        }
        
        if (wallCount > 4) {
          nextMap[y][x].type = 'wall';
          nextMap[y][x].solid = true;
        } else if (wallCount < 4) {
          nextMap[y][x].type = 'dirt';
          nextMap[y][x].solid = false;
        }
      }
    }
    map = nextMap;
  }

  // 3. 孤立エリアの除去 & 接続確認は省略（簡易実装のため）
  // 実用的な洞窟にするには、ここで「最大の床領域」以外を埋める処理を入れると良い
  // 今回は簡易的に、スポーン地点からDFSで到達できない場所を埋める

  // スポーン候補を探す（中央付近の床）
  let startX = Math.floor(MAP_WIDTH / 2);
  let startY = Math.floor(MAP_HEIGHT / 2);
  let searchRadius = 0;
  let found = false;
  while (!found && searchRadius < 20) {
    for(let y = startY - searchRadius; y <= startY + searchRadius; y++) {
      for(let x = startX - searchRadius; x <= startX + searchRadius; x++) {
        if(map[y]?.[x] && !map[y][x].solid) {
          startX = x; startY = y; found = true; break;
        }
      }
      if(found) break;
    }
    searchRadius++;
  }
  
  if (!found) { 
    // 万が一床がなければ無理やり空ける
    map[startY][startX].type = 'dirt';
    map[startY][startX].solid = false;
  }

  // 到達可能領域のチェック (Flood Fill)
  const visited = new Set<string>();
  const stack = [{x: startX, y: startY}];
  visited.add(`${startX},${startY}`);
  const floorTiles: {x:number, y:number}[] = [];

  while(stack.length > 0) {
    const {x, y} = stack.pop()!;
    floorTiles.push({x, y});

    [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if(nx>=0 && nx<MAP_WIDTH && ny>=0 && ny<MAP_HEIGHT && !map[ny][nx].solid && !visited.has(`${nx},${ny}`)) {
        visited.add(`${nx},${ny}`);
        stack.push({x: nx, y: ny});
      }
    });
  }

  // 到達できなかった床を壁にする（孤立除去）
  for(let y=0; y<MAP_HEIGHT; y++) {
    for(let x=0; x<MAP_WIDTH; x++) {
      if (!map[y][x].solid && !visited.has(`${x},${y}`)) {
        map[y][x].type = 'wall';
        map[y][x].solid = true;
      }
    }
  }

  // ゴール地点（スポーンから一番遠い到達可能な床）
  let maxDist = 0;
  let goal = { x: startX, y: startY };
  floorTiles.forEach(p => {
    const d = (p.x - startX)**2 + (p.y - startY)**2;
    if (d > maxDist) {
      maxDist = d;
      goal = p;
    }
  });

  let bossSpawn;
  if (level >= maxDepth) {
    bossSpawn = { x: goal.x * TILE_SIZE, y: goal.y * TILE_SIZE };
    // 周囲を少し広げる
    for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) {
      if(map[goal.y+dy]?.[goal.x+dx]) { map[goal.y+dy][goal.x+dx].solid = false; map[goal.y+dy][goal.x+dx].type = 'shop_floor'; }
    }
  } else {
    map[goal.y][goal.x].type = 'stairs_down';
    map[goal.y][goal.x].solid = false;
  }

  const spawnPoint = { x: startX * TILE_SIZE, y: startY * TILE_SIZE };
  const chests = generateChests(map, 4); // 洞窟は宝多め

  return { map, chests, npcs: [], spawnPoint, bossSpawn };
};

// --- Utilities ---

/**
 * 2つの部屋を通路でつなぐ（L字型）
 */
const connectRooms = (map: Tile[][], r1: Room, r2: Room) => {
  const c1 = r1.center;
  const c2 = r2.center;

  // 50%の確率で「横->縦」か「縦->横」かを変える
  if (Math.random() < 0.5) {
    createHCorridor(map, c1.x, c2.x, c1.y);
    createVCorridor(map, c1.y, c2.y, c2.x);
  } else {
    createVCorridor(map, c1.y, c2.y, c1.x);
    createHCorridor(map, c1.x, c2.x, c2.y);
  }
};

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
