// ... existing code ...
import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { AuthOverlay } from '../auth/AuthOverlay';

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ... existing code ...
  const [floor, setFloor] = useState(1);
  const [showStatus, setShowStatus] = useState(false);

  // Game Loop Initialization
  useEffect(() => {
    if (!canvasRef.current) return;
    // ... existing code ...
  }, [gameState.isPaused, floor]);

  // Input Handling
  // ... existing code ...

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.SCREEN_WIDTH}
        height={GAME_CONFIG.SCREEN_HEIGHT}
        className="block"
      />

      {/* UI Overlays */}
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

      {/* Dialog Overlay */}
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

      {/* Auth
