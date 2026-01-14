import React from 'react';
export const HUD = ({ player, onOpenStatus }: any) => (
  <div className="absolute top-4 left-4 text-white pointer-events-none">
    <div>HP: {player.hp}/{player.maxHp}</div>
    <div className="pointer-events-auto"><button onClick={onOpenStatus} className="bg-blue-600 px-2 rounded">Status</button></div>
  </div>
);
