import React from 'react';
export const StatusMenu = ({ player, onClose }: any) => (
  <div className="fixed inset-0 bg-black/80 flex justify-center items-center text-white"><div className="bg-gray-800 p-8"><h2>Status</h2><p>Job: {player.job}</p><button onClick={onClose}>Close</button></div></div>
);
