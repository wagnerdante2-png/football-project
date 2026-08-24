import type { World } from './engine';
import { managerPlayerRelationship, managerProfile } from './manager-interactions';

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

export function managerRelationshipPerformanceFactor(world:World,playerId:string):number{
  const club=world.clubs.find(c=>c.players.some(p=>p.id===playerId));if(!club)return 1;
  const rel=managerPlayerRelationship(world,club.id,playerId);const manager=managerProfile(world,club.id);if(!rel||!manager)return 1;
  const trust=(rel.trust-50)/50;const respect=(rel.respect-50)/50;const friction=rel.friction/100;const fear=rel.fear/100;
  const authority=(manager.authority-50)/50;const stress=Math.max(0,manager.stress-70)/30;
  const positive=trust*.012+respect*.009+authority*.004;
  const negative=friction*.035+Math.max(0,fear-.55)*.018+stress*.006;
  return clamp(1+positive-negative,.94,1.025);
}
