import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState } from '../types';
import { checkCollision, tryMove } from './Physics';
import { updateEnemyAI, createEnemy } from '../entities/Enemy';
import { generateRandomItem, generateBossDrop } from '../lib/ItemGenerator';
import { generateDungeonMap, generateWorldMap } from '../world/MapGenerator';

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

  const speedMult = settings.gameSpeed;
  const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];

  // --- 1. プレイヤー移動 ---
  let dx = 0;
  let dy = 0;
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

  // --- 2. タイルインタラクション（マップ遷移） ---
  const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
  const ty = Math.floor((player.y + player.height/2) / TILE_SIZE);
  
  if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
    const tile = map[ty][tx];

    // ダンジョンに入る
    if (tile.type === 'dungeon_entrance' && tile.meta) {
      // 少しクールダウンがないと連続遷移してしまうため、簡易的にキー入力などを要求するのが良いが
      // ここでは即座に遷移させる（実際は確認ダイアログ推奨）
      state.location = {
        type: 'dungeon',
        level: 1,
        maxDepth: tile.meta.maxDepth,
        dungeonId: `dungeon_${Date.now()}`
      };
      
      const dungeon = generateDungeonMap(1, tile.meta.maxDepth);
      state.map = dungeon.map;
      state.chests = dungeon.chests;
      state.droppedItems = [];
      state.enemies = []; // 敵リセット
      state.player.x = dungeon.spawnPoint.x;
      state.player.y = dungeon.spawnPoint.y;
      
      // ダンジョンの敵スポーン
      spawnDungeonEnemies(state, 1);
    }
    // 次の階層へ
    else if (tile.type === 'stairs_down') {
      const nextLevel = state.location.level + 1;
      state.location.level = nextLevel;
      
      const dungeon = generateDungeonMap(nextLevel, state.location.maxDepth || 1);
      state.map = dungeon.map;
      state.chests = dungeon.chests;
      state.droppedItems = [];
      state.enemies = [];
      state.player.x = dungeon.spawnPoint.x;
      state.player.y = dungeon.spawnPoint.y;

      // ボススポーン
      if (dungeon.bossSpawn) {
        const boss = createEnemy(dungeon.bossSpawn.x, dungeon.bossSpawn.y);
        boss.type = 'boss';
        boss.width = 60;
        boss.height = 60;
        boss.maxHp *= 5 * diffConfig.hpMult; // ボス補正
        boss.hp = boss.maxHp;
        boss.attack *= 2;
        state.enemies.push(boss);
      } else {
        spawnDungeonEnemies(state, nextLevel);
      }
    }
    // 地上へ帰還
    else if (tile.type === 'portal_out') {
      state.location = { type: 'world', level: 0 };
      const world = generateWorldMap(); // 本来はセーブされたワールドに戻るべきだが簡易再生成
      state.map = world.map;
      state.chests = world.chests;
      state.enemies = [];
      state.droppedItems = [];
      state.player.x = world.spawnPoint.x;
      state.player.y = world.spawnPoint.y;
      spawnWorldEnemies(state);
    }
  }

  // --- 3. カメラ ---
  state.camera.x = player.x - VIEWPORT_WIDTH / 2;
  state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
  state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

  // --- 4. 敵AI ---
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    const eSpeed = enemy.speed * speedMult;
    const originalSpeed = enemy.speed;
    enemy.speed = eSpeed;
    const move = updateEnemyAI(enemy, player.x, player.y);
    enemy.speed = originalSpeed;

    const enemyNextPos = tryMove(enemy, move.dx, move.dy, map);
    enemy.x = enemyNextPos.x;
    enemy.y = enemyNextPos.y;

    // 攻撃
    if (checkCollision(player, enemy)) {
      let dmg = 0.1 * diffConfig.hpMult;
      if (enemy.type === 'boss') dmg *= 2; // ボスは痛い
      
      player.hp -= dmg;
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

  // --- 5. インタラクション ---
  if (input.mouse.leftDown) {
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;

    // 宝箱
    state.chests.forEach(chest => {
      if (!chest.opened) {
        const d = Math.sqrt((worldMx - chest.x)**2 + (worldMy - chest.y)**2);
        if (d < 40) {
           chest.opened = true;
           chest.contents.forEach(item => {
             state.droppedItems.push({
               id: crypto.randomUUID(),
               item,
               x: chest.x + (Math.random() - 0.5) * 30,
               y: chest.y + (Math.random() - 0.5) * 30,
               life: 3000
             });
           });
           state.particles.push({ x: chest.x, y: chest.y, vx: 0, vy: -2, life: 2.0, color: '#FFD700', size: 5 });
        }
      }
    });

    if (mode === 'combat') {
      enemies.forEach(enemy => {
        if (enemy.dead) return;
        const d = Math.sqrt((worldMx - enemy.x)**2 + (worldMy - enemy.y)**2);
        if (d < (enemy.type === 'boss' ? 80 : 50)) {
          const defenseFactor = 1 / diffConfig.defenseMult;
          enemy.hp -= 2 * defenseFactor;
          
          if (enemy.hp <= 0) {
            enemy.dead = true;
            
            // ドロップ
            if (enemy.type === 'boss') {
              // ボス確定ドロップ
              const bossItem = generateBossDrop(player.level);
              state.droppedItems.push({
                 id: crypto.randomUUID(),
                 item: bossItem,
                 x: enemy.x,
                 y: enemy.y,
                 life: 9999
              });
              // 脱出ポータル出現
              const tx = Math.floor(enemy.x / TILE_SIZE);
              const ty = Math.floor(enemy.y / TILE_SIZE);
              if (state.map[ty][tx]) {
                 state.map[ty][tx].type = 'portal_out';
                 state.map[ty][tx].solid = false;
              }
            } else {
              // 通常ドロップ
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
            }
            player.xp += enemy.type === 'boss' ? 500 : 10;
          }
        }
      });
    }
  }

  // --- 6. アイテム回収 ---
  state.droppedItems = state.droppedItems.filter(drop => {
    const d = Math.sqrt((player.x - drop.x)**2 + (player.y - drop.y)**2);
    if (d < 40) {
      player.inventory.push({ ...drop.item, instanceId: crypto.randomUUID() });
      state.particles.push({
         x: player.x, y: player.y,
         vx: 0, vy: -2, life: 1.0, color: '#00FF00', size: 3
      });
      return false;
    }
    return true;
  });

  // --- 7. クリーンアップ & スポーン ---
  state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
  state.particles = state.particles.filter(p => p.life > 0);
  state.enemies = state.enemies.filter(e => !e.dead);

  if (state.location.type === 'world' && state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    spawnWorldEnemies(state);
  }
};

// ヘルパー: ワールドでの敵スポーン
const spawnWorldEnemies = (state: GameState) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
  const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
  state.enemies.push(createEnemy(ex, ey));
};

// ヘルパー: ダンジョンでの敵スポーン (初期配置)
const spawnDungeonEnemies = (state: GameState, level: number) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const count = 5 + level; // 深いほど多い
  
  for(let i=0; i<count; i++) {
     let ex, ey;
     do {
       ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
       ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
     } while(state.map[Math.floor(ey/TILE_SIZE)][Math.floor(ex/TILE_SIZE)].solid);
     
     const e = createEnemy(ex, ey);
     e.maxHp *= (1 + level * 0.1); // 深いほど強い
     e.hp = e.maxHp;
     state.enemies.push(e);
  }
};
