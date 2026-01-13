import React from 'react';
import { Job } from '../../features/game/types';

interface JobSelectionScreenProps {
  onSelectJob: (job: Job) => void;
}

const JOBS: { id: Job; name: string; weapon: string; desc: string; icon: string; color: string }[] = [
  { 
    id: 'Swordsman', 
    name: 'Swordsman', 
    weapon: 'Sword', 
    desc: 'Balanced offense and defense.', 
    icon: '⚔️',
    color: 'from-blue-600 to-blue-400'
  },
  { 
    id: 'Warrior', 
    name: 'Warrior', 
    weapon: 'Axe', 
    desc: 'High HP and powerful attacks.', 
    icon: '🪓',
    color: 'from-red-600 to-red-400'
  },
  { 
    id: 'Archer', 
    name: 'Archer', 
    weapon: 'Dagger', 
    desc: 'Fast and agile. High crit rate.', 
    icon: '🗡️',
    color: 'from-green-600 to-green-400'
  },
  { 
    id: 'Monk', 
    name: 'Monk', 
    weapon: 'Fists', 
    desc: 'Martial artist. Very fast.', 
    icon: '👊',
    color: 'from-orange-600 to-orange-400'
  },
  { 
    id: 'Cleric', 
    name: 'Cleric', 
    weapon: 'Hammer', 
    desc: 'High magic and healing potential.', 
    icon: '🔨',
    color: 'from-yellow-600 to-yellow-400'
  }
];

export const JobSelectionScreen: React.FC<JobSelectionScreenProps> = ({ onSelectJob }) => {
  return (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-wider">
          Choose Your Path
        </h1>
        <p className="text-slate-400 text-center mb-12">
          Select your starting class to begin the adventure.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {JOBS.map((job) => (
            <button
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="group relative bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-white/50 transition-all hover:-translate-y-2 hover:shadow-xl flex flex-col items-center text-center overflow-hidden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-b ${job.color} transition-opacity`} />
              
              <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center text-3xl bg-slate-700 group-hover:bg-slate-600 shadow-inner border-2 border-slate-600 group-hover:border-white/30 transition-colors`}>
                {job.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                {job.name}
              </h3>
              
              <div className="text-xs text-slate-400 mb-3 bg-slate-900/50 px-2 py-1 rounded">
                Weapon: <span className="text-slate-200">{job.weapon}</span>
              </div>
              
              <p className="text-sm text-slate-400 leading-relaxed">
                {job.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
