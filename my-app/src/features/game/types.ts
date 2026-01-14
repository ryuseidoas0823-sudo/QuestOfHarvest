import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity, Job, WeaponStats, InventoryItem, Skill, PlayerSkillState, WeaponCategory } from '../types';

// スキル定義データベース
export const SKILL_DATABASE: Record<string, Skill> = {
  'bash': { id: 'bash', name: 'Shield Bash', description: 'Stun enemy with shield.', type: 'active', target: 'direction', mpCost: 10, cooldown: 5, icon: '🛡️', unlockLevel: 1, damageMultiplier: 1.2, range: 1.5, jobRequirement: ['Swordsman', 'Warrior'] },
  'slash': { id: 'slash', name: 'Power Slash', description: 'Strong slash attack.', type: 'active', target: 'direction', mpCost: 15, cooldown: 3, icon: '⚔️', unlockLevel: 2, damageMultiplier: 1.5, range: 2.0, jobRequirement: ['Swordsman'] },
  'warcry': { id: 'warcry', name: 'War Cry', description: 'Increase attack for a short time.', type: 'active', target: 'self', mpCost: 20, cooldown: 15, icon: '📢', unlockLevel: 1, effectDuration: 10, jobRequirement: ['Warrior'] },
  'smash': { id: 'smash', name: 'Ground Smash', description: 'Area damage around you.', type: 'active', target: 'area', mpCost: 25, cooldown: 8, icon: '💥', unlockLevel: 3, damageMultiplier: 1.8, range: 3.0, jobRequirement: ['Warrior'] },
  'fireball': { id: 'fireball', name: 'Fireball', description: 'Shoot a ball of fire.', type: 'active', target: 'direction', mpCost: 10, cooldown: 2, icon: '🔥', unlockLevel: 1, damageMultiplier: 2.0, range: 6.0, jobRequirement: ['Mage'] },
  'heal': { id: 'heal', name: 'Self Heal', description: 'Recover HP.', type: 'active', target: 'self', mpCost: 30, cooldown: 10, icon: '✨', unlockLevel: 2, effectDuration: 0, jobRequirement: ['Mage', 'Cleric'] },
  'rapid': { id: 'rapid', name: 'Rapid Fire', description: 'Shoot 3 arrows quickly.', type: 'active', target: 'direction', mpCost: 15, cooldown: 6, icon: '🏹', unlockLevel: 1, damageMultiplier: 0.8, range: 5.0, jobRequirement: ['Archer'] },
  'punch': { id: 'punch', name: 'One Inch Punch', description: 'High damage close range.', type: 'active', target: 'direction', mpCost: 10, cooldown: 3, icon: '👊', unlockLevel: 1, damageMultiplier: 2.5, range: 1.0, jobRequirement: ['Monk'] },
  'bless': { id: 'bless', name: 'Blessing', description: 'Increase defense.', type: 'active', target: 'self', mpCost: 20, cooldown: 20, icon: '✝️', unlockLevel: 1, effectDuration: 30, jobRequirement: ['Cleric'] },
};

// 職業データの型定義
interface JobDefinition {
  baseStats: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    magic: number;
  };
  weapon: {
    name: string;
    icon: string;
    stats: WeaponStats;
  };
  initialSkills: string[];
}

// 職業データ定義（ここを編集するだけでバランス調整が可能）
const JOB_DATA: Record<Job, JobDefinition> = {
  Swordsman: {
    baseStats: { hp: 110, mp: 40, attack: 12, defense: 8, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 },
    weapon: {
      name: 'Iron Sword', icon: '⚔️',
      stats: { category: 'Sword', slash: 10, blunt: 0, pierce: 2, attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc', knockback: 0.8, hitRate: 0.95, critRate: 0.1 }
    },
    initialSkills: ['bash', 'slash']
  },
  Warrior: {
    baseStats: { hp: 140, mp: 20, attack: 15, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.9, magic: 0 },
    weapon: {
      name: 'Battle Axe', icon: '🪓',
      stats: { category: 'Axe', slash: 14, blunt: 4, pierce: 0, attackSpeed: 0.8, range: 1.3, width: 1.5, shape: 'arc', knockback: 1.5, hitRate: 0.85, critRate: 0.15 }
    },
    initialSkills: ['warcry', 'smash']
  },
  Mage: {
    baseStats: { hp: 80, mp: 100, attack: 5, defense: 3, speed: GAME_CONFIG.PLAYER_SPEED, magic: 15 },
    weapon: {
      name: 'Wooden Staff', icon: '🪄', // 仮のアイコン
      stats: { category: 'Hammer', slash: 0, blunt: 6, pierce: 0, attackSpeed: 1.0, range: 1.2, width: 1.0, shape: 'arc', knockback: 1.0, hitRate: 0.9, critRate: 0.05 } // 杖カテゴリがないのでHammer代用か追加推奨
    },
    initialSkills: ['fireball', 'heal']
  },
  Archer: {
    baseStats: { hp: 90, mp: 60, attack: 9, defense: 4, speed: GAME_CONFIG.PLAYER_SPEED * 1.1, magic: 8 },
    weapon: {
      name: 'Dagger', icon: '🗡️',
      stats: { category: 'Dagger', slash: 6, blunt: 0, pierce: 6, attackSpeed: 0.35, range: 1.0, width: 0.8, shape: 'line', knockback: 0.2, hitRate: 0.98, critRate: 0.25 }
    },
    initialSkills: ['rapid']
  },
  Monk: {
    baseStats: { hp: 120, mp: 40, attack: 8, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED * 1.05, magic: 10 },
    weapon: {
      name: 'Fists', icon: '👊',
      stats: { category: 'Fist', slash: 0, blunt: 8, pierce: 0, attackSpeed: 0.3, range: 0.8, width: 0.8, shape: 'line', knockback: 0.5, hitRate: 1.0, critRate: 0.15 }
    },
    initialSkills: ['punch']
  },
  Cleric: {
    baseStats: { hp: 90, mp: 100, attack: 10, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.95, magic: 15 },
    weapon: {
      name: 'Cleric Hammer', icon: '🔨',
      stats: { category: 'Hammer', slash: 0, blunt: 12, pierce: 0, attackSpeed: 0.9, range: 1.2, width: 1.2, shape: 'arc', knockback: 2.0, hitRate: 0.9, critRate: 0.05 }
    },
    initialSkills: ['heal', 'bless']
  }
};

/**
 * 初期プレイヤーの生成ファクトリー
 * Jobに応じた設定をJOB_DATAから読み込んでプレイヤーを生成します
 */
export const createPlayer = (job: Job = 'Swordsman'): PlayerEntity => {
  const { TILE_SIZE } = GAME_CONFIG;

  // データ取得（存在しないJobの場合はSwordsmanにフォールバック）
  const jobData = JOB_DATA[job] || JOB_DATA['Swordsman'];
  const { baseStats, weapon, initialSkills } = jobData;

  // 初期武器オブジェクトの作成
  const initialWeapon: InventoryItem = {
    id: 'initial_weapon',
    instanceId: crypto.randomUUID(),
    name: weapon.name,
    type: 'weapon',
    rarity: 'common',
    level: 1,
    value: 10,
    icon: weapon.icon,
    weaponStats: weapon.stats
  };

  // スキル状態の初期化
  const skills: PlayerSkillState[] = initialSkills.map(id => ({ skillId: id, lastUsed: 0, level: 1 }));
  
  // ホットバーの動的初期化 (最大5スロット)
  const hotbar: (string | null)[] = [null, null, null, null, null];
  initialSkills.forEach((skillId, index) => {
    if (index < hotbar.length) {
      hotbar[index] = skillId;
    }
  });

  return {
    id: 'player_1',
    // 初期位置（マップ生成時に上書きされるため仮の値）
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
    inventory: [initialWeapon], 
    equipment: {
      mainHand: initialWeapon, 
      armor: undefined,
      accessory: undefined
    },
    skills,
    hotbar
  };
};
