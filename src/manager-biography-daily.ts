import type { World } from './engine';
import { clubDressingRoom } from './dressing-room';
import { managerByClub } from './manager-character';
import { managerInitialAuthority, managerPlayerCredibility, managerTrainingEffect } from './manager-biography-effects';
import { managerPlayerRelationship } from './manager-interactions';
import { trainingState } from './training-engine';
import { scoutingState } from './scouting';
import { regionalKnowledge, improveRegionalKnowledge, type ScoutingRegion } from './staff';

const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const regionByCountry=(country:string):ScoutingRegion=>{
  const c=country.toLowerCase();
  if(['brasil','brazil','argentina','uruguai','uruguay','paraguai','paraguay','chile','colombia','colômbia','peru','bolivia','bolívia','ecuador','venezuela'].some(x=>c.includes(x)))return c.includes('brasil')||c.includes('brazil')?'Brazil':'SouthAmerica';
  if(['portugal','espanha','spain','italia','itália','italy','france','frança','germany','alemanha','england','inglaterra','netherlands','holanda','belgium','bélgica'].some(x=>c.includes(x)))return 'Europe';
  if(['usa','estados unidos','canada','canadá','mexico','méxico'].some(x=>c.includes(x)))return 'NorthAmerica';
  return 'Africa';
};

function tacticalFit(world:World,clubId:string):number{
  const m=managerByClub(world,clubId),club=world.clubs.find(c=>c.id===clubId);if(!m||!club)return 1;
  const t=club.tactics,p=m.tactical;
  const diff=Math.abs(t.tempo-p.tempoPreference)+Math.abs(t.pressing-p.pressingPreference)+Math.abs(t.defensiveLine-p.defensiveLinePreference)+Math.abs(t.width-p.widthPreference);
  const style=(t.passingStyle==='short'?p.possessionPreference:t.passingStyle==='direct'?p.directness:55);
  return clamp(1.08-diff/1800+(style-50)/700,.9,1.12);
}

function applyAuthority(world:World,clubId:string):void{
  const m=managerByClub(world,clubId),room=clubDressingRoom(world,clubId);if(!m||!room)return;
  const target=managerInitialAuthority(world,clubId);
  room.managerAuthority=clamp(room.managerAuthority+(target-room.managerAuthority)*.035);
  for(const p of world.clubs.find(c=>c.id===clubId)?.players??[]){
    const rel=managerPlayerRelationship(world,clubId,p.id);if(!rel)continue;
    const credibility=managerPlayerCredibility(world,clubId,p);
    rel.credibility=clamp(rel.credibility+(credibility-rel.credibility)*.018);
    if(m.reputation.formerPlayerPrestige>=75&&p.age>=28)rel.respect=clamp(rel.respect+.015);
    if(m.age<p.age-4&&m.reputation.formerPlayerPrestige<35)rel.respect=clamp(rel.respect-.008);
  }
}

function applyTrainingKnowledge(world:World,clubId:string):void{
  const m=managerByClub(world,clubId),club=world.clubs.find(c=>c.id===clubId),ts=trainingState(world).clubs.get(clubId);if(!m||!club||!ts)return;
  const fit=tacticalFit(world,clubId);
  for(const p of club.players){const ps=ts.players.get(p.id);if(!ps)continue;
    const tactical=managerTrainingEffect(world,clubId,p,'teamShape')*fit;
    const role=managerTrainingEffect(world,clubId,p,'roleWork');
    const youth=p.age<=21?(.008+(m.knowledge.youthDevelopment-50)/10000):0;
    ps.tacticalFamiliarity.buildUp=clamp(ps.tacticalFamiliarity.buildUp+(tactical-1)*.055);
    ps.tacticalFamiliarity.pressing=clamp(ps.tacticalFamiliarity.pressing+(tactical-1)*.05);
    ps.tacticalFamiliarity.defensiveShape=clamp(ps.tacticalFamiliarity.defensiveShape+(tactical-1)*.05);
    ps.tacticalFamiliarity.transition=clamp(ps.tacticalFamiliarity.transition+(tactical-1)*.05);
    ps.roleProgress=clamp(ps.roleProgress+(role-1)*.04+youth);
    if(p.position==='GK')ps.roleProgress=clamp(ps.roleProgress+(m.knowledge.goalkeeping-50)/8500);
    if(ps.individual&&p.age<=21)ps.individual.satisfaction=clamp(ps.individual.satisfaction+(m.knowledge.youthDevelopment-50)/9000);
  }
}

function applyNetwork(world:World,clubId:string):void{
  const m=managerByClub(world,clubId);if(!m)return;
  const regions=new Set<ScoutingRegion>();
  for(const e of m.playingCareer)regions.add(regionByCountry(e.country));
  for(const e of m.staffCareer)regions.add(regionByCountry(e.country));
  for(const c of m.ambition.preferredCountries)regions.add(regionByCountry(c));
  for(const region of regions){const current=regionalKnowledge(world,clubId,region);if(current<92)improveRegionalKnowledge(world,clubId,region,.015+(m.knowledge.networking/10000));}
  const scout=scoutingState(world);for(const a of scout.assignments.filter(x=>x.observerClubId===clubId&&x.active)){
    if(!regions.has(a.region))continue;const k=scout.knowledge.get(`${clubId}::${a.playerId}`);if(!k)continue;
    k.progress=clamp(k.progress+.025+(m.knowledge.scouting+m.knowledge.networking-100)/8000);
    k.level=(k.progress>=92?5:k.progress>=76?4:k.progress>=56?3:k.progress>=32?2:k.progress>=14?1:0) as 0|1|2|3|4|5;
  }
}

export function tickManagerBiographyEffects(world:World,date:string):void{
  void date;
  for(const club of world.clubs){if(!managerByClub(world,club.id))continue;applyAuthority(world,club.id);applyTrainingKnowledge(world,club.id);applyNetwork(world,club.id);}
}
