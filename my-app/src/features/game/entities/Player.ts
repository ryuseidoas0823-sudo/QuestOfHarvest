import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity, Job, WeaponStats, InventoryItem } from '../types';

/**
 * 初期プレイヤーの生成ファクトリー
 * 選択された職業に応じて初期装備とステータスを決定する
 */
export const createPlayer = (job: Job): PlayerEntity => {
  const { TILE_SIZE } = GAME_CONFIG;

  // 基本ステータス定義
  let baseStats = { hp: 100, mp: 50, attack: 10, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
  let initialWeaponStats: WeaponStats;
  let weaponName = 'Unknown Weapon';
  let weaponIcon = '⚔️';

  // 職業ごとの分岐
  switch (job) {
    case 'Swordsman': // 剣士：バランス型、剣
      baseStats = { hp: 110, mp: 40, attack: 12, defense: 8, speed: GAME_CONFIG.PLAYER_SPEED, magic: 5 };
      weaponName = 'Iron Sword';
      initialWeaponStats = {
        category: 'Sword',
        slash: 10, blunt: 0, pierce: 2,
        attackSpeed: 0.6, range: 1.5, width: 1.2, shape: 'arc',
        knockback: 0.8, hitRate: 0.95, critRate: 0.1
      };
      break;

    case 'Warrior': // 戦士：高HP・高攻撃、斧
      baseStats = { hp: 140, mp: 20, attack: 15, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.9, magic: 0 };
      weaponName = 'Battle Axe';
      initialWeaponStats = {
        category: 'Axe',
        slash: 14, blunt: 4, pierce: 0,
        attackSpeed: 0.8, range: 1.3, width: 1.5, shape: 'arc',
        knockback: 1.5, hitRate: 0.85, critRate: 0.15
      };
      break;

    case 'Archer': // 弓使い（今回は短剣）：高速、クリティカル
      baseStats = { hp: 90, mp: 60, attack: 9, defense: 4, speed: GAME_CONFIG.PLAYER_SPEED * 1.1, magic: 8 };
      weaponName = 'Dagger';
      initialWeaponStats = {
        category: 'Dagger',
        slash: 6, blunt: 0, pierce: 6,
        attackSpeed: 0.35, range: 1.0, width: 0.8, shape: 'line',
        knockback: 0.2, hitRate: 0.98, critRate: 0.25
      };
      break;

    case 'Monk': // 武道家：素手、高速、高回避イメージ
      baseStats = { hp: 120, mp: 40, attack: 8, defense: 5, speed: GAME_CONFIG.PLAYER_SPEED * 1.05, magic: 10 };
      weaponName = 'Fists';
      initialWeaponStats = {
        category: 'Fist',
        slash: 0, blunt: 8, pierce: 0,
        attackSpeed: 0.3, range: 0.8, width: 0.8, shape: 'line',
        knockback: 0.5, hitRate: 1.0, critRate: 0.15
      };
      break;

    case 'Cleric': // 僧侶：槌、高MP
      baseStats = { hp: 90, mp: 100, attack: 10, defense: 6, speed: GAME_CONFIG.PLAYER_SPEED * 0.95, magic: 15 };
      weaponName = 'Cleric Hammer';
      initialWeaponStats = {
        category: 'Hammer',
        slash: 0, blunt: 12, pierce: 0,
        attackSpeed: 0.9, range: 1.2, width: 1.2, shape: 'arc',
        knockback: 2.0, hitRate: 0.9, critRate: 0.05
      };
      break;

    default: // フォールバック
      initialWeaponStats = {
        category: 'Sword',
        slash: 10, blunt: 0, pierce: 0,
        attackSpeed: 0.6, range: 1.5, width: 1.0, shape: 'arc',
        knockback: 0.5, hitRate: 0.9, critRate: 0.1
      };
      break;
  }

  // 初期武器オブジェクトの作成
  const initialWeapon: InventoryItem = {
    id: 'initial_weapon',
    instanceId: crypto.randomUUID(),
    name: weaponName,
    type: 'weapon',
    rarity: 'common',
    level: 1,
    value: 10,
    icon: weaponIcon,
    weaponStats: initialWeaponStats
  };

  return {
    id: 'player_1',
    // 初期位置（マップ生成時に上書きされる）
    x: TILE_SIZE * 5, 
    y: TILE_SIZE * 5,
    width: 24,
    height: 24,
    color: THEME.colors.player,
    job: job,
    
    // ステータス適用
    hp: baseStats.hp,
    maxHp: baseStats.hp,
    mp: baseStats.mp,
    maxMp: baseStats.mp,
    attack: baseStats.attack,
    defense: baseStats.defense,
    stats: {
      attack: baseStats.attack,
      defense: baseStats.defense,
      speed: baseStats.speed,
      magic: baseStats.magic
    },
    
    stamina: 100,
    xp: 0,
    nextLevelXp: 100,
    level: 1,
    gold: 0,
    speed: baseStats.speed,
    type: 'player',
    dead: false,
    inventory: [initialWeapon], // インベントリにも入れる
    equipment: {
      mainHand: initialWeapon, // 装備する
      armor: undefined,
      accessory: undefined
    }
  };
};
