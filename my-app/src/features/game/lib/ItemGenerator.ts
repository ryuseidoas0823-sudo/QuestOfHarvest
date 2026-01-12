import { Item, ItemType, Rarity, WeaponCategory, WeaponStats, Enchantment, SpecialEffect } from '../types';

const TILE_SIZE = 40;

// 武器ベースデータ
const WEAPON_BASES: Record<WeaponCategory, Partial<WeaponStats>> = {
  Sword: {
    range: 2, width: 120, shape: 'arc', // 幅は角度(度)
    attackSpeed: 1.0, knockback: 0.5,
    hitRate: 0.95, critRate: 0.10,
    slash: 10, blunt: 0, pierce: 5
  },
  Spear: {
    range: 4, width: 0.8, shape: 'line', // 幅はタイル数
    attackSpeed: 1.3, knockback: 1.0,
    hitRate: 0.85, critRate: 0.05,
    slash: 2, blunt: 0, pierce: 12
  },
  Axe: {
    range: 2, width: 1.0, shape: 'line',
    attackSpeed: 1.7, knockback: 1.0,
    hitRate: 0.70, critRate: 0.20,
    slash: 18, blunt: 5, pierce: 0
  },
  Dagger: {
    range: 1, width: 90, shape: 'arc',
    attackSpeed: 0.8, knockback: 0.2,
    hitRate: 0.98, critRate: 0.30,
    slash: 6, blunt: 0, pierce: 8,
    isDualWield: true
  },
  Hammer: {
    range: 2, width: 1.0, shape: 'line',
    attackSpeed: 1.7, knockback: 3.0, // 特大ノックバック
    hitRate: 0.75, critRate: 0.15,
    slash: 0, blunt: 20, pierce: 0
  },
  Fist: {
    range: 1, width: 0.8, shape: 'line',
    attackSpeed: 0.5, knockback: 0.5,
    hitRate: 0.90, critRate: 0.10,
    slash: 0, blunt: 8, pierce: 2
  }
};

const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/**
 * レベルに基づいたランダムなアイテムを生成する
 */
export const generateRandomItem = (targetLevel: number, rarityMultiplier: number = 1.0): Item => {
  // 1. レアリティ決定
  const rand = Math.random() * 100;
  let rarity: Rarity = 'common';
  
  if (rand > 99 - (RARITY_WEIGHTS.legendary * rarityMultiplier)) rarity = 'legendary';
  else if (rand > 95 - (RARITY_WEIGHTS.epic * rarityMultiplier)) rarity = 'epic';
  else if (rand > 85 - (RARITY_WEIGHTS.rare * rarityMultiplier)) rarity = 'rare';
  else if (rand > 60 - (RARITY_WEIGHTS.uncommon * rarityMultiplier)) rarity = 'uncommon';

  // 2. アイテムタイプ決定
  const typeRand = Math.random();
  let type: ItemType = 'consumable';
  if (typeRand > 0.6) type = 'weapon';
  else if (typeRand > 0.3) type = 'armor';

  // 3. レベル決定
  const levelVariation = Math.floor(Math.random() * 7) - 3;
  const level = Math.max(1, targetLevel + levelVariation);

  // 4. 生成
  if (type === 'weapon') {
    return generateWeapon(level, rarity);
  } else if (type === 'armor') {
    // 簡易防具生成 (既存ロジック維持)
    return {
      id: crypto.randomUUID(),
      name: `Lv.${level} Armor`,
      type: 'armor',
      rarity, level, value: level * 20,
      stats: { defense: Math.floor(level * 1.5), hp: level * 5 }
    };
  } else {
    // 消耗品
    return {
      id: crypto.randomUUID(),
      name: 'Potion',
      type: 'consumable',
      rarity: 'common', level, value: 10,
      stats: { hp: level * 20 }
    };
  }
};

/**
 * 武器生成ロジック
 */
export const generateWeapon = (level: number, rarity: Rarity): Item => {
  const categories = Object.keys(WEAPON_BASES) as WeaponCategory[];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const base = WEAPON_BASES[category];

  // レベル補正 (5レベルごとに強くなる -> level/5 の係数)
  const levelMult = 1 + Math.floor(level / 5) * 0.2; 
  
  const stats: WeaponStats = {
    category,
    slash: Math.floor((base.slash || 0) * levelMult),
    blunt: Math.floor((base.blunt || 0) * levelMult),
    pierce: Math.floor((base.pierce || 0) * levelMult),
    attackSpeed: base.attackSpeed!,
    range: base.range!,
    width: base.width!,
    shape: base.shape! as any,
    knockback: base.knockback!,
    hitRate: base.hitRate!,
    critRate: base.critRate!,
    isDualWield: base.isDualWield
  };

  // エンチャント付与
  const enchantments: Enchantment[] = [];
  let enchantSlots = 0;
  let specialEffect: SpecialEffect | undefined;

  switch (rarity) {
    case 'uncommon': enchantSlots = 1; break;
    case 'rare': enchantSlots = Math.random() > 0.5 ? 2 : 1; break; // 中1 or 弱2 (簡易的に数で表現)
    case 'epic': enchantSlots = 3; break;
    case 'legendary': enchantSlots = 4; break;
  }

  for (let i = 0; i < enchantSlots; i++) {
    const tier = rarity === 'legendary' ? 'strong' : rarity === 'epic' ? 'medium' : 'weak';
    enchantments.push(generateEnchantment(tier));
  }

  // 特殊効果 (ハイレア以上)
  if (rarity === 'epic' || rarity === 'legendary') {
    specialEffect = generateSpecialEffect(rarity === 'legendary' ? 'strong' : 'weak');
  }

  return {
    id: crypto.randomUUID(),
    name: `${rarity === 'common' ? '' : capitalize(rarity)} ${category}`,
    type: 'weapon',
    rarity,
    level,
    value: level * 50 * (enchantSlots + 1),
    weaponStats: stats,
    enchantments,
    specialEffect
  };
};

// ボスドロップ
export const generateBossDrop = (level: number): Item => {
  const weapon = generateWeapon(level, 'unique' as Rarity);
  weapon.name = "★ " + weapon.name;
  weapon.isBossDrop = true;
  // ステータス大幅強化
  if (weapon.weaponStats) {
    weapon.weaponStats.slash *= 2;
    weapon.weaponStats.blunt *= 2;
    weapon.weaponStats.pierce *= 2;
  }
  return weapon;
};

// ヘルパー
const generateEnchantment = (tier: 'weak' | 'medium' | 'strong'): Enchantment => {
  const types: any[] = ['stat_boost', 'speed_up', 'magic_add', 'extra_dmg', 'range_up', 'crit_rate', 'hit_rate', 'drop_rate'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let val = 0;
  const mult = tier === 'strong' ? 3 : tier === 'medium' ? 2 : 1;

  switch (type) {
    case 'stat_boost': val = 5 * mult; break; // %
    case 'speed_up': val = 5 * mult; break; // %
    case 'range_up': val = 0.5 * mult; break; // tiles
    case 'crit_rate': val = 2 * mult; break; // %
    default: val = 10 * mult; 
  }

  return { type, value: val, tier, description: `${type} +${val}` };
};

const generateSpecialEffect = (tier: 'weak' | 'strong'): SpecialEffect => {
  const types: any[] = ['party_atk', 'party_def', 'party_speed', 'move_speed'];
  const type = types[Math.floor(Math.random() * types.length)];
  const val = tier === 'strong' ? 20 : 10;
  return { type, value: val, description: `${type} +${val}%` };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
