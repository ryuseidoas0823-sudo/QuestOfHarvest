export const GAME_CONFIG = {
  // マップ設定
  TILE_SIZE: 40,
  MAP_WIDTH: 50,
  MAP_HEIGHT: 50,
  
  // ビューポート
  VIEWPORT_WIDTH: 800,
  VIEWPORT_HEIGHT: 600,
  
  // ゲームプレイ設定（速度を少し遅く調整）
  PLAYER_SPEED: 2.5,       // 元3 -> 2.5
  ENEMY_BASE_SPEED: 0.8,   // 元1 -> 0.8
  ENEMY_SPAWN_RATE: 0.005,
  MAX_ENEMIES: 50,
  
  // インベントリ制限
  MAX_INVENTORY_SLOTS: 20,
} as const;

export const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Easy',
    hpMult: 0.8,
    defenseMult: 0.8,
    dropRateMult: 0.8,
    rareDropMult: 0.5,
  },
  normal: {
    name: 'Normal',
    hpMult: 1.0,
    defenseMult: 1.0,
    dropRateMult: 1.0,
    rareDropMult: 1.0,
  },
  hard: {
    name: 'Hard',
    hpMult: 1.3,
    defenseMult: 1.3,
    dropRateMult: 1.3,
    rareDropMult: 1.2,
  },
  expert: {
    name: 'Expert',
    hpMult: 1.8,
    defenseMult: 1.5,
    dropRateMult: 2.0, // レア以上ドロップ率2倍のベースとして使用
    rareDropMult: 2.0,
  }
} as const;
