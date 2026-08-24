import type { Club, Player, PlayerAttributes, Position, Tactics, World } from './engine';
import { playCurrentRound, selectStartingEleven } from './engine';

export type PlayerRole =
  | 'sweeperKeeper' | 'goalkeeper'
  | 'fullback' | 'wingback' | 'invertedFullback'
  | 'centralDefender' | 'ballPlayingDefender' | 'stopper'
  | 'anchor' | 'deepLyingPlaymaker' | 'ballWinningMidfielder'
  | 'centralMidfielder' | 'boxToBox' | 'advancedPlaymaker'
  | 'attackingMidfielder' | 'shadowStriker'
  | 'winger' | 'insideForward' | 'widePlaymaker'
  | 'advancedForward' | 'targetForward' | 'falseNine';

export type RoleDefinition = {
  id: PlayerRole;
  name: string;
  positions: Position[];
  description: string;
  duty: 'Defender' | 'Apoio' | 'Ataque';
};

export const roleDefinitions: RoleDefinition[] = [
  { id:'goalkeeper', name:'Goleiro', positions:['GK'], duty:'Defender', description:'Prioriza defesa da meta e decisões seguras.' },
  { id:'sweeperKeeper', name:'Goleiro Líbero', positions:['GK'], duty:'Apoio', description:'Sai da área, participa da construção e cobre linha alta.' },
  { id:'fullback', name:'Lateral', positions:['RB','LB'], duty:'Apoio', description:'Equilibra proteção defensiva e apoio pelos lados.' },
  { id:'wingback', name:'Ala', positions:['RB','LB'], duty:'Ataque', description:'Projeta-se com frequência e amplia a largura ofensiva.' },
  { id:'invertedFullback', name:'Lateral Invertido', positions:['RB','LB'], duty:'Apoio', description:'Entra por dentro para criar superioridade no meio.' },
  { id:'centralDefender', name:'Zagueiro Central', positions:['CB'], duty:'Defender', description:'Defesa simples, posicionamento e duelos.' },
  { id:'ballPlayingDefender', name:'Zagueiro Construtor', positions:['CB'], duty:'Apoio', description:'Inicia ataques com passe e condução desde trás.' },
  { id:'stopper', name:'Zagueiro de Combate', positions:['CB'], duty:'Defender', description:'Abandona a linha para antecipar e pressionar o atacante.' },
  { id:'anchor', name:'Âncora', positions:['DM'], duty:'Defender', description:'Protege a frente da zaga e mantém posição.' },
  { id:'deepLyingPlaymaker', name:'Organizador Recuado', positions:['DM','CM'], duty:'Apoio', description:'Controla o ritmo e distribui o jogo de zonas baixas.' },
  { id:'ballWinningMidfielder', name:'Recuperador', positions:['DM','CM'], duty:'Defender', description:'Pressiona, desarma e acelera recuperações de posse.' },
  { id:'centralMidfielder', name:'Meia Central', positions:['CM'], duty:'Apoio', description:'Função equilibrada entre circulação, cobertura e chegada.' },
  { id:'boxToBox', name:'Box-to-Box', positions:['CM'], duty:'Apoio', description:'Percorre grandes espaços e participa das duas áreas.' },
  { id:'advancedPlaymaker', name:'Organizador Avançado', positions:['CM','AM'], duty:'Ataque', description:'Recebe entrelinhas e prioriza o último passe.' },
  { id:'attackingMidfielder', name:'Meia Ofensivo', positions:['AM'], duty:'Ataque', description:'Ataca espaços, cria e finaliza perto da área.' },
  { id:'shadowStriker', name:'Segundo Atacante', positions:['AM'], duty:'Ataque', description:'Rompe a área como atacante vindo de trás.' },
  { id:'winger', name:'Ponta', positions:['RW','LW'], duty:'Ataque', description:'Mantém amplitude, acelera e procura cruzamentos.' },
  { id:'insideForward', name:'Atacante Interior', positions:['RW','LW'], duty:'Ataque', description:'Parte do lado e invade a área para finalizar.' },
  { id:'widePlaymaker', name:'Organizador Aberto', positions:['RW','LW'], duty:'Apoio', description:'Parte da faixa lateral para criar por dentro.' },
  { id:'advancedForward', name:'Avançado', positions:['ST'], duty:'Ataque', description:'Ataca profundidade e busca finalizar o maior número de jogadas.' },
  { id:'targetForward', name:'Homem-Alvo', positions:['ST'], duty:'Apoio', description:'Serve como referência para jogo direto e segundas bolas.' },
  { id:'falseNine', name:'Falso 9', positions:['ST'], duty:'Apoio', description:'Recua para conectar o meio e abrir espaço para pontas.' },
];

const assignments = new WeakMap<Club, Map<string, PlayerRole>>();

function defaultRole(position: Position): PlayerRole {
  if (position === 'GK') return 'goalkeeper';
  if (position === 'RB' || position === 'LB') return 'fullback';
  if (position === 'CB') return 'centralDefender';
  if (position === 'DM') return 'anchor';
  if (position === 'CM') return 'centralMidfielder';
  if (position === 'AM') return 'attackingMidfielder';
  if (position === 'RW' || position === 'LW') return 'winger';
  return 'advancedForward';
}

function clubAssignments(club: Club): Map<string, PlayerRole> {
  let map = assignments.get(club);
  if (!map) { map = new Map(); assignments.set(club, map); }
  return map;
}

export function getPlayerRole(club: Club, player: Player): PlayerRole {
  const map = clubAssignments(club);
  if (!map.has(player.id)) map.set(player.id, defaultRole(player.position));
  return map.get(player.id)!;
}

export function setPlayerRole(club: Club, playerId: string, role: PlayerRole): void {
  clubAssignments(club).set(playerId, role);
}

export function availableRoles(player: Player): RoleDefinition[] {
  return roleDefinitions.filter(role => role.positions.includes(player.position));
}

export function roleDefinition(role: PlayerRole): RoleDefinition {
  return roleDefinitions.find(item => item.id === role)!;
}

export function roleSuitability(player: Player, role: PlayerRole): number {
  const a = player.attributes;
  let score = player.currentAbility;
  switch (role) {
    case 'goalkeeper': score = a.goalkeeping*.62 + a.positioning*.22 + a.decisions*.16; break;
    case 'sweeperKeeper': score = a.goalkeeping*.42 + a.passing*.2 + a.decisions*.18 + a.pace*.1 + a.technique*.1; break;
    case 'fullback': score = a.tackling*.25 + a.positioning*.2 + a.stamina*.2 + a.pace*.2 + a.passing*.15; break;
    case 'wingback': score = a.pace*.28 + a.stamina*.25 + a.passing*.2 + a.technique*.12 + a.decisions*.15; break;
    case 'invertedFullback': score = a.passing*.27 + a.decisions*.22 + a.technique*.18 + a.tackling*.18 + a.positioning*.15; break;
    case 'centralDefender': score = a.tackling*.36 + a.positioning*.34 + a.decisions*.18 + a.pace*.12; break;
    case 'ballPlayingDefender': score = a.tackling*.25 + a.positioning*.25 + a.passing*.22 + a.technique*.13 + a.decisions*.15; break;
    case 'stopper': score = a.tackling*.42 + a.pace*.18 + a.positioning*.2 + a.stamina*.1 + a.decisions*.1; break;
    case 'anchor': score = a.positioning*.32 + a.tackling*.3 + a.decisions*.2 + a.passing*.1 + a.stamina*.08; break;
    case 'deepLyingPlaymaker': score = a.passing*.34 + a.decisions*.25 + a.technique*.2 + a.positioning*.13 + a.stamina*.08; break;
    case 'ballWinningMidfielder': score = a.tackling*.34 + a.stamina*.25 + a.positioning*.18 + a.decisions*.13 + a.pace*.1; break;
    case 'centralMidfielder': score = a.passing*.26 + a.decisions*.22 + a.stamina*.2 + a.technique*.16 + a.positioning*.16; break;
    case 'boxToBox': score = a.stamina*.3 + a.pace*.17 + a.passing*.18 + a.tackling*.15 + a.decisions*.12 + a.finishing*.08; break;
    case 'advancedPlaymaker': score = a.passing*.3 + a.technique*.27 + a.decisions*.23 + a.finishing*.1 + a.pace*.1; break;
    case 'attackingMidfielder': score = a.technique*.25 + a.passing*.24 + a.finishing*.2 + a.decisions*.18 + a.pace*.13; break;
    case 'shadowStriker': score = a.finishing*.3 + a.pace*.22 + a.positioning*.2 + a.technique*.15 + a.decisions*.13; break;
    case 'winger': score = a.pace*.3 + a.technique*.22 + a.passing*.2 + a.decisions*.15 + a.finishing*.13; break;
    case 'insideForward': score = a.finishing*.28 + a.pace*.24 + a.technique*.23 + a.decisions*.15 + a.positioning*.1; break;
    case 'widePlaymaker': score = a.passing*.3 + a.technique*.27 + a.decisions*.22 + a.pace*.11 + a.finishing*.1; break;
    case 'advancedForward': score = a.finishing*.34 + a.pace*.24 + a.positioning*.18 + a.decisions*.14 + a.technique*.1; break;
    case 'targetForward': score = a.finishing*.25 + a.positioning*.22 + a.technique*.18 + a.decisions*.18 + a.stamina*.17; break;
    case 'falseNine': score = a.passing*.25 + a.technique*.25 + a.decisions*.22 + a.finishing*.16 + a.positioning*.12; break;
  }
  return Math.round(Math.max(1, Math.min(99, score)));
}

type TacticalDelta = { tempo:number; pressing:number; defensiveLine:number; width:number; shortBias:number; directBias:number };
function roleDelta(role: PlayerRole): TacticalDelta {
  const zero = { tempo:0, pressing:0, defensiveLine:0, width:0, shortBias:0, directBias:0 };
  const table: Partial<Record<PlayerRole, TacticalDelta>> = {
    sweeperKeeper:{...zero, defensiveLine:4, shortBias:2}, wingback:{...zero, tempo:3, width:5}, invertedFullback:{...zero, width:-4, shortBias:3},
    ballPlayingDefender:{...zero, shortBias:3}, stopper:{...zero, pressing:3, defensiveLine:2}, anchor:{...zero, defensiveLine:-3},
    deepLyingPlaymaker:{...zero, tempo:-2, shortBias:4}, ballWinningMidfielder:{...zero, pressing:5, tempo:1}, boxToBox:{...zero, tempo:3, pressing:2},
    advancedPlaymaker:{...zero, shortBias:3, tempo:1}, shadowStriker:{...zero, tempo:4, width:-1}, insideForward:{...zero, tempo:2, width:-3},
    widePlaymaker:{...zero, shortBias:3, width:2}, advancedForward:{...zero, tempo:3, directBias:2}, targetForward:{...zero, directBias:5, tempo:-1}, falseNine:{...zero, shortBias:5, width:2, tempo:-2},
  };
  return table[role] ?? zero;
}

function effectiveTactics(club: Club): Tactics {
  const base = { ...club.tactics };
  const xi = selectStartingEleven(club);
  const total = xi.reduce((acc, player) => {
    const d = roleDelta(getPlayerRole(club, player));
    acc.tempo += d.tempo; acc.pressing += d.pressing; acc.defensiveLine += d.defensiveLine; acc.width += d.width; acc.shortBias += d.shortBias; acc.directBias += d.directBias;
    return acc;
  }, { tempo:0, pressing:0, defensiveLine:0, width:0, shortBias:0, directBias:0 });
  const clamp = (n:number) => Math.max(0, Math.min(100, Math.round(n)));
  base.tempo = clamp(base.tempo + total.tempo);
  base.pressing = clamp(base.pressing + total.pressing);
  base.defensiveLine = clamp(base.defensiveLine + total.defensiveLine);
  base.width = clamp(base.width + total.width);
  if (total.shortBias - total.directBias >= 7) base.passingStyle = 'short';
  if (total.directBias - total.shortBias >= 7) base.passingStyle = 'direct';
  return base;
}

export function tacticalRoleSummary(club: Club) {
  const effective = effectiveTactics(club);
  return {
    effective,
    tempoDelta: effective.tempo - club.tactics.tempo,
    pressingDelta: effective.pressing - club.tactics.pressing,
    lineDelta: effective.defensiveLine - club.tactics.defensiveLine,
    widthDelta: effective.width - club.tactics.width,
  };
}

type AttributeDelta = Partial<Record<keyof PlayerAttributes, number>>;
function roleAttributeDelta(role: PlayerRole): AttributeDelta {
  const table: Partial<Record<PlayerRole, AttributeDelta>> = {
    sweeperKeeper:{ passing:7, decisions:5, pace:3, goalkeeping:-2 },
    wingback:{ pace:5, stamina:6, passing:5, tackling:-2, finishing:1 },
    invertedFullback:{ passing:7, technique:5, decisions:5, pace:-2 },
    ballPlayingDefender:{ passing:8, technique:5, decisions:4, tackling:-2 },
    stopper:{ tackling:7, pace:3, positioning:-2, passing:-3 },
    anchor:{ positioning:7, tackling:5, passing:-2, pace:-3 },
    deepLyingPlaymaker:{ passing:9, technique:6, decisions:7, finishing:-3, pace:-2 },
    ballWinningMidfielder:{ tackling:8, stamina:7, pace:3, passing:-3, technique:-2 },
    boxToBox:{ stamina:8, pace:4, passing:3, finishing:3, tackling:3 },
    advancedPlaymaker:{ passing:9, technique:8, decisions:6, tackling:-5 },
    shadowStriker:{ finishing:9, pace:6, positioning:7, passing:-3 },
    winger:{ pace:7, passing:5, technique:4, finishing:-1 },
    insideForward:{ finishing:9, pace:6, technique:5, passing:-3 },
    widePlaymaker:{ passing:9, technique:7, decisions:5, pace:-2, finishing:-2 },
    advancedForward:{ finishing:9, pace:6, positioning:6, passing:-4 },
    targetForward:{ positioning:6, finishing:5, stamina:4, passing:3, pace:-5 },
    falseNine:{ passing:9, technique:8, decisions:7, finishing:-5, pace:-2 },
  };
  return table[role] ?? {};
}

function applyRoleBehaviours(club: Club): Map<Player, PlayerAttributes> {
  const snapshots = new Map<Player, PlayerAttributes>();
  const xi = selectStartingEleven(club);
  for (const player of xi) {
    snapshots.set(player, { ...player.attributes });
    const delta = roleAttributeDelta(getPlayerRole(club, player));
    for (const [key, value] of Object.entries(delta) as [keyof PlayerAttributes, number][]) {
      player.attributes[key] = Math.max(20, Math.min(99, player.attributes[key] + value));
    }
  }
  return snapshots;
}

function restoreAttributes(snapshots: Map<Player, PlayerAttributes>): void {
  for (const [player, attributes] of snapshots) player.attributes = attributes;
}

export function playCurrentRoundWithRoles(world: World): void {
  const originalTactics = new Map<Club, Tactics>();
  const attributeSnapshots = new Map<Player, PlayerAttributes>();
  for (const club of world.clubs) {
    originalTactics.set(club, { ...club.tactics });
    club.tactics = effectiveTactics(club);
    const snapshots = applyRoleBehaviours(club);
    for (const [player, attrs] of snapshots) attributeSnapshots.set(player, attrs);
  }
  try {
    playCurrentRound(world);
  } finally {
    for (const club of world.clubs) club.tactics = originalTactics.get(club)!;
    restoreAttributes(attributeSnapshots);
  }
}
