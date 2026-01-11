import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, CompanionEntity } from '../types';
import { checkCollision, tryMove } from './Physics';
import { updateEnemyAI, createEnemy } from '../entities/Enemy';
import { generateRandomItem, generateBossDrop } from '../lib/ItemGenerator';
import { generateDungeonMap, generateWorldMap, generateTownMap } from '../world/MapGenerator';

/**
 * ゲームの状態を1フレーム分更新する関数
 */
export const updateGame = (
  state: GameState, 
  input: { keys: { [key: string]: boolean }, mouse: any },
  isPaused: boolean
) => {
  if (isPaused) return;

  const { player, party, enemies, map, mode, settings, npcs, location } = state;
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

  // --- 2. 仲間 (Companion) AI ---
  party.forEach((comp, index) => {
    if (comp.dead) return;

    // 基本はプレイヤーを追従（半径3マス = 120px程度）
    const distToPlayer = Math.sqrt((player.x - comp.x)**2 + (player.y - comp.y)**2);
    let targetX = player.x;
    let targetY = player.y;
    let action = 'follow';

    // 戦闘モードなら近くの敵を狙う
    if (mode === 'combat' && enemies.length > 0) {
      let nearestDist = 300; // 索敵範囲
      let nearestEnemy = null;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        const d = Math.sqrt((enemy.x - comp.x)**2 + (enemy.y - comp.y)**2);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = enemy;
        }
      }
      if (nearestEnemy) {
        targetX = nearestEnemy.x;
        targetY = nearestEnemy.y;
        action = 'attack';
      }
    }

    let cdx = 0, cdy = 0;
    const cSpeed = comp.speed * speedMult;

    if (action === 'follow') {
      if (distToPlayer > 80) { // 離れすぎたら近づく
        const angle = Math.atan2(targetY - comp.y, targetX - comp.x);
        // 少しばらけさせる
        const offset = (index + 1) * 0.5;
        cdx = Math.cos(angle + offset) * cSpeed;
        cdy = Math.sin(angle + offset) * cSpeed;
      }
    } else if (action === 'attack') {
        const distToEnemy = Math.sqrt((targetX - comp.x)**2 + (targetY - comp.y)**2);
        if (distToEnemy > 40) { // 攻撃範囲まで近づく
            const angle = Math.atan2(targetY - comp.y, targetX - comp.x);
            cdx = Math.cos(angle) * cSpeed;
            cdy = Math.sin(angle) * cSpeed;
        } else {
            // 攻撃
            // 実際はクールダウンが必要だが簡易的に毎フレーム判定
            const enemy = enemies.find(e => Math.abs(e.x - targetX) < 1 && Math.abs(e.y - targetY) < 1);
            if (enemy && Math.random() > 0.95) { // 攻撃頻度
                enemy.hp -= comp.attack * 0.5; // ダメージ
                state.particles.push({
                    x: enemy.x, y: enemy.y, vx: 0, vy: 0, life: 0.5, color: '#00bfff', size: 5
                });
                if (enemy.hp <= 0) {
                    enemy.dead = true;
                    player.xp += 10;
                }
            }
        }
    }

    const nextC = tryMove(comp, cdx, cdy, map);
    comp.x = nextC.x;
    comp.y = nextC.y;
  });

  // --- 3. マップ遷移 & インタラクション ---
  const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
  const ty = Math.floor((player.y + player.height/2) / TILE_SIZE);
  
  if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
    const tile = map[ty][tx];

    // 村に入る
    if (tile.type === 'town_entrance') {
      state.location = {
        type: 'town',
        level: 0,
        townId: `town_${Date.now()}`
      };
      // 村マップ生成
      const town = generateTownMap(player.level);
      state.map = town.map;
      state.npcs = town.npcs;
      state.chests = [];
      state.droppedItems = [];
      state.enemies = []; // 村に敵はいない
      state.player.x = town.spawnPoint.x;
      state.player.y = town.spawnPoint.y;
      // 仲間も移動
      party.forEach(c => { c.x = town.spawnPoint.x; c.y = town.spawnPoint.y; });
    }
    // ダンジョンに入る
    else if (tile.type === 'dungeon_entrance' && tile.meta) {
      state.location = {
        type: 'dungeon',
        level: 1,
        maxDepth: tile.meta.maxDepth,
        dungeonId: `dungeon_${Date.now()}`
      };
      
      const dungeon = generateDungeonMap(1, tile.meta.maxDepth);
      state.map = dungeon.map;
      state.chests = dungeon.chests;
      state.npcs = [];
      state.droppedItems = [];
      state.enemies = [];
      state.player.x = dungeon.spawnPoint.x;
      state.player.y = dungeon.spawnPoint.y;
      party.forEach(c => { c.x = dungeon.spawnPoint.x; c.y = dungeon.spawnPoint.y; });
      spawnDungeonEnemies(state, 1);
    }
    // 次の階層へ
    else if (tile.type === 'stairs_down') {
      const nextLevel = state.location.level + 1;
      state.location.level = nextLevel;
      const dungeon = generateDungeonMap(nextLevel, state.location.maxDepth || 1);
      state.map = dungeon.map;
      state.chests = dungeon.chests;
      state.npcs = [];
      state.droppedItems = [];
      state.enemies = [];
      state.player.x = dungeon.spawnPoint.x;
      state.player.y = dungeon.spawnPoint.y;
      party.forEach(c => { c.x = dungeon.spawnPoint.x; c.y = dungeon.spawnPoint.y; });

      if (dungeon.bossSpawn) {
        const boss = createEnemy(dungeon.bossSpawn.x, dungeon.bossSpawn.y);
        boss.type = 'boss';
        boss.width = 60;
        boss.height = 60;
        boss.maxHp *= 5 * diffConfig.hpMult;
        boss.hp = boss.maxHp;
        boss.attack *= 2;
        state.enemies.push(boss);
      } else {
        spawnDungeonEnemies(state, nextLevel);
      }
    }
    // 地上へ帰還 (ポータル)
    else if (tile.type === 'portal_out') {
      // 村から出た場合はカウントリセット、ダンジョンから出た場合はそのまま
      if (location.type === 'town') {
        state.location = { type: 'world', level: 0, mapsSinceLastTown: 0 }; // リセット
      } else {
        const prev = state.location.mapsSinceLastTown || 0;
        state.location = { type: 'world', level: 0, mapsSinceLastTown: prev + 1 };
      }
      
      const world = generateWorldMap(state.location.mapsSinceLastTown);
      state.map = world.map;
      state.chests = world.chests;
      state.npcs = [];
      state.enemies = [];
      state.droppedItems = [];
      state.player.x = world.spawnPoint.x;
      state.player.y = world.spawnPoint.y;
      party.forEach(c => { c.x = world.spawnPoint.x; c.y = world.spawnPoint.y; });
      spawnWorldEnemies(state);
    }
  }

  // --- 4. NPCインタラクション（ショップ） ---
  if (location.type === 'town' && input.mouse.leftDown) {
    const mx = input.mouse.x + state.camera.x;
    const my = input.mouse.y + state.camera.y;
    
    // NPCクリック判定
    for (const npc of npcs) {
      const d = Math.sqrt((mx - npc.x)**2 + (my - npc.y)**2);
      if (d < 40) {
        state.activeShop = npc; // UI側で検知してモーダルを開く
      }
    }
  }

  // --- 5. カメラ追従 ---
  state.camera.x = player.x - VIEWPORT_WIDTH / 2;
  state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
  state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

  // --- 6. 敵AI & 戦闘 ---
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

    // 対プレイヤー
    if (checkCollision(player, enemy)) {
      let dmg = 0.1 * diffConfig.hpMult;
      if (enemy.type === 'boss') dmg *= 2;
      player.hp -= dmg;
      if (Math.random() > 0.9) {
        state.particles.push({
          x: player.x, y: player.y, vx: 0, vy: 0, life: 1.0, color: THEME.colors.blood, size: 3
        });
      }
    }
    
    // 対仲間
    party.forEach(comp => {
        if (!comp.dead && checkCollision(comp, enemy)) {
            let dmg = 0.1 * diffConfig.hpMult;
            comp.hp -= dmg;
            if (comp.hp <= 0) {
                comp.dead = true; // 死亡状態
            }
        }
    });
  });

  // プレイヤー攻撃（マウスクリック）
  if (input.mouse.leftDown && mode === 'combat') {
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;
    enemies.forEach(enemy => {
      if (enemy.dead) return;
      const d = Math.sqrt((worldMx - enemy.x)**2 + (worldMy - enemy.y)**2);
      if (d < 50) {
        enemy.hp -= 2 / diffConfig.defenseMult;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          // ドロップ処理
          if (enemy.type === 'boss') {
             const bossItem = generateBossDrop(player.level);
             state.droppedItems.push({ id: crypto.randomUUID(), item: bossItem, x: enemy.x, y: enemy.y, life: 9999 });
             const tx = Math.floor(enemy.x / TILE_SIZE);
             const ty = Math.floor(enemy.y / TILE_SIZE);
             if (state.map[ty][tx]) { state.map[ty][tx].type = 'portal_out'; state.map[ty][tx].solid = false; }
          } else {
             if (Math.random() < 0.5 * diffConfig.dropRateMult) {
                const item = generateRandomItem(player.level, diffConfig.rareDropMult);
                state.droppedItems.push({ id: crypto.randomUUID(), item, x: enemy.x, y: enemy.y, life: 1000 });
             }
          }
          player.xp += enemy.type === 'boss' ? 500 : 10;
          player.gold += Math.floor(Math.random() * 10) + 1; // お金獲得
        }
      }
    });
  }

  // --- 7. アイテム回収・クリーンアップ ---
  state.droppedItems = state.droppedItems.filter(drop => {
    const d = Math.sqrt((player.x - drop.x)**2 + (player.y - drop.y)**2);
    if (d < 40) {
      player.inventory.push({ ...drop.item, instanceId: crypto.randomUUID() });
      state.particles.push({ x: player.x, y: player.y, vx: 0, vy: -2, life: 1.0, color: '#00FF00', size: 3 });
      return false;
    }
    return true;
  });

  state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
  state.particles = state.particles.filter(p => p.life > 0);
  state.enemies = state.enemies.filter(e => !e.dead);

  // ワールドでの敵リスポーン（村以外）
  if (state.location.type === 'world' && state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    spawnWorldEnemies(state);
  }
};

const spawnWorldEnemies = (state: GameState) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
  const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
  state.enemies.push(createEnemy(ex, ey));
};

const spawnDungeonEnemies = (state: GameState, level: number) => {
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const count = 5 + level;
  for(let i=0; i<count; i++) {
     let ex, ey;
     do {
       ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
       ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
     } while(state.map[Math.floor(ey/TILE_SIZE)][Math.floor(ex/TILE_SIZE)].solid);
     const e = createEnemy(ex, ey);
     e.maxHp *= (1 + level * 0.1); e.hp = e.maxHp;
     state.enemies.push(e);
  }
};
