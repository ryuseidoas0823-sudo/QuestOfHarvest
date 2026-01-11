import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState } from '../types';
import { checkCollision, tryMove } from './Physics';
import { updateEnemyAI, createEnemy } from '../entities/Enemy';
import { generateRandomItem } from '../lib/ItemGenerator';

/**
 * ゲームの状態を1フレーム分更新する関数
 */
export const updateGame = (
  state: GameState, 
  input: { keys: { [key: string]: boolean }, mouse: any },
  isPaused: boolean
) => {
  if (isPaused) return;

  const { player, enemies, map, mode, settings } = state;
  const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;

  // 設定に基づく倍率取得
  const speedMult = settings.gameSpeed;
  const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];

  // --- 1. プレイヤーの移動処理 ---
  let dx = 0;
  let dy = 0;
  // スピード倍率適用
  const pSpeed = player.speed * speedMult;

  if (input.keys['w'] || input.keys['ArrowUp']) dy = -pSpeed;
  if (input.keys['s'] || input.keys['ArrowDown']) dy = pSpeed;
  if (input.keys['a'] || input.keys['ArrowLeft']) dx = -pSpeed;
  if (input.keys['d'] || input.keys['ArrowRight']) dx = pSpeed;

  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length) * pSpeed;
    dy = (dy / length) * pSpeed;
  }

  const newPos = tryMove(player, dx, dy, map);
  player.x = newPos.x;
  player.y = newPos.y;

  // --- 2. カメラの追従処理 ---
  state.camera.x = player.x - VIEWPORT_WIDTH / 2;
  state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
  state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

  // --- 3. 敵のAIと更新 ---
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    // 敵もゲームスピードの影響を受ける
    const eSpeed = enemy.speed * speedMult;
    
    // 簡易的に速度だけ書き換えてAI計算（本来はAI関数に渡すべき）
    const originalSpeed = enemy.speed;
    enemy.speed = eSpeed;
    const move = updateEnemyAI(enemy, player.x, player.y);
    enemy.speed = originalSpeed; // 戻す

    const enemyNextPos = tryMove(enemy, move.dx, move.dy, map);
    enemy.x = enemyNextPos.x;
    enemy.y = enemyNextPos.y;

    // 攻撃判定
    if (checkCollision(player, enemy)) {
      // 難易度による攻撃力補正
      player.hp -= 0.1 * diffConfig.hpMult; // 敵が強くなると痛い
      if (Math.random() > 0.9) {
        state.particles.push({
          x: player.x + player.width/2,
          y: player.y + player.height/2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 1.0,
          color: THEME.colors.blood,
          size: Math.random() * 3 + 1
        });
      }
    }
  });

  // --- 4. マウスインタラクション & 宝箱 ---
  // 宝箱を開ける（近くでクリック）
  if (input.mouse.leftDown) {
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;

    // 宝箱判定
    state.chests.forEach(chest => {
      if (!chest.opened) {
        const d = Math.sqrt((worldMx - chest.x)**2 + (worldMy - chest.y)**2);
        if (d < 40) { // クリック範囲
           chest.opened = true;
           // 中身をばら撒く
           chest.contents.forEach(item => {
             state.droppedItems.push({
               id: crypto.randomUUID(),
               item,
               x: chest.x + (Math.random() - 0.5) * 30,
               y: chest.y + (Math.random() - 0.5) * 30,
               life: 3000 // 長めに残る
             });
           });
           state.particles.push({
             x: chest.x + 20, y: chest.y + 20,
             vx: 0, vy: -2, life: 2.0, color: '#FFD700', size: 5
           });
        }
      }
    });

    if (mode === 'combat') {
      enemies.forEach(enemy => {
        if (enemy.dead) return;
        const d = Math.sqrt((worldMx - enemy.x)**2 + (worldMy - enemy.y)**2);
        if (d < 50) {
          // 防御力補正（ダメージ軽減）
          const defenseFactor = 1 / diffConfig.defenseMult;
          const damage = 2 * defenseFactor;
          
          enemy.hp -= damage;
          
          if (enemy.hp <= 0) {
            enemy.dead = true;
            // ドロップ判定
            // テスト用に高確率: 50% * 難易度倍率
            if (Math.random() < 0.5 * diffConfig.dropRateMult) {
               const item = generateRandomItem(player.level, diffConfig.rareDropMult);
               state.droppedItems.push({
                 id: crypto.randomUUID(),
                 item,
                 x: enemy.x,
                 y: enemy.y,
                 life: 1000
               });
            }
            player.xp += 10;
          }
        }
      });
    }
  }

  // --- 5. アイテム回収 ---
  state.droppedItems = state.droppedItems.filter(drop => {
    const d = Math.sqrt((player.x - drop.x)**2 + (player.y - drop.y)**2);
    if (d < 40) { // 吸い込み範囲
      // インベントリへ
      player.inventory.push({ ...drop.item, instanceId: crypto.randomUUID() });
      // 取得エフェクト
      state.particles.push({
         x: player.x, y: player.y,
         vx: 0, vy: -2, life: 1.0, color: '#00FF00', size: 3
      });
      return false; // 消滅
    }
    return true;
  });

  // --- 6. クリーンアップ ---
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
  });
  state.particles = state.particles.filter(p => p.life > 0);

  state.enemies = state.enemies.filter(e => !e.dead);
  if (state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
    const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
    // 生成時に難易度補正をHPにかける
    const newEnemy = createEnemy(ex, ey);
    newEnemy.maxHp *= diffConfig.hpMult;
    newEnemy.hp = newEnemy.maxHp;
    newEnemy.defense *= diffConfig.defenseMult;
    state.enemies.push(newEnemy);
  }
};
