import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { ensureActiveWorldFootballFoundation } from '../src/world-football-foundation-runtime-v1';
import { footballDataSnapshot } from '../src/world-football-data-v1';
import { snapshotNationalRankings } from '../src/national-team-ranking-v1';
import { snapshotQualifierRuntime } from '../src/international-qualifier-runtime-v1';
import { tickInternationalMatches } from '../src/international-daily-runtime-v1';

const world=createBrazilRealWorld2026();
const fixturesBefore=world.fixtures.length;
ensureActiveWorldFootballFoundation(world);
const snapshot=footballDataSnapshot(world);
const rankings=snapshotNationalRankings(world);
const ids=new Set(snapshot.competitions.map(c=>c.id));

for(const required of ['comp-fifa-world-cup','comp-conmebol-libertadores','comp-bra-cup','qual-conmebol-wc-2030','qual-uefa-wc-2030']){
  if(!ids.has(required))throw new Error(`World foundation missing competition ${required}`);
}
if(snapshot.confederations.length<7)throw new Error(`Expected at least 7 confederations, got ${snapshot.confederations.length}`);
if(snapshot.nationalTeams.filter(t=>t.active).length<100)throw new Error(`Expected broad national-team registry, got ${snapshot.nationalTeams.length}`);
if(rankings.entries.length!==snapshot.nationalTeams.filter(t=>t.active).length)throw new Error(`Ranking/team mismatch: rankings=${rankings.entries.length} activeTeams=${snapshot.nationalTeams.filter(t=>t.active).length}`);
if(world.fixtures.length!==fixturesBefore)throw new Error(`Safe foundation mutated playable fixtures: ${fixturesBefore} -> ${world.fixtures.length}`);
if(snapshot.matches.length!==0)throw new Error(`Safe foundation unexpectedly materialized ${snapshot.matches.length} football-data matches`);
if(snapshotQualifierRuntime(world).cycles.length!==0)throw new Error('Safe foundation unexpectedly created qualifier cycles');

tickInternationalMatches(world,'2026-07-25');
if(snapshotQualifierRuntime(world).cycles.length!==0)throw new Error('Daily international runtime implicitly created qualifier cycles');

console.log(`[smoke-foundation] confederations=${snapshot.confederations.length} · nationalTeams=${snapshot.nationalTeams.length} · competitions=${snapshot.competitions.length} · rankings=${rankings.entries.length} · fixtures=${world.fixtures.length} · qualifierCycles=0 · OK`);
