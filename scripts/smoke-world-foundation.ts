import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { ensureActiveWorldFootballFoundation } from '../src/world-football-foundation-runtime-v1';
import { footballDataSnapshot } from '../src/world-football-data-v1';
import { snapshotNationalRankings } from '../src/national-team-ranking-v1';
import { snapshotQualifierRuntime } from '../src/international-qualifier-runtime-v1';
import { tickInternationalMatches } from '../src/international-daily-runtime-v1';
import { allDomesticSeasons } from '../src/domestic-competition-runtime-v1';
import { ACTIVE_BRAZIL_LEAGUE_ID } from '../src/active-league-canonical-bridge-v1';
import { emitWorldEvent } from '../src/event-bus';

const world=createBrazilRealWorld2026();
const fixturesBefore=world.fixtures.length;
ensureActiveWorldFootballFoundation(world);
const snapshot=footballDataSnapshot(world);
const rankings=snapshotNationalRankings(world);
const ids=new Set(snapshot.competitions.map(c=>c.id));

for(const required of ['comp-fifa-world-cup','comp-conmebol-libertadores','comp-bra-cup',ACTIVE_BRAZIL_LEAGUE_ID,'qual-conmebol-wc-2030','qual-uefa-wc-2030']){
  if(!ids.has(required))throw new Error(`World foundation missing competition ${required}`);
}
if(snapshot.confederations.length<7)throw new Error(`Expected at least 7 confederations, got ${snapshot.confederations.length}`);
if(snapshot.nationalTeams.filter(t=>t.active).length<100)throw new Error(`Expected broad national-team registry, got ${snapshot.nationalTeams.length}`);
if(rankings.entries.length!==snapshot.nationalTeams.filter(t=>t.active).length)throw new Error(`Ranking/team mismatch: rankings=${rankings.entries.length} activeTeams=${snapshot.nationalTeams.filter(t=>t.active).length}`);
if(snapshot.clubs.length!==world.clubs.length)throw new Error(`Canonical club mismatch: footballData=${snapshot.clubs.length} world=${world.clubs.length}`);
const activeMemberships=snapshot.memberships.filter(m=>m.competitionId===ACTIVE_BRAZIL_LEAGUE_ID&&m.season===String(world.season)&&m.status==='participant');
if(activeMemberships.length!==world.clubs.length)throw new Error(`Active league membership mismatch: ${activeMemberships.length} vs ${world.clubs.length}`);
if(world.fixtures.length!==fixturesBefore)throw new Error(`Safe foundation mutated playable fixtures: ${fixturesBefore} -> ${world.fixtures.length}`);
if(snapshot.matches.length!==0)throw new Error(`Safe foundation unexpectedly materialized ${snapshot.matches.length} football-data matches`);
if(allDomesticSeasons(world).length!==0)throw new Error('Safe foundation unexpectedly created a parallel DomesticSeasonState');
if(snapshotQualifierRuntime(world).cycles.length!==0)throw new Error('Safe foundation unexpectedly created qualifier cycles');

tickInternationalMatches(world,'2026-07-25');
if(snapshotQualifierRuntime(world).cycles.length!==0)throw new Error('Daily international runtime implicitly created qualifier cycles');

const fixture=world.fixtures.find(f=>f.round===world.round);
if(!fixture)throw new Error('No active league fixture available for canonical bridge smoke');
fixture.played=true;
fixture.homeGoals=2;
fixture.awayGoals=1;
emitWorldEvent(world,{type:'MatchCompleted',date:'2026-07-25',clubIds:[fixture.home,fixture.away],importance:2,summary:'Canonical bridge smoke match.',payload:{round:fixture.round,homeGoals:2,awayGoals:1}});
emitWorldEvent(world,{type:'MatchCompleted',date:'2026-07-25',clubIds:[fixture.home,fixture.away],importance:2,summary:'Duplicate canonical bridge smoke event.',payload:{round:fixture.round,homeGoals:2,awayGoals:1}});
const mirrored=footballDataSnapshot(world).matches.filter(m=>m.competitionId===ACTIVE_BRAZIL_LEAGUE_ID&&m.homeTeamId===fixture.home&&m.awayTeamId===fixture.away);
if(mirrored.length!==1)throw new Error(`Expected exactly one mirrored active-league result, got ${mirrored.length}`);
if(mirrored[0]?.homeGoals!==2||mirrored[0]?.awayGoals!==1)throw new Error('Mirrored active-league result has wrong score');
if(world.fixtures.length!==fixturesBefore)throw new Error('Canonical result mirroring changed playable fixture count');
if(allDomesticSeasons(world).length!==0)throw new Error('Canonical result mirroring created a parallel DomesticSeasonState');

console.log(`[smoke-foundation] confederations=${snapshot.confederations.length} · nationalTeams=${snapshot.nationalTeams.length} · clubs=${snapshot.clubs.length} · competitions=${snapshot.competitions.length} · memberships=${activeMemberships.length} · rankings=${rankings.entries.length} · fixtures=${world.fixtures.length} · mirroredMatches=${mirrored.length} · qualifierCycles=0 · domesticRuntime=0 · OK`);
