import type { World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { strongestClubMemories, managerAchievements } from './club-institutional-memory-v1';
import { deepClubRecordBook } from './club-record-book-v2';
import { clubReputation, clubRivalry } from './club-reputation-rivalry-v1';

const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));

export type HistoricalPressureProfile={
  clubId:string;
  legacyExpectation:number;
  titleDroughtPressure:number;
  traumaPressure:number;
  gloryMomentum:number;
  managerShadow:number;
  identityWeight:number;
  totalPressure:number;
  reasons:string[];
  sourceMemoryIds:string[];
};

export type HistoricalMatchContext={
  clubId:string;
  opponentId:string;
  rivalry:number;
  historicalPressure:number;
  motivation:number;
  anxiety:number;
  revengeFactor:number;
  confidenceFactor:number;
  reasons:string[];
  sourceMemoryIds:string[];
};

function memoryWeight(m:ReturnType<typeof strongestClubMemories>[number]){
  const audience=(m.audience.supporters*.45+m.audience.media*.3+m.audience.board*.25)/100;
  return (m.importance/100)*(m.memoryStrength/100)*audience;
}

export function clubHistoricalPressure(w:World,clubId:string):HistoricalPressureProfile{
  const rep=clubReputation(w,clubId),records=deepClubRecordBook(w,clubId),memories=strongestClubMemories(w,clubId,60),achievements=managerAchievements(w,clubId);
  const reasons:string[]=[],sourceMemoryIds:string[]=[];
  const titleDroughtPressure=clamp(records.currentTitleDrought*3.2+Math.max(0,rep.historical-55)*.35);
  if(records.currentTitleDrought>=4)reasons.push(`O clube vive um jejum de ${records.currentTitleDrought} temporadas sem título.`);
  let negative=0,positive=0,identity=0;
  for(const m of memories){
    const weight=memoryWeight(m);if(weight<.12)continue;
    if(m.sentiment==='negative'){negative+=weight*100;sourceMemoryIds.push(m.id)}
    if(m.sentiment==='positive'){positive+=weight*100;sourceMemoryIds.push(m.id)}
    if(m.permanent||['title','derby','relegation','record','era'].includes(m.type))identity+=weight*100;
  }
  const traumaPressure=clamp(negative*.22),gloryMomentum=clamp(positive*.18),identityWeight=clamp(identity*.16+rep.historical*.45);
  const managerRows=new Map<string,{score:number;titles:number}>();for(const a of achievements){const r=managerRows.get(a.managerId)??{score:0,titles:0};r.score+=a.weight;if(a.kind==='title')r.titles++;managerRows.set(a.managerId,r)}
  const bestManager=[...managerRows.values()].sort((a,b)=>b.score-a.score||b.titles-a.titles)[0];const managerShadow=clamp((bestManager?.score??0)/8+(bestManager?.titles??0)*7);
  if(managerShadow>=55)reasons.push('A memória de um treinador histórico eleva a comparação com o comando atual.');
  if(traumaPressure>=35)reasons.push('Traumas esportivos relevantes ainda pesam sobre a identidade do clube.');
  if(gloryMomentum>=45)reasons.push('Conquistas históricas alimentam expectativa de voltar ao mesmo patamar.');
  const legacyExpectation=clamp(rep.historical*.5+identityWeight*.3+gloryMomentum*.2);
  const totalPressure=clamp(titleDroughtPressure*.34+traumaPressure*.22+legacyExpectation*.3+managerShadow*.14-gloryMomentum*.08);
  return{clubId,legacyExpectation:Number(legacyExpectation.toFixed(1)),titleDroughtPressure:Number(titleDroughtPressure.toFixed(1)),traumaPressure:Number(traumaPressure.toFixed(1)),gloryMomentum:Number(gloryMomentum.toFixed(1)),managerShadow:Number(managerShadow.toFixed(1)),identityWeight:Number(identityWeight.toFixed(1)),totalPressure:Number(totalPressure.toFixed(1)),reasons,sourceMemoryIds:[...new Set(sourceMemoryIds)].slice(0,20)};
}

export function historicalMatchContext(w:World,clubId:string,opponentId:string):HistoricalMatchContext{
  const rivalry=clubRivalry(w,clubId,opponentId).score,memories=strongestClubMemories(w,clubId,80).filter(m=>m.entityIds.includes(opponentId)||m.payload?.opponentId===opponentId),base=clubHistoricalPressure(w,clubId),reasons:string[]=[],sourceMemoryIds:string[]=[];let bad=0,good=0;
  for(const m of memories){const weight=memoryWeight(m)*100;if(m.sentiment==='negative')bad+=weight;if(m.sentiment==='positive')good+=weight;if(weight>=12)sourceMemoryIds.push(m.id)}
  const revengeFactor=clamp(bad*.38+rivalry*.22),confidenceFactor=clamp(good*.32+base.gloryMomentum*.22),anxiety=clamp(bad*.25+rivalry*.22+base.totalPressure*.3-confidenceFactor*.12),motivation=clamp(35+rivalry*.35+revengeFactor*.28+confidenceFactor*.2-anxiety*.1),historicalPressure=clamp(base.totalPressure*.55+rivalry*.25+bad*.2);
  if(revengeFactor>=45)reasons.push('Derrotas marcantes contra este adversário alimentam desejo de revanche.');
  if(confidenceFactor>=45)reasons.push('Boas lembranças contra este adversário aumentam a confiança coletiva.');
  if(anxiety>=60)reasons.push('O peso histórico deste confronto aumenta a ansiedade em torno da partida.');
  if(rivalry>=72)reasons.push('A rivalidade transforma o jogo em um evento de identidade para o clube.');
  return{clubId,opponentId,rivalry:Number(rivalry.toFixed(1)),historicalPressure:Number(historicalPressure.toFixed(1)),motivation:Number(motivation.toFixed(1)),anxiety:Number(anxiety.toFixed(1)),revengeFactor:Number(revengeFactor.toFixed(1)),confidenceFactor:Number(confidenceFactor.toFixed(1)),reasons,sourceMemoryIds:[...new Set(sourceMemoryIds)].slice(0,16)};
}

export function clubHistoricalNarrativeHooks(w:World,clubId:string,opponentId?:string){const p=clubHistoricalPressure(w,clubId),hooks=[...p.reasons];if(opponentId)hooks.push(...historicalMatchContext(w,clubId,opponentId).reasons);const club=footballDataSnapshot(w).clubs.find(c=>c.id===clubId);if(p.legacyExpectation>=70)hooks.push(`${club?.name??clubId} carrega uma expectativa histórica acima do momento atual.`);return[...new Set(hooks)].slice(0,8)}
