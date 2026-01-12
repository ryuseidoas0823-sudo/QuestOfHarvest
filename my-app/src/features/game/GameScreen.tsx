import React, { useRef, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config/firebase';
import { Settings, X, Coins, ShoppingBag, HeartPulse, UserPlus, BedDouble } from 'lucide-react';

import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../assets/constants';
import { THEME } from '../../assets/theme';

import { GameState, GameSettings, Difficulty, Item, NPCEntity, CompanionEntity } from './types';
import { generateWorldChunk } from './world/MapGenerator'; // 変更: generateWorldChunk をインポート
import { createPlayer } from './entities/Player';
import { generateEnemy } from './lib/EnemyGenerator';
import { generateWeapon } from './lib/ItemGenerator';
import { updateGame } from './engine/GameLoop';
import { renderGame } from './engine/Renderer';

import { useGameInput } from '../../hooks/useGameInput';
import { HUD } from '../../components/UI/HUD';

interface GameScreenProps {
  user: User | null;
  initialData?: any; 
  initialSettings?: GameSettings; 
}

export const GameScreen: React.FC<GameScreenProps> = ({ user, initialData, initialSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, mouse, handlers } = useGameInput();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopNPC, setShopNPC] = useState<NPCEntity | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(
    initialData?.settings || initialSettings || {
      masterVolume: 0.5,
      gameSpeed: 1.0,
      difficulty: 'normal'
    }
  );

  const [uiState, setUiState] = useState({
    hp: 100,
    maxHp: 100,
    inventoryCount: 0,
    enemyCount: 0,
    mode: 'combat' as 'combat' | 'build',
    locationName: 'Overworld',
    gold: 0
  });

  const gameState = useRef<GameState | null>(null);

  // --- 初期化ロジック ---
  useEffect(() => {
    console.log("GameScreen: Initializing world...");
    
    try {
      const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WORLD_SIZE_W, WORLD_SIZE_H } = GAME_CONFIG;

      // 1. ワールド初期生成 (中央からスタート)
      const startWx = Math.floor(WORLD_SIZE_W / 2);
      const startWy = Math.floor(WORLD_SIZE_H / 2);
      const world = generateWorldChunk(startWx, startWy); // 変更

      let newPlayer = createPlayer();
      newPlayer.x = world.spawnPoint.x;
      newPlayer.y = world.spawnPoint.y;
      newPlayer.gold = 100;

      // 2. ロードデータ復元
      let location = { type: 'world' as const, level: 0, worldX: startWx, worldY: startWy, mapsSinceLastTown: 0 };

      if (initialData && initialData.player) {
        console.log("GameScreen: Loading save data...");
        newPlayer = { ...newPlayer, ...initialData.player };
        if (initialData.location) {
          location = initialData.location;
          // ロードされた場所がワールドなら、その座標のマップを再生成
          // (ダンジョンなどの場合はとりあえずワールドに戻す簡易実装)
          if (location.type === 'world') {
             const loadedWorld = generateWorldChunk(location.worldX, location.worldY);
             world.map = loadedWorld.map;
             world.chests = loadedWorld.chests;
          }
        }
      } else {
        console.log("GameScreen: Starting new game setup...");
        const starterSword = generateWeapon(1, 'common');
        starterSword.name = "Novice Sword";
        if (starterSword.weaponStats) starterSword.weaponStats.category = 'Sword';
        newPlayer.inventory.push(starterSword);
        newPlayer.equipment = { mainHand: starterSword };
      }

      // 3. 敵の生成
      const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];
      const enemies = [];
      for (let i = 0; i < 5; i++) {
        const ex = Math.random() * (MAP_WIDTH * TILE_SIZE);
        const ey = Math.random() * (MAP_HEIGHT * TILE_SIZE);
        const e = generateEnemy(ex, ey, 1);
        e.maxHp *= diffConfig.hpMult; e.hp = e.maxHp;
        enemies.push(e);
      }

      // 4. カメラ
      const cx = Math.max(0, Math.min(newPlayer.x - VIEWPORT_WIDTH / 2, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
      const cy = Math.max(0, Math.min(newPlayer.y - VIEWPORT_HEIGHT / 2, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

      // 5. GameState構築
      gameState.current = {
        map: world.map,
        chests: world.chests,
        droppedItems: [],
        player: newPlayer,
        party: initialData?.party || [],
        npcs: world.npcs,
        enemies: enemies,
        particles: [],
        camera: { x: cx, y: cy },
        mode: 'combat',
        settings: settings,
        location: location,
        activeShop: null
      };

      console.log("GameScreen: Initialization complete.", gameState.current);
      setIsInitialized(true);

      if (canvasRef.current) canvasRef.current.focus();

    } catch (err) {
      console.error("GameScreen Initialization Error:", err);
      alert("Error initializing game. See console for details.");
    }
  }, []);

  useEffect(() => {
    if (gameState.current) {
      gameState.current.settings = settings;
    }
  }, [settings]);

  useEffect(() => {
    const checkShop = setInterval(() => {
      if (gameState.current?.activeShop) {
        setShopNPC(gameState.current.activeShop);
        setIsPaused(true);
        gameState.current.activeShop = null;
      }
    }, 100);
    return () => clearInterval(checkShop);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      if (!gameState.current) return;

      if (!isPaused) {
        updateGame(gameState.current, { keys: keys.current, mouse: mouse.current }, isPaused);
      }
      
      renderGame(ctx, gameState.current, { mouse: mouse.current });

      if (Math.random() > 0.9) {
        const p = gameState.current.player;
        const loc = gameState.current.location;
        const locName = loc.type === 'world' ? `World (${loc.worldX},${loc.worldY})` : loc.type === 'town' ? 'Village' : `Dungeon B${loc.level}`;
        
        setUiState(prev => ({
            ...prev,
            hp: p.hp,
            maxHp: p.maxHp,
            inventoryCount: p.inventory.length,
            enemyCount: gameState.current!.enemies.length,
            mode: gameState.current!.mode,
            locationName: locName,
            gold: p.gold
        }));
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInitialized, isPaused]);

  // イベントハンドラ (省略: 変更なし)
  const handleBuy = (item: Item) => { if (gameState.current && gameState.current.player.gold >= item.value) { gameState.current.player.gold -= item.value; gameState.current.player.inventory.push({ ...item, instanceId: crypto.randomUUID() }); alert(`Bought ${item.name}!`); } else alert("Not enough gold!"); };
  const handleRest = () => { if (gameState.current && gameState.current.player.gold >= gameState.current.player.level * 5) { gameState.current.player.gold -= gameState.current.player.level * 5; gameState.current.player.hp = gameState.current.player.maxHp; gameState.current.player.mp = gameState.current.player.maxMp; gameState.current.party.forEach(c => { if(!c.dead){ c.hp = c.maxHp; c.mp = c.maxMp; }}); alert("Rested!"); closeShop(); } else alert("Not enough gold!"); };
  const handleRecruit = (comp: CompanionEntity) => { if (gameState.current && gameState.current.player.gold >= comp.level * 50) { gameState.current.player.gold -= comp.level * 50; comp.x = gameState.current.player.x; comp.y = gameState.current.player.y; gameState.current.party.push(comp); if (shopNPC && shopNPC.recruitList) shopNPC.recruitList = shopNPC.recruitList.filter(c => c.id !== comp.id); alert("Hired!"); } else alert("Not enough gold!"); };
  const handleRevive = (comp: CompanionEntity) => { if (gameState.current && gameState.current.player.gold >= comp.level * 20) { gameState.current.player.gold -= comp.level * 20; comp.dead = false; comp.hp = Math.floor(comp.maxHp / 2); alert("Revived!"); } else alert("Not enough gold!"); };
  const closeShop = () => { setShopNPC(null); setIsPaused(false); };
  const handleToggleMode = () => { if (gameState.current) { const next = gameState.current.mode === 'combat' ? 'build' : 'combat'; gameState.current.mode = next; setUiState(p => ({ ...p, mode: next })); } };
  const handleSave = async () => { if (user && gameState.current) { await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData'), { player: gameState.current.player, party: gameState.current.party, settings, location: gameState.current.location, lastSaved: new Date() }); alert("Saved!"); } };

  if (!isInitialized) {
    return <div className="flex items-center justify-center w-full h-full bg-black text-white"><div className="text-xl animate-pulse">Initializing Game World...</div></div>;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <HUD hp={uiState.hp} maxHp={uiState.maxHp} inventoryCount={uiState.inventoryCount} enemyCount={uiState.enemyCount} mode={uiState.mode} onToggleMode={handleToggleMode} onSave={handleSave} />
      <div className="absolute top-20 left-4 text-gray-400 font-serif text-sm pointer-events-none select-none">Location: <span className="text-[#d4af37] font-bold">{uiState.locationName}</span></div>
      <div className="absolute top-24 left-4 flex items-center gap-2 text-[#ffd700] font-serif text-lg pointer-events-none select-none z-10 bg-black/50 px-3 py-1 rounded border border-[#5d4037]"><Coins size={20} /><span>{uiState.gold} G</span></div>
      <div className="absolute top-4 right-4 z-20"><button onClick={() => { setIsPaused(true); setShowSettings(true); }} className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700"><Settings size={24} /></button></div>
      {shopNPC && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-6 rounded-lg w-[600px] text-[#d4af37] shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-[#5d4037] pb-2">
              <h2 className="text-2xl font-bold font-serif">{shopNPC.name}</h2>
              <button onClick={closeShop} className="hover:text-white"><X /></button>
            </div>
            {shopNPC.role === 'inn' && <div className="text-center"><p className="mb-4">"Rest?"</p><button onClick={handleRest} className="px-8 py-3 bg-[#5d4037] text-white">Rest ({gameState.current!.player.level * 5} G)</button></div>}
            {(shopNPC.role === 'weapon' || shopNPC.role === 'item') && <div className="grid grid-cols-2 gap-4">{shopNPC.shopInventory?.map(item => (<div key={item.id} className="border p-3 flex justify-between"><div>{item.name}</div><button onClick={() => handleBuy(item)}>{item.value} G</button></div>))}</div>}
            {shopNPC.role === 'recruit' && <div className="space-y-4">{shopNPC.recruitList?.map(c => (<div key={c.id} className="border p-3 flex justify-between"><div>{c.job} Lv.{c.level}</div><button onClick={() => handleRecruit(c)}>Hire ({c.level * 50} G)</button></div>))}</div>}
            {shopNPC.role === 'revive' && <div className="space-y-4">{gameState.current!.party.filter(c => c.dead).map(c => (<div key={c.id} className="border p-3 flex justify-between"><div>{c.job}</div><button onClick={() => handleRevive(c)}>Revive ({c.level * 20} G)</button></div>))}</div>}
          </div>
        </div>
      )}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-8 rounded-lg w-96 text-[#d4af37]">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <button onClick={() => { setShowSettings(false); setIsPaused(false); }} className="w-full py-3 bg-[#8b0000] text-white">Resume</button>
          </div>
        </div>
      )}
      <div className="relative shadow-2xl overflow-hidden rounded-lg border-4 transition-colors duration-300 outline-none" style={{ borderColor: THEME.colors.uiBorder, width: GAME_CONFIG.VIEWPORT_WIDTH, height: GAME_CONFIG.VIEWPORT_HEIGHT }}>
        <canvas ref={canvasRef} width={GAME_CONFIG.VIEWPORT_WIDTH} height={GAME_CONFIG.VIEWPORT_HEIGHT} className="block bg-black cursor-crosshair outline-none" tabIndex={0} {...handlers} onClick={(e) => { handlers.onMouseDown(e); e.currentTarget.focus(); }} />
      </div>
    </div>
  );
};
