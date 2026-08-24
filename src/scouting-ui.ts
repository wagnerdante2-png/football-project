import type { Club, Position, World } from './engine';
import { activeAssignments, assignScout, isShortlisted, scoutProfile, scoutingCandidates, scoutingReport, shortlistedReports, toggleShortlist } from './scouting';

const positions: Position[] = ['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST'];
const money = (value:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(value);
const range = (r:{min:number;max:number}) => r.min===r.max ? `${r.min}` : `${r.min}–${r.max}`;
const recommendationLabel: Record<string,string> = { avoid:'Descartar', monitor:'Monitorar', consider:'Considerar', strong:'Forte alvo', elite:'Elite' };

export type ScoutingUiState = {
  position?: Position;
  selectedPlayerId?: string;
  showShortlist: boolean;
};

export function createScoutingUiState(): ScoutingUiState {
  return { showShortlist:false };
}

export function renderScouting(world: World, observer: Club, state: ScoutingUiState): string {
  const profile = scoutProfile(world,observer.id)!;
  const assignments = activeAssignments(world,observer.id);
  const candidates = state.showShortlist ? shortlistedReports(world,observer.id) : scoutingCandidates(world,observer.id,state.position,40);
  const selected = state.selectedPlayerId ? scoutingReport(world,observer.id,state.selectedPlayerId) : candidates[0];
  if (selected && !state.selectedPlayerId) state.selectedPlayerId=selected.playerId;

  const attrs = selected ? Object.entries(selected.attributes) : [];
  return `<header><div><span class="eyebrow">RECRUTAMENTO · ${observer.name.toUpperCase()}</span><h1>Centro de Scouting</h1><p>Você não enxerga CA, PA e atributos reais de jogadores externos. Quanto maior o conhecimento, menores os intervalos e maior a confiança do relatório.</p></div></header>
  <section class="cards"><article class="card metric"><span>Julgar habilidade</span><strong>${profile.judgingAbility}</strong></article><article class="card metric"><span>Julgar potencial</span><strong>${profile.judgingPotential}</strong></article><article class="card metric"><span>Adaptabilidade</span><strong>${profile.adaptability}</strong></article><article class="card metric"><span>Scouts ocupados</span><strong>${assignments.length}/${profile.capacity}</strong></article></section>
  <div class="scouting-toolbar"><select id="scout-position"><option value="">Todas as posições</option>${positions.map(p=>`<option value="${p}" ${state.position===p?'selected':''}>${p}</option>`).join('')}</select><button id="toggle-shortlist" class="secondary">${state.showShortlist?'Ver candidatos':'Ver lista de interesse'}</button></div>
  <div class="scouting-layout"><section class="card scouting-list"><div class="section-title"><h2>${state.showShortlist?'Lista de interesse':'Jogadores observados'}</h2><span>${candidates.length} nomes</span></div>${candidates.length?`<table><thead><tr><th>Jogador</th><th>Clube</th><th>Pos</th><th>Idade</th><th>CA estimado</th><th>PA estimado</th><th>Conf.</th><th></th></tr></thead><tbody>${candidates.map(r=>`<tr class="${selected?.playerId===r.playerId?'selected-scout':''}"><td><button class="scout-player" data-scout-player="${r.playerId}">${r.playerName}</button></td><td>${world.clubs.find(c=>c.id===r.clubId)?.name??r.clubId}</td><td>${r.position}</td><td>${r.age}</td><td>${range(r.currentAbility)}</td><td>${range(r.potentialAbility)}</td><td>${r.confidence}%</td><td><span class="scout-grade ${r.recommendation}">${recommendationLabel[r.recommendation]}</span></td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">Nenhum jogador nesta seleção.</div>'}</section>
  <aside class="card scouting-report">${selected?`<div class="section-title"><h2>${selected.playerName}</h2><span>${selected.position} · ${selected.age} anos</span></div><div class="report-body"><div class="knowledge-meter"><span>Conhecimento</span><b>${selected.confidence}%</b><div><i style="width:${selected.confidence}%"></i></div></div><div class="report-verdict ${selected.recommendation}"><b>${recommendationLabel[selected.recommendation]}</b><p>${selected.summary}</p></div><div class="report-grid"><div><span>Habilidade</span><b>${range(selected.currentAbility)}</b></div><div><span>Potencial</span><b>${range(selected.potentialAbility)}</b></div><div><span>Valor estimado</span><b>${money(selected.marketValue.min)}${selected.marketValue.min===selected.marketValue.max?'':` – ${money(selected.marketValue.max)}`}</b></div><div><span>Confiança</span><b>${selected.confidence}%</b></div></div><div class="scout-attrs"><h3>Atributos conhecidos</h3>${attrs.length?attrs.map(([name,value])=>`<div><span>${name}</span><b>${range(value!)}</b></div>`).join(''):'<p>Conhecimento insuficiente para estimar atributos.</p>'}</div><div class="report-actions"><button id="assign-scout" class="primary" data-player="${selected.playerId}">${assignments.some(a=>a.playerId===selected.playerId)?'Em observação':'Observar jogador'}</button><button id="shortlist-player" class="secondary" data-player="${selected.playerId}">${isShortlisted(world,observer.id,selected.playerId)?'Remover da lista':'Adicionar à lista'}</button></div></div>`:'<div class="empty-state">Selecione um jogador.</div>'}</aside></div>`;
}

export function bindScouting(world: World, observer: Club, state: ScoutingUiState, rerender:()=>void): void {
  document.querySelector<HTMLSelectElement>('#scout-position')?.addEventListener('change',event=>{
    const value=(event.target as HTMLSelectElement).value;
    state.position=(value||undefined) as Position|undefined;
    state.selectedPlayerId=undefined;
    rerender();
  });
  document.querySelector<HTMLButtonElement>('#toggle-shortlist')?.addEventListener('click',()=>{state.showShortlist=!state.showShortlist;state.selectedPlayerId=undefined;rerender();});
  document.querySelectorAll<HTMLButtonElement>('[data-scout-player]').forEach(button=>button.addEventListener('click',()=>{state.selectedPlayerId=button.dataset.scoutPlayer;rerender();}));
  document.querySelector<HTMLButtonElement>('#assign-scout')?.addEventListener('click',event=>{
    const playerId=(event.currentTarget as HTMLButtonElement).dataset.player;
    if (playerId) assignScout(world,observer.id,playerId);
    rerender();
  });
  document.querySelector<HTMLButtonElement>('#shortlist-player')?.addEventListener('click',event=>{
    const playerId=(event.currentTarget as HTMLButtonElement).dataset.player;
    if (playerId) toggleShortlist(world,observer.id,playerId);
    rerender();
  });
}
