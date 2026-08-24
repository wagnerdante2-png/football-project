import type { Club, Player, Position, World } from './engine';
import { medicalSnapshot } from './injuries';
import { scoutingReport } from './scouting';

export type RecruitmentStage = 'coachRequest'|'footballDirector'|'scouting'|'medical'|'finance'|'board'|'negotiation'|'approved'|'rejected';
export type RecruitmentDecision = 'approve'|'reject'|'requestScouting'|'requestMedical'|'renegotiate'|'defer';
export type Stakeholder = 'coach'|'footballDirector'|'scoutingDepartment'|'medicalDepartment'|'financeDepartment'|'board'|'supporters'|'media';

export type ClubGovernance = {
  clubId:string;
  boardPatience:number;
  financialConservatism:number;
  sportingAmbition:number;
  youthPreference:number;
  resalePreference:number;
  supporterSensitivity:number;
  mediaSensitivity:number;
  coachInfluence:number;
  footballDirectorInfluence:number;
  medicalRiskTolerance:number;
  governanceStrictness:number;
};

export type CoachRecruitmentProfile = {
  clubId:string;
  tacticalIdentity:'possession'|'pressing'|'counter'|'balanced';
  preferredAgeMin:number;
  preferredAgeMax:number;
  youthTrust:number;
  physicalDemand:number;
  technicalDemand:number;
  patienceForDevelopment:number;
  starTolerance:number;
};

export type ApprovalStep = {
  stage:RecruitmentStage;
  stakeholder:Stakeholder;
  decision:RecruitmentDecision;
  score:number;
  reasons:string[];
  mandatory:boolean;
};

export type RecruitmentProposal = {
  id:string;
  season:number;
  buyerClubId:string;
  sellerClubId?:string;
  playerId:string;
  playerName:string;
  position:Position;
  fee:number;
  expectedWage:number;
  needScore:number;
  initiatedBy:'coach'|'footballDirector'|'scoutingDepartment';
  urgency:'normal'|'high'|'emergency';
  stage:RecruitmentStage;
  status:'pending'|'approved'|'rejected'|'deferred';
  steps:ApprovalStep[];
  createdRound:number;
  finalScore?:number;
  finalReasons?:string[];
};

export type RecruitmentWorkflowState = {
  governance:Map<string,ClubGovernance>;
  coaches:Map<string,CoachRecruitmentProfile>;
  proposals:RecruitmentProposal[];
};

const stateByWorld=new WeakMap<World,RecruitmentWorkflowState>();
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd=()=>Math.random();

function governanceFor(club:Club):ClubGovernance{
  const rep=club.reputation;
  return {
    clubId:club.id,
    boardPatience:Math.round(clamp(46+rep*.35+(rnd()-.5)*20,30,92)),
    financialConservatism:Math.round(clamp(64-rep*.16+(rnd()-.5)*25,20,90)),
    sportingAmbition:Math.round(clamp(42+rep*.5+(rnd()-.5)*18,35,96)),
    youthPreference:Math.round(clamp(48+(rnd()-.5)*45,20,90)),
    resalePreference:Math.round(clamp(52+(rnd()-.5)*38,25,92)),
    supporterSensitivity:Math.round(clamp(55+(rnd()-.5)*35,25,92)),
    mediaSensitivity:Math.round(clamp(48+(rnd()-.5)*35,20,88)),
    coachInfluence:Math.round(clamp(38+rep*.32+(rnd()-.5)*30,25,88)),
    footballDirectorInfluence:Math.round(clamp(58+(rnd()-.5)*28,30,90)),
    medicalRiskTolerance:Math.round(clamp(46+(rnd()-.5)*30,20,80)),
    governanceStrictness:Math.round(clamp(58+(rnd()-.5)*34,25,92)),
  };
}

function coachFor(club:Club):CoachRecruitmentProfile{
  const t=club.tactics;
  const tacticalIdentity=t.pressing>=68?'pressing':t.passingStyle==='short'&&t.tempo<=58?'possession':t.transition==='counter'?'counter':'balanced';
  return {
    clubId:club.id,tacticalIdentity,
    preferredAgeMin:19,preferredAgeMax:29,
    youthTrust:Math.round(clamp(55+(rnd()-.5)*35,25,90)),
    physicalDemand:Math.round(clamp((t.pressing+t.tempo)/2+(rnd()-.5)*12,30,92)),
    technicalDemand:Math.round(clamp((t.passingStyle==='short'?74:58)+(rnd()-.5)*18,35,92)),
    patienceForDevelopment:Math.round(clamp(50+(rnd()-.5)*40,20,90)),
    starTolerance:Math.round(clamp(55+(rnd()-.5)*35,25,92)),
  };
}

export function recruitmentWorkflowState(world:World):RecruitmentWorkflowState{
  let state=stateByWorld.get(world);
  if(!state){state={governance:new Map(),coaches:new Map(),proposals:[]};stateByWorld.set(world,state);}
  for(const club of world.clubs){
    if(!state.governance.has(club.id))state.governance.set(club.id,governanceFor(club));
    if(!state.coaches.has(club.id))state.coaches.set(club.id,coachFor(club));
  }
  return state;
}

function coachFit(player:Player,club:Club,profile:CoachRecruitmentProfile):number{
  const a=player.attributes;
  let tactical=50;
  if(profile.tacticalIdentity==='pressing')tactical=a.stamina*.35+a.pace*.22+a.decisions*.2+a.tackling*.13+a.technique*.1;
  else if(profile.tacticalIdentity==='possession')tactical=a.passing*.3+a.technique*.28+a.decisions*.24+a.positioning*.1+a.stamina*.08;
  else if(profile.tacticalIdentity==='counter')tactical=a.pace*.3+a.decisions*.22+a.technique*.18+a.passing*.15+a.finishing*.15;
  else tactical=(a.decisions+a.technique+a.stamina+a.positioning)/4;
  const agePenalty=player.age<profile.preferredAgeMin?(profile.preferredAgeMin-player.age)*(100-profile.youthTrust)/90:player.age>profile.preferredAgeMax?(player.age-profile.preferredAgeMax)*2.6:0;
  return clamp(tactical-agePenalty,0,100);
}

function publicSentiment(player:Player,buyer:Club,fee:number):{supporters:number;media:number;reasons:string[]}{
  const valueSignal=player.currentAbility+(player.age<=22?Math.max(0,player.potentialAbility-player.currentAbility)*.45:0);
  const fame=player.currentAbility+(player.potentialAbility>=86?6:0)+(player.age<=21?3:0);
  const feePressure=fee/Math.max(1,Math.pow(Math.max(40,player.currentAbility),2)*2800);
  const supporters=clamp(40+(fame-buyer.reputation)*.75+(player.age<=23?7:0)-Math.max(0,feePressure-1.25)*16+(rnd()-.5)*12,5,95);
  const media=clamp(42+(valueSignal-buyer.reputation)*.7+(player.currentAbility>=78?10:0)-Math.max(0,feePressure-1.15)*13+(rnd()-.5)*14,5,95);
  const reasons:string[]=[];
  if(supporters>=70)reasons.push('A torcida tende a receber a contratação com entusiasmo.');
  else if(supporters<38)reasons.push('Há risco de rejeição da torcida pelo custo ou perfil do atleta.');
  if(media>=70)reasons.push('A imprensa enxerga forte impacto esportivo na contratação.');
  else if(media<38)reasons.push('A imprensa tende a questionar o custo-benefício da operação.');
  return{supporters,media,reasons};
}

function pushStep(proposal:RecruitmentProposal,stage:RecruitmentStage,stakeholder:Stakeholder,decision:RecruitmentDecision,score:number,reasons:string[],mandatory:boolean):void{
  proposal.steps.push({stage,stakeholder,decision,score:Math.round(score),reasons,mandatory});proposal.stage=stage;
}

export type RecruitmentEvaluationInput={
  fee:number;
  expectedWage:number;
  needScore:number;
  transferBudget:number;
  wageBudget:number;
  wageSpend:number;
  sellerClubId?:string;
  initiatedBy?:RecruitmentProposal['initiatedBy'];
  urgency?:RecruitmentProposal['urgency'];
};

export function evaluateRecruitmentProposal(world:World,buyer:Club,player:Player,input:RecruitmentEvaluationInput):RecruitmentProposal{
  const state=recruitmentWorkflowState(world);const gov=state.governance.get(buyer.id)!;const coach=state.coaches.get(buyer.id)!;
  const proposal:RecruitmentProposal={id:`rec-${world.season}-${world.round}-${buyer.id}-${player.id}-${Math.floor(rnd()*1e6)}`,season:world.season,buyerClubId:buyer.id,sellerClubId:input.sellerClubId,playerId:player.id,playerName:player.name,position:player.position,fee:input.fee,expectedWage:input.expectedWage,needScore:input.needScore,initiatedBy:input.initiatedBy??'coach',urgency:input.urgency??'normal',stage:'coachRequest',status:'pending',steps:[],createdRound:world.round};

  const fit=coachFit(player,buyer,coach);
  const coachScore=fit*.6+input.needScore*.4;
  pushStep(proposal,'coachRequest','coach',coachScore>=56?'approve':'reject',coachScore,[`Aderência ao modelo do treinador: ${Math.round(fit)}/100.`,`Necessidade da posição: ${Math.round(input.needScore)}/100.`],true);
  if(coachScore<42&&proposal.initiatedBy==='coach'){proposal.status='rejected';proposal.finalScore=Math.round(coachScore);proposal.finalReasons=['O próprio pedido esportivo é fraco para a necessidade atual.'];state.proposals.push(proposal);return proposal;}

  const report=scoutingReport(world,buyer.id,player.id);
  const scoutConfidence=report?.confidence??0;
  const scoutMid=((report?.currentAbility.min??player.currentAbility)+(report?.currentAbility.max??player.currentAbility))/2;
  const scoutPa=((report?.potentialAbility.min??player.potentialAbility)+(report?.potentialAbility.max??player.potentialAbility))/2;
  const scoutScore=scoutMid*.62+scoutPa*.22+scoutConfidence*.16;
  const scoutingMandatory=gov.governanceStrictness>=62||input.fee>input.transferBudget*.22||player.age<=21;
  if(scoutConfidence<(scoutingMandatory?48:28)){
    pushStep(proposal,'scouting','scoutingDepartment','requestScouting',scoutScore,[`Confiança atual do relatório: ${scoutConfidence}%.`,'A diretoria exige mais evidência antes de comprometer recursos.'],scoutingMandatory);
    proposal.status='deferred';proposal.finalScore=Math.round(scoutScore);proposal.finalReasons=['Processo suspenso até aprofundamento do scouting.'];state.proposals.push(proposal);return proposal;
  }
  pushStep(proposal,'scouting','scoutingDepartment',scoutScore>=58?'approve':'reject',scoutScore,[`CA percebido: ${Math.round(scoutMid)}.`,`PA percebido: ${Math.round(scoutPa)}.`,`Confiança do relatório: ${scoutConfidence}%.`],scoutingMandatory);
  if(scoutScore<50){proposal.status='rejected';proposal.finalScore=Math.round(scoutScore);proposal.finalReasons=['O departamento de scouting não sustenta tecnicamente a contratação.'];state.proposals.push(proposal);return proposal;}

  const medical=medicalSnapshot(world,player.id);
  const medicalRisk=medical?.riskIndex??20;
  const seriousHistory=(medical?.history??[]).filter(i=>['serious','major','critical','careerThreatening'].includes(i.severity)).length;
  const chronic=(medical?.vulnerabilities??[]).filter(v=>v.chronicity>=35||v.susceptibility>=45).length;
  const active=(medical?.activeInjuries??[]).length;
  const medicalScore=clamp(100-medicalRisk-seriousHistory*6-chronic*8-active*18,0,100);
  const medicalMandatory=input.fee>input.transferBudget*.12||player.age>=29||medicalRisk>=32||gov.governanceStrictness>=68;
  const medicalDecision=medicalScore<32&&gov.medicalRiskTolerance<65?'reject':medicalScore<58?'renegotiate':'approve';
  pushStep(proposal,'medical','medicalDepartment',medicalDecision,medicalScore,[`Índice de risco físico: ${medicalRisk}/100.`,`${seriousHistory} lesão(ões) séria(s) ou pior no histórico.`,`${chronic} fragilidade(s) anatômica(s) relevante(s).`],medicalMandatory);
  if(medicalDecision==='reject'){proposal.status='rejected';proposal.finalScore=Math.round(medicalScore);proposal.finalReasons=['Risco médico excede a tolerância institucional do clube.'];state.proposals.push(proposal);return proposal;}

  const feeRatio=input.fee/Math.max(1,input.transferBudget);const wageRatio=(input.wageSpend+input.expectedWage)/Math.max(1,input.wageBudget);
  const ageResale=player.age<=23?88:player.age<=27?72:player.age<=30?50:player.age<=33?28:12;
  const costBenefit=clamp((scoutScore*.55+ageResale*.25+input.needScore*.2)-feeRatio*28-Math.max(0,wageRatio-1)*55,0,100);
  const financeScore=clamp(costBenefit+(100-gov.financialConservatism)*.14,0,100);
  const financeDecision=feeRatio>1||wageRatio>1.12?'reject':financeScore<45?'renegotiate':'approve';
  pushStep(proposal,'finance','financeDepartment',financeDecision,financeScore,[`Operação consome ${Math.round(feeRatio*100)}% do orçamento de transferências.`,`Folha projetada: ${Math.round(wageRatio*100)}% do teto.`,`Índice de revenda/idade: ${ageResale}/100.`],true);
  if(financeDecision==='reject'){proposal.status='rejected';proposal.finalScore=Math.round(financeScore);proposal.finalReasons=['A operação ultrapassa os limites financeiros do clube.'];state.proposals.push(proposal);return proposal;}

  const publicView=publicSentiment(player,buyer,input.fee);
  const boardScore=clamp(
    coachScore*(gov.coachInfluence/100)*.28+
    scoutScore*.24+medicalScore*.16+financeScore*.22+
    publicView.supporters*(gov.supporterSensitivity/100)*.06+
    publicView.media*(gov.mediaSensitivity/100)*.04+
    gov.sportingAmbition*.12+
    (player.age<=23?gov.youthPreference*.06:0),0,100);
  const emergencyBypass=proposal.urgency==='emergency'&&input.needScore>=75&&input.fee<=input.transferBudget*.18&&medicalScore>=50;
  const cheapFastTrack=input.fee<=input.transferBudget*.06&&input.expectedWage+input.wageSpend<=input.wageBudget*.94&&scoutConfidence>=45;
  const boardDecision=boardScore>=58||emergencyBypass||cheapFastTrack?'approve':boardScore>=48?'defer':'reject';
  const boardReasons=[...publicView.reasons,`Influência do treinador na política esportiva: ${gov.coachInfluence}/100.`,`Ambição esportiva da diretoria: ${gov.sportingAmbition}/100.`];
  if(emergencyBypass)boardReasons.push('Carência emergencial permite rito abreviado, sem ignorar finanças e medicina.');
  if(cheapFastTrack)boardReasons.push('Operação de baixo impacto financeiro qualifica-se para aprovação simplificada.');
  pushStep(proposal,'board','board',boardDecision,boardScore,boardReasons,true);
  proposal.finalScore=Math.round(boardScore);
  if(boardDecision==='approve'){proposal.stage='approved';proposal.status='approved';proposal.finalReasons=['A diretoria considera que o conjunto esportivo, médico e financeiro justifica a negociação.'];}
  else if(boardDecision==='defer'){proposal.status='deferred';proposal.finalReasons=['A diretoria não rejeitou o atleta, mas exige contexto melhor, preço inferior ou novas evidências.'];}
  else{proposal.stage='rejected';proposal.status='rejected';proposal.finalReasons=['O equilíbrio de interesses do clube não sustenta a contratação neste momento.'];}
  state.proposals.push(proposal);return proposal;
}

export function recruitmentHistory(world:World,clubId?:string,limit=60):RecruitmentProposal[]{
  const rows=recruitmentWorkflowState(world).proposals.filter(p=>!clubId||p.buyerClubId===clubId);return[...rows].reverse().slice(0,limit);
}

export function governanceSnapshot(world:World,clubId:string){const state=recruitmentWorkflowState(world);return{governance:state.governance.get(clubId),coach:state.coaches.get(clubId)};}
