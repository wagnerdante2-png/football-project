import type { World } from './engine';
import { medicalState, tickRecovery } from './injuries';
import { negotiationState, type NegotiationCase, type LeakState } from './negotiation';
import { economyState } from './economy';
import { recruitmentWorkflowState } from './recruitment-workflow';
import { emitWorldEvent } from './event-bus';

export type MedicalTimeline = {
  injuryId:string;
  playerId:string;
  clubId:string;
  injuryName:string;
  startedDate:string;
  expectedReturnDate:string;
  trainingReturnDate:string;
  fullFitnessDate:string;
  lastKnownPhase:string;
  recovered:boolean;
};

export type NegotiationTimeline = {
  caseId:string;
  openedDate:string;
  nextActionDate:string;
  deadlineDate:string;
  lastProcessedDate:string;
  publicEscalations:number;
};

export type TemporalState = {
  medical:Map<string,MedicalTimeline>;
  negotiations:Map<string,NegotiationTimeline>;
  contractWarnings:Set<string>;
  deferredRecruitment:Map<string,string>;
  lastMedicalRecoveryDate?:string;
};

const states=new WeakMap<World,TemporalState>();
const dayMs=86_400_000;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const toDate=(iso:string)=>new Date(`${iso}T12:00:00Z`);
const addDays=(iso:string,days:number)=>{const d=toDate(iso);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const diffDays=(a:string,b:string)=>Math.round((toDate(a).getTime()-toDate(b).getTime())/dayMs);
const hasPassed=(date:string,target:string)=>date>=target;

export function temporalState(world:World):TemporalState{
  let s=states.get(world);
  if(!s){s={medical:new Map(),negotiations:new Map(),contractWarnings:new Set(),deferredRecruitment:new Map()};states.set(world,s);}
  return s;
}

function severityExtra(severity:string):number{
  return severity==='careerThreatening'?42:severity==='critical'?28:severity==='severe'?18:severity==='serious'?10:severity==='moderate'?4:1;
}

function ensureMedicalTimelines(world:World,date:string):void{
  const state=temporalState(world);
  for(const profile of medicalState(world).profiles.values()){
    for(const injury of profile.activeInjuries){
      if(state.medical.has(injury.id))continue;
      const baseDays=Math.max(1,injury.roundsRemaining*7);
      const recoveryModifier=clamp(1.22-profile.recovery/260,.78,1.12);
      const expected=Math.max(2,Math.round(baseDays*recoveryModifier+severityExtra(injury.severity)));
      const returnToTraining=Math.max(1,Math.round(expected*.78));
      const fullFitness=expected+Math.round(7+(100-profile.recovery)*.16+severityExtra(injury.severity)*.28);
      const timeline:MedicalTimeline={injuryId:injury.id,playerId:injury.playerId,clubId:injury.clubId,injuryName:injury.name,startedDate:date,expectedReturnDate:addDays(date,expected),trainingReturnDate:addDays(date,returnToTraining),fullFitnessDate:addDays(date,fullFitness),lastKnownPhase:injury.phase,recovered:false};
      state.medical.set(injury.id,timeline);
      emitWorldEvent(world,{type:'PlayerInjured',date,clubIds:[injury.clubId],playerIds:[injury.playerId],importance:injury.severity==='careerThreatening'||injury.severity==='critical'?5:injury.severity==='severe'?4:3,summary:`${injury.name}: retorno estimado em ${timeline.expectedReturnDate}.`,payload:{injuryId:injury.id,severity:injury.severity,region:injury.region,side:injury.side,expectedReturnDate:timeline.expectedReturnDate,trainingReturnDate:timeline.trainingReturnDate,fullFitnessDate:timeline.fullFitnessDate}});
    }
  }
}

function updateMedicalPhases(world:World,date:string):void{
  const state=temporalState(world);
  const activeIds=new Set<string>();
  for(const profile of medicalState(world).profiles.values()){
    for(const injury of profile.activeInjuries){
      activeIds.add(injury.id);
      const t=state.medical.get(injury.id);if(!t)continue;
      const total=Math.max(1,diffDays(t.expectedReturnDate,t.startedDate));
      const elapsed=Math.max(0,diffDays(date,t.startedDate));
      const ratio=elapsed/total;
      const phase=ratio<.16?'acute':ratio<.38?'immobilization':ratio<.72?'rehab':ratio<.92?'returnToTraining':'returnToPlay';
      if(injury.phase!==phase){injury.phase=phase as typeof injury.phase;t.lastKnownPhase=phase;emitWorldEvent(world,{type:'PlayerRecovered',date,clubIds:[injury.clubId],playerIds:[injury.playerId],importance:1,summary:`${injury.name}: evolução para fase ${phase}.`,payload:{injuryId:injury.id,phase,expectedReturnDate:t.expectedReturnDate}});}
    }
  }
  for(const t of state.medical.values()){
    if(t.recovered||activeIds.has(t.injuryId))continue;
    t.recovered=true;
    emitWorldEvent(world,{type:'PlayerRecovered',date,clubIds:[t.clubId],playerIds:[t.playerId],importance:3,summary:`Jogador recebeu alta de ${t.injuryName}.`,payload:{injuryId:t.injuryId,fullFitnessDate:t.fullFitnessDate}});
  }
}

function tickMedicalCalendar(world:World,date:string):void{
  const state=temporalState(world);ensureMedicalTimelines(world,date);updateMedicalPhases(world,date);
  if(!state.lastMedicalRecoveryDate||diffDays(date,state.lastMedicalRecoveryDate)>=7){tickRecovery(world);state.lastMedicalRecoveryDate=date;ensureMedicalTimelines(world,date);updateMedicalPhases(world,date);}
}

function negotiationCadence(caseFile:NegotiationCase):number{
  if(caseFile.urgency==='emergency')return 1;
  if(caseFile.urgency==='high')return 2;
  return caseFile.agent.patience<40?2:3;
}
function negotiationDeadline(caseFile:NegotiationCase):number{
  const base=caseFile.urgency==='emergency'?5:caseFile.urgency==='high'?9:14;
  return Math.max(3,Math.round(base+(caseFile.agent.patience-50)/15));
}
function nextLeak(current:LeakState):LeakState{return current==='private'?'rumour':current==='rumour'?'reported':'public';}

function ensureNegotiationTimelines(world:World,date:string):void{
  const state=temporalState(world);
  for(const c of negotiationState(world).cases){
    if(c.status!=='open'||state.negotiations.has(c.id))continue;
    const cadence=negotiationCadence(c);state.negotiations.set(c.id,{caseId:c.id,openedDate:date,nextActionDate:addDays(date,cadence),deadlineDate:addDays(date,negotiationDeadline(c)),lastProcessedDate:date,publicEscalations:0});
    emitWorldEvent(world,{type:'NegotiationStarted',date,clubIds:[c.buyerClubId,...(c.sellerClubId?[c.sellerClubId]:[])],playerIds:[c.playerId],importance:3,summary:`Negociação iniciada por ${c.playerName}.`,payload:{caseId:c.id,deadlineDate:addDays(date,negotiationDeadline(c)),urgency:c.urgency}});
  }
}

function processNegotiations(world:World,date:string):void{
  const state=temporalState(world);ensureNegotiationTimelines(world,date);
  const negotiation=negotiationState(world);
  for(const c of negotiation.cases){
    const t=state.negotiations.get(c.id);if(!t||c.status!=='open')continue;
    if(hasPassed(date,t.deadlineDate)){
      c.status='collapsed';c.finalReason='Prazo de negociação expirou sem acordo entre as partes.';
      emitWorldEvent(world,{type:'NegotiationEnded',date,clubIds:[c.buyerClubId,...(c.sellerClubId?[c.sellerClubId]:[])],playerIds:[c.playerId],importance:4,summary:`Negociação por ${c.playerName} colapsou por prazo.`,payload:{caseId:c.id,reason:c.finalReason}});continue;
    }
    if(!hasPassed(date,t.nextActionDate))continue;
    const daysOpen=diffDays(date,t.openedDate);const patiencePressure=clamp((100-c.agent.patience)*.5+daysOpen*4,0,100);
    const leakChance=(c.agent.mediaUse/100)*.24+(daysOpen/20)*.16+(c.sentiment.buyerPressure+c.sentiment.sellerPressure)/1000;
    if(Math.random()<leakChance&&c.leakState!=='public'){
      c.leakState=nextLeak(c.leakState);t.publicEscalations++;
      emitWorldEvent(world,{type:'NegotiationLeaked',date,clubIds:[c.buyerClubId,...(c.sellerClubId?[c.sellerClubId]:[])],playerIds:[c.playerId],importance:c.leakState==='public'?4:3,summary:`Negociação por ${c.playerName} avançou para exposição ${c.leakState}.`,payload:{caseId:c.id,leakState:c.leakState,agent:c.agent.name}});
    }
    if(patiencePressure>82&&Math.random()<.36){
      c.rounds.push({round:c.rounds.length+1,actor:'agent',action:'ultimatum',message:`${c.agent.name} exige avanço concreto nas próximas 48 horas.`,leverageBuyer:0,leverageSeller:0,playerInterest:0,leakState:c.leakState});
      t.deadlineDate=addDays(date,2);
      emitWorldEvent(world,{type:'NegotiationUpdated',date,clubIds:[c.buyerClubId,...(c.sellerClubId?[c.sellerClubId]:[])],playerIds:[c.playerId],importance:4,summary:`Agente de ${c.playerName} impôs ultimato.`,payload:{caseId:c.id,deadlineDate:t.deadlineDate}});
    }else{
      emitWorldEvent(world,{type:'NegotiationUpdated',date,clubIds:[c.buyerClubId,...(c.sellerClubId?[c.sellerClubId]:[])],playerIds:[c.playerId],importance:2,summary:`Negociação por ${c.playerName} segue em avaliação.`,payload:{caseId:c.id,daysOpen,leakState:c.leakState}});
    }
    t.lastProcessedDate=date;t.nextActionDate=addDays(date,negotiationCadence(c));
  }
}

function contractEndDate(endSeason:number):string{return `${endSeason}-06-30`;}
function processContractDeadlines(world:World,date:string):void{
  const state=temporalState(world);const economy=economyState(world);
  for(const contract of economy.contracts.values()){
    const end=contractEndDate(contract.endSeason);const days=diffDays(end,date);
    for(const threshold of [180,90,30,7]){
      if(days>threshold||days<0)continue;
      const key=`${contract.playerId}-${contract.endSeason}-${threshold}`;if(state.contractWarnings.has(key))continue;state.contractWarnings.add(key);
      emitWorldEvent(world,{type:'ContractExpiring',date,clubIds:[contract.clubId],playerIds:[contract.playerId],importance:threshold<=30?4:2,summary:`Contrato entra na janela de ${threshold} dias para expiração.`,payload:{playerId:contract.playerId,endDate:end,daysRemaining:days,threshold,weeklyWage:contract.weeklyWage,squadStatus:contract.squadStatus}});
    }
  }
}

function processDeferredRecruitment(world:World,date:string):void{
  const state=temporalState(world);const wf=recruitmentWorkflowState(world);
  for(const proposal of wf.proposals){
    if(proposal.status!=='deferred'){state.deferredRecruitment.delete(proposal.id);continue;}
    let due=state.deferredRecruitment.get(proposal.id);
    if(!due){due=addDays(date,proposal.urgency==='emergency'?2:proposal.urgency==='high'?4:7);state.deferredRecruitment.set(proposal.id,due);continue;}
    if(date<due)continue;
    emitWorldEvent(world,{type:'RecruitmentRejected',date,clubIds:[proposal.buyerClubId],playerIds:[proposal.playerId],importance:2,summary:`Comitê reabre avaliação de ${proposal.playerName}.`,payload:{proposalId:proposal.id,status:'deferred',reason:proposal.finalReasons?.join(' ')}});
    state.deferredRecruitment.set(proposal.id,addDays(date,proposal.urgency==='emergency'?2:5));
  }
}

export function tickTemporalProcesses(world:World,date:string):void{
  tickMedicalCalendar(world,date);
  processNegotiations(world,date);
  processContractDeadlines(world,date);
  processDeferredRecruitment(world,date);
}

export function medicalTimeline(world:World,playerId:string):MedicalTimeline[]{return [...temporalState(world).medical.values()].filter(x=>x.playerId===playerId);}
export function negotiationTimeline(world:World,caseId:string):NegotiationTimeline|undefined{return temporalState(world).negotiations.get(caseId);}
