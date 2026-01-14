import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '../../assets/constants';
import { useGameInput } from '../../hooks/useGameInput';
import { GameState, Job } from './types';
import { renderGame } from './engine/Renderer';
import { updateGame } from './engine/GameLoop';
import { HUD } from '../../components/UI/HUD';
import { StatusMenu } from '../../components/UI/StatusMenu';
import { JobSelectionScreen } from '../../components/UI/JobSelectionScreen'; 
import { CraftingMenu } from '../../components/UI/CraftingMenu';
import { AuthOverlay } from '../auth/AuthOverlay';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isOffline } from '../../config/firebase'; 
import { generateTownMap } from './world/MapGenerator';
import { createPlayer } from './entities/Player';

export const GameScreen: React.FC<any> = ({ initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const [uiState, setUiState] = useState<any>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const { keys, mouse, handlers } = useGameInput();

  useEffect(() => {
    if (!selectedJob || !canvasRef.current) return;
    setLoading(true);
    setTimeout(() => {
      const town = generateTownMap(1);
      const p = createPlayer(selectedJob);
      p.x = town.spawnPoint.x; p.y = town.spawnPoint.y;
      gameStateRef.current = {
        map: town.map, chests: [], npcs: town.npcs, resources: [], enemies: [], droppedItems: [], particles: [],
        player: p, party: [], camera: {x:0,y:0}, mode: 'combat', settings: {masterVolume:0.5, gameSpeed:1, difficulty:'normal'},
        location: {type:'town', level:0, worldX:0, worldY:0}, isPaused: false, gameTime: 0
      };
      setLoading(false);
      loop();
    }, 100);
  }, [selectedJob]);

  const loop = () => {
    if(!gameStateRef.current || !canvasRef.current) return;
    updateGame(gameStateRef.current, {keys:keys.current, mouse:mouse.current}, false);
    renderGame(canvasRef.current.getContext('2d')!, gameStateRef.current, {mouse:mouse.current}, {width:canvasRef.current.width, height:canvasRef.current.height});
    setUiState({...gameStateRef.current.player});
    requestAnimationFrame(loop);
  };

  return (
    <div className="w-full h-full bg-black relative" {...handlers} tabIndex={0}>
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full" />
      {!selectedJob && <JobSelectionScreen onSelectJob={setSelectedJob} />}
      {uiState && <HUD player={uiState} onOpenStatus={()=>setShowStatus(true)} />}
      {showStatus && <StatusMenu player={uiState} onClose={()=>setShowStatus(false)} />}
    </div>
  );
};
