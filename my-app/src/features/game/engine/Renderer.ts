import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity, CombatEntity, WeaponCategory, ResourceNode, Tile } from '../types';

// 視界の半径（タイル数）
const VIEW_RADIUS = 12;

/**
 * 2点間の視線が通るかチェックする (Bresenham's Line Algorithm)
 */
const hasLineOfSight = (
  x0: number, y0: number, 
  x1: number, y1: number, 
  map: Tile[][]
): boolean => {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = (x0 < x1) ? 1 : -1;
  let sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 === x1 && y0 === y1) break;
    
    // 現在のタイルが障害物なら視線が遮られる
    // (ただし、始点はプレイヤー位置なので除外、終点は対象物なので見えてよい)
    if (map[y0] && map[y0][x0] && map[y0][x0].solid) {
      return false; 
    }

    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return true;
};

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
  time: number,
  isVisible: boolean
) => {
  // 視界外なら描画しない（敵やアイテムなど）
  if (!isVisible && entity.type !== 'player') return;

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
    // Player drawing
    ctx.fillStyle = '#5c6bc0'; ctx.fillRect(drawX + w*0.2, drawY + h*0.3, w*0.6, h*0.35); // Body
    ctx.fillStyle = '#ffccbc'; ctx.beginPath(); ctx.arc(centerX, drawY + h*0.2, w*0.25, 0, Math.PI*2); ctx.fill(); // Head
    ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.arc(centerX, drawY + h*0.18, w*0.28, Math.PI, Math.PI * 2); ctx.fill(); // Hair
    ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.moveTo(drawX+w*0.25, drawY+h*0.35); ctx.lineTo(drawX+w*0.75, drawY+h*0.35); ctx.lineTo(drawX+w*0.85, drawY+h*0.8); ctx.lineTo(drawX+w*0.15, drawY+h*0.8); ctx.fill(); // Cape

    const p = entity as PlayerEntity;
    const mainHand = p.equipment?.mainHand;
    const weaponCat = mainHand?.weaponStats?.category || 'Sword';
    const isAttacking = (p as any).isAttacking;
    const attackDir = (p as any).attackDirection;
    drawWeapon(ctx, weaponCat, drawX, drawY, w, h, isAttacking, attackDir);

  } else if (entity.type === 'enemy' || entity.type === 'boss') {
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
    ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    const icon = npc.role === 'blacksmith' ? '⚒️' : npc.role === 'inn' ? '🏨' : '?';
    ctx.fillText(icon, centerX, drawY - 8);
  } else {
    ctx.fillStyle = entity.color;
    ctx.fillRect(drawX, drawY, w, h);
  }
};

const drawResourceNode = (ctx: CanvasRenderingContext2D, res: ResourceNode, x: number, y: number, w: number, h: number, isVisible: boolean) => {
  // 視界外なら描画しない（あるいは薄くする）
  if (!isVisible) return;

  const centerX = x + w / 2;
  const centerY = y + h / 2;

  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h - 2, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (res.resourceType === 'tree') {
    ctx.fillStyle = '#5d4037'; ctx.fillRect(centerX - w*0.15, y + h*0.5, w*0.3, h*0.5);
    ctx.fillStyle = res.hp < res.maxHp ? '#388e3c' : '#2e7d32'; 
    ctx.beginPath(); ctx.arc(centerX, y + h*0.4, w*0.5, 0, Math.PI * 2); ctx.fill();
  } else if (res.resourceType === 'rock') {
    ctx.fillStyle = '#757575'; ctx.beginPath(); ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.arc(centerX-5, centerY-5, w*0.1, 0, Math.PI*2); ctx.fill();
  } else if (res.resourceType === 'iron_ore') {
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a1887f'; ctx.beginPath(); ctx.arc(centerX, centerY, w*0.25, 0, Math.PI*2); ctx.fill();
  } else if (res.resourceType === 'gold_ore') {
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(centerX, centerY, w*0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(centerX, centerY, w*0.25, 0, Math.PI*2); ctx.fill();
  }

  if (res.hp < res.maxHp) {
    ctx.fillStyle = 'red'; ctx.fillRect(x, y - 6, w, 4);
    ctx.fillStyle = 'yellow'; ctx.fillRect(x, y - 6, w * (res.hp / res.maxHp), 4);
  }
};

const drawWeapon = (ctx: CanvasRenderingContext2D, category: WeaponCategory, x: number, y: number, w: number, h: number, isAttacking?: boolean, angle?: number) => {
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
    ctx.fillStyle = '#5d4037'; ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.moveTo(wx + 1, wy - 12); ctx.lineTo(wx - 8, wy - 8); ctx.lineTo(wx + 10, wy - 8); ctx.lineTo(wx + 1, wy - 15); ctx.fill();
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
  input: { mouse: any },
  screenSize?: { width: number; height: number }
) => {
  try {
    const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
    // 実際のキャンバスサイズを使用することで、横長・拡大縮小の問題を解消
    const width = screenSize ? screenSize.width : ctx.canvas.width;
    const height = screenSize ? screenSize.height : ctx.canvas.height;
    const time = Date.now();

    // 画面クリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    if (!state.map || state.map.length === 0) return;

    ctx.save();
    
    // カメラ座標
    const camX = Math.floor(state.camera.x);
    const camY = Math.floor(state.camera.y);
    ctx.translate(-camX, -camY);

    // プレイヤーのタイル座標
    const playerTileX = Math.floor((state.player.x + state.player.width/2) / TILE_SIZE);
    const playerTileY = Math.floor((state.player.y + state.player.height/2) / TILE_SIZE);

    // 描画範囲の計算（画面サイズに合わせて動的に決定）
    // バッファとして +2 タイル余分に描画
    const startCol = Math.floor(camX / TILE_SIZE) - 1;
    const endCol = startCol + Math.ceil(width / TILE_SIZE) + 2;
    const startRow = Math.floor(camY / TILE_SIZE) - 1;
    const endRow = startRow + Math.ceil(height / TILE_SIZE) + 2;

    const c1 = Math.max(0, startCol);
    const c2 = Math.min(MAP_WIDTH - 1, endCol);
    const r1 = Math.max(0, startRow);
    const r2 = Math.min(MAP_HEIGHT - 1, endRow);

    // 1. タイル描画 & 視界計算
    for (let y = r1; y <= r2; y++) {
      for (let x = c1; x <= c2; x++) {
        const tile = state.map[y]?.[x];
        if (!tile) continue;

        // 視界チェック
        const dist = Math.sqrt((x - playerTileX)**2 + (y - playerTileY)**2);
        const inRange = dist < VIEW_RADIUS;
        let isVisible = false;

        // 範囲内かつ、視線が通るかチェック
        if (inRange) {
          isVisible = hasLineOfSight(playerTileX, playerTileY, x, y, state.map);
        }

        // 探索済みフラグなどは今回は省略し、単純に「見えている場所」と「見えていない場所（暗闇）」で区別
        // 完全に隠す場合は描画スキップでもよいが、地形だけうっすら見せたい場合はアルファ合成
        // ここでは「見えない場所は黒（Fog）」とする

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (isVisible) {
          // 通常描画
          switch (tile.type) {
            case 'grass': ctx.fillStyle = THEME.colors.grass; break;
            case 'dirt': ctx.fillStyle = THEME.colors.dirt; break;
            case 'wall': ctx.fillStyle = THEME.colors.wall; break;
            case 'mine_entrance': ctx.fillStyle = '#3e2723'; break;
            case 'portal_out': ctx.fillStyle = '#e91e63'; break;
            case 'town_entrance': ctx.fillStyle = '#795548'; break;
            case 'shop_floor': ctx.fillStyle = '#a1887f'; break;
            case 'dungeon_entrance': ctx.fillStyle = '#212121'; break;
            case 'stairs_down': ctx.fillStyle = '#424242'; break;
            case 'water': ctx.fillStyle = '#2196f3'; break;
            case 'mountain': ctx.fillStyle = '#5d4037'; break;
            default: ctx.fillStyle = '#222';
          }
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          
          // グリッド線（薄く）
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

          // アイコン描画
          if (tile.type === 'mine_entrance') { ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⛏️', px+TILE_SIZE/2, py+TILE_SIZE/2+8); }
          else if (tile.type === 'dungeon_entrance') { ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💀', px+TILE_SIZE/2, py+TILE_SIZE/2+8); }
          else if (tile.type === 'town_entrance') { ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🏠', px+TILE_SIZE/2, py+TILE_SIZE/2+8); }
          else if (tile.type === 'portal_out') { ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🚪', px+TILE_SIZE/2, py+TILE_SIZE/2+8); }
          else if (tile.type === 'stairs_down') { ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⬇️', px+TILE_SIZE/2, py+TILE_SIZE/2+8); }

        } else {
          // 視界外（Fog of War）
          // まったく描画しない（黒背景のまま）か、暗く描画するか
          // 今回は「未探索エリアのように真っ黒」にする
          ctx.fillStyle = '#000';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // --- 2. オブジェクト・キャラクター描画 ---
    // 描画順序をY座標でソート
    const allEntities: any[] = [
      ...(state.chests || []).map(c => ({...c, type: 'chest', z: c.y})),
      ...(state.droppedItems || []).map(d => ({...d, type: 'drop', z: d.y})),
      ...(state.resources || []).map(r => ({...r, z: r.y})),
      ...(state.npcs || []).map(n => ({...n, z: n.y})),
      ...(state.enemies || []).map(e => ({...e, z: e.y})),
      ...(state.party || []).map(p => ({...p, z: p.y})),
      { ...state.player, z: state.player.y }
    ];

    allEntities.sort((a, b) => a.z - b.z);

    allEntities.forEach(e => {
      // 画面外判定
      if (e.x < camX - 50 || e.x > camX + width + 50 || e.y < camY - 50 || e.y > camY + height + 50) return;

      // 視界判定
      const tileX = Math.floor((e.x + (e.width||32)/2) / TILE_SIZE);
      const tileY = Math.floor((e.y + (e.height||32)/2) / TILE_SIZE);
      const dist = Math.sqrt((tileX - playerTileX)**2 + (tileY - playerTileY)**2);
      
      // プレイヤー自身は常に表示。それ以外は視界内かつLOSが通る場合のみ
      const isVisible = (e.id === state.player.id) || (dist < VIEW_RADIUS && hasLineOfSight(playerTileX, playerTileY, tileX, tileY, state.map));

      if (!isVisible) return;

      if (e.type === 'chest') {
        ctx.fillStyle = 'gold'; ctx.fillRect(e.x + 5, e.y + 5, 20, 20);
      } else if (e.type === 'drop') {
        ctx.fillStyle = 'cyan'; ctx.fillRect(e.x + 10, e.y + 10, 10, 10);
      } else if (e.type === 'resource') {
        drawResourceNode(ctx, e, e.x, e.y, e.width, e.height, isVisible);
      } else {
        drawCharacter(ctx, e, e.x, e.y, e.width, e.height, time, isVisible);
      }
    });

    // パーティクル
    if (state.particles) state.particles.forEach(p => {
      if (p.x < camX-50 || p.x > camX+width+50 || p.y < camY-50 || p.y > camY+height+50) return;
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // マウスカーソル
    const weapon = state.player?.equipment?.mainHand?.weaponStats;
    if (state.mode === 'combat' && weapon) {
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
    ctx.fillText(`Gold: ${state.player.gold}`, width - 20, 60);

  } catch (error: any) {
    console.error("Render Error:", error);
  }
};
