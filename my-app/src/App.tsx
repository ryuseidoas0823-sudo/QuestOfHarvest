import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, APP_ID } from './config/firebase';

// Components
import { GameScreen } from './features/game/GameScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';
import { TitleScreen } from './features/title/TitleScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 画面遷移管理: 'auth' -> 'title' -> 'game'
  const [screen, setScreen] = useState<'auth' | 'title' | 'game'>('auth');
  const [saveData, setSaveData] = useState<any>(null); // ロードデータ
  const [hasSave, setHasSave] = useState(false);

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
        // セーブデータの存在確認（ロードはまだしない）
        try {
          const docRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'saveData');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setHasSave(true);
            console.log("Save data found.");
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
        setSaveData(docSnap.data());
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

  const handleSettings = () => {
    alert("Global Settings are not implemented yet. Please use in-game settings.");
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
            onSettings={handleSettings}
            hasSaveData={hasSave}
          />
        )}

        {/* ゲーム画面 */}
        {screen === 'game' && user && (
          <GameScreen user={user} initialData={saveData} />
        )}
      </main>
    </div>
  );
}
