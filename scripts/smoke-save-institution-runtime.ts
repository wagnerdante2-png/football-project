import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { serializeSave, restoreSave } from '../src/save-game';
import { clubGovernance, snapshotClubGovernance } from '../src/club-governance';
import { clubAssets, snapshotClubAssets } from '../src/club-assets-media';
import { clubCommercial, snapshotCommercial } from '../src/club-commercial-engine';
import { snapshotStaffCareer, staffCareerState } from '../src/staff-career';

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}
function stable(x:unknown){return JSON.stringify(x)}

const world=createBrazilRealWorld2026();
const club=world.clubs[0];
assert(club,'No club available for institution save smoke');

const governance=clubGovernance(world,club.id);
governance.managerConfidence=37;
governance.fanApproval=81;
governance.ownership='saf';

const assets=clubAssets(world,club.id);
assets.pitchLength=103;
assets.pitchWidth=66;
assets.facilities.trainingCentre.level=73;
assets.projects.push({key:'academy',cost:12_000_000,monthsLeft:5,targetLevel:68});

const commercial=clubCommercial(world,club.id);
commercial.brandStrength=77;
commercial.shirtsSoldSeason=4321;
commercial.seasonRevenue.merchandise=1_234_567;
commercial.partnerClubs.push({clubId:'save-smoke-partner',country:'AR',tier:2,relationship:74,youthPriority:true,loanPriority:true,firstOption:false,annualCost:250_000});

const staff=staffCareerState(world);
const firstProfile=[...staff.profiles.values()][0];
assert(firstProfile,'No technical staff career profile available for save smoke');
firstProfile.promotionPressure=64;
firstProfile.delegatedResponsibilities=['training'];

const before={
  governance:snapshotClubGovernance(world),
  assets:snapshotClubAssets(world),
  commercial:snapshotCommercial(world),
  staffCareer:snapshotStaffCareer(world)
};
const raw=serializeSave(world);
const parsed=JSON.parse(raw) as {schemaVersion:number;clubGovernance?:unknown;clubAssets?:unknown;commercial?:unknown;staffCareer?:unknown};
assert(parsed.schemaVersion===17,`Expected save schema 17, got ${parsed.schemaVersion}`);
assert(parsed.clubGovernance&&parsed.clubAssets&&parsed.commercial&&parsed.staffCareer,'Institution runtime snapshots missing from serialized save');

const restored=restoreSave(raw);
const after={
  governance:snapshotClubGovernance(restored),
  assets:snapshotClubAssets(restored),
  commercial:snapshotCommercial(restored),
  staffCareer:snapshotStaffCareer(restored)
};
assert(stable(after.governance)===stable(before.governance),'Club governance changed across save roundtrip');
assert(stable(after.assets)===stable(before.assets),'Club assets changed across save roundtrip');
assert(stable(after.commercial)===stable(before.commercial),'Commercial state changed across save roundtrip');
assert(stable(after.staffCareer)===stable(before.staffCareer),'Staff career state changed across save roundtrip');
assert(clubGovernance(restored,club.id).managerConfidence===37,'Manager confidence consequence was lost');
assert(clubAssets(restored,club.id).projects[0]?.monthsLeft===5,'Facility project progress was lost');
assert(clubCommercial(restored,club.id).shirtsSoldSeason===4321,'Commercial season progress was lost');
console.log(`[smoke-save-institution] club=${club.name} · governance/assets/commercial/staffCareer roundtrip=OK · schema=${parsed.schemaVersion}`);
