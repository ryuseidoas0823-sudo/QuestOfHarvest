import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity } from '../types';
import { checkCollision, tryMove, checkMapCollision } from './Physics';
import { updateEnemyAI, createEnemy } from '../entities/Enemy';

/**
 * ゲームの状態を1フレーム分更新する関数
 * @param state 現在のゲーム状態（ミュータブルに更新）
 * @param input 入力状態
 */
export const updateGame = (
  state: GameState, 
  input: { keys: { [key: string]: boolean }, mouse: any }
) => {
  const { player, enemies, map, mode } = state;
  const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;

  // --- 1. プレイヤーの移動処理 ---
  let dx = 0;
  let dy = 0;

  if (input.keys['w'] || input.keys['ArrowUp']) dy = -player.speed;
  if (input.keys['s'] || input.keys['ArrowDown']) dy = player.speed;
  if (input.keys['a'] || input.keys['ArrowLeft']) dx = -player.speed;
  if (input.keys['d'] || input.keys['ArrowRight']) dx = player.speed;

  // 斜め移動の正規化
  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length) * player.speed;
    dy = (dy / length) * player.speed;
  }

  // 物理演算（衝突判定付き移動）
  const newPos = tryMove(player, dx, dy, map);
  player.x = newPos.x;
  player.y = newPos.y;

  // --- 2. カメラの追従処理 ---
  // プレイヤーを画面中心に据える
  state.camera.x = player.x - VIEWPORT_WIDTH / 2;
  state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
  
  // マップ端でのクランプ（カメラがマップ外を映さないように制限）
  state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

  // --- 3. 敵のAIと更新 ---
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    // AI移動ロジック
    const move = updateEnemyAI(enemy, player.x, player.y);
    // 敵同士の重なりを避ける簡易的な処理を追加しても良い
    const enemyNextPos = tryMove(enemy, move.dx, move.dy, map);
    enemy.x = enemyNextPos.x;
    enemy.y = enemyNextPos.y;

    // プレイヤーへの攻撃判定
    if (checkCollision(player, enemy)) {
      player.hp -= 0.1; // 接触ダメージ
      if (Math.random() > 0.9) {
        // 血のエフェクト
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

  // --- 4. マウスインタラクション（戦闘・建築） ---
  if (input.mouse.leftDown) {
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;

    if (mode === 'combat') {
      // 範囲攻撃（クリック地点周辺）
      enemies.forEach(enemy => {
        if (enemy.dead) return;
        const d = Math.sqrt((worldMx - enemy.x)**2 + (worldMy - enemy.y)**2);
        if (d < 50) { // 攻撃範囲半径
          enemy.hp -= 2;
          // ヒットエフェクト
          state.particles.push({
            x: enemy.x + enemy.width/2, 
            y: enemy.y + enemy.height/2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.5,
            color: '#fff',
            size: 2
          });
          
          if (enemy.hp <= 0) {
            enemy.dead = true;
            // 撃破エフェクト
            for(let i=0; i<10; i++) {
              state.particles.push({
                x: enemy.x, y: enemy.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: THEME.colors.blood,
                size: 4
              });
            }
            player.inventory.push({ id: 'loot', name: 'Gold' });
          }
        }
      });
    } else if (mode === 'build') {
      // タイル操作
      const tx = Math.floor(worldMx / TILE_SIZE);
      const ty = Math.floor(worldMy / TILE_SIZE);
      
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        const tile = map[ty][tx];
        if (tile.type === 'grass') {
          tile.type = 'dirt'; // 耕す
        } else if (tile.type === 'dirt') {
          tile.type = 'crop'; // 種を植える
          tile.cropGrowth = 0;
        }
      }
    }
  }

  // --- 5. パーティクルの更新と掃除 ---
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
  });
  state.particles = state.particles.filter(p => p.life > 0);

  // --- 6. 敵の掃除とスポーン ---
  state.enemies = state.enemies.filter(e => !e.dead);
  // 敵が減りすぎたらランダムスポーン
  if (state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
    const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
    state.enemies.push(createEnemy(ex, ey));
  }
};
