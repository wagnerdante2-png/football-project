import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { serializeSave, restoreSave } from '../src/save-game';
import { clubGovernance, snapshotClubGovernance } from '../src/club-governance';
import { clubAssets, signMediaDeal, snapshotClubAssets } from '../src/club-assets-media';
import { scheduleCommercialAppearance, snapshotCommercial } from '../src/club-commercial-engine';

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}

const a=createBrazilRealWorld2026();
const b=createBrazilRealWorld2026();
const clubA=a.clubs[0],clubB=b.clubs[0];
assert(clubA&&clubB,'World isolation smoke requires a club in each world');
assert(clubA.id===clubB.id,'Reference worlds do not expose the same first club identity');

const govA=clubGovernance(a,clubA.id),govB=clubGovernance(b,clubB.id);
assert(govA.board[0]?.id==='board-1','World A governance did not start its own identity sequence');
assert(govB.board[0]?.id==='board-1','World B governance inherited another world identity sequence');
assert(snapshotClubGovernance(a).nextId===snapshotClubGovernance(b).nextId,'Governance sequence diverged only because another world was initialized');

const assetsA=clubAssets(a,clubA.id),assetsB=clubAssets(b,clubB.id);
assert(assetsA.mediaDeals[0]?.id==='media-1','World A asset media sequence did not start locally');
assert(assetsB.mediaDeals[0]?.id==='media-1','World B asset media sequence inherited another world');

const appearanceA=scheduleCommercialAppearance(a,clubA.id,'manager-a','manager','sportsProgram',100_000,35,'2026-08-27');
const appearanceB=scheduleCommercialAppearance(b,clubB.id,'manager-b','manager','sportsProgram',100_000,35,'2026-08-27');
assert(appearanceA.id==='appearance-1','World A commercial identity sequence did not start locally');
assert(appearanceB.id==='appearance-1','World B commercial identity sequence inherited World A');

signMediaDeal(a,clubA.id,{kind:'streaming',annualValue:2_000_000,years:2,interviewMinimum:2,pressConferenceMinimum:1,brandExposure:8},'2026-08-27');
const aAssetBefore=snapshotClubAssets(a),aCommercialBefore=snapshotCommercial(a),aGovernanceBefore=snapshotClubGovernance(a);
const bAssetBefore=snapshotClubAssets(b),bCommercialBefore=snapshotCommercial(b),bGovernanceBefore=snapshotClubGovernance(b);

assert(JSON.stringify(snapshotClubAssets(b))===JSON.stringify(bAssetBefore),'Mutating World A assets contaminated World B');
assert(JSON.stringify(snapshotCommercial(b))===JSON.stringify(bCommercialBefore),'Mutating World A commercial state contaminated World B');
assert(JSON.stringify(snapshotClubGovernance(b))===JSON.stringify(bGovernanceBefore),'Mutating World A governance contaminated World B');

const restored=restoreSave(serializeSave(a));
assert(JSON.stringify(snapshotClubAssets(restored))===JSON.stringify(aAssetBefore),'World-local asset identity sequence was not persisted');
assert(JSON.stringify(snapshotCommercial(restored))===JSON.stringify(aCommercialBefore),'World-local commercial identity sequence was not persisted');
assert(JSON.stringify(snapshotClubGovernance(restored))===JSON.stringify(aGovernanceBefore),'World-local governance identity sequence was not persisted');

const restoredClub=restored.clubs.find(c=>c.id===clubA.id)!;
const nextAppearance=scheduleCommercialAppearance(restored,restoredClub.id,'manager-a','manager','clubEvent',80_000,30,'2026-08-28');
assert(nextAppearance.id==='appearance-2',`Commercial identity sequence did not continue after save/load: ${nextAppearance.id}`);
assert(snapshotCommercial(b).nextId===bCommercialBefore.nextId,'Restoring World A advanced World B commercial sequence');

console.log(`[smoke-world-isolation] club=${clubA.name} · governance/assets/commercial ids isolated · save continuity=OK`);
