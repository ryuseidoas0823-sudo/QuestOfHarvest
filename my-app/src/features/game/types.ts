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

// 攻撃形状
export type AttackShape = 'arc' | 'line';

// 武器固有ステータス
export interface WeaponStats {
  category: WeaponCategory;
  // 攻撃属性値
  slash: number; // 斬撃
  blunt: number; // 打撃
  pierce: number; // 刺突
  
  // 挙動
  attackSpeed: number; // 攻撃間隔 (秒)
  range: number;       // 射程 (タイル数換算)
  width: number;       // 攻撃幅 (ライン幅 or 扇状の角度)
  shape: AttackShape;
  knockback: number;   // ノックバック距離 (タイル数)
  
  // 確率 (0.0 - 1.0)
  hitRate: number;
  critRate: number;
  
  // フラグ
  isDualWield?: boolean;
}

// エンチャント効果
export type EnchantType = 
  | 'stat_boost' // ステータス強化
  | 'speed_up'   // 攻撃速度上昇
  | 'magic_add'  // 魔法属性付与
  | 'extra_dmg'  // 無属性追加ダメージ
  | 'range_up'   // 攻撃距離増加
  | 'crit_rate'  // クリティカル率増加
  | 'crit_dmg'   // クリティカルダメージ増加
  | 'hit_rate'   // 命中率増加
  | 'evade'      // 回避率増加
  | 'drop_rate'; // レア泥率UP

export interface Enchantment {
  type: EnchantType;
  value: number; // % または 固定値
  tier: 'weak' | 'medium' | 'strong';
  description: string;
}

// 特殊効果（パーティ全体バフなど）
export type SpecialEffectType = 
  | 'party_atk' 
  | 'party_def' 
  | 'party_speed' 
  | 'levitate' // 浮遊
  | 'magic_resist' 
  | 'move_speed';

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
  
  // 装備詳細
  weaponStats?: WeaponStats;
  enchantments?: Enchantment[];
  specialEffect?: SpecialEffect;
  
  // 消耗品/防具用（簡易）
  stats?: {
    defense?: number;
    hp?: number;
    mp?: number;
  };
  isBossDrop?: boolean;
}

export interface InventoryItem extends Item {
  instanceId: string;
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
  attack: number; // 基礎攻撃力
  job?: Job;
  
  // 戦闘状態
  lastAttackTime?: number;
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
  equipment: {
    mainHand?: InventoryItem; // 装備中の武器
  };
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

// ...他
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

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

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface GameSettings {
  masterVolume: number;
  gameSpeed: number;
  difficulty: Difficulty;
}

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
