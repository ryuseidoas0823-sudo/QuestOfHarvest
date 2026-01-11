export const THEME = {
  colors: {
    ground: '#1a1a1a',
    grass: '#1e2b1e',
    grassHighlight: '#2a3d2a',
    dirt: '#3e2723',
    wall: '#424242',
    mountain: '#1b1b1b',
    water: '#1a237e',
    
    // ダンジョン・特殊タイル
    dungeonEntrance: '#4a148c',
    stairs: '#ffd700',
    portal: '#00bcd4',
    townEntrance: '#8bc34a', // 村の入り口（明るい緑）
    shopFloor: '#5d4037',    // 店の床
    
    // エンティティ
    player: '#d4af37',
    enemy: '#8b0000',
    boss: '#ff4500',
    companion: '#00bfff',    // 仲間（ディープスカイブルー）
    npc: '#ffffff',          // NPC（白）
    
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
