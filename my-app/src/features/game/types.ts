// ゲーム全体で使用される型定義をここに集約します
// 循環参照を防ぐため、ロジックを含まない純粋な型定義ファイルにします

export type TileType = 'grass' | 'dirt' | 'wall' | 'water' | 'crop';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  solid: boolean;
  cropGrowth?: number; // 0 to 100
}

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
}

export interface PlayerEntity extends CombatEntity {
  type: 'player';
  stamina: number;
  inventory: InventoryItem[];
}

export interface EnemyEntity extends CombatEntity {
  type: 'enemy';
  targetId?: string | null; // 追跡対象
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0.0 to 1.0
  color: string;
  size: number;
}

export interface GameState {
  map: Tile[][];
  player: PlayerEntity;
  enemies: EnemyEntity[];
  particles: Particle[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
}
