import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest, NPCEntity, Item, EnemyEntity } from '../types';
import { generateRandomItem } from '../lib/ItemGenerator';
import { generateCompanion } from '../lib/CompanionGenerator';
import { generateEnemy } from '../lib/EnemyGenerator'; // 変更

interface MapResult {
  map: Tile[][];
  chests: Chest[];
  npcs: NPCEntity[];
  spawnPoint: { x: number, y: number };
  bossSpawn?: { x: number, y: number };
}

// ... generateWorldMap, generateTownMap は既存のまま ...
// (省略: 上記関数に変更はありませんが、importの変更だけ反映してください)

// ワールドマップ生成 (省略なし版が必要であれば言ってください、ここではimport変更が主)
// ...

/**
 * ワールドマップ生成
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

  // 2. ドランカードウォークで平地生成
  let totalFloor = 0;
  const targetFloor = (MAP_WIDTH * MAP_HEIGHT) * 0.45;
  
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const spawnPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };

  while (totalFloor < targetFloor) {
    if (map[cy][cx].type === 'mountain') {
      map[cy][cx].type = 'grass';
      map[cy][cx].solid = false;
      totalFloor++;
    }
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else if (dir === 3) cy--;
    cx = Math.max(1, Math.min(MAP_WIDTH - 2, cx));
    cy = Math.max(1, Math.min(MAP_HEIGHT - 2, cy));
  }

  // 3. 地形装飾
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (map[y][x].type === 'grass') {
        const rand = Math.random();
        if (rand < 0.05) { map[y][x].type = 'wall'; map[y][x].solid = true; }
        else if (rand < 0.15) { map[y][x].type = 'dirt'; }
      }
    }
  }

  // 安全地帯
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
  const dungeonCount = 3;
  for(let i=0; i<dungeonCount; i++) {
    placeSpecialTile(map, spawnPoint, 'dungeon_entrance', (dist) => ({ maxDepth: Math.floor(dist / 300) + 2 }));
  }

  // 5. 村の配置判定
  let placeTown = false;
  if (mapsSinceLastTown === 0) {
    placeTown = true;
  } else if (mapsSinceLastTown >= 2) {
    const chance = (mapsSinceLastTown - 1) * 0.25;
    if (Math.random() < chance) placeTown = true;
  }

  if (placeTown) {
    placeSpecialTile(map, spawnPoint, 'town_entrance', () => ({}));
  }

  // 宝箱
  const chests = generateChests(map, 10);

  return { map, chests, npcs: [], spawnPoint };
};

// ... generateTownMap, placeSpecialTile は変更なし ...
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
  for(let y = cy - 5; y <= cy + 5; y++) {
    for(let x = cx - 5; x <= cx + 5; x++) {
      map[y][x].type = 'dirt';
    }
  }

  map[MAP_HEIGHT-2][cx].type = 'portal_out';
  
  const roles = [
    { role: 'inn', name: 'Innkeeper', x: cx - 4, y: cy - 4 },
    { role: 'weapon', name: 'Blacksmith', x: cx + 4, y: cy - 4 },
    { role: 'item', name: 'Alchemist', x: cx - 4, y: cy + 4 },
    { role: 'revive', name: 'Priest', x: cx + 4, y: cy + 4 },
    { role: 'recruit', name: 'Guild Master', x: cx, y: cy - 6 },
  ];

  roles.forEach(r => {
    for(let y=r.y-1; y<=r.y+1; y++) {
      for(let x=r.x-1; x<=r.x+1; x++) {
        map[y][x].type = 'shop_floor';
      }
    }

    let inventory: Item[] = [];
    let recruits: any[] = [];

    if (r.role === 'weapon') {
      for(let i=0; i<8; i++) {
        const itemLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 21) - 10);
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

  return { map, chests: [], npcs, spawnPoint: { x: cx * TILE_SIZE, y: cy * TILE_SIZE } };
};

const placeSpecialTile = (map: Tile[][], spawn: {x:number,y:number}, type: any, metaGen: (dist:number)=>any) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  let dx, dy, dist;
  let attempts = 0;
  do {
    dx = Math.floor(Math.random() * MAP_WIDTH);
    dy = Math.floor(Math.random() * MAP_HEIGHT);
    dist = Math.sqrt((dx * TILE_SIZE - spawn.x)**2 + (dy * TILE_SIZE - spawn.y)**2);
    attempts++;
  } while ((map[dy][dx].solid || dist < 400) && attempts < 200);

  if (!map[dy][dx].solid) {
    map[dy][dx].type = type;
    map[dy][dx].meta = metaGen(dist);
  }
};

// generateDungeonMap
export const generateDungeonMap = (level: number, maxDepth: number): MapResult => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const map: Tile[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) { row.push({ x, y, type: 'wall', solid: true }); }
    map.push(row);
  }
  const rooms: any[] = [];
  const roomCount = 8;
  for(let i=0; i<roomCount; i++) {
    const w = 5 + Math.floor(Math.random() * 5);
    const h = 5 + Math.floor(Math.random() * 5);
    const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
    rooms.push({x, y, w, h});
    for(let ry=y; ry<y+h; ry++) for(let rx=x; rx<x+w; rx++) { map[ry][rx].type = 'dirt'; map[ry][rx].solid = false; }
  }
  for(let i=0; i<rooms.length-1; i++) {
    const c1 = {x: Math.floor(rooms[i].x+rooms[i].w/2), y: Math.floor(rooms[i].y+rooms[i].h/2)};
    const c2 = {x: Math.floor(rooms[i+1].x+rooms[i+1].w/2), y: Math.floor(rooms[i+1].y+rooms[i+1].h/2)};
    const minX=Math.min(c1.x,c2.x), maxX=Math.max(c1.x,c2.x);
    for(let x=minX; x<=maxX; x++) { map[c1.y][x].type='dirt'; map[c1.y][x].solid=false; }
    const minY=Math.min(c1.y,c2.y), maxY=Math.max(c1.y,c2.y);
    for(let y=minY; y<=maxY; y++) { map[y][c2.x].type='dirt'; map[y][c2.x].solid=false; }
  }

  const startRoom = rooms[0];
  const spawnPoint = { x: Math.floor(startRoom.x+startRoom.w/2)*TILE_SIZE, y: Math.floor(startRoom.y+startRoom.h/2)*TILE_SIZE };
  const endRoom = rooms[rooms.length-1];
  const endX = Math.floor(endRoom.x+endRoom.w/2);
  const endY = Math.floor(endRoom.y+endRoom.h/2);
  let bossSpawn;
  if (level >= maxDepth) {
    bossSpawn = { x: endX * TILE_SIZE, y: endY * TILE_SIZE };
    for(let by=endY-2; by<=endY+2; by++) for(let bx=endX-2; bx<=endX+2; bx++) {
       if(by>0 && by<MAP_HEIGHT-1 && bx>0 && bx<MAP_WIDTH-1) { map[by][bx].type='dirt'; map[by][bx].solid=false; }
    }
  } else {
    map[endY][endX].type = 'stairs_down';
  }
  
  return { map, chests: [], npcs: [], spawnPoint, bossSpawn };
};

const generateChests = (map: Tile[][], count: number): Chest[] => {
  const chests: Chest[] = [];
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  for (let i = 0; i < count; i++) {
    let cx, cy, attempts = 0;
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
        contents: [generateRandomItem(1)]
      });
    }
  }
  return chests;
};
