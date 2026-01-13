import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  hasSaveData: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, hasSaveData }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black" />
      
      <div className="z-10 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-700 drop-shadow-lg tracking-wider font-serif">
          Quest of Harvest
        </h1>
        <p className="text-slate-400 text-xl mb-12 tracking-widest uppercase">
          Explore • Craft • Survive
        </p>

        <button 
          onClick={onStart}
          className="group relative px-12 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-yellow-500 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
        >
          <span className="text-2xl font-bold text-white group-hover:text-yellow-400">
            {hasSaveData ? 'Continue Adventure' : 'New Game'}
          </span>
          <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
        </button>
      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-sm">
        v0.1.0 Alpha
      </div>
    </div>
  );
};
