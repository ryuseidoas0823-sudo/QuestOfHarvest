import { EnemyEntity, EnemyRank } from '../types';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';
const ENEMY_RACES = [
  { race: 'Zombie', color: '#6d4c41', baseHp: 30, baseAtk: 4, scaleHp: 15, scaleAtk: 2, baseSight: 5, speed: 0.6, variants: ['Ghoul'] },
  { race: 'Insect', color: '#827717', baseHp: 15, baseAtk: 6, scaleHp: 8, scaleAtk: 3, baseSight: 7, speed: 1.4, variants: ['Ant'] },
  { race: 'Demon', color: '#b71c1c', baseHp: 40, baseAtk: 8, scaleHp: 18, scaleAtk: 4, baseSight: 8, speed: 1.1, variants: ['Imp'] },
  { race: 'Vampire', color: '#4a148c', baseHp: 35, baseAtk: 7, scaleHp: 14, scaleAtk: 3.5, baseSight: 9, speed: 1.3, variants: ['Bat'] },
  { race: 'Slime', color: '#76ff03', baseHp: 20, baseAtk: 3, scaleHp: 10, scaleAtk: 2, baseSight: 5, speed: 0.8, variants: ['Slime'] },
  { race: 'Humanoid', color: '#ff9800', baseHp: 25, baseAtk: 5, scaleHp: 12, scaleAtk: 3, baseSight: 8, speed: 1.0, variants: ['Bandit'] },
  { race: 'Dragon', color: '#ff6f00', baseHp: 60, baseAtk: 10, scaleHp: 25, scaleAtk: 5, baseSight: 10, speed: 1.2, variants: ['Drake'] },
  { race: 'Beast', color: '#5d4037', baseHp: 35, baseAtk: 6, scaleHp: 16, scaleAtk: 3, baseSight: 7, speed: 1.5, variants: ['Boar'] },
  { race: 'Canine', color: '#757575', baseHp: 20, baseAtk: 5, scaleHp: 10, scaleAtk: 3, baseSight: 10, speed: 1.6, variants: ['Wolf'] },
  { race: 'Ghost', color: '#b0bec5', baseHp: 15, baseAtk: 4, scaleHp: 8, scaleAtk: 3, baseSight: 6, speed: 0.9, variants: ['Wisp'] },
];
export const generateEnemy = (x: number, y: number, level: number, isBoss: boolean = false): EnemyEntity => {
  const diffConfig = DIFFICULTY_CONFIG['normal'];
  let rank: EnemyRank = isBoss ? 'Boss' : (Math.random() < 0.1 ? 'Elite' : 'Normal');
  const raceData = ENEMY_RACES[Math.floor(Math.random() * ENEMY_RACES.length)];
  let mult = rank === 'Boss' ? 8 : rank === 'Elite' ? 2 : 1;
  const hp = Math.floor((raceData.baseHp + level * raceData.scaleHp) * mult * diffConfig.hpMult);
  const atk = Math.floor((raceData.baseAtk + level * raceData.scaleAtk) * mult * diffConfig.damageMult);
  return {
    id: `e_${crypto.randomUUID()}`, type: isBoss ? 'boss' : 'enemy', name: raceData.race, x, y, width: rank==='Boss'?64:32, height: rank==='Boss'?64:32, color: raceData.color, level, hp, maxHp: hp, mp:0, maxMp:0, speed: raceData.speed || 1, dead: false, race: raceData.race as any, variant: 'Normal', rank, stats: { attack: atk, defense: level, speed: 1, magic: 0 }, attack: atk, defense: level, sightRange: raceData.baseSight + (rank==='Boss'?5:0), dropRate: 0.1, behavior: 'aggressive'
  };
};
