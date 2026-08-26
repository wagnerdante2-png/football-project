import type { World } from './engine';
import { emitWorldEvent, onWorldEvent, recentWorldEvents } from './event-bus';
import { clubTraining } from './training-engine';

const wired=new WeakSet<World>();
const daysBetween=(a:string,b:string)=>Math.abs(Math.round((new Date(`${a}T12:00:00Z`).getTime()-new Date(`${b}T12:00:00Z`).getTime())/86400000));

function alreadyRaised(world:World,clubId:string,playerId:string,date:string):boolean{
  return recentWorldEvents(world,80,{clubId,playerId,types:['DressingRoomConcern']}).some(event=>event.tags.includes('training-load')&&daysBetween(date,event.date)<=6);
}

function evaluateClub(world:World,clubId:string,date:string):void{
  const club=world.clubs.find(c=>c.id===clubId),training=clubTraining(world,clubId);
  if(!club||!training)return;
  for(const player of club.players){
    const state=training.players.get(player.id),plan=state?.individual;
    if(!state)continue;
    const persistentOverload=state.load.overloadDays>=3||state.load.readiness<42;
    const unhappyPlan=!!plan&&plan.satisfaction<38;
    if(!persistentOverload&&!unhappyPlan)continue;
    if(alreadyRaised(world,clubId,player.id,date))continue;
    const reason=unhappyPlan&&!persistentOverload?'individual-plan':'load';
    emitWorldEvent(world,{type:'DressingRoomConcern',date,clubIds:[clubId],playerIds:[player.id],importance:state.load.overloadDays>=5||state.load.readiness<35?3:2,tags:['training','training-load',reason],summary:`${player.name} demonstrou preocupação com a carga de treino.`,payload:{reason,readiness:Math.round(state.load.readiness),overloadDays:state.load.overloadDays,strain:Math.round(state.load.strain),individualSatisfaction:plan?Math.round(plan.satisfaction):undefined}});
  }
}

export function wireTrainingLoadConcerns(world:World):void{
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'TrainingCompleted',event=>{
    for(const clubId of event.clubIds)evaluateClub(world,clubId,event.date);
  });
}

function currentWorld():World|undefined{return window.__touchlineWorld as World|undefined;}
function ensureCurrentWorldWired(){const world=currentWorld();if(world)wireTrainingLoadConcerns(world);}
if(typeof document!=='undefined'){
  queueMicrotask(ensureCurrentWorldWired);
  document.addEventListener('touchline:view-rendered',ensureCurrentWorldWired);
}
