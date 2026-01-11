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
    // 初期位置（マップの中央付近などを指定）
    x: TILE_SIZE * 5, 
    y: TILE_SIZE * 5,
    width: 24,
    height: 24,
    color: THEME.colors.player,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    speed: GAME_CONFIG.PLAYER_SPEED,
    type: 'player',
    dead: false,
    inventory: []
  };
};

// プレイヤー固有のロジックがあればクラス化または関数としてここに追加
// 例: スタミナ消費、アイテム使用など
