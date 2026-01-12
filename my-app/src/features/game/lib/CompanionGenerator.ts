import { CompanionEntity, Job } from '../types';
import { THEME } from '../../assets/theme';

const JOBS: Job[] = ['Warrior', 'Mage', 'Archer', 'Cleric'];

const NAMES = [
  'Alex', 'Bram', 'Cera', 'Dorn', 'Elara', 'Fey', 'Garrick', 'Hana', 'Iris', 'Jorn',
  'Kael', 'Lira', 'Miko', 'Nox', 'Orin', 'Pia', 'Quinn', 'Rorik', 'Sia', 'Torn',
  'Ulric', 'Vera', 'Wrenn', 'Xylia', 'Yorick', 'Zane'
];

export const generateCompanion = (targetLevel: number): CompanionEntity => {
  const job = JOBS[Math.floor(Math.random() * JOBS.length)];
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const level = Math.max(1, targetLevel - 1); // 主人公より1つ下

  // 基本ステータス
  let hp = 100 + level * 10;
  let mp = 50 + level * 5;
  let attack = 10 + level * 2;
  let defense = 5 + level * 1;
  const speed = 2.0;

  // 職業補正
  switch (job) {
    case 'Warrior':
      hp *= 1.5;
      defense *= 1.3;
      mp *= 0.5;
      break;
    case 'Mage':
      hp *= 0.7;
      defense *= 0.6;
      attack *= 1.5; // 魔法攻撃力として扱う
      mp *= 2.0;
      break;
    case 'Archer':
      attack *= 1.2;
      break;
    case 'Cleric':
      hp *= 1.2;
      attack *= 0.8;
      mp *= 1.5;
      break;
  }

  return {
    id: `comp_${crypto.randomUUID()}`,
    type: 'companion',
    x: 0, // 生成時は0、配置時に調整
    y: 0,
    width: 24,
    height: 24,
    color: THEME.colors.companion,
    speed,
    dead: false,
    hp: Math.floor(hp),
    maxHp: Math.floor(hp),
    mp: Math.floor(mp),
    maxMp: Math.floor(mp),
    level,
    attack: Math.floor(attack),
    defense: Math.floor(defense),
    job,
    joinDate: Date.now()
  };
};
