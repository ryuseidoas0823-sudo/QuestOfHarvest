export const GAME_CONFIG = {
  // 基本タイルサイズ
  TILE_SIZE: 32, 
  
  // 画面サイズ (初期値 - 後で動的に上書きされることを想定)
  SCREEN_WIDTH: window.innerWidth,
  SCREEN_HEIGHT: window.innerHeight,
  
  // ビューポート (初期値)
  VIEWPORT_WIDTH: window.innerWidth,
  VIEWPORT_HEIGHT: window.innerHeight,

  // マップ設定
  MAP_WIDTH: 60,
  MAP_HEIGHT: 60,
  WORLD_SIZE_W: 5,
  WORLD_SIZE_H: 5,

  // ゲームプレイ設定
  PLAYER_SPEED: 4, 
  ENEMY_SPAWN_RATE: 0.02,
  DAY_NIGHT_CYCLE: 60000 * 5,
};

export const DIFFICULTY_CONFIG = {
  easy: { hpMult: 0.8, damageMult: 0.8, expMult: 1.2, dropRateMult: 1.5 },
  normal: { hpMult: 1.0, damageMult: 1.0, expMult: 1.0, dropRateMult: 1.0 },
  hard: { hpMult: 1.5, damageMult: 1.5, expMult: 0.8, dropRateMult: 0.8 },
  expert: { hpMult: 2.5, damageMult: 2.5, expMult: 0.5, dropRateMult: 0.5 },
};
