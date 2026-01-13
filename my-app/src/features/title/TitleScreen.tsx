import React from 'react';

interface TitleScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void; // 追加
  onSettings: () => void; // 追加
  hasSaveData: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onNewGame, onLoadGame, onSettings, hasSaveData }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white relative overflow-hidden font-serif">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black animate-pulse" />
      
      <div className="z-10 text-center flex flex-col items-center gap-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wider">
            Quest of Harvest
          </h1>
          <p className="text-slate-400 text-xl tracking-[0.3em] uppercase opacity-80">
            Explore • Craft • Survive
          </p>
        </div>

        <div className="flex flex-col gap-4 w-64">
          {/* New Game */}
          <button 
            onClick={onNewGame}
            className="group relative px-8 py-3 bg-slate-800/80 hover:bg-yellow-900/30 border-2 border-slate-600 hover:border-yellow-500 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm"
          >
            <span className="text-xl font-bold text-slate-200 group-hover:text-yellow-400 tracking-wide">
              New Game
            </span>
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          </button>

          {/* Continue (Load Game) */}
          <button 
            onClick={onLoadGame}
            disabled={!hasSaveData}
            className={`group relative px-8 py-3 border-2 rounded-lg transition-all duration-300 transform shadow-lg backdrop-blur-sm ${
              hasSaveData 
                ? 'bg-slate-800/80 hover:bg-blue-900/30 border-slate-600 hover:border-blue-400 hover:scale-105 cursor-pointer' 
                : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className={`text-xl font-bold tracking-wide ${hasSaveData ? 'text-slate-200 group-hover:text-blue-300' : ''}`}>
              Continue
            </span>
          </button>

          {/* Settings */}
          <button 
            onClick={onSettings}
            className="group relative px-8 py-3 bg-slate-800/80 hover:bg-slate-700/50 border-2 border-slate-600 hover:border-slate-400 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm"
          >
            <span className="text-xl font-bold text-slate-300 group-hover:text-white tracking-wide">
              Settings
            </span>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-xs font-mono">
        v0.2.0 Beta | Created with React & Firebase
      </div>
    </div>
  );
};
