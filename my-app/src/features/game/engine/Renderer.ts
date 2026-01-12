import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, PlayerEntity, EnemyEntity, CompanionEntity, NPCEntity, CombatEntity, WeaponCategory } from '../types';

// ... existing code ...

    // 武器描画 (簡易)
    const p = entity as PlayerEntity;
    // 安全装置: p.equipment が存在することを確認
    const mainHand = p.equipment?.mainHand;
    const weaponCat = mainHand?.weaponStats?.category || 'Sword';
    
    // 攻撃中かどうか判定
    const isAttacking = (p as any).isAttacking;
    const attackDir = (p as any).attackDirection;

    drawWeapon(ctx, weaponCat, drawX, drawY, w, h, isAttacking, attackDir);

  } 
  // --- 敵描画 (モンスター) ---
// ... existing code ...
    if (state.mode === 'combat' && state.player?.equipment?.mainHand?.weaponStats) {
      const weapon = state.player.equipment.mainHand.weaponStats;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
// ... existing code ...
