import type { Club, Player, World } from './engine';
import { medicalSnapshot } from './injuries';
import { playerMarketValue } from './economy';
import { scoutingReport } from './scouting';

export type Climate = 'cold'|'mild'|'hot'|'humid';
export type Region = 'Brazil'|'SouthAmerica'|'Europe'|'NorthAmerica'|'Africa';
export type DealType = 'permanent'|'loan'|'loanWithOption'|'loanWithObligation';
export type NegotiationStatus = 'open'|'accepted'|'rejected'|'withdrawn'|'collapsed';
export type LeakState = 'private'|'rumour'|'reported'|'public';
export type NegotiationActor = 'buyingClub'|'sellingClub'|'player'|'agent'|'coach'|'board'|'supporters'|'media';
export type ClauseType = 'sellOn'|'appearanceBonus'|'goalBonus'|'cleanSheetBonus'|'promotionBonus'|'titleBonus'|'releaseClause'|'buyOption'|'buyObligation'|'loanRecall'|'wageContribution';

export type DealClause = { type:ClauseType; value:number; description:string };
export type NegotiationPackage = {
  type:DealType;
  upfrontFee:number;
  installments:number;
  installmentValue:number;
  weeklyWage:number;
  signingBonus:number;
  agentFee:number;
  contractYears:number;
  squadRole:'star'|'starter'|'rotation'|'prospect'|'backup';
  loanMonths?:number;
  clauses:DealClause[];
};

export type AgentProfile = {
  id:string; name:string; greed:number; patience:number; loyalty:number; mediaUse:number; reputation:number; relationshipFocus:number;
};
export type PlayerCareerPreferences = {
  playerId:string;
  ambition:number;
  loyalty:number;
  moneyMotivation:number;
  playingTimeNeed:number;
  climatePreference:Climate;
  relocationTolerance:number;
  familyStability:number;
  languageAdaptability:number;
  pressureTolerance:number;
  statusDrive:number;
  currentClubAttachment:number;
  idolStatus:number;
  wantsToLeave:number;
};
export type ClubEnvironment = {
  clubId:string; region:Region; climate:Climate; cityPrestige:number; pressure:number; supporterPassion:number; mediaIntensity:number; sportingProject:number;
};
export type SentimentSnapshot = {
  supportersBuyer:number; supportersSeller:number; mediaBuyer:number; mediaSeller:number; playerPublicPressure:number; sellerPressure:number; buyerPressure:number;
  reasons:string[];
};
export type NegotiationRound = {
  round:number; actor:NegotiationActor; action:'offer'|'counter'|'accept'|'reject'|'comment'|'leak'|'ultimatum'|'withdraw';
  package?:NegotiationPackage; message:string; leverageBuyer:number; leverageSeller:number; playerInterest:number; leakState:LeakState;
};
export type NegotiationCase = {
  id:string; season:number; gameRound:number; buyerClubId:string; sellerClubId?:string; playerId:string; playerName:string;
  status:NegotiationStatus; leakState:LeakState; initiatedBy:'coach'|'director'|'scouting'; urgency:'normal'|'high'|'emergency';
  agent:AgentProfile; preferences:PlayerCareerPreferences; sentiment:SentimentSnapshot; rounds:NegotiationRound[]; currentPackage:NegotiationPackage;
  maxBuyerCost:number; sellerWalkAway:number; playerMinimumScore:number; finalReason?:string; createdAtRound:number;
};
export type NegotiationState = { cases:NegotiationCase[]; agents:Map<string,AgentProfile>; preferences:Map<string,PlayerCareerPreferences>; environments:Map<string,ClubEnvironment> };

const states=new WeakMap<World,NegotiationState>();
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd=()=>Math.random();
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0)};
const pseudo=(seed:number,offset:number)=>{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)};
const pick=<T>(items:T[],seed:number,offset:number)=>items[Math.floor(pseudo(seed,offset)*items.length)];

function makeAgent(player:Player):AgentProfile{
  const seed=hash(`agent-${player.id}`);const first=['Marcelo','Renato','Fábio','Gustavo','Eduardo','Bruno','Ricardo','André'];const last=['Mendes','Ribeiro','Alves','Costa','Barros','Vieira','Moura','Tavares'];
  return{id:`agent-${player.id}`,name:`${pick(first,seed,1)} ${pick(last,seed,2)}`,greed:Math.round(35+pseudo(seed,3)*60),patience:Math.round(30+pseudo(seed,4)*65),loyalty:Math.round(20+pseudo(seed,5)*75),mediaUse:Math.round(20+pseudo(seed,6)*78),reputation:Math.round(35+pseudo(seed,7)*60),relationshipFocus:Math.round(25+pseudo(seed,8)*70)};
}
function makePreferences(player:Player):PlayerCareerPreferences{
  const seed=hash(`pref-${player.id}`);const climates:Climate[]=['cold','mild','hot','humid'];
  return{playerId:player.id,ambition:Math.round(35+pseudo(seed,1)*63),loyalty:Math.round(25+pseudo(seed,2)*70),moneyMotivation:Math.round(20+pseudo(seed,3)*78),playingTimeNeed:Math.round(35+pseudo(seed,4)*63),climatePreference:pick(climates,seed,5),relocationTolerance:Math.round(20+pseudo(seed,6)*78),familyStability:Math.round(20+pseudo(seed,7)*78),languageAdaptability:Math.round(25+pseudo(seed,8)*72),pressureTolerance:Math.round(20+pseudo(seed,9)*78),statusDrive:Math.round(25+pseudo(seed,10)*72),currentClubAttachment:Math.round(20+pseudo(seed,11)*78),idolStatus:Math.round(pseudo(seed,12)*100),wantsToLeave:Math.round(pseudo(seed,13)*100)};
}
function makeEnvironment(club:Club):ClubEnvironment{
  const seed=hash(`env-${club.id}`);const regions:Region[]=['Brazil','SouthAmerica','Europe','NorthAmerica','Africa'];const climates:Climate[]=['cold','mild','hot','humid'];
  return{clubId:club.id,region:pick(regions,seed,1),climate:pick(climates,seed,2),cityPrestige:Math.round(35+club.reputation*.45+pseudo(seed,3)*25),pressure:Math.round(30+club.reputation*.55+pseudo(seed,4)*18),supporterPassion:Math.round(42+club.reputation*.42+pseudo(seed,5)*25),mediaIntensity:Math.round(30+club.reputation*.5+pseudo(seed,6)*28),sportingProject:Math.round(40+club.reputation*.5+pseudo(seed,7)*20)};
}
export function negotiationState(world:World):NegotiationState{
  let s=states.get(world);if(!s){s={cases:[],agents:new Map(),preferences:new Map(),environments:new Map()};states.set(world,s);}
  for(const club of world.clubs){if(!s.environments.has(club.id))s.environments.set(club.id,makeEnvironment(club));for(const p of club.players){if(!s.agents.has(p.id))s.agents.set(p.id,makeAgent(p));if(!s.preferences.has(p.id))s.preferences.set(p.id,makePreferences(p));}}
  return s;
}

function climateCompatibility(pref:Climate,target:Climate):number{if(pref===target)return 100;if((pref==='hot'&&target==='humid')||(pref==='humid'&&target==='hot')||(pref==='cold'&&target==='mild')||(pref==='mild'&&target==='cold'))return 70;return 38;}
function roleValue(role:NegotiationPackage['squadRole']){return role==='star'?100:role==='starter'?82:role==='rotation'?58:role==='prospect'?55:35;}
function publicSentiment(world:World,buyer:Club,seller:Club|undefined,player:Player,fee:number,leak:LeakState,prefs:PlayerCareerPreferences,externalSeller=false):SentimentSnapshot{
  const s=negotiationState(world);const be=s.environments.get(buyer.id)!;const fame=player.currentAbility+(player.potentialAbility>=86?7:0)+(prefs.idolStatus>75?8:0);const value=playerMarketValue(player);const pricePenalty=Math.max(0,fee/Math.max(1,value)-1)*18;
  const leakMult=leak==='private'?.35:leak==='rumour'?.65:leak==='reported'?.85:1;
  const supportersBuyer=clamp(42+(fame-buyer.reputation)*.85+(player.age<=23?6:0)-pricePenalty+(rnd()-.5)*10,4,98);
  const supportersSeller=seller?clamp(48+prefs.idolStatus*.28+prefs.currentClubAttachment*.18-(prefs.wantsToLeave*.24)+(fame-seller.reputation)*.4+(rnd()-.5)*12,4,98):externalSeller?clamp(44+prefs.idolStatus*.22+prefs.currentClubAttachment*.14-prefs.wantsToLeave*.18+(rnd()-.5)*10,8,92):20;
  const mediaBuyer=clamp(40+(fame-buyer.reputation)*.78+(fee>value*1.25?-12:5)+(rnd()-.5)*15,5,96);
  const mediaSeller=seller?clamp(45+fame*.3+prefs.idolStatus*.2+(prefs.wantsToLeave>65?-8:8)+(rnd()-.5)*14,5,96):externalSeller?clamp(42+fame*.24+prefs.idolStatus*.14+(rnd()-.5)*12,8,92):20;
  const playerPublicPressure=clamp(((supportersBuyer+mediaBuyer)/2-50)*leakMult+Math.max(0,prefs.wantsToLeave-50)*.35,0,100);
  const sellerPressure=clamp(((supportersSeller+mediaSeller)/2-50)*leakMult+prefs.idolStatus*.18-prefs.wantsToLeave*.15,0,100);
  const buyerPressure=clamp(((supportersBuyer+mediaBuyer)/2-45)*leakMult+be.mediaIntensity*.15,0,100);
  const reasons:string[]=[];
  if(supportersBuyer>=72)reasons.push('A torcida compradora pressiona favoravelmente pela contratação.');
  if(supportersSeller>=72)reasons.push('A torcida vendedora pressiona pela permanência do atleta.');
  if(mediaBuyer>=72)reasons.push('A imprensa trata o negócio como reforço de impacto.');
  if(mediaSeller>=72)reasons.push('A imprensa local aumenta o custo político de uma venda.');
  if(prefs.idolStatus>=75)reasons.push('O atleta possui status de ídolo, elevando o custo emocional e político da saída.');
  return{supportersBuyer,supportersSeller,mediaBuyer,mediaSeller,playerPublicPressure,sellerPressure,buyerPressure,reasons};
}

function playerInterest(world:World,buyer:Club,seller:Club|undefined,player:Player,p:NegotiationPackage,prefs:PlayerCareerPreferences,externalSeller=false):number{
  const st=negotiationState(world);const be=st.environments.get(buyer.id)!;const se=seller?st.environments.get(seller.id):undefined;const climate=climateCompatibility(prefs.climatePreference,be.climate);const repGain=buyer.reputation-(seller?.reputation??(externalSeller?65:55));const project=be.sportingProject;const role=roleValue(p.squadRole);const money=Math.min(100,p.weeklyWage/Math.max(1,player.currentAbility*80));const relocation=se&&se.region!==be.region?(prefs.relocationTolerance*.55+prefs.languageAdaptability*.25+climate*.2):externalSeller?(prefs.relocationTolerance*.6+prefs.languageAdaptability*.25+climate*.15):90;const attachmentPenalty=(seller||externalSeller)?(prefs.currentClubAttachment*.18+prefs.idolStatus*.11):0;const leaveBonus=prefs.wantsToLeave*.24;
  return clamp(project*.16+role*.18+money*(prefs.moneyMotivation/100)*.2+(50+repGain*1.8)*(prefs.ambition/100)*.2+relocation*.15+prefs.statusDrive*.08+leaveBonus-attachmentPenalty,0,100);
}
function sellerAcceptance(world:World,seller:Club|undefined,player:Player,p:NegotiationPackage,prefs:PlayerCareerPreferences,sent:SentimentSnapshot,hasSeller:boolean):number{
  if(!hasSeller)return 100;const value=playerMarketValue(player);const total=p.upfrontFee+p.installments*p.installmentValue+(p.clauses.find(c=>c.type==='sellOn')?.value??0)*value/100;const scarcity=seller&&seller.players.filter(x=>x.position===player.position).length<=2?18:0;const starPenalty=seller&&seller.players.length&&player.currentAbility>=Math.max(...seller.players.map(x=>x.currentAbility))-3?20:0;const idolPenalty=prefs.idolStatus*.18;const desireBonus=prefs.wantsToLeave*.2;return clamp((total/Math.max(1,value))*58+desireBonus-starPenalty-scarcity-idolPenalty-sent.sellerPressure*.12,0,100);
}
function buyerValue(world:World,buyer:Club,player:Player,p:NegotiationPackage):number{
  const report=scoutingReport(world,buyer.id,player.id);const ca=report?((report.currentAbility.min+report.currentAbility.max)/2):player.currentAbility;const pa=report?((report.potentialAbility.min+report.potentialAbility.max)/2):player.potentialAbility;const medical=medicalSnapshot(world,player.id);const risk=medical?.riskIndex??20;const age=player.age<=22?12:player.age>=31?-12:0;const price=(p.upfrontFee+p.installments*p.installmentValue)/Math.max(1,playerMarketValue(player));return clamp(ca*.5+pa*.24+age+risk*-.18-price*16+buyer.reputation*.08,0,100);
}
function agentPressure(agent:AgentProfile,prefs:PlayerCareerPreferences,round:number):number{return clamp(agent.greed*.42+(100-agent.patience)*.2+prefs.moneyMotivation*.25+round*3,0,100);}
function maybeLeak(caseFile:NegotiationCase):void{
  const chance=(caseFile.agent.mediaUse*.0035)+(caseFile.sentiment.mediaBuyer*.0015)+(caseFile.rounds.length*.015);if(rnd()>chance)return;
  const next:LeakState=caseFile.leakState==='private'?'rumour':caseFile.leakState==='rumour'?'reported':'public';caseFile.leakState=next;caseFile.rounds.push({round:caseFile.rounds.length+1,actor:caseFile.agent.mediaUse>60?'agent':'media',action:'leak',message:`Informações da negociação chegaram à imprensa (${next}).`,leverageBuyer:0,leverageSeller:0,playerInterest:0,leakState:next});
}
function counterPackage(current:NegotiationPackage,side:'seller'|'agent',pressure:number):NegotiationPackage{
  const p={...current,clauses:[...current.clauses]};if(side==='seller'){
    p.upfrontFee=Math.round(p.upfrontFee*(1.05+pressure/600)/10000)*10000;
    if(pressure>68&&!p.clauses.some(c=>c.type==='sellOn'))p.clauses.push({type:'sellOn',value:8+Math.round(pressure/12),description:'Percentual sobre venda futura.'});
    if(current.type==='loan'&&pressure>60){p.type='loanWithOption';p.clauses.push({type:'buyOption',value:playerSafeNumber(current.upfrontFee*8),description:'Opção de compra ao fim do empréstimo.'});}
  }else{
    p.weeklyWage=Math.round(p.weeklyWage*(1.04+pressure/700)/100)*100;p.signingBonus=Math.round((p.signingBonus+Math.max(10000,p.weeklyWage*4))*(1+pressure/800)/1000)*1000;p.agentFee=Math.round((p.agentFee+Math.max(5000,p.weeklyWage*2))*(1+pressure/650)/1000)*1000;
    if(pressure>72&&!p.clauses.some(c=>c.type==='releaseClause'))p.clauses.push({type:'releaseClause',value:playerSafeNumber(p.upfrontFee*2.2),description:'Cláusula de saída negociada pelo agente.'});
  }return p;
}
const playerSafeNumber=(n:number)=>Math.max(10000,Math.round(n/10000)*10000);

export type StartNegotiationInput={fee:number;weeklyWage:number;transferBudget:number;initiatedBy?:NegotiationCase['initiatedBy'];urgency?:NegotiationCase['urgency'];dealType?:DealType;squadRole?:NegotiationPackage['squadRole'];externalSellerClubId?:string;};
export function negotiateTransfer(world:World,buyer:Club,seller:Club|undefined,player:Player,input:StartNegotiationInput):NegotiationCase{
  const st=negotiationState(world);let agent=st.agents.get(player.id);if(!agent){agent=makeAgent(player);st.agents.set(player.id,agent)}let prefs=st.preferences.get(player.id);if(!prefs){prefs=makePreferences(player);st.preferences.set(player.id,prefs)}const value=playerMarketValue(player),hasSeller=Boolean(seller||input.externalSellerClubId),externalSeller=Boolean(!seller&&input.externalSellerClubId);
  const initial:NegotiationPackage={type:input.dealType??'permanent',upfrontFee:input.fee,installments:input.fee>input.transferBudget*.35?2:0,installmentValue:input.fee>input.transferBudget*.35?Math.round(input.fee*.18/10000)*10000:0,weeklyWage:input.weeklyWage,signingBonus:Math.round(input.weeklyWage*6/1000)*1000,agentFee:Math.round(input.weeklyWage*4/1000)*1000,contractYears:player.age<=23?4:player.age>=31?2:3,squadRole:player.age<=21?'prospect':player.currentAbility>=78?'starter':'rotation',clauses:[]};
  const sentiment=publicSentiment(world,buyer,seller,player,input.fee,'private',prefs,externalSeller);const c:NegotiationCase={id:`neg-${world.season}-${world.round}-${buyer.id}-${player.id}-${Math.floor(rnd()*1e6)}`,season:world.season,gameRound:world.round,buyerClubId:buyer.id,sellerClubId:seller?.id??input.externalSellerClubId,playerId:player.id,playerName:player.name,status:'open',leakState:'private',initiatedBy:input.initiatedBy??'coach',urgency:input.urgency??'normal',agent,preferences:prefs,sentiment,rounds:[],currentPackage:initial,maxBuyerCost:Math.min(input.transferBudget,Math.round(value*(1.65+(buyer.reputation-player.currentAbility)/250))),sellerWalkAway:hasSeller?Math.round(value*(.82+(100-prefs.wantsToLeave)/220+(prefs.idolStatus/300))):0,playerMinimumScore:Math.round(46+(100-prefs.relocationTolerance)*.12+(prefs.statusDrive*.08)),createdAtRound:world.round};
  st.cases.push(c);
  for(let r=1;r<=8&&c.status==='open';r++){
    c.sentiment=publicSentiment(world,buyer,seller,player,c.currentPackage.upfrontFee,c.leakState,prefs,externalSeller);
    const interest=playerInterest(world,buyer,seller,player,c.currentPackage,prefs,externalSeller);const sellerScore=sellerAcceptance(world,seller,player,c.currentPackage,prefs,c.sentiment,hasSeller);const buyScore=buyerValue(world,buyer,player,c.currentPackage);const totalCost=c.currentPackage.upfrontFee+c.currentPackage.installments*c.currentPackage.installmentValue+c.currentPackage.signingBonus+c.currentPackage.agentFee;const buyerLeverage=clamp((100-sellerScore)*.35+prefs.wantsToLeave*.3+(seller&&seller.players.length>27?10:0),0,100);const sellerLeverage=clamp((100-interest)*.2+prefs.idolStatus*.25+c.sentiment.sellerPressure*.3+(sellerScore<45?12:0),0,100);
    c.rounds.push({round:r,actor:'buyingClub',action:'offer',package:{...c.currentPackage,clauses:[...c.currentPackage.clauses]},message:`Oferta formal: ${c.currentPackage.upfrontFee} à vista, salário ${c.currentPackage.weeklyWage}/semana.`,leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});
    if(totalCost>c.maxBuyerCost*1.08||buyScore<38){c.status='withdrawn';c.finalReason='O comprador desistiu por custo total ou perda de valor esportivo.';c.rounds.push({round:r,actor:'buyingClub',action:'withdraw',message:c.finalReason,leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});break;}
    if(hasSeller&&sellerScore<52){
      if(r>=6&&sellerLeverage>72){c.status='rejected';c.finalReason='O clube vendedor encerrou a negociação e declarou o atleta inegociável nas condições atuais.';c.rounds.push({round:r,actor:'sellingClub',action:'reject',message:c.finalReason,leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});break;}
      c.currentPackage=counterPackage(c.currentPackage,'seller',sellerLeverage);c.rounds.push({round:r,actor:'sellingClub',action:'counter',package:{...c.currentPackage,clauses:[...c.currentPackage.clauses]},message:prefs.idolStatus>70?'O vendedor exige compensação superior pela importância simbólica do atleta.':'O vendedor apresentou contraproposta financeira.',leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});maybeLeak(c);continue;
    }
    const ap=agentPressure(agent,prefs,r);if(interest<c.playerMinimumScore||ap>68){
      if(r>=7&&interest<40){c.status='rejected';c.finalReason='O jogador recusou a mudança por projeto, papel, adaptação ou questões pessoais.';c.rounds.push({round:r,actor:'player',action:'reject',message:c.finalReason,leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});break;}
      c.currentPackage=counterPackage(c.currentPackage,'agent',ap);c.rounds.push({round:r,actor:'agent',action:'counter',package:{...c.currentPackage,clauses:[...c.currentPackage.clauses]},message:`${agent.name} pede melhores condições para o atleta.`,leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});
      if(r>=5&&agent.patience<45)c.rounds.push({round:r,actor:'agent',action:'ultimatum',message:'O agente estabelece prazo curto para acordo antes de ouvir outros clubes.',leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});maybeLeak(c);continue;
    }
    c.status='accepted';c.finalReason='Clube comprador, vendedor, atleta e agente chegaram a um acordo aceitável.';c.rounds.push({round:r,actor:'player',action:'accept',package:{...c.currentPackage,clauses:[...c.currentPackage.clauses]},message:'O atleta aceita o projeto esportivo e os termos pessoais.',leverageBuyer:Math.round(buyerLeverage),leverageSeller:Math.round(sellerLeverage),playerInterest:Math.round(interest),leakState:c.leakState});break;
  }
  if(c.status==='open'){c.status='collapsed';c.finalReason='As partes não convergiram após múltiplas rodadas de negociação.';}
  return c;
}

export function negotiationHistory(world:World,clubId?:string,limit=60):NegotiationCase[]{return[...negotiationState(world).cases].filter(c=>!clubId||c.buyerClubId===clubId||c.sellerClubId===clubId).reverse().slice(0,limit);}
export function playerPreferences(world:World,playerId:string){return negotiationState(world).preferences.get(playerId);}
export function clubEnvironment(world:World,clubId:string){return negotiationState(world).environments.get(clubId);}
