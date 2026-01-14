// ゲーム全体で使用される型定義

export type TileType = 
  | 'grass' | 'dirt' | 'wall' | 'water' | 'crop' 
  | 'mountain' | 'dungeon_entrance' | 'stairs_down' | 'portal_out'
  | 'town_entrance' | 'shop_floor' | 'mine_entrance';

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
export type WeaponCategory = 'Sword' | 'Spear' | 'Axe' | 'Dagger' | 'Hammer' | 'Fist' | 'Pickaxe';
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
  miningPower?: number;
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
  description?: string;
  materialType?: string;
}

export interface InventoryItem extends Item {
  instanceId: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  result: Item;
  materials: { materialType: string; count: number }[];
  cost: number;
  category: 'weapon' | 'armor' | 'consumable';
  description: string;
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

export type ResourceType = 'tree' | 'rock' | 'iron_ore' | 'gold_ore';

export interface ResourceNode extends Entity {
  type: 'resource';
  resourceType: ResourceType;
  hp: number;
  maxHp: number;
  tier: number;
}

// エンティティ
export type EntityType = 'player' | 'enemy' | 'item' | 'boss' | 'npc' | 'companion' | 'resource';

export type Job = 'Swordsman' | 'Warrior' | 'Mage' | 'Archer' | 'Cleric' | 'Monk';

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
  isAttacking?: boolean;
  attackStartTime?: number;
  attackDuration?: number;
  attackDirection?: number;
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  job: Job;
  stamina: number;
  inventory: InventoryItem[];
  equipment: { mainHand?: InventoryItem; armor?: InventoryItem; accessory?: InventoryItem; };
  gold: number;
  xp: number;
  nextLevelXp: number;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  skills: { skillId: string; lastUsed: number; level: number }[];
  hotbar: (string | null)[];
}

export interface CompanionEntity extends CombatEntity {
  type: 'companion';
  joinDate: number;
}

export type NPCRole = 'inn' | 'weapon' | 'item' | 'revive' | 'recruit' | 'villager' | 'blacksmith';

export interface NPCEntity extends Entity {
  type: 'npc';
  role: NPCRole;
  name: string;
  dialogue: string[];
  shopInventory?: Item[];
  recruitList?: CompanionEntity[];
  craftingRecipes?: CraftingRecipe[];
}

export interface EnemyEntity extends CombatEntity {
  type: 'enemy' | 'boss';
  race: EnemyRace;
  variant: string;
  rank: EnemyRank;
  targetId?: string | null;
  dropRate: number;
  isBoss?: boolean;
  sightRange: number; // 視野範囲（タイル数）を追加
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

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface GameSettings {
  masterVolume: number;
  gameSpeed: number;
  difficulty: Difficulty;
}

export interface LocationInfo {
  type: 'world' | 'dungeon' | 'town' | 'mine';
  worldX: number;
  worldY: number;
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
  resources: ResourceNode[];
  particles: Particle[];
  chests: Chest[];
  droppedItems: DroppedItem[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
  settings: GameSettings;
  location: LocationInfo; 
  activeShop?: NPCEntity | null;
  activeCrafting?: NPCEntity | null;
  dialogue?: { name: string, text: string } | null;
  isPaused: boolean;
  gameTime: number;
}
