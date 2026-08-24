import type { Club, Player, PlayerAttributes, Position, World } from './engine';
import { emitWorldEvent } from './event-bus';
import { medicalProfile, isUnavailable } from './injuries';
import { clubDressingRoom } from './dressing-room';
import { personalPerformanceFactor } from './human-life';

export type SessionType=
  |'rest'|'recovery'|'rehabilitation'|'endurance'|'speed'|'technical'|'passing'|'finishing'|'defending'
  |'positioning'|'pressing'|'transition'|'teamShape'|'attackingUnit'|'defensiveUnit'|'setPieces'
  |'videoAnalysis'|'opponentSpecific'|'roleWork'|'weakFoot'|'newPosition';
export type SessionIntensity='veryLow'|'low'|'medium'|'high'|'veryHigh';
export type TrainingUnit='all'|'goalkeepers'|'defenders'|'midfielders'|'attackers'|'rehab';
export type MicrocyclePreset='recoveryWeek'|'balanced'|'development'|'tactical'|'physicalBuild'|'congested'|'preMatch';

export type TrainingSession={
  id:string;type:SessionType;intensity:SessionIntensity;unit:TrainingUnit;durationMinutes:number;
  focusAttributes:(keyof PlayerAttributes)[];tacticalAxes:TacticalAxis[];load:number;injuryExposure:number;cohesionEffect:number;
};
export type TacticalAxis='buildUp'|'pressing'|'defensiveShape'|'transition'|'setPieces'|'roleFamiliarity';
export type IndividualTrainingPlan={playerId:string;focus:SessionType;targetPosition?:Position;targetAttribute?:keyof PlayerAttributes;intensity:SessionIntensity;startedDate:string;progress:number;satisfaction:number};
export type PlayerLoadState={playerId:string;acuteLoad:number;chronicLoad:number;readiness:number;fatigue:number;monotony:number;strain:number;last7:number[];last28:number[];lastTrainingDate?:string;overloadDays:number};
export type PlayerTrainingState={playerId:string;tacticalFamiliarity:Record<TacticalAxis,number>;weakFootProgress:number;positionProgress:Partial<Record<Position,number>>;roleProgress:number;individual?:IndividualTrainingPlan;load:PlayerLoadState;lastGainDate?:string};
export type ClubTrainingState={clubId:string;preset:MicrocyclePreset;facilityQuality:number;sportsScience:number;medicalCoordination:number;academyIntegration:number;players:Map<string,PlayerTrainingState>;lastPlanDate?:string;lastSessionDate?:string;trainingHistory:TrainingDayRecord[]};
export type TrainingDayRecord={date:string;clubId:string;sessions:{type:SessionType;intensity:SessionIntensity;participants:number;avgLoad:number}[];avgReadiness:number;overloaded:number;notes:string[]};
export type TrainingState={clubs:Map<string,ClubTrainingState>};
export type ClubTrainingSnapshot=Omit<ClubTrainingState,'players'> & {players:[string,PlayerTrainingState][]};
export type TrainingSnapshot={clubs:[string,ClubTrainingSnapshot][]};

const states=new WeakMap<World,TrainingState>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const intensityFactor:Record<SessionIntensity,number>={veryLow:.35,low:.6,medium:1,high:1.35,veryHigh:1.7};
const positionUnit=(p:Position):TrainingUnit=>p==='GK'?'goalkeepers':['RB','CB','LB'].includes(p)?'defenders':['DM','CM','AM'].includes(p)?'midfielders':'attackers';
const attrBySession:Partial<Record<SessionType,(keyof PlayerAttributes)[]>>={
  endurance:['stamina'],speed:['pace','stamina'],technical:['technique','passing'],passing:['passing','technique','decisions'],finishing:['finishing','technique','decisions'],defending:['tackling','positioning','stamina'],
  positioning:['positioning','decisions'],pressing:['stamina','tackling','positioning'],transition:['pace','passing','decisions'],teamShape:['positioning','decisions','passing'],attackingUnit:['finishing','passing','technique'],defensiveUnit:['tackling','positioning','stamina'],setPieces:['technique','passing','finishing'],roleWork:['positioning','decisions','technique'],weakFoot:['technique','passing','finishing'],newPosition:['positioning','decisions']
};
const tacticalBySession:Partial<Record<SessionType,TacticalAxis[]>>={positioning:['defensiveShape'],pressing:['pressing'],transition:['transition'],teamShape:['buildUp','defensiveShape'],attackingUnit:['buildUp','transition'],defensiveUnit:['defensiveShape','pressing'],setPieces:['setPieces'],videoAnalysis:['buildUp','defensiveShape'],opponentSpecific:['defensiveShape','transition'],roleWork:['roleFamiliarity'],newPosition:['roleFamiliarity']};

function initialLoad(playerId:string):PlayerLoadState{return{playerId,acuteLoad:0,chronicLoad:0,readiness:82,fatigue:10,monotony:0,strain:0,last7:[],last28:[],overloadDays:0};}
function playerState(playerId:string):PlayerTrainingState{return{playerId,tacticalFamiliarity:{buildUp:50,pressing:50,defensiveShape:50,transition:50,setPieces:50,roleFamiliarity:45},weakFootProgress:0,positionProgress:{},roleProgress:0,load:initialLoad(playerId)};}
function initialClub(club:Club):ClubTrainingState{return{clubId:club.id,preset:'balanced',facilityQuality:clamp(45+club.reputation*.45),sportsScience:clamp(40+club.reputation*.4),medicalCoordination:clamp(45+club.reputation*.38),academyIntegration:clamp(35+club.reputation*.42),players:new Map(),trainingHistory:[]};}
export function trainingState(world:World):TrainingState{let s=states.get(world);if(!s){s={clubs:new Map()};states.set(world,s);}for(const club of world.clubs){if(!s.clubs.has(club.id))s.clubs.set(club.id,initialClub(club));const c=s.clubs.get(club.id)!;for(const p of club.players)if(!c.players.has(p.id))c.players.set(p.id,playerState(p.id));}return s;}
export function clubTraining(world:World,clubId:string):ClubTrainingState|undefined{return trainingState(world).clubs.get(clubId);}
export function setMicrocyclePreset(world:World,clubId:string,preset:MicrocyclePreset):void{const c=clubTraining(world,clubId);if(c)c.preset=preset;}
export function setIndividualTraining(world:World,clubId:string,playerId:string,input:Omit<IndividualTrainingPlan,'playerId'|'startedDate'|'progress'|'satisfaction'>,date:string):void{const p=clubTraining(world,clubId)?.players.get(playerId);if(!p)return;p.individual={...input,playerId,startedDate:date,progress:0,satisfaction:65};}

function session(type:SessionType,intensity:SessionIntensity,unit:TrainingUnit='all',durationMinutes=75):TrainingSession{
  const attrs=attrBySession[type]??[];const tactical=tacticalBySession[type]??[];
  const baseLoad=type==='rest'?0:type==='recovery'||type==='videoAnalysis'?12:type==='rehabilitation'?16:['endurance','speed','pressing'].includes(type)?42:28;
  const exposure=['speed','endurance','pressing'].includes(type)?1.45:['defending','transition','attackingUnit','defensiveUnit'].includes(type)?1.1:type==='rehabilitation'||type==='recovery'?.35:.7;
  const cohesion=['teamShape','attackingUnit','defensiveUnit','setPieces'].includes(type)?2:type==='rest'?0:1;
  return{id:`${type}-${intensity}-${unit}-${durationMinutes}`,type,intensity,unit,durationMinutes,focusAttributes:attrs,tacticalAxes:tactical,load:baseLoad*intensityFactor[intensity]*(durationMinutes/75),injuryExposure:exposure*intensityFactor[intensity],cohesionEffect:cohesion};
}

function chooseDayPlan(clubState:ClubTrainingState,daysToNextMatch:number|undefined,daysSinceLastMatch:number|undefined,congested:boolean):TrainingSession[]{
  if(daysSinceLastMatch!==undefined&&daysSinceLastMatch<=1)return[session('recovery','low'),session('videoAnalysis','veryLow')];
  if(daysToNextMatch!==undefined&&daysToNextMatch<=1)return[session('teamShape','low'),session('setPieces','low')];
  if(congested||clubState.preset==='congested')return[session('recovery','low'),session('opponentSpecific','low')];
  switch(clubState.preset){
    case'recoveryWeek':return[session('recovery','low'),session('technical','low')];
    case'development':return[session('technical','medium'),session('passing','medium'),session('roleWork','low')];
    case'tactical':return[session('teamShape','medium'),session('pressing','medium'),session('transition','medium')];
    case'physicalBuild':return[session('endurance','high'),session('speed','medium'),session('recovery','low')];
    case'preMatch':return[session('opponentSpecific','medium'),session('teamShape','low'),session('setPieces','low')];
    default:return[session('technical','medium'),session('teamShape','medium'),session('attackingUnit','low'),session('defensiveUnit','low')];
  }
}
function sessionAllowsPlayer(world:World,p:Player,s:TrainingSession):boolean{
  const med=medicalProfile(world,p.id);const active=med?.activeInjuries??[];
  if(active.length){const phases=new Set(active.map(i=>i.phase));if(phases.has('acute')||phases.has('immobilization'))return s.type==='rest';if(phases.has('rehab'))return s.type==='rehabilitation'||s.type==='recovery'||s.type==='videoAnalysis';if(phases.has('returnToTraining'))return['rehabilitation','recovery','videoAnalysis','positioning','roleWork'].includes(s.type);}
  if(s.unit==='all')return true;if(s.unit==='rehab')return active.length>0;return positionUnit(p.position)===s.unit;
}
function ageDevelopmentFactor(age:number):number{return age<=18?1.45:age<=21?1.28:age<=24?1.12:age<=29?1:age<=32?.78:age<=35?.55:.38;}
function loadRatio(load:PlayerLoadState):number{return load.chronicLoad<=4?1:load.acuteLoad/load.chronicLoad;}
function updateLoad(load:PlayerLoadState,daily:number,condition:number,science:number):void{
  load.last7.push(daily);if(load.last7.length>7)load.last7.shift();load.last28.push(daily);if(load.last28.length>28)load.last28.shift();
  load.acuteLoad=load.last7.reduce((a,b)=>a+b,0)/Math.max(1,load.last7.length);load.chronicLoad=load.last28.reduce((a,b)=>a+b,0)/Math.max(1,load.last28.length);
  const avg=load.acuteLoad;const variance=load.last7.reduce((s,x)=>s+Math.pow(x-avg,2),0)/Math.max(1,load.last7.length);const sd=Math.sqrt(variance);load.monotony=sd<1?3:clamp(avg/sd,0,3);load.strain=load.last7.reduce((a,b)=>a+b,0)*load.monotony;
  const ratio=loadRatio(load);const overload=Math.max(0,ratio-1.25)*32+Math.max(0,load.strain-1100)/55;load.fatigue=clamp(load.fatigue*.82+daily*.34+overload*.18-(science-50)*.025);load.readiness=clamp(condition-load.fatigue*.42-(ratio>1.5?8:0)+(science-50)*.06,10,100);load.overloadDays=ratio>1.5||load.strain>1500?load.overloadDays+1:Math.max(0,load.overloadDays-1);
}
function trainingGainChance(world:World,club:Club,p:Player,ps:PlayerTrainingState,s:TrainingSession):number{
  const room=clubDressingRoom(world,club.id);const chemistry=(room?.chemistry??55)/100;const readiness=ps.load.readiness/100;const age=ageDevelopmentFactor(p.age);const potentialGap=Math.max(0,p.potentialAbility-p.currentAbility);const ceiling=potentialGap<=0?.2:clamp(.5+potentialGap/35,.55,1.35);const facility=(clubTraining(world,club.id)?.facilityQuality??50)/100;const personal=personalPerformanceFactor(world,p.id);
  return .0085*intensityFactor[s.intensity]*age*ceiling*(.72+facility*.42)*(.84+chemistry*.22)*(.68+readiness*.4)*personal;
}
function applyAttributeGain(world:World,club:Club,p:Player,ps:PlayerTrainingState,s:TrainingSession):void{
  if(!s.focusAttributes.length||Math.random()>trainingGainChance(world,club,p,ps,s))return;const key=s.focusAttributes[Math.floor(Math.random()*s.focusAttributes.length)];const cap=Math.min(99,Math.max(p.attributes[key],p.potentialAbility+6));if(p.attributes[key]>=cap)return;p.attributes[key]=Math.min(cap,p.attributes[key]+1);ps.lastGainDate=ps.load.lastTrainingDate;
}
function applyTacticalLearning(club:Club,p:Player,ps:PlayerTrainingState,s:TrainingSession):void{
  const learning=(.18+s.durationMinutes/320)*intensityFactor[s.intensity]*(.7+p.attributes.decisions/180);for(const axis of s.tacticalAxes)ps.tacticalFamiliarity[axis]=clamp(ps.tacticalFamiliarity[axis]+learning);
  if(s.type==='roleWork')ps.roleProgress=clamp(ps.roleProgress+learning*.9);
  if(s.type==='weakFoot')ps.weakFootProgress=clamp(ps.weakFootProgress+learning*.7);
  if(s.type==='newPosition'&&ps.individual?.targetPosition){const pos=ps.individual.targetPosition;ps.positionProgress[pos]=clamp((ps.positionProgress[pos]??0)+learning*.65);}
}
function processIndividual(world:World,club:Club,p:Player,ps:PlayerTrainingState,date:string):number{
  const plan=ps.individual;if(!plan)return 0;const med=isUnavailable(world,p.id);if(med){plan.satisfaction=clamp(plan.satisfaction-.1);return 0;}const factor=intensityFactor[plan.intensity];const load=9*factor;plan.progress=clamp(plan.progress+.16*factor*ageDevelopmentFactor(p.age)*(clubTraining(world,club.id)!.facilityQuality/70));
  if(plan.targetAttribute&&Math.random()<.0025*factor&&p.attributes[plan.targetAttribute]<99)p.attributes[plan.targetAttribute]++;
  if(plan.focus==='weakFoot')ps.weakFootProgress=clamp(ps.weakFootProgress+.2*factor);if(plan.focus==='newPosition'&&plan.targetPosition)ps.positionProgress[plan.targetPosition]=clamp((ps.positionProgress[plan.targetPosition]??0)+.14*factor);if(plan.focus==='roleWork')ps.roleProgress=clamp(ps.roleProgress+.18*factor);
  plan.satisfaction=clamp(plan.satisfaction+(ps.load.readiness>65?.08:-.16));return load;
}
function overloadInjuryPressure(ps:PlayerTrainingState,sessions:TrainingSession[]):number{const ratio=loadRatio(ps.load);const exposure=sessions.reduce((a,s)=>a+s.injuryExposure,0);return clamp((ratio-1.15)*18+ps.load.overloadDays*2+Math.max(0,ps.load.strain-1200)/80+exposure,0,50);}

export function executeTrainingDay(world:World,date:string,context:{daysToNextMatch?:number;daysSinceLastMatch?:number;matchesNext7?:number}={}):void{
  const state=trainingState(world);for(const club of world.clubs){const cs=state.clubs.get(club.id)!;const congested=(context.matchesNext7??0)>=2;const sessions=chooseDayPlan(cs,context.daysToNextMatch,context.daysSinceLastMatch,congested);const rows:TrainingDayRecord['sessions']=[];let readinessSum=0,overloaded=0,playersCount=0;
    for(const p of club.players){const ps=cs.players.get(p.id)!;let dailyLoad=0;const attended:TrainingSession[]=[];for(const s of sessions){if(!sessionAllowsPlayer(world,p,s))continue;const load=s.load*(.82+(100-p.condition)/220);dailyLoad+=load;attended.push(s);applyAttributeGain(world,club,p,ps,s);applyTacticalLearning(club,p,ps,s);}dailyLoad+=processIndividual(world,club,p,ps,date);updateLoad(ps.load,dailyLoad,p.condition,cs.sportsScience);ps.load.lastTrainingDate=date;p.condition=Math.round(clamp(p.condition-dailyLoad*.07+(attended.some(x=>x.type==='recovery')?5:1),30,100));readinessSum+=ps.load.readiness;playersCount++;const pressure=overloadInjuryPressure(ps,attended);if(pressure>18)overloaded++;if(pressure>34&&Math.random()<.015)emitWorldEvent(world,{type:'TrainingOverloadWarning',date,clubIds:[club.id],playerIds:[p.id],importance:3,summary:`Carga de treino elevada para ${p.name}.`,payload:{playerId:p.id,acuteChronicRatio:Number(loadRatio(ps.load).toFixed(2)),strain:Math.round(ps.load.strain),readiness:Math.round(ps.load.readiness),riskPressure:Math.round(pressure)}});}
    for(const s of sessions){const participants=club.players.filter(p=>sessionAllowsPlayer(world,p,s)).length;rows.push({type:s.type,intensity:s.intensity,participants,avgLoad:Number(s.load.toFixed(1))});}
    const record:TrainingDayRecord={date,clubId:club.id,sessions:rows,avgReadiness:Math.round(readinessSum/Math.max(1,playersCount)),overloaded,notes:[congested?'Microciclo adaptado por calendário congestionado.':'Carga normal de microciclo.',context.daysToNextMatch!==undefined&&context.daysToNextMatch<=1?'Sessões reduzidas por proximidade da partida.':''] .filter(Boolean)};cs.trainingHistory.push(record);if(cs.trainingHistory.length>180)cs.trainingHistory.splice(0,cs.trainingHistory.length-180);cs.lastSessionDate=date;
    emitWorldEvent(world,{type:'TrainingCompleted',date,clubIds:[club.id],importance:overloaded>=4?2:1,tags:['training',cs.preset],summary:`${club.name} concluiu ${sessions.length} sessões de treino.`,payload:{preset:cs.preset,sessions:rows,avgReadiness:record.avgReadiness,overloaded}});
  }
}

export function playerReadiness(world:World,playerId:string):number{for(const c of trainingState(world).clubs.values()){const p=c.players.get(playerId);if(p)return p.load.readiness;}return 75;}
export function tacticalFamiliarity(world:World,clubId:string):number{const c=clubTraining(world,clubId);if(!c||!c.players.size)return 50;let sum=0,n=0;for(const p of c.players.values())for(const v of Object.values(p.tacticalFamiliarity)){sum+=v;n++;}return sum/Math.max(1,n);}
export function trainingPerformanceFactor(world:World,playerId:string):number{const readiness=playerReadiness(world,playerId);return clamp(.94+(readiness-50)/500,.9,1.06);}

export function snapshotTrainingState(world:World):TrainingSnapshot{const s=trainingState(world);return{clubs:[...s.clubs.entries()].map(([id,c])=>[id,{...c,players:[...c.players.entries()].map(([pid,p])=>[pid,{...p,tacticalFamiliarity:{...p.tacticalFamiliarity},positionProgress:{...p.positionProgress},individual:p.individual?{...p.individual}:undefined,load:{...p.load,last7:[...p.load.last7],last28:[...p.load.last28]}}]),trainingHistory:c.trainingHistory.map(r=>({...r,sessions:r.sessions.map(x=>({...x})),notes:[...r.notes]}))}])};}
export function restoreTrainingState(world:World,snapshot?:TrainingSnapshot):void{if(!snapshot)return;states.set(world,{clubs:new Map(snapshot.clubs.map(([id,c])=>[id,{...c,players:new Map(c.players.map(([pid,p])=>[pid,{...p,tacticalFamiliarity:{...p.tacticalFamiliarity},positionProgress:{...p.positionProgress},individual:p.individual?{...p.individual}:undefined,load:{...p.load,last7:[...p.load.last7],last28:[...p.load.last28]}}])),trainingHistory:c.trainingHistory.map(r=>({...r,sessions:r.sessions.map(x=>({...x})),notes:[...r.notes]}))}]))});}
