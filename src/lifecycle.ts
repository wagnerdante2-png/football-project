import type { Club, Fixture, Player, PlayerAttributes, Position, Standing, World } from './engine';

export type RetiredPlayer = {
  id: string;
  name: string;
  clubId: string;
  position: Position;
  age: number;
  currentAbility: number;
  retiredSeason: number;
};

export type YouthIntakeRecord = {
  season: number;
  clubId: string;
  playerId: string;
  name: string;
  position: Position;
  age: number;
  currentAbility: number;
  potentialAbility: number;
};

export type DevelopmentRecord = {
  season: number;
  clubId: string;
  playerId: string;
  name: string;
  age: number;
  before: number;
  after: number;
};

export type SeasonRecord = {
  season: number;
  championClubId: string;
  championPoints: number;
  topScorerId?: string;
  topScorerGoals: number;
};

export type CareerState = {
  completedSeasons: SeasonRecord[];
  retiredPlayers: RetiredPlayer[];
  youthIntakes: YouthIntakeRecord[];
  development: DevelopmentRecord[];
  releasedPlayers: RetiredPlayer[];
};

const stateByWorld = new WeakMap<World, CareerState>();
const metaByPlayer = new WeakMap<Player, { generatedSeason?: number }>();

const firstNames = ['Arthur','Bernardo','Cauã','Danilo','Eduardo','Fábio','Guilherme','Henrique','Iago','João','Kaique','Luan','Miguel','Nathan','Otávio','Paulo','Ruan','Samuel','Tomás','Victor','Yago'];
const lastNames = ['Amorim','Batista','Campos','Dias','Esteves','Freitas','Garcia','Lopes','Macedo','Moura','Neves','Pires','Ramos','Rezende','Santos','Souza','Tavares','Valente','Vieira'];
const positions: Position[] = ['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const rnd = () => Math.random();
const randomInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

export function careerState(world: World): CareerState {
  let state = stateByWorld.get(world);
  if (!state) {
    state = { completedSeasons: [], retiredPlayers: [], youthIntakes: [], development: [], releasedPlayers: [] };
    stateByWorld.set(world, state);
  }
  return state;
}

export function isAcademyPlayer(player: Player): boolean {
  return Boolean(metaByPlayer.get(player)?.generatedSeason);
}

export function academyGenerationSeason(player: Player): number | undefined {
  return metaByPlayer.get(player)?.generatedSeason;
}

function standings(clubs: Club[]): Record<string, Standing> {
  return Object.fromEntries(clubs.map(club => [club.id, { clubId: club.id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }]));
}

function roundRobin(clubs: Club[]): Fixture[] {
  const ids = clubs.map(club => club.id);
  if (ids.length % 2 !== 0) ids.push('BYE');
  const fixed = ids[0];
  let rotating = ids.slice(1);
  const firstLeg: Fixture[] = [];
  for (let round = 1; round < ids.length; round += 1) {
    const arrangement = [fixed, ...rotating];
    for (let i = 0; i < arrangement.length / 2; i += 1) {
      const a = arrangement[i];
      const b = arrangement[arrangement.length - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') {
        const swap = round % 2 === 0;
        firstLeg.push({ round, home: swap ? b : a, away: swap ? a : b, played: false });
      }
    }
    rotating = [rotating.at(-1)!, ...rotating.slice(0, -1)];
  }
  const legRounds = ids.length - 1;
  return [...firstLeg, ...firstLeg.map(f => ({ round: f.round + legRounds, home: f.away, away: f.home, played: false }))];
}

function seasonTopScorer(world: World): { id?: string; goals: number } {
  const goals = new Map<string, number>();
  for (const fixture of world.fixtures) {
    for (const event of fixture.events ?? []) {
      if (event.type === 'goal' && event.playerId) goals.set(event.playerId, (goals.get(event.playerId) ?? 0) + 1);
    }
  }
  const entry = [...goals.entries()].sort((a, b) => b[1] - a[1])[0];
  return entry ? { id: entry[0], goals: entry[1] } : { goals: 0 };
}

function recordSeason(world: World): void {
  const table = Object.values(world.standings).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const champion = table[0];
  if (!champion) return;
  const scorer = seasonTopScorer(world);
  careerState(world).completedSeasons.push({
    season: world.season,
    championClubId: champion.clubId,
    championPoints: champion.points,
    topScorerId: scorer.id,
    topScorerGoals: scorer.goals,
  });
}

function retirementChance(player: Player): number {
  const keeper = player.position === 'GK';
  const start = keeper ? 36 : 34;
  if (player.age < start) return 0;
  const base = keeper ? 0.05 : 0.08;
  const agePressure = (player.age - start) * (keeper ? 0.12 : 0.15);
  const abilityPressure = player.currentAbility < 55 ? 0.16 : player.currentAbility < 65 ? 0.07 : 0;
  return clamp(base + agePressure + abilityPressure, 0, player.age >= (keeper ? 42 : 40) ? 0.98 : 0.85);
}

function developmentDelta(player: Player): number {
  const gap = Math.max(0, player.potentialAbility - player.currentAbility);
  const keeper = player.position === 'GK';
  if (player.age <= 18) return gap > 0 ? randomInt(2, Math.min(6, Math.max(2, Math.ceil(gap / 4)))) : 0;
  if (player.age <= 21) return gap > 0 ? randomInt(1, Math.min(5, Math.max(1, Math.ceil(gap / 5)))) : 0;
  if (player.age <= 24) return gap > 0 ? randomInt(0, Math.min(3, Math.max(1, Math.ceil(gap / 7)))) : 0;
  if (player.age <= 28 || (keeper && player.age <= 31)) return randomInt(-1, 1);
  if (player.age <= 31 || (keeper && player.age <= 34)) return -randomInt(0, 2);
  if (player.age <= 34 || (keeper && player.age <= 37)) return -randomInt(1, 3);
  return -randomInt(2, keeper ? 4 : 5);
}

function evolveAttributes(player: Player, delta: number): void {
  const older = player.age >= 30;
  const young = player.age <= 23;
  const a = player.attributes;
  const shift = (key: keyof PlayerAttributes, multiplier = 1) => {
    let change = delta * multiplier + (rnd() - 0.5) * 1.3;
    if (older && (key === 'pace' || key === 'stamina')) change -= player.age >= 34 ? 1.7 : 0.7;
    if ((older || player.age >= 27) && key === 'decisions') change += delta < 0 ? 0.5 : 0.8;
    if (young && key === 'technique') change += 0.4;
    a[key] = Math.round(clamp(a[key] + change, 20, 99));
  };
  shift('pace'); shift('passing'); shift('technique'); shift('finishing'); shift('tackling'); shift('positioning'); shift('stamina'); shift('decisions');
  shift('goalkeeping', player.position === 'GK' ? 1 : 0.25);
}

function ageAndDevelop(world: World): void {
  const state = careerState(world);
  for (const club of world.clubs) {
    for (const player of club.players) {
      const before = player.currentAbility;
      player.age += 1;
      const delta = developmentDelta(player);
      player.currentAbility = Math.round(clamp(player.currentAbility + delta, 35, player.potentialAbility));
      evolveAttributes(player, player.currentAbility - before);
      player.condition = randomInt(91, 100);
      player.morale = Math.round(clamp(player.morale + randomInt(-5, 7), 45, 100));
      if (player.currentAbility !== before) {
        state.development.push({ season: world.season + 1, clubId: club.id, playerId: player.id, name: player.name, age: player.age, before, after: player.currentAbility });
      }
    }
  }
}

function retirePlayers(world: World): void {
  const state = careerState(world);
  for (const club of world.clubs) {
    const survivors: Player[] = [];
    for (const player of club.players) {
      if (rnd() < retirementChance(player)) {
        state.retiredPlayers.push({ id: player.id, name: player.name, clubId: club.id, position: player.position, age: player.age, currentAbility: player.currentAbility, retiredSeason: world.season + 1 });
      } else {
        survivors.push(player);
      }
    }
    club.players = survivors;
  }
}

function positionalNeeds(club: Club): Position[] {
  const minimum: Partial<Record<Position, number>> = { GK:2, RB:2, CB:4, LB:2, DM:2, CM:3, AM:2, RW:2, LW:2, ST:3 };
  const needs: Position[] = [];
  for (const position of positions) {
    const count = club.players.filter(p => p.position === position).length;
    for (let i = count; i < (minimum[position] ?? 1); i += 1) needs.push(position);
  }
  return needs;
}

function youthAttributes(base: number, position: Position): PlayerAttributes {
  const pos = position;
  const value = (bias = 0) => Math.round(clamp(base + bias + randomInt(-8, 8), 25, 88));
  return {
    pace: value(['RB','LB','RW','LW'].includes(pos) ? 8 : pos === 'GK' ? -8 : 0),
    passing: value(['DM','CM','AM'].includes(pos) ? 8 : pos === 'GK' ? -7 : 0),
    technique: value(['AM','RW','LW','ST'].includes(pos) ? 6 : 0),
    finishing: value(pos === 'ST' ? 10 : ['AM','RW','LW'].includes(pos) ? 5 : -5),
    tackling: value(['CB','RB','LB','DM'].includes(pos) ? 9 : -5),
    positioning: value(['GK','CB','DM'].includes(pos) ? 8 : 2),
    stamina: value(['RB','LB','DM','CM'].includes(pos) ? 6 : 0),
    decisions: value(0),
    goalkeeping: value(pos === 'GK' ? 15 : -32),
  };
}

function createAcademyPlayer(club: Club, world: World, position: Position, serial: number): Player {
  const reputationBase = 40 + club.reputation * 0.22;
  const age = randomInt(16, 18);
  const currentAbility = Math.round(clamp(reputationBase + randomInt(-9, 8), 38, 69));
  const rareTalent = rnd() < 0.07;
  const potentialAbility = Math.round(clamp(currentAbility + randomInt(10, rareTalent ? 32 : 25), currentAbility + 5, rareTalent ? 96 : 90));
  const first = firstNames[randomInt(0, firstNames.length - 1)];
  const last = lastNames[randomInt(0, lastNames.length - 1)];
  const player: Player = {
    id: `${club.id}-y${world.season + 1}-${serial}-${Math.floor(rnd()*1_000_000)}`,
    clubId: club.id,
    name: `${first} ${last}`,
    position,
    age,
    currentAbility,
    potentialAbility,
    condition: randomInt(94, 100),
    morale: randomInt(72, 96),
    attributes: youthAttributes(currentAbility, position),
  };
  metaByPlayer.set(player, { generatedSeason: world.season + 1 });
  return player;
}

function youthIntake(world: World): void {
  const state = careerState(world);
  for (const club of world.clubs) {
    const needs = positionalNeeds(club);
    const desired = Math.max(4, 24 - club.players.length + randomInt(2, 4));
    const intakeCount = clamp(Math.max(desired, needs.length), 4, 9);
    for (let i = 0; i < intakeCount; i += 1) {
      const position = needs.shift() ?? positions[randomInt(0, positions.length - 1)];
      const player = createAcademyPlayer(club, world, position, i + 1);
      club.players.push(player);
      state.youthIntakes.push({ season: world.season + 1, clubId: club.id, playerId: player.id, name: player.name, position: player.position, age: player.age, currentAbility: player.currentAbility, potentialAbility: player.potentialAbility });
    }
  }
}

function squadValue(player: Player): number {
  const ageFactor = player.age <= 21 ? Math.max(0, player.potentialAbility - player.currentAbility) * 0.7 : player.age >= 32 ? -8 : 0;
  return player.currentAbility + ageFactor;
}

function trimSquads(world: World): void {
  const state = careerState(world);
  for (const club of world.clubs) {
    if (club.players.length <= 30) continue;
    const sorted = [...club.players].sort((a, b) => squadValue(b) - squadValue(a));
    const keep = new Set(sorted.slice(0, 30).map(p => p.id));
    for (const player of club.players) {
      if (!keep.has(player.id)) state.releasedPlayers.push({ id: player.id, name: player.name, clubId: club.id, position: player.position, age: player.age, currentAbility: player.currentAbility, retiredSeason: world.season + 1 });
    }
    club.players = club.players.filter(player => keep.has(player.id));
  }
}

export function seasonFinished(world: World): boolean {
  return world.fixtures.length > 0 && world.fixtures.every(fixture => fixture.played);
}

export function advanceToNextSeason(world: World): void {
  if (!seasonFinished(world)) return;
  recordSeason(world);
  ageAndDevelop(world);
  retirePlayers(world);
  youthIntake(world);
  trimSquads(world);
  world.season += 1;
  world.round = 1;
  world.fixtures = roundRobin(world.clubs);
  world.standings = standings(world.clubs);
}

export function simulateSeasons(world: World, count: number, playRound: (world: World) => void): void {
  const target = Math.max(0, Math.floor(count));
  for (let seasonIndex = 0; seasonIndex < target; seasonIndex += 1) {
    while (!seasonFinished(world)) playRound(world);
    advanceToNextSeason(world);
  }
}
