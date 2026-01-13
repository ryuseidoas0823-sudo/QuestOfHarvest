import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GameScreen } from './features/game/GameScreen';
import { TitleScreen } from './features/title/TitleScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';

// Global variables provided by the environment
// We declare them here to avoid TypeScript errors when accessing them directly
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

const getFirebaseConfig = () => {
  try {
    // Try accessing global variable directly first
    if (typeof __firebase_config !== 'undefined') {
      return JSON.parse(__firebase_config);
    }
    // Fallback to window property
    if (typeof window !== 'undefined' && window.__firebase_config) {
      return JSON.parse(window.__firebase_config);
    }
  } catch (e) {
    console.error("Config parse error", e);
  }
  return null;
};

// Initialize Firebase
const initFirebase = () => {
  const config = getFirebaseConfig();
  // Use dummy config if real one is missing to prevent "No Firebase App" crash
  const usableConfig = config && Object.keys(config).length > 0 
    ? config 
    : { apiKey: "dummy", authDomain: "dummy", projectId: "dummy" };

  // Prevent multiple initializations
  const app = getApps().length === 0 ? initializeApp(usableConfig) : getApp();
  
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    isDummy: !config
  };
};

const { auth, db, isDummy } = initFirebase();

// Safely retrieve other globals
const appId = typeof __app_id !== 'undefined' ? __app_id : (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id');
const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : (typeof window !== 'undefined' ? window.__initial_auth_token : undefined);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<'title' | 'game'>('title');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDummy) {
      console.warn("Firebase config missing. Running in offline/demo mode.");
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

      {!user && !isDummy && <AuthOverlay />}
    </div>
  );
}

export default App;
