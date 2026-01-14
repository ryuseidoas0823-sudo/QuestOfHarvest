import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// グローバル変数の型定義（Cloudflare/Canvas環境用）
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

// 設定の取得ロジックを強化
const getFirebaseConfig = () => {
  try {
    // 1. グローバル変数 __firebase_config のチェック
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
    // 2. window.__firebase_config のチェック
    if (typeof window !== 'undefined' && window.__firebase_config) {
      return JSON.parse(window.__firebase_config);
    }
    // 3. Vite環境変数 (import.meta.env) のチェック
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }
  } catch (e) {
    console.error("Firebase config parse error:", e);
  }
  return null;
};

// 設定の取得と状態判定
const config = getFirebaseConfig();
// 設定が取得できなかった場合はオフラインモードとする
export const isOffline = !config || !config.apiKey;

// アプリの初期化
// 設定がない場合でも getAuth() 等がクラッシュしないようダミー設定を入れるか、
// あるいは isOffline フラグでガードする前提で null を許容する。
// ここではエラー回避のためダミー設定を使用する。
const activeConfig = config || { apiKey: "dummy", authDomain: "dummy", projectId: "dummy" };

const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// アプリIDとトークンの取得
export const APP_ID = (typeof __app_id !== 'undefined' && __app_id)
  || (typeof window !== 'undefined' && window.__app_id)
  || 'quest-of-harvest';

export const initialAuthToken = (typeof __initial_auth_token !== 'undefined' && __initial_auth_token)
  || (typeof window !== 'undefined' && window.__initial_auth_token);
