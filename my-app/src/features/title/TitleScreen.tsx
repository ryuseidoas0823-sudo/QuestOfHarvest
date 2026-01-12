import React from 'react';
import { Play, Save, Settings, Info } from 'lucide-react';

interface TitleScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
  hasSaveData: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ 
  onNewGame, 
  onLoadGame, 
  onSettings,
  hasSaveData 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-[#d4af37] font-serif relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3e2723] via-[#1a1a1a] to-black" />
      
      <div className="relative z-10 text-center space-y-12 animate-in fade-in duration-1000">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-sm filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            QUEST OF HARVEST
          </h1>
          <p className="text-xl text-gray-400 tracking-widest uppercase">A Roguelike Farming RPG</p>
        </div>

        <div className="flex flex-col gap-4 w-72 mx-auto">
          <button
            onClick={onNewGame}
            className="group relative px-8 py-4 bg-[#2d1b15] border-2 border-[#5d4037] hover:border-[#ffd700] hover:bg-[#3e2723] transition-all duration-200 shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Play className="w-5 h-5 group-hover:fill-[#ffd700] transition-colors" />
              <span className="font-bold tracking-wide">NEW GAME</span>
            </div>
          </button>

          <button
            onClick={onLoadGame}
            disabled={!hasSaveData}
            className={`group relative px-8 py-4 bg-[#2d1b15] border-2 shadow-lg transition-all duration-200 ${
              hasSaveData 
                ? 'border-[#5d4037] hover:border-[#ffd700] hover:bg-[#3e2723] cursor-pointer' 
                : 'border-[#3e2723] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Save className="w-5 h-5" />
              <span className="font-bold tracking-wide">CONTINUE</span>
            </div>
          </button>

          <button
            onClick={onSettings}
            className="group relative px-8 py-4 bg-[#2d1b15] border-2 border-[#5d4037] hover:border-[#ffd700] hover:bg-[#3e2723] transition-all duration-200 shadow-lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-bold tracking-wide">SETTINGS</span>
            </div>
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mt-12">
          <Info size={12} />
          <span>v0.3.0-alpha | If the screen is black, check console (F12)</span>
        </div>
      </div>
    </div>
  );
};
