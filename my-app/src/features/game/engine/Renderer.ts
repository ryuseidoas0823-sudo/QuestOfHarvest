import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Tile, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity } from '../types';

/**
 * キャラクター（ドット絵風）を描画するヘルパー関数
 */
const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number // アニメーション用
) => {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  
  // 影を描画
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h - 2, w / 2.5, h / 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 基本形状の描画関数
  const drawBody = (color: string) => {
    ctx.fillStyle = color;
    // 体 (少し丸みを帯びた矩形)
    ctx.beginPath();
    ctx.roundRect(x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.6, 4);
    ctx.fill();
  };

  const drawHead = (color: string, skinColor: string = '#f8d9bd') => {
    // 顔（肌）
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(centerX, y + h * 0.25, w * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 髪/帽子（ベース）
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, y + h * 0.22, w * 0.38, Math.PI, Math.PI * 2); // 上半分
    ctx.fill();
  };

  // エンティティタイプごとの描画分け
  if (entity.type === 'player') {
    // 主人公: 勇者風
    const p = entity as PlayerEntity;
    drawBody('#1a237e'); // 青い服
    drawHead('#ffeb3b'); // 金髪
    
    // マント
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(x + w * 0.2, y + h * 0.4, w * 0.6, h * 0.4);
    
    // 剣
    ctx.fillStyle = '#e0e0e0'; // 刃
    ctx.fillRect(x + w * 0.8, y + h * 0.2, 4, 16);
    ctx.fillStyle = '#8d6e63'; // 柄
    ctx.fillRect(x + w * 0.8, y + h * 0.6, 4, 6);
    
  } else if (entity.type === 'companion') {
    // 仲間: 職業別
    const c = entity as CompanionEntity;
    
    if (c.job === 'Warrior') {
      drawBody('#607d8b'); // 鎧
      drawHead('#5d4037'); // 茶髪/兜
      // 盾
      ctx.fillStyle = '#455a64';
      ctx.beginPath();
      ctx.arc(x + w * 0.2, y + h * 0.6, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.job === 'Mage') {
      drawBody('#4a148c'); // 紫のローブ
      drawHead('#4a148c'); // フード
      // 杖
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.8, y + h * 0.2);
      ctx.lineTo(x + w * 0.8, y + h * 0.9);
      ctx.stroke();
      ctx.fillStyle = '#f44336'; // 宝石
      ctx.beginPath();
      ctx.arc(x + w * 0.8, y + h * 0.2, 3, 0, Math.PI*2);
      ctx.fill();
    } else if (c.job === 'Archer') {
      drawBody('#33691e'); // 緑の服
      drawHead('#f57f17'); // 帽子
      // 弓
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w * 0.1, y + h * 0.5, 10, -Math.PI/2, Math.PI/2);
      ctx.stroke();
    } else if (c.job === 'Cleric') {
      drawBody('#e0e0e0'); // 白衣
      drawHead('#90caf9'); // ベール
      // 十字架
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x + w * 0.4, y + h * 0.4, 8, 2);
      ctx.fillRect(x + w * 0.5 - 1, y + h * 0.35, 2, 8);
    }

  } else if (entity.type === 'npc') {
    // 村人: 役割別
    const npc = entity as NPCEntity;
    const roleColor = {
      inn: '#795548',    // 宿屋 (茶)
      weapon: '#424242', // 武器屋 (グレー)
      item: '#2e7d32',   // 道具屋 (緑)
      revive: '#c62828', // 蘇生屋 (赤)
      recruit: '#0277bd', // 紹介屋 (青)
      villager: '#9e9e9e'
    }[npc.role] || '#9e9e9e';

    drawBody(roleColor);
    drawHead('#5d4037'); // 共通の髪色

    // 役割アイコン
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    let icon = '';
    if (npc.role === 'inn') icon = 'Zzz';
    if (npc.role === 'weapon') icon = '⚔️';
    if (npc.role === 'item') icon = '💊';
    if (npc.role === 'revive') icon = '✚';
    if (npc.role === 'recruit') icon = '🤝';
    
    if (icon) {
      ctx.fillText(icon, centerX, y - 5);
    }

  } else if (entity.type === 'enemy' || entity.type === 'boss') {
    // 敵
    const e = entity as EnemyEntity;
    const color = e.type === 'boss' ? THEME.colors.boss : e.color;
    
    ctx.fillStyle = color;
    
    if (e.type === 'boss') {
      // ボス: トゲトゲした形状
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + w, centerY);
      ctx.lineTo(centerX, y + h);
      ctx.lineTo(x, centerY);
      ctx.fill();
      // 目
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, w/4, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.fillRect(centerX-2, centerY-10, 4, 20); // 縦長の瞳
    } else {
      // スライム型
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.quadraticCurveTo(x, y, centerX, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + h);
      ctx.fill();
      // 目
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + w*0.3, y + h*0.4, 4, 0, Math.PI*2);
      ctx.arc(x + w*0.7, y + h*0.4, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x + w*0.3, y + h*0.4, 2, 0, Math.PI*2);
      ctx.arc(x + w*0.7, y + h*0.4, 2, 0, Math.PI*2);
      ctx.fill();
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
  const { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const { width, height } = ctx.canvas;
  const time = Date.now();

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
          ctx.beginPath();
          ctx.moveTo(px + 5, py + 5);
          ctx.lineTo(px + 15, py + 15);
          ctx.stroke();
        }
        else if (tile.type === 'mountain') {
          ctx.fillStyle = '#2c2c2c';
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE);
          ctx.lineTo(px + TILE_SIZE/2, py);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
          ctx.fill();
        }
        else if (tile.type === 'dungeon_entrance') {
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI*2);
          ctx.fill();
        }
        else if (tile.type === 'town_entrance') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px serif';
          ctx.textAlign = 'center';
          ctx.fillText('⌂', px + TILE_SIZE/2, py + TILE_SIZE - 5);
        }
      }
    }
  }

  // --- 2. 宝箱 ---
  state.chests.forEach(chest => {
    ctx.fillStyle = chest.opened ? '#5d4037' : '#ffd700';
    ctx.fillRect(chest.x + 5, chest.y + 10, 30, 20);
    if (!chest.opened) {
      ctx.fillStyle = '#000';
      ctx.fillRect(chest.x + 18, chest.y + 15, 4, 6);
    }
  });

  // --- 3. ドロップアイテム ---
  state.droppedItems.forEach(drop => {
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

  // --- 4. エンティティ描画 (順序: NPC -> 敵 -> 仲間 -> プレイヤー) ---
  
  // NPC
  state.npcs.forEach(npc => {
    drawCharacter(ctx, npc, npc.x, npc.y, npc.width, npc.height, time);
  });

  // 敵
  state.enemies.forEach(e => {
    drawCharacter(ctx, e, e.x, e.y, e.width, e.height, time);
    
    // HP Bar
    const w = e.type === 'boss' ? e.width * 1.5 : e.width;
    const h = e.type === 'boss' ? e.height * 1.5 : e.height;
    const drawX = e.x - (w - e.width)/2;
    const drawY = e.y - (h - e.height)/2;
    
    const hpPercent = e.hp / e.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(drawX, drawY - 10, w, 6);
    ctx.fillStyle = hpPercent > 0.5 ? 'green' : 'red';
    ctx.fillRect(drawX, drawY - 10, w * hpPercent, 6);
    
    if (e.type === 'boss') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY - 10, w, 6);
      ctx.fillStyle = '#fff';
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText("BOSS", drawX + w/2, drawY - 15);
    }
  });

  // 仲間
  state.party.forEach(comp => {
    if (comp.dead) {
      // 墓石
      ctx.fillStyle = '#bdbdbd';
      ctx.beginPath();
      ctx.moveTo(comp.x + comp.width/2, comp.y);
      ctx.lineTo(comp.x + comp.width, comp.y + comp.height);
      ctx.lineTo(comp.x, comp.y + comp.height);
      ctx.fill();
      return;
    }
    drawCharacter(ctx, comp, comp.x, comp.y, comp.width, comp.height, time);
    
    // HP Bar
    const hpPercent = comp.hp / comp.maxHp;
    ctx.fillStyle = 'black';
    ctx.fillRect(comp.x, comp.y - 6, comp.width, 4);
    ctx.fillStyle = hpPercent > 0.5 ? 'cyan' : 'red';
    ctx.fillRect(comp.x, comp.y - 6, comp.width * hpPercent, 4);
  });

  // プレイヤー
  drawCharacter(ctx, state.player, state.player.x, state.player.y, state.player.width, state.player.height, time);

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

  // UI Overlay
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '20px serif';
  ctx.textAlign = 'right';
  const locName = state.location.type === 'world' ? 'Overworld' : state.location.type === 'town' ? 'Village' : `Dungeon B${state.location.level}`;
  ctx.fillText(locName, width - 20, 30);
  ctx.fillText(`Gold: ${state.player.gold}`, width - 20, 60);
};
