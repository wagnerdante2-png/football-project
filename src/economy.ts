import type { Club, Player, Position, World } from './engine';
import { assignScout, scoutingCandidates } from './scouting';
import { evaluateRecruitmentProposal } from './recruitment-workflow';
import { negotiateTransfer, type NegotiationPackage } from './negotiation';

export type Contract = { playerId:string; clubId:string; startSeason:number; endSeason:number; weeklyWage:number; squadStatus:'star'|'starter'|'rotation'|'prospect'|'backup'; };
export type ClubFinance = { clubId:string; balance:number; transferBudget:number; wageBudget:number; wageSpend:number; };
export type TransferRecord = { season:number; playerId:string; playerName:string; fromClubId?:string; toClubId?:string; fee:number; weeklyWage:number; kind:'transfer'|'free'|'renewal'|'release'|'loan'|'loanReturn'|'loanPurchase'; };
export type LoanRecord = { playerId:string; playerName:string; parentClubId:string; loanClubId:string; startSeason:number; endSeason:number; wageContributionPct:number; optionFee?:number; obligationFee?:number; recallAllowed:boolean; active:boolean; };
export type EconomyState = { contracts:Map<string,Contract>; finances:Map<string,ClubFinance>; freeAgents:Player[]; transfers:TransferRecord[]; loans:LoanRecord[]; };

const economyByWorld=new WeakMap<World,EconomyState>();
const positions:Position[]=['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST'];
const minimum:Partial<Record<Position,number>>={GK:2,RB:2,CB:4,LB:2,DM:2,CM:3,AM:2,RW:2,LW:2,ST:3};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd=()=>Math.random();

function statusFor(player:Player,club:Club):Contract['squadStatus']{
  const rank=[...club.players].sort((a,b)=>b.currentAbility-a.currentAbility).findIndex(p=>p.id===player.id);
  if(player.age<=21&&player.potentialAbility-player.currentAbility>=8)return'prospect'; if(rank<4)return'star'; if(rank<11)return'starter'; if(rank<18)return'rotation'; return'backup';
}
export function playerMarketValue(player:Player):number{
  const ability=Math.pow(Math.max(1,player.currentAbility-35),2.15)*3200;
  const potentialPremium=player.age<=23?Math.max(0,player.potentialAbility-player.currentAbility)*145000:0;
  const ageMultiplier=player.age<=20?1.28:player.age<=24?1.18:player.age<=28?1:player.age<=31?.78:player.age<=34?.48:.22;
  return Math.round((ability+potentialPremium)*ageMultiplier/10000)*10000;
}
function suggestedWage(player:Player,club:Club):number{
  const status=statusFor(player,club); const factor=status==='star'?1.45:status==='starter'?1.15:status==='rotation'?.82:status==='prospect'?.55:.48;
  const reputationFactor=.75+club.reputation/140; const base=Math.pow(Math.max(20,player.currentAbility),2.05)*1.85;
  return Math.round(base*factor*reputationFactor/100)*100;
}
function createFinance(club:Club):ClubFinance{
  const scale=club.reputation/75; const balance=Math.round((12_000_000+44_000_000*scale)/100000)*100000;
  return{clubId:club.id,balance,transferBudget:Math.round(balance*.28/100000)*100000,wageBudget:Math.round((210_000+club.reputation*8_600)/1000)*1000,wageSpend:0};
}
export function economyState(world:World):EconomyState{
  let state=economyByWorld.get(world); if(!state){state={contracts:new Map(),finances:new Map(),freeAgents:[],transfers:[],loans:[]};economyByWorld.set(world,state);}
  for(const club of world.clubs){
    if(!state.finances.has(club.id))state.finances.set(club.id,createFinance(club));
    for(const player of club.players)if(!state.contracts.has(player.id)){
      const duration=player.age<=21?4:player.age>=32?1+Math.floor(rnd()*2):2+Math.floor(rnd()*3);
      state.contracts.set(player.id,{playerId:player.id,clubId:club.id,startSeason:world.season,endSeason:world.season+duration,weeklyWage:suggestedWage(player,club),squadStatus:statusFor(player,club)});
    }
  }
  recalcWages(world,state); return state;
}
function loanFor(state:EconomyState,playerId:string){return state.loans.find(l=>l.playerId===playerId&&l.active);}
function recalcWages(world:World,state:EconomyState):void{
  for(const club of world.clubs){
    const f=state.finances.get(club.id)!;let spend=0;
    for(const p of club.players){const c=state.contracts.get(p.id);if(!c)continue;const loan=loanFor(state,p.id);spend+=loan&&loan.loanClubId===club.id?c.weeklyWage*(loan.wageContributionPct/100):c.weeklyWage;}
    for(const loan of state.loans.filter(l=>l.active&&l.parentClubId===club.id)){const c=state.contracts.get(loan.playerId);if(c)spend+=c.weeklyWage*(1-loan.wageContributionPct/100);}
    f.wageSpend=Math.round(spend);
  }
}
function positionalNeed(club:Club,position:Position):number{const count=club.players.filter(p=>p.position===position).length;const target=minimum[position]??2;const best=Math.max(0,...club.players.filter(p=>p.position===position).map(p=>p.currentAbility));return Math.max(0,target-count)*22+Math.max(0,72-best)*.35;}
function saleWillingness(club:Club,player:Player):number{
  const status=statusFor(player,club);const surplus=club.players.filter(p=>p.position===player.position).length-(minimum[player.position]??2);let score=surplus*12+Math.max(0,player.age-29)*3;
  if(status==='backup')score+=28;if(status==='rotation')score+=12;if(status==='star')score-=35;if(player.age<=21&&player.potentialAbility>=82)score-=18;return score;
}
function movePlayer(state:EconomyState,player:Player,from:Club|undefined,to:Club,season:number,fee:number,kind:TransferRecord['kind'],terms?:NegotiationPackage):void{
  if(from)from.players=from.players.filter(p=>p.id!==player.id);state.freeAgents=state.freeAgents.filter(p=>p.id!==player.id);player.clubId=to.id;to.players.push(player);
  const wage=terms?.weeklyWage??suggestedWage(player,to);const years=terms?.contractYears??(player.age<=22?4:player.age>=32?2:3);
  state.contracts.set(player.id,{playerId:player.id,clubId:to.id,startSeason:season,endSeason:season+years,weeklyWage:wage,squadStatus:terms?.squadRole??statusFor(player,to)});
  state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:from?.id,toClubId:to.id,fee,weeklyWage:wage,kind});
}
function moveOnLoan(state:EconomyState,player:Player,parent:Club,to:Club,season:number,terms:NegotiationPackage):void{
  parent.players=parent.players.filter(p=>p.id!==player.id);player.clubId=to.id;to.players.push(player);
  const contribution=terms.clauses.find(c=>c.type==='wageContribution')?.value??70;const option=terms.clauses.find(c=>c.type==='buyOption')?.value;const obligation=terms.clauses.find(c=>c.type==='buyObligation')?.value;
  state.loans.push({playerId:player.id,playerName:player.name,parentClubId:parent.id,loanClubId:to.id,startSeason:season,endSeason:season+(terms.loanMonths&&terms.loanMonths>12?2:1),wageContributionPct:clamp(contribution,0,100),optionFee:option,obligationFee:obligation,recallAllowed:terms.clauses.some(c=>c.type==='loanRecall'),active:true});
  state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:parent.id,toClubId:to.id,fee:terms.upfrontFee,weeklyWage:state.contracts.get(player.id)?.weeklyWage??terms.weeklyWage,kind:'loan'});
}
function resolveExpiredLoans(world:World,state:EconomyState,season:number):void{
  for(const loan of state.loans.filter(l=>l.active&&l.endSeason<=season)){
    const loanClub=world.clubs.find(c=>c.id===loan.loanClubId);const parent=world.clubs.find(c=>c.id===loan.parentClubId);const player=loanClub?.players.find(p=>p.id===loan.playerId);if(!loanClub||!parent||!player){loan.active=false;continue;}
    const loanFinance=state.finances.get(loanClub.id)!;const parentFinance=state.finances.get(parent.id)!;const purchaseFee=loan.obligationFee??loan.optionFee;const exercise=Boolean(purchaseFee&&(loan.obligationFee||((player.currentAbility+(player.potentialAbility-player.currentAbility)*.25)>=72&&purchaseFee<=loanFinance.transferBudget*.65)));
    if(exercise&&purchaseFee){loanFinance.transferBudget-=purchaseFee;loanFinance.balance-=purchaseFee;parentFinance.balance+=purchaseFee;loanClub.players=loanClub.players.filter(p=>p.id!==player.id);player.clubId=loanClub.id;loanClub.players.push(player);state.contracts.set(player.id,{...(state.contracts.get(player.id)??{playerId:player.id,clubId:loanClub.id,startSeason:season,endSeason:season+3,weeklyWage:suggestedWage(player,loanClub),squadStatus:statusFor(player,loanClub)}),clubId:loanClub.id,startSeason:season,endSeason:season+3});state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:parent.id,toClubId:loanClub.id,fee:purchaseFee,weeklyWage:state.contracts.get(player.id)?.weeklyWage??0,kind:'loanPurchase'});
    }else{loanClub.players=loanClub.players.filter(p=>p.id!==player.id);player.clubId=parent.id;parent.players.push(player);state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:loanClub.id,toClubId:parent.id,fee:0,weeklyWage:state.contracts.get(player.id)?.weeklyWage??0,kind:'loanReturn'});}
    loan.active=false;
  }
}
function handleContracts(world:World,state:EconomyState,season:number):void{
  for(const club of world.clubs)for(const player of [...club.players]){
    if(loanFor(state,player.id))continue;const contract=state.contracts.get(player.id);if(!contract||contract.endSeason>season)continue;const importance=statusFor(player,club);
    const renewScore=player.currentAbility+Math.max(0,player.potentialAbility-player.currentAbility)*.45-Math.max(0,player.age-31)*3+(importance==='star'?14:importance==='starter'?7:0);
    if(renewScore>=66&&club.players.length<=29){const wage=suggestedWage(player,club);state.contracts.set(player.id,{...contract,startSeason:season,endSeason:season+(player.age>=32?1+Math.floor(rnd()*2):3),weeklyWage:wage,squadStatus:importance});state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:club.id,toClubId:club.id,fee:0,weeklyWage:wage,kind:'renewal'});}
    else{club.players=club.players.filter(p=>p.id!==player.id);player.clubId='FREE';state.freeAgents.push(player);state.contracts.delete(player.id);state.transfers.push({season,playerId:player.id,playerName:player.name,fromClubId:club.id,fee:0,weeklyWage:0,kind:'release'});}
  }
}
function signFreeAgents(world:World,state:EconomyState,season:number):void{
  for(const club of [...world.clubs].sort(()=>rnd()-.5)){
    const finance=state.finances.get(club.id)!;
    for(const position of positions){
      const need=positionalNeed(club,position); if(need<12)continue;
      const candidates=state.freeAgents.filter(p=>p.position===position).sort((a,b)=>(b.currentAbility+(b.potentialAbility-b.currentAbility)*.25)-(a.currentAbility+(a.potentialAbility-a.currentAbility)*.25));
      const pick=candidates[0];if(!pick)continue;const wage=suggestedWage(pick,club);if(finance.wageSpend+wage>finance.wageBudget*1.05)continue;
      const proposal=evaluateRecruitmentProposal(world,club,pick,{fee:0,expectedWage:wage,needScore:Math.min(100,need*3.2),transferBudget:finance.transferBudget,wageBudget:finance.wageBudget,wageSpend:finance.wageSpend,initiatedBy:'footballDirector',urgency:need>=30?'emergency':'high'});
      if(proposal.status!=='approved')continue;
      const negotiation=negotiateTransfer(world,club,undefined,pick,{fee:0,weeklyWage:wage,transferBudget:finance.transferBudget,initiatedBy:'director',urgency:need>=30?'emergency':'high'});
      if(negotiation.status!=='accepted')continue;
      movePlayer(state,pick,undefined,club,season,0,'free',negotiation.currentPackage);recalcWages(world,state);
    }
  }
}
function findPlayerAndSeller(world:World,playerId:string):{player:Player;seller:Club}|undefined{for(const seller of world.clubs){const player=seller.players.find(p=>p.id===playerId);if(player)return{player,seller};}return undefined;}
function chooseDealType(player:Player,fee:number,budget:number,need:number,sell:number):'permanent'|'loan'|'loanWithOption'|'loanWithObligation'{
  if(player.age<=22&&fee>budget*.48&&need<24)return sell<5?'loanWithOption':'loan';
  if(player.age<=23&&need>=18&&fee>budget*.58)return'loanWithObligation';
  return'permanent';
}
function runTransferAI(world:World,state:EconomyState,season:number):void{
  const buyers=[...world.clubs].sort((a,b)=>b.reputation-a.reputation);
  for(const buyer of buyers){
    const finance=state.finances.get(buyer.id)!;const needs=positions.map(position=>({position,need:positionalNeed(buyer,position)})).sort((a,b)=>b.need-a.need).slice(0,3);
    for(const {position,need} of needs){
      if(need<8||buyer.players.length>=30||finance.transferBudget<150000)continue;
      const reports=scoutingCandidates(world,buyer.id,position,24);const candidates:{player:Player;seller:Club;score:number;fee:number;confidence:number;sell:number}[]=[];
      for(const report of reports){
        const found=findPlayerAndSeller(world,report.playerId); if(!found||found.seller.id===buyer.id||loanFor(state,found.player.id))continue;
        const ca=(report.currentAbility.min+report.currentAbility.max)/2; const pa=(report.potentialAbility.min+report.potentialAbility.max)/2;const estimatedValue=(report.marketValue.min+report.marketValue.max)/2;
        const perceivedScore=ca+(pa-ca)*(report.age<=23?.5:.14)+(report.age<=21?4:0)+report.confidence*.045;if(report.confidence<34){if(perceivedScore>=72)assignScout(world,buyer.id,report.playerId);continue;}if(report.recommendation==='avoid'||report.recommendation==='monitor')continue;
        const sell=saleWillingness(found.seller,found.player);const sellerAsk=playerMarketValue(found.player)*clamp(1.02+(20-sell)/100,.82,1.48);const fee=Math.round(Math.max(sellerAsk,estimatedValue*.9)/10000)*10000;if(fee>finance.transferBudget*1.15||estimatedValue>finance.transferBudget*1.05)continue;candidates.push({player:found.player,seller:found.seller,score:perceivedScore+rnd()*4,fee,confidence:report.confidence,sell});
      }
      candidates.sort((a,b)=>b.score-a.score||b.confidence-a.confidence);let completed=false;
      for(const deal of candidates.slice(0,5)){
        const wage=suggestedWage(deal.player,buyer);if(finance.wageSpend+wage>finance.wageBudget*1.08)continue;const urgency=need>=28?'emergency':need>=18?'high':'normal';
        const proposal=evaluateRecruitmentProposal(world,buyer,deal.player,{fee:deal.fee,expectedWage:wage,needScore:Math.min(100,need*3.2),transferBudget:finance.transferBudget,wageBudget:finance.wageBudget,wageSpend:finance.wageSpend,sellerClubId:deal.seller.id,initiatedBy:rnd()<.58?'coach':rnd()<.72?'footballDirector':'scoutingDepartment',urgency});
        if(proposal.status==='deferred'){assignScout(world,buyer.id,deal.player.id);continue;}if(proposal.status!=='approved')continue;
        const dealType=chooseDealType(deal.player,deal.fee,finance.transferBudget,need,deal.sell);const negotiation=negotiateTransfer(world,buyer,deal.seller,deal.player,{fee:dealType==='permanent'?deal.fee:Math.round(deal.fee*.04),weeklyWage:wage,transferBudget:finance.transferBudget,initiatedBy:proposal.initiatedBy==='footballDirector'?'director':proposal.initiatedBy==='scoutingDepartment'?'scouting':'coach',urgency,dealType});
        if(dealType!=='permanent'){
          const value=playerMarketValue(deal.player);negotiation.currentPackage.loanMonths=12;negotiation.currentPackage.clauses.push({type:'wageContribution',value:60+Math.round(rnd()*40),description:'Percentual salarial pago pelo clube que recebe o atleta.'});
          if(dealType==='loanWithOption')negotiation.currentPackage.clauses.push({type:'buyOption',value:Math.round(value*1.05/10000)*10000,description:'Opção de compra ao término do empréstimo.'});
          if(dealType==='loanWithObligation')negotiation.currentPackage.clauses.push({type:'buyObligation',value:Math.round(value*1.08/10000)*10000,description:'Obrigação de compra ao término do empréstimo.'});
          if(rnd()<.35)negotiation.currentPackage.clauses.push({type:'loanRecall',value:1,description:'Clube de origem pode solicitar retorno em janela prevista.'});
        }
        if(negotiation.status!=='accepted')continue;
        const finalTerms=negotiation.currentPackage;const sellerFinance=state.finances.get(deal.seller.id)!;
        if(finalTerms.type==='permanent'){
          const totalFee=finalTerms.upfrontFee+finalTerms.installments*finalTerms.installmentValue;if(totalFee>finance.transferBudget)continue;finance.transferBudget-=totalFee;finance.balance-=totalFee+finalTerms.signingBonus+finalTerms.agentFee;sellerFinance.balance+=totalFee;sellerFinance.transferBudget+=Math.round(totalFee*.55);movePlayer(state,deal.player,deal.seller,buyer,season,totalFee,'transfer',finalTerms);
        }else{
          const loanFee=finalTerms.upfrontFee;if(loanFee>finance.transferBudget)continue;finance.transferBudget-=loanFee;finance.balance-=loanFee;sellerFinance.balance+=loanFee;moveOnLoan(state,deal.player,deal.seller,buyer,season,finalTerms);
        }
        recalcWages(world,state);completed=true;break;
      }
      if(completed)continue;
    }
  }
}
function annualFinanceReset(world:World,state:EconomyState):void{for(const club of world.clubs){const finance=state.finances.get(club.id)!;const commercial=5_000_000+club.reputation*220_000;const wagesAnnual=finance.wageSpend*52;finance.balance+=commercial-wagesAnnual;finance.balance=Math.max(-8_000_000,finance.balance);finance.transferBudget=Math.max(250_000,Math.round(Math.max(0,finance.balance)*.22/100000)*100000);finance.wageBudget=Math.max(finance.wageSpend*1.04,Math.round((220_000+club.reputation*8_900)/1000)*1000);}}
export function processOffseasonMarket(world:World,season:number):void{const state=economyState(world);resolveExpiredLoans(world,state,season);handleContracts(world,state,season);signFreeAgents(world,state,season);runTransferAI(world,state,season);annualFinanceReset(world,state);recalcWages(world,state);}
export function clubFinance(world:World,clubId:string):ClubFinance|undefined{return economyState(world).finances.get(clubId);}
export function playerContract(world:World,playerId:string):Contract|undefined{return economyState(world).contracts.get(playerId);}
export function recentTransfers(world:World,limit=30):TransferRecord[]{return[...economyState(world).transfers].reverse().slice(0,limit);}
export function activeLoans(world:World,clubId?:string):LoanRecord[]{return economyState(world).loans.filter(l=>l.active&&(!clubId||l.parentClubId===clubId||l.loanClubId===clubId));}
