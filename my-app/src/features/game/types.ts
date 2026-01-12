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
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
export type ItemType = 'consumable' | 'weapon' | 'armor' | 'material';
export type WeaponCategory = 'Sword' | 'Spear' | 'Axe' | 'Dagger' | 'Hammer' | 'Fist';
export type AttackShape = 'arc' | 'line';

export interface WeaponStats {
  category: WeaponCategory;
  slash: number;
  blunt: number;
  pierce: number;
  attackSpeed: number;
  range: number;
  width: number;
  shape: AttackShape;
  knockback: number;
  hitRate: number;
  critRate: number;
  isDualWield?: boolean;
}

export type EnchantType = 'stat_boost' | 'speed_up' | 'magic_add' | 'extra_dmg' | 'range_up' | 'crit_rate' | 'crit_dmg' | 'hit_rate' | 'evade' | 'drop_rate';

export interface Enchantment {
  type: EnchantType;
  value: number;
  tier: 'weak' | 'medium' | 'strong';
  description: string;
}

export type SpecialEffectType = 'party_atk' | 'party_def' | 'party_speed' | 'levitate' | 'magic_resist' | 'move_speed';

export interface SpecialEffect {
  type: SpecialEffectType;
  value: number;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  level: number;
  value: number;
  icon?: string;
  weaponStats?: WeaponStats;
  enchantments?: Enchantment[];
  specialEffect?: SpecialEffect;
  stats?: { defense?: number; hp?: number; mp?: number; };
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
export type EnemyRace = 'Slime' | 'Goblin' | 'Skeleton' | 'Wolf' | 'Orc' | 'Ghost' | 'Golem' | 'Bat' | 'Spider' | 'Dragon';
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
  lastAttackTime?: number;
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
  equipment: { mainHand?: InventoryItem; };
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
  race: EnemyRace;
  variant: string;
  rank: EnemyRank;
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
  
  // ワールドマップ座標 (0~29)
  worldX: number;
  worldY: number;
  
  // ダンジョン深度（ワールドなら0）
  level: number;       
  maxDepth?: number;   
  dungeonId?: string;  
  difficultyMult?: number; 
  townId?: string;
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
