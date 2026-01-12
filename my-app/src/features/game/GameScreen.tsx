import React, { useRef, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config/firebase';
import { Settings, X, Coins, ShoppingBag, HeartPulse, UserPlus, BedDouble } from 'lucide-react';

import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../assets/constants';
import { THEME } from '../../assets/theme';

import { GameState, GameSettings, Difficulty, Item, NPCEntity, CompanionEntity } from './types';
import { generateWorldMap } from './world/MapGenerator';
import { createPlayer } from './entities/Player';
import { generateEnemy } from './lib/EnemyGenerator';
import { generateWeapon } from './lib/ItemGenerator';
import { updateGame } from './engine/GameLoop';
import { renderGame } from './engine/Renderer';

import { useGameInput } from '../../hooks/useGameInput';
import { HUD } from '../../components/UI/HUD';

interface GameScreenProps {
  user: User | null;
  initialData?: any; // ロードデータを受け取る
}

export const GameScreen: React.FC<GameScreenProps> = ({ user, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, mouse, handlers } = useGameInput();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopNPC, setShopNPC] = useState<NPCEntity | null>(null);
  
  // 初期化完了フラグ（これがtrueになるまで描画しない）
  const [isInitialized, setIsInitialized] = useState(false);

  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.5,
    gameSpeed: 1.0,
    difficulty: 'normal'
  });

  const [uiState, setUiState] = useState({
    hp: 100,
    maxHp: 100,
    inventoryCount: 0,
    enemyCount: 0,
    mode: 'combat' as 'combat' | 'build',
    locationName: 'Overworld',
    gold: 0
  });

  // GameStateは初期値nullで開始
  const gameState = useRef<GameState | null>(null);

  // --- 初期化ロジック ---
  useEffect(() => {
    console.log("GameScreen: Initializing world...");
    
    try {
      // 1. ベースのワールド生成
      const world = generateWorldMap(0);
      let newPlayer = createPlayer();
      newPlayer.x = world.spawnPoint.x;
      newPlayer.y = world.spawnPoint.y;
      newPlayer.gold = 100;

      // 2. ロードデータがある場合は上書き
      if (initialData && initialData.player) {
        console.log("GameScreen: Loading save data...");
        // プレイヤー情報の復元
        newPlayer = { ...newPlayer, ...initialData.player };
        
        // 設定の復元
        if (initialData.settings) {
          setSettings(initialData.settings);
        }
        
        // 注: マップデータ自体は容量が大きいため通常セーブしません。
        // ここでは「レベルや所持品を引き継いで、新しいマップ(拠点)から再開」する仕様とします。
        // もしマップ位置も復元したい場合は、generateWorldMapのシード固定などが必要です。
      } else {
        console.log("GameScreen: Starting new game setup...");
        // 初期装備
        const starterSword = generateWeapon(1, 'common');
        starterSword.name = "Novice Sword";
        if (starterSword.weaponStats) starterSword.weaponStats.category = 'Sword';
        newPlayer.inventory.push(starterSword);
        newPlayer.equipment = { mainHand: starterSword };
      }

      // 3. 敵の生成
      const currentDiff = initialData?.settings?.difficulty || settings.difficulty;
      const diffConfig = DIFFICULTY_CONFIG[currentDiff];
      const enemies = [];
      for (let i = 0; i < 10; i++) {
        const ex = Math.random() * (GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE);
        const ey = Math.random() * (GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE);
        const e = generateEnemy(ex, ey, 1);
        e.maxHp *= diffConfig.hpMult; e.hp = e.maxHp;
        enemies.push(e);
      }

      // 4. GameState構築
      gameState.current = {
        map: world.map,
        chests: world.chests,
        droppedItems: [],
        player: newPlayer,
        party: initialData?.party || [], // 仲間も復元
        npcs: world.npcs,
        enemies: enemies,
        particles: [],
        camera: { x: 0, y: 0 }, // 後でプレイヤー位置に合わせる
        mode: 'combat',
        settings: initialData?.settings || settings,
        location: { type: 'world', level: 0, mapsSinceLastTown: 0 },
        activeShop: null
      };

      console.log("GameScreen: Initialization complete.", gameState.current);
      setIsInitialized(true); // 準備完了

      if (canvasRef.current) canvasRef.current.focus();

    } catch (err) {
      console.error("GameScreen Initialization Error:", err);
      alert("Error initializing game. See console for details.");
    }
  }, []); // 初回のみ実行

  // 設定変更の反映
  useEffect(() => {
    if (gameState.current) {
      gameState.current.settings = settings;
    }
  }, [settings]);

  // ショップ検知
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

  // ゲームループ
  useEffect(() => {
    if (!isInitialized) return; // 初期化前は動かさない

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log("GameScreen: Starting Game Loop...");
    let animationFrameId: number;

    const loop = () => {
      // 安全策: gameStateが消えていたら中断
      if (!gameState.current) return;

      if (!isPaused) {
        updateGame(gameState.current, { keys: keys.current, mouse: mouse.current }, isPaused);
      }
      
      // 描画
      renderGame(ctx, gameState.current, { mouse: mouse.current });

      // UI同期 (頻度調整)
      if (Math.random() > 0.9) {
        const p = gameState.current.player;
        const loc = gameState.current.location;
        setUiState(prev => ({
            ...prev,
            hp: p.hp,
            maxHp: p.maxHp,
            inventoryCount: p.inventory.length,
            enemyCount: gameState.current!.enemies.length,
            mode: gameState.current!.mode,
            locationName: loc.type === 'world' ? 'Overworld' : loc.type === 'town' ? 'Village' : `Dungeon B${loc.level}`,
            gold: p.gold
        }));
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInitialized, isPaused]); // 初期化完了後にループ開始

  // --- ショップ操作 ---
  const handleBuy = (item: Item) => {
    if (!gameState.current) return;
    const p = gameState.current.player;
    if (p.gold >= item.value) {
      p.gold -= item.value;
      p.inventory.push({ ...item, instanceId: crypto.randomUUID() });
      alert(`Bought ${item.name}!`);
    } else {
      alert("Not enough gold!");
    }
  };

  const handleRest = () => {
    if (!gameState.current) return;
    const p = gameState.current.player;
    const cost = p.level * 5;
    if (p.gold >= cost) {
      p.gold -= cost;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      gameState.current.party.forEach(c => {
          if (!c.dead) { c.hp = c.maxHp; c.mp = c.maxMp; }
      });
      alert("Rested and recovered!");
      closeShop();
    } else {
      alert("Not enough gold!");
    }
  };

  const handleRecruit = (comp: CompanionEntity) => {
    if (!gameState.current) return;
    const p = gameState.current.player;
    const cost = comp.level * 50;
    if (p.gold >= cost) {
      p.gold -= cost;
      comp.x = p.x; comp.y = p.y;
      gameState.current.party.push(comp);
      if (shopNPC && shopNPC.recruitList) {
          shopNPC.recruitList = shopNPC.recruitList.filter(c => c.id !== comp.id);
      }
      alert(`${comp.job} joined your party!`);
    } else {
      alert("Not enough gold!");
    }
  };

  const handleRevive = (comp: CompanionEntity) => {
    if (!gameState.current) return;
    const p = gameState.current.player;
    const cost = comp.level * 20;
    if (p.gold >= cost) {
      p.gold -= cost;
      comp.dead = false;
      comp.hp = Math.floor(comp.maxHp / 2);
      alert(`${comp.job} has been revived!`);
    } else {
      alert("Not enough gold!");
    }
  };

  const closeShop = () => {
    setShopNPC(null);
    setIsPaused(false);
  };

  const handleToggleMode = () => {
    if (!gameState.current) return;
    const nextMode = gameState.current.mode === 'combat' ? 'build' : 'combat';
    gameState.current.mode = nextMode;
    setUiState(prev => ({ ...prev, mode: nextMode }));
  };

  const handleSave = async () => {
    if (!user || !gameState.current) return;
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData'), {
        player: gameState.current.player,
        party: gameState.current.party,
        settings,
        location: gameState.current.location,
        lastSaved: new Date()
      });
      alert('Game Saved Successfully!');
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  // まだ初期化中ならローディング表示
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <div className="text-xl animate-pulse">Initializing Game World...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <HUD 
        hp={uiState.hp}
        maxHp={uiState.maxHp}
        inventoryCount={uiState.inventoryCount}
        enemyCount={uiState.enemyCount}
        mode={uiState.mode}
        onToggleMode={handleToggleMode}
        onSave={handleSave}
      />
      
      {/* 所持金表示 */}
      <div className="absolute top-24 left-4 flex items-center gap-2 text-[#ffd700] font-serif text-lg pointer-events-none select-none z-10 bg-black/50 px-3 py-1 rounded border border-[#5d4037]">
        <Coins size={20} />
        <span>{uiState.gold} G</span>
      </div>

      {/* 設定ボタン */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => { setIsPaused(true); setShowSettings(true); }}
          className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* ショップモーダル */}
      {shopNPC && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-6 rounded-lg w-[600px] text-[#d4af37] shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-[#5d4037] pb-2">
              <div className="flex items-center gap-3">
                {shopNPC.role === 'inn' && <BedDouble size={32} />}
                {(shopNPC.role === 'weapon' || shopNPC.role === 'item') && <ShoppingBag size={32} />}
                {shopNPC.role === 'revive' && <HeartPulse size={32} />}
                {shopNPC.role === 'recruit' && <UserPlus size={32} />}
                <h2 className="text-2xl font-bold font-serif">{shopNPC.name}</h2>
              </div>
              <button onClick={closeShop} className="hover:text-white"><X /></button>
            </div>

            {/* 各ショップUIの中身 (前回と同じため省略なしで記述) */}
            {shopNPC.role === 'inn' && (
              <div className="text-center">
                <p className="mb-4 text-gray-300">"Rest your weary bones, traveler."</p>
                <button onClick={handleRest} className="px-8 py-3 bg-[#5d4037] hover:bg-[#3e2723] rounded border border-[#8d6e63] text-white font-bold text-lg">
                  Rest (Cost: {gameState.current!.player.level * 5} G)
                </button>
              </div>
            )}
            
            {(shopNPC.role === 'weapon' || shopNPC.role === 'item') && (
              <div className="grid grid-cols-2 gap-4">
                {shopNPC.shopInventory?.map(item => (
                  <div key={item.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div>
                      <div className={`font-bold ${item.rarity === 'legendary' ? 'text-orange-500' : 'text-gray-200'}`}>{item.name}</div>
                      <div className="text-xs text-gray-400">Lv.{item.level} {item.type}</div>
                      <div className="text-xs text-gray-500">
                        {item.stats?.attack ? `ATK: ${item.stats.attack}` : ''}
                        {item.stats?.defense ? `DEF: ${item.stats.defense}` : ''}
                      </div>
                    </div>
                    <button onClick={() => handleBuy(item)} className="px-3 py-1 bg-[#1b5e20] hover:bg-[#2e7d32] text-white text-sm rounded border border-[#4caf50]">
                      {item.value} G
                    </button>
                  </div>
                ))}
              </div>
            )}

            {shopNPC.role === 'recruit' && (
              <div className="space-y-4">
                <p className="text-gray-300 mb-2">"Looking for some help?"</p>
                {shopNPC.recruitList?.map(comp => (
                  <div key={comp.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-blue-400">{comp.job} - Lv.{comp.level}</div>
                      <div className="text-xs text-gray-400">HP: {comp.maxHp} / ATK: {comp.attack}</div>
                    </div>
                    <button onClick={() => handleRecruit(comp)} className="px-3 py-1 bg-[#0d47a1] hover:bg-[#1565c0] text-white text-sm rounded border border-[#42a5f5]">
                      Hire ({comp.level * 50} G)
                    </button>
                  </div>
                ))}
              </div>
            )}

            {shopNPC.role === 'revive' && (
              <div className="space-y-4">
                <p className="text-gray-300 mb-2">"I can bring back the fallen."</p>
                {gameState.current!.party.filter(c => c.dead).map(comp => (
                  <div key={comp.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div className="text-red-500 font-bold">{comp.job} (Lv.{comp.level})</div>
                    <button onClick={() => handleRevive(comp)} className="px-3 py-1 bg-[#b71c1c] hover:bg-[#c62828] text-white text-sm rounded border border-[#ef5350]">
                      Revive ({comp.level * 20} G)
                    </button>
                  </div>
                ))}
                {gameState.current!.party.filter(c => c.dead).length === 0 && <p className="text-green-500">None dead.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-8 rounded-lg w-96 text-[#d4af37] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif">Game Settings</h2>
              <button onClick={() => setShowSettings(false)} className="hover:text-white"><X /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-bold">Game Speed: {settings.gameSpeed}x</label>
                <div className="flex gap-2">
                  {[1.0, 1.5, 2.0].map(s => (
                    <button key={s} onClick={() => setSettings({...settings, gameSpeed: s})} className={`flex-1 py-1 border rounded ${settings.gameSpeed === s ? 'bg-[#5d4037] text-white' : 'border-[#5d4037] hover:bg-[#3e2723]'}`}>{s}x</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 font-bold">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'normal', 'hard', 'expert'] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => setSettings({...settings, difficulty: d})} className={`py-1 border rounded capitalize ${settings.difficulty === d ? 'bg-[#8b0000] text-white border-red-900' : 'border-[#5d4037] hover:bg-[#3e2723]'}`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => { setShowSettings(false); setIsPaused(false); }} className="w-full mt-8 py-3 bg-[#8b0000] hover:bg-red-900 text-white font-bold rounded border border-red-950 transition-colors">Resume Game</button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative shadow-2xl overflow-hidden rounded-lg border-4 transition-colors duration-300 outline-none" style={{ borderColor: THEME.colors.uiBorder, width: GAME_CONFIG.VIEWPORT_WIDTH, height: GAME_CONFIG.VIEWPORT_HEIGHT }}>
        <canvas ref={canvasRef} width={GAME_CONFIG.VIEWPORT_WIDTH} height={GAME_CONFIG.VIEWPORT_HEIGHT} className="block bg-black cursor-crosshair outline-none" tabIndex={0} {...handlers} onClick={(e) => { handlers.onMouseDown(e); e.currentTarget.focus(); }} />
      </div>
    </div>
  );
};
