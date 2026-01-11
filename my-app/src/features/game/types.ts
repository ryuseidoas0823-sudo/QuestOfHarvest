// ゲーム全体で使用される型定義

export type TileType = 
  | 'grass' | 'dirt' | 'wall' | 'water' | 'crop' 
  | 'mountain' | 'dungeon_entrance' | 'stairs_down' | 'portal_out'
  | 'town_entrance' | 'shop_floor'; // 村関連追加

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
    mp?: number; // MP追加
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
export type Job = 'Warrior' | 'Mage' | 'Archer' | 'Cleric'; // 職業

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
  mp: number;     // MP追加
  maxMp: number;  // 最大MP追加
  level: number;
  defense: number;
  attack: number;
  job?: Job; // 職業
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
  gold: number; // お金追加
  xp: number;
  nextLevelXp: number;
}

export interface CompanionEntity extends CombatEntity {
  type: 'companion';
  joinDate: number; // 加入日（古株判定など）
}

export type NPCRole = 'inn' | 'weapon' | 'item' | 'revive' | 'recruit' | 'villager';

export interface NPCEntity extends Entity {
  type: 'npc';
  role: NPCRole;
  name: string;
  dialogue: string[];
  shopInventory?: Item[]; // 店の商品
  recruitList?: CompanionEntity[]; // 紹介屋のリスト
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
  type: 'world' | 'dungeon' | 'town'; // town追加
  level: number;       
  maxDepth?: number;   
  dungeonId?: string;  
  difficultyMult?: number; 
  townId?: string; // 村ID
  mapsSinceLastTown?: number; // 最後の村から何マップ経過したか
}

export interface GameState {
  map: Tile[][];
  player: PlayerEntity;
  party: CompanionEntity[]; // パーティーメンバー（仲間）
  enemies: EnemyEntity[];
  npcs: NPCEntity[]; // NPCリスト追加
  particles: Particle[];
  chests: Chest[];
  droppedItems: DroppedItem[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
  settings: GameSettings;
  location: LocationInfo; 
  activeShop?: NPCEntity | null; // 現在開いているショップ
}
