import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 【重要】デプロイ環境でのパスずれを防ぐため、相対パスを基本にします
  build: {
    outDir: 'dist',
    sourcemap: true,
    // ビルド時のチャンクサイズ警告を少し緩和（任意）
    chunkSizeWarningLimit: 1000,
  }
})
