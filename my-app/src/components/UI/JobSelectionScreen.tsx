import React from 'react';
export const JobSelectionScreen = ({ onSelectJob }: any) => (
  <div className="fixed inset-0 bg-black flex flex-col justify-center items-center text-white gap-4">
    <h1>Select Job</h1>
    <div className="flex gap-2">
      {['Swordsman','Warrior','Archer','Monk','Cleric'].map(j => <button key={j} onClick={()=>onSelectJob(j)} className="bg-blue-600 p-4 rounded">{j}</button>)}
    </div>
  </div>
);
