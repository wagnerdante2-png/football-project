import './world-coverage-insights-ui-v1.css';
import type { World } from './engine';
import { footballWorldCoverage } from './world-football-coverage-v1';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function world(){return window.__touchlineWorld as World|undefined}
function inject(){
  const w=world(),host=document.querySelector<HTMLElement>('.game-stage main.view');
  if(!w||!host||host.querySelector('[data-world-coverage-insights]')||!host.querySelector('.engine-table'))return;
  const coverage=footballWorldCoverage(w),section=document.createElement('section');
  const rows=[...coverage.rows].sort((a,b)=>a.score-b.score||b.competitions-a.competitions||a.countryName.localeCompare(b.countryName)).slice(0,12);
  section.className='world-coverage-insights';
  section.dataset.worldCoverageInsights='1';
  section.innerHTML=`<header><div><span>COBERTURA DO UNIVERSO</span><h2>Profundidade mundial</h2><p>Leitura da base canônica já carregada. Este painel não importa dados nem cria competições.</p></div><strong>${coverage.countries}<small>países catalogados</small></strong></header><div class="wci-kpis"><article><span>Cobertura completa</span><b>${coverage.fullyCovered}</b><small>países em 100%</small></article><article><span>Duas divisões</span><b>${coverage.withTwoDivisions}</b><small>1ª + 2ª divisão</small></article><article><span>Clubes canônicos</span><b>${coverage.totalClubs}</b><small>registrados no mundo</small></article><article><span>Estádios</span><b>${coverage.totalStadiums}</b><small>registrados no mundo</small></article></div><div class="wci-table-wrap"><table><thead><tr><th>País</th><th>Score</th><th>Clubes</th><th>Comp.</th><th>Divisões</th><th>Seleção</th><th>Federação</th><th>Lacunas</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.countryName)}</b><small>${esc(r.countryId)}</small></td><td><strong>${r.score}%</strong></td><td>${r.clubs}</td><td>${r.competitions}</td><td>${r.leagueLevels.length?esc(r.leagueLevels.join(' · ')):'—'}</td><td>${r.hasNationalTeam?'✓':'—'}</td><td>${r.hasAssociation?'✓':'—'}</td><td><span>${esc(r.issues.slice(0,2).join(' · ')||'sem lacunas')}</span></td></tr>`).join('')}</tbody></table></div><footer>Exibindo os 12 países com menor cobertura atual para orientar a expansão da base mundial.</footer>`;
  host.appendChild(section);
}
document.addEventListener('touchline:view-rendered',e=>{if((e as CustomEvent).detail?.view==='world')setTimeout(inject,0)});
