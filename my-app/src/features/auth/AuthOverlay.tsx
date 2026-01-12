import React from 'react';

export const AuthOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
      <div className="text-white text-xl font-mono animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Connecting to World...</span>
      </div>
    </div>
  );
};
