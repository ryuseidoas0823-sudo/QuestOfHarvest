export const GAME_CONFIG = {
  // マップ設定
  TILE_SIZE: 40,
  MAP_WIDTH: 50,
  MAP_HEIGHT: 50,
  
  // ビューポート（画面サイズ）設定
  VIEWPORT_WIDTH: 800,
  VIEWPORT_HEIGHT: 600,
  
  // ゲームプレイ設定
  PLAYER_SPEED: 3,
  ENEMY_SPAWN_RATE: 0.01, // 確率など
  MAX_ENEMIES: 50,
  
  // インベントリ制限など
  MAX_INVENTORY_SLOTS: 20,
} as const;
