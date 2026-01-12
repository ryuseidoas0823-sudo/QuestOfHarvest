import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { PlayerEntity } from '../types';

/**
 * 初期プレイヤーの生成ファクトリー
 */
export const createPlayer = (): PlayerEntity => {
  const { TILE_SIZE } = GAME_CONFIG;
  
  return {
    id: 'player_1',
    // 初期位置（マップの中央付近などを指定。実際の配置はMapGeneratorで行う）
    x: TILE_SIZE * 5, 
    y: TILE_SIZE * 5,
    width: 24,
    height: 24,
    color: THEME.colors.player,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stamina: 100,
    xp: 0,
    nextLevelXp: 100,
    level: 1,
    gold: 0,
    speed: GAME_CONFIG.PLAYER_SPEED,
    type: 'player',
    dead: false,
    inventory: [],
    // 必須: equipmentを初期化
    equipment: {
      mainHand: null,
      armor: null,
      accessory: null
    },
    stats: {
      attack: 10,
      defense: 5,
      speed: GAME_CONFIG.PLAYER_SPEED,
      magic: 5
    }
  };
};
