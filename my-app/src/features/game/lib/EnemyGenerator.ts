import { EnemyEntity, EnemyRank } from '../types';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';

// 敵の種族データ
const ENEMY_RACES = [
  { race: 'Slime', color: '#4caf50', baseHp: 15, baseAtk: 2, scaleHp: 10, scaleAtk: 2, baseSight: 5 },
  { race: 'Goblin', color: '#8bc34a', baseHp: 20, baseAtk: 3, scaleHp: 12, scaleAtk: 2.5, baseSight: 7 },
  { race: 'Skeleton', color: '#e0e0e0', baseHp: 18, baseAtk: 4, scaleHp: 11, scaleAtk: 3, baseSight: 6 },
  { race: 'Wolf', color: '#795548', baseHp: 16, baseAtk: 3, scaleHp: 10, scaleAtk: 3, speed: 1.2, baseSight: 9 }, // 狼は鼻が利くので視野広め
  { race: 'Orc', color: '#2e7d32', baseHp: 35, baseAtk: 5, scaleHp: 20, scaleAtk: 3.5, speed: 0.8, baseSight: 6 },
  { race: 'Ghost', color: '#b39ddb', baseHp: 12, baseAtk: 4, scaleHp: 8, scaleAtk: 3.5, scaleDef: 0, baseSight: 8 },
];

export const generateEnemy = (x: number, y: number, level: number, isBoss: boolean = false): EnemyEntity => {
  // 難易度設定の取得
  const difficulty = 'normal'; 
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || { hpMult: 1, damageMult: 1, expMult: 1, dropRateMult: 1 };

  // ランクの決定 (プレイヤーレベルに応じてエリート出現率アップ)
  let rank: EnemyRank = 'Normal';
  if (isBoss) {
    rank = 'Boss';
  } else {
    // レベルが高いほどエリートが出やすい
    const eliteChance = Math.min(0.05 + level * 0.01, 0.3); // 最大30%
    if (Math.random() < eliteChance) {
      rank = 'Elite';
    }
  }

  // 種族をランダム決定
  const raceData = ENEMY_RACES[Math.floor(Math.random() * ENEMY_RACES.length)];
  
  // ランク補正値
  let rankMultHp = 1;
  let rankMultAtk = 1;
  let rankMultExp = 1;
  let rankColor = raceData.color;
  let rankSize = 32;
  let sightBonus = 0; // 視野ボーナス

  switch (rank) {
    case 'Elite':
      rankMultHp = 2.0;
      rankMultAtk = 1.5;
      rankMultExp = 2.5;
      // 少し濃い色にする、あるいはサイズを大きくする
      rankColor = adjustColor(raceData.color, -30); 
      rankSize = 40;
      sightBonus = 3; // エリートは視野が広い
      break;
    case 'Boss':
      rankMultHp = 8.0;
      rankMultAtk = 2.0;
      rankMultExp = 10.0;
      rankColor = '#ff0000'; // ボスは赤固定（または専用色）
      rankSize = 64;
      sightBonus = 6; // ボスはかなり遠くまで気づく
      break;
    default: // Normal
      // 低レベル帯は視野を狭くする補正を入れても良い
      if (level < 3) sightBonus = -1;
      break;
  }

  // ステータス計算
  const hpCalc = (raceData.baseHp + level * (raceData.scaleHp * 1.2)); 
  const hp = Math.floor(hpCalc * rankMultHp * diffConfig.hpMult);

  const attackCalc = (raceData.baseAtk + level * (raceData.scaleAtk * 1.2));
  const attack = Math.floor(attackCalc * rankMultAtk * diffConfig.damageMult);

  const defense = Math.floor(level * 0.8 * (rank === 'Elite' ? 1.5 : 1));

  // 速度調整
  let baseSpeed = (raceData.speed || 1.0) * (1.0 + Math.random() * 0.2);
  if (rank === 'Boss') baseSpeed *= 0.8; // ボスは少し遅め

  // 視野計算 (基本 + ボーナス)
  const sightRange = (raceData.baseSight || 6) + sightBonus;

  return {
    id: `enemy_${crypto.randomUUID()}`,
    type: isBoss ? 'boss' : 'enemy',
    name: `${rank !== 'Normal' ? rank + ' ' : ''}${raceData.race}`,
    x,
    y,
    width: rankSize,
    height: rankSize,
    color: rankColor,
    level,
    hp,
    maxHp: hp,
    mp: 0,
    maxMp: 0,
    speed: baseSpeed,
    dead: false,
    race: raceData.race as any,
    variant: 'Normal',
    rank: rank,
    stats: {
      attack: attack,
      defense: defense,
      speed: baseSpeed,
      magic: 0
    },
    attack: attack,
    defense: defense,
    exp: Math.ceil(10 * level * rankMultExp * diffConfig.expMult),
    dropRate: 0.2 * (rank === 'Elite' ? 1.5 : 1) * diffConfig.dropRateMult,
    sightRange: Math.max(3, sightRange), // 最低3タイルは見えている
    
    behavior: 'aggressive',
    attackRange: 40,
    attackSpeed: 1.5
  };
};

// 色の明度を調整するヘルパー
function adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}
