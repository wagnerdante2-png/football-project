import type { Player, PlayerAttributes, World } from './engine';
import { selectStartingEleven } from './engine';
import { playCurrentRoundWithRoles } from './roles';
import { effectiveAttributes, prepareAvailableSquads, restoreSquads, simulateMedicalAfterRound } from './injuries';
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

export function playCurrentRoundWithMedical(world:World):void {
  const personalRemoved=removePersonallyUnavailable(world);const removed=prepareAvailableSquads(world);const participants=new Map<string,Set<string>>();const snapshots=new Map<Player,PlayerAttributes>();
  try {
    for(const club of world.clubs){
      const xi=selectStartingEleven(club);participants.set(club.id,new Set(xi.map(p=>p.id)));
      for(const player of club.players){snapshots.set(player,{...player.attributes});const medical=effectiveAttributes(world,player);const factor=personalPerformanceFactor(world,player.id)*dressingRoomPerformanceFactor(world,player.id)*trainingPerformanceFactor(world,player.id)*managerRelationshipPerformanceFactor(world,player.id);player.attributes=applyContextFactor(medical,factor);}
    }
    playCurrentRoundWithRoles(world);
  } finally {for(const [player,attributes] of snapshots)player.attributes=attributes;restoreSquads(removed);restorePersonallyUnavailable(world,personalRemoved);}
  simulateMedicalAfterRound(world,participants);
}
