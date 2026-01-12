import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, APP_ID } from './config/firebase';
import { X } from 'lucide-react';

// Components
import { GameScreen } from './features/game/GameScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';
import { TitleScreen } from './features/title/TitleScreen';
import { GameSettings, Difficulty } from './features/game/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 画面遷移管理: 'auth' -> 'title' -> 'game'
  const [screen, setScreen] = useState<'auth' | 'title' | 'game'>('auth');
  const [saveData, setSaveData] = useState<any>(null); // ロードデータ
  const [hasSave, setHasSave] = useState(false);

  // 設定用ステート
  const [showSettings, setShowSettings] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GameSettings>({
    masterVolume: 0.5,
    gameSpeed: 1.0,
    difficulty: 'normal'
  });

  // 1. 認証と初期化
  useEffect(() => {
    const initAuth = async () => {
      try {
        setError(null);
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err: any) {
        console.error("Auth initialization failed:", err);
        setError(err.message || 'Unknown authentication error.');
        setLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // セーブデータの存在確認
        try {
          const docRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'saveData');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setHasSave(true);
            // 設定だけ先に読み込んで反映しておく
            const data = docSnap.data();
            if (data.settings) {
              setGlobalSettings(data.settings);
            }
          }
        } catch (e) {
          console.warn("Failed to check save data:", e);
        }
        setLoading(false);
        setScreen('title'); // タイトル画面へ
      }
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. 画面遷移ハンドラ
  const handleNewGame = () => {
    console.log("Starting New Game...");
    setSaveData(null);
    setScreen('game');
  };

  const handleLoadGame = async () => {
    if (!user) return;
    try {
      setLoading(true);
      console.log("Loading Game Data...");
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSaveData(data);
        if (data.settings) setGlobalSettings(data.settings);
        console.log("Data loaded successfully.");
        setScreen('game');
      } else {
        alert("Save data not found!");
      }
    } catch (e) {
      console.error("Load failed:", e);
      alert("Failed to load save data. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex flex-col text-gray-100 font-serif overflow-hidden">
      {/* 認証・ロード中のオーバーレイ */}
      {(loading || error) && <AuthOverlay user={user} loading={loading} error={error} />}

      {/* メイン画面エリア */}
      <main className="flex-grow relative flex items-center justify-center w-full h-full">
        
        {/* タイトル画面 */}
        {screen === 'title' && !loading && !error && (
          <TitleScreen 
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            onSettings={() => setShowSettings(true)}
            hasSaveData={hasSave}
          />
        )}

        {/* ゲーム画面 */}
        {screen === 'game' && user && (
          <GameScreen 
            user={user} 
            initialData={saveData} 
            initialSettings={globalSettings} 
          />
        )}
      </main>

      {/* グローバル設定モーダル */}
      {showSettings && screen === 'title' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-8 rounded-lg w-96 text-[#d4af37] shadow-2xl relative">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 hover:text-white transition-colors"
            >
              <X />
            </button>
            
            <h2 className="text-2xl font-bold font-serif mb-8 text-center border-b border-[#5d4037] pb-4">
              Game Settings
            </h2>

            <div className="space-y-8">
              {/* Volume */}
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-[#8d6e63]">Volume</label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={globalSettings.masterVolume}
                  onChange={(e) => setGlobalSettings({...globalSettings, masterVolume: parseFloat(e.target.value)})}
                  className="w-full accent-[#d4af37] h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              {/* Game Speed */}
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-[#8d6e63]">Game Speed</label>
                <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-lg">
                  {[1.0, 1.5, 2.0].map(s => (
                    <button
                      key={s}
                      onClick={() => setGlobalSettings({...globalSettings, gameSpeed: s})}
                      className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                        globalSettings.gameSpeed === s 
                          ? 'bg-[#d4af37] text-[#1a1a1a] shadow-lg' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-[#2d2d2d]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-[#8d6e63]">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'normal', 'hard', 'expert'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setGlobalSettings({...globalSettings, difficulty: d})}
                      className={`py-2 border-2 rounded-lg capitalize text-sm font-bold transition-all duration-200 ${
                        globalSettings.difficulty === d 
                          ? 'bg-[#8b0000] text-white border-[#b71c1c] shadow-[0_0_10px_rgba(183,28,28,0.5)]' 
                          : 'border-[#3e2723] bg-[#1a1a1a] text-gray-500 hover:border-[#5d4037] hover:text-gray-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2 min-h-[3em]">
                  {globalSettings.difficulty === 'easy' && 'Enemies have 80% stats. Good for relaxed play.'}
                  {globalSettings.difficulty === 'normal' && 'Standard experience. Balanced challenge.'}
                  {globalSettings.difficulty === 'hard' && 'Enemies have 130% stats. For veterans.'}
                  {globalSettings.difficulty === 'expert' && '180% stats. Rare drop rate doubled. Good luck.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-[#5d4037] hover:bg-[#6d4c41] text-white font-bold rounded shadow-lg transition-colors border border-[#8d6e63]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
