export type Position = 'GK' | 'RB' | 'CB' | 'LB' | 'DM' | 'CM' | 'AM' | 'RW' | 'LW' | 'ST';

export type PlayerAttributes = {
  pace: number;
  passing: number;
  technique: number;
  finishing: number;
  tackling: number;
  positioning: number;
  stamina: number;
  decisions: number;
  goalkeeping: number;
};

export type Player = {
  id: string;
  clubId: string;
  name: string;
  position: Position;
  age: number;
  currentAbility: number;
  potentialAbility: number;
  condition: number;
  morale: number;
  attributes: PlayerAttributes;
};

export type Club = {
  id: string;
  name: string;
  reputation: number;
  players: Player[];
};

export type Fixture = {
  round: number;
  home: string;
  away: string;
  played: boolean;
  homeGoals?: number;
  awayGoals?: number;
  homeXg?: number;
  awayXg?: number;
};

export type Standing = {
  clubId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
};

export type TeamStrength = {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  overall: number;
};

export type World = {
  season: number;
  round: number;
  clubs: Club[];
  fixtures: Fixture[];
  standings: Record<string, Standing>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const random = () => Math.random();

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pseudo(seed: number, offset: number): number {
  const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function poisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

const firstNames = ['Caio', 'Davi', 'Enzo', 'Felipe', 'Gabriel', 'Heitor', 'Igor', 'João', 'Kaio', 'Lucas', 'Mateus', 'Nicolas', 'Otávio', 'Pedro', 'Rafael', 'Samuel', 'Thiago', 'Vinícius', 'Wesley', 'Yuri'];
const lastNames = ['Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Ferreira', 'Gomes', 'Henrique', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Rocha', 'Silva', 'Teixeira', 'Vieira', 'Xavier'];

const squadTemplate: Position[] = [
  'GK', 'GK', 'RB', 'RB', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB',
  'DM', 'DM', 'CM', 'CM', 'CM', 'AM', 'AM', 'RW', 'RW', 'LW', 'LW', 'ST', 'ST', 'ST',
];

function attribute(base: number, bias: number, seed: number, offset: number): number {
  const noise = (pseudo(seed, offset) - 0.5) * 18;
  return Math.round(clamp(base + bias + noise, 25, 95));
}

function createPlayer(clubId: string, clubBase: number, position: Position, index: number): Player {
  const seed = hashText(`${clubId}-${position}-${index}`);
  const age = 17 + Math.floor(pseudo(seed, 1) * 18);
  const growthRoom = age <= 21 ? 8 + Math.floor(pseudo(seed, 2) * 18) : 2 + Math.floor(pseudo(seed, 2) * 8);
  const currentAbility = Math.round(clamp(clubBase + (pseudo(seed, 3) - 0.5) * 18, 45, 90));
  const potentialAbility = Math.round(clamp(currentAbility + growthRoom, currentAbility, 96));
  const gk = position === 'GK' ? 18 : -38;
  const fin = position === 'ST' ? 14 : ['RW', 'LW', 'AM'].includes(position) ? 8 : position === 'GK' ? -25 : -4;
  const pass = ['CM', 'AM', 'DM'].includes(position) ? 12 : ['RW', 'LW'].includes(position) ? 7 : position === 'GK' ? -10 : 1;
  const tackle = ['CB', 'RB', 'LB', 'DM'].includes(position) ? 12 : position === 'GK' ? -18 : -5;
  const positionBias = ['CB', 'DM', 'GK'].includes(position) ? 10 : 3;
  const pace = ['RW', 'LW', 'RB', 'LB'].includes(position) ? 11 : position === 'GK' ? -12 : 1;
  const first = firstNames[Math.floor(pseudo(seed, 4) * firstNames.length)];
  const last = lastNames[Math.floor(pseudo(seed, 5) * lastNames.length)];

  return {
    id: `${clubId}-p${index + 1}`,
    clubId,
    name: `${first} ${last}`,
    position,
    age,
    currentAbility,
    potentialAbility,
    condition: 92 + Math.round(pseudo(seed, 6) * 8),
    morale: 65 + Math.round(pseudo(seed, 7) * 30),
    attributes: {
      pace: attribute(currentAbility, pace, seed, 10),
      passing: attribute(currentAbility, pass, seed, 11),
      technique: attribute(currentAbility, ['AM', 'RW', 'LW', 'ST'].includes(position) ? 8 : 0, seed, 12),
      finishing: attribute(currentAbility, fin, seed, 13),
      tackling: attribute(currentAbility, tackle, seed, 14),
      positioning: attribute(currentAbility, positionBias, seed, 15),
      stamina: attribute(currentAbility, ['CM', 'DM', 'RB', 'LB'].includes(position) ? 8 : 0, seed, 16),
      decisions: attribute(currentAbility, age >= 27 ? 7 : 0, seed, 17),
      goalkeeping: attribute(currentAbility, gk, seed, 18),
    },
  };
}

function createClub(id: string, name: string, base: number, reputation: number): Club {
  return {
    id,
    name,
    reputation,
    players: squadTemplate.map((position, index) => createPlayer(id, base, position, index)),
  };
}

function roleScore(player: Player, role: Position): number {
  const a = player.attributes;
  const fitness = player.condition / 100;
  const morale = 0.9 + player.morale / 1000;
  let technical = player.currentAbility;

  if (role === 'GK') technical = a.goalkeeping * 0.62 + a.positioning * 0.2 + a.decisions * 0.18;
  if (role === 'CB') technical = a.tackling * 0.38 + a.positioning * 0.32 + a.decisions * 0.18 + a.passing * 0.12;
  if (role === 'RB' || role === 'LB') technical = a.tackling * 0.28 + a.pace * 0.25 + a.stamina * 0.22 + a.passing * 0.15 + a.positioning * 0.1;
  if (role === 'DM') technical = a.tackling * 0.28 + a.passing * 0.25 + a.positioning * 0.2 + a.decisions * 0.17 + a.stamina * 0.1;
  if (role === 'CM') technical = a.passing * 0.34 + a.technique * 0.2 + a.decisions * 0.2 + a.stamina * 0.16 + a.positioning * 0.1;
  if (role === 'AM') technical = a.passing * 0.25 + a.technique * 0.28 + a.finishing * 0.18 + a.decisions * 0.17 + a.pace * 0.12;
  if (role === 'RW' || role === 'LW') technical = a.pace * 0.25 + a.technique * 0.25 + a.finishing * 0.2 + a.passing * 0.18 + a.decisions * 0.12;
  if (role === 'ST') technical = a.finishing * 0.42 + a.technique * 0.16 + a.pace * 0.15 + a.decisions * 0.17 + a.positioning * 0.1;

  const positionalPenalty = player.position === role ? 1 : ['CM', 'DM', 'AM'].includes(player.position) && ['CM', 'DM', 'AM'].includes(role) ? 0.91 : 0.78;
  return technical * fitness * morale * positionalPenalty;
}

const formation: Position[] = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'];

export function selectStartingEleven(club: Club): Player[] {
  const available = [...club.players];
  const selected: Player[] = [];
  for (const role of formation) {
    available.sort((a, b) => roleScore(b, role) - roleScore(a, role));
    const choice = available.shift();
    if (choice) selected.push(choice);
  }
  return selected;
}

export function teamStrength(club: Club): TeamStrength {
  const xi = selectStartingEleven(club);
  const byPos = (positions: Position[]) => xi.filter((p) => positions.includes(p));
  const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 50;
  const attackers = byPos(['AM', 'RW', 'LW', 'ST']);
  const midfielders = byPos(['DM', 'CM', 'AM']);
  const defenders = byPos(['RB', 'CB', 'LB', 'DM']);
  const gk = xi.find((p) => p.position === 'GK') ?? xi[0];

  const attack = avg(attackers.map((p) => p.attributes.finishing * 0.4 + p.attributes.technique * 0.25 + p.attributes.pace * 0.2 + p.attributes.decisions * 0.15));
  const midfield = avg(midfielders.map((p) => p.attributes.passing * 0.38 + p.attributes.decisions * 0.24 + p.attributes.stamina * 0.18 + p.attributes.technique * 0.2));
  const defense = avg(defenders.map((p) => p.attributes.tackling * 0.4 + p.attributes.positioning * 0.33 + p.attributes.stamina * 0.15 + p.attributes.decisions * 0.12));
  const goalkeeper = gk.attributes.goalkeeping * 0.65 + gk.attributes.positioning * 0.2 + gk.attributes.decisions * 0.15;
  const overall = attack * 0.28 + midfield * 0.27 + defense * 0.28 + goalkeeper * 0.17;
  return { attack, midfield, defense, goalkeeper, overall };
}

function expectedGoals(attacking: Club, defending: Club, isHome: boolean): number {
  const atk = teamStrength(attacking);
  const def = teamStrength(defending);
  const attackEdge = (atk.attack - def.defense) / 24;
  const midfieldControl = (atk.midfield - def.midfield) / 60;
  const keeperEffect = (72 - def.goalkeeper) / 42;
  const reputationPressure = (attacking.reputation - defending.reputation) / 150;
  const homeAdvantage = isHome ? 0.2 : 0;
  return clamp(1.15 + attackEdge + midfieldControl + keeperEffect + reputationPressure + homeAdvantage, 0.15, 4.2);
}

export function simulateMatch(home: Club, away: Club): { homeGoals: number; awayGoals: number; homeXg: number; awayXg: number } {
  const homeXg = expectedGoals(home, away, true);
  const awayXg = expectedGoals(away, home, false);
  return {
    homeGoals: poisson(homeXg),
    awayGoals: poisson(awayXg),
    homeXg: Number(homeXg.toFixed(2)),
    awayXg: Number(awayXg.toFixed(2)),
  };
}

function createStandings(clubs: Club[]): Record<string, Standing> {
  return Object.fromEntries(clubs.map((club) => [club.id, { clubId: club.id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }]));
}

function roundRobin(clubs: Club[]): Fixture[] {
  const ids = clubs.map((club) => club.id);
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

  const roundsInLeg = ids.length - 1;
  const secondLeg = firstLeg.map((fixture) => ({ round: fixture.round + roundsInLeg, home: fixture.away, away: fixture.home, played: false }));
  return [...firstLeg, ...secondLeg];
}

export function createWorld(): World {
  const clubs: Club[] = [
    createClub('aurora', 'Aurora FC', 78, 82),
    createClub('imperial', 'Imperial', 77, 79),
    createClub('ferroviario', 'Ferroviário', 71, 68),
    createClub('atletico-mar', 'Atlético do Mar', 74, 73),
    createClub('uniao', 'União Central', 68, 66),
    createClub('metropole', 'Metrópole SC', 79, 80),
    createClub('nacional', 'Nacional Verde', 67, 64),
    createClub('portuario', 'Portuário', 72, 70),
  ];
  return { season: 2026, round: 1, clubs, fixtures: roundRobin(clubs), standings: createStandings(clubs) };
}

function applyResult(world: World, fixture: Fixture): void {
  const home = world.standings[fixture.home];
  const away = world.standings[fixture.away];
  const hg = fixture.homeGoals ?? 0;
  const ag = fixture.awayGoals ?? 0;
  home.played += 1; away.played += 1;
  home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
  if (hg > ag) { home.wins += 1; away.losses += 1; home.points += 3; }
  else if (ag > hg) { away.wins += 1; home.losses += 1; away.points += 3; }
  else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
}

function applyMatchFatigue(club: Club): void {
  const starters = new Set(selectStartingEleven(club).map((p) => p.id));
  for (const player of club.players) {
    if (starters.has(player.id)) player.condition = clamp(player.condition - (5 + Math.round(random() * 6)), 55, 100);
    else player.condition = clamp(player.condition + 2, 55, 100);
  }
}

export function playCurrentRound(world: World): void {
  const fixtures = world.fixtures.filter((fixture) => fixture.round === world.round && !fixture.played);
  for (const fixture of fixtures) {
    const home = world.clubs.find((club) => club.id === fixture.home)!;
    const away = world.clubs.find((club) => club.id === fixture.away)!;
    const result = simulateMatch(home, away);
    fixture.homeGoals = result.homeGoals;
    fixture.awayGoals = result.awayGoals;
    fixture.homeXg = result.homeXg;
    fixture.awayXg = result.awayXg;
    fixture.played = true;
    applyResult(world, fixture);
    applyMatchFatigue(home);
    applyMatchFatigue(away);
  }
  if (fixtures.length > 0) world.round += 1;
}

export function sortedStandings(world: World): Standing[] {
  return Object.values(world.standings).sort((a, b) => {
    const pointDiff = b.points - a.points;
    if (pointDiff !== 0) return pointDiff;
    const gdDiff = b.gf - b.ga - (a.gf - a.ga);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });
}
