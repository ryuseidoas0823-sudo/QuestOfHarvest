// ゲーム全体で使用される型定義

export type TileType = 
  | 'grass' | 'dirt' | 'wall' | 'water' | 'crop' 
  | 'mountain' | 'dungeon_entrance' | 'stairs_down' | 'portal_out';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  solid: boolean;
  cropGrowth?: number;
  meta?: any; // ダンジョンの深さなどを保持
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
export type EntityType = 'player' | 'enemy' | 'item' | 'boss';

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
  level: number;
  defense: number;
  attack: number;
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
  xp: number;
  nextLevelXp: number;
}

export interface EnemyEntity extends CombatEntity {
  type: 'enemy' | 'boss';
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
  type: 'world' | 'dungeon';
  level: number;       // ワールドなら0、ダンジョンなら階層
  maxDepth?: number;   // ダンジョンの最大階層
  dungeonId?: string;  // 入ったダンジョンのID
  difficultyMult?: number; // ダンジョンごとの難易度倍率
}

export interface GameState {
  map: Tile[][];
  player: PlayerEntity;
  enemies: EnemyEntity[];
  particles: Particle[];
  chests: Chest[];
  droppedItems: DroppedItem[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
  settings: GameSettings;
  location: LocationInfo; // 現在の場所情報
}
