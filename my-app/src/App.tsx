import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, APP_ID, initialAuthToken, isOffline } from './config/firebase';
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
  
  const [screen, setScreen] = useState<'auth' | 'title' | 'game'>('auth');
  const [saveData, setSaveData] = useState<any>(null);
  const [hasSave, setHasSave] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GameSettings>({
    masterVolume: 0.5,
    gameSpeed: 1.0,
    difficulty: 'normal'
  });

  useEffect(() => {
    // オフラインモードなら認証をスキップしてタイトルへ
    if (isOffline) {
      console.log("Running in offline mode.");
      setLoading(false);
      setScreen('title');
      return;
    }

    const initAuth = async () => {
      try {
        setError(null);
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err: any) {
        console.error("Auth initialization failed:", err);
        // 認証失敗時もゲームは遊べるようにする（オフライン扱い）
        setLoading(false);
        setScreen('title');
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'saveData');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setHasSave(true);
            const data = docSnap.data();
            if (data?.settings) {
              setGlobalSettings(data.settings);
            }
          }
        } catch (e) {
          console.warn("Failed to check save data:", e);
        }
        setLoading(false);
        setScreen('title');
      }
    }, (err) => {
      console.error("Auth state change error:", err);
      // エラー時もタイトルへ
      setLoading(false);
      setScreen('title');
    });

    return () => unsubscribe();
  }, []);

  const handleNewGame = () => {
    console.log("Starting New Game...");
    setSaveData(null);
    setScreen('game');
  };

  const handleLoadGame = async () => {
    if (!user) {
      alert("Offline mode: Save data is not available.");
      return;
    }
    try {
      setLoading(true);
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'saveData');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data || !data.player) throw new Error("Save data corrupted.");
        
        setSaveData(data);
        if (data.settings) setGlobalSettings(data.settings);
        setScreen('game');
      } else {
        alert("Save data not found!");
        setHasSave(false);
      }
    } catch (e: any) {
      console.error("Load failed:", e);
      alert("Failed to load save data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex flex-col text-gray-100 font-serif overflow-hidden">
      {(loading) && <AuthOverlay />}

      <main className="flex-grow relative flex items-center justify-center w-full h-full">
        {screen === 'title' && !loading && (
          <TitleScreen 
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            onSettings={() => setShowSettings(true)}
            hasSaveData={hasSave}
          />
        )}

        {screen === 'game' && (
          <GameScreen 
            user={user} 
            initialData={saveData} 
            initialSettings={globalSettings} 
          />
        )}
      </main>

      {showSettings && screen === 'title' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2d1b15] border-2 border-[#5d4037] p-8 rounded-lg w-96 text-[#d4af37] shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold mb-8 text-center border-b border-[#5d4037] pb-4">Settings</h2>
            {/* 簡易設定UI */}
            <div className="space-y-4">
                <p>Volume: {globalSettings.masterVolume}</p>
                <input type="range" min="0" max="1" step="0.1" value={globalSettings.masterVolume} onChange={e=>setGlobalSettings({...globalSettings, masterVolume: parseFloat(e.target.value)})} className="w-full" />
                <p>Speed: x{globalSettings.gameSpeed}</p>
                <button onClick={()=>setGlobalSettings({...globalSettings, gameSpeed: 1.0})} className="bg-[#3e2723] px-2 py-1 mr-2">x1.0</button>
                <button onClick={()=>setGlobalSettings({...globalSettings, gameSpeed: 1.5})} className="bg-[#3e2723] px-2 py-1">x1.5</button>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-8 py-3 bg-[#5d4037] text-white font-bold rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
