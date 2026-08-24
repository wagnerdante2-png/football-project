import type { Club, Player, PlayerAttributes, Position, World } from './engine';
import { playerMarketValue } from './economy';

export type ScoutProfile = {
  clubId: string;
  judgingAbility: number;
  judgingPotential: number;
  adaptability: number;
  capacity: number;
};

export type KnowledgeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type PlayerKnowledge = {
  observerClubId: string;
  playerId: string;
  level: KnowledgeLevel;
  progress: number;
  lastSeenSeason: number;
  lastSeenRound: number;
};

export type ScoutAssignment = {
  observerClubId: string;
  playerId: string;
  startedSeason: number;
  startedRound: number;
  active: boolean;
};

export type AttributeEstimate = {
  min: number;
  max: number;
};

export type ScoutingReport = {
  playerId: string;
  playerName: string;
  clubId: string;
  position: Position;
  age: number;
  knowledge: KnowledgeLevel;
  confidence: number;
  currentAbility: AttributeEstimate;
  potentialAbility: AttributeEstimate;
  marketValue: AttributeEstimate;
  attributes: Partial<Record<keyof PlayerAttributes, AttributeEstimate>>;
  recommendation: 'avoid' | 'monitor' | 'consider' | 'strong' | 'elite';
  summary: string;
};

export type ScoutingState = {
  profiles: Map<string, ScoutProfile>;
  knowledge: Map<string, PlayerKnowledge>;
  assignments: ScoutAssignment[];
  shortlists: Map<string, Set<string>>;
};

const stateByWorld = new WeakMap<World, ScoutingState>();
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd = () => Math.random();
const key = (clubId:string, playerId:string) => `${clubId}::${playerId}`;

function profileFor(club: Club): ScoutProfile {
  const rep = club.reputation;
  return {
    clubId: club.id,
    judgingAbility: Math.round(clamp(45 + rep * .48 + (rnd()-.5)*8, 45, 94)),
    judgingPotential: Math.round(clamp(42 + rep * .5 + (rnd()-.5)*10, 42, 94)),
    adaptability: Math.round(clamp(48 + rep * .4 + (rnd()-.5)*12, 40, 92)),
    capacity: rep >= 82 ? 8 : rep >= 74 ? 6 : rep >= 67 ? 5 : 4,
  };
}

export function scoutingState(world: World): ScoutingState {
  let state = stateByWorld.get(world);
  if (!state) {
    state = { profiles:new Map(), knowledge:new Map(), assignments:[], shortlists:new Map() };
    stateByWorld.set(world,state);
  }
  for (const club of world.clubs) {
    if (!state.profiles.has(club.id)) state.profiles.set(club.id, profileFor(club));
    if (!state.shortlists.has(club.id)) state.shortlists.set(club.id,new Set());
    for (const player of club.players) {
      const ownKey = key(club.id,player.id);
      if (!state.knowledge.has(ownKey)) {
        state.knowledge.set(ownKey,{ observerClubId:club.id, playerId:player.id, level:5, progress:100, lastSeenSeason:world.season, lastSeenRound:world.round });
      }
    }
  }
  return state;
}

function playerClub(world: World, playerId: string): Club | undefined {
  return world.clubs.find(club => club.players.some(player => player.id===playerId));
}

function playerById(world: World, playerId: string): Player | undefined {
  for (const club of world.clubs) {
    const player = club.players.find(p=>p.id===playerId);
    if (player) return player;
  }
  return undefined;
}

function baseExternalKnowledge(world: World, observer: Club, target: Player): PlayerKnowledge {
  const targetClub = playerClub(world,target.id);
  const fame = (target.currentAbility-55)*.7 + Math.max(0,target.potentialAbility-78)*.45 + (targetClub?.reputation ?? 60)*.12;
  const observerReach = observer.reputation*.22;
  const progress = clamp(8 + fame + observerReach + rnd()*16, 5, 58);
  const level = progress >= 52 ? 2 : progress >= 26 ? 1 : 0;
  return { observerClubId:observer.id, playerId:target.id, level:level as KnowledgeLevel, progress, lastSeenSeason:world.season, lastSeenRound:world.round };
}

export function knowledgeFor(world: World, observerClubId: string, playerId: string): PlayerKnowledge {
  const state = scoutingState(world);
  const existing = state.knowledge.get(key(observerClubId,playerId));
  if (existing) return existing;
  const observer = world.clubs.find(c=>c.id===observerClubId)!;
  const player = playerById(world,playerId)!;
  const created = player.clubId === observerClubId
    ? { observerClubId, playerId, level:5 as KnowledgeLevel, progress:100, lastSeenSeason:world.season, lastSeenRound:world.round }
    : baseExternalKnowledge(world,observer,player);
  state.knowledge.set(key(observerClubId,playerId),created);
  return created;
}

function levelFromProgress(progress:number): KnowledgeLevel {
  if (progress >= 92) return 5;
  if (progress >= 76) return 4;
  if (progress >= 56) return 3;
  if (progress >= 32) return 2;
  if (progress >= 14) return 1;
  return 0;
}

export function assignScout(world: World, observerClubId: string, playerId: string): boolean {
  const state = scoutingState(world);
  const profile = state.profiles.get(observerClubId)!;
  const active = state.assignments.filter(a=>a.observerClubId===observerClubId && a.active);
  if (active.some(a=>a.playerId===playerId)) return true;
  if (active.length >= profile.capacity) return false;
  state.assignments.push({ observerClubId, playerId, startedSeason:world.season, startedRound:world.round, active:true });
  return true;
}

export function cancelScout(world: World, observerClubId: string, playerId: string): void {
  const assignment = scoutingState(world).assignments.find(a=>a.observerClubId===observerClubId && a.playerId===playerId && a.active);
  if (assignment) assignment.active=false;
}

export function tickScoutingRound(world: World): void {
  const state = scoutingState(world);
  for (const assignment of state.assignments.filter(a=>a.active)) {
    const profile = state.profiles.get(assignment.observerClubId);
    const player = playerById(world,assignment.playerId);
    if (!profile || !player) { assignment.active=false; continue; }
    const knowledge = knowledgeFor(world,assignment.observerClubId,assignment.playerId);
    const gain = 6 + profile.adaptability*.045 + profile.judgingAbility*.025 + rnd()*4;
    knowledge.progress = clamp(knowledge.progress + gain,0,100);
    knowledge.level = levelFromProgress(knowledge.progress);
    knowledge.lastSeenSeason = world.season;
    knowledge.lastSeenRound = world.round;
    if (knowledge.level===5) assignment.active=false;
  }
}

export function scoutingSeasonTurn(world: World): void {
  const state = scoutingState(world);
  for (const knowledge of state.knowledge.values()) {
    if (knowledge.level===5) continue;
    const seasonsOld = Math.max(0,world.season-knowledge.lastSeenSeason);
    if (seasonsOld>0) {
      knowledge.progress = clamp(knowledge.progress - seasonsOld*9,0,100);
      knowledge.level = levelFromProgress(knowledge.progress);
    }
  }
  for (const club of world.clubs) {
    for (const player of club.players) {
      const own = knowledgeFor(world,club.id,player.id);
      own.progress=100; own.level=5; own.lastSeenSeason=world.season; own.lastSeenRound=world.round;
    }
  }
}

function estimate(real:number, knowledge:PlayerKnowledge, judge:number, absoluteMin:number, absoluteMax:number): AttributeEstimate {
  if (knowledge.level===5) return {min:Math.round(real),max:Math.round(real)};
  const uncertaintyByLevel = [24,18,13,9,5,0][knowledge.level];
  const judgePenalty = (100-judge)*.07;
  const spread = uncertaintyByLevel + judgePenalty;
  const bias = (rnd()-.5)*spread*.5;
  const center = real+bias;
  return {
    min: Math.round(clamp(center-spread*.55,absoluteMin,absoluteMax)),
    max: Math.round(clamp(center+spread*.55,absoluteMin,absoluteMax)),
  };
}

function recommendation(player:Player, ca:AttributeEstimate, pa:AttributeEstimate): ScoutingReport['recommendation'] {
  const projected = (ca.min+ca.max)*.35 + (pa.min+pa.max)*.15;
  const ageBonus = player.age<=20 ? 8 : player.age<=23 ? 4 : player.age>=32 ? -7 : 0;
  const score = projected+ageBonus;
  if (score>=91) return 'elite';
  if (score>=79) return 'strong';
  if (score>=68) return 'consider';
  if (score>=58) return 'monitor';
  return 'avoid';
}

function summaryFor(player:Player, rec:ScoutingReport['recommendation'], knowledge:PlayerKnowledge): string {
  const prefix = knowledge.level<=1 ? 'Informação muito limitada.' : knowledge.level===2 ? 'Relatório preliminar.' : knowledge.level===3 ? 'Boa leitura inicial.' : knowledge.level===4 ? 'Relatório avançado.' : 'Conhecimento completo.';
  const verdict = rec==='elite' ? 'Perfil raro, merece prioridade máxima.' : rec==='strong' ? 'Forte candidato para reforçar o elenco.' : rec==='consider' ? 'Opção competitiva, vale aprofundar.' : rec==='monitor' ? 'Acompanhar evolução antes de agir.' : 'Pouca aderência ao nível atual do clube.';
  const youth = player.age<=21 ? ' Jovem com margem de desenvolvimento.' : '';
  return `${prefix} ${verdict}${youth}`;
}

export function scoutingReport(world: World, observerClubId: string, playerId: string): ScoutingReport | undefined {
  const state = scoutingState(world);
  const player = playerById(world,playerId);
  if (!player) return undefined;
  const knowledge = knowledgeFor(world,observerClubId,playerId);
  const profile = state.profiles.get(observerClubId)!;
  const ca = estimate(player.currentAbility,knowledge,profile.judgingAbility,20,99);
  const pa = estimate(player.potentialAbility,knowledge,profile.judgingPotential,20,99);
  const trueValue = playerMarketValue(player);
  const valueJudge = (profile.judgingAbility+profile.judgingPotential)/2;
  const market = estimate(trueValue,knowledge,valueJudge,0,400_000_000);
  const attrs: Partial<Record<keyof PlayerAttributes,AttributeEstimate>> = {};
  const visibleCount = [0,2,4,6,8,9][knowledge.level];
  const ordered = (Object.keys(player.attributes) as (keyof PlayerAttributes)[])
    .sort((a,b)=>player.attributes[b]-player.attributes[a]);
  for (const attr of ordered.slice(0,visibleCount)) attrs[attr]=estimate(player.attributes[attr],knowledge,profile.judgingAbility,1,99);
  const rec = recommendation(player,ca,pa);
  return {
    playerId:player.id, playerName:player.name, clubId:player.clubId, position:player.position, age:player.age,
    knowledge:knowledge.level, confidence:Math.round(knowledge.progress), currentAbility:ca, potentialAbility:pa, marketValue:market,
    attributes:attrs, recommendation:rec, summary:summaryFor(player,rec,knowledge),
  };
}

export function scoutingCandidates(world: World, observerClubId: string, position?: Position, limit=30): ScoutingReport[] {
  const reports: ScoutingReport[] = [];
  for (const club of world.clubs) {
    if (club.id===observerClubId) continue;
    for (const player of club.players) {
      if (position && player.position!==position) continue;
      const report = scoutingReport(world,observerClubId,player.id);
      if (report) reports.push(report);
    }
  }
  const score = (r:ScoutingReport) => (r.currentAbility.min+r.currentAbility.max)*.34 + (r.potentialAbility.min+r.potentialAbility.max)*.16 + (r.age<=21?7:r.age<=24?3:0) + r.confidence*.05;
  return reports.sort((a,b)=>score(b)-score(a)).slice(0,limit);
}

export function toggleShortlist(world: World, observerClubId: string, playerId: string): boolean {
  const set = scoutingState(world).shortlists.get(observerClubId)!;
  if (set.has(playerId)) { set.delete(playerId); return false; }
  set.add(playerId); return true;
}

export function isShortlisted(world: World, observerClubId: string, playerId: string): boolean {
  return scoutingState(world).shortlists.get(observerClubId)?.has(playerId) ?? false;
}

export function shortlistedReports(world: World, observerClubId: string): ScoutingReport[] {
  const set = scoutingState(world).shortlists.get(observerClubId) ?? new Set<string>();
  return [...set].map(id=>scoutingReport(world,observerClubId,id)).filter((r):r is ScoutingReport=>Boolean(r));
}

export function scoutProfile(world: World, clubId: string): ScoutProfile | undefined {
  return scoutingState(world).profiles.get(clubId);
}

export function activeAssignments(world: World, clubId: string): ScoutAssignment[] {
  return scoutingState(world).assignments.filter(a=>a.observerClubId===clubId && a.active);
}
