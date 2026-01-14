import { GAME_CONFIG } from '../../../assets/constants';
import { Tile, TileType, Chest, NPCEntity, Item, ResourceNode, CraftingRecipe } from '../types';
import { generateRandomItem, generateMaterial } from '../lib/ItemGenerator';
import { generateCompanion } from '../lib/CompanionGenerator';
const initMap = (w:number, h:number, t:TileType, s:boolean):Tile[][] => Array(h).fill(0).map((_,y)=>Array(w).fill(0).map((_,x)=>({x,y,type:t,solid:s})));
export const generateWorldChunk = (wx:number, wy:number) => {
  const { MAP_WIDTH: W, MAP_HEIGHT: H, TILE_SIZE: T } = GAME_CONFIG;
  const map = initMap(W, H, 'grass', false);
  const resources: ResourceNode[] = [];
  // Simple terrain
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    if(x===0||x===W-1||y===0||y===H-1) { map[y][x].type='wall'; map[y][x].solid=true; }
    else if(Math.random()<0.1) {
       resources.push({id:`r_${x}_${y}`, type:'resource', resourceType: Math.random()>0.5?'tree':'rock', x:x*T, y:y*T, width:T, height:T, color: '#888', speed:0, dead:false, hp:50, maxHp:50, tier:1});
    }
  }
  map[Math.floor(H/2)][Math.floor(W/2)].type = 'town_entrance';
  return { map, chests:[], npcs:[], resources, spawnPoint:{x:W/2*T, y:H/2*T} };
};
export const generateTownMap = (lvl:number) => {
  const { MAP_WIDTH: W, MAP_HEIGHT: H, TILE_SIZE: T } = GAME_CONFIG;
  const map = initMap(W, H, 'grass', false);
  const npcs: NPCEntity[] = [];
  const cx=Math.floor(W/2), cy=Math.floor(H/2);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x===0||x===W-1||y===0||y===H-1) { map[y][x].type='wall'; map[y][x].solid=true; }
  map[H-2][cx].type='portal_out'; map[H-2][cx].solid=false;
  npcs.push({id:'smith', type:'npc', role:'blacksmith', name:'Smith', x:(cx+4)*T, y:cy*T, width:24, height:24, color:'#fff', speed:0, dead:false, dialogue:['Hi'], craftingRecipes:[{id:'sw',name:'Sword',category:'weapon',cost:10,description:'Sword',result:{id:'s',name:'Sword',type:'weapon',rarity:'common',level:1,value:10,icon:'⚔️'},materials:[{materialType:'wood',count:1}]}]});
  return { map, chests:[], npcs, resources:[], spawnPoint:{x:cx*T, y:cy*T} };
};
export const generateMineMap = (lvl:number, max:number) => generateWorldChunk(0,0); // Stub
export const generateDungeonMap = (lvl:number, max:number) => generateWorldChunk(0,0); // Stub
