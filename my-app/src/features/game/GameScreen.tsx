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
}

export const GameScreen: React.FC<GameScreenProps> = ({ user }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, mouse, handlers } = useGameInput();

  // UI State
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopNPC, setShopNPC] = useState<NPCEntity | null>(null);
  
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

  const gameState = useRef<GameState>({
    map: [],
    chests: [],
    droppedItems: [],
    player: createPlayer(),
    party: [],
    npcs: [],
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    mode: 'combat',
    settings: settings,
    location: { type: 'world', level: 0, mapsSinceLastTown: 0 },
    activeShop: null
  });

  // 初期化
  useEffect(() => {
    // 最初のマップ生成（村あり）
    const world = generateWorldMap(0);
    gameState.current.map = world.map;
    gameState.current.chests = world.chests;
    gameState.current.player.x = world.spawnPoint.x;
    gameState.current.player.y = world.spawnPoint.y;
    gameState.current.player.gold = 100;
    
    // ★ 初期装備を与える
    const starterSword = generateWeapon(1, 'common');
    starterSword.name = "Novice Sword";
    if (starterSword.weaponStats) {
        starterSword.weaponStats.category = 'Sword';
    }
    gameState.current.player.inventory.push(starterSword);
    // 装備させる
    gameState.current.player.equipment = { mainHand: starterSword };
    
    // 敵生成
    const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];
    for (let i = 0; i < 10; i++) {
      const ex = Math.random() * (GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE);
      const ey = Math.random() * (GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE);
      
      // レベル1の敵
      const e = generateEnemy(ex, ey, 1);
      e.maxHp *= diffConfig.hpMult; e.hp = e.maxHp;
      gameState.current.enemies.push(e);
    }
    
    if (canvasRef.current) canvasRef.current.focus();
  }, []);

  useEffect(() => {
    gameState.current.settings = settings;
  }, [settings]);

  // ショップ検知
  useEffect(() => {
    const checkShop = setInterval(() => {
      if (gameState.current.activeShop) {
        setShopNPC(gameState.current.activeShop);
        setIsPaused(true);
        gameState.current.activeShop = null; // リセット
      }
    }, 100);
    return () => clearInterval(checkShop);
  }, []);

  // ゲームループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      if (!isPaused) {
        updateGame(gameState.current, { keys: keys.current, mouse: mouse.current }, isPaused);
      }
      renderGame(ctx, gameState.current, { mouse: mouse.current });

      if (Math.random() > 0.9) {
        const p = gameState.current.player;
        const loc = gameState.current.location;
        setUiState(prev => ({
            ...prev,
            hp: p.hp,
            maxHp: p.maxHp,
            inventoryCount: p.inventory.length,
            enemyCount: gameState.current.enemies.length,
            mode: gameState.current.mode,
            locationName: loc.type === 'world' ? 'Overworld' : loc.type === 'town' ? 'Village' : `Dungeon B${loc.level}`,
            gold: p.gold
        }));
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]); 

  // --- ショップ操作 ---
  const handleBuy = (item: Item) => {
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
    const p = gameState.current.player;
    const cost = p.level * 5;
    if (p.gold >= cost) {
      p.gold -= cost;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      // 仲間も回復
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
    const p = gameState.current.player;
    const cost = comp.level * 50;
    if (p.gold >= cost) {
      p.gold -= cost;
      comp.x = p.x; comp.y = p.y; // 配置
      gameState.current.party.push(comp);
      // リストから削除
      if (shopNPC && shopNPC.recruitList) {
          shopNPC.recruitList = shopNPC.recruitList.filter(c => c.id !== comp.id);
      }
      alert(`${comp.job} joined your party!`);
    } else {
      alert("Not enough gold!");
    }
  };

  const handleRevive = (comp: CompanionEntity) => {
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
    const nextMode = gameState.current.mode === 'combat' ? 'build' : 'combat';
    gameState.current.mode = nextMode;
    setUiState(prev => ({ ...prev, mode: nextMode }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData'), {
        player: gameState.current.player,
        party: gameState.current.party, // 仲間も保存
        settings,
        location: gameState.current.location,
        lastSaved: new Date()
      });
      alert('Game Saved Successfully!');
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

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
                {shopNPC.role === 'weapon' && <ShoppingBag size={32} />}
                {shopNPC.role === 'item' && <ShoppingBag size={32} />}
                {shopNPC.role === 'revive' && <HeartPulse size={32} />}
                {shopNPC.role === 'recruit' && <UserPlus size={32} />}
                <h2 className="text-2xl font-bold font-serif">{shopNPC.name}</h2>
              </div>
              <button onClick={closeShop} className="hover:text-white"><X /></button>
            </div>

            {/* 宿屋 */}
            {shopNPC.role === 'inn' && (
              <div className="text-center">
                <p className="mb-4 text-gray-300">"Rest your weary bones, traveler."</p>
                <button 
                  onClick={handleRest}
                  className="px-8 py-3 bg-[#5d4037] hover:bg-[#3e2723] rounded border border-[#8d6e63] text-white font-bold text-lg"
                >
                  Rest (Cost: {gameState.current.player.level * 5} G)
                </button>
              </div>
            )}

            {/* 武器・道具屋 */}
            {(shopNPC.role === 'weapon' || shopNPC.role === 'item') && (
              <div className="grid grid-cols-2 gap-4">
                {shopNPC.shopInventory?.map(item => (
                  <div key={item.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div>
                      <div className={`font-bold ${item.rarity === 'legendary' ? 'text-orange-500' : 'text-gray-200'}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">Lv.{item.level} {item.type}</div>
                      <div className="text-xs text-gray-500">
                        {item.stats?.attack ? `ATK: ${item.stats.attack}` : ''}
                        {item.stats?.defense ? `DEF: ${item.stats.defense}` : ''}
                        {item.stats?.hp ? `Heal: ${item.stats.hp}` : ''}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleBuy(item)}
                      className="px-3 py-1 bg-[#1b5e20] hover:bg-[#2e7d32] text-white text-sm rounded border border-[#4caf50]"
                    >
                      {item.value} G
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 紹介屋 */}
            {shopNPC.role === 'recruit' && (
              <div className="space-y-4">
                <p className="text-gray-300 mb-2">"Looking for some help? I know some people."</p>
                {shopNPC.recruitList?.map(comp => (
                  <div key={comp.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-blue-400">{comp.job} - Lv.{comp.level}</div>
                      <div className="text-xs text-gray-400">
                        HP: {comp.maxHp} / MP: {comp.maxMp} / ATK: {comp.attack} / DEF: {comp.defense}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRecruit(comp)}
                      className="px-3 py-1 bg-[#0d47a1] hover:bg-[#1565c0] text-white text-sm rounded border border-[#42a5f5]"
                    >
                      Hire ({comp.level * 50} G)
                    </button>
                  </div>
                ))}
                {shopNPC.recruitList?.length === 0 && <p className="text-gray-500">No one is available right now.</p>}
              </div>
            )}

            {/* 蘇生屋 */}
            {shopNPC.role === 'revive' && (
              <div className="space-y-4">
                <p className="text-gray-300 mb-2">"I can bring back the fallen... for a donation."</p>
                {gameState.current.party.filter(c => c.dead).map(comp => (
                  <div key={comp.id} className="border border-[#5d4037] p-3 rounded bg-black/30 flex justify-between items-center">
                    <div className="text-red-500 font-bold">{comp.job} (Lv.{comp.level})</div>
                    <button 
                      onClick={() => handleRevive(comp)}
                      className="px-3 py-1 bg-[#b71c1c] hover:bg-[#c62828] text-white text-sm rounded border border-[#ef5350]"
                    >
                      Revive ({comp.level * 20} G)
                    </button>
                  </div>
                ))}
                {gameState.current.party.filter(c => c.dead).length === 0 && (
                  <p className="text-green-500">None of your companions are dead.</p>
                )}
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
            {/* 設定項目 */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-bold">Volume</label>
                <input type="range" min="0" max="1" step="0.1" value={settings.masterVolume} onChange={(e) => setSettings({...settings, masterVolume: parseFloat(e.target.value)})} className="w-full accent-[#d4af37]" />
              </div>
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
