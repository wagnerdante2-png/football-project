import './world-football-coverage-ui-v1.css';
import type { World } from './engine';
import { footballWorldCoverage } from './world-football-coverage-v1';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function world(){return window.__touchlineWorld as World|undefined}
function inject(){
  const w=world(),host=document.querySelector<HTMLElement>('.game-stage main.view');
  if(!w||!host||host.querySelector('[data-world-football-coverage]')||!host.querySelector('.engine-table'))return;
  const coverage=footballWorldCoverage(w),section=document.createElement('section');
  const rows=[...coverage.rows].sort((a,b)=>a.score-b.score||a.countryName.localeCompare(b.countryName));
  const average=rows.length?Math.round(rows.reduce((sum,row)=>sum+row.score,0)/rows.length):0;
  section.className='wf-coverage';
  section.dataset.worldFootballCoverage='1';
  section.innerHTML=`<header><div><span>COBERTURA DO UNIVERSO</span><h2>Profundidade por país</h2><p>Leitura do cadastro canônico atual. Este painel não importa nem cria dados: apenas mostra onde o universo já está profundo e onde ainda existem lacunas.</p></div><strong>${average}<small>score médio / 100</small></strong></header><div class="wfc-kpis"><article><span>Países catalogados</span><b>${coverage.countries}</b><small>fontes conhecidas</small></article><article><span>Cobertura completa</span><b>${coverage.fullyCovered}</b><small>score 100</small></article><article><span>Duas divisões</span><b>${coverage.withTwoDivisions}</b><small>1ª + 2ª</small></article><article><span>Clubes canônicos</span><b>${coverage.totalClubs}</b><small>sem criar calendário</small></article></div><div class="wfc-table"><table><thead><tr><th>País</th><th>Score</th><th>Clubes</th><th>Estádios</th><th>Comp.</th><th>Ligas</th><th>Seleção</th><th>Federação</th><th>Lacunas</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><b>${esc(r.countryName)}</b><small> ${esc(r.countryId)}</small></td><td><span class="wfc-score ${r.score>=80?'good':r.score>=50?'mid':'low'}">${r.score}</span></td><td>${r.clubs}</td><td>${r.stadiums}</td><td>${r.competitions}</td><td>${esc(r.leagueLevels.join(' · ')||'—')}</td><td>${r.hasNationalTeam?'✓':'—'}</td><td>${r.hasAssociation?'✓':'—'}</td><td class="wfc-issues">${esc(r.issues.join(' · ')||'Cobertura estrutural completa')}</td></tr>`).join(''):'<tr><td colspan="9" class="wfc-empty">Nenhum país catalogado.</td></tr>'}</tbody></table></div>`;
  host.appendChild(section);
}
document.addEventListener('touchline:view-rendered',e=>{if((e as CustomEvent).detail?.view==='world')setTimeout(inject,0)});
