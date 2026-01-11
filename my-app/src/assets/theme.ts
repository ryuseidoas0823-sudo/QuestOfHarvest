export const THEME = {
  colors: {
    ground: '#1a1a1a',      // 背景の暗闇
    grass: '#1e2b1e',       // 暗い草地
    grassHighlight: '#2a3d2a',
    dirt: '#3e2723',        // 土
    wall: '#424242',        // 石壁
    
    // エンティティ
    player: '#d4af37',      // 真鍮/ゴールド色
    enemy: '#8b0000',       // 血のような赤
    
    // エフェクト
    light: 'rgba(255, 200, 100, 0.1)', // 松明の光
    fog: 'rgba(0, 0, 0, 0.85)',        // 戦場の霧
    blood: '#8b0000',
    magic: '#4169e1',
    
    // UI
    uiBg: 'rgba(20, 10, 10, 0.95)',
    uiBorder: '#5d4037',
    textMain: '#c0c0c0',
    textHighlight: '#d4af37',
  },
  fonts: {
    main: '"Cinzel", serif', // ファンタジー風フォント
  }
} as const;
