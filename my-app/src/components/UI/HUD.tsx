import React from 'react';
import { PlayerEntity } from '../../features/game/types';

interface HUDProps {
  player: PlayerEntity;
  floor: number;
  onOpenStatus?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ player, floor, onOpenStatus }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const mpPercent = (player.mp / player.maxMp) * 100;
  const expPercent = (player.exp / player.maxExp) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none">
      
      {/* Top Left: Status Bars */}
      <div className="absolute top-4 left-4 w-64 space-y-2 pointer-events-auto">
        
        {/* HP Bar */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700 shadow-lg">
          <div className="flex justify-between text-xs text-white mb-1 font-mono">
            <span className="font-bold text-green-400">HP</span>
            <span>{Math.floor(player.hp)}/{player.maxHp}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* MP Bar */}
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700 shadow-lg">
          <div className="flex justify-between text-xs text-white mb-1 font-mono">
            <span className="font-bold text-blue-400">MP</span>
            <span>{Math.floor(player.mp)}/{player.maxMp}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
              style={{ width: `${mpPercent}%` }}
            />
          </div>
        </div>

        {/* Level Info */}
        <div className="flex items-center gap-2 px-1">
          <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-700 text-yellow-400 font-bold text-sm shadow">
            Lv.{player.level}
          </div>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Left: Floor Info */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-white/80 font-mono text-sm">
          Floor: <span className="text-white font-bold">B{floor}</span>
        </div>
      </div>

      {/* Bottom Right: Menu Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
        <button 
          onClick={onOpenStatus}
          className="bg-slate-800/90 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
          title="Open Status Menu"
        >
          <span className="text-lg">📜</span>
          <span className="hidden sm:inline text-sm font-bold tracking-wide">STATUS</span>
        </button>
      </div>

    </div>
  );
};
