import type { Club, Mentality, PassingStyle, TransitionStyle, World } from './engine';
import {
  applyTacticPreset,
  selectStartingEleven,
  tacticPresets,
  teamStrength,
  updateClubTactics,
} from './engine';
import { userManager } from './manager-character';
import { getPlayerRole, roleDefinition, roleSuitability } from './roles';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]!));

const world = () => window.__touchlineWorld as World | undefined;
const slots = ['gk','lb','cb1','cb2','rb','dm','cm','lw','am','rw','st'] as const;
type ShapePoint={x:number;y:number};
type TacticalClub=Club&{touchlineShape?:Record<string,ShapePoint>};
const defaultPositions:Record<(typeof slots)[number],ShapePoint>={gk:{x:8,y:50},lb:{x:24,y:84},cb1:{x:21,y:62},cb2:{x:21,y:38},rb:{x:24,y:16},dm:{x:43,y:62},cm:{x:43,y:38},lw:{x:69,y:82},am:{x:64,y:50},rw:{x:69,y:18},st:{x:88,y:50}};

function managedClub(w: World): Club {
  const id = userManager(w)?.currentClubId ?? w.clubs[0]?.id;
  return w.clubs.find(club => club.id === id) ?? w.clubs[0];
}
function pointFor(club:Club,playerId:string,index:number){return (club as TacticalClub).touchlineShape?.[playerId]??defaultPositions[slots[index]]}
function savePoint(club:Club,playerId:string,point:ShapePoint){const c=club as TacticalClub;c.touchlineShape??={};c.touchlineShape[playerId]=point}

function presetLabel(key: string): string {
  if (key === 'contraAtaque') return 'Contra-ataque';
  if (key === 'blocoBaixo') return 'Bloco baixo';
  return key[0].toUpperCase() + key.slice(1);
}

function mentalityLabel(value: Club['tactics']['mentality']): string {
  if (value === 'attacking') return 'Ofensiva';
  if (value === 'positive') return 'Positiva';
  if (value === 'defensive') return 'Defensiva';
  return 'Equilibrada';
}

function passingLabel(value: Club['tactics']['passingStyle']): string {
  if (value === 'short') return 'passes curtos';
  if (value === 'direct') return 'jogo direto';
  return 'passes mistos';
}

function slider(id: string, label: string, value: number, low: string, high: string): string {
  return `<label class="range-row"><div><b>${label}</b><span>${low}</span></div><input id="ta-${id}" type="range" min="0" max="100" value="${value}"><strong>${value}</strong><small>${high}</small></label>`;
}

function renderPlayerCards(club: Club): { pitch: string; bench: string } {
  const xi = selectStartingEleven(club);
  const pitch = xi.map((player, index) => {
    const role = getPlayerRole(club, player),definition = roleDefinition(role),fit = roleSuitability(player, role),p=pointFor(club,player.id,index);
    return `<button draggable="true" class="tactical-player" data-player-id="${esc(player.id)}" style="left:${p.x}%;top:${p.y}%"><span class="tp-number">${index + 1}</span><span class="tp-copy"><b>${esc(player.name)}</b><small>${esc(definition.name)} · ${fit}%</small></span></button>`;
  }).join('');
  const benchPlayers = club.players.filter(player => !xi.some(starter => starter.id === player.id)).sort((a, b) => b.currentAbility - a.currentAbility).slice(0, 9);
  const bench = benchPlayers.map((player, index) => `<div data-player-id="${esc(player.id)}"><span>S${index + 1}</span><b>${esc(player.name)}</b><small>${player.position} · CA ${player.currentAbility} · ${player.condition}%</small></div>`).join('');
  return { pitch, bench };
}

function render(club: Club): string {
  const currentWorld = world(),tactics = club.tactics,strength = teamStrength(club);
  const formation = currentWorld ? userManager(currentWorld)?.tactical.favoriteFormation ?? '4-2-3-1' : '4-2-3-1';
  const cards = renderPlayerCards(club);
  const styleTitle = tactics.pressing >= 72 ? 'PRESSÃO AGRESSIVA' : tactics.transition === 'counter' ? 'TRANSIÇÃO RÁPIDA' : 'CONTROLE POSICIONAL';
  const withBall = tactics.passingStyle === 'short' ? 'Circular e apoiar' : tactics.passingStyle === 'direct' ? 'Progredir verticalmente' : 'Variar construção';
  const transition = tactics.transition === 'counter' ? 'Contra-atacar' : tactics.transition === 'hold' ? 'Reorganizar com posse' : 'Equilibrar risco';
  const withoutBall = tactics.pressing >= 70 ? 'Pressionar mais alto' : 'Proteger espaços';
  const presets = Object.keys(tacticPresets).map(key => `<button class="preset" data-ta-preset="${key}">${presetLabel(key)}</button>`).join('');
  return `<header class="v2-view-head tactics-head"><div><span>FUTEBOL · TÁTICAS</span><h1>${esc(formation)} · ${esc(club.name)}</h1><p>Arraste os jogadores no campo: a forma altera dinamicamente largura, altura e ritmo do sistema.</p></div><div class="v2-head-accent"></div></header>
  <div class="tactics-workbench"><div class="tactics-toolbar"><div><b>${esc(formation)}</b><span>${mentalityLabel(tactics.mentality)} · ${passingLabel(tactics.passingStyle)}</span></div><div class="tactic-vitals"><span>ATA <b>${strength.attack.toFixed(0)}</b></span><span>MEI <b>${strength.midfield.toFixed(0)}</b></span><span>DEF <b>${strength.defense.toFixed(0)}</b></span><span>INT <b>${Math.round((tactics.tempo + tactics.pressing) / 2)}</b></span></div></div>
  <div class="tactics-desk"><aside class="tactic-phases"><div class="phase-title">ESTILO TÁTICO</div><strong>${styleTitle}</strong><section><span>COM A BOLA</span><b>${withBall}</b><small>Ritmo ${tactics.tempo} · largura ${tactics.width}</small></section><section><span>TRANSIÇÃO</span><b>${transition}</b><small>Resposta após recuperar ou perder</small></section><section><span>SEM A BOLA</span><b>${withoutBall}</b><small>Pressão ${tactics.pressing} · linha ${tactics.defensiveLine}</small></section></aside>
  <section class="tactical-board"><div class="board-caption"><span>FORMAÇÃO</span><b>${esc(formation)}</b><small>Arraste para reposicionar · clique para abrir dossiê</small></div><div class="manager-pitch"><div class="pitch-goal home"><i></i></div><div class="pitch-goal away"><i></i></div><div class="pitch-box home"></div><div class="pitch-box away"></div>${cards.pitch}</div><div class="bench-strip">${cards.bench}</div></section>
  <aside class="tactic-editor"><div class="editor-title"><div><span>INSTRUÇÕES</span><h2>Identidade coletiva</h2></div><span class="live-dot">● MOTOR ATIVO</span></div><div class="preset-row">${presets}</div><div class="control-grid"><label><span>Mentalidade</span><select id="ta-mentality"><option value="defensive" ${tactics.mentality==='defensive'?'selected':''}>Defensiva</option><option value="balanced" ${tactics.mentality==='balanced'?'selected':''}>Equilibrada</option><option value="positive" ${tactics.mentality==='positive'?'selected':''}>Positiva</option><option value="attacking" ${tactics.mentality==='attacking'?'selected':''}>Ofensiva</option></select></label><label><span>Passe</span><select id="ta-passing"><option value="short" ${tactics.passingStyle==='short'?'selected':''}>Curto</option><option value="mixed" ${tactics.passingStyle==='mixed'?'selected':''}>Misto</option><option value="direct" ${tactics.passingStyle==='direct'?'selected':''}>Direto</option></select></label><label><span>Transição</span><select id="ta-transition"><option value="hold" ${tactics.transition==='hold'?'selected':''}>Manter posse</option><option value="balanced" ${tactics.transition==='balanced'?'selected':''}>Equilibrada</option><option value="counter" ${tactics.transition==='counter'?'selected':''}>Contra-atacar</option></select></label></div><div class="ranges">${slider('tempo','Ritmo',tactics.tempo,'Paciente','Rápido')}${slider('pressing','Pressão',tactics.pressing,'Recuada','Sufocante')}${slider('line','Linha defensiva',tactics.defensiveLine,'Baixa','Alta')}${slider('width','Largura',tactics.width,'Estreita','Aberta')}</div></aside></div></div>`;
}

function syncShapeToTactics(club:Club){const xi=selectStartingEleven(club),pts=xi.map((p,i)=>pointFor(club,p.id,i));if(!pts.length)return;const field=pts.filter((_,i)=>i>0),avgX=field.reduce((s,p)=>s+p.x,0)/field.length,spread=Math.max(...field.map(p=>p.y))-Math.min(...field.map(p=>p.y));updateClubTactics(club,{defensiveLine:Math.max(20,Math.min(90,Math.round(32+avgX*.55))),width:Math.max(30,Math.min(90,Math.round(28+spread*.72))),tempo:Math.max(30,Math.min(90,Math.round(club.tactics.tempo*.7+avgX*.3)))})}
function bindPitchDrag(host:HTMLElement,club:Club){const pitch=host.querySelector<HTMLElement>('.manager-pitch');if(!pitch)return;let dragged='';host.querySelectorAll<HTMLButtonElement>('.tactical-player').forEach(card=>{card.addEventListener('dragstart',e=>{dragged=card.dataset.playerId??'';card.classList.add('dragging');e.dataTransfer?.setData('text/plain',dragged)});card.addEventListener('dragend',()=>card.classList.remove('dragging'));});pitch.addEventListener('dragover',e=>{e.preventDefault();pitch.classList.add('drop-active')});pitch.addEventListener('dragleave',()=>pitch.classList.remove('drop-active'));pitch.addEventListener('drop',e=>{e.preventDefault();pitch.classList.remove('drop-active');const id=dragged||e.dataTransfer?.getData('text/plain');if(!id)return;const r=pitch.getBoundingClientRect();const x=Math.max(5,Math.min(95,((e.clientX-r.left)/r.width)*100)),y=Math.max(6,Math.min(94,((e.clientY-r.top)/r.height)*100));savePoint(club,id,{x,y});syncShapeToTactics(club);activate();});}

function activate(): void {
  const currentWorld = world(); if (!currentWorld) return;
  const host = document.querySelector<HTMLElement>('.game-stage main.view'); if (!host) return;
  const club = managedClub(currentWorld); host.innerHTML = render(club); bindPitchDrag(host,club);
  host.querySelectorAll<HTMLButtonElement>('[data-ta-preset]').forEach(button => {button.onclick = () => {applyTacticPreset(club, button.dataset.taPreset as keyof typeof tacticPresets);(club as TacticalClub).touchlineShape=undefined;activate();};});
  host.querySelector<HTMLSelectElement>('#ta-mentality')?.addEventListener('change', event => {updateClubTactics(club, { mentality: (event.target as HTMLSelectElement).value as Mentality });activate();});
  host.querySelector<HTMLSelectElement>('#ta-passing')?.addEventListener('change', event => {updateClubTactics(club, { passingStyle: (event.target as HTMLSelectElement).value as PassingStyle });activate();});
  host.querySelector<HTMLSelectElement>('#ta-transition')?.addEventListener('change', event => {updateClubTactics(club, { transition: (event.target as HTMLSelectElement).value as TransitionStyle });activate();});
  const mapping = { tempo: 'tempo', pressing: 'pressing', line: 'defensiveLine', width: 'width' } as const;
  Object.entries(mapping).forEach(([id, key]) => {host.querySelector<HTMLInputElement>(`#ta-${id}`)?.addEventListener('change', event => {updateClubTactics(club, { [key]: Number((event.target as HTMLInputElement).value) });activate();});});
  host.querySelectorAll<HTMLElement>('[data-player-id]').forEach(element => {element.onclick = () => document.dispatchEvent(new CustomEvent('touchline:open-player', {detail: { playerId: element.dataset.playerId }}));});
}
document.addEventListener('touchline:view-rendered', event => {if ((event as CustomEvent).detail?.view === 'tactics') queueMicrotask(activate);});
