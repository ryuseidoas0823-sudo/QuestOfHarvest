import React, { useState } from 'react';
import { PlayerEntity, CompanionEntity } from '../../features/game/types';
import { SKILL_DATABASE } from '../../features/game/entities/Player';

interface StatusMenuProps {
  player: PlayerEntity;
  companions: CompanionEntity[];
  onClose: () => void;
  onSetHotbar?: (slotIndex: number, skillId: string | null) => void;
}

export const StatusMenu: React.FC<StatusMenuProps> = ({ player, companions, onClose, onSetHotbar }) => {
  const [selectedTab, setSelectedTab] = useState<'player' | 'skills' | number>('player');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const isSkillTab = selectedTab === 'skills';
  const currentEntity = (selectedTab === 'player' || selectedTab === 'skills') ? player : companions[selectedTab as number];
  const isPlayer = currentEntity.type === 'player';

  const currentExp = isPlayer ? (currentEntity as PlayerEntity).xp : 0;
  const nextExp = isPlayer ? (currentEntity as PlayerEntity).nextLevelXp : 1;
  const expPercent = Math.min(100, (currentExp / nextExp) * 100);

  const mainHand = isPlayer ? (currentEntity as PlayerEntity).equipment.mainHand : null;
  const weaponName = mainHand ? mainHand.name : (isPlayer ? 'Empty' : 'Default Weapon');
  const armorName = 'Clothes'; 

  const handleAssignHotbar = (slotIndex: number) => {
    if (selectedSkillId && onSetHotbar) {
      onSetHotbar(slotIndex, selectedSkillId);
      setSelectedSkillId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm select-none">
      <div className="bg-slate-800 w-[700px] max-w-[95%] h-[550px] max-h-[90%] rounded-xl shadow-2xl flex flex-col border border-slate-600 overflow-hidden text-white">
        
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#d4af37] font-serif">
            <span className="text-2xl">📜</span> {isSkillTab ? 'Skills' : 'Status'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          <div className="w-48 bg-slate-900/50 border-r border-slate-700 overflow-y-auto">
            <button
              onClick={() => setSelectedTab('player')}
              className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === 'player' ? 'bg-white/10 border-yellow-500' : 'border-transparent text-gray-400'}`}
            >
              <span className="font-bold truncate text-sm">{player.id === 'player_1' ? 'Hero' : 'Player'}</span>
              <span className="text-xs text-yellow-500">Lv.{player.level} Status</span>
            </button>

            <button
              onClick={() => setSelectedTab('skills')}
              className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === 'skills' ? 'bg-white/10 border-purple-500' : 'border-transparent text-gray-400'}`}
            >
              <span className="font-bold truncate text-sm">Skills & Hotbar</span>
              <span className="text-xs text-purple-400">Manage Skills</span>
            </button>

            {companions.map((comp, idx) => (
              <button
                key={comp.id}
                onClick={() => setSelectedTab(idx)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === idx ? 'bg-white/10 border-blue-500' : 'border-transparent text-gray-400'}`}
              >
                <span className="font-bold truncate text-sm">{comp.job}</span>
                <span className="text-xs text-blue-400">Lv.{comp.level} Companion</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-800">
            {isSkillTab ? (
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-purple-300 mb-2">Active Skills</h3>
                  <p className="text-xs text-gray-400 mb-4">Click a skill to select, then click a Hotbar slot to assign.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {player.skills.map((s) => {
                      const skillData = SKILL_DATABASE[s.skillId];
                      if (!skillData) return null;
                      const isSelected = selectedSkillId === s.skillId;
                      return (
                        <button
                          key={s.skillId}
                          onClick={() => setSelectedSkillId(isSelected ? null : s.skillId)}
                          className={`p-3 rounded border flex items-center gap-3 transition-all text-left ${isSelected ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-500/50' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}
                        >
                          <div className="text-2xl">{skillData.icon}</div>
                          <div>
                            <div className="font-bold text-sm text-white">{skillData.name}</div>
                            <div className="text-xs text-blue-300">MP: {skillData.mpCost} <span className="text-gray-500">|</span> CD: {skillData.cooldown}s</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-auto border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-bold text-yellow-500 mb-3 uppercase tracking-wider">Hotbar Assignment</h3>
                  <div className="flex gap-4 justify-center">
                    {player.hotbar.map((skillId, index) => {
                      const skill = skillId ? SKILL_DATABASE[skillId] : null;
                      return (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleAssignHotbar(index)}
                            className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl transition-all relative ${selectedSkillId ? 'border-yellow-400 bg-yellow-900/20 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-900'}`}
                          >
                            {skill ? skill.icon : <span className="text-slate-700 text-sm">{index + 1}</span>}
                            {skill && <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[10px] text-gray-400 px-1 rounded border border-slate-700">{index + 1}</div>}
                          </button>
                          {skill && <span className="text-[10px] text-gray-400 truncate w-14 text-center">{skill.name}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {selectedSkillId && <div className="text-center text-yellow-400 text-sm mt-2 animate-bounce">Select a slot above to assign "{SKILL_DATABASE[selectedSkillId].name}"</div>}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-20 h-20 rounded-lg shadow-inner flex items-center justify-center text-4xl border-2 border-white/20 relative overflow-hidden" style={{ backgroundColor: currentEntity.color || '#666' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                    {selectedTab === 'player' ? '🧙‍♂️' : '🛡️'}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-1 font-serif text-[#d4af37]">{selectedTab === 'player' ? 'Hero' : (currentEntity as CompanionEntity).job}</h3>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-700 border border-slate-600 text-xs">Lv. <span className="text-yellow-400 font-bold">{currentEntity.level}</span></span>
                        {!isPlayer && <span className="text-blue-300 text-xs">{(currentEntity as CompanionEntity).job}</span>}
                      </div>
                      {isPlayer && <span className="text-gray-400 text-xs">Next Lv: {Math.max(0, nextExp - currentExp)} EXP</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h4 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-700 pb-1 font-bold">Attributes</h4>
                    <div className="space-y-4">
                      <div><div className="flex justify-between text-xs mb-1"><span className="text-gray-300 font-bold">HP</span><span className="font-mono text-gray-400">{Math.floor(currentEntity.hp)}/{currentEntity.maxHp}</span></div><div className="h-2.5 bg-slate-900 rounded-full border border-slate-700"><div className="h-full bg-red-600" style={{ width: `${(currentEntity.hp / currentEntity.maxHp) * 100}%` }}/></div></div>
                      <div><div className="flex justify-between text-xs mb-1"><span className="text-gray-300 font-bold">MP</span><span className="font-mono text-gray-400">{Math.floor(currentEntity.mp)}/{currentEntity.maxMp}</span></div><div className="h-2.5 bg-slate-900 rounded-full border border-slate-700"><div className="h-full bg-blue-600" style={{ width: `${(currentEntity.mp / currentEntity.maxMp) * 100}%` }}/></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><div className="text-gray-500 text-[10px]">ATK</div><div className="text-lg font-mono text-red-300">{currentEntity.attack}</div></div>
                      <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><div className="text-gray-500 text-[10px]">DEF</div><div className="text-lg font-mono text-blue-300">{currentEntity.defense}</div></div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-700 pb-1 font-bold">Equipment</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-900/40 p-3 rounded-lg flex items-center gap-3 border border-slate-700/50"><div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-xl">⚔️</div><div><div className="text-[10px] text-gray-500">Main Hand</div><div className="font-medium text-gray-200">{weaponName}</div></div></div>
                      <div className="bg-slate-900/40 p-3 rounded-lg flex items-center gap-3 border border-slate-700/50"><div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-xl">🛡️</div><div><div className="text-[10px] text-gray-500">Body</div><div className="font-medium text-gray-200">{armorName}</div></div></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
