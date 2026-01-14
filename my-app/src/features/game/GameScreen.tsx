import React, { useRef, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, APP_ID, isOffline } from '../../config/firebase';
import { Settings, X, Coins } from 'lucide-react';

import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../assets/constants';
import { THEME } from '../../assets/theme';

import { GameState, GameSettings, NPCEntity, Job, CraftingRecipe } from './types';
import { generateTownMap, generateWorldChunk } from './world/MapGenerator';
import { createPlayer } from './entities/Player';
import { updateGame } from './engine/GameLoop';
import { renderGame } from './engine/Renderer';

import { useGameInput } from '../../hooks/useGameInput';
import { HUD } from '../../components/UI/HUD';
import { JobSelectionScreen } from '../../components/UI/JobSelectionScreen';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { CraftingMenu } from '../../components/UI/CraftingMenu';

interface GameScreenProps {
  user: User | null;
  initialData?: any; 
  initialSettings?: GameSettings; 
}

export const GameScreen: React.FC<GameScreenProps> = ({ user, initialData, initialSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { keys, mouse, handlers } = useGameInput();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopNPC, setShopNPC] = useState<NPCEntity | null>(null);
  const [activeCrafting, setActiveCrafting] = useState<NPCEntity | null>(null);
  
  // Job Selection
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  // Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Status Menu
  const [showStatus, setShowStatus] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(
    initialData?.settings || initialSettings || {
      masterVolume: 0.5,
      gameSpeed: 1.0,
      difficulty: 'normal'
    }
  );

  const [uiState, setUiState] = useState({
    playerHp: 100,
    playerMaxHp: 100,
    playerMp: 50,
    playerMaxMp: 50,
    exp: 0,
    nextLevelXp: 100,
    level: 1,
    inventoryCount: 0,
    enemyCount: 0,
    mode: 'combat' as 'combat' | 'build',
    locationName: 'Unknown',
    gold: 0,
    hotbar: [] as (string|null)[]
  });

  const gameState = useRef<GameState | null>(null);

  // ロードデータがある場合はジョブ選択をスキップ
  useEffect(() => {
    if (initialData && initialData.player && initialData.player.job) {
      setSelectedJob(initialData.player.job);
    }
  }, [initialData]);

  // ゲーム初期化処理
  useEffect(() => {
    // ジョブが未選択の場合は待機
    if (!selectedJob) return;
    if (isInitialized) return; 

    const initGame = async () => {
      setIsGenerating(true);
      setLoadProgress(10);
      await new Promise(r => setTimeout(r, 50));

      console.log("GameScreen: Initializing world...");
      
      try {
        setLoadProgress(30);
        const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;

        // 1. マップ生成 (基本は村スタート)
        let world;
        let startLocation = { type: 'town' as const, level: 0, worldX: 0, worldY: 0, townId: 'start_village' };
        
        // ロードデータがある場合
        if (initialData && initialData.location) {
           startLocation = initialData.location;
           if (startLocation.type === 'town') world = generateTownMap(initialData.player?.level || 1);
           else world = generateWorldChunk(startLocation.worldX, startLocation.worldY); // 簡易復帰
        } else {
           // 新規ゲーム
           world = generateTownMap(1);
        }
        
        setLoadProgress(60);

        // 2. プレイヤー生成
        let newPlayer = createPlayer(selectedJob);
        // スポーン位置調整
        newPlayer.x = world.spawnPoint.x;
        newPlayer.y = world.spawnPoint.y;
        
        // ロードデータの適用
        if (initialData && initialData.player) {
          newPlayer = { ...newPlayer, ...initialData.player };
          // 座標復元
          if (initialData.player.x) newPlayer.x = initialData.player.x;
          if (initialData.player.y) newPlayer.y = initialData.player.y;
        }

        setLoadProgress(80);

        // 3. カメラ初期位置
        const currentW = containerRef.current?.clientWidth || VIEWPORT_WIDTH;
        const currentH = containerRef.current?.clientHeight || VIEWPORT_HEIGHT;
        const cx = Math.max(0, Math.min(newPlayer.x - currentW / 2, MAP_WIDTH * TILE_SIZE - currentW));
        const cy = Math.max(0, Math.min(newPlayer.y - currentH / 2, MAP_HEIGHT * TILE_SIZE - currentH));

        // 4. GameState構築
        gameState.current = {
          map: world.map,
          chests: world.chests,
          droppedItems: [],
          player: newPlayer,
          party: initialData?.party || [],
          npcs: world.npcs,
          resources: world.resources || [],
          enemies: [], // 初期敵なし、updateGameで湧く
          particles: [],
          camera: { x: cx, y: cy },
          mode: 'combat',
          settings: settings,
          location: startLocation,
          activeShop: null,
          activeCrafting: null
        };

        setLoadProgress(100);
        await new Promise(r => setTimeout(r, 200));
        
        console.log("GameScreen: Initialization complete.");
        setIsInitialized(true);
        setIsGenerating(false);

        if (canvasRef.current) canvasRef.current.focus();

      } catch (err) {
        console.error("GameScreen Initialization Error:", err);
        alert("Error initializing game. See console.");
        setIsGenerating(false);
      }
    };

    initGame();
  }, [selectedJob, isInitialized]);

  // 設定同期
  useEffect(() => {
    if (gameState.current) {
      gameState.current.settings = settings;
    }
  }, [settings]);

  // インタラクション監視 (Shop / Crafting)
  useEffect(() => {
    const checkInteraction = setInterval(() => {
      if (gameState.current) {
        if (gameState.current.activeShop && !shopNPC) {
          setShopNPC(gameState.current.activeShop);
          setIsPaused(true);
        }
        if (gameState.current.activeCrafting && !activeCrafting) {
          setActiveCrafting(gameState.current.activeCrafting);
          setIsPaused(true);
        }
      }
    }, 100);
    return () => clearInterval(checkInteraction);
  }, [shopNPC, activeCrafting]);

  // メインループ
  useEffect(() => {
    if (!isInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      if (!gameState.current) return;

      const currentPaused = isPaused || !!shopNPC || !!activeCrafting || showSettings || showStatus;

      // Update
      if (!currentPaused) {
        updateGame(gameState.current, { keys: keys.current, mouse: mouse.current }, false);
        
        // カメラ追従 (簡易)
        const p = gameState.current.player;
        const cw = canvas.width;
        const ch = canvas.height;
        const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = GAME_CONFIG;
        
        let cx = p.x - cw / 2;
        let cy = p.y - ch / 2;
        cx = Math.max(0, Math.min(cx, MAP_WIDTH * TILE_SIZE - cw));
        cy = Math.max(0, Math.min(cy, MAP_HEIGHT * TILE_SIZE - ch));
        gameState.current.camera.x = cx;
        gameState.current.camera.y = cy;
      }
      
      // Render
      renderGame(ctx, gameState.current, { mouse: mouse.current }, { width: canvas.width, height: canvas.height });

      // UI Sync (低頻度更新)
      if (Math.random() > 0.8) {
        const p = gameState.current.player;
        const loc = gameState.current.location;
        const locName = loc.type === 'world' ? `World` : loc.type === 'town' ? 'Village' : `Dungeon B${loc.level}`;
        
        setUiState({
            playerHp: p.hp,
            playerMaxHp: p.maxHp,
            playerMp: p.mp,
            playerMaxMp: p.maxMp,
            exp: p.xp,
            nextLevelXp: p.nextLevelXp,
            level: p.level,
            inventoryCount: p.inventory.length,
            enemyCount: gameState.current!.enemies.length,
            mode: gameState.current!.mode,
            locationName: locName,
            gold: p.gold,
            hotbar: p.hotbar
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInitialized, isPaused, shopNPC, activeCrafting, showSettings, showStatus]);

  // Handlers
  const handleToggleMode = () => { if (gameState.current) { const next = gameState.current.mode === 'combat' ? 'build' : 'combat'; gameState.current.mode = next; } };
  const handleSave = async () => { 
    if (user && !isOffline && gameState.current) { 
      try {
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData'), { 
          player: gameState.current.player, party: gameState.current.party, settings, location: gameState.current.location, lastSaved: new Date() 
        }); 
        alert("Saved successfully!"); 
      } catch(e) { alert("Save failed (Offline?)"); }
    } else {
      alert("Cannot save in offline mode.");
    }
  };

  const handleSetHotbar = (slotIndex: number, skillId: string | null) => {
    if (gameState.current) {
      const newHotbar = [...gameState.current.player.hotbar];
      newHotbar[slotIndex] = skillId;
      gameState.current.player.hotbar = newHotbar;
    }
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!gameState.current) return;
    const player = gameState.current.player;
    // Check & Consume logic (簡易版)
    // 実際には詳細なチェックが必要ですが、UI側でdisabled制御しているのでここでは実行のみ
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

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // UI JSX
  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center outline-none" {...handlers} tabIndex={0}>
      <canvas ref={canvasRef} className="block bg-slate-900 cursor-crosshair" style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />

      {/* Loading */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
          <div className="text-2xl mb-4 font-serif text-[#d4af37]">Generating World... {loadProgress}%</div>
          <div className="w-64 h-2 bg-gray-800 rounded"><div className="h-full bg-[#d4af37]" style={{width: `${loadProgress}%`}}/></div>
        </div>
      )}

      {/* Job Selection */}
      {!selectedJob && !isGenerating && (
        <JobSelectionScreen onSelectJob={setSelectedJob} />
      )}

      {/* Game UI */}
      {isInitialized && gameState.current && (
        <>
          <HUD 
            player={{...gameState.current.player, hp:uiState.playerHp, maxHp:uiState.playerMaxHp, mp:uiState.playerMp, maxMp:uiState.playerMaxMp, exp:uiState.exp, nextLevelXp:uiState.nextLevelXp, level:uiState.level, hotbar:uiState.hotbar}} 
            floor={uiState.floor}
            onOpenStatus={() => { setShowStatus(true); setIsPaused(true); }}
          />
          <div className="absolute top-4 left-4 text-white font-serif drop-shadow-md">
            <div>{uiState.locationName}</div>
            <div className="flex items-center gap-1 text-[#ffd700]"><Coins size={16}/> {uiState.gold}</div>
          </div>
          <div className="absolute top-4 right-4"><button onClick={() => { setIsPaused(true); setShowSettings(true); }}><Settings className="text-white hover:text-[#d4af37]" /></button></div>
        </>
      )}

      {/* Modals */}
      {showStatus && gameState.current && (
        <StatusMenu 
          player={gameState.current.player} 
          companions={gameState.current.party} 
          onClose={() => { setShowStatus(false); setIsPaused(false); }} 
          onSetHotbar={handleSetHotbar} 
        />
      )}

      {shopNPC && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="bg-[#2d1b15] p-6 rounded text-white border border-[#5d4037]">
            <h2 className="text-xl font-bold mb-4">{shopNPC.name}</h2>
            <p className="mb-4 text-gray-400">"Welcome! Take a look."</p>
            {/* 簡易ショップUI */}
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {shopNPC.shopInventory?.map(item => (
                <div key={item.id} className="flex justify-between gap-4 p-2 bg-[#1a1a1a]">
                  <span>{item.name}</span>
                  <button onClick={()=>{ /* buy logic */ }} className="text-yellow-500">{item.value} G</button>
                </div>
              ))}
            </div>
            <button onClick={() => { setShopNPC(null); setIsPaused(false); gameState.current!.activeShop = null; }} className="mt-4 w-full py-2 bg-[#5d4037]">Close</button>
          </div>
        </div>
      )}

      {activeCrafting && (
        <CraftingMenu 
          player={gameState.current!.player}
          recipes={activeCrafting.craftingRecipes || []}
          onClose={() => { setActiveCrafting(null); setIsPaused(false); gameState.current!.activeCrafting = null; }}
          onCraft={handleCraft}
        />
      )}

      {showSettings && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#2d1b15] p-8 rounded border border-[#5d4037] text-white">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <button onClick={() => { setShowSettings(false); setIsPaused(false); }} className="w-full py-3 bg-[#5d4037]">Resume</button>
          </div>
        </div>
      )}

    </div>
  );
};
