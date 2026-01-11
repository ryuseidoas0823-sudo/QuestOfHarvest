export const THEME = {
  colors: {
    ground: '#1a1a1a',      // 背景の暗闇
    grass: '#1e2b1e',       // 暗い草地
    grassHighlight: '#2a3d2a',
    dirt: '#3e2723',        // 土
    wall: '#424242',        // 石壁 (破壊可能)
    mountain: '#1b1b1b',    // 山脈 (破壊不可・通行不可)
    water: '#1a237e',       // 水
    
    // ダンジョン・特殊タイル
    dungeonEntrance: '#4a148c', // 紫色の入り口
    stairs: '#ffd700',          // 階段
    portal: '#00bcd4',          // 脱出ポータル
    
    // エンティティ
    player: '#d4af37',      // 真鍮/ゴールド色
    enemy: '#8b0000',       // 血のような赤
    boss: '#ff4500',        // ボス（オレンジレッド）
    
    // エフェクト
    light: 'rgba(255, 200, 100, 0.1)',
    fog: 'rgba(0, 0, 0, 0.85)',
    blood: '#8b0000',
    magic: '#4169e1',
    crop: '#4caf50',
    
    // UI
    uiBg: 'rgba(20, 10, 10, 0.95)',
    uiBorder: '#5d4037',
    textMain: '#c0c0c0',
    textHighlight: '#d4af37',
  },
  fonts: {
    main: '"Cinzel", serif',
  }
} as const;
