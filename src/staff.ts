import type { Club, World } from './engine';

export type ScoutingRegion = 'Brasil' | 'América do Sul' | 'Europa' | 'África' | 'América do Norte';

export type Scout = {
  id: string;
  clubId: string;
  name: string;
  age: number;
  judgingAbility: number;
  judgingPotential: number;
  adaptability: number;
  preferredRegion: ScoutingRegion;
  reputation: number;
};

export type StaffState = {
  scoutsByClub: Map<string, Scout[]>;
  regionalKnowledge: Map<string, Map<ScoutingRegion, number>>;
};

const stateByWorld = new WeakMap<World, StaffState>();
const regions: ScoutingRegion[] = ['Brasil','América do Sul','Europa','África','América do Norte'];
const firstNames = ['Alex','Bruno','Carlos','Diego','Edu','Fernando','Gustavo','Hugo','Ivan','Jorge','Leandro','Marcelo','Nando','Paulo','Rui','Sérgio'];
const lastNames = ['Azevedo','Barros','Cunha','Diniz','Farias','Lemos','Moraes','Nunes','Prado','Ribeiro','Salles','Torres','Viana'];
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

function hash(text:string): number {
  let h=2166136261;
  for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return Math.abs(h>>>0);
}
function pseudo(seed:number,offset:number):number{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x);}

function scoutCount(club:Club): number {
  return club.reputation >= 82 ? 4 : club.reputation >= 74 ? 3 : club.reputation >= 67 ? 2 : 2;
}

function createScout(club:Club,index:number):Scout{
  const seed=hash(`${club.id}-scout-${index}`);
  const base=43+club.reputation*.42;
  const preferred=index===0?'Brasil':regions[Math.floor(pseudo(seed,7)*regions.length)];
  return {
    id:`${club.id}-scout-${index+1}`,
    clubId:club.id,
    name:`${firstNames[Math.floor(pseudo(seed,1)*firstNames.length)]} ${lastNames[Math.floor(pseudo(seed,2)*lastNames.length)]}`,
    age:30+Math.floor(pseudo(seed,3)*30),
    judgingAbility:Math.round(clamp(base+(pseudo(seed,4)-.5)*18,42,95)),
    judgingPotential:Math.round(clamp(base+(pseudo(seed,5)-.5)*20,40,95)),
    adaptability:Math.round(clamp(45+club.reputation*.35+(pseudo(seed,6)-.5)*24,38,94)),
    preferredRegion:preferred,
    reputation:Math.round(clamp(35+club.reputation*.45+(pseudo(seed,8)-.5)*18,30,92)),
  };
}

function initialRegionalKnowledge(club:Club):Map<ScoutingRegion,number>{
  const map=new Map<ScoutingRegion,number>();
  for(const region of regions){
    const base=region==='Brasil'?82:region==='América do Sul'?42:20;
    map.set(region,Math.round(clamp(base+(club.reputation-65)*.35,8,95)));
  }
  return map;
}

export function staffState(world:World):StaffState{
  let state=stateByWorld.get(world);
  if(!state){state={scoutsByClub:new Map(),regionalKnowledge:new Map()};stateByWorld.set(world,state);}
  for(const club of world.clubs){
    if(!state.scoutsByClub.has(club.id)) state.scoutsByClub.set(club.id,Array.from({length:scoutCount(club)},(_,i)=>createScout(club,i)));
    if(!state.regionalKnowledge.has(club.id)) state.regionalKnowledge.set(club.id,initialRegionalKnowledge(club));
  }
  return state;
}

export function clubScouts(world:World,clubId:string):Scout[]{
  return staffState(world).scoutsByClub.get(clubId)??[];
}

export function scoutById(world:World,scoutId:string):Scout|undefined{
  for(const scouts of staffState(world).scoutsByClub.values()){
    const scout=scouts.find(s=>s.id===scoutId); if(scout)return scout;
  }
  return undefined;
}

export function regionalKnowledge(world:World,clubId:string,region:ScoutingRegion):number{
  return staffState(world).regionalKnowledge.get(clubId)?.get(region)??0;
}

export function improveRegionalKnowledge(world:World,clubId:string,region:ScoutingRegion,amount:number):void{
  const map=staffState(world).regionalKnowledge.get(clubId)!;
  map.set(region,Math.round(clamp((map.get(region)??0)+amount,0,100)));
}

export function decayRegionalKnowledge(world:World):void{
  const state=staffState(world);
  for(const map of state.regionalKnowledge.values()){
    for(const region of regions){
      const value=map.get(region)??0;
      const floor=region==='Brasil'?58:6;
      map.set(region,Math.round(Math.max(floor,value-(region==='Brasil'?1:3))));
    }
  }
}

export function playerOriginRegion(playerId:string):ScoutingRegion{
  const seed=hash(playerId);
  const r=pseudo(seed,21);
  if(r<.58)return 'Brasil';
  if(r<.76)return 'América do Sul';
  if(r<.88)return 'Europa';
  if(r<.95)return 'África';
  return 'América do Norte';
}

export function staffSummary(world:World,clubId:string){
  const scouts=clubScouts(world,clubId);
  const avg=(key:keyof Pick<Scout,'judgingAbility'|'judgingPotential'|'adaptability'>)=> scouts.length?scouts.reduce((s,x)=>s+x[key],0)/scouts.length:0;
  return {
    scouts,
    judgingAbility:Math.round(avg('judgingAbility')),
    judgingPotential:Math.round(avg('judgingPotential')),
    adaptability:Math.round(avg('adaptability')),
    regionalKnowledge:Object.fromEntries(regions.map(r=>[r,regionalKnowledge(world,clubId,r)])) as Record<ScoutingRegion,number>,
  };
}

export function scoutingRegions():ScoutingRegion[]{return [...regions];}
