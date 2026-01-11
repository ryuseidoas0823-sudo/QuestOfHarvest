import React, { useRef, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { 
  Sword, 
  Shovel, 
  Save, 
  ShieldAlert, 
  Backpack,
  Skull
} from 'lucide-react';

/**
 * ====================================================================
 * 【仮想アセットファイル】
 * 本来は src/assets/ フォルダに配置され、importして使用するコード群です。
 * Canvas環境での動作を保証するため、同一ファイル内に記述しています。
 * ====================================================================
 */

// --- src/assets/constants.ts ---
const GAME_CONFIG = {
  // マップ設定
  TILE_SIZE: 40,
  MAP_WIDTH: 50,
  MAP_HEIGHT: 50,
  
  // ビューポート（画面サイズ）設定
  VIEWPORT_WIDTH: 800,
  VIEWPORT_HEIGHT: 600,
  
  // ゲームプレイ設定
  PLAYER_SPEED: 3,
  ENEMY_BASE_SPEED: 1,
  ENEMY_SPAWN_RATE: 0.01,
  MAX_ENEMIES: 50,
  
  // インベントリ制限など
  MAX_INVENTORY_SLOTS: 20,
} as const;

// --- src/assets/theme.ts ---
const THEME = {
  colors: {
    ground: '#1a1a1a',      // 背景の暗闇
    grass: '#1e2b1e',       // 暗い草地
    grassHighlight: '#2a3d2a',
    dirt: '#3e2723',        // 土
    wall: '#424242',        // 石壁
    water: '#1a237e',       // 水（追加）
    
    // エンティティ
    player: '#d4af37',      // 真鍮/ゴールド色
    enemy: '#8b0000',       // 血のような赤
    
    // エフェクト
    light: 'rgba(255, 200, 100, 0.1)', // 松明の光
    fog: 'rgba(0, 0, 0, 0.85)',        // 戦場の霧
    blood: '#8b0000',
    magic: '#4169e1',
    crop: '#4caf50',
    
    // UI
    uiBg: 'rgba(20, 10, 10, 0.95)',
    uiBorder: '#5d4037',
    textMain: '#c0c0c0',
    textHighlight: '#d4af37',
  },
  fonts: {
    main: '"Cinzel", serif', // ファンタジー風フォント
  }
} as const;

// --- src/assets/resources.ts ---
const SPRITES = {
  // 実際の実装ではここに画像パスが入りますが、今回はCanvas描画のためプレースホルダーとして定義
  player: { idle: 'hero_idle' },
  terrain: { grass: 'grass_tile' }
} as const;

/**
 * ====================================================================
 * GAME TYPES & INTERFACES
 * ====================================================================
 */

type TileType = 'grass' | 'dirt' | 'wall' | 'water' | 'crop';

interface Tile {
  x: number;
  y: number;
  type: TileType;
  solid: boolean;
  cropGrowth?: number; // 0 to 100
}

interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'player' | 'enemy';
  dead: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface GameState {
  map: Tile[][];
  player: Entity & { stamina: number; inventory: any[] };
  enemies: Entity[];
  particles: Particle[];
  camera: { x: number; y: number };
  mode: 'combat' | 'build';
}

/**
 * ====================================================================
 * GAME LOGIC HELPER FUNCTIONS
 * ====================================================================
 */

// --- Map Generation ---
const generateMap = (): Tile[][] => {
  const map: Tile[][] = [];
  const { MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type: TileType = 'grass';
      let solid = false;

      // Simple Perlin-ish noise simulation
      const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.random() * 0.5;
      
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        type = 'wall';
        solid = true;
      } else if (noise > 1.5) {
        type = 'wall'; // Random ruins
        solid = true;
      } else if (noise < -0.8) {
        type = 'dirt'; // Patches of dirt
      }

      row.push({ x, y, type, solid });
    }
    map.push(row);
  }
  return map;
};

// --- Physics & Collision ---
const checkCollision = (rect1: Entity, rect2: Entity) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

const resolveMapCollision = (entity: Entity, map: Tile[][]) => {
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  
  const corners = [
    { x: entity.x, y: entity.y },
    { x: entity.x + entity.width, y: entity.y },
    { x: entity.x, y: entity.y + entity.height },
    { x: entity.x + entity.width, y: entity.y + entity.height },
  ];

  for (const corner of corners) {
    const tileX = Math.floor(corner.x / TILE_SIZE);
    const tileY = Math.floor(corner.y / TILE_SIZE);

    if (tileY >= 0 && tileY < MAP_HEIGHT && tileX >= 0 && tileX < MAP_WIDTH) {
      if (map[tileY][tileX].solid) {
        return true;
      }
    }
  }
  return false;
};

/**
 * ====================================================================
 * MAIN COMPONENT
 * ====================================================================
 */

// Firebase Setup
const firebaseConfig = JSON.parse(
  typeof window !== 'undefined' && (window as any).__firebase_config 
    ? (window as any).__firebase_config 
    : '{}'
);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = (window as any).__app_id || 'default-app-id';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // React State for UI
  const [uiState, setUiState] = useState({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    mode: 'combat' as 'combat' | 'build',
    inventoryCount: 0,
    enemyCount: 0
  });

  // Mutable Game State
  const gameState = useRef<GameState>({
    map: generateMap(),
    player: {
      id: 'p1',
      x: GAME_CONFIG.TILE_SIZE * 5,
      y: GAME_CONFIG.TILE_SIZE * 5,
      width: 24,
      height: 24,
      color: THEME.colors.player,
      hp: 100,
      maxHp: 100,
      speed: GAME_CONFIG.PLAYER_SPEED,
      type: 'player',
      dead: false,
      stamina: 100,
      inventory: []
    },
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    mode: 'combat'
  });

  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouse = useRef({ x: 0, y: 0, leftDown: false, rightDown: false });

  // --- Auth & Init ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
        await signInWithCustomToken(auth, (window as any).__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    
    // Initial Spawns
    for(let i=0; i<10; i++) spawnEnemy();
    
    return () => unsubscribe();
  }, []);

  const spawnEnemy = () => {
    const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, ENEMY_BASE_SPEED } = GAME_CONFIG;
    const x = Math.random() * (MAP_WIDTH * TILE_SIZE);
    const y = Math.random() * (MAP_HEIGHT * TILE_SIZE);
    
    gameState.current.enemies.push({
      id: `e_${Date.now()}_${Math.random()}`,
      x, y,
      width: 30, height: 30,
      color: THEME.colors.enemy,
      hp: 30, maxHp: 30,
      speed: ENEMY_BASE_SPEED + Math.random(),
      type: 'enemy',
      dead: false
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 1
      });
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;

    const loop = () => {
      update();
      render(ctx);
      animationFrameId = requestAnimationFrame(loop);
    };

    const update = () => {
      const state = gameState.current;
      const player = state.player;

      // 1. Player Movement
      let dx = 0;
      let dy = 0;
      if (keys.current['w'] || keys.current['ArrowUp']) dy = -player.speed;
      if (keys.current['s'] || keys.current['ArrowDown']) dy = player.speed;
      if (keys.current['a'] || keys.current['ArrowLeft']) dx = -player.speed;
      if (keys.current['d'] || keys.current['ArrowRight']) dx = player.speed;

      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * player.speed;
        dy = (dy / length) * player.speed;
      }

      const prevX = player.x;
      const prevY = player.y;
      player.x += dx;
      if (resolveMapCollision(player, state.map)) player.x = prevX;
      player.y += dy;
      if (resolveMapCollision(player, state.map)) player.y = prevY;

      // 2. Camera Follow
      state.camera.x = player.x - VIEWPORT_WIDTH / 2;
      state.camera.y = player.y - VIEWPORT_HEIGHT / 2;
      state.camera.x = Math.max(0, Math.min(state.camera.x, MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH));
      state.camera.y = Math.max(0, Math.min(state.camera.y, MAP_HEIGHT * TILE_SIZE - VIEWPORT_HEIGHT));

      // 3. Enemy Logic
      state.enemies.forEach(enemy => {
        if (enemy.dead) return;
        const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        
        if (dist < 400 && dist > 10) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed;
            enemy.y += Math.sin(angle) * enemy.speed;
        }

        if (checkCollision(player, enemy)) {
            player.hp -= 0.1;
            if (Math.random() > 0.9) createParticles(player.x, player.y, THEME.colors.blood, 1);
        }
      });

      // 4. Interactions
      if (mouse.current.leftDown) {
        const worldMx = mouse.current.x + state.camera.x;
        const worldMy = mouse.current.y + state.camera.y;

        if (state.mode === 'combat') {
             state.enemies.forEach(enemy => {
                 if (enemy.dead) return;
                 const d = Math.sqrt((worldMx - enemy.x)**2 + (worldMy - enemy.y)**2);
                 if (d < 50) {
                     enemy.hp -= 2;
                     createParticles(enemy.x, enemy.y, '#ffffff', 2);
                     createParticles(enemy.x, enemy.y, THEME.colors.blood, 2);
                     if (enemy.hp <= 0) {
                         enemy.dead = true;
                         createParticles(enemy.x, enemy.y, THEME.colors.blood, 10);
                         state.player.inventory.push({ id: 'loot', name: 'Gold' });
                     }
                 }
             });
        } else if (state.mode === 'build') {
             const tx = Math.floor(worldMx / TILE_SIZE);
             const ty = Math.floor(worldMy / TILE_SIZE);
             
             if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                 const tile = state.map[ty][tx];
                 if (tile.type === 'grass') {
                     tile.type = 'dirt';
                     createParticles(worldMx, worldMy, THEME.colors.dirt, 5);
                 } else if (tile.type === 'dirt') {
                     tile.type = 'crop';
                     tile.cropGrowth = 0;
                     createParticles(worldMx, worldMy, THEME.colors.crop, 5);
                 }
             }
        }
      }

      // 5. Cleanup
      state.particles = state.particles.filter(p => p.life > 0);
      state.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
      });

      state.enemies = state.enemies.filter(e => !e.dead);
      if (state.enemies.length < 5 && Math.random() > 0.99) spawnEnemy();

      // Sync UI occasionally
      if (Math.random() > 0.9) {
          setUiState(prev => ({
              ...prev,
              hp: player.hp,
              inventoryCount: player.inventory.length,
              enemyCount: state.enemies.length
          }));
      }
    };

    const render = (ctx: CanvasRenderingContext2D) => {
      const state = gameState.current;
      const { width, height } = canvas;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(-state.camera.x, -state.camera.y);

      // Draw Map
      const startCol = Math.floor(state.camera.x / TILE_SIZE);
      const endCol = startCol + (width / TILE_SIZE) + 1;
      const startRow = Math.floor(state.camera.y / TILE_SIZE);
      const endRow = startRow + (height / TILE_SIZE) + 1;

      for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
          if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            const tile = state.map[y][x];
            
            if (tile.type === 'grass') ctx.fillStyle = THEME.colors.grass;
            if (tile.type === 'dirt') ctx.fillStyle = THEME.colors.dirt;
            if (tile.type === 'wall') ctx.fillStyle = THEME.colors.wall;
            if (tile.type === 'crop') ctx.fillStyle = THEME.colors.dirt;
            
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (tile.type === 'grass') {
                ctx.fillStyle = THEME.colors.grassHighlight;
                ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, 4, 4);
            }
            if (tile.type === 'crop') {
                ctx.fillStyle = THEME.colors.crop;
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + 20, y * TILE_SIZE + 20, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            if (tile.type === 'wall') {
                ctx.strokeStyle = '#222';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }

      // Draw Entities
      const p = state.player;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.shadowBlur = 0;

      state.enemies.forEach(e => {
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = 'black';
          ctx.fillRect(e.x, e.y - 8, e.width, 4);
          ctx.fillStyle = 'red';
          ctx.fillRect(e.x, e.y - 8, e.width * (e.hp / e.maxHp), 4);
      });

      state.particles.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      });

      // Cursor
      if (state.mode === 'build') {
          const mx = Math.floor((mouse.current.x + state.camera.x) / TILE_SIZE) * TILE_SIZE;
          const my = Math.floor((mouse.current.y + state.camera.y) / TILE_SIZE) * TILE_SIZE;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(mx, my, TILE_SIZE, TILE_SIZE);
      } else {
          ctx.strokeStyle = 'red';
          ctx.beginPath();
          ctx.arc(mouse.current.x + state.camera.x, mouse.current.y + state.camera.y, 10, 0, Math.PI * 2);
          ctx.stroke();
      }

      ctx.restore();

      // Lighting Overlay
      const gradient = ctx.createRadialGradient(
          p.x - state.camera.x + p.width/2, 
          p.y - state.camera.y + p.height/2, 
          50, 
          p.x - state.camera.x + p.width/2, 
          p.y - state.camera.y + p.height/2, 
          400
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)'); 
      gradient.addColorStop(1, THEME.colors.fog);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Input & Save ---
  const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.key === 'q') toggleMode();
  };
  const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key] = false;
  
  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
          mouse.current.x = e.clientX - rect.left;
          mouse.current.y = e.clientY - rect.top;
      }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
      if(e.button === 0) mouse.current.leftDown = true;
      if(e.button === 2) mouse.current.rightDown = true;
  };
  const handleMouseUp = () => {
      mouse.current.leftDown = false;
      mouse.current.rightDown = false;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const toggleMode = () => {
      gameState.current.mode = gameState.current.mode === 'combat' ? 'build' : 'combat';
      setUiState(prev => ({ ...prev, mode: gameState.current.mode }));
  };

  const saveGame = async () => {
    if (!user) return;
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saveData'), {
            player: gameState.current.player,
            lastSaved: new Date()
        });
        alert('Game Saved!');
    } catch (e) {
        console.error(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black font-serif text-gray-200 overflow-hidden select-none">
      
      {/* UI: HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
          <div className="flex gap-4">
              {/* HP Globe */}
              <div className="relative w-24 h-24 rounded-full border-4 border-[#3e2723] bg-black overflow-hidden shadow-xl">
                  <div 
                      className="absolute bottom-0 w-full bg-red-900 transition-all duration-300 ease-out"
                      style={{ height: `${(uiState.hp / uiState.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-red-200 drop-shadow-md">
                      {Math.ceil(uiState.hp)}
                  </div>
              </div>
              
              {/* Stats */}
              <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-gray-700">
                      <Skull className="w-4 h-4 text-red-500" />
                      <span>Enemies: {uiState.enemyCount}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-gray-700">
                      <Backpack className="w-4 h-4 text-yellow-600" />
                      <span>Gold: {uiState.inventoryCount}</span>
                  </div>
              </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
              <div className="text-sm text-gray-400 mb-1">Press 'Q' to switch</div>
              <button 
                  onClick={() => {
                      gameState.current.mode = 'combat';
                      setUiState(prev => ({ ...prev, mode: 'combat' }));
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded border-2 transition-all ${uiState.mode === 'combat' ? 'bg-red-900/50 border-red-500 text-red-100' : 'bg-black/50 border-gray-700 text-gray-500'}`}
              >
                  <Sword className="w-5 h-5" />
                  <span>Combat</span>
              </button>
              <button 
                  onClick={() => {
                      gameState.current.mode = 'build';
                      setUiState(prev => ({ ...prev, mode: 'build' }));
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded border-2 transition-all ${uiState.mode === 'build' ? 'bg-green-900/50 border-green-500 text-green-100' : 'bg-black/50 border-gray-700 text-gray-500'}`}
              >
                  <Shovel className="w-5 h-5" />
                  <span>Build/Farm</span>
              </button>
          </div>
      </div>

      {/* Game Canvas */}
      <div className="relative border-4" style={{ borderColor: THEME.colors.uiBorder, backgroundColor: THEME.colors.ground, borderRadius: '8px', overflow: 'hidden' }}>
        <canvas
            ref={canvasRef}
            width={GAME_CONFIG.VIEWPORT_WIDTH}
            height={GAME_CONFIG.VIEWPORT_HEIGHT}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="cursor-crosshair shadow-2xl"
        />
        
        {/* Loading / Auth Overlay */}
        {!user && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-red-500">Connecting to Realm...</h2>
                </div>
            </div>
        )}
      </div>

      {/* Bottom Bar (Diablo Style) */}
      <div className="w-[800px] h-16 bg-[#2d1b15] border-t-4 border-[#5d4037] flex items-center justify-between px-8 mt-[-4px] rounded-b-lg shadow-lg relative z-20">
          <div className="flex gap-4">
              {[1, 2].map(num => (
                  <div key={num} className="w-10 h-10 bg-black border border-[#5d4037] flex items-center justify-center cursor-pointer hover:border-yellow-600">
                      <span className="text-xs text-gray-500">{num}</span>
                  </div>
              ))}
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 flex gap-2">
              <div className="bg-black/80 px-4 py-1 rounded-full border border-gray-700 text-xs text-gray-400">
                  WASD to Move
              </div>
              <div className="bg-black/80 px-4 py-1 rounded-full border border-gray-700 text-xs text-gray-400">
                  Click to Interact
              </div>
          </div>

          <button 
            onClick={saveGame}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-200 rounded border border-blue-800 transition-colors"
          >
              <Save className="w-4 h-4" />
              Save
          </button>
      </div>
    </div>
  );
}
