import React, { useRef, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config/firebase';

// Assets & Config
import { GAME_CONFIG } from '../../assets/constants';
import { THEME } from '../../assets/theme';

// Types & Logic
import { GameState } from './types';
import { generateMap } from './world/MapGenerator';
import { createPlayer } from './entities/Player';
import { createEnemy } from './entities/Enemy';
import { updateGame } from './engine/GameLoop';
import { renderGame } from './engine/Renderer';

// Hooks & Components
import { useGameInput } from '../../hooks/useGameInput';
import { HUD } from '../../components/UI/HUD';

interface GameScreenProps {
  user: User | null;
}

/**
 * ゲームのメイン画面コンポーネント
 * Canvasの管理、ゲームループの実行、UI状態の同期を行います
 */
export const GameScreen: React.FC<GameScreenProps> = ({ user }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 入力フック
  const { keys, mouse, handlers } = useGameInput();

  // React State for UI (頻繁なレンダリングを避けるため、ゲームループとは分離)
  const [uiState, setUiState] = useState({
    hp: 100,
    maxHp: 100,
    inventoryCount: 0,
    enemyCount: 0,
    mode: 'combat' as 'combat' | 'build'
  });

  // Mutable Game State (Refで管理し、Reactの再レンダリングを回避)
  const gameState = useRef<GameState>({
    map: [], // 初期化時に生成
    player: createPlayer(),
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    mode: 'combat'
  });

  // 初期化 (マウント時のみ)
  useEffect(() => {
    // マップ生成
    gameState.current.map = generateMap();
    
    // 初期敵スポーン
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE);
      const y = Math.random() * (GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE);
      gameState.current.enemies.push(createEnemy(x, y));
    }
  }, []);

  // ゲームループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      // 1. ロジック更新
      updateGame(gameState.current, { keys: keys.current, mouse: mouse.current });

      // 2. 描画
      renderGame(ctx, gameState.current, { mouse: mouse.current });

      // 3. UIとの同期 (頻度を落とす簡単なスロットリング)
      // 本番環境では requestIdleCallback やもっと洗練された方法を検討
      if (Math.random() > 0.9) {
        const p = gameState.current.player;
        setUiState(prev => {
          // 値が変わっていない場合は更新しない最適化を入れると良い
          if (prev.hp === p.hp && 
              prev.inventoryCount === p.inventory.length && 
              prev.enemyCount === gameState.current.enemies.length &&
              prev.mode === gameState.current.mode) {
            return prev;
          }
          return {
            ...prev,
            hp: p.hp,
            maxHp: p.maxHp,
            inventoryCount: p.inventory.length,
            enemyCount: gameState.current.enemies.length,
            mode: gameState.current.mode
          };
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // モード切替アクション
  const handleToggleMode = () => {
    const nextMode = gameState.current.mode === 'combat' ? 'build' : 'combat';
    gameState.current.mode = nextMode;
    // 即時UI反映
    setUiState(prev => ({ ...prev, mode: nextMode }));
  };

  // セーブアクション
  const handleSave = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData'), {
        player: gameState.current.player,
        lastSaved: new Date()
      });
      // 本来はToast通知などを出す
      alert('Game Saved Successfully!');
    } catch (e) {
      console.error("Save failed:", e);
      alert('Failed to save game.');
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* HUD (UIレイヤー) */}
      <HUD 
        hp={uiState.hp}
        maxHp={uiState.maxHp}
        inventoryCount={uiState.inventoryCount}
        enemyCount={uiState.enemyCount}
        mode={uiState.mode}
        onToggleMode={handleToggleMode}
        onSave={handleSave}
      />

      {/* ゲームキャンバス */}
      <div 
        className="relative shadow-2xl overflow-hidden rounded-lg border-4 transition-colors duration-300"
        style={{ 
          borderColor: THEME.colors.uiBorder,
          width: GAME_CONFIG.VIEWPORT_WIDTH,
          height: GAME_CONFIG.VIEWPORT_HEIGHT
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.VIEWPORT_WIDTH}
          height={GAME_CONFIG.VIEWPORT_HEIGHT}
          className="block bg-black cursor-crosshair"
          {...handlers}
        />
      </div>
    </div>
  );
};
