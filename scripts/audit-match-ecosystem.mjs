import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const files={
  daily:read('src/daily-simulation.ts'),
  medical:read('src/medical-simulation.ts'),
  integration:read('src/match-world-integration-v2.ts'),
  broadcast:read('src/match-broadcast-v2.ts'),
  lifecycle:read('src/match-lifecycle-v2.ts'),
  adapter:read('src/matchday-v2-broadcast-adapter.ts'),
  center:read('src/matchday-center-v1.ts'),
  setpieces:read('src/match-setpieces-v1.ts')
};

const hard=[];const warnings=[];const ok=[];
function requireContract(label,condition,detail){(condition?ok:hard).push({label,detail})}
function warn(label,condition,detail){if(condition)warnings.push({label,detail})}

requireContract('calendar->match date context',/worldCore\(world\)\.date/.test(files.medical)&&/simulateFixtureV2\(world,managedFixture,\{date:matchDate,competitionId\}\)/.test(files.medical),'Managed match must inherit the actual World Core date even when the caller omits it.');
requireContract('medical/training/human context->match',/personalPerformanceFactor/.test(files.medical)&&/dressingRoomPerformanceFactor/.test(files.medical)&&/trainingPerformanceFactor/.test(files.medical)&&/managerRelationshipPerformanceFactor/.test(files.medical),'Availability, medicine, personal life, dressing room, training and manager relationships must alter match inputs.');
requireContract('partnership chemistry->match',/partnershipBonus/.test(files.medical)&&/chemistryPerformanceFactor/.test(files.medical),'Persistent teammate chemistry must feed back into match performance, not only be written after matches.');
requireContract('background match->player ecosystem',/applyBackgroundMatchConsequences/.test(files.medical),'Fast background fixtures must still update persistent player form, exposure, positional experience and partnerships.');
requireContract('registration/international duty->match',/eligibleClubForCompetition/.test(files.integration)&&/playerUnavailableForClub/.test(files.integration),'Competition eligibility and international-duty availability must constrain the squad used by V2.');
requireContract('discipline->match and back',/eligibleByDiscipline/.test(files.integration)&&/serveSuspensionForFixture/.test(files.integration)&&/recordMatchDiscipline/.test(files.integration),'Suspensions must affect selection and match cards must persist.');
requireContract('travel/weather->match',/applyAwayTravelLoad/.test(files.integration)&&/applyWorldWeatherToMatch/.test(files.integration),'Travel and world weather must reach the physical simulation.');
requireContract('physical match->player world state',/applyPhysicalCarryover/.test(files.integration)&&/recordMatchExposure/.test(files.integration)&&/recordPartnershipMinutes/.test(files.integration)&&/recordPositionMinutes/.test(files.integration),'Minutes, fatigue, partnerships, position experience and injuries must leave the match.');
requireContract('match->season history',/persistCompletedMatchV2/.test(files.integration),'Completed V2 fixtures must enter persistent season history.');
requireContract('engine->broadcast tape',/buildMatchBroadcastTape/.test(files.integration)&&/broadcastTape/.test(files.integration),'The same V2 state that resolves the result must produce the replay tape.');
requireContract('lifecycle->broadcast',/lifecycleEvents/.test(files.broadcast)&&/'kickoff'/.test(files.broadcast)&&/'fulltime'/.test(files.broadcast),'Kickoff, interval/restarts and full-time lifecycle must reach the narrator/replay tape.');
requireContract('broadcast->UI event stream',/broadcastTape/.test(files.adapter)&&/broadcastStories/.test(files.center)&&/touchline:match-story/.test(files.center),'V2 broadcast actions must become canonical match stories and be dispatched live to the Match Center UI.');
requireContract('synthetic set pieces isolated from V2',/broadcastTape\)return/.test(files.setpieces),'Legacy synthetic set-piece enrichment must never alter a physical V2 fixture.');
requireContract('daily match consequence ticks',/tickDressingRoom\(world,date\)/.test(files.daily)&&/tickManagerInteractions\(world,date\)/.test(files.daily)&&/tickInstitution\(world,date\)/.test(files.daily),'After a league match the daily ecosystem must re-run consequence consumers.');

warn('background fixtures still use legacy engine',/playCurrentRound\(world\)/.test(files.medical),'Background fixtures remain fast for performance, but they now pass through a consequence bridge. V2-only spatial/officiating detail is still exclusive to watched/managed fixtures.');
warn('legacy event projection is narrower than V2 tape',/fixture\.events=mapEvents/.test(files.integration),'fixture.events exposes only a compact subset for legacy panels. New match UI should prefer broadcastTape/actionMap for fidelity.');

console.log('=== TOUCHLINE MATCH ECOSYSTEM AUDIT ===');
for(const x of ok)console.log(`OK   ${x.label}`);
for(const x of warnings)console.log(`WARN ${x.label}: ${x.detail}`);
for(const x of hard)console.log(`FAIL ${x.label}: ${x.detail}`);
const report={generatedAt:new Date().toISOString(),ok,warnings,hard};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/match-ecosystem-audit.json'),JSON.stringify(report,null,2));
if(hard.length)throw new Error(`Match ecosystem contracts failed: ${hard.map(x=>x.label).join(', ')}`);
