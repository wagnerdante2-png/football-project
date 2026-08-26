import type { Club, Player, World } from './engine';
import { economyState, type TransferRecord } from './economy';
import type { NegotiationPackage } from './negotiation';

export type BackgroundTransferResult={ok:boolean;reason?:string;transfer?:TransferRecord};

export function executeBackgroundPermanentTransfer(world:World,buyer:Club,player:Player,fromClubId:string,terms:NegotiationPackage):BackgroundTransferResult{
  if(!fromClubId||fromClubId===buyer.id)return{ok:false,reason:'Clube vendedor factual inválido.'};
  if(terms.type!=='permanent')return{ok:false,reason:'O adaptador de background suporta apenas transferência permanente nesta versão.'};
  const state=economyState(world),finance=state.finances.get(buyer.id);if(!finance)return{ok:false,reason:'Finanças do comprador indisponíveis.'};
  const fee=terms.upfrontFee+terms.installments*terms.installmentValue,totalDebit=fee+terms.signingBonus+terms.agentFee;
  if(fee>finance.transferBudget)return{ok:false,reason:'Taxa total supera o orçamento de transferências do comprador.'};
  if(totalDebit>finance.balance+Math.max(0,finance.transferBudget-fee))return{ok:false,reason:'Caixa insuficiente para taxa, luvas e comissão do agente.'};
  finance.transferBudget-=fee;finance.balance-=totalDebit;
  for(const club of world.clubs)club.players=club.players.filter(p=>p.id!==player.id);
  state.freeAgents=state.freeAgents.filter(p=>p.id!==player.id);
  player.clubId=buyer.id;if(!buyer.players.some(p=>p.id===player.id))buyer.players.push(player);
  state.contracts.set(player.id,{playerId:player.id,clubId:buyer.id,startSeason:world.season,endSeason:world.season+terms.contractYears,weeklyWage:terms.weeklyWage,squadStatus:terms.squadRole});
  const transfer:TransferRecord={season:world.season,playerId:player.id,playerName:player.name,fromClubId,toClubId:buyer.id,fee,weeklyWage:terms.weeklyWage,kind:'transfer'};state.transfers.push(transfer);
  let wageSpend=0;for(const p of buyer.players){const contract=state.contracts.get(p.id);if(contract)wageSpend+=contract.weeklyWage;}finance.wageSpend=Math.round(wageSpend);
  return{ok:true,transfer};
}
