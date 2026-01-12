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
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
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
    // ホットバー更新用State（Refの変更を検知して再レンダリングさせるため）
    hotbar: (string | null)[];
  } | null>(null);

  const [showStatus, setShowStatus] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { keys, mouse, handlers } = useGameInput();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedJob || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (!gameStateRef.current) {
      const initialTown = generateTownMap(1); 
      const initialPlayer = createPlayer(selectedJob); 
      
      let spawnX = initialTown.spawnPoint.x;
      let spawnY = initialTown.spawnPoint.y;
      
      if (spawnX < 0 || spawnX > GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE) spawnX = 10 * GAME_CONFIG.TILE_SIZE;
      if (spawnY < 0 || spawnY > GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE) spawnY = 10 * GAME_CONFIG.TILE_SIZE;

      initialPlayer.x = spawnX;
      initialPlayer.y = spawnY;

      const camX = Math.max(0, Math.min(initialPlayer.x - GAME_CONFIG.VIEWPORT_WIDTH / 2, GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.VIEWPORT_WIDTH));
      const camY = Math.max(0, Math.min(initialPlayer.y - GAME_CONFIG.VIEWPORT_HEIGHT / 2, GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE - GAME_CONFIG.VIEWPORT_HEIGHT));

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
    }

    const loop = (time: number) => {
      if (gameStateRef.current) {
        const state = gameStateRef.current;
        const isPaused = state.isPaused || !!state.activeCrafting;

        const inputState = { keys: keys.current, mouse: mouse.current };
        updateGame(state, inputState, isPaused);
        renderGame(ctx, state, { mouse: mouse.current });

        setUiState(prev => {
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
            hotbar: state.player.hotbar // ホットバー状態も監視
          };
          
          if (!prev || JSON.stringify(prev) !== JSON.stringify(newState)) {
            return newState;
          }
          return prev;
        });
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [selectedJob]);

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!gameStateRef.current) return;
    const player = gameStateRef.current.player;
    
    recipe.materials.forEach(mat => {
      let remaining = mat.count;
      player.inventory = player.inventory.filter(item => {
        if (remaining > 0 && item.materialType === mat.materialType) {
          remaining--;
          return false; 
        }
        return true;
      });
    });
    
    player.gold -= recipe.cost;
    const newItem = { ...recipe.result, instanceId: crypto.randomUUID() };
    player.inventory.push(newItem);
  };

  // ホットバー設定処理
  const handleSetHotbar = (slotIndex: number, skillId: string | null) => {
    if (gameStateRef.current) {
      const newHotbar = [...gameStateRef.current.player.hotbar];
      newHotbar[slotIndex] = skillId;
      gameStateRef.current.player.hotbar = newHotbar;
    }
  };

  const closeCrafting = () => {
    if (gameStateRef.current) gameStateRef.current.activeCrafting = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedJob && (e.key === 'Escape' || e.key === 'm' || e.key === 'M')) {
        if (gameStateRef.current?.activeCrafting) {
          gameStateRef.current.activeCrafting = null;
        } else {
          setShowStatus(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJob]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center outline-none" {...handlers} tabIndex={0}>
      <canvas ref={canvasRef} width={GAME_CONFIG.SCREEN_WIDTH} height={GAME_CONFIG.SCREEN_HEIGHT} className="block bg-slate-900" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />

      {!selectedJob && <JobSelectionScreen onSelectJob={setSelectedJob} />}

      {selectedJob && gameStateRef.current && uiState && (
        <>
          {/* HUDにもRefのホットバー状態を反映させるため、uiState経由で渡すか、Refを直接参照するが、再レンダリングが必要なのでuiState.hotbarを使う */}
          <HUD 
            player={{ 
              ...gameStateRef.current.player, 
              hp: uiState.playerHp, 
              maxHp: uiState.playerMaxHp, 
              mp: uiState.playerMp, 
              maxMp: uiState.playerMaxMp, 
              exp: uiState.playerExp, 
              nextLevelXp: uiState.playerMaxExp, 
              level: uiState.playerLevel,
              hotbar: uiState.hotbar // 反映
            }} 
            floor={uiState.floor}
            onOpenStatus={() => setShowStatus(true)}
          />
          {showStatus && (
            <StatusMenu 
              player={gameStateRef.current.player} 
              companions={gameStateRef.current.party || []} 
              onClose={() => setShowStatus(false)} 
              onSetHotbar={handleSetHotbar} // ハンドラを渡す
            />
          )}
          
          {uiState.isCrafting && gameStateRef.current.activeCrafting && (
            <CraftingMenu 
              player={gameStateRef.current.player}
              recipes={gameStateRef.current.activeCrafting.craftingRecipes || []}
              onClose={closeCrafting}
              onCraft={handleCraft}
            />
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

      {!user && <AuthOverlay />}
    </div>
  );
};
