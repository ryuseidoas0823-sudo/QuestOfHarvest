export const GAME_CONFIG = {
  // 画面サイズ設定 (ズーム調整)
  // TILE_SIZEを小さくして、より広範囲が見えるようにします
  TILE_SIZE: 32, // 48 -> 32 に縮小（カメラを引く）
  SCREEN_WIDTH: 800,
  SCREEN_HEIGHT: 600,
  
  // ビューポート
  VIEWPORT_WIDTH: 800,
  VIEWPORT_HEIGHT: 600,

  // マップ設定
  MAP_WIDTH: 60, // マップ自体も少し広く
  MAP_HEIGHT: 60,
  WORLD_SIZE_W: 5,
  WORLD_SIZE_H: 5,

  // ゲームプレイ設定
  PLAYER_SPEED: 4, // TILE_SIZE縮小に合わせて速度感調整（ピクセルベースならそのままでも良いが、バランス見て）
  ENEMY_SPAWN_RATE: 0.02,
  DAY_NIGHT_CYCLE: 60000 * 5,
};

export const DIFFICULTY_CONFIG = {
  easy: { hpMult: 0.8, damageMult: 0.8, expMult: 1.2, dropRateMult: 1.5 },
  normal: { hpMult: 1.0, damageMult: 1.0, expMult: 1.0, dropRateMult: 1.0 },
  hard: { hpMult: 1.5, damageMult: 1.5, expMult: 0.8, dropRateMult: 0.8 },
  expert: { hpMult: 2.5, damageMult: 2.5, expMult: 0.5, dropRateMult: 0.5 },
};
