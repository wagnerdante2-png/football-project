import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { createMatchCore } from '../src/match-core-v2';
import { simulateFixtureV2 } from '../src/match-world-integration-v2';
import { matchEventLedger } from '../src/match-event-ledger-v2';
import { clubSeasonStats, matchArchive, persistCompletedMatchV2, restoreMatchHistory, snapshotMatchHistory } from '../src/match-season-history-v2';

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}

// Synthetic history regression: a later match with no penalties must not erase a prior penalty conceded.
const historyWorld=createBrazilRealWorld2026();
const [clubA,clubB,clubC]=historyWorld.clubs;
assert(clubA&&clubB&&clubC,'Need three clubs for match history regression');
const first=createMatchCore(clubA,clubB,{seed:101});
first.phase='finished';first.seconds=5400;(first as any).__refereeLog=[{penalty:true,victimClubId:clubB.id}];
assert(persistCompletedMatchV2(historyWorld,first,clubA,clubB,{fixtureId:'causal-pen-1',competitionId:'league',date:'2026-07-25',round:1}),'First synthetic history match was not persisted');
assert(clubSeasonStats(historyWorld,clubA.id)?.penaltiesAgainst===1,'First conceded penalty was not stored');
const second=createMatchCore(clubA,clubC,{seed:102});
second.phase='finished';second.seconds=5400;(second as any).__refereeLog=[];
assert(persistCompletedMatchV2(historyWorld,second,clubA,clubC,{fixtureId:'causal-pen-2',competitionId:'league',date:'2026-08-01',round:2}),'Second synthetic history match was not persisted');
assert(clubSeasonStats(historyWorld,clubA.id)?.penaltiesAgainst===1,'Later match erased cumulative penaltiesAgainst');
const historySnapshot=snapshotMatchHistory(historyWorld);
const restoredHistoryWorld=createBrazilRealWorld2026();
restoreMatchHistory(restoredHistoryWorld,historySnapshot);
assert(matchArchive(restoredHistoryWorld).length===2,'Match history snapshot/restore lost archive rows');
assert(clubSeasonStats(restoredHistoryWorld,clubA.id)?.penaltiesAgainst===1,'Match history snapshot/restore lost club penalty totals');

// Live causal chain: shot resolution -> ledger -> score/stats -> fixture -> standings -> season archive.
const world=createBrazilRealWorld2026();
const fixture=world.fixtures.find(f=>f.round===1);
assert(fixture,'No round-one fixture available');
const home=world.clubs.find(c=>c.id===fixture.home),away=world.clubs.find(c=>c.id===fixture.away);
assert(home&&away,'Fixture clubs missing');
const beforeHome={...world.standings[home.id]},beforeAway={...world.standings[away.id]};
const state=simulateFixtureV2(world,fixture,{competitionId:'league',date:'2026-07-25'});
const ledger=matchEventLedger(state),goals=ledger.filter(e=>e.type==='goal'||e.type==='physicalGoal'),shots=ledger.filter(e=>e.type==='shot');
const homeGoals=goals.filter(e=>e.clubId===home.id).length,awayGoals=goals.filter(e=>e.clubId===away.id).length;
const homeShots=shots.filter(e=>e.clubId===home.id).length,awayShots=shots.filter(e=>e.clubId===away.id).length;
assert(homeGoals===state.home.score,`Home ledger/score mismatch: ledger=${homeGoals} score=${state.home.score}`);
assert(awayGoals===state.away.score,`Away ledger/score mismatch: ledger=${awayGoals} score=${state.away.score}`);
assert(homeShots===state.home.shots,`Home ledger/shots mismatch: ledger=${homeShots} state=${state.home.shots}`);
assert(awayShots===state.away.shots,`Away ledger/shots mismatch: ledger=${awayShots} state=${state.away.shots}`);
assert(fixture.homeGoals===state.home.score&&fixture.awayGoals===state.away.score,'Fixture result diverged from match core');
assert(fixture.stats?.shotsHome===state.home.shots&&fixture.stats?.shotsAway===state.away.shots,'Fixture statistics diverged from match core');
const afterHome=world.standings[home.id],afterAway=world.standings[away.id];
assert(afterHome.played===(beforeHome?.played??0)+1&&afterAway.played===(beforeAway?.played??0)+1,'Standings did not consume completed match');
assert(afterHome.gf===(beforeHome?.gf??0)+state.home.score&&afterHome.ga===(beforeHome?.ga??0)+state.away.score,'Home standings goals diverged from match result');
assert(afterAway.gf===(beforeAway?.gf??0)+state.away.score&&afterAway.ga===(beforeAway?.ga??0)+state.home.score,'Away standings goals diverged from match result');
const archived=matchArchive(world).at(-1);
assert(archived&&archived.homeGoals===state.home.score&&archived.awayGoals===state.away.score,'Season archive diverged from completed match');
assert(clubSeasonStats(world,home.id)?.goalsFor===state.home.score,'Home season history did not consume match score');
assert(clubSeasonStats(world,away.id)?.goalsFor===state.away.score,'Away season history did not consume match score');
const playedBeforeDuplicate=afterHome.played,archiveBeforeDuplicate=matchArchive(world).length,homeConditionBefore=home.players.map(p=>p.condition);
let duplicateBlocked=false;try{simulateFixtureV2(world,fixture,{competitionId:'league',date:'2026-07-25'})}catch{duplicateBlocked=true}
assert(duplicateBlocked,'Completed fixture could be simulated twice');
assert(world.standings[home.id].played===playedBeforeDuplicate,'Duplicate fixture attempt changed standings');
assert(matchArchive(world).length===archiveBeforeDuplicate,'Duplicate fixture attempt changed season archive');
assert(home.players.every((p,i)=>p.condition===homeConditionBefore[i]),'Duplicate fixture attempt changed player condition');
console.log(`[smoke-match-causality] ${home.name} ${state.home.score}-${state.away.score} ${away.name} · ledger goals=${goals.length} shots=${shots.length} · standings=OK · archive=OK · duplicate=blocked · penalty accumulation=OK · history roundtrip=OK`);
