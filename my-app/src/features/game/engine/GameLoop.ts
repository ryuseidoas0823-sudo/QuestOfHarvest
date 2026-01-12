import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, CompanionEntity } from '../types';
import { checkCollision, tryMove, checkAttackHit } from './Physics';
import { generateEnemy } from '../lib/EnemyGenerator';
import { generateRandomItem, generateBossDrop } from '../lib/ItemGenerator';
import { generateDungeonMap, generateWorldMap, generateTownMap } from '../world/MapGenerator';

const TILE_SIZE = 40;

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
  const now = Date.now();

  // 定数を確実に取得
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

  // --- 2. 攻撃処理 ---
  if (input.mouse.leftDown && mode === 'combat') {
    const weapon = player.equipment.mainHand?.weaponStats || {
      category: 'Fist',
      range: 1, width: 0.8, shape: 'line',
      attackSpeed: 0.5, knockback: 0.5,
      hitRate: 0.9, critRate: 0.1,
      slash: 0, blunt: 5, pierce: 0
    } as any; // any cast to avoid strict type checks for default

    if (!player.lastAttackTime || now - player.lastAttackTime > weapon.attackSpeed * 1000 / speedMult) {
      player.lastAttackTime = now;

      const worldMx = input.mouse.x + state.camera.x;
      const worldMy = input.mouse.y + state.camera.y;
      
      const angle = Math.atan2(worldMy - (player.y + player.height/2), worldMx - (player.x + player.width/2));
      const rangePx = weapon.range * TILE_SIZE;
      
      // Effect
      state.particles.push({
        x: player.x + player.width/2 + Math.cos(angle) * rangePx * 0.5, 
        y: player.y + player.height/2 + Math.sin(angle) * rangePx * 0.5, 
        vx: 0, vy: 0, life: 0.2, color: '#fff', size: 5
      });

      enemies.forEach(enemy => {
        if (enemy.dead) return;

        const hit = checkAttackHit(
          player, enemy, 
          weapon.shape, 
          rangePx, 
          weapon.shape === 'line' ? weapon.width * TILE_SIZE : weapon.width, 
          angle
        );

        if (hit) {
          if (Math.random() > weapon.hitRate) {
             state.particles.push({x: enemy.x, y: enemy.y, vx:0, vy:-1, life:0.5, color: 'gray', size: 10});
             return;
          }

          const rawDmg = ((weapon.slash || 0) + (weapon.blunt || 0) + (weapon.pierce || 0) + player.attack) * (1 + player.level * 0.1);
          let damage = Math.max(1, rawDmg - enemy.defense);

          if (Math.random() < weapon.critRate) {
            damage *= 1.5;
            state.particles.push({x: enemy.x, y: enemy.y, vx:0, vy:-2, life:0.5, color: 'yellow', size: 15});
          }

          enemy.hp -= damage;

          // Knockback
          const knockDist = weapon.knockback * TILE_SIZE;
          const kbX = Math.cos(angle) * knockDist;
          const kbY = Math.sin(angle) * knockDist;
          const kbPos = tryMove(enemy, kbX, kbY, map);
          enemy.x = kbPos.x;
          enemy.y = kbPos.y;

          state.particles.push({x: enemy.x, y: enemy.y, vx:0, vy:0, life:0.3, color: 'red', size: 5});

          if (enemy.hp <= 0) {
            enemy.dead = true;
            if (enemy.type === 'boss') {
               const bossItem = generateBossDrop(player.level);
               state.droppedItems.push({ id: crypto.randomUUID(), item: bossItem, x: enemy.x, y: enemy.y, life: 9999 });
               const tx = Math.floor(enemy.x / TILE_SIZE);
               const ty = Math.floor(enemy.y / TILE_SIZE);
               if (state.map[ty] && state.map[ty][tx]) { state.map[ty][tx].type = 'portal_out'; state.map[ty][tx].solid = false; }
            } else {
               if (Math.random() < enemy.dropRate * diffConfig.dropRateMult) {
                  const item = generateRandomItem(player.level, diffConfig.rareDropMult);
                  state.droppedItems.push({ id: crypto.randomUUID(), item, x: enemy.x, y: enemy.y, life: 1000 });
               }
            }
            player.xp += enemy.level * 10;
            player.gold += enemy.level * 5;
          }
        }
      });
    }
  }

  // --- 3. 仲間 AI ---
  party.forEach((comp, index) => {
    if (comp.dead) return;
    const distToPlayer = Math.sqrt((player.x - comp.x)**2 + (player.y - comp.y)**2);
    let targetX = player.x;
    let targetY = player.y;
    let action = 'follow';

    if (mode === 'combat' && enemies.length > 0) {
      let nearestDist = 300;
      let nearestEnemy = null;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        const d = Math.sqrt((enemy.x - comp.x)**2 + (enemy.y - comp.y)**2);
        if (d < nearestDist) { nearestDist = d; nearestEnemy = enemy; }
      }
      if (nearestEnemy) { targetX = nearestEnemy.x; targetY = nearestEnemy.y; action = 'attack'; }
    }

    let cdx = 0, cdy = 0;
    const cSpeed = comp.speed * speedMult;

    if (action === 'follow') {
      if (distToPlayer > 80) {
        const angle = Math.atan2(targetY - comp.y, targetX - comp.x);
        const offset = (index + 1) * 0.5;
        cdx = Math.cos(angle + offset) * cSpeed;
        cdy = Math.sin(angle + offset) * cSpeed;
      }
    } else if (action === 'attack') {
        const distToEnemy = Math.sqrt((targetX - comp.x)**2 + (targetY - comp.y)**2);
        if (distToEnemy > 40) {
            const angle = Math.atan2(targetY - comp.y, targetX - comp.x);
            cdx = Math.cos(angle) * cSpeed;
            cdy = Math.sin(angle) * cSpeed;
        } else {
            const enemy = enemies.find(e => Math.abs(e.x - targetX) < 5 && Math.abs(e.y - targetY) < 5);
            if (enemy && (!comp.lastAttackTime || now - comp.lastAttackTime > 1000)) {
                comp.lastAttackTime = now;
                enemy.hp -= comp.attack; 
                state.particles.push({x: enemy.x, y: enemy.y, vx:0, vy:0, life:0.5, color: '#00bfff', size: 5});
                if (enemy.hp <= 0) { 
                  enemy.dead = true; 
                  player.xp += 10;
                  player.gold += 5;
                }
            }
        }
    }
    const nextC = tryMove(comp, cdx, cdy, map);
    comp.x = nextC.x; comp.y = nextC.y;
  });

  // --- 4. マップ遷移 ---
  const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
  const ty = Math.floor((player.y + player.height/2) / TILE_SIZE);
  
  if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
    const tile = map[ty][tx];

    if (tile.type === 'town_entrance') {
      state.location = { type: 'town', level: 0, townId: `town_${Date.now()}` };
      const town = generateTownMap(player.level);
      state.map = town.map; state.npcs = town.npcs; state.chests = []; state.droppedItems = []; state.enemies = [];
      state.player.x = town.spawnPoint.x; state.player.y = town.spawnPoint.y;
      party.forEach(c => { c.x = town.spawnPoint.x; c.y = town.spawnPoint.y; });
    }
    else if (tile.type === 'dungeon_entrance' && tile.meta) {
      state.location = { type: 'dungeon', level: 1, maxDepth: tile.meta.maxDepth, dungeonId: `dungeon_${Date.now()}` };
      const dungeon = generateDungeonMap(1, tile.meta.maxDepth);
      state.map = dungeon.map; state.chests = dungeon.chests; state.npcs = []; state.droppedItems = []; state.enemies = [];
      state.player.x = dungeon.spawnPoint.x; state.player.y = dungeon.spawnPoint.y;
      party.forEach(c => { c.x = dungeon.spawnPoint.x; c.y = dungeon.spawnPoint.y; });
      spawnDungeonEnemies(state, 1);
    }
    else if (tile.type === 'stairs_down') {
      const nextLevel = state.location.level + 1;
      state.location.level = nextLevel;
      const dungeon = generateDungeonMap(nextLevel, state.location.maxDepth || 1);
      state.map = dungeon.map; state.chests = dungeon.chests; state.npcs = []; state.droppedItems = []; state.enemies = [];
      state.player.x = dungeon.spawnPoint.x; state.player.y = dungeon.spawnPoint.y;
      party.forEach(c => { c.x = dungeon.spawnPoint.x; c.y = dungeon.spawnPoint.y; });
      if (dungeon.bossSpawn) {
        const boss = generateEnemy(dungeon.bossSpawn.x, dungeon.bossSpawn.y, player.level + 5, true);
        boss.maxHp *= diffConfig.hpMult; boss.hp = boss.maxHp;
        state.enemies.push(boss);
      } else {
        spawnDungeonEnemies(state, nextLevel);
      }
    }
    else if (tile.type === 'portal_out') {
      if (location.type === 'town') { state.location = { type: 'world', level: 0, mapsSinceLastTown: 0 }; }
      else { const prev = state.location.mapsSinceLastTown || 0; state.location = { type: 'world', level: 0, mapsSinceLastTown: prev + 1 }; }
      const world = generateWorldMap(state.location.mapsSinceLastTown);
      state.map = world.map; state.chests = world.chests; state.npcs = []; state.enemies = []; state.droppedItems = [];
      state.player.x = world.spawnPoint.x; state.player.y = world.spawnPoint.y;
      party.forEach(c => { c.x = world.spawnPoint.x; c.y = world.spawnPoint.y; });
      spawnWorldEnemies(state);
    }
  }

  // --- 5. NPCインタラクション ---
  if (location.type === 'town' && input.mouse.leftDown) {
    const mx = input.mouse.x + state.camera.x;
    const my = input.mouse.y + state.camera.y;
    for (const npc of npcs) {
      const d = Math.sqrt((mx - npc.x)**2 + (my - npc.y)**2);
      if (d < 40) { state.activeShop = npc; }
    }
  }

  // --- 6. カメラ ---
  state.camera.x = player.x - VIEWPORT_WIDTH / 2;
  state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
  state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

  // --- 7. 敵AI & 戦闘 ---
  enemies.forEach(enemy => {
    if (enemy.dead) return;
    const eSpeed = enemy.speed * speedMult;
    // 簡易速度適用
    enemy.x += (Math.random() - 0.5) * eSpeed; 
    enemy.y += (Math.random() - 0.5) * eSpeed;

    // プレイヤーに向かう
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    // 遠すぎなければ追尾
    const distToP = Math.sqrt((player.x - enemy.x)**2 + (player.y - enemy.y)**2);
    if (distToP < 300) {
      enemy.x += Math.cos(angle) * eSpeed;
      enemy.y += Math.sin(angle) * eSpeed;
    }

    const enemyNextPos = tryMove(enemy, 0, 0, map); // 壁判定のみ利用
    enemy.x = enemyNextPos.x; enemy.y = enemyNextPos.y;

    if (checkCollision(player, enemy)) {
      let dmg = enemy.attack * 0.1 * diffConfig.hpMult;
      if (enemy.type === 'boss') dmg *= 1.5;
      player.hp -= Math.max(1, dmg - player.defense * 0.05);
      if (Math.random() > 0.9) state.particles.push({x: player.x, y: player.y, vx:0, vy:0, life:1.0, color: THEME.colors.blood, size:3});
    }
    party.forEach(comp => {
        if (!comp.dead && checkCollision(comp, enemy)) {
            let dmg = enemy.attack * 0.1 * diffConfig.hpMult;
            comp.hp -= Math.max(1, dmg - comp.defense * 0.05);
            if (comp.hp <= 0) comp.dead = true;
        }
    });
  });

  // --- 8. アイテム回収・クリーンアップ ---
  if (input.mouse.leftDown) { // Chests
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;
    state.chests.forEach(chest => {
      if (!chest.opened) {
        const d = Math.sqrt((worldMx - chest.x)**2 + (worldMy - chest.y)**2);
        if (d < 40) {
           chest.opened = true;
           chest.contents.forEach(item => {
             state.droppedItems.push({ id: crypto.randomUUID(), item, x: chest.x + (Math.random()-0.5)*30, y: chest.y + (Math.random()-0.5)*30, life: 3000 });
           });
           state.particles.push({ x: chest.x, y: chest.y, vx: 0, vy: -2, life: 2.0, color: '#FFD700', size: 5 });
        }
      }
    });
  }

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

  if (state.location.type === 'world' && state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    spawnWorldEnemies(state);
  }
};

const spawnWorldEnemies = (state: GameState) => {
  // 重要: ここでも変数を分割代入して定義する
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
  const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
  state.enemies.push(generateEnemy(ex, ey, state.player.level));
};

const spawnDungeonEnemies = (state: GameState, level: number) => {
  // 重要: ここでも変数を分割代入して定義する
  const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
  const count = 5 + level;
  for(let i=0; i<count; i++) {
     let ex, ey;
     do {
       ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
       ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
     } while(state.map[Math.floor(ey/TILE_SIZE)][Math.floor(ex/TILE_SIZE)].solid);
     state.enemies.push(generateEnemy(ex, ey, state.player.level + level));
  }
};
