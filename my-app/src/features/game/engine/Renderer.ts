import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity, CombatEntity, WeaponCategory, ResourceNode } from '../types';

/**
 * キャラクターを描画するヘルパー関数
 */
const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number
) => {
  let drawX = x;
  let drawY = y;
  
  // 攻撃モーション計算
  if (entity.type === 'player' || entity.type === 'companion' || entity.type === 'enemy' || entity.type === 'boss') {
    const combatEntity = entity as CombatEntity;
    if (combatEntity.isAttacking && combatEntity.attackStartTime) {
      const elapsed = time - combatEntity.attackStartTime;
      const duration = combatEntity.attackDuration || 200;
      if (elapsed < duration) {
        const progress = Math.sin((elapsed / duration) * Math.PI);
        const forward = progress * 15;
        const angle = combatEntity.attackDirection !== undefined ? combatEntity.attackDirection : 0;
        drawX += Math.cos(angle) * forward;
        drawY += Math.sin(angle) * forward;
      }
    }
  }

  const centerX = drawX + w / 2;
  const centerY = drawY + h / 2;
  
  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, drawY + h - 2, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.type === 'player') {
    // Player drawing (simplified)
    ctx.fillStyle = '#5c6bc0'; ctx.fillRect(drawX + w*0.2, drawY + h*0.3, w*0.6, h*0.35); // Body
    ctx.fillStyle = '#ffccbc'; ctx.beginPath(); ctx.arc(centerX, drawY + h*0.2, w*0.25, 0, Math.PI*2); ctx.fill(); // Head
    
    // 武器描画
    const p = entity as PlayerEntity;
    const mainHand = p.equipment?.mainHand;
    const weaponCat = mainHand?.weaponStats?.category || 'Sword';
    const isAttacking = (p as any).isAttacking;
    const attackDir = (p as any).attackDirection;
    drawWeapon(ctx, weaponCat, drawX, drawY, w, h, isAttacking, attackDir);

  } else if (entity.type === 'enemy' || entity.type === 'boss') {
    // Enemy drawing
    const e = entity as EnemyEntity;
    ctx.fillStyle = e.color;
    ctx.fillRect(drawX, drawY, w, h);
    // HP Bar
    ctx.fillStyle = 'red'; ctx.fillRect(drawX, drawY - 6, w, 4);
    ctx.fillStyle = 'green'; ctx.fillRect(drawX, drawY - 6, w * (e.hp / e.maxHp), 4);
  } else if (entity.type === 'npc') {
    const npc = entity as NPCEntity;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(drawX + w*0.2, drawY + h*0.2, w*0.6, h*0.8);
    // Role icon
    ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    const icon = npc.role === 'blacksmith' ? '⚒️' : npc.role === 'inn' ? '🏨' : '?';
    ctx.fillText(icon, centerX, drawY - 8);
  } else {
    // Companion etc
    ctx.fillStyle = entity.color;
    ctx.fillRect(drawX, drawY, w, h);
  }
};

const drawResourceNode = (ctx: CanvasRenderingContext2D, res: ResourceNode, x: number, y: number, w: number, h: number) => {
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h - 2, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (res.resourceType === 'tree') {
    // 幹
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(centerX - w*0.15, y + h*0.5, w*0.3, h*0.5);
    // 葉
    ctx.fillStyle = res.hp < res.maxHp ? '#388e3c' : '#2e7d32'; // ダメージで色変化
    ctx.beginPath();
    ctx.arc(centerX, y + h*0.4, w*0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (res.resourceType === 'rock') {
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2);
    ctx.fill();
    // 質感
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath(); ctx.arc(centerX-5, centerY-5, w*0.1, 0, Math.PI*2); ctx.fill();
  } else if (res.resourceType === 'iron_ore') {
    ctx.fillStyle = '#5d4037'; // 土台
    ctx.beginPath(); ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a1887f'; // 鉱石部分
    ctx.beginPath(); ctx.arc(centerX, centerY, w*0.25, 0, Math.PI*2); ctx.fill();
  } else if (res.resourceType === 'gold_ore') {
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(centerX, centerY, w*0.25, 0, Math.PI*2); ctx.fill();
  }

  // HPバー (ダメージを受けている場合のみ)
  if (res.hp < res.maxHp) {
    ctx.fillStyle = 'red'; ctx.fillRect(x, y - 6, w, 4);
    ctx.fillStyle = 'yellow'; ctx.fillRect(x, y - 6, w * (res.hp / res.maxHp), 4);
  }
};

const drawWeapon = (
  ctx: CanvasRenderingContext2D,
  category: WeaponCategory,
  x: number,
  y: number,
  w: number,
  h: number,
  isAttacking?: boolean,
  angle?: number
) => {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  let offsetX = w * 0.3;
  let offsetY = h * 0.2;

  if (isAttacking && angle !== undefined) {
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.translate(-cx, -cy);
    offsetX = 0; offsetY = -10;
  }

  const wx = x + w * 0.5 + offsetX;
  const wy = y + h * 0.3 + offsetY;

  if (category === 'Pickaxe') {
    ctx.fillStyle = '#5d4037'; // Handle
    ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#78909c'; // Head
    ctx.beginPath();
    ctx.moveTo(wx + 1, wy - 12);
    ctx.lineTo(wx - 8, wy - 8); // curve left
    ctx.lineTo(wx + 10, wy - 8); // curve right
    ctx.lineTo(wx + 1, wy - 15); // top point
    ctx.fill();
  } else if (category === 'Sword') {
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(wx, wy - 15, 4, 15);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(wx, wy, 4, 6);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(wx - 4, wy - 2, 12, 2);
  } else if (category === 'Spear') {
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(wx, wy - 20, 2, 25);
    ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(wx + 1, wy - 20); ctx.lineTo(wx - 2, wy - 25); ctx.lineTo(wx + 4, wy - 25); ctx.fill();
  } else if (category === 'Axe') {
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(wx + 1, wy - 12, 8, 0, Math.PI, true); ctx.fill();
  } else if (category === 'Hammer') {
    ctx.fillStyle = '#5d4037'; ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#424242'; ctx.fillRect(wx - 5, wy - 18, 13, 8);
  } else if (category === 'Dagger') {
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(wx, wy - 8, 3, 8);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(wx, wy, 3, 4);
  }
  
  ctx.restore();
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  input: { mouse: any }
) => {
  try {
    const { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
    const { width, height } = ctx.canvas;
    const time = Date.now();

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    if (!state.map || state.map.length === 0) {
      ctx.fillStyle = '#fff'; ctx.fillText('Now Loading...', width / 2, height / 2); return;
    }

    ctx.save();
    const camX = Math.floor(state.camera.x);
    const camY = Math.floor(state.camera.y);
    ctx.translate(-camX, -camY);

    // マップ描画
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = startCol + (width / TILE_SIZE) + 1;
    const startRow = Math.floor(camY / TILE_SIZE);
    const endRow = startRow + (height / TILE_SIZE) + 1;
    const c1 = Math.max(0, startCol); const c2 = Math.min(MAP_WIDTH - 1, endCol);
    const r1 = Math.max(0, startRow); const r2 = Math.min(MAP_HEIGHT - 1, endRow);

    for (let y = r1; y <= r2; y++) {
      for (let x = c1; x <= c2; x++) {
        const tile = state.map[y]?.[x];
        if (!tile) continue;
        const px = x * TILE_SIZE; const py = y * TILE_SIZE;
        switch (tile.type) {
          case 'grass': ctx.fillStyle = THEME.colors.grass; break;
          case 'dirt': ctx.fillStyle = THEME.colors.dirt; break;
          case 'wall': ctx.fillStyle = THEME.colors.wall; break;
          case 'mine_entrance': ctx.fillStyle = '#3e2723'; break;
          case 'portal_out': ctx.fillStyle = '#e91e63'; break; // ポータルを目立つ色に
          default: ctx.fillStyle = '#222';
        }
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        // 特殊タイルのアイコン描画
        if (tile.type === 'mine_entrance') {
          ctx.fillStyle = '#fff'; ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('⛏️', px + TILE_SIZE/2, py + TILE_SIZE/2 + TILE_SIZE*0.2);
        } else if (tile.type === 'dungeon_entrance') {
          ctx.fillStyle = '#fff'; ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('💀', px + TILE_SIZE/2, py + TILE_SIZE/2 + TILE_SIZE*0.2);
        } else if (tile.type === 'town_entrance') {
          ctx.fillStyle = '#fff'; ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('🏠', px + TILE_SIZE/2, py + TILE_SIZE/2 + TILE_SIZE*0.2);
        } else if (tile.type === 'portal_out') {
          ctx.fillStyle = '#fff'; ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('🚪', px + TILE_SIZE/2, py + TILE_SIZE/2 + TILE_SIZE*0.2);
        } else if (tile.type === 'stairs_down') {
          ctx.fillStyle = '#fff'; ctx.font = `${TILE_SIZE*0.7}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('⬇️', px + TILE_SIZE/2, py + TILE_SIZE/2 + TILE_SIZE*0.2);
        }
      }
    }

    // 資源描画
    if (state.resources) {
      state.resources.forEach(res => {
        if (res.dead) return;
        drawResourceNode(ctx, res, res.x, res.y, res.width, res.height);
      });
    }

    // オブジェクト、敵、プレイヤー描画
    if (state.chests) state.chests.forEach(c => { ctx.fillStyle='gold'; ctx.fillRect(c.x+TILE_SIZE*0.2,c.y+TILE_SIZE*0.2,TILE_SIZE*0.6,TILE_SIZE*0.6); });
    if (state.droppedItems) state.droppedItems.forEach(d => { ctx.fillStyle='cyan'; ctx.fillRect(d.x+TILE_SIZE*0.3,d.y+TILE_SIZE*0.3,TILE_SIZE*0.4,TILE_SIZE*0.4); });

    if (state.npcs) state.npcs.forEach(n => drawCharacter(ctx, n, n.x, n.y, n.width, n.height, time));
    if (state.enemies) state.enemies.forEach(e => drawCharacter(ctx, e, e.x, e.y, e.width, e.height, time));
    if (state.party) state.party.forEach(c => drawCharacter(ctx, c, c.x, c.y, c.width, c.height, time));
    if (state.player) drawCharacter(ctx, state.player, state.player.x, state.player.y, state.player.width, state.player.height, time);

    // パーティクル
    if (state.particles) state.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // マウスカーソル (攻撃範囲)
    if (state.mode === 'combat' && state.player?.equipment?.mainHand?.weaponStats) {
      const weapon = state.player.equipment.mainHand.weaponStats;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      const px = state.player.x + state.player.width / 2;
      const py = state.player.y + state.player.height / 2;
      const mx = input.mouse.x + camX;
      const my = input.mouse.y + camY;
      const angle = Math.atan2(my - py, mx - px);
      const range = weapon.range * TILE_SIZE;

      ctx.beginPath();
      if (weapon.shape === 'line') {
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(angle) * range, py + Math.sin(angle) * range);
      } else {
        const halfAngle = (weapon.width * Math.PI / 180) / 2;
        ctx.arc(px, py, range, angle - halfAngle, angle + halfAngle);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.restore();
    
    // UI Overlay
    ctx.fillStyle = '#fff'; ctx.font = '20px serif'; ctx.textAlign = 'right';
    const locName = state.location.type === 'mine' ? `Mine B${state.location.level}` : state.location.type === 'world' ? 'Overworld' : state.location.type === 'dungeon' ? `Dungeon B${state.location.level}` : 'Village';
    ctx.fillText(locName, width - 20, 30);

  } catch (error) {
    console.error(error);
  }
};
