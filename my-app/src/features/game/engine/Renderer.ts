import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity, CombatEntity, WeaponCategory } from '../types';

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
  let rotation = 0;

  // --- 攻撃モーション計算 ---
  if (entity.type === 'player' || entity.type === 'companion' || entity.type === 'enemy' || entity.type === 'boss') {
    const combatEntity = entity as CombatEntity;
    if (combatEntity.isAttacking && combatEntity.attackStartTime) {
      const elapsed = time - combatEntity.attackStartTime;
      const duration = combatEntity.attackDuration || 200;
      
      if (elapsed < duration) {
        // 突き刺し/踏み込みアクション
        // 0.0 -> 1.0 (ピーク) -> 0.0
        const progress = Math.sin((elapsed / duration) * Math.PI);
        const forward = progress * 15; // 15px前に出る
        
        // 攻撃方向がなければデフォルトで右
        const angle = combatEntity.attackDirection !== undefined ? combatEntity.attackDirection : 0;
        
        drawX += Math.cos(angle) * forward;
        drawY += Math.sin(angle) * forward;
      }
    }
  }

  const centerX = drawX + w / 2;
  const centerY = drawY + h / 2;
  
  // 影 (共通)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, drawY + h - 2, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- プレイヤー描画 (人型) ---
  if (entity.type === 'player') {
    // 足
    ctx.fillStyle = '#1a237e'; // ズボン
    ctx.fillRect(drawX + w * 0.3, drawY + h * 0.6, w * 0.15, h * 0.35);
    ctx.fillRect(drawX + w * 0.55, drawY + h * 0.6, w * 0.15, h * 0.35);

    // 胴体
    ctx.fillStyle = '#5c6bc0';
    ctx.fillRect(drawX + w * 0.2, drawY + h * 0.3, w * 0.6, h * 0.35);
    ctx.fillStyle = '#e8eaf6'; 
    ctx.fillRect(drawX + w * 0.3, drawY + h * 0.35, w * 0.4, h * 0.25);

    // 頭
    ctx.fillStyle = '#ffccbc';
    ctx.beginPath();
    ctx.arc(centerX, drawY + h * 0.2, w * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.arc(centerX, drawY + h * 0.18, w * 0.28, Math.PI, Math.PI * 2);
    ctx.fill();

    // マント
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(drawX + w * 0.25, drawY + h * 0.35);
    ctx.lineTo(drawX + w * 0.75, drawY + h * 0.35);
    ctx.lineTo(drawX + w * 0.85, drawY + h * 0.8);
    ctx.lineTo(drawX + w * 0.15, drawY + h * 0.8);
    ctx.fill();

    // 武器描画 (簡易)
    const p = entity as PlayerEntity;
    const mainHand = p.equipment?.mainHand;
    const weaponCat = mainHand?.weaponStats?.category || 'Sword';
    
    // 攻撃中かどうか判定
    const isAttacking = (p as any).isAttacking;
    const attackDir = (p as any).attackDirection;

    drawWeapon(ctx, weaponCat, drawX, drawY, w, h, isAttacking, attackDir);

  } 
  // --- 敵描画 (モンスター) ---
  else if (entity.type === 'enemy' || entity.type === 'boss') {
    const e = entity as EnemyEntity;
    ctx.fillStyle = e.color || '#ff0000';

    if (e.race === 'Slime') {
      ctx.beginPath();
      ctx.arc(centerX, drawY + h * 0.7, w * 0.4, Math.PI, 0); 
      ctx.lineTo(drawX + w * 0.9, drawY + h * 0.9);
      ctx.quadraticCurveTo(centerX, drawY + h, drawX + w * 0.1, drawY + h * 0.9);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(drawX + w*0.35, drawY + h*0.6, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(drawX + w*0.65, drawY + h*0.6, 3, 0, Math.PI*2); ctx.fill();
      
    } else if (e.race === 'Goblin' || e.race === 'Orc') {
      ctx.fillRect(drawX + w*0.25, drawY + h*0.4, w*0.5, h*0.4); 
      ctx.beginPath(); ctx.arc(centerX, drawY + h*0.3, w*0.3, 0, Math.PI*2); ctx.fill(); 
      ctx.beginPath(); 
      ctx.moveTo(drawX + w*0.2, drawY + h*0.25); ctx.lineTo(drawX, drawY + h*0.1); ctx.lineTo(drawX + w*0.2, drawY + h*0.35); ctx.fill();
      ctx.moveTo(drawX + w*0.8, drawY + h*0.25); ctx.lineTo(drawX + w, drawY + h*0.1); ctx.lineTo(drawX + w*0.8, drawY + h*0.35); ctx.fill();
      // 武器 (棍棒)
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath(); ctx.ellipse(drawX + w*0.85, drawY + h*0.5, 4, 12, Math.PI/4, 0, Math.PI*2); ctx.fill();

    } else if (e.race === 'Ghost') {
      // 浮遊アニメーション
      const floatY = Math.sin(time / 200) * 3;
      ctx.beginPath();
      ctx.arc(centerX, drawY + h*0.3 + floatY, w*0.35, Math.PI, 0);
      ctx.lineTo(drawX + w*0.85, drawY + h*0.9 + floatY);
      ctx.lineTo(centerX, drawY + h*0.8 + floatY);
      ctx.lineTo(drawX + w*0.15, drawY + h*0.9 + floatY);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(drawX + w*0.4, drawY + h*0.35 + floatY, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(drawX + w*0.6, drawY + h*0.35 + floatY, 3, 0, Math.PI*2); ctx.fill();

    } else {
      // 汎用
      ctx.fillRect(drawX + w*0.2, drawY + h*0.3, w*0.6, h*0.5);
      ctx.beginPath(); ctx.arc(centerX, drawY + h*0.25, w*0.25, 0, Math.PI*2); ctx.fill();
    }

    if (e.type === 'boss') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX - 2, drawY - 2, w + 4, h + 4);
    }

  } 
  // --- その他 (NPC, 仲間) ---
  else {
    ctx.fillStyle = entity.color;
    ctx.fillRect(drawX + w * 0.25, drawY + h * 0.35, w * 0.5, h * 0.5); 
    
    ctx.fillStyle = '#ffccbc';
    ctx.beginPath(); ctx.arc(centerX, drawY + h * 0.2, w * 0.25, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = entity.color;
    ctx.beginPath(); ctx.arc(centerX, drawY + h * 0.18, w * 0.28, Math.PI, Math.PI * 2); ctx.fill();

    if (entity.type === 'companion') {
      const c = entity as CompanionEntity;
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const icon = c.job === 'Warrior' ? '🛡️' : c.job === 'Mage' ? '🪄' : c.job === 'Archer' ? '🏹' : '✚';
      ctx.fillText(icon, centerX, drawY - 5);
      
      // 仲間の武器
      let cat: WeaponCategory = 'Sword';
      if (c.job === 'Mage') cat = 'Fist'; // 杖っぽく
      if (c.job === 'Archer') cat = 'Fist'; // 弓（未実装なので素手扱い）
      if (c.job === 'Cleric') cat = 'Hammer';
      drawWeapon(ctx, cat, drawX, drawY, w, h, c.isAttacking, c.attackDirection);
    }
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
  
  // 攻撃方向へ回転
  let rot = 0;
  let offsetX = w * 0.3;
  let offsetY = h * 0.2;

  if (isAttacking && angle !== undefined) {
    // 攻撃中は角度に合わせて回転
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2); // 剣先を向ける
    ctx.translate(-cx, -cy);
    offsetX = 0; // 中心から描画
    offsetY = -10; // 少し前へ
  }

  const wx = x + w * 0.5 + offsetX;
  const wy = y + h * 0.3 + offsetY;

  if (category === 'Sword') {
    ctx.fillStyle = '#b0bec5'; // 刃
    ctx.fillRect(wx, wy - 15, 4, 15);
    ctx.fillStyle = '#5d4037'; // 柄
    ctx.fillRect(wx, wy, 4, 6);
    ctx.fillStyle = '#ffd700'; // 鍔
    ctx.fillRect(wx - 4, wy - 2, 12, 2);
  } else if (category === 'Spear') {
    ctx.fillStyle = '#8d6e63'; // 柄
    ctx.fillRect(wx, wy - 20, 2, 25);
    ctx.fillStyle = '#b0bec5'; // 穂先
    ctx.beginPath();
    ctx.moveTo(wx + 1, wy - 20);
    ctx.lineTo(wx - 2, wy - 25);
    ctx.lineTo(wx + 4, wy - 25);
    ctx.fill();
  } else if (category === 'Axe') {
    ctx.fillStyle = '#8d6e63'; // 柄
    ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#78909c'; // 刃
    ctx.beginPath();
    ctx.arc(wx + 1, wy - 12, 8, 0, Math.PI, true);
    ctx.fill();
  } else if (category === 'Hammer') {
    ctx.fillStyle = '#5d4037'; // 柄
    ctx.fillRect(wx, wy - 15, 3, 20);
    ctx.fillStyle = '#424242'; // 頭
    ctx.fillRect(wx - 5, wy - 18, 13, 8);
  } else if (category === 'Dagger') {
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(wx, wy - 8, 3, 8);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(wx, wy, 3, 4);
  }
  
  ctx.restore();
};

/**
 * ゲーム状態をCanvasに描画する関数
 */
export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  input: { mouse: any }
) => {
  try {
    const { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
    const { width, height } = ctx.canvas;
    const time = Date.now();

    // 画面クリア
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    if (!state.map || state.map.length === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Now Loading...', width / 2, height / 2);
      return;
    }

    ctx.save();
    const camX = Math.floor(state.camera.x);
    const camY = Math.floor(state.camera.y);
    ctx.translate(-camX, -camY);

    // --- 1. マップ描画 ---
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = startCol + (width / TILE_SIZE) + 1;
    const startRow = Math.floor(camY / TILE_SIZE);
    const endRow = startRow + (height / TILE_SIZE) + 1;

    const c1 = Math.max(0, startCol);
    const c2 = Math.min(MAP_WIDTH - 1, endCol);
    const r1 = Math.max(0, startRow);
    const r2 = Math.min(MAP_HEIGHT - 1, endRow);

    for (let y = r1; y <= r2; y++) {
      for (let x = c1; x <= c2; x++) {
        const tile = state.map[y]?.[x];
        if (!tile) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        switch (tile.type) {
          case 'grass': ctx.fillStyle = THEME.colors.grass; break;
          case 'dirt': ctx.fillStyle = THEME.colors.dirt; break;
          case 'wall': ctx.fillStyle = THEME.colors.wall; break;
          case 'mountain': ctx.fillStyle = THEME.colors.mountain; break;
          case 'water': ctx.fillStyle = THEME.colors.water; break;
          case 'dungeon_entrance': ctx.fillStyle = THEME.colors.dungeonEntrance; break;
          case 'stairs_down': ctx.fillStyle = THEME.colors.stairs; break;
          case 'portal_out': ctx.fillStyle = THEME.colors.portal; break;
          case 'town_entrance': ctx.fillStyle = THEME.colors.townEntrance; break;
          case 'shop_floor': ctx.fillStyle = THEME.colors.shopFloor; break;
          default: ctx.fillStyle = '#222';
        }
        
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        if (tile.type === 'town_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⌂', px + TILE_SIZE/2, py + TILE_SIZE/2 + 7);
        } else if (tile.type === 'dungeon_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('D', px + TILE_SIZE/2, py + TILE_SIZE/2 + 7);
        }
      }
    }

    // --- 2. オブジェクト描画 ---
    if (state.chests) {
      state.chests.forEach(chest => {
        if (chest.x < camX - 50 || chest.x > camX + width + 50 || chest.y < camY - 50 || chest.y > camY + height + 50) return;
        ctx.fillStyle = chest.opened ? '#5d4037' : '#ffd700';
        ctx.fillRect(chest.x + 5, chest.y + 10, 30, 20);
      });
    }

    if (state.droppedItems) {
      state.droppedItems.forEach(drop => {
        if (drop.x < camX - 50 || drop.x > camX + width + 50 || drop.y < camY - 50 || drop.y > camY + height + 50) return;
        const item = drop.item;
        ctx.strokeStyle = item.rarity === 'legendary' ? 'orange' : item.rarity === 'rare' ? 'cyan' : 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(drop.x - 8, drop.y - 8, 16, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', drop.x, drop.y + 4);
      });
    }

    // --- 3. エンティティ描画 ---
    if (state.npcs) state.npcs.forEach(npc => drawCharacter(ctx, npc, npc.x, npc.y, npc.width, npc.height, time));
    
    if (state.enemies) state.enemies.forEach(e => {
        drawCharacter(ctx, e, e.x, e.y, e.width, e.height, time);
        // HP Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x, e.y - 6, e.width, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(e.x, e.y - 6, e.width * (e.hp / e.maxHp), 4);
    });
    
    if (state.party) {
      state.party.forEach(comp => {
        if (comp.dead) return;
        drawCharacter(ctx, comp, comp.x, comp.y, comp.width, comp.height, time);
      });
    }

    if (state.player) {
      drawCharacter(ctx, state.player, state.player.x, state.player.y, state.player.width, state.player.height, time);
    }

    // パーティクル
    if (state.particles) {
      state.particles.forEach(pt => {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

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
    
    // --- 4. UI Overlay ---
    ctx.fillStyle = '#fff';
    ctx.font = '20px serif';
    ctx.textAlign = 'right';
    const locName = state.location.type === 'world' ? 'Overworld' : state.location.type === 'town' ? 'Village' : `Dungeon B${state.location.level}`;
    ctx.fillText(locName, width - 20, 30);
    ctx.fillText(`Gold: ${state.player.gold}`, width - 20, 60);

  } catch (error: any) {
    ctx.restore();
    ctx.fillStyle = '#300';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Render Error Occurred', ctx.canvas.width / 2, ctx.canvas.height / 2);
    console.error("Render Error:", error);
  }
};
