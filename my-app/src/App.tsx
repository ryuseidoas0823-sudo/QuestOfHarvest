import React, { useEffect, useState } from 'react';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isOffline, appId, initialAuthToken } from './config/firebase'; // configからインポート
import { GameScreen } from './features/game/GameScreen';
import { TitleScreen } from './features/title/TitleScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<'title' | 'game'>('title');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // オフラインモードの場合は認証スキップ
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
        // エラーでもゲームは開始できるようにする
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
          }
        } catch (error) {
          console.error("Failed to check save data:", error);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartGame = () => {
    setGameState('game');
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
    <div className="w-full h-screen bg-black overflow-hidden font-sans select-none text-white">
      {gameState === 'title' && (
        <TitleScreen onStart={handleStartGame} hasSaveData={false} />
      )}
      
      {gameState === 'game' && (
        <GameScreen />
      )}

      {/* ユーザーがいなくて、かつオフラインモードでない場合のみオーバーレイを表示 */}
      {!user && !isOffline && <AuthOverlay />}
    </div>
  );
}

export default App;
