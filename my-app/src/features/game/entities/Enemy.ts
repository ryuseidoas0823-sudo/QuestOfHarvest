import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { EnemyEntity } from '../types';

/**
 * 敵生成のファクトリー
 */
export const createEnemy = (x: number, y: number): EnemyEntity => {
  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x,
    y,
    width: 30,
    height: 30,
    color: THEME.colors.enemy,
    hp: 30,
    maxHp: 30,
    speed: GAME_CONFIG.ENEMY_BASE_SPEED ?? 1, // 定数にない場合はデフォルト値
    type: 'enemy',
    dead: false,
    targetId: null
  };
};

/**
 * 敵のAIロジック（単純な追跡）
 */
export const updateEnemyAI = (enemy: EnemyEntity, targetX: number, targetY: number): { dx: number, dy: number } => {
  const dist = Math.sqrt((targetX - enemy.x) ** 2 + (targetY - enemy.y) ** 2);
  
  // 索敵範囲内かつ、接触しすぎていない場合
  if (dist < 400 && dist > 10) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    return {
      dx: Math.cos(angle) * enemy.speed,
      dy: Math.sin(angle) * enemy.speed
    };
  }
  
  return { dx: 0, dy: 0 };
};
