import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '../../assets/constants';
import { useGameInput } from '../../hooks/useGameInput';
import { GameState, Job } from './types';
import { renderGame } from './engine/Renderer';
import { updateGame } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { JobSelectionScreen } from '../../components/UI/JobSelectionScreen'; 
import { AuthOverlay } from '../auth/AuthOverlay';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { generateWorldChunk, generateTownMap } from './world/MapGenerator'; // TownGeneratorをインポート
import { createPlayer } from './entities/Player';

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const gameStateRef = useRef<GameState | null>(null);

  // UI State
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
  
  // Job Selection State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { keys, mouse, handlers } = useGameInput();

  // Auth Listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Initialization & Game Loop
  useEffect(() => {
    if (!selectedJob) return; // 職業が選択されるまでゲームを開始しない
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Initialize Game State if not exists
    if (!gameStateRef.current) {
      // 変更点: 最初から村マップを生成
      const initialTown = generateTownMap(1); 
      const initialPlayer = createPlayer(selectedJob); 
      
      initialPlayer.x = initialTown.spawnPoint.x;
      initialPlayer.y = initialTown.spawnPoint.y;

      gameStateRef.current = {
        isPaused: false,
        gameTime: 0,
        camera: { x: 0, y: 0 },
        player: initialPlayer,
        party: [],
        companions: [],
        map: initialTown.map, // 村マップをセット
        chests: initialTown.chests,
        npcs: initialTown.npcs, // NPCもセット
        enemies: [],
        droppedItems: [],
        particles: [],
        // ロケーション情報を村に設定
        location: { 
          type: 'town', 
          level: 0, 
          worldX: 0, 
          worldY: 0,
          townId: 'starting_village'
        },
        mode: 'combat',
        settings: { difficulty: 'normal', gameSpeed: 1.0, volume: 0.5, showDamage: true },
        dialogue: null,
        activeShop: null,
      };
    }

    const loop = (time: number) => {
      if (gameStateRef.current && !gameStateRef.current.isPaused) {
        const state = gameStateRef.current;

        const inputState = {
          keys: keys.current,
          mouse: mouse.current
        };

        updateGame(state, inputState, false);
        renderGame(ctx, state, { mouse: mouse.current });

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
  }, [selectedJob]); // selectedJobが変わったら実行（初期化）

  // Key Event Listener for Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ゲーム開始後のみメニューを開ける
      if (selectedJob && (e.key === 'Escape' || e.key === 'm' || e.key === 'M')) {
        setShowStatus(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJob]);


  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center outline-none"
      {...handlers}
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

      {/* Job Selection Screen (Overlay) */}
      {!selectedJob && (
        <JobSelectionScreen onSelectJob={setSelectedJob} />
      )}

      {/* Game UI Overlays */}
      {selectedJob && gameStateRef.current && uiState && (
        <>
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

      {/* Auth Overlay */}
      {!user && <AuthOverlay />}

    </div>
  );
};
