import { EnemyEntity } from '../types';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';

// ... existing code ...

export const generateEnemy = (x: number, y: number, level: number, isBoss: boolean = false): EnemyEntity => {
  // 難易度設定の取得を安全に行う
  // デフォルトは 'normal' とする
  const difficulty = 'normal'; 
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || { hpMult: 1, damageMult: 1, expMult: 1, dropRateMult: 1 };

  const baseHp = 30 + level * 10;
  const hp = Math.floor(baseHp * (isBoss ? 5 : 1) * diffConfig.hpMult);

  return {
    id: `enemy_${crypto.randomUUID()}`,
    type: isBoss ? 'boss' : 'enemy',
    name: isBoss ? 'Boss' : 'Enemy',
    x,
    y,
    width: 32,
    height: 32,
    color: isBoss ? '#ff0000' : '#880000',
    level,
    hp,
    maxHp: hp,
    mp: 0,
    maxMp: 0,
    speed: 2 + Math.random(),
    dead: false,
    stats: {
      attack: 5 + level * 2,
      defense: level,
      speed: 2,
      magic: 0
    },
    // 以下、EnemyEntityに必要なプロパティを追加
    attack: 5 + level * 2, // 簡易アクセスのため
    defense: level,
    exp: 10 * level * diffConfig.expMult,
    dropRate: 0.2 * diffConfig.dropRateMult,
    race: 'Goblin', // 仮
    behavior: 'aggressive',
    attackRange: 40,
    attackSpeed: 1.5
  };
};
