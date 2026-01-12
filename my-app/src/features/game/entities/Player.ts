import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity, Job, WeaponStats, InventoryItem, Skill, PlayerSkillState } from '../types';

// スキルデータ (簡易定義)
export const SKILL_DATABASE: Record<string, Skill> = {
  // Swordsman
  'bash': { id: 'bash', name: 'Shield Bash', description: 'Stun enemy with shield.', type: 'active', target: 'direction', mpCost: 10, cooldown: 5, icon: '🛡️', unlockLevel: 1, damageMultiplier: 1.2, range: 1.5, jobRequirement: ['Swordsman', 'Warrior'] },
  'slash': { id: 'slash', name: 'Power Slash', description: 'Strong slash attack.', type: 'active', target: 'direction', mpCost: 15, cooldown: 3, icon: '⚔️', unlockLevel: 2, damageMultiplier: 1.5, range: 2.0, jobRequirement: ['Swordsman'] },
  
  // Warrior
  'warcry': { id: 'warcry', name: 'War Cry', description: 'Increase attack for a short time.', type: 'active', target: 'self', mpCost: 20, cooldown: 15, icon: '📢', unlockLevel: 1, effectDuration: 10, jobRequirement: ['Warrior'] },
  'smash': { id: 'smash', name: 'Ground Smash', description: 'Area damage around you.', type: 'active', target: 'area', mpCost: 25, cooldown: 8, icon: '💥', unlockLevel: 3, damageMultiplier: 1.8, range: 3.0, jobRequirement: ['Warrior'] },

  // Mage
  'fireball': { id: 'fireball', name: 'Fireball', description: 'Shoot a ball of fire.', type: 'active', target: 'direction', mpCost: 10, cooldown: 2, icon: '🔥', unlockLevel: 1, damageMultiplier: 2.0, range: 6.0, jobRequirement: ['Mage'] },
  'heal': { id: 'heal', name: 'Self Heal', description: 'Recover HP.', type: 'active', target: 'self', mpCost: 30, cooldown: 10, icon: '✨', unlockLevel: 2, effectDuration: 0, jobRequirement: ['Mage', 'Cleric'] },

  // Archer
  'rapid': { id: 'rapid', name: 'Rapid Fire', description: 'Shoot 3 arrows quickly.', type: 'active', target: 'direction', mpCost: 15, cooldown: 6, icon: '🏹', unlockLevel: 1, damageMultiplier: 0.8, range: 5.0, jobRequirement: ['Archer'] },
  
  // Monk
  'punch': { id: 'punch', name: 'One Inch Punch', description: 'High damage close range.', type: 'active', target: 'direction', mpCost: 10, cooldown: 3, icon: '👊', unlockLevel: 1, damageMultiplier: 2.5, range: 1.0, jobRequirement: ['Monk'] },

  // Cleric
  'bless': { id: 'bless', name: 'Blessing', description: 'Increase defense.', type: 'active', target: 'self', mpCost: 20, cooldown: 20, icon: '✝️', unlockLevel: 1, effectDuration: 30, jobRequirement: ['Cleric'] },
};

/**
 * 初期プレイヤーの生成ファクトリー
 * 選択された職業に応じて初期装備とステータスを決定する
 */
export const createPlayer = (job: Job): PlayerEntity => {
  const { TILE_SIZE } = GAME_CONFIG;

  // 基本ステータス定義
  let baseStats = { hp: 100, mp: 50, attack: 10, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
  let initialWeaponStats: WeaponStats;
  let weaponName = 'Unknown Weapon';
  let weaponIcon = '⚔️';
  let initialSkills: string[] = [];

  // 職業ごとの分岐
  switch (job) {
    case 'Swordsman': // 剣士：バランス型、剣
      baseStats = { hp: 110, mp: 40, attack: 12, defense: 8, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
      weaponName = 'Iron Sword';
      initialWeaponStats = {
        category: 'Sword',
        slash: 10, blunt: 0, pierce: 2,
        attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc',
        knockback: 0.8, hitRate: 0.95, critRate: 0.1
      };
      initialSkills = ['bash'];
      break;

    case 'Warrior': // 戦士：高HP・高攻撃、斧
      baseStats = { hp: 140, mp: 20, attack: 15, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.9, magic: 0 };
      weaponName = 'Battle Axe';
      initialWeaponStats = {
        category: 'Axe',
        slash: 14, blunt: 4, pierce: 0,
        attackSpeed: 0.8, range: 1.3, width: 1.5, shape: 'arc',
        knockback: 1.5, hitRate: 0.85, critRate: 0.15
      };
      initialSkills = ['warcry'];
      break;

    case 'Archer': // 弓使い（今回は短剣）：高速、クリティカル
      baseStats = { hp: 90, mp: 60, attack: 9, defense: 4, speed: GAME_CONFIG.PLAYER_SPEED * 1.1, magic: 8 };
      weaponName = 'Dagger';
      initialWeaponStats = {
        category: 'Dagger',
        slash: 6, blunt: 0, pierce: 6,
        attackSpeed: 0.35, range: 1.0, width: 0.8, shape: 'line',
        knockback: 0.2, hitRate: 0.98, critRate: 0.25
      };
      initialSkills = ['rapid'];
      break;

    case 'Monk': // 武道家：素手、高速、高回避イメージ
      baseStats = { hp: 120, mp: 40, attack: 8, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED * 1.05, magic: 10 };
      weaponName = 'Fists';
      initialWeaponStats = {
        category: 'Fist',
        slash: 0, blunt: 8, pierce: 0,
        attackSpeed: 0.3, range: 0.8, width: 0.8, shape: 'line',
        knockback: 0.5, hitRate: 1.0, critRate: 0.15
      };
      initialSkills = ['punch'];
      break;

    case 'Cleric': // 僧侶：槌、高MP
      baseStats = { hp: 90, mp: 100, attack: 10, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.95, magic: 15 };
      weaponName = 'Cleric Hammer';
      initialWeaponStats = {
        category: 'Hammer',
        slash: 0, blunt: 12, pierce: 0,
        attackSpeed: 0.9, range: 1.2, width: 1.2, shape: 'arc',
        knockback: 2.0, hitRate: 0.9, critRate: 0.05
      };
      initialSkills = ['heal', 'bless'];
      break;

    default: // フォールバック
      initialWeaponStats = {
        category: 'Sword',
        slash: 10, blunt: 0, pierce: 0,
        attackSpeed: 0.6, range: 1.5, width: 1.0, shape: 'arc',
        knockback: 0.5, hitRate: 0.9, critRate: 0.1
      };
      break;
  }

  // 初期武器オブジェクトの作成
  const initialWeapon: InventoryItem = {
    id: 'initial_weapon',
    instanceId: crypto.randomUUID(),
    name: weaponName,
    type: 'weapon',
    rarity: 'common',
    level: 1,
    value: 10,
    icon: weaponIcon,
    weaponStats: initialWeaponStats
  };

  const skills: PlayerSkillState[] = initialSkills.map(id => ({ skillId: id, lastUsed: 0, level: 1 }));
  const hotbar = [initialSkills[0] || null, initialSkills[1] || null, null, null, null];

  return {
    id: 'player_1',
    // 初期位置（マップ生成時に上書きされる）
    x: TILE_SIZE * 5, 
    y: TILE_SIZE * 5,
    width: 24,
    height: 24,
    color: THEME.colors.player,
    job: job,
    
    // ステータス適用
    hp: baseStats.hp,
    maxHp: baseStats.hp,
    mp: baseStats.mp,
    maxMp: baseStats.mp,
    attack: baseStats.attack,
    defense: baseStats.defense,
    stats: {
      attack: baseStats.attack,
      defense: baseStats.defense,
      speed: baseStats.speed,
      magic: baseStats.magic
    },
    
    stamina: 100,
    xp: 0,
    nextLevelXp: 100,
    level: 1,
    gold: 0,
    speed: baseStats.speed,
    type: 'player',
    dead: false,
    inventory: [initialWeapon], // インベントリにも入れる
    equipment: {
      mainHand: initialWeapon, // 装備する
      armor: undefined,
      accessory: undefined
    },
    skills,
    hotbar
  };
};
