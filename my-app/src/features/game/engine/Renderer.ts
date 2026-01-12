import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity } from '../types';

/**
 * キャラクターを描画するヘルパー関数 (軽量版)
 * 複雑なパスや影の計算を省略し、単純な図形で描画します。
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
  // ボディ描画 (単純な矩形)
  let color = entity.color;
  
  // エンティティごとの色調整
  if (entity.type === 'npc') {
    const npc = entity as NPCEntity;
    const roleColor: Record<string, string> = {
      inn: '#795548', weapon: '#424242', item: '#2e7d32', 
      revive: '#c62828', recruit: '#0277bd', villager: '#9e9e9e'
    };
    color = roleColor[npc.role] || '#9e9e9e';
  } else if (entity.type === 'enemy' || entity.type === 'boss') {
    const e = entity as EnemyEntity;
    color = e.color || (e.type === 'boss' ? THEME.colors.boss : THEME.colors.enemy);
  } else if (entity.type === 'companion') {
    color = THEME.colors.companion;
  } else if (entity.type === 'player') {
    color = THEME.colors.player;
  }

  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // 簡易的な向き/顔の表現 (目など)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  // 右向きと仮定して目を描画
  ctx.fillRect(x + w * 0.6, y + h * 0.2, w * 0.2, h * 0.2);

  // ボスやエリートの強調
  if (entity.type === 'boss') {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
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

    // 1. 画面クリア (真っ黒ではなく、濃いグレーにして描画が動いているか確認しやすくする)
    ctx.fillStyle = '#111'; 
    ctx.fillRect(0, 0, width, height);

    // マップデータチェック
    if (!state.map || state.map.length === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Map data is empty...', width / 2, height / 2);
      return;
    }

    ctx.save();
    // カメラ位置のサニタイズ (NaN対策)
    const camX = isNaN(state.camera.x) ? 0 : state.camera.x;
    const camY = isNaN(state.camera.y) ? 0 : state.camera.y;
    ctx.translate(-Math.floor(camX), -Math.floor(camY)); // 整数座標に合わせて描画ズレ防止

    // --- 2. マップ描画 (カリング付き) ---
    // 画面に見えている範囲だけを描画
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = startCol + (width / TILE_SIZE) + 1;
    const startRow = Math.floor(camY / TILE_SIZE);
    const endRow = startRow + (height / TILE_SIZE) + 1;

    // 範囲制限
    const c1 = Math.max(0, startCol);
    const c2 = Math.min(MAP_WIDTH - 1, endCol);
    const r1 = Math.max(0, startRow);
    const r2 = Math.min(MAP_HEIGHT - 1, endRow);

    for (let y = r1; y <= r2; y++) {
      for (let x = c1; x <= c2; x++) {
        const row = state.map[y];
        if (!row) continue;
        const tile = row[x];
        if (!tile) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        // シンプルな色分け描画
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

        // 特殊タイルの文字表示 (簡易版)
        if (tile.type === 'town_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('T', px + TILE_SIZE/2, py + TILE_SIZE/2 + 7);
        } else if (tile.type === 'dungeon_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('D', px + TILE_SIZE/2, py + TILE_SIZE/2 + 7);
        }
      }
    }

    // --- 3. オブジェクト描画 ---
    
    // 宝箱
    if (state.chests) {
      state.chests.forEach(chest => {
        // 画面内判定
        if (chest.x < camX - 50 || chest.x > camX + width + 50 || chest.y < camY - 50 || chest.y > camY + height + 50) return;
        
        ctx.fillStyle = chest.opened ? '#5d4037' : '#ffd700';
        ctx.fillRect(chest.x + 5, chest.y + 10, 30, 20);
      });
    }

    // ドロップアイテム (シャドウなどの重い処理を削除)
    if (state.droppedItems) {
      state.droppedItems.forEach(drop => {
        if (drop.x < camX - 50 || drop.x > camX + width + 50 || drop.y < camY - 50 || drop.y > camY + height + 50) return;

        const item = drop.item;
        // レアリティに応じた色枠
        ctx.strokeStyle = item.rarity === 'legendary' ? 'orange' : item.rarity === 'rare' ? 'cyan' : 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(drop.x - 8, drop.y - 8, 16, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', drop.x, drop.y + 4);
      });
    }

    // --- 4. エンティティ描画 ---
    const time = Date.now();

    if (state.npcs) state.npcs.forEach(npc => drawCharacter(ctx, npc, npc.x, npc.y, npc.width, npc.height, time));
    if (state.enemies) state.enemies.forEach(e => {
        drawCharacter(ctx, e, e.x, e.y, e.width, e.height, time);
        // HP Bar (簡易)
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

    // パーティクル (数を制限したり描画を単純化)
    if (state.particles) {
      ctx.fillStyle = '#fff';
      state.particles.forEach(pt => {
        ctx.globalAlpha = Math.max(0, pt.life); // 透明度は使うが、影はなし
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size); // 円ではなく矩形で描画
      });
      ctx.globalAlpha = 1.0;
    }

    // マウスカーソル (攻撃範囲)
    // 重いパス描画を避けるため、単純な線にする
    const weapon = state.player?.equipment?.mainHand?.weaponStats;
    if (state.mode === 'combat' && weapon) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
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
    
    // --- 5. UI & Debug Info (最前面) ---
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // デバッグ情報表示
    const debugInfo = [
      `FPS: --`,
      `Player: (${Math.floor(state.player.x)}, ${Math.floor(state.player.y)})`,
      `Camera: (${Math.floor(camX)}, ${Math.floor(camY)})`,
      `Map: ${state.map[0]?.length}x${state.map.length}`,
      `Enemies: ${state.enemies.length}`,
      `Particles: ${state.particles.length}`
    ];

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(5, 5, 200, 120);
    
    ctx.fillStyle = '#0f0';
    debugInfo.forEach((line, i) => {
      ctx.fillText(line, 10, 10 + i * 20);
    });

    // ゴールド表示
    ctx.fillStyle = '#ffd700';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${state.player.gold}`, width - 20, 60);

  } catch (error: any) {
    // エラーハンドリング
    console.error("Render Error:", error);
    // エラー時は画面を赤くしてメッセージを出す
    ctx.restore(); // save状態から復帰を試みる
    ctx.fillStyle = '#300';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Render Error Occurred', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(error.message || 'Unknown Error', ctx.canvas.width / 2, ctx.canvas.height / 2 + 10);
  }
};
