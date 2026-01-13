import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '../../assets/constants';
import { useGameInput } from '../../hooks/useGameInput';
import { GameState, Job, CraftingRecipe } from './types';
import { renderGame } from './engine/Renderer';
import { updateGame } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { JobSelectionScreen } from '../../components/UI/JobSelectionScreen'; 
import { CraftingMenu } from '../../components/UI/CraftingMenu';
import { AuthOverlay } from '../auth/AuthOverlay';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isOffline } from '../../config/firebase'; // configからインポート
import { generateTownMap } from './world/MapGenerator';
import { createPlayer } from './entities/Player';

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const gameStateRef = useRef<GameState | null>(null);

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
    isCrafting: boolean;
    hotbar: (string | null)[];
  } | null>(null);

  const [showStatus, setShowStatus] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const { keys, mouse, handlers } = useGameInput();

  useEffect(() => {
    // オフラインなら認証監視しない
    if (isOffline) return;

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedJob || !canvasRef.current) return;
    
    const startGeneration = async () => {
      setIsGenerating(true);
      setLoadProgress(10);
      
      await new Promise(r => setTimeout(r, 50));
      setLoadProgress(30);

      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      if (!gameStateRef.current) {
        setLoadProgress(50);
        await new Promise(r => setTimeout(r, 100));

        const initialTown = generateTownMap(1); 
        const initialPlayer = createPlayer(selectedJob); 
        
        setLoadProgress(70);

        let spawnX = initialTown.spawnPoint.x;
        let spawnY = initialTown.spawnPoint.y;
        
        if (spawnX < 0 || spawnX > GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE) spawnX = 10 * GAME_CONFIG.TILE_SIZE;
        if (spawnY < 0 || spawnY > GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE) spawnY = 10 * GAME_CONFIG.TILE_SIZE;

        initialPlayer.x = spawnX;
        initialPlayer.y = spawnY;

        const camX = Math.max(0, Math.min(initialPlayer.x - GAME_CONFIG.VIEWPORT_WIDTH / 2, GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.VIEWPORT_WIDTH));
        const camY = Math.max(0, Math.min(initialPlayer.y - GAME_CONFIG.VIEWPORT_HEIGHT / 2, GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.VIEWPORT_HEIGHT));

        setLoadProgress(90);
        await new Promise(r => setTimeout(r, 100));

        gameStateRef.current = {
          isPaused: false,
          gameTime: 0,
          camera: { x: camX, y: camY },
          player: initialPlayer,
          party: [],
          companions: [],
          map: initialTown.map, 
          chests: initialTown.chests,
          npcs: initialTown.npcs,
          resources: initialTown.resources || [],
          enemies: [],
          droppedItems: [],
          particles: [],
          location: { type: 'town', level: 0, worldX: 0, worldY: 0, townId: 'starting_village' },
          mode: 'combat',
          settings: { difficulty: 'normal', gameSpeed: 1.0, volume: 0.5, masterVolume: 0.5 },
          dialogue: null,
          activeShop: null,
          activeCrafting: null,
        };
        
        setLoadProgress(100);
        await new Promise(r => setTimeout(r, 200));
        setIsGenerating(false);
        startGameLoop();
      }
    };

    startGeneration();

    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [selectedJob]);

  const startGameLoop = () => {
    const loop = (time: number) => {
      if (gameStateRef.current) {
        const state = gameStateRef.current;
        const isPaused = state.isPaused || !!state.activeCrafting;
        const inputState = { keys: keys.current, mouse: mouse.current };
        
        updateGame(state, inputState, isPaused);
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) renderGame(ctx, state, { mouse: mouse.current });

        setUiState((prev: any) => {
          const newState = {
            playerHp: state.player.hp,
            playerMaxHp: state.player.maxHp,
            playerMp: state.player.mp,
            playerMaxMp: state.player.maxMp,
            playerExp: state.player.exp,
            playerMaxExp: state.player.nextLevelXp,
            playerLevel: state.player.level,
            floor: state.location.level,
            dialogue: state.dialogue || null,
            isCrafting: !!state.activeCrafting,
            hotbar: state.player.hotbar
          };
          if (!prev || JSON.stringify(prev) !== JSON.stringify(newState)) return newState;
          return prev;
        });
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!gameStateRef.current) return;
    const player = gameStateRef.current.player;
    recipe.materials.forEach(mat => {
      let remaining = mat.count;
      player.inventory = player.inventory.filter(item => {
        if (remaining > 0 && item.materialType === mat.materialType) { remaining--; return false; }
        return true;
      });
    });
    player.gold -= recipe.cost;
    player.inventory.push({ ...recipe.result, instanceId: crypto.randomUUID() });
  };

  const handleSetHotbar = (slotIndex: number, skillId: string | null) => {
    if (gameStateRef.current) {
      const newHotbar = [...gameStateRef.current.player.hotbar];
      newHotbar[slotIndex] = skillId;
      gameStateRef.current.player.hotbar = newHotbar;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedJob && (e.key === 'Escape' || e.key === 'm' || e.key === 'M')) {
        if (gameStateRef.current?.activeCrafting) gameStateRef.current.activeCrafting = null;
        else setShowStatus(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJob]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center outline-none" {...handlers} tabIndex={0}>
      <canvas ref={canvasRef} width={GAME_CONFIG.SCREEN_WIDTH} height={GAME_CONFIG.SCREEN_HEIGHT} className="block bg-slate-900" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />

      {/* Loading Screen */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
          <div className="text-3xl font-bold mb-6 animate-pulse text-yellow-500">Generating World...</div>
          <div className="w-96 h-6 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600 shadow-lg relative">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 ease-out" 
              style={{ width: `${loadProgress}%` }} 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          </div>
          <div className="mt-4 font-mono text-xl text-gray-300 tracking-wider">{loadProgress}%</div>
          <div className="mt-8 text-sm text-gray-500 animate-bounce"> preparing chunks... </div>
        </div>
      )}

      {!selectedJob && !isGenerating && <JobSelectionScreen onSelectJob={setSelectedJob} />}

      {selectedJob && !isGenerating && gameStateRef.current && uiState && (
        <>
          <HUD 
            player={{ ...gameStateRef.current.player, hp: uiState.playerHp, maxHp: uiState.playerMaxHp, mp: uiState.playerMp, maxMp: uiState.playerMaxMp, exp: uiState.playerExp, nextLevelXp: uiState.playerMaxExp, level: uiState.playerLevel, hotbar: uiState.hotbar }} 
            floor={uiState.floor}
            onOpenStatus={() => setShowStatus(true)}
          />
          {showStatus && <StatusMenu player={gameStateRef.current.player} companions={gameStateRef.current.party || []} onClose={() => setShowStatus(false)} onSetHotbar={handleSetHotbar} />}
          {uiState.isCrafting && gameStateRef.current.activeCrafting && (
            <CraftingMenu player={gameStateRef.current.player} recipes={gameStateRef.current.activeCrafting.craftingRecipes || []} onClose={() => gameStateRef.current!.activeCrafting = null} onCraft={handleCraft} />
          )}
        </>
      )}

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

      {!user && !isOffline && <AuthOverlay />}
    </div>
  );
};
