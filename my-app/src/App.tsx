import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GameScreen } from './features/game/GameScreen';
import { TitleScreen } from './features/title/TitleScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

const getFirebaseConfig = () => {
  try {
    const configStr = typeof window !== 'undefined' ? window.__firebase_config : undefined;
    return configStr ? JSON.parse(configStr) : {};
  } catch (e) {
    console.error("Config parse error", e);
    return {};
  }
};

const firebaseConfig = getFirebaseConfig();
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : undefined;
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;
const appId = (typeof window !== 'undefined' && window.__app_id) || 'default-app-id';
const initialToken = (typeof window !== 'undefined' && window.__initial_auth_token);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<'title' | 'game'>('title');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      console.warn("Firebase not initialized. Running in offline/demo mode.");
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (initialToken) {
          await signInWithCustomToken(auth, initialToken);
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

      {!user && auth && <AuthOverlay />}
    </div>
  );
}

export default App;
