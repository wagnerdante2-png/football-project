import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { createDefaultManagerCharacter } from '../src/manager-character';
import { dailyCalendar } from '../src/daily-simulation';
import { transitionCompletedSeason } from '../src/season-auto-runtime-v1';
import { eventBusState } from '../src/event-bus';
import { dedupePlayerRosters } from '../src/player-roster-integrity-v1';
import { ensureActiveWorldFootballFoundation } from '../src/world-football-foundation-runtime-v1';
import { footballDataSnapshot } from '../src/world-football-data-v1';
import { allDomesticSeasons } from '../src/domestic-competition-runtime-v1';
import { ACTIVE_BRAZIL_LEAGUE_ID } from '../src/active-league-canonical-bridge-v1';

const world=createBrazilRealWorld2026();
ensureActiveWorldFootballFoundation(world);
if(allDomesticSeasons(world).length!==0)throw new Error('Canonical league bridge created a parallel domestic runtime before transition');
const club=world.clubs[0];
if(!club)throw new Error('No club in season transition smoke');
createDefaultManagerCharacter(world,club.id,'Season Smoke Manager');
const beforeSeason=world.season;
const beforePlayers=new Set(world.clubs.flatMap(c=>c.players.map(p=>p.id)));
for(const f of world.fixtures){
  f.played=true;
  f.homeGoals=1;
  f.awayGoals=0;
  const h=world.standings[f.home],a=world.standings[f.away];
  if(h&&a){h.played++;a.played++;h.wins++;a.losses++;h.gf++;a.ga++;h.points+=3}
}
const changed=transitionCompletedSeason(world,`${beforeSeason}-12-31`);
if(!changed)throw new Error('Completed season did not transition');
if(world.season!==beforeSeason+1)throw new Error(`Expected season ${beforeSeason+1}, got ${world.season}`);
if(world.round!==1)throw new Error(`Expected round 1, got ${world.round}`);
if(!world.fixtures.length||world.fixtures.some(f=>f.played))throw new Error('New season fixtures were not reset');
if(dailyCalendar(world).date!==`${world.season}-07-25`)throw new Error(`Calendar not reset: ${dailyCalendar(world).date}`);
if(allDomesticSeasons(world).length!==0)throw new Error('Lightweight season transition unexpectedly created a domestic runtime');
const nextMemberships=footballDataSnapshot(world).memberships.filter(m=>m.competitionId===ACTIVE_BRAZIL_LEAGUE_ID&&m.season===String(world.season)&&m.status==='participant');
if(nextMemberships.length!==world.clubs.length)throw new Error(`Canonical next-season memberships missing: ${nextMemberships.length} vs ${world.clubs.length}`);
const integrity=dedupePlayerRosters(world);
if(integrity.removed>0)throw new Error(`Season transition created ${integrity.removed} duplicate roster entries`);
const ids=world.clubs.flatMap(c=>c.players.map(p=>p.id));
if(new Set(ids).size!==ids.length)throw new Error('Duplicate player IDs after season transition');
if(ids.length<beforePlayers.size/2)throw new Error('Unexpected player population collapse after season transition');
const types=eventBusState(world).events.map(e=>e.type);
if(!types.includes('SeasonEnded')||!types.includes('SeasonStarted'))throw new Error('Season lifecycle events missing');
if(transitionCompletedSeason(world,`${world.season}-01-01`))throw new Error('Season transitioned twice without completion');
console.log(`[smoke-season] ${beforeSeason} -> ${world.season} · fixtures=${world.fixtures.length} · players=${ids.length} · canonicalMemberships=${nextMemberships.length} · domesticRuntime=0 · OK`);
