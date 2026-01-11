// ゲーム全体で使用される型定義

export type TileType = 'grass' | 'dirt' | 'wall' | 'water' | 'crop';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  solid: boolean;
  cropGrowth?: number;
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
  value: number; // 売却価格や効果量
  icon?: string; // 絵文字やアイコンID
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
  };
}

export interface InventoryItem extends Item {
  instanceId: string; // 個別識別用
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
  life: number; // 消滅までの時間
}

// エンティティ
export type EntityType = 'player' | 'enemy' | 'item';

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
  type: 'enemy';
  targetId?: string | null;
  dropRate: number; // 0.0 - 1.0
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
  masterVolume: number; // 0.0 - 1.0
  gameSpeed: number;    // 1.0, 1.5, 2.0
  difficulty: Difficulty;
}

export interface GameState {
  map: Tile[][];
  player: PlayerEntity;
  enemies: EnemyEntity[];
  particles: Particle[];
  chests: Chest[];        // 追加
  droppedItems: DroppedItem[]; // 追加
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
  settings: GameSettings; // 追加
}
