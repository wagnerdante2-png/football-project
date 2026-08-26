import type { Player, World } from './engine';
import { economyState, type ClubFinance, type Contract, type LoanRecord, type TransferRecord } from './economy';
import { realPlayerByIdV2 } from './real-world-player-import-v2';

export type EconomyRuntimeSnapshot={contracts:[string,Contract][];finances:[string,ClubFinance][];freeAgents:Player[];transfers:TransferRecord[];loans:LoanRecord[]};
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

function canonicalPlayer(world:World,player:Player):Player{
  for(const club of world.clubs){const found=club.players.find(p=>p.id===player.id);if(found)return found;}
  return realPlayerByIdV2(world,player.id)?.player??clone(player);
}
function recalcWages(world:World):void{
  const state=economyState(world);
  for(const club of world.clubs){
    const finance=state.finances.get(club.id);if(!finance)continue;let spend=0;
    for(const player of club.players){const contract=state.contracts.get(player.id);if(!contract)continue;const loan=state.loans.find(l=>l.playerId===player.id&&l.active);spend+=loan&&loan.loanClubId===club.id?contract.weeklyWage*(loan.wageContributionPct/100):contract.weeklyWage;}
    for(const loan of state.loans.filter(l=>l.active&&l.parentClubId===club.id)){const contract=state.contracts.get(loan.playerId);if(contract)spend+=contract.weeklyWage*(1-loan.wageContributionPct/100);}
    finance.wageSpend=Math.round(spend);
  }
}

export function snapshotEconomyRuntime(world:World):EconomyRuntimeSnapshot{
  const state=economyState(world);
  return{contracts:[...state.contracts].map(([k,v])=>[k,clone(v)]),finances:[...state.finances].map(([k,v])=>[k,clone(v)]),freeAgents:clone(state.freeAgents),transfers:clone(state.transfers),loans:clone(state.loans)};
}

export function restoreEconomyRuntime(world:World,snapshot?:EconomyRuntimeSnapshot):void{
  if(!snapshot)return;
  const state=economyState(world);
  state.contracts=new Map((snapshot.contracts??[]).map(([k,v])=>[k,clone(v)]));
  state.finances=new Map((snapshot.finances??[]).map(([k,v])=>[k,clone(v)]));
  state.freeAgents=(snapshot.freeAgents??[]).map(player=>canonicalPlayer(world,player));
  state.transfers=clone(snapshot.transfers??[]);
  state.loans=clone(snapshot.loans??[]);
  for(const club of world.clubs)if(!state.finances.has(club.id))economyState(world);
  recalcWages(world);
}
