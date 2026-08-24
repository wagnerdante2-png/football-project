import type { Player, Position, World } from './engine';
import { managerByClub, type ManagerCharacter } from './manager-character';

const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const norm=(s:string)=>s.trim().toLowerCase();

function yearsAtLevel(m:ManagerCharacter):number{return m.playingCareer.reduce((sum,e)=>sum+Math.max(0,e.endYear-e.startYear),0);}
function titleCount(m:ManagerCharacter):number{return m.playingCareer.reduce((s,e)=>s+e.titles.length,0)+m.staffCareer.reduce((s,e)=>s+e.achievements.length,0);}
function awardCount(m:ManagerCharacter):number{return m.playingCareer.reduce((s,e)=>s+e.awards.length,0);}
function positionAffinity(manager:ManagerCharacter,position:Position):number{
  if(manager.primaryPlayingPosition===position)return 1;
  const p=manager.primaryPlayingPosition;
  if(!p)return 0;
  const groups:Position[][]=[['GK'],['RB','CB','LB'],['DM','CM','AM'],['RW','LW','ST']];
  return groups.some(g=>g.includes(p)&&g.includes(position)) ? .55 : 0;
}

export function managerInitialAuthority(world:World,clubId:string):number{
  const m=managerByClub(world,clubId);if(!m)return 58;
  const rep=m.reputation.domestic*.32+m.reputation.continental*.18+m.reputation.formerPlayerPrestige*.28+m.reputation.coachingPrestige*.22;
  const elite=m.playingLevel==='elite'?12:m.playingLevel==='professional'?7:m.playingLevel==='semiPro'?3:0;
  const trophies=Math.min(10,titleCount(m)*1.5+awardCount(m)*2);
  const experience=Math.min(8,m.experienceYears*.28);
  return Math.round(clamp(30+rep*.42+elite+trophies+experience));
}

export function managerPlayerCredibility(world:World,clubId:string,player:Player):number{
  const m=managerByClub(world,clubId);if(!m)return 50;
  let score=managerInitialAuthority(world,clubId)*.55+m.knowledge.manManagement*.18+m.knowledge.tactics*.12+m.reputation.formerPlayerPrestige*.15;
  score+=positionAffinity(m,player.position)*8;
  if(m.age<player.age-3&&m.reputation.formerPlayerPrestige<45)score-=7;
  if(m.playingLevel==='elite')score+=5;
  if(m.social.languages.some(l=>norm(l)==='português'||norm(l)==='portuguese'))score+=1;
  return clamp(score);
}

export function managerTrainingEffect(world:World,clubId:string,player:Player,sessionKind:string):number{
  const m=managerByClub(world,clubId);if(!m)return 1;
  let skill=m.knowledge.training*.4+m.knowledge.tactics*.25+m.knowledge.manManagement*.15+m.knowledge.medicalAwareness*.1+m.knowledge.youthDevelopment*.1;
  if(player.age<=21)skill=skill*.78+m.knowledge.youthDevelopment*.22;
  if(player.position==='GK')skill=skill*.78+m.knowledge.goalkeeping*.22;
  if(sessionKind==='videoAnalysis'||sessionKind==='opponentSpecific')skill=skill*.7+m.knowledge.dataAnalysis*.3;
  if(sessionKind==='setPieces')skill=skill*.75+m.knowledge.setPieces*.25;
  if(sessionKind==='rehabilitation'||sessionKind==='recovery')skill=skill*.72+m.knowledge.medicalAwareness*.28;
  const philosophy=sessionKind==='technical'?m.training.technical:sessionKind==='endurance'||sessionKind==='speed'?m.training.physical:sessionKind==='recovery'||sessionKind==='rehabilitation'?m.training.recovery:sessionKind==='videoAnalysis'?m.training.videoAnalysis:sessionKind==='opponentSpecific'?m.training.opponentPreparation:m.training.tactical;
  const affinity=positionAffinity(m,player.position);
  return clamp(.82+skill/250+(philosophy-50)/900+affinity*.025,.78,1.22);
}

export function managerScoutingJudgementBonus(world:World,clubId:string,kind:'ability'|'potential'|'value'):number{
  const m=managerByClub(world,clubId);if(!m)return 0;
  if(kind==='value')return (m.knowledge.scouting*.35+m.knowledge.dataAnalysis*.25+m.knowledge.financialAwareness*.25+m.knowledge.networking*.15-50)*.12;
  const base=kind==='potential'?m.knowledge.scouting*.5+m.knowledge.youthDevelopment*.25+m.knowledge.dataAnalysis*.25:m.knowledge.scouting*.5+m.knowledge.tactics*.3+m.knowledge.dataAnalysis*.2;
  return (base-50)*.14;
}

export function managerRegionalNetworkBonus(world:World,clubId:string,countryOrRegion:string):number{
  const m=managerByClub(world,clubId);if(!m)return 0;
  const target=norm(countryOrRegion);let score=0;
  for(const e of m.playingCareer)if(norm(e.country)===target)score+=Math.min(18,(e.endYear-e.startYear)*2.2);
  for(const e of m.staffCareer)if(norm(e.country)===target)score+=Math.min(20,(e.endYear-e.startYear)*2.5);
  if(m.ambition.preferredCountries.some(c=>norm(c)===target))score+=5;
  if(m.social.nationality&&target.includes(norm(m.social.nationality)))score+=8;
  score+=(m.knowledge.networking-50)*.08;
  return clamp(score,0,28);
}

export function managerRefereeingDisciplineFactor(world:World,clubId:string):number{
  const m=managerByClub(world,clubId);if(!m)return 1;
  const knowledge=m.knowledge.refereeing;
  const discipline=m.personality.discipline;
  return clamp(1-(knowledge-50)/700-(discipline-50)/1200,.9,1.06);
}

export function managerAdaptationFactor(world:World,clubId:string):number{
  const m=managerByClub(world,clubId);if(!m)return 1;
  const languages=Math.min(8,Math.max(0,m.social.languages.length-1)*2);
  const overseas=new Set([...m.playingCareer.map(e=>norm(e.country)),...m.staffCareer.map(e=>norm(e.country))]).size;
  return clamp(.88+m.personality.adaptability/500+languages/100+Math.min(8,overseas*1.5)/100,.88,1.16);
}

export function managerProfileSummary(world:World,clubId:string){
  const m=managerByClub(world,clubId);if(!m)return undefined;
  return{authority:managerInitialAuthority(world,clubId),training:Math.round((m.knowledge.training+m.knowledge.tactics)/2),people:m.knowledge.manManagement,scouting:m.knowledge.scouting,data:m.knowledge.dataAnalysis,refereeing:m.knowledge.refereeing,networking:m.knowledge.networking,experienceYears:yearsAtLevel(m),titles:titleCount(m),awards:awardCount(m)};
}
