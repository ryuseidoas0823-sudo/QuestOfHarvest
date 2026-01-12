import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity } from '../types';

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
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  
  // 影 (共通)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h - 2, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- プレイヤー描画 (人型) ---
  if (entity.type === 'player') {
    // 足
    ctx.fillStyle = '#1a237e'; // ズボン色
    ctx.fillRect(x + w * 0.3, y + h * 0.6, w * 0.15, h * 0.35); // 左足
    ctx.fillRect(x + w * 0.55, y + h * 0.6, w * 0.15, h * 0.35); // 右足

    // 胴体 (鎧)
    ctx.fillStyle = '#5c6bc0';
    ctx.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.35);
    ctx.fillStyle = '#e8eaf6'; // 胸当て
    ctx.fillRect(x + w * 0.3, y + h * 0.35, w * 0.4, h * 0.25);

    // 頭
    ctx.fillStyle = '#ffccbc'; // 肌色
    ctx.beginPath();
    ctx.arc(centerX, y + h * 0.2, w * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = '#ffca28'; // 金髪
    ctx.beginPath();
    ctx.arc(centerX, y + h * 0.18, w * 0.28, Math.PI, Math.PI * 2);
    ctx.fill();

    // マント
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.35);
    ctx.lineTo(x + w * 0.75, y + h * 0.35);
    ctx.lineTo(x + w * 0.85, y + h * 0.8);
    ctx.lineTo(x + w * 0.15, y + h * 0.8);
    ctx.fill();

    // 武器 (剣)
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(x + w * 0.75, y + h * 0.2, 4, 20); // 刀身
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + w * 0.75, y + h * 0.6, 4, 6); // 柄

  } 
  // --- 敵描画 (モンスター) ---
  else if (entity.type === 'enemy' || entity.type === 'boss') {
    const e = entity as EnemyEntity;
    ctx.fillStyle = e.color || '#ff0000';

    if (e.race === 'Slime') {
      // スライム: 半円 + 底部波打ち
      ctx.beginPath();
      ctx.arc(centerX, y + h * 0.7, w * 0.4, Math.PI, 0); // 上半分
      ctx.lineTo(x + w * 0.9, y + h * 0.9);
      ctx.quadraticCurveTo(centerX, y + h, x + w * 0.1, y + h * 0.9);
      ctx.fill();
      // 目
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(x + w*0.35, y + h*0.6, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w*0.65, y + h*0.6, 3, 0, Math.PI*2); ctx.fill();
      
    } else if (e.race === 'Goblin' || e.race === 'Orc') {
      // ゴブリン/オーク: 耳の長い人型
      ctx.fillRect(x + w*0.25, y + h*0.4, w*0.5, h*0.4); // 体
      ctx.beginPath(); ctx.arc(centerX, y + h*0.3, w*0.3, 0, Math.PI*2); ctx.fill(); // 頭
      // 耳
      ctx.beginPath(); 
      ctx.moveTo(x + w*0.2, y + h*0.25); ctx.lineTo(x, y + h*0.1); ctx.lineTo(x + w*0.2, y + h*0.35); ctx.fill();
      ctx.moveTo(x + w*0.8, y + h*0.25); ctx.lineTo(x + w, y + h*0.1); ctx.lineTo(x + w*0.8, y + h*0.35); ctx.fill();
      // 棍棒
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath(); ctx.ellipse(x + w*0.85, y + h*0.5, 4, 12, Math.PI/4, 0, Math.PI*2); ctx.fill();

    } else if (e.race === 'Bat') {
      // コウモリ: 翼と小さな体
      ctx.beginPath(); ctx.arc(centerX, y + h*0.5, w*0.15, 0, Math.PI*2); ctx.fill(); // 体
      // 翼 (アニメーション: 羽ばたき)
      const wingOffset = Math.sin(time / 100) * 5;
      ctx.beginPath();
      ctx.moveTo(centerX, y + h*0.5);
      ctx.quadraticCurveTo(x, y + h*0.2 + wingOffset, x, y + h*0.5);
      ctx.lineTo(centerX, y + h*0.6);
      ctx.moveTo(centerX, y + h*0.5);
      ctx.quadraticCurveTo(x + w, y + h*0.2 + wingOffset, x + w, y + h*0.5);
      ctx.lineTo(centerX, y + h*0.6);
      ctx.fill();

    } else if (e.race === 'Ghost') {
      // ゴースト: 浮遊感
      const floatY = Math.sin(time / 200) * 3;
      ctx.beginPath();
      ctx.arc(centerX, y + h*0.3 + floatY, w*0.35, Math.PI, 0);
      ctx.lineTo(x + w*0.85, y + h*0.9 + floatY);
      ctx.lineTo(centerX, y + h*0.8 + floatY);
      ctx.lineTo(x + w*0.15, y + h*0.9 + floatY);
      ctx.fill();
      // 目 (黒)
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(x + w*0.4, y + h*0.35 + floatY, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w*0.6, y + h*0.35 + floatY, 3, 0, Math.PI*2); ctx.fill();

    } else {
      // その他 (Skeleton, Wolfなど): 汎用モンスター形状
      ctx.fillRect(x + w*0.2, y + h*0.3, w*0.6, h*0.5);
      ctx.beginPath(); ctx.arc(centerX, y + h*0.25, w*0.25, 0, Math.PI*2); ctx.fill();
    }

    // ボスの強調
    if (e.type === 'boss') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }

  } 
  // --- その他 (NPC, 仲間) ---
  else {
    // 仲間やNPCは簡易人型
    ctx.fillStyle = entity.color;
    ctx.fillRect(x + w * 0.25, y + h * 0.35, w * 0.5, h * 0.5); // 体
    
    // 頭
    ctx.fillStyle = '#ffccbc';
    ctx.beginPath(); ctx.arc(centerX, y + h * 0.2, w * 0.25, 0, Math.PI * 2); ctx.fill();
    
    // 髪/帽子
    ctx.fillStyle = entity.color;
    ctx.beginPath(); ctx.arc(centerX, y + h * 0.18, w * 0.28, Math.PI, Math.PI * 2); ctx.fill();

    // 職業別アイコン (仲間)
    if (entity.type === 'companion') {
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const job = (entity as CompanionEntity).job;
      const icon = job === 'Warrior' ? '🛡️' : job === 'Mage' ? '🪄' : job === 'Archer' ? '🏹' : '✚';
      ctx.fillText(icon, centerX, y - 5);
    }
  }
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
    // カメラ位置の整数化 (描画ズレ防止)
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

        // 特殊タイルの文字表示
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

    // 攻撃範囲ガイド
    const weapon = state.player?.equipment?.mainHand?.weaponStats;
    if (state.mode === 'combat' && weapon) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      const px = state.player.x + state.player.width / 2;
      const py = state.player.y + state.player.height / 2;
      const mx = input.mouse.x + camX;
      const my = input.mouse.y + camY;
      
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(mx, my);
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
