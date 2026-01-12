import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GameScreen } from './features/game/GameScreen';
import { TitleScreen } from './features/title/TitleScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';

// Global variables provided by the environment
declare global {
  interface Window {
    __firebase_config: string;
    __app_id: string;
    __initial_auth_token: string | undefined;
  }
}

// Safely access global variables
const firebaseConfigStr = typeof window !== 'undefined' ? window.__firebase_config : '{}';
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
const initialAuthToken = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;

// Firebase Init
// Ensure config is valid JSON before parsing to avoid crashes
let firebaseConfig = {};
try {
  firebaseConfig = JSON.parse(firebaseConfigStr);
} catch (e) {
  console.error("Failed to parse firebase config", e);
}

// Initialize Firebase only if config is valid (has apiKey)
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : undefined;
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<'title' | 'game'>('title');
  const [isLoading, setIsLoading] = useState(true);

  // Auth & Save Data Check
  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase not initialized");
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
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Check for existing save data
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
    console.log("Starting New Game...");
    setGameState('game');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans select-none">
      {gameState === 'title' && (
        <TitleScreen onStart={handleStartGame} hasSaveData={false} />
      )}
      
      {gameState === 'game' && (
        <GameScreen />
      )}

      {!user && <AuthOverlay />}
    </div>
  );
}

export default App;
