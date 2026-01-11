import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthOverlayProps {
  user: User | null;
  loading: boolean;
  error?: string | null;
}

/**
 * 認証状態に応じてローディング画面やログインプロンプトを表示するオーバーレイ
 */
export const AuthOverlay: React.FC<AuthOverlayProps> = ({ user, loading, error }) => {
  // ログイン済みなら何も表示しない
  if (user && !loading && !error) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 select-none">
      <div className="text-center animate-in fade-in duration-500 px-4 max-w-md">
        {error ? (
          <>
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 tracking-widest mb-2">CONNECTION FAILED</h2>
            <p className="text-red-300 text-sm mb-4 font-mono break-words bg-black/50 p-2 rounded border border-red-900/50">
              {error}
            </p>
            <p className="text-gray-400 text-xs">
              Check your Firebase Console &gt; Authentication &gt; Sign-in method &gt; Anonymous setting.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-700 text-red-100 rounded transition-colors"
            >
              Retry Connection
            </button>
          </>
        ) : (
          <>
            <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-red-500 tracking-widest">
              {loading ? 'CONNECTING TO REALM...' : 'AUTHENTICATION REQUIRED'}
            </h2>
            {!loading && !user && (
              <p className="text-gray-400 mt-2 text-sm">Please refresh to reconnect.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
