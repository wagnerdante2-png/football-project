import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { ensureActiveWorldFootballFoundation } from '../src/world-football-foundation-runtime-v1';
import { loadPublicPeople2026 } from '../src/real-world-2026-loader-v1';
import { realPlayersV2 } from '../src/real-world-player-import-v2';
import { selectNationalSquad } from '../src/national-team-selection-v1';
import { footballDataSnapshot } from '../src/world-football-data-v1';
import { snapshotWorldFoundation, restoreWorldFoundation } from '../src/world-save-schema-v2';

const world=createBrazilRealWorld2026();
ensureActiveWorldFootballFoundation(world);
const [clubA,clubB]=world.clubs;
if(!clubA||!clubB)throw new Error('Population smoke requires at least two runtime clubs');
const brazil=footballDataSnapshot(world).nationalTeams.find(t=>t.countryId==='BRA'&&t.teamKind==='senior');
if(!brazil)throw new Error('Canonical Brazil national team missing');

const baseSeed={
 externalIds:{smoke:'global-person-001'},
 name:'Global Identity Smoke Player',dateOfBirth:'2000-01-02',heightCm:181,position:'CM' as const,
 nationalityCountryIds:['BR'],clubId:clubA.id,currentAbility:99,potentialAbility:99,
 provenance:[{source:'identity-smoke',sourceId:'global-person-001',snapshotDate:'2026-08-26',confidence:99,license:'test-only'}]
};
const first=loadPublicPeople2026(world,{players:[baseSeed],staff:[]});
if(first.players.inserted!==1)throw new Error(`Expected one inserted real player, got ${first.players.inserted}`);
const imported=realPlayersV2(world).find(p=>p.externalIds.smoke==='global-person-001');
if(!imported)throw new Error('Imported real player not found');
const persistentId=imported.id;
if(!imported.player.clubId||imported.player.clubId!==clubA.id)throw new Error('Initial club assignment failed');

const squad=selectNationalSquad(world,{teamId:brazil.id,countryId:'BRA',size:26});
if(!squad.members.some(m=>m.playerId===persistentId))throw new Error('National team did not reuse the club player identity after BR -> BRA normalization');
if(squad.members.find(m=>m.playerId===persistentId)?.clubId!==clubA.id)throw new Error('National squad club reference diverged from canonical player');

const moved=loadPublicPeople2026(world,{players:[{...baseSeed,clubId:clubB.id,provenance:[{...baseSeed.provenance[0],snapshotDate:'2026-08-27',confidence:100}]}],staff:[]});
if(moved.players.merged!==1||moved.players.duplicatesPrevented!==1)throw new Error('Re-import did not merge the same global identity');
const afterMove=realPlayersV2(world).find(p=>p.externalIds.smoke==='global-person-001');
if(afterMove?.id!==persistentId)throw new Error('Transfer/reassignment changed persistent player id');
if(afterMove.player.clubId!==clubB.id)throw new Error('Canonical transfer/reassignment did not update club');

const rosterLocations=world.clubs.filter(c=>c.players.some(p=>p.id===persistentId));
if(rosterLocations.length!==1||rosterLocations[0].id!==clubB.id)throw new Error(`Player exists in ${rosterLocations.length} club rosters after transfer`);
const identities=realPlayersV2(world).map(p=>p.identityKey);
if(new Set(identities).size!==identities.length)throw new Error('Duplicate real-player identity keys detected');
const allPlayerIds=world.clubs.flatMap(c=>c.players.map(p=>p.id));
if(new Set(allPlayerIds).size!==allPlayerIds.length)throw new Error('Duplicate player ids detected across club rosters');

const save=snapshotWorldFoundation(world,{gameVersion:'population-smoke'}),restored=createBrazilRealWorld2026();
ensureActiveWorldFootballFoundation(restored);restoreWorldFoundation(restored,save);
const restoredReal=realPlayersV2(restored).find(p=>p.externalIds.smoke==='global-person-001');
if(restoredReal?.id!==persistentId)throw new Error('Save/load changed persistent real-player identity');
const restoredLocations=restored.clubs.filter(c=>c.players.some(p=>p.id===persistentId));
if(restoredLocations.length!==1||restoredLocations[0].id!==clubB.id)throw new Error('Save/load recreated or misplaced real player');
const restoredIds=restored.clubs.flatMap(c=>c.players.map(p=>p.id));
if(new Set(restoredIds).size!==restoredIds.length)throw new Error('Save/load introduced duplicate player ids');

console.log(`[smoke-world-population] player=${persistentId} · club=${clubB.id} · nationalTeam=${brazil.id} · dedupe=OK · transferId=OK · saveLoadId=OK · rosterUniqueness=OK`);
