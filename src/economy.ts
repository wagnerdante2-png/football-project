import type { Club, Player, Position, World } from './engine';

export type Contract = {
  playerId: string;
  clubId: string;
  startSeason: number;
  endSeason: number;
  weeklyWage: number;
  squadStatus: 'star' | 'starter' | 'rotation' | 'prospect' | 'backup';
};

export type ClubFinance = {
  clubId: string;
  balance: number;
  transferBudget: number;
  wageBudget: number;
  wageSpend: number;
};

export type TransferRecord = {
  season: number;
  playerId: string;
  playerName: string;
  fromClubId?: string;
  toClubId?: string;
  fee: number;
  weeklyWage: number;
  kind: 'transfer' | 'free' | 'renewal' | 'release';
};

export type EconomyState = {
  contracts: Map<string, Contract>;
  finances: Map<string, ClubFinance>;
  freeAgents: Player[];
  transfers: TransferRecord[];
};

const economyByWorld = new WeakMap<World, EconomyState>();
const positions: Position[] = ['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST'];
const minimum: Partial<Record<Position, number>> = { GK:2, RB:2, CB:4, LB:2, DM:2, CM:3, AM:2, RW:2, LW:2, ST:3 };
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd = () => Math.random();

function statusFor(player: Player, club: Club): Contract['squadStatus'] {
  const rank = [...club.players].sort((a,b)=>b.currentAbility-a.currentAbility).findIndex(p=>p.id===player.id);
  if (player.age <= 21 && player.potentialAbility - player.currentAbility >= 8) return 'prospect';
  if (rank < 4) return 'star';
  if (rank < 11) return 'starter';
  if (rank < 18) return 'rotation';
  return 'backup';
}

export function playerMarketValue(player: Player): number {
  const ability = Math.pow(Math.max(1, player.currentAbility - 35), 2.15) * 3200;
  const potentialPremium = player.age <= 23 ? Math.max(0, player.potentialAbility - player.currentAbility) * 145000 : 0;
  const ageMultiplier = player.age <= 20 ? 1.28 : player.age <= 24 ? 1.18 : player.age <= 28 ? 1 : player.age <= 31 ? .78 : player.age <= 34 ? .48 : .22;
  return Math.round((ability + potentialPremium) * ageMultiplier / 10000) * 10000;
}

function suggestedWage(player: Player, club: Club): number {
  const status = statusFor(player, club);
  const statusFactor = status === 'star' ? 1.45 : status === 'starter' ? 1.15 : status === 'rotation' ? .82 : status === 'prospect' ? .55 : .48;
  const reputationFactor = .75 + club.reputation / 140;
  const base = Math.pow(Math.max(20, player.currentAbility), 2.05) * 1.85;
  return Math.round(base * statusFactor * reputationFactor / 100) * 100;
}

function createFinance(club: Club): ClubFinance {
  const scale = club.reputation / 75;
  const balance = Math.round((12_000_000 + 44_000_000 * scale) / 100000) * 100000;
  return {
    clubId: club.id,
    balance,
    transferBudget: Math.round(balance * .28 / 100000) * 100000,
    wageBudget: Math.round((210_000 + club.reputation * 8_600) / 1000) * 1000,
    wageSpend: 0,
  };
}

export function economyState(world: World): EconomyState {
  let state = economyByWorld.get(world);
  if (!state) {
    state = { contracts:new Map(), finances:new Map(), freeAgents:[], transfers:[] };
    economyByWorld.set(world,state);
  }
  for (const club of world.clubs) {
    if (!state.finances.has(club.id)) state.finances.set(club.id, createFinance(club));
    for (const player of club.players) {
      if (!state.contracts.has(player.id)) {
        const duration = player.age <= 21 ? 4 : player.age >= 32 ? 1 + Math.floor(rnd()*2) : 2 + Math.floor(rnd()*3);
        state.contracts.set(player.id, {
          playerId:player.id, clubId:club.id, startSeason:world.season, endSeason:world.season+duration,
          weeklyWage:suggestedWage(player,club), squadStatus:statusFor(player,club),
        });
      }
    }
  }
  recalcWages(world,state);
  return state;
}

function recalcWages(world: World, state: EconomyState): void {
  for (const club of world.clubs) {
    const finance = state.finances.get(club.id)!;
    finance.wageSpend = club.players.reduce((sum,p)=>sum+(state.contracts.get(p.id)?.weeklyWage ?? 0),0);
  }
}

function positionalNeed(club: Club, position: Position): number {
  const count = club.players.filter(p=>p.position===position).length;
  const target = minimum[position] ?? 2;
  const best = Math.max(0,...club.players.filter(p=>p.position===position).map(p=>p.currentAbility));
  return Math.max(0,target-count)*22 + Math.max(0,72-best)*.35;
}

function saleWillingness(club: Club, player: Player): number {
  const status = statusFor(player,club);
  const surplus = club.players.filter(p=>p.position===player.position).length - (minimum[player.position] ?? 2);
  let score = surplus*12 + Math.max(0,player.age-29)*3;
  if (status === 'backup') score += 28;
  if (status === 'rotation') score += 12;
  if (status === 'star') score -= 35;
  if (player.age <= 21 && player.potentialAbility >= 82) score -= 18;
  return score;
}

function movePlayer(state: EconomyState, player: Player, from: Club | undefined, to: Club, season: number, fee: number, kind: TransferRecord['kind']): void {
  if (from) from.players = from.players.filter(p=>p.id!==player.id);
  state.freeAgents = state.freeAgents.filter(p=>p.id!==player.id);
  player.clubId = to.id;
  to.players.push(player);
  const wage = suggestedWage(player,to);
  state.contracts.set(player.id,{ playerId:player.id, clubId:to.id, startSeason:season, endSeason:season+(player.age<=22?4:player.age>=32?2:3), weeklyWage:wage, squadStatus:statusFor(player,to) });
  state.transfers.push({ season, playerId:player.id, playerName:player.name, fromClubId:from?.id, toClubId:to.id, fee, weeklyWage:wage, kind });
}

function handleContracts(world: World, state: EconomyState, season: number): void {
  for (const club of world.clubs) {
    for (const player of [...club.players]) {
      const contract = state.contracts.get(player.id);
      if (!contract || contract.endSeason > season) continue;
      const importance = statusFor(player,club);
      const renewScore = player.currentAbility + Math.max(0,player.potentialAbility-player.currentAbility)*.45 - Math.max(0,player.age-31)*3 + (importance==='star'?14:importance==='starter'?7:0);
      if (renewScore >= 66 && club.players.length <= 29) {
        const wage = suggestedWage(player,club);
        state.contracts.set(player.id,{...contract,startSeason:season,endSeason:season+(player.age>=32?1+Math.floor(rnd()*2):3),weeklyWage:wage,squadStatus:importance});
        state.transfers.push({ season, playerId:player.id, playerName:player.name, fromClubId:club.id, toClubId:club.id, fee:0, weeklyWage:wage, kind:'renewal' });
      } else {
        club.players = club.players.filter(p=>p.id!==player.id);
        player.clubId = 'FREE';
        state.freeAgents.push(player);
        state.contracts.delete(player.id);
        state.transfers.push({ season, playerId:player.id, playerName:player.name, fromClubId:club.id, fee:0, weeklyWage:0, kind:'release' });
      }
    }
  }
}

function signFreeAgents(world: World, state: EconomyState, season: number): void {
  for (const club of [...world.clubs].sort(()=>rnd()-.5)) {
    const finance = state.finances.get(club.id)!;
    for (const position of positions) {
      if (positionalNeed(club,position) < 12) continue;
      const candidates = state.freeAgents.filter(p=>p.position===position).sort((a,b)=> (b.currentAbility + (b.potentialAbility-b.currentAbility)*.25) - (a.currentAbility + (a.potentialAbility-a.currentAbility)*.25));
      const pick = candidates[0];
      if (!pick) continue;
      const wage = suggestedWage(pick,club);
      if (finance.wageSpend + wage > finance.wageBudget*1.05) continue;
      movePlayer(state,pick,undefined,club,season,0,'free');
      recalcWages(world,state);
    }
  }
}

function runTransferAI(world: World, state: EconomyState, season: number): void {
  const buyers = [...world.clubs].sort((a,b)=>b.reputation-a.reputation);
  for (const buyer of buyers) {
    const finance = state.finances.get(buyer.id)!;
    const needs = positions.map(position=>({position,need:positionalNeed(buyer,position)})).sort((a,b)=>b.need-a.need).slice(0,3);
    for (const {position,need} of needs) {
      if (need < 8 || buyer.players.length >= 30 || finance.transferBudget < 150000) continue;
      const candidates: {player:Player; seller:Club; score:number; fee:number}[] = [];
      for (const seller of world.clubs) {
        if (seller.id===buyer.id) continue;
        for (const player of seller.players.filter(p=>p.position===position)) {
          const value = playerMarketValue(player);
          const reputationJump = buyer.reputation - seller.reputation;
          const sell = saleWillingness(seller,player);
          const affordability = value <= finance.transferBudget*.72;
          if (!affordability || sell < -10) continue;
          const score = player.currentAbility + Math.max(0,player.potentialAbility-player.currentAbility)*(player.age<=23?.55:.15) + reputationJump*.08 + sell*.08 + rnd()*6;
          const fee = Math.round(value * clamp(1.02 + (20-sell)/100,.82,1.38) / 10000)*10000;
          candidates.push({player,seller,score,fee});
        }
      }
      candidates.sort((a,b)=>b.score-a.score);
      const deal = candidates[0];
      if (!deal || deal.fee > finance.transferBudget) continue;
      const sellerFinance = state.finances.get(deal.seller.id)!;
      finance.transferBudget -= deal.fee;
      finance.balance -= deal.fee;
      sellerFinance.balance += deal.fee;
      sellerFinance.transferBudget += Math.round(deal.fee*.55);
      movePlayer(state,deal.player,deal.seller,buyer,season,deal.fee,'transfer');
      recalcWages(world,state);
    }
  }
}

function annualFinanceReset(world: World, state: EconomyState): void {
  for (const club of world.clubs) {
    const finance = state.finances.get(club.id)!;
    const commercial = 5_000_000 + club.reputation*220_000;
    const wagesAnnual = finance.wageSpend*52;
    finance.balance += commercial - wagesAnnual;
    finance.balance = Math.max(-8_000_000,finance.balance);
    finance.transferBudget = Math.max(250_000,Math.round(Math.max(0,finance.balance)*.22/100000)*100000);
    finance.wageBudget = Math.max(finance.wageSpend*1.04,Math.round((220_000+club.reputation*8_900)/1000)*1000);
  }
}

export function processOffseasonMarket(world: World, season: number): void {
  const state = economyState(world);
  handleContracts(world,state,season);
  signFreeAgents(world,state,season);
  runTransferAI(world,state,season);
  annualFinanceReset(world,state);
  recalcWages(world,state);
}

export function clubFinance(world: World, clubId: string): ClubFinance | undefined {
  return economyState(world).finances.get(clubId);
}

export function playerContract(world: World, playerId: string): Contract | undefined {
  return economyState(world).contracts.get(playerId);
}

export function recentTransfers(world: World, limit = 30): TransferRecord[] {
  return [...economyState(world).transfers].reverse().slice(0,limit);
}
