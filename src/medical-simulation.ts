import type { Player, PlayerAttributes, World } from './engine';
import { playCurrentRound } from './engine';
import { playCurrentRoundV2 } from './match-world-integration-v2';
import { effectiveAttributes, prepareAvailableSquads, restoreSquads, inflictInjury, injuryDefinitions, tickRecovery } from './injuries';
import { matchInjuries, type MatchInjury } from './match-contact-injury-v2';
import { personalAvailability, personalPerformanceFactor } from './human-life';
import { dressingRoomPerformanceFactor } from './dressing-room';
import { trainingPerformanceFactor } from './training-engine';
import { managerRelationshipPerformanceFactor } from './manager-performance';

type RemovedPersonal={clubId:string;players:Player[]};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

function removePersonallyUnavailable(world:World):RemovedPersonal[]{
  const removed:RemovedPersonal[]=[];
  for(const club of world.clubs){const unavailable=club.players.filter(p=>!personalAvailability(world,p.id));if(!unavailable.length)continue;const ids=new Set(unavailable.map(p=>p.id));club.players=club.players.filter(p=>!ids.has(p.id));removed.push({clubId:club.id,players:unavailable});}
  return removed;
}
function restorePersonallyUnavailable(world:World,removed:RemovedPersonal[]):void{for(const row of removed){const club=world.clubs.find(c=>c.id===row.clubId);if(club)club.players.push(...row.players);}}
function applyContextFactor(attributes:PlayerAttributes,factor:number):PlayerAttributes{const out={...attributes};for(const key of Object.keys(out) as (keyof PlayerAttributes)[])out[key]=Math.round(clamp(out[key]*factor,20,99));return out;}
function playerById(world:World,id:string){for(const c of world.clubs){const p=c.players.find(x=>x.id===id);if(p)return p}}
function definitionForMatchInjury(i:MatchInjury){const by=(id:string)=>injuryDefinitions.find(x=>x.id===id)!;if(i.concussion||i.mechanism==='head')return by('concussion');if(i.mechanism==='shoulder')return i.severity==='knock'?by('bruise'):by('shoulder-dislocation');if(i.mechanism==='ankle')return by('ankle-sprain');if(i.mechanism==='knee')return i.severity==='severe'?by('knee-acl'):by('knee-mcl');if(i.mechanism==='lowerLeg')return i.severity==='severe'?by('tibia-fracture'):i.severity==='moderate'?by('fibula-fracture'):by('calf-strain');if(i.mechanism==='hip')return by('hip-flexor');if(i.mechanism==='muscle')return by('hamstring-strain');if(i.mechanism==='thigh')return i.severity==='knock'?by('bruise'):by('hamstring-strain');return by('bruise')}
function persistV2Medical(world:World,states:any[]){const seen=new Set<string>();for(const state of states)for(const i of matchInjuries(state)){const key=`${state.home.clubId}:${state.away.clubId}:${i.playerId}:${Math.round(i.second)}:${i.mechanism}`;if(seen.has(key)||i.severity==='knock')continue;seen.add(key);const p=playerById(world,i.playerId);if(!p)continue;const context=i.source==='foul'||i.source==='duel'?'contact':'match';const event=inflictInjury(world,p,definitionForMatchInjury(i),context);event.notes.push(`Origem Match Engine V2: ${i.mechanism}, ${i.severity}, minuto ${Math.floor(i.second/60)}.`);if(i.forcedOff)event.notes.push('Jogador precisou deixar a partida.')}}
function withMedicalContext<T>(world:World,fn:()=>T):T{
  const personalRemoved=removePersonallyUnavailable(world),removed=prepareAvailableSquads(world),snapshots=new Map<Player,PlayerAttributes>();
  try{
    for(const club of world.clubs)for(const player of club.players){snapshots.set(player,{...player.attributes});const medical=effectiveAttributes(world,player);const factor=personalPerformanceFactor(world,player.id)*dressingRoomPerformanceFactor(world,player.id)*trainingPerformanceFactor(world,player.id)*managerRelationshipPerformanceFactor(world,player.id);player.attributes=applyContextFactor(medical,factor);}
    return fn();
  }finally{for(const [player,attributes] of snapshots)player.attributes=attributes;restoreSquads(removed);restorePersonallyUnavailable(world,personalRemoved);}
}

/** Full 0.25s physical simulation. Use only when a match is actually opened/watched. */
export function playCurrentRoundWithMedical(world:World,date?:string,competitionId='league'):void {
  const matchStates=withMedicalContext(world,()=>playCurrentRoundV2(world,{date,competitionId}));
  persistV2Medical(world,matchStates);
  tickRecovery(world);
}

/** Fast statistical round for calendar progression. Keeps medical/personal context without blocking the UI with 10 physical simulations. */
export function playCurrentRoundFastWithMedical(world:World):void{
  withMedicalContext(world,()=>playCurrentRound(world));
  tickRecovery(world);
}
