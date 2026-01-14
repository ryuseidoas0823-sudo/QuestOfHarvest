import { Item, WeaponStats } from '../types';
export const generateMaterial = (type: string): Item => ({ id: `mat_${type}_${crypto.randomUUID()}`, name: type, type: 'material', rarity: 'common', level: 1, value: 5, icon: '📦', materialType: type });
export const generateRandomItem = (level: number, mult: number = 1): Item => ({ id: `item_${crypto.randomUUID()}`, name: 'Potion', type: 'consumable', rarity: 'common', level, value: 10, icon: '🧪' });
export const generateBossDrop = (level: number): Item => ({ id: `boss_${crypto.randomUUID()}`, name: 'Rare Item', type: 'weapon', rarity: 'legendary', level, value: 500, icon: '👑', weaponStats: { category: 'Sword', slash: 50, blunt:0, pierce:0, attackSpeed:0.5, range:2, width:2, shape:'arc', knockback:2, hitRate:1, critRate:0.5 } });
