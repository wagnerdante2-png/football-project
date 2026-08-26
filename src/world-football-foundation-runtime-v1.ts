import type { World } from './engine';
import { seedFootballGovernanceFoundation } from './world-football-foundation-v1';
import { seedInternationalCompetitions } from './international-competitions-v1';
import { ensureNationalRankings } from './national-team-ranking-v1';

const seeded=new WeakSet<World>();
export function ensureActiveWorldFootballFoundation(world:World){
  if(seeded.has(world))return;
  seeded.add(world);
  seedFootballGovernanceFoundation(world);
  seedInternationalCompetitions(world);
  ensureNationalRankings(world);
}
function currentWorld(){return typeof window==='undefined'?undefined:window.__touchlineWorld as World|undefined}
function bind(){const world=currentWorld();if(world)ensureActiveWorldFootballFoundation(world)}
if(typeof document!=='undefined'){
  document.addEventListener('touchline:world-ready',bind);
  document.addEventListener('touchline:view-rendered',bind);
  queueMicrotask(bind);
}
