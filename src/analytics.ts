import type { Fixture, Player, World } from './engine';

export type PlayerSeasonStats = {
  playerId: string;
  clubId: string;
  goals: number;
  shots: number;
  xg: number;
  yellows: number;
  saves: number;
  substitutionsIn: number;
  impact: number;
};

export function playerSeasonStats(world: World): PlayerSeasonStats[] {
  const rows = new Map<string, PlayerSeasonStats>();
  for (const club of world.clubs) {
    for (const player of club.players) {
      rows.set(player.id, { playerId:player.id, clubId:club.id, goals:0, shots:0, xg:0, yellows:0, saves:0, substitutionsIn:0, impact:0 });
    }
  }
  for (const fixture of world.fixtures.filter(item => item.played && item.events)) {
    for (const event of fixture.events ?? []) {
      if (!event.playerId) continue;
      const row = rows.get(event.playerId);
      if (!row) continue;
      if (event.type === 'shot') { row.shots += 1; row.xg += event.xg ?? 0; }
      if (event.type === 'goal') row.goals += 1;
      if (event.type === 'yellow') row.yellows += 1;
      if (event.type === 'save') row.saves += 1;
      if (event.type === 'substitution') row.substitutionsIn += 1;
    }
  }
  for (const row of rows.values()) {
    row.xg = Number(row.xg.toFixed(2));
    row.impact = Number((row.goals*5 + row.saves*.55 + row.shots*.22 + row.xg*1.4 - row.yellows*.7 + row.substitutionsIn*.1).toFixed(2));
  }
  return [...rows.values()];
}

export function topPlayers(world: World, limit = 10): PlayerSeasonStats[] {
  return playerSeasonStats(world)
    .filter(row => row.goals || row.shots || row.saves || row.yellows)
    .sort((a,b) => b.impact-a.impact || b.goals-a.goals || b.xg-a.xg)
    .slice(0, limit);
}

export function fixturePlayerStats(fixture: Fixture) {
  const map = new Map<string, { playerId:string; goals:number; shots:number; xg:number; yellows:number; saves:number }>();
  for (const event of fixture.events ?? []) {
    if (!event.playerId) continue;
    if (!map.has(event.playerId)) map.set(event.playerId, { playerId:event.playerId, goals:0, shots:0, xg:0, yellows:0, saves:0 });
    const row = map.get(event.playerId)!;
    if (event.type === 'shot') { row.shots += 1; row.xg += event.xg ?? 0; }
    if (event.type === 'goal') row.goals += 1;
    if (event.type === 'yellow') row.yellows += 1;
    if (event.type === 'save') row.saves += 1;
  }
  return [...map.values()].map(row => ({ ...row, xg:Number(row.xg.toFixed(2)) }));
}

export function playerName(world: World, id: string): string {
  for (const club of world.clubs) {
    const player = club.players.find(item => item.id === id);
    if (player) return player.name;
  }
  return id;
}

export function playerFromWorld(world: World, id: string): Player | undefined {
  for (const club of world.clubs) {
    const player = club.players.find(item => item.id === id);
    if (player) return player;
  }
  return undefined;
}
