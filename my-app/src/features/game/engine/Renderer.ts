import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState } from '../types';

/**
 * ゲーム状態をCanvasに描画する関数
 */
export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  input: { mouse: any }
) => {
  const { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const { width, height } = ctx.canvas;

  // 画面クリア
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // カメラ変換の適用開始
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  // --- 1. マップ描画 (可視範囲カリング最適化) ---
  const startCol = Math.floor(state.camera.x / TILE_SIZE);
  const endCol = startCol + (width / TILE_SIZE) + 1;
  const startRow = Math.floor(state.camera.y / TILE_SIZE);
  const endRow = startRow + (height / TILE_SIZE) + 1;

  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        const tile = state.map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        // ベースタイル
        if (tile.type === 'grass') ctx.fillStyle = THEME.colors.grass;
        else if (tile.type === 'dirt') ctx.fillStyle = THEME.colors.dirt;
        else if (tile.type === 'wall') ctx.fillStyle = THEME.colors.wall;
        else if (tile.type === 'crop') ctx.fillStyle = THEME.colors.dirt;
        else ctx.fillStyle = '#000';
        
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // タイル装飾
        if (tile.type === 'grass') {
          ctx.fillStyle = THEME.colors.grassHighlight;
          ctx.fillRect(px + 5, py + 5, 4, 4);
        }
        if (tile.type === 'crop') {
          ctx.fillStyle = THEME.colors.crop;
          ctx.beginPath();
          ctx.arc(px + 20, py + 20, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        if (tile.type === 'wall') {
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // --- 2. エンティティ描画 ---
  
  // プレイヤー
  const p = state.player;
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.shadowBlur = 0;

  // 敵
  state.enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.width, e.height);
    
    // 簡易HPバー
    const hpPercent = e.hp / e.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(e.x, e.y - 8, e.width, 4);
    ctx.fillStyle = hpPercent > 0.5 ? 'green' : 'red';
    ctx.fillRect(e.x, e.y - 8, e.width * hpPercent, 4);
  });

  // パーティクル
  state.particles.forEach(pt => {
    ctx.globalAlpha = pt.life;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });

  // --- 3. カーソル表示 ---
  if (state.mode === 'build') {
    // グリッドスナップカーソル
    const mx = Math.floor((input.mouse.x + state.camera.x) / TILE_SIZE) * TILE_SIZE;
    const my = Math.floor((input.mouse.y + state.camera.y) / TILE_SIZE) * TILE_SIZE;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, TILE_SIZE, TILE_SIZE);
  } else {
    // コンバットカーソル
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.mouse.x + state.camera.x, input.mouse.y + state.camera.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore(); // カメラ変換の解除

  // --- 4. ライティング/Fog of War ---
  // プレイヤー中心の視界円形グラデーション
  const gradient = ctx.createRadialGradient(
    p.x - state.camera.x + p.width/2, 
    p.y - state.camera.y + p.height/2, 
    50, // 内側の明るい半径
    p.x - state.camera.x + p.width/2, 
    p.y - state.camera.y + p.height/2, 
    400 // 外側の暗闇半径
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)'); 
  gradient.addColorStop(1, THEME.colors.fog);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};
