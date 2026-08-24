export type Club = {
  id: string;
  name: string;
  attack: number;
  midfield: number;
  defense: number;
  reputation: number;
};

export type Fixture = {
  round: number;
  home: string;
  away: string;
  played: boolean;
  homeGoals?: number;
  awayGoals?: number;
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

export type World = {
  season: number;
  round: number;
  clubs: Club[];
  fixtures: Fixture[];
  standings: Record<string, Standing>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const random = () => Math.random();

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

function expectedGoals(home: Club, away: Club, isHome: boolean): number {
  const attackEdge = (home.attack - away.defense) / 28;
  const midfieldControl = (home.midfield - away.midfield) / 55;
  const reputationPressure = (home.reputation - away.reputation) / 120;
  const homeAdvantage = isHome ? 0.22 : 0;
  return clamp(1.22 + attackEdge + midfieldControl + reputationPressure + homeAdvantage, 0.18, 3.8);
}

export function simulateMatch(home: Club, away: Club): [number, number] {
  const homeXg = expectedGoals(home, away, true);
  const awayXg = expectedGoals(away, home, false);
  return [poisson(homeXg), poisson(awayXg)];
}

function createStandings(clubs: Club[]): Record<string, Standing> {
  return Object.fromEntries(
    clubs.map((club) => [club.id, { clubId: club.id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }]),
  );
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
  const secondLeg = firstLeg.map((fixture) => ({
    round: fixture.round + roundsInLeg,
    home: fixture.away,
    away: fixture.home,
    played: false,
  }));

  return [...firstLeg, ...secondLeg];
}

export function createWorld(): World {
  const clubs: Club[] = [
    { id: 'aurora', name: 'Aurora FC', attack: 78, midfield: 80, defense: 76, reputation: 82 },
    { id: 'imperial', name: 'Imperial', attack: 81, midfield: 74, defense: 73, reputation: 79 },
    { id: 'ferroviario', name: 'Ferroviário', attack: 69, midfield: 72, defense: 77, reputation: 68 },
    { id: 'atletico-mar', name: 'Atlético do Mar', attack: 74, midfield: 75, defense: 72, reputation: 73 },
    { id: 'uniao', name: 'União Central', attack: 71, midfield: 68, defense: 70, reputation: 66 },
    { id: 'metropole', name: 'Metrópole SC', attack: 76, midfield: 78, defense: 79, reputation: 80 },
    { id: 'nacional', name: 'Nacional Verde', attack: 67, midfield: 70, defense: 68, reputation: 64 },
    { id: 'portuario', name: 'Portuário', attack: 73, midfield: 69, defense: 75, reputation: 70 },
  ];

  return {
    season: 2026,
    round: 1,
    clubs,
    fixtures: roundRobin(clubs),
    standings: createStandings(clubs),
  };
}

function applyResult(world: World, fixture: Fixture): void {
  const home = world.standings[fixture.home];
  const away = world.standings[fixture.away];
  const hg = fixture.homeGoals ?? 0;
  const ag = fixture.awayGoals ?? 0;

  home.played += 1;
  away.played += 1;
  home.gf += hg;
  home.ga += ag;
  away.gf += ag;
  away.ga += hg;

  if (hg > ag) {
    home.wins += 1;
    away.losses += 1;
    home.points += 3;
  } else if (ag > hg) {
    away.wins += 1;
    home.losses += 1;
    away.points += 3;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }
}

export function playCurrentRound(world: World): void {
  const fixtures = world.fixtures.filter((fixture) => fixture.round === world.round && !fixture.played);
  for (const fixture of fixtures) {
    const home = world.clubs.find((club) => club.id === fixture.home)!;
    const away = world.clubs.find((club) => club.id === fixture.away)!;
    const [homeGoals, awayGoals] = simulateMatch(home, away);
    fixture.homeGoals = homeGoals;
    fixture.awayGoals = awayGoals;
    fixture.played = true;
    applyResult(world, fixture);
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
