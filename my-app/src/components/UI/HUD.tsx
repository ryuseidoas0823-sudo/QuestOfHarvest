import React from 'react';
import { Skull, Backpack, Sword, Shovel } from 'lucide-react';
import { THEME } from '../../assets/theme';

interface HUDProps {
  hp: number;
  maxHp: number;
  inventoryCount: number;
  enemyCount: number;
  mode: 'combat' | 'build';
  onToggleMode: () => void;
  onSave: () => void;
}

/**
 * ゲーム画面上のUI（ヘッドアップディスプレイ）コンポーネント
 */
export const HUD: React.FC<HUDProps> = ({
  hp,
  maxHp,
  inventoryCount,
  enemyCount,
  mode,
  onToggleMode,
  onSave
}) => {
  return (
    <>
      {/* 上部ステータスバー */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10 select-none">
        <div className="flex gap-4">
          {/* HP Globe (Diablo style) */}
          <div 
            className="relative w-24 h-24 rounded-full border-4 bg-black overflow-hidden shadow-xl"
            style={{ borderColor: THEME.colors.dirt }}
          >
            <div 
              className="absolute bottom-0 w-full bg-red-900 transition-all duration-300 ease-out"
              style={{ height: `${(hp / maxHp) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-red-200 drop-shadow-md">
              {Math.ceil(hp)}
            </div>
          </div>
          
          {/* 情報パネル */}
          <div className="mt-2 space-y-2 text-gray-200">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-gray-700">
              <Skull className="w-4 h-4 text-red-500" />
              <span>Threat: {enemyCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-gray-700">
              <Backpack className="w-4 h-4 text-yellow-600" />
              <span>Gold: {inventoryCount}</span>
            </div>
          </div>
        </div>

        {/* モード切替スイッチ */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="text-sm text-gray-400 mb-1">Current Mode</div>
          <button 
            onClick={onToggleMode}
            className={`flex items-center gap-2 px-4 py-2 rounded border-2 transition-all font-bold shadow-lg ${
              mode === 'combat' 
                ? 'bg-red-900/80 border-red-500 text-red-100' 
                : 'bg-green-900/80 border-green-500 text-green-100'
            }`}
          >
            {mode === 'combat' ? <Sword className="w-5 h-5" /> : <Shovel className="w-5 h-5" />}
            <span className="uppercase tracking-wider">{mode}</span>
          </button>
        </div>
      </div>

      {/* 下部アクションバー */}
      <div className="absolute bottom-0 left-0 w-full flex justify-center pointer-events-none z-10">
        <div className="w-[600px] h-16 bg-[#2d1b15] border-t-4 border-[#5d4037] flex items-center justify-between px-8 rounded-t-lg shadow-2xl pointer-events-auto">
          <div className="flex gap-4">
             {/* ホットキースロット（ダミー） */}
             {[1, 2, 3].map(n => (
               <div key={n} className="w-10 h-10 bg-black border border-[#5d4037] flex items-center justify-center text-gray-600 hover:border-yellow-600 cursor-pointer">
                 {n}
               </div>
             ))}
          </div>
          <button 
            onClick={onSave}
            className="px-6 py-2 bg-blue-900/40 border border-blue-500 text-blue-200 rounded hover:bg-blue-800/60 transition-colors"
          >
            Save Progress
          </button>
        </div>
      </div>
    </>
  );
};
