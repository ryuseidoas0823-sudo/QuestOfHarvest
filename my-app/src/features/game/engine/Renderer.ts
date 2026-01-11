import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Tile } from '../types';

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
          case 'town_entrance': ctx.fillStyle = THEME.colors.townEntrance; break;
          case 'shop_floor': ctx.fillStyle = THEME.colors.shopFloor; break;
          default: ctx.fillStyle = '#000';
        }
        
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // 装飾
        if (tile.type === 'town_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px serif';
          ctx.fillText('⌂', px + 10, py + 25);
        }
      }
    }
  }

  // --- 2. エンティティ描画 ---
  
  // NPC
  state.npcs.forEach(npc => {
    ctx.fillStyle = THEME.colors.npc;
    ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
    // Role icon
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.fillText(npc.role.substring(0, 1).toUpperCase(), npc.x + 8, npc.y + 16);
    // Name tag
    ctx.fillStyle = '#fff';
    ctx.font = '10px serif';
    ctx.fillText(npc.name, npc.x, npc.y - 5);
  });

  // 仲間
  state.party.forEach(comp => {
    if (comp.dead) return; // 死んでたら描画しない（あるいは墓石）
    ctx.fillStyle = THEME.colors.companion;
    ctx.fillRect(comp.x, comp.y, comp.width, comp.height);
    
    // HP Bar
    const hpPercent = comp.hp / comp.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(comp.x, comp.y - 6, comp.width, 4);
    ctx.fillStyle = hpPercent > 0.5 ? 'cyan' : 'red';
    ctx.fillRect(comp.x, comp.y - 6, comp.width * hpPercent, 4);
  });

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
    const w = e.type === 'boss' ? e.width * 1.5 : e.width;
    const h = e.type === 'boss' ? e.height * 1.5 : e.height;
    const drawX = e.x - (w - e.width)/2;
    const drawY = e.y - (h - e.height)/2;
    ctx.fillRect(drawX, drawY, w, h);
    
    const hpPercent = e.hp / e.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(drawX, drawY - 10, w, 6);
    ctx.fillStyle = hpPercent > 0.5 ? 'green' : 'red';
    ctx.fillRect(drawX, drawY - 10, w * hpPercent, 6);
  });

  // マウスカーソル
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(input.mouse.x + state.camera.x - 5, input.mouse.y + state.camera.y - 5, 10, 10);

  ctx.restore();
  
  // UI Overlay
  ctx.fillStyle = '#fff';
  ctx.font = '20px serif';
  ctx.textAlign = 'right';
  const locName = state.location.type === 'world' ? 'Overworld' : state.location.type === 'town' ? 'Village' : `Dungeon B${state.location.level}`;
  ctx.fillText(locName, width - 20, 30);
  ctx.fillText(`Gold: ${state.player.gold}`, width - 20, 60);
};
