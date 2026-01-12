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

  // 速度調整: プレイヤー速度(2)に合わせて調整
  // 以前は 2 + Math.random() 程度だったものを、全体的に半分程度に落とす
  const baseSpeed = 1.0 + Math.random() * 0.5; // 1.0 ~ 1.5 程度

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
    speed: isBoss ? baseSpeed * 0.8 : baseSpeed, // ボスは少し遅く
    dead: false,
    stats: {
      attack: 5 + level * 2,
      defense: level,
      speed: baseSpeed,
      magic: 0
    },
    // 以下、EnemyEntityに必要なプロパティを追加
    attack: 5 + level * 2, // 簡易アクセスのため
    defense: level,
    exp: 10 * level * diffConfig.expMult,
    dropRate: 0.2 * diffConfig.dropRateMult,
    race: 'Goblin', // 仮
    variant: 'Normal', // 仮
    rank: isBoss ? 'Boss' : 'Normal', // 仮
    behavior: 'aggressive',
    // 攻撃速度なども遅くする場合は調整
    attackRange: 40,
    attackSpeed: 1.5 // 秒間攻撃回数的な意味合いなら減らす、間隔(ms)なら増やす。ここではGameLoopの実装依存だが、一旦そのまま
  };
};
