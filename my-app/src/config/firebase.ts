import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Canvas環境と通常のVite環境の両方に対応できるように設定を取得
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    return JSON.parse((window as any).__firebase_config);
  }
  // 環境変数から取得（Vite用）
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// 必要に応じてエミュレータ接続設定をここに追加
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

// アプリID（Canvas用グローバル変数またはデフォルト）
export const APP_ID = (window as any).__app_id || 'quest-of-harvest';
