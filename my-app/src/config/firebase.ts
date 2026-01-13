import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// グローバル変数の型定義
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// 設定の取得（グローバル変数 または Windowオブジェクトから）
const getFirebaseConfig = () => {
  try {
    // 1. グローバル変数としてのチェック (declare constで宣言されている場合)
    // @ts-ignore
    if (typeof __firebase_config !== 'undefined') {
      // @ts-ignore
      return JSON.parse(__firebase_config);
    }
    // 2. Windowオブジェクトからのチェック
    if (typeof window !== 'undefined' && window.__firebase_config) {
      return JSON.parse(window.__firebase_config);
    }
  } catch (e) {
    console.error("Config parse error", e);
  }
  return null;
};

const config = getFirebaseConfig();
const isOffline = !config; // 設定がない場合はオフラインモード

// ダミー設定（オフラインモード用、クラッシュ防止）
const appConfig = config || { 
  apiKey: "dummy-api-key", 
  authDomain: "dummy.firebaseapp.com", 
  projectId: "dummy-project" 
};

// アプリの初期化（シングルトンパターン）
const app = getApps().length === 0 ? initializeApp(appConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// その他のグローバル値
// @ts-ignore
const appId = (typeof __app_id !== 'undefined' ? __app_id : (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id'));
// @ts-ignore
const initialAuthToken = (typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : (typeof window !== 'undefined' && window.__initial_auth_token : undefined));

export { app, auth, db, isOffline, appId, initialAuthToken };
