import { EnemyEntity, EnemyRace, EnemyRank } from '../types';
// 修正: 階層を一つ深くしました (../../ -> ../../../)
import { THEME } from '../../../assets/theme';

// 基本ステータス定義
interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  width: number;
  height: number;
}

const RACE_STATS: Record<EnemyRace, BaseStats> = {
  Slime:    { hp: 30, attack: 5,  defense: 0,  speed: 0.8, exp: 5,  width: 24, height: 24 },
  Goblin:   { hp: 45, attack: 8,  defense: 2,  speed: 1.2, exp: 8,  width: 24, height: 30 },
  Skeleton: { hp: 40, attack: 12, defense: 1,  speed: 1.0, exp: 10, width: 20, height: 32 },
  Wolf:     { hp: 50, attack: 15, defense: 3,  speed: 1.8, exp: 12, width: 32, height: 20 },
  Orc:      { hp: 80, attack: 18, defense: 8,  speed: 0.7, exp: 20, width: 32, height: 36 },
  Ghost:    { hp: 25, attack: 10, defense: 15, speed: 0.9, exp: 15, width: 24, height: 30 }, // 高防御(物理耐性想定)
  Golem:    { hp: 120, attack: 25, defense: 20, speed: 0.5, exp: 35, width: 40, height: 40 },
  Bat:      { hp: 20, attack: 7,  defense: 0,  speed: 2.2, exp: 6,  width: 20, height: 16 },
  Spider:   { hp: 60, attack: 14, defense: 5,  speed: 1.5, exp: 18, width: 32, height: 24 },
  Dragon:   { hp: 200, attack: 40, defense: 25, speed: 1.1, exp: 100, width: 50, height: 50 },
};

// 亜種データ (名前, 色, ステータス倍率)
interface VariantData {
  name: string;
  color: string;
  mult: number; // 全ステータスへの簡易倍率
}

const VARIANTS: Record<EnemyRace, VariantData[]> = {
  Slime: [
    { name: 'Green Slime', color: '#4caf50', mult: 1.0 },
    { name: 'Blue Slime', color: '#2196f3', mult: 1.2 },
    { name: 'Red Slime', color: '#f44336', mult: 1.5 },
    { name: 'Metal Slime', color: '#b0bec5', mult: 3.0 }, // 高防御・高経験値用
    { name: 'King Slime', color: '#ffeb3b', mult: 2.0 },
  ],
  Goblin: [
    { name: 'Goblin', color: '#66bb6a', mult: 1.0 },
    { name: 'Goblin Scout', color: '#a5d6a7', mult: 1.1 }, // 早い
    { name: 'Goblin Warrior', color: '#2e7d32', mult: 1.4 },
    { name: 'Goblin Mage', color: '#7e57c2', mult: 1.3 },
    { name: 'Hobgoblin', color: '#d84315', mult: 1.8 },
  ],
  Skeleton: [
    { name: 'Skeleton', color: '#e0e0e0', mult: 1.0 },
    { name: 'Bone Archer', color: '#bdbdbd', mult: 1.1 },
    { name: 'Skeleton Knight', color: '#90a4ae', mult: 1.5 },
    { name: 'Skull Mage', color: '#5c6bc0', mult: 1.4 },
    { name: 'Lich', color: '#303f9f', mult: 2.2 },
  ],
  Wolf: [
    { name: 'Wolf', color: '#9e9e9e', mult: 1.0 },
    { name: 'Dire Wolf', color: '#616161', mult: 1.3 },
    { name: 'Winter Wolf', color: '#e3f2fd', mult: 1.5 },
    { name: 'Shadow Wolf', color: '#212121', mult: 1.8 },
    { name: 'Hellhound', color: '#d32f2f', mult: 2.0 },
  ],
  Orc: [
    { name: 'Orc', color: '#558b2f', mult: 1.0 },
    { name: 'Orc Warrior', color: '#33691e', mult: 1.3 },
    { name: 'Orc Berserker', color: '#c62828', mult: 1.6 },
    { name: 'Orc Shaman', color: '#fbc02d', mult: 1.5 },
    { name: 'Orc General', color: '#1b5e20', mult: 2.2 },
  ],
  Ghost: [
    { name: 'Ghost', color: '#b3e5fc', mult: 1.0 },
    { name: 'Specter', color: '#81d4fa', mult: 1.3 },
    { name: 'Wraith', color: '#29b6f6', mult: 1.6 },
    { name: 'Phantom', color: '#0288d1', mult: 1.9 },
    { name: 'Banshee', color: '#e1bee7', mult: 2.1 },
  ],
  Golem: [
    { name: 'Clay Golem', color: '#8d6e63', mult: 1.0 },
    { name: 'Stone Golem', color: '#757575', mult: 1.4 },
    { name: 'Iron Golem', color: '#607d8b', mult: 1.8 },
    { name: 'Ice Golem', color: '#80deea', mult: 1.6 },
    { name: 'Obsidian Golem', color: '#212121', mult: 2.5 },
  ],
  Bat: [
    { name: 'Bat', color: '#795548', mult: 1.0 },
    { name: 'Giant Bat', color: '#5d4037', mult: 1.2 },
    { name: 'Vampire Bat', color: '#b71c1c', mult: 1.5 },
    { name: 'Storm Bat', color: '#ffeb3b', mult: 1.7 },
    { name: 'Ancient Bat', color: '#3e2723', mult: 2.0 },
  ],
  Spider: [
    { name: 'Spider', color: '#795548', mult: 1.0 },
    { name: 'Forest Spider', color: '#388e3c', mult: 1.2 },
    { name: 'Cave Spider', color: '#424242', mult: 1.4 },
    { name: 'Venom Spider', color: '#9c27b0', mult: 1.6 },
    { name: 'Tarantula', color: '#d84315', mult: 1.9 },
  ],
  Dragon: [
    { name: 'Green Drake', color: '#4caf50', mult: 1.0 },
    { name: 'Red Drake', color: '#f44336', mult: 1.3 },
    { name: 'Ice Drake', color: '#29b6f6', mult: 1.3 },
    { name: 'Wyvern', color: '#ff9800', mult: 1.6 },
    { name: 'Elder Drake', color: '#3e2723', mult: 2.0 },
  ],
};

// ボスデータ (種族ごとに2種類)
const BOSSES: Record<EnemyRace, VariantData[]> = {
  Slime: [
    { name: 'Grand Slime King', color: '#ffd700', mult: 5.0 },
    { name: 'Emperor Slime', color: '#e040fb', mult: 8.0 },
  ],
  Goblin: [
    { name: 'Goblin Lord', color: '#1b5e20', mult: 5.0 },
    { name: 'Goblin Hero', color: '#ff6f00', mult: 7.0 },
  ],
  Skeleton: [
    { name: 'Skeleton King', color: '#455a64', mult: 5.0 },
    { name: 'Death Lord', color: '#212121', mult: 8.0 },
  ],
  Wolf: [
    { name: 'Fenrir', color: '#eceff1', mult: 6.0 },
    { name: 'Cerberus', color: '#b71c1c', mult: 8.0 },
  ],
  Orc: [
    { name: 'Orc Warlord', color: '#bf360c', mult: 6.0 },
    { name: 'Orc Overlord', color: '#004d40', mult: 8.0 },
  ],
  Ghost: [
    { name: 'Reaper', color: '#000000', mult: 5.5 },
    { name: 'Poltergeist King', color: '#7b1fa2', mult: 7.5 },
  ],
  Golem: [
    { name: 'Titan', color: '#546e7a', mult: 6.0 },
    { name: 'Colossus', color: '#ffc107', mult: 9.0 },
  ],
  Bat: [
    { name: 'Vampire Lord', color: '#880e4f', mult: 5.5 },
    { name: 'Nightmare Wing', color: '#311b92', mult: 7.5 },
  ],
  Spider: [
    { name: 'Broodmother', color: '#263238', mult: 6.0 },
    { name: 'Arachne', color: '#880e4f', mult: 8.0 },
  ],
  Dragon: [
    { name: 'Red Dragon', color: '#d50000', mult: 8.0 },
    { name: 'Black Dragon', color: '#000000', mult: 12.0 },
  ],
};

/**
 * 敵を生成する
 * @param x X座標
 * @param y Y座標
 * @param level 基準レベル（主人公のレベルやダンジョン階層）
 * @param isBoss ボスかどうか
 * @param fixedRace 種族を指定する場合
 */
export const generateEnemy = (
  x: number, 
  y: number, 
  level: number, 
  isBoss: boolean = false,
  fixedRace?: EnemyRace
): EnemyEntity => {
  // 1. 種族決定（指定がなければランダム）
  const races = Object.keys(RACE_STATS) as EnemyRace[];
  const race = fixedRace || races[Math.floor(Math.random() * races.length)];
  
  const baseStat = RACE_STATS[race];

  // 2. 亜種決定
  let variantData: VariantData;
  let rank: EnemyRank = 'Normal';

  if (isBoss) {
    rank = 'Boss';
    // ボスは2種類。レベル30以上で強いほうが出るなど
    const bossIdx = level > 30 ? 1 : 0;
    variantData = BOSSES[race][bossIdx];
  } else {
    // 亜種は5種類。レベルに応じて重み付けランダム
    const variants = VARIANTS[race];
    let targetIdx = Math.floor(level / 5);
    targetIdx = Math.max(0, Math.min(variants.length - 1, targetIdx));
    
    // バリエーションを持たせる
    const roll = Math.random();
    if (roll < 0.2) targetIdx = Math.max(0, targetIdx - 1);
    else if (roll > 0.8) targetIdx = Math.min(variants.length - 1, targetIdx + 1);
    
    variantData = variants[targetIdx];
    
    // エリート判定 (5%でエリート)
    if (Math.random() < 0.05) {
      rank = 'Elite';
    }
  }

  // 3. ステータス計算
  const levelMult = 1 + (level - 1) * 0.1; // レベル1上がるごとに10%強くなる
  // Boss倍率はvariantData.multに含まれているので、ここではEliteのみ補正
  const totalMult = levelMult * variantData.mult * (rank === 'Elite' ? 1.5 : 1.0);

  return {
    id: `enemy_${crypto.randomUUID()}`,
    x,
    y,
    width: baseStat.width * (isBoss ? 2 : rank === 'Elite' ? 1.2 : 1),
    height: baseStat.height * (isBoss ? 2 : rank === 'Elite' ? 1.2 : 1),
    color: variantData.color,
    speed: baseStat.speed * (rank === 'Elite' ? 1.2 : 1.0), // エリートは少し速い
    type: isBoss ? 'boss' : 'enemy',
    dead: false,
    
    // Combat Stats
    level,
    hp: Math.floor(baseStat.hp * totalMult * 5),
    maxHp: Math.floor(baseStat.hp * totalMult * 5),
    mp: 0, maxMp: 0,
    attack: Math.floor(baseStat.attack * totalMult),
    defense: Math.floor(baseStat.defense * totalMult),
    
    // Metadata
    race,
    variant: variantData.name,
    rank,
    dropRate: 0.1 * (isBoss ? 5 : rank === 'Elite' ? 2 : 1),
    isBoss
  };
};
