/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ゲームの世界観に合わせたカスタムカラーを拡張可能
        diablo: {
          red: '#8b0000',
          gold: '#d4af37',
          dark: '#1a1a1a',
          panel: '#2d1b15',
          border: '#5d4037',
        }
      },
      fontFamily: {
        serif: ['"Cinzel"', 'serif'], // 必要に応じてGoogle Fontsなどで読み込む
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
