import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { auth } from './config/firebase';

// Components
import { GameScreen } from './features/game/GameScreen';
import { AuthOverlay } from './features/auth/AuthOverlay';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Canvas環境用のカスタムトークンがあれば使用、なければ匿名ログイン
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex flex-col text-gray-100 font-serif overflow-hidden">
      {/* 認証オーバーレイ (ロード中または未ログイン時に表示) */}
      <AuthOverlay user={user} loading={loading} />

      {/* メインゲーム画面 */}
      <main className="flex-grow relative flex items-center justify-center">
        {user ? (
          <GameScreen user={user} />
        ) : (
          <div className="text-gray-600 text-sm">Initializing Game World...</div>
        )}
      </main>
      
      {/* フッター */}
      <footer className="absolute bottom-1 right-2 text-xs text-gray-600 pointer-events-none z-0">
        v0.2.2-alpha
      </footer>
    </div>
  );
}
