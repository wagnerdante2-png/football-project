import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { ensureActiveWorldFootballFoundation } from '../src/world-football-foundation-runtime-v1';
import { loadPublicPeople2026, type PublicPeople2026Payload } from '../src/real-world-2026-loader-v1';
import { realPlayersV2 } from '../src/real-world-player-import-v2';
import { footballDataSnapshot } from '../src/world-football-data-v1';
import { playerProfile } from '../src/player-profile-v2';
import { selectNationalSquad } from '../src/national-team-selection-v1';
import { worldPlayerPoolCounts } from '../src/world-player-pool-v1';
import { scoutingCandidates, scoutingReport } from '../src/scouting';

const root=path.resolve('public/data/people');
const read=async<T>(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8')) as T;
const [players,staff,manifest]=await Promise.all([
  read<PublicPeople2026Payload['players']>('real-players-2026.json'),
  read<PublicPeople2026Payload['staff']>('real-staff-2026.json'),
  read<any>('manifest-2026.json')
]);
if(!manifest?.offline||manifest?.mode!=='licensed-only-global-offline')throw new Error('People manifest is not an offline licensed bundle');
if(players.length!==manifest?.counts?.deduplicatedPlayers)throw new Error(`Bundle count mismatch ${players.length} != ${manifest?.counts?.deduplicatedPlayers}`);
if(players.length<30000)throw new Error(`Expected broad global population, got ${players.length}`);

const world=createBrazilRealWorld2026();
ensureActiveWorldFootballFoundation(world);
const started=Date.now(),report=loadPublicPeople2026(world,{players,staff,manifest}),elapsed=Date.now()-started;
const real=realPlayersV2(world),ids=real.map(x=>x.id),identityKeys=real.map(x=>x.identityKey);
if(new Set(ids).size!==ids.length)throw new Error('Duplicate persistent IDs after loading licensed bundle');
if(new Set(identityKeys).size!==identityKeys.length)throw new Error('Duplicate identity keys after loading licensed bundle');
if(real.length+report.players.adoptedRuntime<30000)throw new Error(`Global runtime population too small: ${real.length}+${report.players.adoptedRuntime}`);
const rawTwoLetter=real.filter(r=>r.player&&playerProfile(world,r.id)?.nationalities.some(x=>/^[A-Z]{2}$/.test(x))).length;
if(rawTwoLetter>0)throw new Error(`${rawTwoLetter} imported profiles retained raw ISO2 nationalities`);

const snap=footballDataSnapshot(world),brazil=snap.nationalTeams.find(t=>t.countryId==='BRA'&&t.teamKind==='senior');
if(!brazil)throw new Error('Brazil national team missing from canonical registry');
const brazilian=real.find(r=>playerProfile(world,r.id)?.nationalities.includes('BRA'));
if(!brazilian)throw new Error('No canonical Brazilian player found in global bundle');
const eligible=selectNationalSquad(world,{teamId:brazil.id,countryId:'BRA',size:10000,reserveSize:0});
if(!eligible.members.some(m=>m.playerId===brazilian.id))throw new Error('National selection cannot see canonical Brazilian background identity');
const pool=worldPlayerPoolCounts(world);
if(pool.backgroundReal<25000)throw new Error(`Canonical pool did not expose background real population: ${pool.backgroundReal}`);
const observer=world.clubs[0];if(!observer)throw new Error('Playable observer club missing');
const directReport=scoutingReport(world,observer.id,brazilian.id);if(!directReport||directReport.playerId!==brazilian.id)throw new Error('Scouting cannot resolve a background real identity');
const scoutStarted=Date.now(),candidates=scoutingCandidates(world,observer.id,undefined,40000),scoutMs=Date.now()-scoutStarted;
if(candidates.length<25000)throw new Error(`Global scouting returned only ${candidates.length} candidates`);
if(!candidates.some(c=>c.playerId===brazilian.id))throw new Error('Global scouting candidate list omitted a known background identity');
console.log(`[smoke-people-bundle] source=${manifest.sources.openfootball.snapshotCommit} · bundle=${players.length} · imported=${real.length} · adopted=${report.players.adoptedRuntime} · background=${pool.backgroundReal} · canonicalBRA=OK · scouting=${candidates.length} · duplicates=0 · loadMs=${elapsed} · scoutMs=${scoutMs}`);
