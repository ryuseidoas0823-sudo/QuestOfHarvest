import React, { useRef, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config/firebase';
import { Settings, X } from 'lucide-react';

import { GAME_CONFIG, DIFFICULTY_CONFIG } from '../../assets/constants';
import { THEME } from '../../assets/theme';

import { GameState, GameSettings, Difficulty } from './types';
import { generateWorldMap } from './world/MapGenerator';
import { createPlayer } from './entities/Player';
import { createEnemy } from './entities/Enemy';
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

  // Settings State
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    locationName: 'Overworld'
  });

  const gameState = useRef<GameState>({
    map: [],
    chests: [],
    droppedItems: [],
    player: createPlayer(),
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    mode: 'combat',
    settings: settings,
    location: { type: 'world', level: 0 }
  });

  // 初期化
  useEffect(() => {
    // 地形と宝箱生成（ワールドマップ）
    const world = generateWorldMap();
    gameState.current.map = world.map;
    gameState.current.chests = world.chests;
    gameState.current.player.x = world.spawnPoint.x;
    gameState.current.player.y = world.spawnPoint.y;
    
    // 敵生成（難易度反映）
    const diffConfig = DIFFICULTY_CONFIG[settings.difficulty];
    for (let i = 0; i < 10; i++) {
      let x, y;
      do {
        x = Math.random() * (GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE);
        y = Math.random() * (GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE);
      } while (x < 400 && y < 400);

      const e = createEnemy(x, y);
      e.maxHp *= diffConfig.hpMult;
      e.hp = e.maxHp;
      gameState.current.enemies.push(e);
    }
    
    if (canvasRef.current) canvasRef.current.focus();
  }, []);

  // 設定変更の反映
  useEffect(() => {
    gameState.current.settings = settings;
  }, [settings]);

  // キー入力によるポーズ切り替え監視
  useEffect(() => {
    const checkPause = () => {
      if (keys.current['Escape']) {
        setIsPaused(prev => !prev);
        keys.current['Escape'] = false;
      }
    };
    const timer = setInterval(checkPause, 100);
    return () => clearInterval(timer);
  }, []);

  // ゲームループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      // ポーズ中は更新しない
      if (!isPaused) {
        updateGame(gameState.current, { keys: keys.current, mouse: mouse.current }, isPaused);
      }

      // 描画はポーズ中でも行う
      renderGame(ctx, gameState.current, { mouse: mouse.current });

      // ポーズオーバーレイ
      if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
      }

      // UI同期
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
            locationName: loc.type === 'world' ? 'Overworld' : `Dungeon B${loc.level}`
        }));
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]); 

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
      
      {/* 場所名表示 */}
      <div className="absolute top-20 left-4 text-gray-400 font-serif text-sm pointer-events-none select-none">
        Location: <span className="text-[#d4af37] font-bold">{uiState.locationName}</span>
      </div>

      {/* 設定ボタン */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => {
            setIsPaused(true);
            setShowSettings(true);
          }}
          className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* 設定モーダル (省略なし) */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-8 rounded-lg w-96 text-[#d4af37] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif">Game Settings</h2>
              <button onClick={() => setShowSettings(false)} className="hover:text-white"><X /></button>
            </div>

            <div className="space-y-6">
              {/* Volume */}
              <div>
                <label className="block mb-2 font-bold">Volume</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.masterVolume}
                  onChange={(e) => setSettings({...settings, masterVolume: parseFloat(e.target.value)})}
                  className="w-full accent-[#d4af37]"
                />
              </div>

              {/* Game Speed */}
              <div>
                <label className="block mb-2 font-bold">Game Speed: {settings.gameSpeed}x</label>
                <div className="flex gap-2">
                  {[1.0, 1.5, 2.0].map(s => (
                    <button
                      key={s}
                      onClick={() => setSettings({...settings, gameSpeed: s})}
                      className={`flex-1 py-1 border rounded ${settings.gameSpeed === s ? 'bg-[#5d4037] text-white' : 'border-[#5d4037] hover:bg-[#3e2723]'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block mb-2 font-bold">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'normal', 'hard', 'expert'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setSettings({...settings, difficulty: d})}
                      className={`py-1 border rounded capitalize ${settings.difficulty === d ? 'bg-[#8b0000] text-white border-red-900' : 'border-[#5d4037] hover:bg-[#3e2723]'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {settings.difficulty === 'easy' && 'Enemies are weaker (0.8x stats).'}
                  {settings.difficulty === 'normal' && 'Standard experience.'}
                  {settings.difficulty === 'hard' && 'Enemies are tougher (1.3x stats).'}
                  {settings.difficulty === 'expert' && 'Extremely hard (1.8x stats), but rare drops are doubled!'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                setShowSettings(false);
                setIsPaused(false);
              }}
              className="w-full mt-8 py-3 bg-[#8b0000] hover:bg-red-900 text-white font-bold rounded border border-red-950 transition-colors"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}

      <div 
        className="relative shadow-2xl overflow-hidden rounded-lg border-4 transition-colors duration-300 outline-none"
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
          className="block bg-black cursor-crosshair outline-none"
          tabIndex={0}
          {...handlers}
          onClick={(e) => {
            handlers.onMouseDown(e);
            e.currentTarget.focus();
          }}
        />
      </div>
    </div>
  );
};
