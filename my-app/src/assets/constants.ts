export const GAME_CONFIG = {
  // 画面サイズ設定 (ズーム調整)
  // タイルサイズを大きくし、表示するタイル数を減らすことで「寄った」画角にする
  TILE_SIZE: 48, // 32 -> 48 に拡大
  SCREEN_WIDTH: 800,
  SCREEN_HEIGHT: 600,
  
  // ビューポート（カメラが映す範囲）
  // 画面サイズと同じにすることで等倍表示、小さくすると拡大されるが、
  // ここではCanvasサイズ(SCREEN_W/H)に合わせて調整
  VIEWPORT_WIDTH: 800,
  VIEWPORT_HEIGHT: 600,

  // マップ設定
  MAP_WIDTH: 50,
  MAP_HEIGHT: 50,
  WORLD_SIZE_W: 5, // 5x5 chunk
  WORLD_SIZE_H: 5,

  // ゲームプレイ設定
  PLAYER_SPEED: 4,
  ENEMY_SPAWN_RATE: 0.02,
  DAY_NIGHT_CYCLE: 60000 * 5, // 5分
};

export const DIFFICULTY_CONFIG = {
  easy: { hpMult: 0.8, damageMult: 0.8, expMult: 1.2, dropRateMult: 1.5 },
  normal: { hpMult: 1.0, damageMult: 1.0, expMult: 1.0, dropRateMult: 1.0 },
  hard: { hpMult: 1.5, damageMult: 1.5, expMult: 0.8, dropRateMult: 0.8 },
  expert: { hpMult: 2.5, damageMult: 2.5, expMult: 0.5, dropRateMult: 0.5 },
};
