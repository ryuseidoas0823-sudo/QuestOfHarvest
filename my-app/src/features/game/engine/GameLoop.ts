import { GAME_CONFIG } from '../../../assets/constants';
import { GameState } from '../types';
import { tryMove } from './Physics';
import { generateEnemy } from '../lib/EnemyGenerator';
export const updateGame = (state: GameState, input: any, isPaused: boolean) => {
  if(isPaused) return;
  const { player, map } = state;
  let dx=0, dy=0, spd=player.speed;
  if(input.keys['w']) dy=-spd; if(input.keys['s']) dy=spd; if(input.keys['a']) dx=-spd; if(input.keys['d']) dx=spd;
  if(dx||dy){ const p=tryMove(player, dx, dy, map); player.x=p.x; player.y=p.y; }
  // Simplified logic
  if(state.enemies.length < 5 && Math.random() < 0.02) state.enemies.push(generateEnemy(Math.random()*800, Math.random()*800, 1));
};
