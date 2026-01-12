import { EnemyEntity } from '../types';

// 現在はEnemyGeneratorで生成ロジックを一元管理しているため、
// ここには特定の敵クラスの振る舞いや拡張メソッドなどを定義するスペースとして残していますが、
// 現状は空の実装に近い状態です。将来的に敵AIのクラス化などを行う場合はここに記述します。

export const createBaseEnemy = (): Partial<EnemyEntity> => {
  return {
    type: 'enemy',
    dead: false,
    width: 32,
    height: 32,
    mp: 0,
    maxMp: 0,
  };
};
