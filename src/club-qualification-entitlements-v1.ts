import type { World } from './engine';
import { footballDataSnapshot, registerMembership } from './world-football-data-v1';

export type QualificationEntitlement={teamId:string;fromCompetitionId:string;toCompetitionId:string;season:number;reason:'domesticCupWinner'|'continentalChampion';extraSlot:boolean};
const cupTargets:Record<string,string>={
 'comp-bra-copa':'comp-conmebol-libertadores',
 'comp-eng-fa-cup':'comp-uefa-el',
 'comp-ger-dfb-pokal':'comp-uefa-el',
 'comp-esp-copa-del-rey':'comp-uefa-el',
 'comp-ita-coppa-italia':'comp-uefa-el',
 'comp-fra-coupe-de-france':'comp-uefa-el',
 'comp-por-taca-portugal':'comp-uefa-el',
 'comp-ned-knvb-cup':'comp-uefa-el'
};
const continentalTargets:Record<string,string>={'comp-conmebol-libertadores':'comp-conmebol-libertadores','comp-conmebol-sudamericana':'comp-conmebol-libertadores','comp-uefa-cl':'comp-uefa-cl','comp-uefa-el':'comp-uefa-cl','comp-uefa-conf':'comp-uefa-el'};
export function qualificationEntitlements(w:World,sourceSeason:number,targetSeason=sourceSeason+1){const snap=footballDataSnapshot(w),out:QualificationEntitlement[]=[];for(const t of snap.titles.filter(x=>Number(x.season)===sourceSeason&&x.teamKind==='club')){const domestic=cupTargets[t.competitionId],continental=continentalTargets[t.competitionId];if(domestic)out.push({teamId:t.teamId,fromCompetitionId:t.competitionId,toCompetitionId:domestic,season:targetSeason,reason:'domesticCupWinner',extraSlot:false});if(continental)out.push({teamId:t.teamId,fromCompetitionId:t.competitionId,toCompetitionId:continental,season:targetSeason,reason:'continentalChampion',extraSlot:true})}const seen=new Set<string>();return out.filter(x=>{const k=`${x.teamId}:${x.toCompetitionId}`;if(seen.has(k))return false;seen.add(k);return true})}
export function applyQualificationEntitlements(w:World,sourceSeason:number,targetSeason=sourceSeason+1){const xs=qualificationEntitlements(w,sourceSeason,targetSeason),snap=footballDataSnapshot(w),created:QualificationEntitlement[]=[];for(const x of xs){const exists=snap.memberships.some(m=>m.teamId===x.teamId&&m.competitionId===x.toCompetitionId&&Number(m.season)===targetSeason&&m.status==='qualified');if(exists)continue;registerMembership(w,{season:String(targetSeason),competitionId:x.toCompetitionId,teamId:x.teamId,teamKind:'club',status:'qualified',source:'simulated',provenance:[{sourceId:'club-qualification-entitlements-v1',historical:false,confidence:100}]});created.push(x)}return{created,count:created.length}}
export function entitlementTeamsFor(w:World,toCompetitionId:string,sourceSeason:number,targetSeason=sourceSeason+1){return qualificationEntitlements(w,sourceSeason,targetSeason).filter(x=>x.toCompetitionId===toCompetitionId)}
