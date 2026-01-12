import { Item, Rarity, WeaponStats } from '../types';

const WEAPON_NAMES = {
  Sword: ['Longsword', 'Broadsword', 'Katana', 'Saber', 'Claymore'],
  Spear: ['Spear', 'Lance', 'Halberd', 'Pike', 'Trident'],
  Axe: ['Battle Axe', 'War Axe', 'Hatchet', 'Greataxe', 'Tomahawk'],
  Dagger: ['Dagger', 'Knife', 'Dirk', 'Stiletto', 'Kukri'],
  Hammer: ['Warhammer', 'Mace', 'Maul', 'Club', 'Morningstar'],
  Fist: ['Knuckles', 'Gauntlets', 'Claws', 'Wraps', 'Cestus'],
  Pickaxe: ['Iron Pickaxe', 'Steel Pickaxe', 'Mining Pick', 'Heavy Pick', 'Drill']
};

export const generateMaterial = (type: 'wood' | 'stone' | 'iron' | 'gold'): Item => {
  switch (type) {
    case 'wood':
      return {
        id: `mat_wood_${crypto.randomUUID()}`, name: 'Wood Log', type: 'material', rarity: 'common', level: 1, value: 2, icon: '🪵',
        description: 'Basic crafting material gathered from trees.', materialType: 'wood'
      };
    case 'stone':
      return {
        id: `mat_stone_${crypto.randomUUID()}`, name: 'Stone', type: 'material', rarity: 'common', level: 1, value: 3, icon: '🪨',
        description: 'Common stone used for building and crafting.', materialType: 'stone'
      };
    case 'iron':
      return {
        id: `mat_iron_${crypto.randomUUID()}`, name: 'Iron Ore', type: 'material', rarity: 'uncommon', level: 5, value: 10, icon: '⛏️',
        description: 'Raw iron ore. Can be forged into strong equipment.', materialType: 'iron'
      };
    case 'gold':
      return {
        id: `mat_gold_${crypto.randomUUID()}`, name: 'Gold Ore', type: 'material', rarity: 'rare', level: 10, value: 50, icon: '🧈',
        description: 'Precious metal. Valuable and conductive.', materialType: 'gold'
      };
  }
  return generateMaterial('wood');
};

export const generateRandomItem = (level: number, rarityMult: number = 1.0): Item => {
  const rand = Math.random() / rarityMult;
  let rarity: Rarity = 'common';
  if (rand < 0.01) rarity = 'legendary';
  else if (rand < 0.05) rarity = 'epic';
  else if (rand < 0.15) rarity = 'rare';
  else if (rand < 0.35) rarity = 'uncommon';

  // 30% materials, 20% consumables, 50% equipment
  const typeRoll = Math.random();
  
  if (typeRoll < 0.3) {
    const mats = ['wood', 'stone', 'iron', 'gold'];
    // レベルに応じてレア素材が出やすく
    let matIdx = 0;
    if (level > 10 && Math.random() > 0.7) matIdx = 2; // iron
    if (level > 20 && Math.random() > 0.9) matIdx = 3; // gold
    if (Math.random() < 0.5) matIdx = 1; // stone
    return generateMaterial(mats[matIdx] as any);
  }
  else if (typeRoll < 0.5) {
    return {
      id: `potion_${crypto.randomUUID()}`,
      name: 'Health Potion',
      type: 'consumable',
      rarity: 'common',
      level: 1,
      value: 20,
      icon: '🧪',
      specialEffect: { type: 'party_atk', value: 0, description: 'Restores 50 HP' }, // 仮
      description: 'Restores a small amount of health.'
    };
  } else {
    // Equipment
    const categories: (keyof typeof WEAPON_NAMES)[] = ['Sword', 'Spear', 'Axe', 'Dagger', 'Hammer', 'Fist'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const name = WEAPON_NAMES[cat][Math.floor(Math.random() * WEAPON_NAMES[cat].length)];
    
    // Stats calculation based on level and rarity
    const rarityBonus = rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : rarity === 'rare' ? 1.5 : rarity === 'uncommon' ? 1.2 : 1;
    const baseDmg = level * 2 + 5;
    
    const stats: WeaponStats = {
      category: cat,
      slash: cat === 'Sword' || cat === 'Axe' ? Math.floor(baseDmg * rarityBonus) : 0,
      blunt: cat === 'Hammer' || cat === 'Fist' ? Math.floor(baseDmg * rarityBonus) : 0,
      pierce: cat === 'Spear' || cat === 'Dagger' ? Math.floor(baseDmg * rarityBonus) : 0,
      attackSpeed: cat === 'Dagger' || cat === 'Fist' ? 0.3 : cat === 'Hammer' ? 1.0 : 0.6,
      range: cat === 'Spear' ? 2.0 : cat === 'Dagger' ? 0.8 : 1.2,
      width: cat === 'Axe' || cat === 'Hammer' ? 1.5 : 1.0,
      shape: cat === 'Spear' || cat === 'Dagger' ? 'line' : 'arc',
      knockback: cat === 'Hammer' ? 2.0 : 0.5,
      hitRate: 0.9,
      critRate: 0.1,
    };

    return {
      id: `equip_${crypto.randomUUID()}`,
      name: `${rarity !== 'common' ? rarity + ' ' : ''}${name}`,
      type: 'weapon',
      rarity,
      level,
      value: level * 10 * rarityBonus,
      icon: '⚔️',
      weaponStats: stats,
      description: `A ${rarity} ${name}.`
    };
  }
};

export const generateBossDrop = (level: number): Item => {
  const item = generateRandomItem(level, 5.0);
  item.rarity = 'legendary';
  item.name = 'Legendary ' + item.name;
  if (item.weaponStats) {
    item.weaponStats.slash *= 2;
    item.weaponStats.blunt *= 2;
    item.weaponStats.pierce *= 2;
  }
  return item;
};
