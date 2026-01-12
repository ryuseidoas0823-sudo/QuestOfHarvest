import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '../../assets/constants';
import { useGameInput } from '../../hooks/useGameInput';
import { GameState } from './types';
import { renderGame } from './engine/Renderer';
import { updateGame } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { AuthOverlay } from '../auth/AuthOverlay';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { generateWorldChunk } from './world/MapGenerator';
import { generatePlayer } from './entities/Player';

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // ゲームのメイン状態はRefで管理（毎フレームのReactレンダリングを回避するため）
  const gameStateRef = useRef<GameState | null>(null);

  // UI表示用のState（HPやフロアなど、変化した時だけ更新）
  const [uiState, setUiState] = useState<{
    playerHp: number;
    playerMaxHp: number;
    playerMp: number;
    playerMaxMp: number;
    playerExp: number;
    playerMaxExp: number;
    playerLevel: number;
    floor: number;
    dialogue: { name: string, text: string } | null;
  } | null>(null);

  const [showStatus, setShowStatus] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 入力フック
  const { keys, mouse, handlers } = useGameInput();

  // Auth Listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 初期化とゲームループ
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 初期状態の生成
    if (!gameStateRef.current) {
      const initialMap = generateWorldChunk(0, 0);
      const initialPlayer = generatePlayer('Hero'); // 仮のプレイヤー生成
      // プレイヤー位置をスポーンポイントに
      initialPlayer.x = initialMap.spawnPoint.x;
      initialPlayer.y = initialMap.spawnPoint.y;

      gameStateRef.current = {
        isPaused: false,
        gameTime: 0,
        camera: { x: 0, y: 0 },
        player: initialPlayer,
        party: [], // 初期は空、必要なら追加
        companions: [],
        map: initialMap.map,
        chests: initialMap.chests,
        npcs: initialMap.npcs,
        enemies: [],
        droppedItems: [],
        particles: [],
        location: { type: 'world', level: 0, worldX: 0, worldY: 0 },
        mode: 'combat',
        settings: { difficulty: 'normal', gameSpeed: 1.0, volume: 0.5, showDamage: true },
        dialogue: null,
        activeShop: null,
      };
    }

    const loop = (time: number) => {
      if (gameStateRef.current && !gameStateRef.current.isPaused) {
        const state = gameStateRef.current;

        // 入力オブジェクトの整形
        const inputState = {
          keys: keys.current,
          mouse: mouse.current
        };

        // 更新処理 (Stateを直接変更)
        updateGame(state, inputState, false);

        // 描画処理
        renderGame(ctx, state, { mouse: mouse.current });

        // UI同期 (簡易的な最適化: 必要な値だけ比較してState更新したいが、
        // ここでは60FPSでReact Stateを更新すると重いので、
        // 変化があった場合や一定間隔で更新するのが望ましい。
        // 今回はとりあえずrequestAnimationFrameごとにチェックして変化あれば更新する形にする)
        
        // 注: 厳密な比較はコストがかかるので、重要な値の変更のみ検知してUIを更新する
        // 実際にはカスタムイベントや、別のRefで前回値を保持して比較するのが良い
        setUiState(prev => {
          if (!prev || 
              prev.playerHp !== state.player.hp || 
              prev.floor !== state.location.level ||
              prev.dialogue !== state.dialogue
             ) {
             return {
               playerHp: state.player.hp,
               playerMaxHp: state.player.maxHp,
               playerMp: state.player.mp,
               playerMaxMp: state.player.maxMp,
               playerExp: state.player.exp,
               playerMaxExp: state.player.maxExp,
               playerLevel: state.player.level,
               floor: state.location.level,
               dialogue: state.dialogue || null
             };
          }
          return prev;
        });
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []); // 初回のみ実行

  // Status Menu Toggle
  // useGameInput内ではキーイベントをRefに格納しているだけなので、
  // ここでキーの立ち上がりを検知するか、GameLoop内で検知する必要がある。
  // 簡易的に、GameLoop内でMENUキーを処理するのが一般的だが、
  // React側のState(showStatus)を変更したいので、キー監視をここで行うか、
  // useGameInputを拡張する必要がある。
  // 今回は簡易的にキーダウンイベントを別途リッスンするか、
  // updateGame内でフラグを立ててUI側で検知するのが良いが、
  // 既存のuseGameInputの仕様上、直接イベントリスナを追加する。
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        setShowStatus(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center outline-none"
      {...handlers} // マウスイベントをDivにバインド
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.SCREEN_WIDTH}
        height={GAME_CONFIG.SCREEN_HEIGHT}
        className="block bg-slate-900"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated'
        }}
      />

      {/* UI Overlays */}
      {gameStateRef.current && uiState && (
        <>
          {/* HUDにはRefではなくReact Stateから値を渡す */}
          <HUD 
            player={{ 
              ...gameStateRef.current.player, 
              hp: uiState.playerHp, 
              maxHp: uiState.playerMaxHp,
              mp: uiState.playerMp,
              maxMp: uiState.playerMaxMp,
              exp: uiState.playerExp,
              maxExp: uiState.playerMaxExp,
              level: uiState.playerLevel
            }} 
            floor={uiState.floor}
            onOpenStatus={() => setShowStatus(true)}
          />
          
          {showStatus && (
            <StatusMenu 
              player={gameStateRef.current.player}
              companions={gameStateRef.current.party || []}
              onClose={() => setShowStatus(false)}
            />
          )}
        </>
      )}

      {/* Dialog Overlay */}
      {uiState?.dialogue && (
        <div className="absolute inset-x-0 bottom-0 p-4 bg-slate-900/90 border-t-2 border-slate-600 text-white min-h-[150px] animate-slide-up z-50 pointer-events-none">
          <div className="max-w-4xl mx-auto flex gap-4 pointer-events-auto">
            <div className="w-16 h-16 bg-slate-700 rounded-full border-2 border-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-500 mb-1">{uiState.dialogue.name}</h3>
              <p className="text-lg leading-relaxed">{uiState.dialogue.text}</p>
              <div className="mt-2 text-sm text-gray-400">Press [Space] or Click to continue</div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Overlay (Login Prompt) */}
      {!user && <AuthOverlay />}

    </div>
  );
};
