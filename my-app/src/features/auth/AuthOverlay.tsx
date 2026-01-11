import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthOverlayProps {
  user: User | null;
  loading: boolean;
}

/**
 * 認証状態に応じてローディング画面やログインプロンプトを表示するオーバーレイ
 */
export const AuthOverlay: React.FC<AuthOverlayProps> = ({ user, loading }) => {
  // ログイン済みなら何も表示しない
  if (user && !loading) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 select-none">
      <div className="text-center animate-in fade-in duration-500">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-red-500 tracking-widest">
          {loading ? 'CONNECTING TO REALM...' : 'AUTHENTICATION REQUIRED'}
        </h2>
        {!loading && !user && (
          <p className="text-gray-400 mt-2 text-sm">Please refresh to reconnect.</p>
        )}
      </div>
    </div>
  );
};
