import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity, Job, WeaponStats, InventoryItem, Skill, PlayerSkillState } from '../types';

export const SKILL_DATABASE: Record<string, Skill> = {
  'bash': { id: 'bash', name: 'Shield Bash', description: 'Stun enemy', type: 'active', target: 'direction', mpCost: 10, cooldown: 5, icon: '🛡️', unlockLevel: 1, damageMultiplier: 1.2, range: 1.5, jobRequirement: ['Swordsman', 'Warrior'] },
  'slash': { id: 'slash', name: 'Power Slash', description: 'Strong slash', type: 'active', target: 'direction', mpCost: 15, cooldown: 3, icon: '⚔️', unlockLevel: 2, damageMultiplier: 1.5, range: 2.0, jobRequirement: ['Swordsman'] },
  'warcry': { id: 'warcry', name: 'War Cry', description: 'Boost ATK', type: 'active', target: 'self', mpCost: 20, cooldown: 15, icon: '📢', unlockLevel: 1, effectDuration: 10, jobRequirement: ['Warrior'] },
  'heal': { id: 'heal', name: 'Heal', description: 'Recover HP', type: 'active', target: 'self', mpCost: 30, cooldown: 10, icon: '✨', unlockLevel: 1, effectDuration: 0, jobRequirement: ['Cleric', 'Mage'] },
  'rapid': { id: 'rapid', name: 'Rapid Fire', description: 'Quick shots', type: 'active', target: 'direction', mpCost: 15, cooldown: 6, icon: '🏹', unlockLevel: 1, damageMultiplier: 0.8, range: 5.0, jobRequirement: ['Archer'] },
  'punch': { id: 'punch', name: 'Iron Fist', description: 'Heavy punch', type: 'active', target: 'direction', mpCost: 10, cooldown: 3, icon: '👊', unlockLevel: 1, damageMultiplier: 2.5, range: 1.0, jobRequirement: ['Monk'] },
};

export const createPlayer = (job: Job = 'Swordsman'): PlayerEntity => {
  const { TILE_SIZE } = GAME_CONFIG;
  let baseStats = { hp: 100, mp: 50, attack: 10, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
  let initialWeaponStats: WeaponStats;
  let weaponName = 'Unknown';
  let initialSkills: string[] = [];

  switch (job) {
    case 'Swordsman': 
      baseStats = { hp: 110, mp: 40, attack: 12, defense: 8, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
      weaponName = 'Iron Sword';
      initialWeaponStats = { category: 'Sword', slash: 10, blunt: 0, pierce: 2, attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc', knockback: 0.8, hitRate: 0.95, critRate: 0.1 };
      initialSkills = ['bash', 'slash'];
      break;
    case 'Warrior': 
      baseStats = { hp: 140, mp: 20, attack: 15, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.9, magic: 0 };
      weaponName = 'Battle Axe';
      initialWeaponStats = { category: 'Axe', slash: 14, blunt: 4, pierce: 0, attackSpeed: 0.8, range: 1.3, width: 1.5, shape: 'arc', knockback: 1.5, hitRate: 0.85, critRate: 0.15 };
      initialSkills = ['warcry'];
      break;
    case 'Archer': 
      baseStats = { hp: 90, mp: 60, attack: 9, defense: 4, speed: GAME_CONFIG.PLAYER_SPEED * 1.1, magic: 8 };
      weaponName = 'Dagger';
      initialWeaponStats = { category: 'Dagger', slash: 6, blunt: 0, pierce: 6, attackSpeed: 0.35, range: 1.0, width: 0.8, shape: 'line', knockback: 0.2, hitRate: 0.98, critRate: 0.25 };
      initialSkills = ['rapid'];
      break;
    case 'Monk': 
      baseStats = { hp: 120, mp: 40, attack: 8, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED * 1.05, magic: 10 };
      weaponName = 'Fists';
      initialWeaponStats = { category: 'Fist', slash: 0, blunt: 8, pierce: 0, attackSpeed: 0.3, range: 0.8, width: 0.8, shape: 'line', knockback: 0.5, hitRate: 1.0, critRate: 0.15 };
      initialSkills = ['punch'];
      break;
    case 'Cleric': 
      baseStats = { hp: 90, mp: 100, attack: 10, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.95, magic: 15 };
      weaponName = 'Cleric Hammer';
      initialWeaponStats = { category: 'Hammer', slash: 0, blunt: 12, pierce: 0, attackSpeed: 0.9, range: 1.2, width: 1.2, shape: 'arc', knockback: 2.0, hitRate: 0.9, critRate: 0.05 };
      initialSkills = ['heal'];
      break;
    default: 
      initialWeaponStats = { category: 'Sword', slash: 10, blunt: 0, pierce: 0, attackSpeed: 0.6, range: 1.5, width: 1.0, shape: 'arc', knockback: 0.5, hitRate: 0.9, critRate: 0.1 };
      break;
  }

  const initialWeapon: InventoryItem = { id: 'initial_weapon', instanceId: crypto.randomUUID(), name: weaponName, type: 'weapon', rarity: 'common', level: 1, value: 10, icon: '⚔️', weaponStats: initialWeaponStats };
  const skills: PlayerSkillState[] = initialSkills.map(id => ({ skillId: id, lastUsed: 0, level: 1 }));
  const hotbar = [initialSkills[0] || null, initialSkills[1] || null, null, null, null];

  return {
    id: 'player_1',
    x: 0, y: 0, width: 24, height: 24, color: THEME.colors.player, job: job,
    hp: baseStats.hp, maxHp: baseStats.hp, mp: baseStats.mp, maxMp: baseStats.mp, attack: baseStats.attack, defense: baseStats.defense,
    stats: { attack: baseStats.attack, defense: baseStats.defense, speed: baseStats.speed, magic: baseStats.magic },
    stamina: 100, xp: 0, nextLevelXp: 100, level: 1, gold: 0, speed: baseStats.speed, type: 'player', dead: false,
    inventory: [initialWeapon], equipment: { mainHand: initialWeapon, armor: undefined, accessory: undefined },
    skills, hotbar
  };
};
