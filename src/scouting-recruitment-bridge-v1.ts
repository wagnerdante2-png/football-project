import type { Club, Player, Position, World } from './engine';
import { economyState, playerMarketValue } from './economy';
import { realPlayerByIdV2 } from './real-world-player-import-v2';
import { evaluateRecruitmentProposal, recruitmentWorkflowState, type RecruitmentProposal } from './recruitment-workflow';
import { scoutingReport } from './scouting';
import { worldPlayerById, worldPlayerClub } from './world-player-pool-v1';

export type ScoutingMarketStatus={
  playerId:string;
  transactionReady:boolean;
  kind:'transfer'|'free'|'external-unmapped'|'own-player'|'missing';
  sellerClubId?:string;
  sellerName?:string;
  label:string;
  reason:string;
};

const minimum:Partial<Record<Position,number>>={GK:2,RB:2,CB:4,LB:2,DM:2,CM:3,AM:2,RW:2,LW:2,ST:3};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

function needScore(club:Club,player:Player){
  const same=club.players.filter(p=>p.position===player.position);
  const target=minimum[player.position]??2;
  const best=Math.max(0,...same.map(p=>p.currentAbility));
  const shortage=Math.max(0,target-same.length)*24;
  const quality=Math.max(0,player.currentAbility-best+8)*2.2;
  const potential=player.age<=23?Math.max(0,player.potentialAbility-player.currentAbility)*.8:0;
  return clamp(28+shortage+quality+potential,0,100);
}

function estimatedWage(player:Player,buyer:Club){
  const state=economyState as unknown;
  void state;
  const base=Math.pow(Math.max(20,player.currentAbility),2.05)*1.85;
  const rep=.75+buyer.reputation/140;
  const age=player.age<=21?.72:player.age>=32?.82:1;
  return Math.max(500,Math.round(base*rep*age/100)*100);
}

export function scoutingMarketStatus(world:World,buyerClubId:string,playerId:string):ScoutingMarketStatus{
  const player=worldPlayerById(world,playerId,economyState(world).freeAgents);
  if(!player)return{playerId,transactionReady:false,kind:'missing',label:'Indisponível',reason:'A identidade não existe na população ativa.'};
  if(player.clubId===buyerClubId)return{playerId,transactionReady:false,kind:'own-player',label:'Seu jogador',reason:'O atleta já pertence ao clube do treinador.'};
  const economy=economyState(world);
  if(economy.freeAgents.some(p=>p.id===playerId))return{playerId,transactionReady:true,kind:'free',label:'Agente livre',reason:'O jogador está explicitamente registrado como agente livre no estado econômico da carreira.'};
  const seller=worldPlayerClub(world,playerId);
  if(seller&&seller.id!==buyerClubId)return{playerId,transactionReady:true,kind:'transfer',sellerClubId:seller.id,sellerName:seller.name,label:'Negociação disponível',reason:`Vínculo ativo confirmado com ${seller.name}.`};
  const real=realPlayerByIdV2(world,playerId);
  const sourceClub=real?.sourceAssignment?.clubId;
  return{playerId,transactionReady:false,kind:'external-unmapped',label:'Apenas scouting',reason:sourceClub?`A fonte indica vínculo externo (${sourceClub}), mas ele ainda não foi resolvido para um clube transacionável do runtime.`:'A fonte não fornece vínculo atual confiável; o jogo não presume que o atleta esteja livre.'};
}

export function submitScoutedPlayerToRecruitment(world:World,buyerClubId:string,playerId:string):{ok:boolean;status:ScoutingMarketStatus;proposal?:RecruitmentProposal;reason?:string}{
  const status=scoutingMarketStatus(world,buyerClubId,playerId);
  if(!status.transactionReady)return{ok:false,status,reason:status.reason};
  const buyer=world.clubs.find(c=>c.id===buyerClubId),player=worldPlayerById(world,playerId,economyState(world).freeAgents);
  if(!buyer||!player)return{ok:false,status,reason:'Comprador ou jogador não encontrado no runtime.'};
  const state=recruitmentWorkflowState(world);
  const existing=[...state.proposals].reverse().find(p=>p.buyerClubId===buyerClubId&&p.playerId===playerId&&p.season===world.season&&p.status!=='rejected');
  if(existing)return{ok:true,status,proposal:existing};
  const economy=economyState(world),finance=economy.finances.get(buyer.id);
  if(!finance)return{ok:false,status,reason:'Finanças do clube comprador indisponíveis.'};
  const contract=economy.contracts.get(player.id);
  const fee=status.kind==='free'?0:Math.round(playerMarketValue(player)*1.08/10000)*10000;
  const wage=contract?.weeklyWage??estimatedWage(player,buyer);
  const report=scoutingReport(world,buyer.id,player.id);
  const urgency=needScore(buyer,player)>=75?'high':'normal';
  const proposal=evaluateRecruitmentProposal(world,buyer,player,{fee,expectedWage:wage,needScore:needScore(buyer,player),transferBudget:finance.transferBudget,wageBudget:finance.wageBudget,wageSpend:finance.wageSpend,sellerClubId:status.sellerClubId,initiatedBy:'scoutingDepartment',urgency});
  if((report?.confidence??0)<20&&proposal.status==='approved')proposal.status='deferred';
  return{ok:true,status,proposal};
}
