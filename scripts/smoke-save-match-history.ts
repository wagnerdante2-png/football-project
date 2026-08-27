import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { simulateFixtureV2 } from '../src/match-world-integration-v2';
import { clubSeasonStats, matchArchive } from '../src/match-season-history-v2';
import { createSaveSnapshot, restoreSave, serializeSave } from '../src/save-game';

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}

const world=createBrazilRealWorld2026();
const fixture=world.fixtures.find(f=>f.round===1);
assert(fixture,'No round-one fixture available for save history smoke');
const home=world.clubs.find(c=>c.id===fixture.home),away=world.clubs.find(c=>c.id===fixture.away);
assert(home&&away,'Fixture clubs missing');
const state=simulateFixtureV2(world,fixture,{competitionId:'league',date:'2026-07-25'});
const beforeArchive=matchArchive(world);
const beforeHome=clubSeasonStats(world,home.id);
const beforeAway=clubSeasonStats(world,away.id);
assert(beforeArchive.length===1,'Completed match was not archived before save');
assert(beforeHome?.played===1&&beforeAway?.played===1,'Club season history missing before save');

const snapshot=createSaveSnapshot(world);
assert(snapshot.schemaVersion>=16,'Central save schema regressed below match-history support');
assert(snapshot.matchHistory.matches.length===beforeArchive.length,'Central save omitted match archive');
const restored=restoreSave(serializeSave(world));
const afterArchive=matchArchive(restored);
const afterHome=clubSeasonStats(restored,home.id);
const afterAway=clubSeasonStats(restored,away.id);
assert(afterArchive.length===beforeArchive.length,'Match archive disappeared after central save/load');
assert(afterArchive[0]?.homeGoals===state.home.score&&afterArchive[0]?.awayGoals===state.away.score,'Archived score changed after central save/load');
assert(afterHome?.played===beforeHome.played&&afterHome.goalsFor===beforeHome.goalsFor&&afterHome.goalsAgainst===beforeHome.goalsAgainst,'Home season history changed after central save/load');
assert(afterAway?.played===beforeAway.played&&afterAway.goalsFor===beforeAway.goalsFor&&afterAway.goalsAgainst===beforeAway.goalsAgainst,'Away season history changed after central save/load');

// Backward compatibility: V15 saves must remain loadable even though they cannot contain the later match-history state.
const legacy:any=createSaveSnapshot(world);
legacy.schemaVersion=15;
delete legacy.matchHistory;
delete legacy.clubGovernance;
delete legacy.clubAssets;
delete legacy.commercial;
delete legacy.staffCareer;
delete legacy.humanVoices;
delete legacy.realWorldPeople;
const legacyWorld=restoreSave(JSON.stringify(legacy));
assert(legacyWorld.season===world.season,'V15 compatibility restore failed');
assert(matchArchive(legacyWorld).length===0,'V15 restore unexpectedly invented match history');

console.log(`[smoke-save-match-history] ${home.name} ${state.home.score}-${state.away.score} ${away.name} · archive=${afterArchive.length} · schemaV${snapshot.schemaVersion}=OK · v15-compat=OK`);
