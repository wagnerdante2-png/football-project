import type { World } from './engine';
import { dailyCalendar } from './daily-simulation';
import { clubTraining } from './training-engine';
import { clubWeeklyTrainingSchedule,setWeeklyTrainingEnabled,setWeeklyTrainingSlot,type WeeklyTrainingSlot,type TrainingPeriod } from './training-weekly-schedule-v1';

export type PeriodizationProfile='protective'|'congested'|'matchPrep'|'development';
export type PeriodizationSuggestion={clubId:string;anchorDate:string;profile:PeriodizationProfile;avgReadiness:number;matchesNext7:number;daysToNextMatch?:number;rationale:string;slots:Record<number,Record<TrainingPeriod,WeeklyTrainingSlot>>};

const addDays=(iso:string,days:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const diffDays=(a:string,b:string)=>Math.round((new Date(`${a}T12:00:00Z`).getTime()-new Date(`${b}T12:00:00Z`).getTime())/86400000);
const slot=(type:WeeklyTrainingSlot['type'],intensity:WeeklyTrainingSlot['intensity']='low',durationMinutes=60):WeeklyTrainingSlot=>({type,intensity,unit:'all',durationMinutes:type==='rest'?0:durationMinutes});
const rest=()=>slot('rest','veryLow',0);

function averageReadiness(world:World,clubId:string):number{
 const training=clubTraining(world,clubId);if(!training||!training.players.size)return 75;
 let sum=0,n=0;for(const player of training.players.values()){sum+=player.load.readiness;n++;}return sum/Math.max(1,n);
}
function matchDatesNext7(world:World,anchorDate:string):string[]{
 const end=addDays(anchorDate,7);return [...dailyCalendar(world).matchDates.values()].filter(date=>date>=anchorDate&&date<=end).sort();
}
function previousMatchDate(world:World,date:string):string|undefined{return [...dailyCalendar(world).matchDates.values()].filter(d=>d<date).sort().at(-1)};
function nextMatchDate(world:World,date:string):string|undefined{return [...dailyCalendar(world).matchDates.values()].filter(d=>d>=date).sort()[0]}
function classify(avgReadiness:number,matchesNext7:number,daysToNextMatch?:number):PeriodizationProfile{
 if(avgReadiness<55)return'protective';
 if(matchesNext7>=2)return'congested';
 if(daysToNextMatch!==undefined&&daysToNextMatch<=2)return'matchPrep';
 return'development';
}
function rationale(profile:PeriodizationProfile,avg:number,matches:number,next?:number):string{
 if(profile==='protective')return`Readiness médio ${Math.round(avg)}: reduzir carga, recuperar e preservar disponibilidade.`;
 if(profile==='congested')return`${matches} jogos nos próximos 7 dias: priorizar recuperação, preparação específica e baixa monotonia.`;
 if(profile==='matchPrep')return`Próximo jogo em ${next} dia(s): concentrar forma da equipe, adversário e bolas paradas.`;
 return`Readiness médio ${Math.round(avg)} e calendário estável: janela adequada para desenvolvimento técnico e tático.`;
}

export function suggestWeeklyPeriodization(world:World,clubId:string,anchorDate=dailyCalendar(world).date):PeriodizationSuggestion{
 const avgReadiness=averageReadiness(world,clubId),matches=matchDatesNext7(world,anchorDate),next=nextMatchDate(world,anchorDate),daysToNextMatch=next?diffDays(next,anchorDate):undefined,profile=classify(avgReadiness,matches.length,daysToNextMatch);
 const slots={} as PeriodizationSuggestion['slots'];
 for(let offset=0;offset<7;offset++){
  const date=addDays(anchorDate,offset),day=new Date(`${date}T12:00:00Z`).getUTCDay(),prev=previousMatchDate(world,date),nextDate=nextMatchDate(world,date),sincePrev=prev?diffDays(date,prev):undefined,toNext=nextDate?diffDays(nextDate,date):undefined,isMatch=matches.includes(date);
  let am:WeeklyTrainingSlot,pm:WeeklyTrainingSlot;
  if(isMatch){am=rest();pm=rest();}
  else if(sincePrev!==undefined&&sincePrev<=1){am=slot('recovery','low',55);pm=slot('videoAnalysis','veryLow',45);}
  else if(toNext===1){am=slot('teamShape','low',60);pm=slot('setPieces','low',45);}
  else if(toNext===2){am=slot('opponentSpecific','medium',65);pm=slot('teamShape','low',55);}
  else if(profile==='protective'){am=slot('recovery','low',55);pm=avgReadiness<48?rest():slot('technical','low',55);}
  else if(profile==='congested'){am=slot('recovery','low',55);pm=slot('opponentSpecific','low',55);}
  else if(profile==='matchPrep'){am=slot('technical','medium',65);pm=slot('teamShape','low',55);}
  else {am=offset%2===0?slot('technical','medium',75):slot('teamShape','medium',70);pm=offset%3===0?slot('roleWork','low',60):slot('pressing','medium',65);}
  slots[day]={am,pm};
 }
 return{clubId,anchorDate,profile,avgReadiness,matchesNext7:matches.length,daysToNextMatch,rationale:rationale(profile,avgReadiness,matches.length,daysToNextMatch),slots};
}

export function applyWeeklyPeriodization(world:World,suggestion:PeriodizationSuggestion):void{
 const schedule=clubWeeklyTrainingSchedule(world,suggestion.clubId);
 for(let day=0;day<7;day++)for(const period of ['am','pm'] as TrainingPeriod[])setWeeklyTrainingSlot(world,suggestion.clubId,day,period,suggestion.slots[day][period]);
 setWeeklyTrainingEnabled(world,suggestion.clubId,true);
 schedule.enabled=true;
}
