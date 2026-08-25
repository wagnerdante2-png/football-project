import type { Player, World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { activeInternationalWindow } from './international-calendar-v1';
import { assignInternationalDuty, dutiesForWindow, reportForInternationalDuty, releaseFromInternationalDuty, withdrawFromInternationalDuty } from './international-duty-v1';
import { selectNationalSquad } from './national-team-selection-v1';
import { isUnavailable } from './injuries';
import { playerProfile } from './player-profile-v2';
import { queueWorldEvent, worldCore } from './world-core-v2';

type RuntimeState={opened:Set<string>;closed:Set<string>};const states=new WeakMap<World,RuntimeState>();function state(w:World){let s=states.get(w);if(!s){s={opened:new Set(),closed:new Set()};states.set(w,s)}return s}
const continentOf=(w:World,countryId:string)=>worldCore(w).countries.get(countryId)?.continent;
function travelEstimate(w:World,p:Player,countryId:string){const profile=playerProfile(w,p.id),origin=profile?.birthCountryId??countryId;if(origin===countryId)return{km:500,timezoneShift:0};const a=continentOf(w,origin),b=continentOf(w,countryId);if(a&&b&&a===b)return{km:2200,timezoneShift:2};return{km:7800,timezoneShift:5}}
export function openInternationalWindowIfNeeded(w:World,date=worldCore(w).date){const win=activeInternationalWindow(w,date),s=state(w);if(!win||date!==win.start||s.opened.has(win.id))return{window:win,created:0};s.opened.add(win.id);let created=0;const teams=footballDataSnapshot(w).nationalTeams.filter(t=>t.active&&t.teamKind==='senior'&&t.gender==='men');for(const t of teams){const candidates=w.clubs.flatMap(c=>c.players).filter(p=>{const pr=playerProfile(w,p.id);return pr?.eligibility.some(e=>e.countryId===t.countryId&&e.eligible)&&!isUnavailable(w,p.id)});if(candidates.length<1)continue;const squad=selectNationalSquad(w,{teamId:t.id,countryId:t.countryId,date,size:26});if(!squad.members.length)continue;assignInternationalDuty(w,squad,win,(p)=>travelEstimate(w,p,t.countryId));for(const m of squad.members){reportForInternationalDuty(w,m.playerId,win.id);queueWorldEvent(w,{date,type:'InternationalCallUpConfirmed',scope:'person',entityIds:[m.playerId,m.clubId,t.id],importance:3,payload:{windowId:win.id,countryId:t.countryId}});created++}}
return{window:win,created}}
export function processInternationalWindowDay(w:World,date=worldCore(w).date){const win=activeInternationalWindow(w,date);if(!win)return{window:undefined,withdrawn:0,released:0};let withdrawn=0,released=0;for(const d of dutiesForWindow(w,win.id)){if(d.status==='withTeam'&&isUnavailable(w,d.playerId)){withdrawFromInternationalDuty(w,d.playerId,win.id,'injury',true);queueWorldEvent(w,{date,type:'InternationalDutyWithdrawal',scope:'person',entityIds:[d.playerId,d.clubId,d.teamId],importance:4,payload:{reason:'injury',windowId:win.id}});withdrawn++}}
if(date===win.end&&!state(w).closed.has(win.id)){state(w).closed.add(win.id);for(const d of dutiesForWindow(w,win.id)){if(d.status==='withTeam'||d.status==='called'||d.status==='reported'){releaseFromInternationalDuty(w,d.playerId,win.id);queueWorldEvent(w,{date,type:'InternationalDutyReleased',scope:'person',entityIds:[d.playerId,d.clubId,d.teamId],importance:2,payload:{windowId:win.id,minutes:d.minutes,matches:d.matches}});released++}}}
return{window:win,withdrawn,released}}
export function tickInternationalCalendar(w:World,date=worldCore(w).date){const opened=openInternationalWindowIfNeeded(w,date),processed=processInternationalWindowDay(w,date);return{opened,processed}}
