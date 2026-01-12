import React, { useState } from 'react';
import { PlayerEntity, CompanionEntity } from '../../features/game/types';

interface StatusMenuProps {
  player: PlayerEntity;
  companions: CompanionEntity[];
  onClose: () => void;
}

export const StatusMenu: React.FC<StatusMenuProps> = ({ player, companions, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'player' | number>('player');

  const currentEntity = selectedTab === 'player' ? player : companions[selectedTab];
  const isPlayer = currentEntity.type === 'player';

  const currentExp = isPlayer ? (currentEntity as PlayerEntity).xp : 0;
  const nextExp = isPlayer ? (currentEntity as PlayerEntity).nextLevelXp : 1;
  const expPercent = Math.min(100, (currentExp / nextExp) * 100);

  const mainHand = isPlayer ? (currentEntity as PlayerEntity).equipment.mainHand : null;
  const weaponName = mainHand ? mainHand.name : (isPlayer ? 'Empty' : 'Default Weapon');
  const armorName = 'Clothes'; 

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm select-none">
      <div className="bg-slate-800 w-[700px] max-w-[95%] h-[550px] max-h-[90%] rounded-xl shadow-2xl flex flex-col border border-slate-600 overflow-hidden text-white">
        
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#d4af37] font-serif">
            <span className="text-2xl">📜</span> Status
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          <div className="w-48 bg-slate-900/50 border-r border-slate-700 overflow-y-auto">
            <button
              onClick={() => setSelectedTab('player')}
              className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${
                selectedTab === 'player' 
                  ? 'bg-white/10 border-yellow-500' 
                  : 'border-transparent text-gray-400'
              }`}
            >
              <span className="font-bold truncate text-sm">{player.id === 'player_1' ? 'Hero' : 'Player'}</span>
              <span className="text-xs text-yellow-500">Lv.{player.level} Hero</span>
            </button>

            {companions.map((comp, idx) => (
              <button
                key={comp.id}
                onClick={() => setSelectedTab(idx)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${
                  selectedTab === idx 
                    ? 'bg-white/10 border-blue-500' 
                    : 'border-transparent text-gray-400'
                }`}
              >
                <span className="font-bold truncate text-sm">{comp.job}</span>
                <span className="text-xs text-blue-400">Lv.{comp.level} Companion</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-800">
            <div className="flex items-start gap-6 mb-8">
              <div 
                className="w-20 h-20 rounded-lg shadow-inner flex items-center justify-center text-4xl border-2 border-white/20 relative overflow-hidden"
                style={{ backgroundColor: currentEntity.color || '#666' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                {selectedTab === 'player' ? '🧙‍♂️' : '🛡️'}
              </div>
              
              <div>
                <h3 className="text-3xl font-bold mb-1 font-serif text-[#d4af37]">
                  {selectedTab === 'player' ? 'Hero' : (currentEntity as CompanionEntity).job}
                </h3>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-700 border border-slate-600 text-xs">
                      Lv. <span className="text-yellow-400 font-bold">{currentEntity.level}</span>
                    </span>
                    {!isPlayer && (
                      <span className="text-blue-300 text-xs">{(currentEntity as CompanionEntity).job}</span>
                    )}
                  </div>
                  {isPlayer && (
                    <span className="text-gray-400 text-xs">
                      Next Lv: {Math.max(0, nextExp - currentExp)} EXP
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <h4 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-700 pb-1 font-bold">Attributes</h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-bold">HP</span>
                      <span className="font-mono text-gray-400">{Math.floor(currentEntity.hp)} / {currentEntity.maxHp}</span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300" 
                        style={{ width: `${(currentEntity.hp / currentEntity.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-bold">MP</span>
                      <span className="font-mono text-gray-400">{Math.floor(currentEntity.mp)} / {currentEntity.maxMp}</span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300" 
                        style={{ width: `${(currentEntity.mp / currentEntity.maxMp) * 100}%` }}
                      />
                    </div>
                  </div>

                  {isPlayer && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 font-bold">EXP</span>
                        <span className="font-mono text-gray-400">{Math.floor(expPercent)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-300" 
                          style={{ width: `${expPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <div className="text-gray-500 text-[10px] uppercase">Attack</div>
                    <div className="text-lg font-mono text-red-300">{currentEntity.attack}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <div className="text-gray-500 text-[10px] uppercase">Defense</div>
                    <div className="text-lg font-mono text-blue-300">{currentEntity.defense}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <div className="text-gray-500 text-[10px] uppercase">Speed</div>
                    <div className="text-lg font-mono text-green-300">{currentEntity.speed.toFixed(1)}</div>
                  </div>
                  {isPlayer && (
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      <div className="text-gray-500 text-[10px] uppercase">Gold</div>
                      <div className="text-lg font-mono text-yellow-300">{(currentEntity as PlayerEntity).gold}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-700 pb-1 font-bold">Equipment</h4>
                
                <div className="space-y-3">
                  <div className="bg-slate-900/40 p-3 rounded-lg flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-help">
                    <div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-xl shadow-inner">
                      ⚔️
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Main Hand</div>
                      <div className={`font-medium truncate ${weaponName !== 'Empty' ? 'text-gray-200' : 'text-gray-600 italic'}`}>
                        {weaponName}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-lg flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-help">
                    <div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-xl shadow-inner">
                      🛡️
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Body</div>
                      <div className={`font-medium truncate ${armorName !== 'None' ? 'text-gray-200' : 'text-gray-600 italic'}`}>
                        {armorName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/20 p-3 rounded-lg flex items-center gap-3 border border-slate-800 opacity-60">
                    <div className="w-10 h-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-xl grayscale opacity-50">
                      💍
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 uppercase tracking-wider">Accessory</div>
                      <div className="text-gray-600 italic text-sm">Locked</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
