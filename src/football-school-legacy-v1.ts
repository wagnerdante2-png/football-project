import type { Player, World } from './engine';
import { footballSchool, type SchoolProspect } from './football-school-v1';
import { userManager } from './manager-character';
import { deterministicRandom, queueWorldEvent, worldEvents } from './world-core-v2';

export type FootballSchoolLegacyTick={checked:number;events:string[]};
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
const daysBetween=(a:string,b:string)=>Math.floor((Date.parse(`${b}T12:00:00Z`)-Date.parse(`${a}T12:00:00Z`))/86400000);
function playerById(w:World,id:string):Player|undefined{for(const c of w.clubs){const p=c.players.find(x=>x.id===id);if(p)return p}return undefined}
function graduationDate(w:World,p:SchoolProspect){return worldEvents(w,{type:'FootballSchoolProspectGraduated',entityId:p.playerId})[0]?.date}
function emitted(w:World,type:string,p:SchoolProspect){return worldEvents(w,{type,entityId:p.playerId}).length>0}
function emit(w:World,date:string,type:string,p:SchoolProspect,importance:number,payload:Record<string,unknown>){const s=footballSchool(w);if(!s)return;queueWorldEvent(w,{date,type,scope:'person',entityIds:[p.playerId,p.id,s.id,s.managerId],importance,payload:{name:p.name,schoolId:s.id,teamName:s.teamName,managerId:s.managerId,relationshipOutcome:p.relationshipOutcome,...payload}})}
function currentClubName(w:World,p:Player){return w.clubs.find(c=>c.id===p.clubId)?.name??p.clubId}

export function tickFootballSchoolLegacy(w:World,date:string):FootballSchoolLegacyTick|undefined{
 const s=footballSchool(w),m=userManager(w);if(!s||!m||m.id!==s.managerId)return;const events:string[]=[];let checked=0;
 for(const p of s.prospects.filter(x=>x.status==='graduated')){checked++;const player=playerById(w,p.playerId);if(!player)continue;const grad=graduationDate(w,p);if(!grad)continue;const elapsed=daysBetween(grad,date),relationship=p.relationshipOutcome??'neutral';
  if(elapsed>=365&&player.currentAbility>=65&&(relationship==='mentor'||relationship==='positive')&&!emitted(w,'FootballSchoolAlumnusCreditsManager',p)){
   emit(w,date,'FootballSchoolAlumnusCreditsManager',p,player.currentAbility>=80?4:3,{clubId:player.clubId,clubName:currentClubName(w,player),currentAbility:player.currentAbility,managerBond:p.managerBond,yearsSinceSchool:Number((elapsed/365.25).toFixed(1))});s.mediaInterest=clamp(s.mediaInterest+4);s.reputation=clamp(s.reputation+2);m.reputation.domestic=clamp(m.reputation.domestic+1);m.reputation.coachingPrestige=clamp(m.reputation.coachingPrestige+1.5);m.careerPoints+=1;events.push('manager-credit');
  }
  if(player.currentAbility>=78&&!emitted(w,'FootballSchoolAlumnusBreakthrough',p)){
   emit(w,date,'FootballSchoolAlumnusBreakthrough',p,player.currentAbility>=88?5:4,{clubId:player.clubId,clubName:currentClubName(w,player),currentAbility:player.currentAbility,truePotential:p.truePotential,potentialTier:p.potentialView.tier});s.mediaInterest=clamp(s.mediaInterest+6);s.reputation=clamp(s.reputation+3);events.push('breakthrough');
  }
  if(elapsed>=730&&p.managerBond>=72&&player.currentAbility>=68&&!emitted(w,'FootballSchoolAlumnusCommunityReturn',p)&&deterministicRandom(w,'football-school',`${p.playerId}:${date.slice(0,7)}:community-return`)<.08){
   emit(w,date,'FootballSchoolAlumnusCommunityReturn',p,3,{clubId:player.clubId,clubName:currentClubName(w,player),currentAbility:player.currentAbility,managerBond:p.managerBond});s.communityTrust=clamp(s.communityTrust+5);s.mediaInterest=clamp(s.mediaInterest+3);for(const youth of s.prospects.filter(x=>x.status==='active')){youth.motivation=clamp(youth.motivation+2);youth.confidence=clamp(youth.confidence+1)}events.push('community-return');
  }
  if(relationship==='future-rival'&&m.currentClubId&&player.clubId!==m.currentClubId&&!emitted(w,'FootballSchoolFutureRivalNarrative',p)){
   const fixture=w.fixtures.find(f=>f.round===w.round&&!f.played&&((f.home===player.clubId&&f.away===m.currentClubId)||(f.away===player.clubId&&f.home===m.currentClubId)));if(fixture&&player.currentAbility>=62){emit(w,date,'FootballSchoolFutureRivalNarrative',p,4,{playerClubId:player.clubId,managerClubId:m.currentClubId,round:w.round,currentAbility:player.currentAbility,managerBond:p.managerBond});s.mediaInterest=clamp(s.mediaInterest+5);events.push('future-rival')}
  }
  if(p.truePotential>=94&&player.currentAbility>=90&&!emitted(w,'FootballSchoolLegendaryAlumnus',p)){
   emit(w,date,'FootballSchoolLegendaryAlumnus',p,5,{clubId:player.clubId,clubName:currentClubName(w,player),currentAbility:player.currentAbility,truePotential:p.truePotential,managerBond:p.managerBond});s.reputation=clamp(s.reputation+8);s.communityTrust=clamp(s.communityTrust+6);s.mediaInterest=clamp(s.mediaInterest+10);m.reputation.domestic=clamp(m.reputation.domestic+2);m.reputation.coachingPrestige=clamp(m.reputation.coachingPrestige+3);m.careerPoints+=2;events.push('legendary-alumnus');
  }
 }
 return{checked,events}
}
