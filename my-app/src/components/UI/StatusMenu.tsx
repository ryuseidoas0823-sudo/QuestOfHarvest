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

  const expPercent = Math.min(100, (isPlayer ? (currentEntity as PlayerEntity).xp : 0) / (isPlayer ? (currentEntity as PlayerEntity).nextLevelXp : 1) * 100);
  const mainHand = isPlayer ? (currentEntity as PlayerEntity).equipment.mainHand : null;
  const weaponName = mainHand ? mainHand.name : 'Empty';

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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 bg-slate-900/50 border-r border-slate-700 overflow-y-auto">
            <button onClick={() => setSelectedTab('player')} className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === 'player' ? 'bg-white/10 border-yellow-500' : 'border-transparent text-gray-400'}`}>
              <span className="font-bold truncate text-sm">Hero</span>
              <span className="text-xs text-yellow-500">Lv.{player.level} Status</span>
            </button>
            <button onClick={() => setSelectedTab('skills')} className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === 'skills' ? 'bg-white/10 border-purple-500' : 'border-transparent text-gray-400'}`}>
              <span className="font-bold truncate text-sm">Skills</span>
              <span className="text-xs text-purple-400">Manage Hotbar</span>
            </button>
            {companions.map((comp, idx) => (
              <button key={comp.id} onClick={() => setSelectedTab(idx)} className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 flex flex-col gap-1 ${selectedTab === idx ? 'bg-white/10 border-blue-500' : 'border-transparent text-gray-400'}`}>
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
                  <div className="grid grid-cols-2 gap-3">
                    {player.skills.map((s) => {
                      const skillData = SKILL_DATABASE[s.skillId];
                      if (!skillData) return null;
                      const isSelected = selectedSkillId === s.skillId;
                      return (
                        <button key={s.skillId} onClick={() => setSelectedSkillId(isSelected ? null : s.skillId)} className={`p-3 rounded border flex items-center gap-3 transition-all text-left ${isSelected ? 'bg-purple-900/50 border-purple-400 ring-2' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}>
                          <div className="text-2xl">{skillData.icon}</div>
                          <div><div className="font-bold text-sm">{skillData.name}</div><div className="text-xs text-blue-300">MP: {skillData.mpCost}</div></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-auto border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-bold text-yellow-500 mb-3">HOTBAR ASSIGNMENT</h3>
                  <div className="flex gap-4 justify-center">
                    {player.hotbar.map((skillId, index) => {
                      const skill = skillId ? SKILL_DATABASE[skillId] : null;
                      return (
                        <button key={index} onClick={() => handleAssignHotbar(index)} className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${selectedSkillId ? 'border-yellow-400 bg-yellow-900/20 animate-pulse' : 'border-slate-600 bg-slate-900'}`}>
                          {skill ? skill.icon : <span className="text-slate-700 text-sm">{index + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center text-4xl">{selectedTab === 'player' ? '🧙‍♂️' : '🛡️'}</div>
                  <div>
                    <h3 className="text-3xl font-bold mb-1 text-[#d4af37]">{isPlayer ? 'Hero' : (currentEntity as CompanionEntity).job}</h3>
                    <div className="text-sm text-gray-400">Lv. <span className="text-yellow-400">{currentEntity.level}</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-xs text-gray-500">HP</div><div>{Math.floor(currentEntity.hp)}/{currentEntity.maxHp}</div></div>
                  <div><div className="text-xs text-gray-500">MP</div><div>{Math.floor(currentEntity.mp)}/{currentEntity.maxMp}</div></div>
                  <div><div className="text-xs text-gray-500">ATK</div><div>{currentEntity.attack}</div></div>
                  <div><div className="text-xs text-gray-500">DEF</div><div>{currentEntity.defense}</div></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
