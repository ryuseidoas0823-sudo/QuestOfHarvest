// ゲーム全体で使用される型定義

export type TileType = 
  | 'grass' | 'dirt' | 'wall' | 'water' | 'crop' 
  | 'mountain' | 'dungeon_entrance' | 'stairs_down' | 'portal_out'
  | 'town_entrance' | 'shop_floor';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  solid: boolean;
  cropGrowth?: number;
  meta?: any; 
}

// アイテム・装備関連
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'consumable' | 'weapon' | 'armor' | 'material';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  level: number;
  value: number;
  icon?: string;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mp?: number;
  };
  isBossDrop?: boolean;
}

export interface InventoryItem extends Item {
  instanceId: string;
}

// ワールドオブジェクト
export interface Chest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  contents: Item[];
}

export interface DroppedItem {
  id: string;
  item: Item;
  x: number;
  y: number;
  life: number;
}

// エンティティ
export type EntityType = 'player' | 'enemy' | 'item' | 'boss' | 'npc' | 'companion';
export type Job = 'Warrior' | 'Mage' | 'Archer' | 'Cleric';

// 敵の種族定義
export type EnemyRace = 
  | 'Slime' | 'Goblin' | 'Skeleton' | 'Wolf' | 'Orc' 
  | 'Ghost' | 'Golem' | 'Bat' | 'Spider' | 'Dragon';

export type EnemyRank = 'Normal' | 'Elite' | 'Boss';

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed: number;
  type: EntityType;
  dead: boolean;
}

export interface CombatEntity extends Entity {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  defense: number;
  attack: number;
  job?: Job;
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
  gold: number;
  xp: number;
  nextLevelXp: number;
}

export interface CompanionEntity extends CombatEntity {
  type: 'companion';
  joinDate: number;
}

export type NPCRole = 'inn' | 'weapon' | 'item' | 'revive' | 'recruit' | 'villager';

export interface NPCEntity extends Entity {
  type: 'npc';
  role: NPCRole;
  name: string;
  dialogue: string[];
  shopInventory?: Item[];
  recruitList?: CompanionEntity[];
}

export interface EnemyEntity extends CombatEntity {
  type: 'enemy' | 'boss';
  race: EnemyRace;      // 種族
  variant: string;      // 亜種名
  rank: EnemyRank;      // ランク
  targetId?: string | null;
  dropRate: number;
  isBoss?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// 設定・難易度
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface GameSettings {
  masterVolume: number;
  gameSpeed: number;
  difficulty: Difficulty;
}

// マップロケーション情報
export interface LocationInfo {
  type: 'world' | 'dungeon' | 'town';
  level: number;       
  maxDepth?: number;   
  dungeonId?: string;  
  difficultyMult?: number; 
  townId?: string;
  mapsSinceLastTown?: number;
}

export interface GameState {
  map: Tile[][];
  player: PlayerEntity;
  party: CompanionEntity[];
  enemies: EnemyEntity[];
  npcs: NPCEntity[];
  particles: Particle[];
  chests: Chest[];
  droppedItems: DroppedItem[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
  settings: GameSettings;
  location: LocationInfo; 
  activeShop?: NPCEntity | null;
}
