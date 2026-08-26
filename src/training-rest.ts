import type { World } from './engine';
import { emitWorldEvent } from './event-bus';
import { trainingState } from './training-engine';

const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
function refresh(values:number[],max:number,value:number){values.push(value);if(values.length>max)values.shift();}

export function executeRestDay(world:World,date:string,clubIds?:string[]):void{
  const state=trainingState(world),allowed=clubIds?new Set(clubIds):undefined;
  for(const club of world.clubs){
    if(allowed&&!allowed.has(club.id))continue;
    const cs=state.clubs.get(club.id)!;let readiness=0,count=0;
    for(const p of club.players){const ps=cs.players.get(p.id)!;refresh(ps.load.last7,7,0);refresh(ps.load.last28,28,0);ps.load.acuteLoad=ps.load.last7.reduce((a,b)=>a+b,0)/Math.max(1,ps.load.last7.length);ps.load.chronicLoad=ps.load.last28.reduce((a,b)=>a+b,0)/Math.max(1,ps.load.last28.length);ps.load.fatigue=clamp(ps.load.fatigue-10-(cs.sportsScience-50)*.04);ps.load.strain*=.82;ps.load.monotony*=.85;ps.load.overloadDays=Math.max(0,ps.load.overloadDays-1);p.condition=Math.round(clamp(p.condition+7+(cs.medicalCoordination-50)*.025,30,100));ps.load.readiness=clamp(p.condition-ps.load.fatigue*.35+(cs.sportsScience-50)*.05,10,100);readiness+=ps.load.readiness;count++;}
    cs.trainingHistory.push({date,clubId:club.id,sessions:[{type:'rest',intensity:'veryLow',participants:club.players.length,avgLoad:0}],avgReadiness:Math.round(readiness/Math.max(1,count)),overloaded:0,notes:['Dia de descanso e recuperação programada.']});if(cs.trainingHistory.length>180)cs.trainingHistory.splice(0,cs.trainingHistory.length-180);
    emitWorldEvent(world,{type:'TrainingCompleted',date,clubIds:[club.id],importance:1,tags:['training','rest'],summary:`${club.name} cumpriu dia programado de recuperação.`,payload:{restDay:true,avgReadiness:Math.round(readiness/Math.max(1,count))}});
  }
}
