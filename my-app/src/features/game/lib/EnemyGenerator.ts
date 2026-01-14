import { EnemyEntity, EnemyRank } from '../types';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../../assets/constants';

// 敵の種族データ（拡張版）
const ENEMY_RACES = [
  // 1. ゾンビ
  { race: 'Zombie', color: '#6d4c41', baseHp: 30, baseAtk: 4, scaleHp: 15, scaleAtk: 2, baseSight: 5, speed: 0.6, variants: ['Ghoul', 'Rotting Corpse'] },
  // 2. 虫
  { race: 'Insect', color: '#827717', baseHp: 15, baseAtk: 6, scaleHp: 8, scaleAtk: 3, baseSight: 7, speed: 1.4, variants: ['Giant Ant', 'Poison Spider'] },
  // 3. 悪魔
  { race: 'Demon', color: '#b71c1c', baseHp: 40, baseAtk: 8, scaleHp: 18, scaleAtk: 4, baseSight: 8, speed: 1.1, variants: ['Imp', 'Lesser Demon'] },
  // 4. 吸血鬼
  { race: 'Vampire', color: '#4a148c', baseHp: 35, baseAtk: 7, scaleHp: 14, scaleAtk: 3.5, baseSight: 9, speed: 1.3, variants: ['Bat', 'Servant'] },
  // 5. スライム
  { race: 'Slime', color: '#76ff03', baseHp: 20, baseAtk: 3, scaleHp: 10, scaleAtk: 2, baseSight: 5, speed: 0.8, variants: ['Green Slime', 'Red Jelly'] },
  // 6. 人間
  { race: 'Humanoid', color: '#ff9800', baseHp: 25, baseAtk: 5, scaleHp: 12, scaleAtk: 3, baseSight: 8, speed: 1.0, variants: ['Bandit', 'Mercenary'] },
  // 7. ドラゴン
  { race: 'Dragon', color: '#ff6f00', baseHp: 60, baseAtk: 10, scaleHp: 25, scaleAtk: 5, baseSight: 10, speed: 1.2, variants: ['Dragonewt', 'Wyvern'] },
  // 8. 猛獣
  { race: 'Beast', color: '#5d4037', baseHp: 35, baseAtk: 6, scaleHp: 16, scaleAtk: 3, baseSight: 7, speed: 1.5, variants: ['Wild Boar', 'Grizzly'] },
  // 9. 犬系
  { race: 'Canine', color: '#757575', baseHp: 20, baseAtk: 5, scaleHp: 10, scaleAtk: 3, baseSight: 10, speed: 1.6, variants: ['Wolf', 'Hellhound'] },
  // 10. 幽霊
  { race: 'Ghost', color: '#b0bec5', baseHp: 15, baseAtk: 4, scaleHp: 8, scaleAtk: 3, baseSight: 6, speed: 0.9, variants: ['Poltergeist', 'Wraith'] },
];

export const generateEnemy = (x: number, y: number, level: number, isBoss: boolean = false): EnemyEntity => {
  // 難易度設定の取得
  const difficulty = 'normal'; 
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || { hpMult: 1, damageMult: 1, expMult: 1, dropRateMult: 1 };

  // ランクの決定
  let rank: EnemyRank = 'Normal';
  if (isBoss) {
    rank = 'Boss';
  } else {
    const eliteChance = Math.min(0.05 + level * 0.01, 0.3); // 最大30%
    if (Math.random() < eliteChance) {
      rank = 'Elite';
    }
  }

  // レベルに応じて出現する種族をフィルタリングしても良いが、今回は全種族からランダム
  // ただし、ドラゴンなどは高レベルマップのみにする等の調整が可能
  let availableRaces = ENEMY_RACES;
  if (level < 5) {
    // 低レベル時はドラゴンなどを除外（簡易フィルタ）
    availableRaces = ENEMY_RACES.filter(r => r.race !== 'Dragon' && r.race !== 'Demon');
  }

  const raceData = availableRaces[Math.floor(Math.random() * availableRaces.length)];
  
  // 亜種（Variant）の決定
  // Elite以上なら強そうな名前（配列の後ろの方）を選びやすくする
  const variantIndex = rank === 'Normal' ? 0 : Math.min(raceData.variants.length - 1, Math.floor(Math.random() * raceData.variants.length));
  const variantName = raceData.variants[variantIndex] || raceData.race;

  // ランク補正値
  let rankMultHp = 1;
  let rankMultAtk = 1;
  let rankMultExp = 1;
  let rankColor = raceData.color;
  let rankSize = 32;
  let sightBonus = 0;

  switch (rank) {
    case 'Elite':
      rankMultHp = 2.0;
      rankMultAtk = 1.5;
      rankMultExp = 2.5;
      rankColor = adjustColor(raceData.color, -30); 
      rankSize = 40;
      sightBonus = 3;
      break;
    case 'Boss':
      rankMultHp = 8.0;
      rankMultAtk = 2.0;
      rankMultExp = 10.0;
      rankColor = '#ff0000'; // ボス色
      rankSize = 64;
      sightBonus = 6;
      break;
    default: // Normal
      if (level < 3) sightBonus = -2; // 低レベル時はさらに視野を狭く
      break;
  }

  // ステータス計算
  const hpCalc = (raceData.baseHp + level * (raceData.scaleHp * 1.0)); // HP上昇率を微調整
  const hp = Math.floor(hpCalc * rankMultHp * diffConfig.hpMult);

  const attackCalc = (raceData.baseAtk + level * (raceData.scaleAtk * 1.0));
  const attack = Math.floor(attackCalc * rankMultAtk * diffConfig.damageMult);

  const defense = Math.floor(level * 0.5 * (rank === 'Elite' ? 1.5 : 1));

  // 速度調整
  let baseSpeed = (raceData.speed || 1.0) * (0.9 + Math.random() * 0.2);
  if (rank === 'Boss') baseSpeed *= 0.8;

  // 視野計算
  const sightRange = Math.max(3, (raceData.baseSight || 6) + sightBonus);

  // 名前生成
  let name = variantName;
  if (rank === 'Elite') name = `Elite ${name}`;
  if (rank === 'Boss') name = `Boss ${name}`; // ボス固有の名称（ケルベロス等）にする場合はここで分岐

  if (isBoss && raceData.race === 'Canine') name = 'Cerberus';
  if (isBoss && raceData.race === 'Slime') name = 'King Slime';
  if (isBoss && raceData.race === 'Dragon') name = 'Ancient Dragon';

  return {
    id: `enemy_${crypto.randomUUID()}`,
    type: isBoss ? 'boss' : 'enemy',
    name: name,
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
    race: raceData.race as any, // 型定義を緩めるかtypes.tsを更新する必要あり
    variant: variantName,
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
    sightRange: sightRange,
    
    behavior: 'aggressive',
    attackRange: 40,
    attackSpeed: 1.5
  };
};

function adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}
