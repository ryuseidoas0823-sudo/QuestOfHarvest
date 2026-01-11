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

  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  // --- 1. マップ描画 ---
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
        
        // ベースカラー
        switch (tile.type) {
          case 'grass': ctx.fillStyle = THEME.colors.grass; break;
          case 'dirt': ctx.fillStyle = THEME.colors.dirt; break;
          case 'wall': ctx.fillStyle = THEME.colors.wall; break;
          case 'mountain': ctx.fillStyle = THEME.colors.mountain; break;
          case 'water': ctx.fillStyle = THEME.colors.water; break;
          case 'crop': ctx.fillStyle = THEME.colors.crop; break;
          case 'dungeon_entrance': ctx.fillStyle = THEME.colors.dungeonEntrance; break;
          case 'stairs_down': ctx.fillStyle = THEME.colors.stairs; break;
          case 'portal_out': ctx.fillStyle = THEME.colors.portal; break;
          default: ctx.fillStyle = '#000';
        }
        
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // タイル装飾
        if (tile.type === 'grass') {
          ctx.fillStyle = THEME.colors.grassHighlight;
          ctx.fillRect(px + 5, py + 5, 4, 4);
          ctx.fillRect(px + 20, py + 15, 3, 3);
        }
        else if (tile.type === 'wall') {
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
          // ひび割れ表現
          ctx.beginPath();
          ctx.moveTo(px + 5, py + 5);
          ctx.lineTo(px + 15, py + 15);
          ctx.stroke();
        }
        else if (tile.type === 'mountain') {
          // 山脈の立体感
          ctx.fillStyle = '#2c2c2c';
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE);
          ctx.lineTo(px + TILE_SIZE/2, py);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
          ctx.fill();
        }
        else if (tile.type === 'dungeon_entrance') {
          // 入り口の穴
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI*2);
          ctx.fill();
        }
        else if (tile.type === 'stairs_down') {
           // 階段
           ctx.fillStyle = '#000';
           for(let i=0; i<3; i++) {
             ctx.fillRect(px + 5 + i*5, py + 5 + i*8, 20, 5);
           }
        }
        else if (tile.type === 'portal_out') {
           // 渦巻き
           ctx.strokeStyle = '#fff';
           ctx.beginPath();
           ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 10, 0, Math.PI*2);
           ctx.stroke();
        }
      }
    }
  }

  // --- 2. 宝箱 ---
  state.chests.forEach(chest => {
    ctx.fillStyle = chest.opened ? '#5d4037' : '#ffd700';
    ctx.fillRect(chest.x + 5, chest.y + 10, 30, 20);
    // 鍵穴
    if (!chest.opened) {
      ctx.fillStyle = '#000';
      ctx.fillRect(chest.x + 18, chest.y + 15, 4, 6);
    }
  });

  // --- 3. ドロップアイテム ---
  state.droppedItems.forEach(drop => {
    // レアリティで色変え
    let color = '#fff';
    if (drop.item.rarity === 'legendary') color = '#ff8800';
    else if (drop.item.rarity === 'rare') color = '#0088ff';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // --- 4. エンティティ ---
  
  // プレイヤー
  const p = state.player;
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.shadowBlur = 0;

  // 敵
  state.enemies.forEach(e => {
    ctx.fillStyle = e.type === 'boss' ? THEME.colors.boss : e.color;
    
    // ボスは少し大きく描画
    const w = e.type === 'boss' ? e.width * 1.5 : e.width;
    const h = e.type === 'boss' ? e.height * 1.5 : e.height;
    const drawX = e.x - (w - e.width)/2;
    const drawY = e.y - (h - e.height)/2;

    ctx.fillRect(drawX, drawY, w, h);
    
    // HP Bar
    const hpPercent = e.hp / e.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(drawX, drawY - 10, w, 6);
    ctx.fillStyle = hpPercent > 0.5 ? 'green' : 'red';
    ctx.fillRect(drawX, drawY - 10, w * hpPercent, 6);
    
    if (e.type === 'boss') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY - 10, w, 6);
      ctx.fillText("BOSS", drawX, drawY - 15);
    }
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

  // マウスカーソル
  if (state.mode === 'build') {
    const mx = Math.floor((input.mouse.x + state.camera.x) / TILE_SIZE) * TILE_SIZE;
    const my = Math.floor((input.mouse.y + state.camera.y) / TILE_SIZE) * TILE_SIZE;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, TILE_SIZE, TILE_SIZE);
  } else {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.mouse.x + state.camera.x, input.mouse.y + state.camera.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 場所表示
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '20px serif';
  ctx.textAlign = 'right';
  const locName = state.location.type === 'world' ? 'Overworld' : `Dungeon B${state.location.level}`;
  ctx.fillText(locName, width - 20, 30);
};
