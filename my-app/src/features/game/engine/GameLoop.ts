import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, CompanionEntity, WeaponStats, Skill } from '../types';
import { checkCollision, tryMove, checkAttackHit } from './Physics';
import { generateEnemy } from '../lib/EnemyGenerator';
import { generateRandomItem, generateBossDrop, generateMaterial } from '../lib/ItemGenerator';
import { generateDungeonMap, generateWorldChunk, generateTownMap, generateMineMap } from '../world/MapGenerator';
import { SKILL_DATABASE } from '../entities/Player';

export const updateGame = (
  state: GameState, 
  input: { keys: { [key: string]: boolean }, mouse: any },
  isPaused: boolean
) => {
  if (isPaused) return;

  const { player, party, enemies, map, mode, settings, location, resources } = state;
  const now = Date.now();
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;
  const speedMult = settings.gameSpeed;
  const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];

  // 1. プレイヤー移動
  let dx = 0, dy = 0; const pSpeed = player.speed * speedMult;
  if (input.keys['w'] || input.keys['ArrowUp']) dy = -pSpeed;
  if (input.keys['s'] || input.keys['ArrowDown']) dy = pSpeed;
  if (input.keys['a'] || input.keys['ArrowLeft']) dx = -pSpeed;
  if (input.keys['d'] || input.keys['ArrowRight']) dx = pSpeed;
  if (dx !== 0 && dy !== 0) { const l = Math.sqrt(dx*dx+dy*dy); dx=(dx/l)*pSpeed; dy=(dy/l)*pSpeed; }
  const newPos = tryMove(player, dx, dy, map); player.x = newPos.x; player.y = newPos.y;

  // 攻撃アニメーション終了判定
  if (player.isAttacking && player.attackStartTime && now - player.attackStartTime > (player.attackDuration || 200)) {
    player.isAttacking = false;
  }

  // --- 共通攻撃処理関数 ---
  const executeAttack = (weapon: WeaponStats, dmgMult: number = 1.0, isSkill: boolean = false) => {
    const worldMx = input.mouse.x + state.camera.x;
    const worldMy = input.mouse.y + state.camera.y;
    const angle = Math.atan2(worldMy - (player.y + player.height/2), worldMx - (player.x + player.width/2));
    const rangePx = weapon.range * TILE_SIZE;
    
    player.isAttacking = true; 
    player.attackStartTime = now; 
    player.attackDuration = isSkill ? 300 : 200; 
    player.attackDirection = angle;
    
    state.particles.push({ 
      x: player.x + player.width/2 + Math.cos(angle)*rangePx*0.5, 
      y: player.y + player.height/2 + Math.sin(angle)*rangePx*0.5, 
      vx: 0, vy: 0, life: 0.2, color: isSkill ? '#ffeb3b' : '#fff', size: isSkill ? 8 : 5 
    });

    // 敵への攻撃
    enemies.forEach(enemy => {
      if (enemy.dead) return;
      if (checkAttackHit(player, enemy, weapon.shape, rangePx, weapon.shape==='line'?weapon.width*TILE_SIZE:weapon.width, angle)) {
        const rawDmg = ((weapon.slash||0) + (weapon.blunt||0) + (weapon.pierce||0) + player.attack) * (1 + player.level * 0.1);
        const damage = Math.max(1, (rawDmg * dmgMult) - enemy.defense);
        enemy.hp -= damage;
        state.particles.push({x: enemy.x, y: enemy.y, vx:0, vy:0, life:0.3, color: 'red', size: 5});
        if (enemy.hp <= 0) {
            enemy.dead = true;
            if (Math.random() < (enemy.dropRate || 0.1)) {
              state.droppedItems.push({ id: crypto.randomUUID(), item: generateRandomItem(player.level), x: enemy.x, y: enemy.y, life: 1000 });
            }
            player.xp += enemy.level * 10; player.gold += enemy.level * 5;
        }
      }
    });

    // 資源への採掘判定
    if (resources) {
      resources.forEach(res => {
        if (res.dead) return;
        const d = Math.sqrt((res.x+res.width/2 - (player.x+player.width/2))**2 + (res.y+res.height/2 - (player.y+player.height/2))**2);
        if (d < rangePx) {
            let miningPower = 1;
            if (weapon.category === 'Pickaxe' && (res.resourceType === 'rock' || res.resourceType.includes('ore'))) miningPower = 5;
            if (weapon.category === 'Axe' && res.resourceType === 'tree') miningPower = 5;
            
            res.hp -= (player.attack + (weapon.miningPower || 0)) * miningPower * dmgMult;
            state.particles.push({x: res.x+res.width/2, y: res.y+res.height/2, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2, life:0.3, color: '#ccc', size: 3});

            if (res.hp <= 0) {
              res.dead = true;
              let matType: any = 'wood';
              if (res.resourceType === 'rock') matType = 'stone';
              if (res.resourceType === 'iron_ore') matType = 'iron';
              if (res.resourceType === 'gold_ore') matType = 'gold';
              
              const count = 1 + Math.floor(Math.random() * 3);
              for(let i=0; i<count; i++) {
                state.droppedItems.push({
                  id: crypto.randomUUID(),
                  item: generateMaterial(matType),
                  x: res.x + (Math.random()-0.5)*20, y: res.y + (Math.random()-0.5)*20, life: 2000
                });
              }
            }
        }
      });
    }
  };

  // --- スキル発動処理 (1-5キー) ---
  for (let i = 0; i < 5; i++) {
    if (input.keys[(i + 1).toString()]) {
      const skillId = player.hotbar[i];
      if (skillId) {
        const skill = SKILL_DATABASE[skillId];
        const pSkill = player.skills.find(s => s.skillId === skillId);
        
        if (skill && pSkill && player.mp >= skill.mpCost && (now - pSkill.lastUsed) >= skill.cooldown * 1000) {
          player.mp -= skill.mpCost;
          pSkill.lastUsed = now;

          if (skill.target === 'self') {
            if (skill.id === 'heal') {
              player.hp = Math.min(player.maxHp, player.hp + 50);
              state.particles.push({x: player.x, y: player.y, vx:0, vy:-1, life:1.0, color: 'green', size: 10});
            } else if (skill.id === 'warcry' || skill.id === 'bless') {
               state.particles.push({x: player.x, y: player.y, vx:0, vy:-1, life:1.0, color: 'yellow', size: 10});
            }
          } else {
            const weapon = player.equipment.mainHand?.weaponStats || { category: 'Fist', range: 1, width: 1, shape: 'arc', attackSpeed: 1, knockback: 1, hitRate: 1, critRate: 0, slash: 0, blunt: 0, pierce: 0 };
            const skillWeapon = { ...weapon, range: skill.range || weapon.range, width: weapon.width * 1.5 };
            executeAttack(skillWeapon as WeaponStats, skill.damageMultiplier || 1.0, true);
          }
        }
      }
      input.keys[(i + 1).toString()] = false;
    }
  }

  // --- 2. 通常攻撃処理 ---
  if (input.mouse.leftDown && mode === 'combat') {
    const weapon = player.equipment.mainHand?.weaponStats || {
      category: 'Fist', range: 1, width: 0.8, shape: 'line', attackSpeed: 0.5, knockback: 0.5, hitRate: 0.9, critRate: 0.1, slash: 0, blunt: 5, pierce: 0
    } as WeaponStats;

    if (!player.lastAttackTime || now - player.lastAttackTime > weapon.attackSpeed * 1000 / speedMult) {
      player.lastAttackTime = now;
      executeAttack(weapon);
    }
  }

  // ... (以降、マップ遷移やNPCなどは既存ロジックを維持) ...
  const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
  const ty = Math.floor((player.y + player.height/2) / TILE_SIZE);
  if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
    const tile = map[ty] ? map[ty][tx] : null;
    if (tile) {
      if (tile.type === 'mine_entrance') {
        state.location = { ...state.location, type: 'mine', level: 1, maxDepth: 5 };
        const mine = generateMineMap(1, 5);
        state.map = mine.map; state.resources = mine.resources; state.enemies = []; state.droppedItems = [];
        player.x = mine.spawnPoint.x; player.y = mine.spawnPoint.y;
      }
      else if (tile.type === 'stairs_down' && location.type === 'mine') {
        const next = location.level + 1;
        state.location.level = next;
        const mine = generateMineMap(next, 5);
        state.map = mine.map; state.resources = mine.resources; state.enemies = [];
        player.x = mine.spawnPoint.x; player.y = mine.spawnPoint.y;
      }
      else if (tile.type === 'town_entrance') {
        state.location = { type: 'town', level: 0, townId: 'town', worldX:0, worldY:0 };
        const town = generateTownMap(player.level);
        state.map = town.map; state.npcs = town.npcs; state.resources = [];
        player.x = town.spawnPoint.x; player.y = town.spawnPoint.y;
      }
      else if (tile.type === 'portal_out') {
        state.location = { type: 'world', level: 0, worldX: 0, worldY: 0 };
        const world = generateWorldChunk(0, 0);
        state.map = world.map; state.resources = world.resources;
        player.x = world.spawnPoint.x; player.y = world.spawnPoint.y;
      }
      else if (tile.type === 'dungeon_entrance' && tile.meta) {
        state.location = { ...state.location, type: 'dungeon', level: 1, maxDepth: tile.meta.maxDepth, dungeonId: `dungeon_${Date.now()}` };
        const dungeon = generateDungeonMap(1, tile.meta.maxDepth);
        state.map = dungeon.map; state.chests = dungeon.chests; state.npcs = []; state.droppedItems = []; state.enemies = [];
        state.player.x = dungeon.spawnPoint.x; state.player.y = dungeon.spawnPoint.y;
        party.forEach(c => { c.x = dungeon.spawnPoint.x; c.y = dungeon.spawnPoint.y; });
      }
      else if (tile.type === 'stairs_down' && location.type === 'dungeon') {
        const next = location.level + 1;
        state.location.level = next;
        const dungeon = generateDungeonMap(next, 5);
        state.map = dungeon.map; state.chests = dungeon.chests; state.npcs = []; state.droppedItems = []; state.enemies = [];
        player.x = dungeon.spawnPoint.x; player.y = dungeon.spawnPoint.y;
      }
    }
  }

  if (location.type === 'town' && input.mouse.leftDown) {
    const mx = input.mouse.x + state.camera.x;
    const my = input.mouse.y + state.camera.y;
    for (const npc of state.npcs) {
      const d = Math.sqrt((mx - npc.x)**2 + (my - npc.y)**2);
      if (d < 40) {
        if (npc.role === 'blacksmith') state.activeCrafting = npc;
        else state.activeShop = npc;
      }
    }
  }

  // Enemy AI Update (Sight Check added)
  enemies.forEach(enemy => {
    if (enemy.dead) return;
    const eSpeed = enemy.speed * speedMult;
    
    // 徘徊移動 (Random Walk)
    if (Math.random() < 0.02) { 
        enemy.x += (Math.random() - 0.5) * 10; 
        enemy.y += (Math.random() - 0.5) * 10; 
    }

    const distToP = Math.sqrt((player.x - enemy.x)**2 + (player.y - enemy.y)**2);
    // 視野範囲チェック (タイル数 * タイルサイズ)
    const sightPx = (enemy.sightRange || 6) * TILE_SIZE;

    // 視野内なら追跡
    if (distToP < sightPx) { 
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * eSpeed; 
        enemy.y += Math.sin(angle) * eSpeed; 
    }
    
    const enemyNextPos = tryMove(enemy, 0, 0, map); enemy.x = enemyNextPos.x; enemy.y = enemyNextPos.y;

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

  state.droppedItems = state.droppedItems.filter(drop => {
    const d = Math.sqrt((player.x - drop.x)**2 + (player.y - drop.y)**2);
    if (d < 40) { player.inventory.push({ ...drop.item, instanceId: crypto.randomUUID() }); return false; }
    return true;
  });

  state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
  state.particles = state.particles.filter(p => p.life > 0);
  state.enemies = state.enemies.filter(e => !e.dead);

  if (state.location.type === 'world' && state.enemies.length < 5 && Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE) {
    const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
    const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
    if(!state.map[Math.floor(ey/TILE_SIZE)]?.[Math.floor(ex/TILE_SIZE)]?.solid) state.enemies.push(generateEnemy(ex, ey, player.level));
  }
};
