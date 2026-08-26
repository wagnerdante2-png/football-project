import type { Club, Player, PlayerAttributes, Position, World } from './engine';
import { playerMarketValue } from './economy';
import { clubScouts, decayRegionalKnowledge, improveRegionalKnowledge, playerOriginRegion, regionalKnowledge, scoutById, staffSummary, type ScoutingRegion } from './staff';
import { worldPlayerById, worldPlayerClub, worldPlayerPool } from './world-player-pool-v1';

export type ScoutProfile = {
  clubId: string;
  judgingAbility: number;
  judgingPotential: number;
  adaptability: number;
  capacity: number;
};
export type KnowledgeLevel = 0|1|2|3|4|5;
export type PlayerKnowledge = { observerClubId:string; playerId:string; level:KnowledgeLevel; progress:number; lastSeenSeason:number; lastSeenRound:number; };
export type ScoutAssignment = { observerClubId:string; playerId:string; scoutId:string; region:ScoutingRegion; startedSeason:number; startedRound:number; active:boolean; };
export type AttributeEstimate = { min:number; max:number };
export type ScoutingReport = {
  playerId:string; playerName:string; clubId:string; position:Position; age:number; originRegion:ScoutingRegion;
  knowledge:KnowledgeLevel; confidence:number; currentAbility:AttributeEstimate; potentialAbility:AttributeEstimate; marketValue:AttributeEstimate;
  attributes:Partial<Record<keyof PlayerAttributes,AttributeEstimate>>; recommendation:'avoid'|'monitor'|'consider'|'strong'|'elite'; summary:string;
};
export type ScoutingState = { profiles:Map<string,ScoutProfile>; knowledge:Map<string,PlayerKnowledge>; assignments:ScoutAssignment[]; shortlists:Map<string,Set<string>>; };

const stateByWorld=new WeakMap<World,ScoutingState>();
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd=()=>Math.random();
const key=(clubId:string,playerId:string)=>`${clubId}::${playerId}`;

export function scoutingState(world:World):ScoutingState{
  let state=stateByWorld.get(world);
  if(!state){state={profiles:new Map(),knowledge:new Map(),assignments:[],shortlists:new Map()};stateByWorld.set(world,state);}
  for(const club of world.clubs){
    const summary=staffSummary(world,club.id);
    state.profiles.set(club.id,{clubId:club.id,judgingAbility:summary.judgingAbility,judgingPotential:summary.judgingPotential,adaptability:summary.adaptability,capacity:summary.scouts.length*2});
    if(!state.shortlists.has(club.id))state.shortlists.set(club.id,new Set());
    for(const player of club.players){
      const ownKey=key(club.id,player.id);
      if(!state.knowledge.has(ownKey))state.knowledge.set(ownKey,{observerClubId:club.id,playerId:player.id,level:5,progress:100,lastSeenSeason:world.season,lastSeenRound:world.round});
    }
  }
  return state;
}

function playerClub(world:World,playerId:string):Club|undefined{return worldPlayerClub(world,playerId);}
function playerById(world:World,playerId:string):Player|undefined{return worldPlayerById(world,playerId);}

function baseExternalKnowledge(world:World,observer:Club,target:Player):PlayerKnowledge{
  const targetClub=playerClub(world,target.id);
  const region=playerOriginRegion(target.id);
  const regionKnowledge=regionalKnowledge(world,observer.id,region);
  const fame=(target.currentAbility-55)*.55+Math.max(0,target.potentialAbility-78)*.35+(targetClub?.reputation??60)*.09;
  const observerReach=observer.reputation*.12+regionKnowledge*.22;
  const progress=clamp(5+fame+observerReach+rnd()*10,3,64);
  const level=progress>=56?3:progress>=32?2:progress>=14?1:0;
  return {observerClubId:observer.id,playerId:target.id,level:level as KnowledgeLevel,progress,lastSeenSeason:world.season,lastSeenRound:world.round};
}

export function knowledgeFor(world:World,observerClubId:string,playerId:string):PlayerKnowledge{
  const state=scoutingState(world); const existing=state.knowledge.get(key(observerClubId,playerId)); if(existing)return existing;
  const observer=world.clubs.find(c=>c.id===observerClubId); const player=playerById(world,playerId);
  if(!observer||!player)return{observerClubId,playerId,level:0,progress:0,lastSeenSeason:world.season,lastSeenRound:world.round};
  const created=player.clubId===observerClubId?{observerClubId,playerId,level:5 as KnowledgeLevel,progress:100,lastSeenSeason:world.season,lastSeenRound:world.round}:baseExternalKnowledge(world,observer,player);
  state.knowledge.set(key(observerClubId,playerId),created); return created;
}
function levelFromProgress(progress:number):KnowledgeLevel{if(progress>=92)return 5;if(progress>=76)return 4;if(progress>=56)return 3;if(progress>=32)return 2;if(progress>=14)return 1;return 0;}

function activeCountForScout(state:ScoutingState,scoutId:string):number{return state.assignments.filter(a=>a.scoutId===scoutId&&a.active).length;}

export function assignScout(world:World,observerClubId:string,playerId:string,preferredScoutId?:string):boolean{
  const state=scoutingState(world); const profile=state.profiles.get(observerClubId);
  if(!profile)return false;
  const active=state.assignments.filter(a=>a.observerClubId===observerClubId&&a.active);
  if(active.some(a=>a.playerId===playerId))return true;
  if(active.length>=profile.capacity)return false;
  const player=playerById(world,playerId); if(!player)return false;
  const region=playerOriginRegion(player.id);
  const scouts=clubScouts(world,observerClubId);
  const scout=preferredScoutId?scouts.find(s=>s.id===preferredScoutId):[...scouts].sort((a,b)=>{
    const score=(s:typeof a)=>(s.preferredRegion===region?14:0)+s.adaptability*.35+s.judgingAbility*.32+s.judgingPotential*.33-activeCountForScout(state,s.id)*18;
    return score(b)-score(a);
  })[0];
  if(!scout||activeCountForScout(state,scout.id)>=2)return false;
  state.assignments.push({observerClubId,playerId,scoutId:scout.id,region,startedSeason:world.season,startedRound:world.round,active:true});
  return true;
}

export function cancelScout(world:World,observerClubId:string,playerId:string):void{const a=scoutingState(world).assignments.find(x=>x.observerClubId===observerClubId&&x.playerId===playerId&&x.active);if(a)a.active=false;}

export function tickScoutingRound(world:World):void{
  const state=scoutingState(world);
  for(const assignment of state.assignments.filter(a=>a.active)){
    const scout=scoutById(world,assignment.scoutId); const player=playerById(world,assignment.playerId);
    if(!scout||!player){assignment.active=false;continue;}
    const knowledge=knowledgeFor(world,assignment.observerClubId,assignment.playerId);
    const regionBonus=scout.preferredRegion===assignment.region?3.2:0;
    const prior=regionalKnowledge(world,assignment.observerClubId,assignment.region)*.025;
    const gain=4.2+scout.adaptability*.035+scout.judgingAbility*.018+scout.judgingPotential*.018+regionBonus+prior+rnd()*3;
    knowledge.progress=clamp(knowledge.progress+gain,0,100); knowledge.level=levelFromProgress(knowledge.progress); knowledge.lastSeenSeason=world.season; knowledge.lastSeenRound=world.round;
    improveRegionalKnowledge(world,assignment.observerClubId,assignment.region,.7+scout.adaptability*.006);
    if(knowledge.level===5)assignment.active=false;
  }
}

export function scoutingSeasonTurn(world:World):void{
  const state=scoutingState(world); decayRegionalKnowledge(world);
  for(const knowledge of state.knowledge.values()){
    if(knowledge.level===5)continue;
    const seasonsOld=Math.max(0,world.season-knowledge.lastSeenSeason);
    if(seasonsOld>0){knowledge.progress=clamp(knowledge.progress-seasonsOld*8,0,100);knowledge.level=levelFromProgress(knowledge.progress);}
  }
  for(const club of world.clubs)for(const player of club.players){const own=knowledgeFor(world,club.id,player.id);own.progress=100;own.level=5;own.lastSeenSeason=world.season;own.lastSeenRound=world.round;}
}

function estimate(real:number,knowledge:PlayerKnowledge,judge:number,absoluteMin:number,absoluteMax:number,regional:number):AttributeEstimate{
  if(knowledge.level===5)return{min:Math.round(real),max:Math.round(real)};
  const uncertainty=[25,19,14,9,5,0][knowledge.level]; const judgePenalty=(100-judge)*.07; const regionPenalty=(100-regional)*.035;
  const spread=uncertainty+judgePenalty+regionPenalty; const bias=(rnd()-.5)*spread*.55; const center=real+bias;
  return{min:Math.round(clamp(center-spread*.55,absoluteMin,absoluteMax)),max:Math.round(clamp(center+spread*.55,absoluteMin,absoluteMax))};
}
function recommendation(player:Player,ca:AttributeEstimate,pa:AttributeEstimate):ScoutingReport['recommendation']{const projected=(ca.min+ca.max)*.34+(pa.min+pa.max)*.16;const ageBonus=player.age<=20?8:player.age<=23?4:player.age>=32?-7:0;const score=projected+ageBonus;return score>=91?'elite':score>=79?'strong':score>=68?'consider':score>=58?'monitor':'avoid';}
function summaryFor(player:Player,rec:ScoutingReport['recommendation'],knowledge:PlayerKnowledge,region:ScoutingRegion,regionKnowledge:number):string{
  const prefix=knowledge.level<=1?'Informação muito limitada.':knowledge.level===2?'Relatório preliminar.':knowledge.level===3?'Boa leitura inicial.':knowledge.level===4?'Relatório avançado.':'Conhecimento completo.';
  const verdict=rec==='elite'?'Perfil raro, merece prioridade máxima.':rec==='strong'?'Forte candidato para reforçar o elenco.':rec==='consider'?'Opção competitiva, vale aprofundar.':rec==='monitor'?'Acompanhar evolução antes de agir.':'Pouca aderência ao nível atual do clube.';
  const youth=player.age<=21?' Jovem com margem de desenvolvimento.':''; const regional=regionKnowledge<30?` Conhecimento fraco em ${region}.`:regionKnowledge>=70?` Rede consolidada em ${region}.`:'';
  return `${prefix} ${verdict}${youth}${regional}`;
}

export function scoutingReport(world:World,observerClubId:string,playerId:string):ScoutingReport|undefined{
  const state=scoutingState(world); const player=playerById(world,playerId); if(!player)return undefined;
  const knowledge=knowledgeFor(world,observerClubId,playerId); const profile=state.profiles.get(observerClubId); if(!profile)return undefined; const region=playerOriginRegion(player.id); const regionKnow=regionalKnowledge(world,observerClubId,region);
  const ca=estimate(player.currentAbility,knowledge,profile.judgingAbility,20,99,regionKnow); const pa=estimate(player.potentialAbility,knowledge,profile.judgingPotential,20,99,regionKnow);
  const trueValue=playerMarketValue(player); const market=estimate(trueValue,knowledge,(profile.judgingAbility+profile.judgingPotential)/2,0,400_000_000,regionKnow);
  const attrs:Partial<Record<keyof PlayerAttributes,AttributeEstimate>>={}; const visibleCount=[0,2,4,6,8,9][knowledge.level];
  const ordered=(Object.keys(player.attributes) as (keyof PlayerAttributes)[]).sort((a,b)=>player.attributes[b]-player.attributes[a]);
  for(const attr of ordered.slice(0,visibleCount))attrs[attr]=estimate(player.attributes[attr],knowledge,profile.judgingAbility,1,99,regionKnow);
  const rec=recommendation(player,ca,pa);
  return{playerId:player.id,playerName:player.name,clubId:player.clubId,position:player.position,age:player.age,originRegion:region,knowledge:knowledge.level,confidence:Math.round(knowledge.progress),currentAbility:ca,potentialAbility:pa,marketValue:market,attributes:attrs,recommendation:rec,summary:summaryFor(player,rec,knowledge,region,regionKnow)};
}

export function scoutingCandidates(world:World,observerClubId:string,position?:Position,limit=30):ScoutingReport[]{
  const reports:ScoutingReport[]=[];
  for(const entry of worldPlayerPool(world)){
    const player=entry.player;if(player.clubId===observerClubId)continue;if(position&&player.position!==position)continue;
    const r=scoutingReport(world,observerClubId,player.id);if(r)reports.push(r);
  }
  const score=(r:ScoutingReport)=>(r.currentAbility.min+r.currentAbility.max)*.34+(r.potentialAbility.min+r.potentialAbility.max)*.16+(r.age<=21?7:r.age<=24?3:0)+r.confidence*.05;
  return reports.sort((a,b)=>score(b)-score(a)).slice(0,limit);
}
export function toggleShortlist(world:World,observerClubId:string,playerId:string):boolean{const set=scoutingState(world).shortlists.get(observerClubId)!;if(set.has(playerId)){set.delete(playerId);return false;}set.add(playerId);return true;}
export function isShortlisted(world:World,observerClubId:string,playerId:string):boolean{return scoutingState(world).shortlists.get(observerClubId)?.has(playerId)??false;}
export function shortlistedReports(world:World,observerClubId:string):ScoutingReport[]{const set=scoutingState(world).shortlists.get(observerClubId)??new Set<string>();return[...set].map(id=>scoutingReport(world,observerClubId,id)).filter((r):r is ScoutingReport=>Boolean(r));}
export function scoutProfile(world:World,clubId:string):ScoutProfile|undefined{return scoutingState(world).profiles.get(clubId);}
export function activeAssignments(world:World,clubId:string):ScoutAssignment[]{return scoutingState(world).assignments.filter(a=>a.observerClubId===clubId&&a.active);}
