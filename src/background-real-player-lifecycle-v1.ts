import type { World } from './engine';
import { realPlayersV2 } from './real-world-player-import-v2';
import { maybeRetirePlayer } from './player-lifecycle-v2';
import { playerProfile } from './player-profile-v2';
import { deterministicRandom } from './world-core-v2';

export type BackgroundRealLifecycleReport={eligiblePopulation:number;aged:number;retired:number;alreadyRetired:number};
export function advanceBackgroundRealPlayerSeason(world:World,targetSeason:number):BackgroundRealLifecycleReport{
 const clubbed=new Set(world.clubs.flatMap(c=>c.players.map(p=>p.id))),report:BackgroundRealLifecycleReport={eligiblePopulation:0,aged:0,retired:0,alreadyRetired:0},date=`${targetSeason}-07-01`;
 for(const record of realPlayersV2(world)){
  const p=record.player;if(clubbed.has(p.id))continue;report.eligiblePopulation++;const profile=playerProfile(world,p.id);if(profile?.retired){report.alreadyRetired++;continue}
  p.age+=1;report.aged++;if(p.age>=31){const decline=Math.floor(deterministicRandom(world,'players',`${p.id}:${targetSeason}:background-decline`)*2)+(p.age>=35?1:0);p.currentAbility=Math.max(20,p.currentAbility-decline);p.potentialAbility=Math.max(p.currentAbility,p.potentialAbility-decline)}
  if(maybeRetirePlayer(world,p,date))report.retired++;
 }
 return report;
}
