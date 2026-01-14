import { GAME_CONFIG } from '../../../assets/constants';
import { THEME } from '../../../assets/theme';
import { GameState, Entity, Tile } from '../types';
const VIEW_RADIUS = 12;
const hasLineOfSight = (x0:number, y0:number, x1:number, y1:number, map:Tile[][]) => {
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy;
  while(true){ if(x0===x1&&y0===y1) break; if(map[y0]?.[x0]?.solid) return false; let e2=2*err; if(e2>-dy){err-=dy;x0+=sx;} if(e2<dx){err+=dx;y0+=sy;} }
  return true;
};
export const renderGame = (ctx: CanvasRenderingContext2D, state: GameState, input: any, screenSize?: {width:number, height:number}) => {
  const { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG;
  const W = screenSize ? screenSize.width : ctx.canvas.width;
  const H = screenSize ? screenSize.height : ctx.canvas.height;
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
  if(!state.map.length) return;
  ctx.save();
  const camX = Math.floor(state.camera.x), camY = Math.floor(state.camera.y);
  ctx.translate(-camX, -camY);
  const pTileX = Math.floor((state.player.x+12)/TILE_SIZE), pTileY = Math.floor((state.player.y+12)/TILE_SIZE);
  const sC=Math.floor(camX/TILE_SIZE)-1, eC=sC+Math.ceil(W/TILE_SIZE)+2;
  const sR=Math.floor(camY/TILE_SIZE)-1, eR=sR+Math.ceil(H/TILE_SIZE)+2;
  for(let y=Math.max(0,sR); y<=Math.min(MAP_HEIGHT-1,eR); y++) {
    for(let x=Math.max(0,sC); x<=Math.min(MAP_WIDTH-1,eC); x++) {
      const t = state.map[y][x];
      const dist = Math.sqrt((x-pTileX)**2 + (y-pTileY)**2);
      const vis = dist < VIEW_RADIUS && hasLineOfSight(pTileX, pTileY, x, y, state.map);
      ctx.fillStyle = t.type==='wall'?'#555':t.type==='dirt'?'#654':'#2e7d32';
      ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
      if(!vis) { ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE); }
    }
  }
  [...state.resources, ...state.npcs, ...state.enemies, ...state.party, state.player].forEach(e => {
    if(e.dead) return;
    const ex=Math.floor(e.x/TILE_SIZE), ey=Math.floor(e.y/TILE_SIZE);
    const vis = (e.type==='player') || (Math.sqrt((ex-pTileX)**2+(ey-pTileY)**2)<VIEW_RADIUS && hasLineOfSight(pTileX, pTileY, ex, ey, state.map));
    if(vis) { ctx.fillStyle=e.color; ctx.fillRect(e.x, e.y, e.width, e.height); }
  });
  ctx.restore();
};
