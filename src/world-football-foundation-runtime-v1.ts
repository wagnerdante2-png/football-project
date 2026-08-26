import type { World } from './engine';
import { seedFootballGovernanceFoundation } from './world-football-foundation-v1';
import { seedInternationalCompetitions } from './international-competitions-v1';
import { seedClubCompetitionFoundation } from './club-competition-foundation-v1';
import { seedWorldCupQualifierCompetitions } from './international-qualifiers-v1';
import { ensureNationalRankings } from './national-team-ranking-v1';
import { ensureActiveLeagueCanonicalBridge } from './active-league-canonical-bridge-v1';

const seeded=new WeakSet<World>();
const nextWorldCupYear=(season:number)=>{let year=Math.max(2030,season);while((year-2026)%4!==0)year++;return year};

/**
 * Seeds only metadata/state that cannot create a second playable calendar.
 * The active beta league is mirrored into canonical football data, but no
 * DomesticSeasonState, continental schedule or qualifier cycle is created.
 */
export function ensureActiveWorldFootballFoundation(world:World){
  if(seeded.has(world))return;
  seeded.add(world);
  seedFootballGovernanceFoundation(world);
  seedInternationalCompetitions(world);
  seedClubCompetitionFoundation(world);
  seedWorldCupQualifierCompetitions(world,nextWorldCupYear(world.season));
  ensureNationalRankings(world);
  ensureActiveLeagueCanonicalBridge(world);
}
function currentWorld(){return typeof window==='undefined'?undefined:window.__touchlineWorld as World|undefined}
function bind(){const world=currentWorld();if(world)ensureActiveWorldFootballFoundation(world)}
function rebindAfterSave(){const world=currentWorld();if(!world)return;seeded.delete(world);ensureActiveWorldFootballFoundation(world)}
if(typeof document!=='undefined'){
  document.addEventListener('touchline:world-ready',bind);
  document.addEventListener('touchline:view-rendered',bind);
  window.addEventListener('touchline:save-loaded',rebindAfterSave);
  queueMicrotask(bind);
}
