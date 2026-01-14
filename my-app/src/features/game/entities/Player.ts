import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity, Job, WeaponStats, InventoryItem, Skill, PlayerSkillState } from '../types';
export const SKILL_DATABASE: Record<string, Skill> = {
  'bash': { id: 'bash', name: 'Shield Bash', description: 'Stun', type: 'active', target: 'direction', mpCost: 10, cooldown: 5, icon: '🛡️', unlockLevel: 1, damageMultiplier: 1.2, range: 1.5, jobRequirement: ['Swordsman'] },
  'slash': { id: 'slash', name: 'Power Slash', description: 'Slash', type: 'active', target: 'direction', mpCost: 15, cooldown: 3, icon: '⚔️', unlockLevel: 2, damageMultiplier: 1.5, range: 2.0, jobRequirement: ['Swordsman'] },
  'warcry': { id: 'warcry', name: 'War Cry', description: 'Boost', type: 'active', target: 'self', mpCost: 20, cooldown: 15, icon: '📢', unlockLevel: 1, effectDuration: 10, jobRequirement: ['Warrior'] },
  'heal': { id: 'heal', name: 'Heal', description: 'Heal', type: 'active', target: 'self', mpCost: 30, cooldown: 10, icon: '✨', unlockLevel: 1, effectDuration: 0, jobRequirement: ['Cleric'] },
  'rapid': { id: 'rapid', name: 'Rapid', description: 'Shoot', type: 'active', target: 'direction', mpCost: 15, cooldown: 6, icon: '🏹', unlockLevel: 1, damageMultiplier: 0.8, range: 5.0, jobRequirement: ['Archer'] },
  'punch': { id: 'punch', name: 'Punch', description: 'Punch', type: 'active', target: 'direction', mpCost: 10, cooldown: 3, icon: '👊', unlockLevel: 1, damageMultiplier: 2.5, range: 1.0, jobRequirement: ['Monk'] }
};
const JOB_DATA: any = {
  Swordsman: { stats: { hp: 110, mp: 40, atk: 12, def: 8, spd: 4, mag: 5 }, weapon: { name: 'Iron Sword', icon: '⚔️', stats: { category: 'Sword', slash: 10, blunt: 0, pierce: 2, attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc' } }, skills: ['bash', 'slash'] },
  Warrior: { stats: { hp: 140, mp: 20, atk: 15, def: 6, spd: 3.6, mag: 0 }, weapon: { name: 'Battle Axe', icon: '🪓', stats: { category: 'Axe', slash: 14, blunt: 4, pierce: 0, attackSpeed: 0.8, range: 1.3, width: 1.5, shape: 'arc' } }, skills: ['warcry'] },
  Archer: { stats: { hp: 90, mp: 60, atk: 9, def: 4, spd: 4.4, mag: 8 }, weapon: { name: 'Dagger', icon: '🗡️', stats: { category: 'Dagger', slash: 6, blunt: 0, pierce: 6, attackSpeed: 0.35, range: 1.0, width: 0.8, shape: 'line' } }, skills: ['rapid'] },
  Monk: { stats: { hp: 120, mp: 40, atk: 8, def: 5, spd: 4.2, mag: 10 }, weapon: { name: 'Fists', icon: '👊', stats: { category: 'Fist', slash: 0, blunt: 8, pierce: 0, attackSpeed: 0.3, range: 0.8, width: 0.8, shape: 'line' } }, skills: ['punch'] },
  Cleric: { stats: { hp: 90, mp: 100, atk: 10, def: 6, spd: 3.8, mag: 15 }, weapon: { name: 'Hammer', icon: '🔨', stats: { category: 'Hammer', slash: 0, blunt: 12, pierce: 0, attackSpeed: 0.9, range: 1.2, width: 1.2, shape: 'arc' } }, skills: ['heal'] }
};
export const createPlayer = (job: Job = 'Swordsman'): PlayerEntity => {
  const d = JOB_DATA[job] || JOB_DATA['Swordsman'];
  const w: InventoryItem = { id: `w_${crypto.randomUUID()}`, instanceId: crypto.randomUUID(), name: d.weapon.name, type: 'weapon', rarity: 'common', level: 1, value: 10, icon: d.weapon.icon, weaponStats: d.weapon.stats };
  const skills: PlayerSkillState[] = d.skills.map((id:string) => ({ skillId: id, lastUsed: 0, level: 1 }));
  const hotbar = [d.skills[0]||null, d.skills[1]||null, null, null, null];
  return { id: 'player_1', x: 0, y: 0, width: 24, height: 24, color: THEME.colors.player, job, hp: d.stats.hp, maxHp: d.stats.hp, mp: d.stats.mp, maxMp: d.stats.mp, attack: d.stats.atk, defense: d.stats.def, stats: { attack: d.stats.atk, defense: d.stats.def, speed: d.stats.spd, magic: d.stats.mag }, stamina: 100, xp: 0, nextLevelXp: 100, level: 1, gold: 0, speed: d.stats.spd, type: 'player', dead: false, inventory: [w], equipment: { mainHand: w }, skills, hotbar };
};
