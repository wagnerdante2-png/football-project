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

export type Club = { id: string; name: string; reputation: number; players: Player[] };

export type MatchEventType = 'kickoff' | 'chance' | 'shot' | 'save' | 'goal' | 'yellow' | 'substitution' | 'fulltime';
export type MatchEvent = {
  minute: number;
  type: MatchEventType;
  clubId?: string;
  playerId?: string;
  secondaryPlayerId?: string;
  text: string;
  xg?: number;
};

export type MatchStats = {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  passesHome: number;
  passesAway: number;
  yellowHome: number;
  yellowAway: number;
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
  events?: MatchEvent[];
  stats?: MatchStats;
};

export type Standing = { clubId: string; played: number; wins: number; draws: number; losses: number; gf: number; ga: number; points: number };
export type TeamStrength = { attack: number; midfield: number; defense: number; goalkeeper: number; overall: number };
export type World = { season: number; round: number; clubs: Club[]; fixtures: Fixture[]; standings: Record<string, Standing> };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const rnd = () => Math.random();
const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 50;

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash >>> 0);
}
function pseudo(seed: number, offset: number): number { const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453; return x - Math.floor(x); }

const firstNames = ['Caio','Davi','Enzo','Felipe','Gabriel','Heitor','Igor','João','Kaio','Lucas','Mateus','Nicolas','Otávio','Pedro','Rafael','Samuel','Thiago','Vinícius','Wesley','Yuri'];
const lastNames = ['Almeida','Barbosa','Cardoso','Duarte','Ferreira','Gomes','Henrique','Lima','Martins','Nogueira','Oliveira','Pereira','Queiroz','Rocha','Silva','Teixeira','Vieira','Xavier'];
const squadTemplate: Position[] = ['GK','GK','RB','RB','CB','CB','CB','CB','LB','LB','DM','DM','CM','CM','CM','AM','AM','RW','RW','LW','LW','ST','ST','ST'];
const formation: Position[] = ['GK','RB','CB','CB','LB','DM','CM','AM','RW','LW','ST'];

function attribute(base: number, bias: number, seed: number, offset: number): number {
  return Math.round(clamp(base + bias + (pseudo(seed, offset) - 0.5) * 18, 25, 95));
}

function createPlayer(clubId: string, clubBase: number, position: Position, index: number): Player {
  const seed = hashText(`${clubId}-${position}-${index}`);
  const age = 17 + Math.floor(pseudo(seed, 1) * 18);
  const currentAbility = Math.round(clamp(clubBase + (pseudo(seed, 3) - 0.5) * 18, 45, 90));
  const growth = age <= 21 ? 8 + Math.floor(pseudo(seed, 2) * 18) : 2 + Math.floor(pseudo(seed, 2) * 8);
  const first = firstNames[Math.floor(pseudo(seed, 4) * firstNames.length)];
  const last = lastNames[Math.floor(pseudo(seed, 5) * lastNames.length)];
  const fin = position === 'ST' ? 14 : ['RW','LW','AM'].includes(position) ? 8 : position === 'GK' ? -25 : -4;
  const pass = ['CM','AM','DM'].includes(position) ? 12 : ['RW','LW'].includes(position) ? 7 : position === 'GK' ? -10 : 1;
  const tackle = ['CB','RB','LB','DM'].includes(position) ? 12 : position === 'GK' ? -18 : -5;
  return {
    id: `${clubId}-p${index + 1}`, clubId, name: `${first} ${last}`, position, age,
    currentAbility, potentialAbility: Math.round(clamp(currentAbility + growth, currentAbility, 96)),
    condition: 92 + Math.round(pseudo(seed, 6) * 8), morale: 65 + Math.round(pseudo(seed, 7) * 30),
    attributes: {
      pace: attribute(currentAbility, ['RW','LW','RB','LB'].includes(position) ? 11 : position === 'GK' ? -12 : 1, seed, 10),
      passing: attribute(currentAbility, pass, seed, 11),
      technique: attribute(currentAbility, ['AM','RW','LW','ST'].includes(position) ? 8 : 0, seed, 12),
      finishing: attribute(currentAbility, fin, seed, 13),
      tackling: attribute(currentAbility, tackle, seed, 14),
      positioning: attribute(currentAbility, ['CB','DM','GK'].includes(position) ? 10 : 3, seed, 15),
      stamina: attribute(currentAbility, ['CM','DM','RB','LB'].includes(position) ? 8 : 0, seed, 16),
      decisions: attribute(currentAbility, age >= 27 ? 7 : 0, seed, 17),
      goalkeeping: attribute(currentAbility, position === 'GK' ? 18 : -38, seed, 18),
    },
  };
}

function createClub(id: string, name: string, base: number, reputation: number): Club {
  return { id, name, reputation, players: squadTemplate.map((position, index) => createPlayer(id, base, position, index)) };
}

function roleScore(player: Player, role: Position): number {
  const a = player.attributes;
  let technical = player.currentAbility;
  if (role === 'GK') technical = a.goalkeeping * .62 + a.positioning * .2 + a.decisions * .18;
  if (role === 'CB') technical = a.tackling * .38 + a.positioning * .32 + a.decisions * .18 + a.passing * .12;
  if (role === 'RB' || role === 'LB') technical = a.tackling * .28 + a.pace * .25 + a.stamina * .22 + a.passing * .15 + a.positioning * .1;
  if (role === 'DM') technical = a.tackling * .28 + a.passing * .25 + a.positioning * .2 + a.decisions * .17 + a.stamina * .1;
  if (role === 'CM') technical = a.passing * .34 + a.technique * .2 + a.decisions * .2 + a.stamina * .16 + a.positioning * .1;
  if (role === 'AM') technical = a.passing * .25 + a.technique * .28 + a.finishing * .18 + a.decisions * .17 + a.pace * .12;
  if (role === 'RW' || role === 'LW') technical = a.pace * .25 + a.technique * .25 + a.finishing * .2 + a.passing * .18 + a.decisions * .12;
  if (role === 'ST') technical = a.finishing * .42 + a.technique * .16 + a.pace * .15 + a.decisions * .17 + a.positioning * .1;
  const positionalPenalty = player.position === role ? 1 : ['CM','DM','AM'].includes(player.position) && ['CM','DM','AM'].includes(role) ? .91 : .78;
  return technical * (player.condition / 100) * (.9 + player.morale / 1000) * positionalPenalty;
}

export function selectStartingEleven(club: Club): Player[] {
  const available = [...club.players]; const selected: Player[] = [];
  for (const role of formation) { available.sort((a,b) => roleScore(b, role) - roleScore(a, role)); const p = available.shift(); if (p) selected.push(p); }
  return selected;
}

export function teamStrength(club: Club): TeamStrength {
  const xi = selectStartingEleven(club);
  const by = (ps: Position[]) => xi.filter(p => ps.includes(p.position));
  const attackers = by(['AM','RW','LW','ST']); const mids = by(['DM','CM','AM']); const defs = by(['RB','CB','LB','DM']);
  const gk = xi.find(p => p.position === 'GK') ?? xi[0];
  const attack = avg(attackers.map(p => p.attributes.finishing*.4 + p.attributes.technique*.25 + p.attributes.pace*.2 + p.attributes.decisions*.15));
  const midfield = avg(mids.map(p => p.attributes.passing*.38 + p.attributes.decisions*.24 + p.attributes.stamina*.18 + p.attributes.technique*.2));
  const defense = avg(defs.map(p => p.attributes.tackling*.4 + p.attributes.positioning*.33 + p.attributes.stamina*.15 + p.attributes.decisions*.12));
  const goalkeeper = gk.attributes.goalkeeping*.65 + gk.attributes.positioning*.2 + gk.attributes.decisions*.15;
  return { attack, midfield, defense, goalkeeper, overall: attack*.28 + midfield*.27 + defense*.28 + goalkeeper*.17 };
}

function weightedPlayer(players: Player[], weight: (p: Player) => number): Player {
  const weights = players.map(p => Math.max(1, weight(p)));
  let cursor = rnd() * weights.reduce((a,b) => a+b, 0);
  for (let i=0;i<players.length;i+=1) { cursor -= weights[i]; if (cursor <= 0) return players[i]; }
  return players[players.length-1];
}

function simulateEventMatch(home: Club, away: Club) {
  const homeXI = selectStartingEleven(home); const awayXI = selectStartingEleven(away);
  const hs = teamStrength(home); const as = teamStrength(away);
  const homeControl = clamp(.5 + (hs.midfield-as.midfield)/160 + .035, .36, .64);
  const stats: MatchStats = { possessionHome: Math.round(homeControl*100), possessionAway: 0, shotsHome:0, shotsAway:0, shotsOnTargetHome:0, shotsOnTargetAway:0, passesHome:0, passesAway:0, yellowHome:0, yellowAway:0 };
  stats.possessionAway = 100 - stats.possessionHome;
  stats.passesHome = Math.round(300 + stats.possessionHome*4.4 + rnd()*65);
  stats.passesAway = Math.round(300 + stats.possessionAway*4.4 + rnd()*65);
  const events: MatchEvent[] = [{ minute:0, type:'kickoff', text:'A partida começou.' }];
  let hg=0, ag=0, hxg=0, axg=0;
  const totalAttacks = 22 + Math.floor(rnd()*12);

  for (let i=0;i<totalAttacks;i+=1) {
    const minute = 2 + Math.floor(rnd()*88);
    const isHome = rnd() < homeControl;
    const club = isHome ? home : away; const opp = isHome ? away : home;
    const xi = isHome ? homeXI : awayXI; const oppStrength = isHome ? as : hs; const ownStrength = isHome ? hs : as;
    const attackers = xi.filter(p => ['ST','RW','LW','AM','CM'].includes(p.position));
    const shooter = weightedPlayer(attackers, p => p.attributes.finishing*.45 + p.attributes.positioning*.25 + p.attributes.decisions*.2 + p.attributes.pace*.1);
    const creation = ownStrength.midfield*.45 + ownStrength.attack*.35 + shooter.attributes.decisions*.2;
    if (rnd() > clamp(.31 + (creation-oppStrength.defense)/180, .18, .48)) continue;
    const chanceXg = clamp(.03 + rnd()*.22 + (shooter.attributes.finishing-oppStrength.goalkeeper)/500, .02, .42);
    const onTarget = rnd() < clamp(.28 + shooter.attributes.finishing/180 + shooter.attributes.technique/300, .3, .72);
    if (isHome) { stats.shotsHome++; hxg += chanceXg; if (onTarget) stats.shotsOnTargetHome++; }
    else { stats.shotsAway++; axg += chanceXg; if (onTarget) stats.shotsOnTargetAway++; }
    events.push({ minute, type:'shot', clubId:club.id, playerId:shooter.id, text:`${shooter.name} finaliza.`, xg:Number(chanceXg.toFixed(2)) });
    if (!onTarget) continue;
    const goalChance = clamp(chanceXg * (1.2 + shooter.attributes.finishing/130) * (1.1 - oppStrength.goalkeeper/180), .025, .58);
    if (rnd() < goalChance) {
      isHome ? hg++ : ag++;
      events.push({ minute, type:'goal', clubId:club.id, playerId:shooter.id, text:`GOL! ${shooter.name} marca para ${club.name}.`, xg:Number(chanceXg.toFixed(2)) });
    } else {
      const keeper = selectStartingEleven(opp).find(p => p.position === 'GK');
      events.push({ minute, type:'save', clubId:opp.id, playerId:keeper?.id, text:`Defesa do goleiro de ${opp.name}.` });
    }
  }

  for (const [club, xi, isHome] of [[home,homeXI,true],[away,awayXI,false]] as const) {
    const cards = rnd() < .75 ? 1 + Math.floor(rnd()*2) : 0;
    for (let i=0;i<cards;i+=1) {
      const tacklers = xi.filter(p => ['CB','RB','LB','DM','CM'].includes(p.position));
      const p = tacklers[Math.floor(rnd()*tacklers.length)]; const minute=10+Math.floor(rnd()*78);
      if (isHome) stats.yellowHome++; else stats.yellowAway++;
      events.push({ minute, type:'yellow', clubId:club.id, playerId:p?.id, text:`Cartão amarelo para ${p?.name ?? club.name}.` });
    }
    const bench = club.players.filter(p => !xi.some(x => x.id===p.id));
    for (let i=0;i<3;i+=1) {
      const out = xi[8+i] ?? xi[xi.length-1-i]; const incoming = bench[i]; const minute=60+i*9+Math.floor(rnd()*5);
      if (out && incoming) events.push({ minute, type:'substitution', clubId:club.id, playerId:incoming.id, secondaryPlayerId:out.id, text:`${incoming.name} entra no lugar de ${out.name}.` });
    }
  }
  events.push({ minute:90, type:'fulltime', text:`Fim de jogo: ${home.name} ${hg}–${ag} ${away.name}.` });
  events.sort((a,b) => a.minute-b.minute || (a.type==='goal' ? 1 : -1));
  return { homeGoals:hg, awayGoals:ag, homeXg:Number(hxg.toFixed(2)), awayXg:Number(axg.toFixed(2)), events, stats };
}

export function simulateMatch(home: Club, away: Club) { return simulateEventMatch(home, away); }

function createStandings(clubs: Club[]): Record<string, Standing> {
  return Object.fromEntries(clubs.map(c => [c.id,{ clubId:c.id, played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0 }]));
}

function roundRobin(clubs: Club[]): Fixture[] {
  const ids=clubs.map(c=>c.id); if(ids.length%2!==0) ids.push('BYE'); const fixed=ids[0]; let rotating=ids.slice(1); const first:Fixture[]=[];
  for(let round=1;round<ids.length;round+=1){ const arrangement=[fixed,...rotating]; for(let i=0;i<arrangement.length/2;i+=1){ const a=arrangement[i],b=arrangement[arrangement.length-1-i]; if(a!=='BYE'&&b!=='BYE'){ const swap=round%2===0; first.push({round,home:swap?b:a,away:swap?a:b,played:false}); }} rotating=[rotating.at(-1)!,...rotating.slice(0,-1)]; }
  const r=ids.length-1; return [...first,...first.map(f=>({round:f.round+r,home:f.away,away:f.home,played:false}))];
}

export function createWorld(): World {
  const clubs=[createClub('aurora','Aurora FC',78,82),createClub('imperial','Imperial',77,79),createClub('ferroviario','Ferroviário',71,68),createClub('atletico-mar','Atlético do Mar',74,73),createClub('uniao','União Central',68,66),createClub('metropole','Metrópole SC',79,80),createClub('nacional','Nacional Verde',67,64),createClub('portuario','Portuário',72,70)];
  return { season:2026, round:1, clubs, fixtures:roundRobin(clubs), standings:createStandings(clubs) };
}

function applyResult(world: World, fixture: Fixture): void {
  const h=world.standings[fixture.home], a=world.standings[fixture.away], hg=fixture.homeGoals??0, ag=fixture.awayGoals??0;
  h.played++;a.played++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
  if(hg>ag){h.wins++;a.losses++;h.points+=3;} else if(ag>hg){a.wins++;h.losses++;a.points+=3;} else {h.draws++;a.draws++;h.points++;a.points++;}
}

function applyFatigue(club: Club, starters: Player[]): void {
  const starterIds=new Set(starters.map(p=>p.id));
  club.players.forEach(p=>{ p.condition=Math.round(clamp(p.condition + (starterIds.has(p.id) ? -(6+rnd()*7) : 2+rnd()*4), 45,100)); });
}

export function playCurrentRound(world: World): void {
  const fixtures=world.fixtures.filter(f=>f.round===world.round&&!f.played);
  for(const fixture of fixtures){ const home=world.clubs.find(c=>c.id===fixture.home)!; const away=world.clubs.find(c=>c.id===fixture.away)!; const homeXI=selectStartingEleven(home),awayXI=selectStartingEleven(away); const result=simulateMatch(home,away); Object.assign(fixture,result,{played:true}); applyResult(world,fixture); applyFatigue(home,homeXI); applyFatigue(away,awayXI); }
  if(fixtures.length>0) world.round++;
}

export function sortedStandings(world: World): Standing[] {
  return Object.values(world.standings).sort((a,b)=> b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf);
}

export function playerById(world: World, id?: string): Player | undefined {
  if(!id) return undefined; for(const club of world.clubs){ const p=club.players.find(x=>x.id===id); if(p) return p; } return undefined;
}
