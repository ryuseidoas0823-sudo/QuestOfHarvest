import { Item, ItemType, Rarity } from '../types';

const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

const ITEM_NAMES = {
  weapon: ['Rusty Sword', 'Iron Blade', 'Steel Longsword', 'Mithril Rapier', 'Dragon Slayer'],
  armor: ['Tattered Tunic', 'Leather Armor', 'Chainmail', 'Plate Mail', 'Divine Armor'],
  consumable: ['Apple', 'Potion', 'Elixir'],
};

/**
 * レベルに基づいたランダムなアイテムを生成する
 */
export const generateRandomItem = (targetLevel: number, rarityMultiplier: number = 1.0): Item => {
  // 1. レアリティ決定
  const rand = Math.random() * 100;
  let rarity: Rarity = 'common';
  
  // Expertなどの補正を加味（レアが出やすくする）
  let threshold = 0;
  // 簡易的な確率計算（本来はもっと厳密に行う）
  if (rand > 99 - (RARITY_WEIGHTS.legendary * rarityMultiplier)) rarity = 'legendary';
  else if (rand > 95 - (RARITY_WEIGHTS.epic * rarityMultiplier)) rarity = 'epic';
  else if (rand > 85 - (RARITY_WEIGHTS.rare * rarityMultiplier)) rarity = 'rare';
  else if (rand > 60 - (RARITY_WEIGHTS.uncommon * rarityMultiplier)) rarity = 'uncommon';

  // 2. アイテムタイプ決定
  const typeRand = Math.random();
  let type: ItemType = 'consumable';
  if (typeRand > 0.6) type = 'weapon';
  else if (typeRand > 0.3) type = 'armor';

  // 3. レベル決定（ターゲットレベル ±3）
  const levelVariation = Math.floor(Math.random() * 7) - 3; // -3 ~ +3
  const level = Math.max(1, targetLevel + levelVariation);

  // 4. 名前とステータス生成
  let name = '';
  const stats: any = {};
  const value = level * 10;

  if (type === 'consumable') {
    const idx = Math.floor(Math.random() * ITEM_NAMES.consumable.length);
    name = ITEM_NAMES.consumable[idx];
    stats.hp = 20 * level;
  } else if (type === 'weapon') {
    const idx = Math.min(Math.floor((level - 1) / 5), ITEM_NAMES.weapon.length - 1);
    name = ITEM_NAMES.weapon[idx] || 'Unknown Weapon';
    stats.attack = Math.floor(level * 1.5 + (getRarityBonus(rarity)));
  } else if (type === 'armor') {
    const idx = Math.min(Math.floor((level - 1) / 5), ITEM_NAMES.armor.length - 1);
    name = ITEM_NAMES.armor[idx] || 'Unknown Armor';
    stats.defense = Math.floor(level * 1.2 + (getRarityBonus(rarity)));
  }

  // 接頭辞
  if (rarity !== 'common') {
    name = `${capitalize(rarity)} ${name}`;
  }

  return {
    id: crypto.randomUUID(),
    name,
    type,
    rarity,
    level,
    value,
    stats,
  };
};

const getRarityBonus = (r: Rarity): number => {
  switch (r) {
    case 'legendary': return 20;
    case 'epic': return 10;
    case 'rare': return 5;
    case 'uncommon': return 2;
    default: return 0;
  }
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
