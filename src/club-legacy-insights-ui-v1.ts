import './club-legacy-insights-ui-v1.css';
import type { World } from './engine';
import { userManager } from './manager-character';
import { clubLegacyProfile } from './club-legacy-profile-v1';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const pct=(n:number)=>`${Math.round(n)}%`;
const integer=(n:number)=>new Intl.NumberFormat('pt-BR').format(Math.round(n));
function world(){return window.__touchlineWorld as World|undefined}
function currentClub(w:World){const id=userManager(w)?.currentClubId??w.clubs[0]?.id;return w.clubs.find(c=>c.id===id)}
function inject(){
  const w=world(),club=w&&currentClub(w),host=document.querySelector<HTMLElement>('.game-stage main.view');
  if(!w||!club||!host||host.querySelector('[data-club-legacy-insights]')||!host.querySelector('.view-hero'))return;
  const p=clubLegacyProfile(w,club.id),section=document.createElement('section');
  const rivals=p.rivals.slice(0,4),eras=p.eras.slice(-4),memories=p.memories.slice(0,4),chases=p.recordChases.slice(0,4),titleCount=p.honours.reduce((sum,h)=>sum+h.count,0);
  section.className='club-legacy-insights';
  section.dataset.clubLegacyInsights='1';
  section.innerHTML=`<header><div><span>IDENTIDADE INSTITUCIONAL</span><h2>Legado & pressão histórica</h2><p>Memória construída por títulos, temporadas, rivalidades, torcida e acontecimentos persistentes.</p></div><strong>${Math.round(p.historicalPressure.totalPressure)}<small>pressão histórica</small></strong></header><div class="cli-kpis"><article><span>Torcida estimada</span><b>${integer(p.supporters.supporters)}</b><small>lealdade ${pct(p.supporters.loyalty)}</small></article><article><span>Expectativa</span><b>${pct(p.supporters.expectation)}</b><small>paciência ${pct(p.supporters.patience)}</small></article><article><span>Reputação</span><b>${Math.round(p.reputation.overall)}</b><small>histórica ${Math.round(p.reputation.historical)}</small></article><article><span>Títulos registrados</span><b>${titleCount}</b><small>jejum ${p.records.currentTitleDrought} temp.</small></article></div><div class="cli-grid"><section><h3>RIVALIDADES</h3>${rivals.length?rivals.map(r=>`<article class="cli-row"><b>${esc(w.clubs.find(c=>c.id===r.clubId)?.name??r.clubId)}</b><span>${esc(r.label)}</span><strong>${Math.round(r.score)}</strong></article>`).join(''):'<p class="cli-empty">Rivalidades surgirão conforme a identidade histórica for enriquecida.</p>'}</section><section><h3>ERAS DO CLUBE</h3>${eras.length?eras.map(e=>`<article class="cli-row"><b>${e.fromSeason}${e.toSeason!==e.fromSeason?`–${e.toSeason}`:''}</b><span>${esc(e.label)} · ${e.titles} título(s)</span><strong>${Math.round(e.score)}</strong></article>`).join(''):'<p class="cli-empty">A carreira ainda não acumulou temporadas suficientes para formar eras.</p>'}</section><section><h3>MEMÓRIAS FORTES</h3>${memories.length?memories.map(m=>`<article class="cli-memory"><b>${esc(m.summary)}</b><span>${esc(m.type)} · força ${Math.round(m.memoryStrength)}</span></article>`).join(''):'<p class="cli-empty">Nenhuma memória institucional forte registrada ainda.</p>'}</section><section><h3>RECORDES EM DISPUTA</h3>${chases.length?chases.map(r=>`<article class="cli-memory"><b>${esc(r.playerName)} · ${esc(r.record)}</b><span>${r.current}/${r.target} · ${esc(r.status)} · ${pct(r.progress)}</span></article>`).join(''):'<p class="cli-empty">Nenhuma perseguição de recorde ativa neste momento.</p>'}</section></div>${p.historicalPressure.reasons.length?`<footer>${p.historicalPressure.reasons.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</footer>`:''}`;
  host.appendChild(section);
}
document.addEventListener('touchline:view-rendered',e=>{if((e as CustomEvent).detail?.view==='club')queueMicrotask(inject)});
