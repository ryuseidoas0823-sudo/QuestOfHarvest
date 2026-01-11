// 画像パスの定義（実際のファイルは public/images/ などに置く）
export const SPRITES = {
  player: {
    idle: '/images/player/idle.png',
    walk: '/images/player/walk.png',
    attack: '/images/player/attack.png',
  },
  terrain: {
    grass: '/images/terrain/grass_dark.png',
    wall: '/images/terrain/stone_wall.png',
  },
  items: {
    potion: '/images/items/health_potion.png',
    sword: '/images/items/rusty_sword.png',
  }
} as const;

// 音声パスの定義
export const SOUNDS = {
  bgm: {
    dungeon: '/sounds/bgm/dark_ambience.mp3',
  },
  sfx: {
    swordSwing: '/sounds/sfx/swing.wav',
    hit: '/sounds/sfx/flesh_hit.wav',
    step: '/sounds/sfx/stone_step.wav',
  }
} as const;
