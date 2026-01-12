import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '../../assets/constants';
import { useGameInput } from '../../hooks/useGameInput';
import { GameState } from './types';
import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { AuthOverlay } from '../auth/AuthOverlay';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPaused: false,
    gameTime: 0,
    camera: { x: 0, y: 0 },
    companions: [],
    particles: []
  });
  const [floor, setFloor] = useState(1);
  const [showStatus, setShowStatus] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const renderer = new Renderer(ctx);
    const gameLoop = new GameLoop(
      (newState) => setGameState(prev => ({ ...prev, ...newState })),
      (newFloor) => setFloor(newFloor)
    );

    const loopId = requestAnimationFrame(function loop(time) {
      if (!gameState.isPaused) {
        gameLoop.update(time);
        renderer.render(gameLoop.getState());
      }
      requestAnimationFrame(loop);
    });

    const handleResize = () => {
      if (canvasRef.current) {
        // Optional: Resize logic
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(loopId);
      window.removeEventListener('resize', handleResize);
      gameLoop.cleanup();
    };
  }, []);

  useGameInput((action) => {
    if (gameState.isPaused && action !== 'MENU') return;
    
    if (action === 'MENU') {
      setShowStatus(prev => !prev);
    }
  });

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
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

      {gameState.player && (
        <>
          <HUD 
            player={gameState.player} 
            floor={floor}
            onOpenStatus={() => setShowStatus(true)}
          />
          
          {showStatus && (
            <StatusMenu 
              player={gameState.player}
              companions={gameState.companions}
              onClose={() => setShowStatus(false)}
            />
          )}
        </>
      )}

      {gameState.dialogue && (
        <div className="absolute inset-x-0 bottom-0 p-4 bg-slate-900/90 border-t-2 border-slate-600 text-white min-h-[150px] animate-slide-up z-50">
          <div className="max-w-4xl mx-auto flex gap-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full border-2 border-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-500 mb-1">{gameState.dialogue.name}</h3>
              <p className="text-lg leading-relaxed">{gameState.dialogue.text}</p>
              <div className="mt-2 text-sm text-gray-400">Press [Space] or Click to continue</div>
            </div>
          </div>
        </div>
      )}

      {!user && <AuthOverlay />}

    </div>
  );
};
