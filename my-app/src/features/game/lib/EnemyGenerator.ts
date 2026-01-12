import { EnemyEntity } from '../types';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';

// 敵の種族データ
const ENEMY_RACES = [
  { race: 'Slime', color: '#4caf50', baseHp: 15, baseAtk: 2, scaleHp: 10, scaleAtk: 2 },
  { race: 'Goblin', color: '#8bc34a', baseHp: 20, baseAtk: 3, scaleHp: 12, scaleAtk: 2.5 },
  { race: 'Skeleton', color: '#e0e0e0', baseHp: 18, baseAtk: 4, scaleHp: 11, scaleAtk: 3 },
  { race: 'Wolf', color: '#795548', baseHp: 16, baseAtk: 3, scaleHp: 10, scaleAtk: 3, speed: 1.2 },
  { race: 'Orc', color: '#2e7d32', baseHp: 35, baseAtk: 5, scaleHp: 20, scaleAtk: 3.5, speed: 0.8 },
  { race: 'Ghost', color: '#b39ddb', baseHp: 12, baseAtk: 4, scaleHp: 8, scaleAtk: 3.5, scaleDef: 0 },
];

export const generateEnemy = (x: number, y: number, level: number, isBoss: boolean = false): EnemyEntity => {
  // 難易度設定の取得を安全に行う
  const difficulty = 'normal'; 
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || { hpMult: 1, damageMult: 1, expMult: 1, dropRateMult: 1 };

  // 種族をランダム決定（レベルに応じて強い種族が出やすくするなどのロジックも可）
  const raceData = ENEMY_RACES[Math.floor(Math.random() * ENEMY_RACES.length)];
  
  // ステータス計算
  // 変更点: 基礎値を下げ、レベル倍率を少し上げる
  // HP: (基礎 + レベル * 倍率)
  const hpCalc = (raceData.baseHp + level * (raceData.scaleHp * 1.2)); 
  const hp = Math.floor(hpCalc * (isBoss ? 8 : 1) * diffConfig.hpMult);

  // 速度調整
  const baseSpeed = (raceData.speed || 1.0) * (1.0 + Math.random() * 0.2);

  // 攻撃力計算
  // 変更点: 基礎値を下げ、レベル倍率を上げる
  const attackCalc = (raceData.baseAtk + level * (raceData.scaleAtk * 1.2));
  const attack = Math.floor(attackCalc * diffConfig.damageMult);

  // 防御力
  const defense = Math.floor(level * 0.8);

  return {
    id: `enemy_${crypto.randomUUID()}`,
    type: isBoss ? 'boss' : 'enemy',
    name: isBoss ? `Boss ${raceData.race}` : raceData.race,
    x,
    y,
    width: 32,
    height: 32,
    color: isBoss ? '#ff0000' : raceData.color,
    level,
    hp,
    maxHp: hp,
    mp: 0,
    maxMp: 0,
    speed: isBoss ? baseSpeed * 0.8 : baseSpeed,
    dead: false,
    race: raceData.race as any,
    variant: 'Normal',
    rank: isBoss ? 'Boss' : 'Normal',
    stats: {
      attack: attack,
      defense: defense,
      speed: baseSpeed,
      magic: 0
    },
    // フラットプロパティへのマッピング
    attack: attack,
    defense: defense,
    exp: Math.ceil(10 * level * diffConfig.expMult),
    dropRate: 0.2 * diffConfig.dropRateMult,
    
    behavior: 'aggressive',
    attackRange: 40,
    attackSpeed: 1.5
  };
};
