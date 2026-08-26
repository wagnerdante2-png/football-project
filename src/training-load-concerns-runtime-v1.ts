import type { World } from './engine';
import { emitWorldEvent, onWorldEvent, recentWorldEvents } from './event-bus';
import { clubTraining } from './training-engine';
import { clubDressingRoom } from './dressing-room';
import { humanLifeState } from './human-life';

const wired=new WeakSet<World>();
const clamp=(value:number,min=0,max=100)=>Math.max(min,Math.min(max,value));
const daysBetween=(a:string,b:string)=>Math.abs(Math.round((new Date(`${a}T12:00:00Z`).getTime()-new Date(`${b}T12:00:00Z`).getTime())/86400000));

type TrainingConcernReason='overload'|'individual-plan'|'monotony'|'undertraining';
type TrainingReaction={reason?:TrainingConcernReason;delta:number;severity:number;summary:string};

function alreadyRaised(world:World,clubId:string,playerId:string,date:string):boolean{
  return recentWorldEvents(world,80,{clubId,playerId,types:['DressingRoomConcern']}).some(event=>event.tags.includes('training-load')&&daysBetween(date,event.date)<=6);
}

function reactionFor(world:World,clubId:string,playerId:string):TrainingReaction{
  const training=clubTraining(world,clubId),state=training?.players.get(playerId),room=clubDressingRoom(world,clubId),status=room?.players.get(playerId),life=humanLifeState(world),person=life.people.get(playerId),profile=life.profiles.get(playerId);
  if(!state)return{delta:0,severity:0,summary:'Sem dados suficientes para avaliar a reação ao treino.'};
  const professionalism=person?.professionalism??60,temperament=person?.temperament??50,resilience=profile?.stressResilience??55,trust=status?.managerTrust??60;
  const plan=state.individual,load=state.load,ratio=load.chronicLoad>4?load.acuteLoad/load.chronicLoad:1;
  const overloadPressure=Math.max(0,ratio-1.25)*20+Math.max(0,load.strain-1100)/90+load.overloadDays*3+Math.max(0,55-load.readiness)*.25;
  const tolerance=(professionalism*.28+resilience*.42+trust*.18+(100-temperament)*.12)/100;
  if(load.overloadDays>=3||load.readiness<45||overloadPressure>14){
    const severity=clamp(2+overloadPressure*.18+(55-resilience)*.025,1,10),delta=-(.45+severity*.18)*(1.18-tolerance*.35);
    return{reason:'overload',delta,severity,summary:'A sequência de carga está pesando mais do que o atleta considera sustentável.'};
  }
  if(plan&&plan.satisfaction<45){
    const severity=clamp(2+(45-plan.satisfaction)*.13+(temperament-50)*.02,1,9),delta=-(.35+severity*.14);
    return{reason:'individual-plan',delta,severity,summary:'O atleta não está convencido de que o trabalho individual atual atende suas necessidades.'};
  }
  if(load.monotony>2.45&&load.strain>700){
    const severity=clamp(1+(load.monotony-2.4)*4+(temperament-45)*.018,1,8),delta=-(.22+severity*.11);
    return{reason:'monotony',delta,severity,summary:'A repetição da rotina começa a desgastar a percepção do jogador sobre o treino.'};
  }
  const undertrained=load.chronicLoad>8&&ratio<.62&&load.readiness>78&&professionalism>68;
  if(undertrained){
    const severity=clamp(1+(professionalism-68)*.06+(load.readiness-78)*.04,1,7),delta=-(.18+severity*.09);
    return{reason:'undertraining',delta,severity,summary:'O atleta sente que poderia ser mais exigido para continuar evoluindo.'};
  }
  const healthyLoad=load.readiness>=60&&load.overloadDays===0&&ratio>=.72&&ratio<=1.38;
  const delta=healthyLoad?.18+.12*(professionalism/100)+.08*(trust/100):.04;
  return{delta,severity:0,summary:'A rotina está dentro de uma faixa que o atleta considera administrável.'};
}

function concernSummary(name:string,reason:TrainingConcernReason):string{
  if(reason==='individual-plan')return`${name} quer rever seu plano individual de treino.`;
  if(reason==='monotony')return`${name} demonstrou desgaste com a repetição dos treinamentos.`;
  if(reason==='undertraining')return`${name} acredita que os treinamentos poderiam ser mais exigentes.`;
  return`${name} demonstrou preocupação com a carga de treino.`;
}

function evaluateClub(world:World,clubId:string,date:string):void{
  const club=world.clubs.find(c=>c.id===clubId),training=clubTraining(world,clubId),room=clubDressingRoom(world,clubId),life=humanLifeState(world);
  if(!club||!training||!room)return;
  for(const player of club.players){
    const state=training.players.get(player.id),status=room.players.get(player.id),plan=state?.individual;
    if(!state||!status)continue;
    const reaction=reactionFor(world,clubId,player.id),beforeHappiness=status.overallHappiness;
    status.overallHappiness=clamp(status.overallHappiness+reaction.delta);
    if(reaction.reason&&reaction.delta<0){
      status.grievanceDays=Math.min(30,status.grievanceDays+1);
      status.conflictRisk=clamp(status.conflictRisk+Math.max(.15,reaction.severity*.12));
    }else{
      status.grievanceDays=Math.max(0,status.grievanceDays-1);
      status.conflictRisk=clamp(status.conflictRisk-.12);
    }
    const person=life.people.get(player.id),profile=life.profiles.get(player.id),persistentOverload=state.load.overloadDays>=3||state.load.readiness<42;
    const severeIndividual=!!plan&&plan.satisfaction<38;
    const persistentHumanConcern=!!reaction.reason&&status.grievanceDays>=3&&(status.overallHappiness<58||reaction.severity>=4);
    if(!persistentOverload&&!severeIndividual&&!persistentHumanConcern)continue;
    if(alreadyRaised(world,clubId,player.id,date))continue;
    const reason:TrainingConcernReason=severeIndividual&&!persistentOverload?'individual-plan':reaction.reason??'overload';
    const importance=state.load.overloadDays>=5||state.load.readiness<35||status.overallHappiness<38||reaction.severity>=7?3:2;
    status.managerTrust=clamp(status.managerTrust-(importance===3?1.1:.55));
    emitWorldEvent(world,{type:'DressingRoomConcern',date,clubIds:[clubId],playerIds:[player.id],importance,tags:['training','training-load',reason],summary:concernSummary(player.name,reason),payload:{reason,readiness:Math.round(state.load.readiness),overloadDays:state.load.overloadDays,strain:Math.round(state.load.strain),monotony:Number(state.load.monotony.toFixed(2)),individualSatisfaction:plan?Math.round(plan.satisfaction):undefined,overallHappinessBefore:Math.round(beforeHappiness),overallHappiness:Math.round(status.overallHappiness),grievanceDays:status.grievanceDays,professionalism:person?.professionalism,temperament:person?.temperament,stressResilience:profile?.stressResilience,managerTrust:Math.round(status.managerTrust),reactionSummary:reaction.summary}});
  }
}

export function wireTrainingLoadConcerns(world:World):void{
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'TrainingCompleted',event=>{
    if(event.payload?.restDay===true)return;
    for(const clubId of event.clubIds)evaluateClub(world,clubId,event.date);
  });
}

function currentWorld():World|undefined{return window.__touchlineWorld as World|undefined;}
function ensureCurrentWorldWired(){const world=currentWorld();if(world)wireTrainingLoadConcerns(world);}
if(typeof document!=='undefined'){
  queueMicrotask(ensureCurrentWorldWired);
  document.addEventListener('touchline:view-rendered',ensureCurrentWorldWired);
}
