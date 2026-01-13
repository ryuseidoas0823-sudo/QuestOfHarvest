import React, { useEffect, useState } from 'react';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isOffline, appId, initialAuthToken } from './config/firebase';
import { GameScreen } from './features/game/GameScreen';
import { TitleScreen } from './features/title/TitleScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';
import { GameSettings, Difficulty } from './features/game/types'; // 型定義をインポート

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<'title' | 'game'>('title');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSaveData, setHasSaveData] = useState(false);
  
  // 設定画面用ステート
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.5,
    gameSpeed: 1.0,
    difficulty: 'normal'
  });

  useEffect(() => {
    if (isOffline) {
      console.warn("Firebase config missing. Running in offline/demo mode.");
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setIsLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'saveData', 'current');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Save data found!");
            setHasSaveData(true);
            // 保存された設定があれば読み込む（将来的な実装）
          }
        } catch (error) {
          console.error("Failed to check save data:", error);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNewGame = () => {
    console.log("Starting New Game...");
    setGameState('game');
  };

  const handleLoadGame = () => {
    console.log("Loading Game...");
    // TODO: 実際のロード処理の実装 (GameScreenにロードフラグを渡すなど)
    setGameState('game');
  };

  // 設定変更ハンドラ
  const updateSetting = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono animate-pulse">System Initializing...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans select-none text-white relative">
      {gameState === 'title' && (
        <TitleScreen 
          onNewGame={handleNewGame} 
          onLoadGame={handleLoadGame}
          onSettings={() => setShowSettings(true)}
          hasSaveData={hasSaveData} 
        />
      )}
      
      {gameState === 'game' && (
        <GameScreen />
      )}

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-xl w-96 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-slate-200 border-b border-slate-600 pb-4">Settings</h2>
            
            <div className="space-y-6">
              {/* Volume */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Master Volume</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.masterVolume}
                  onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Mute</span><span>50%</span><span>Max</span>
                </div>
              </div>

              {/* Game Speed */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Game Speed</label>
                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                  {[0.5, 1.0, 1.5, 2.0].map(speed => (
                    <button
                      key={speed}
                      onClick={() => updateSetting('gameSpeed', speed)}
                      className={`flex-1 py-1 rounded text-sm transition-colors ${
                        settings.gameSpeed === speed 
                          ? 'bg-yellow-600 text-white font-bold shadow' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      x{speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'normal', 'hard', 'expert'] as Difficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => updateSetting('difficulty', diff)}
                      className={`py-2 rounded border text-sm capitalize transition-all ${
                        settings.difficulty === diff 
                          ? 'bg-red-900/50 border-red-500 text-red-200 font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center h-4">
                  {settings.difficulty === 'easy' && 'Enemies are weaker. Good for story.'}
                  {settings.difficulty === 'normal' && 'Standard experience.'}
                  {settings.difficulty === 'hard' && 'Enemies are tougher. Less drops.'}
                  {settings.difficulty === 'expert' && 'For true heroes only.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors border border-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!user && !isOffline && <AuthOverlay />}
    </div>
  );
}

export default App;
