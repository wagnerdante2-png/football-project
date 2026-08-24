import type { Club, World } from './engine';
import { activeAssignments } from './scouting';
import { clubScouts, regionalKnowledge, scoutingRegions } from './staff';

export function renderStaff(world:World,club:Club):string{
  const scouts=clubScouts(world,club.id);
  const assignments=activeAssignments(world,club.id);
  return `<header><div><span class="eyebrow">STAFF · ${club.name.toUpperCase()}</span><h1>Equipe de Recrutamento</h1><p>Scouts individuais possuem especialidades, regiões preferenciais e capacidade limitada. O conhecimento da rede influencia a precisão dos relatórios.</p></div></header>
  <section class="cards"><article class="card metric"><span>Scouts</span><strong>${scouts.length}</strong></article><article class="card metric"><span>Observações ativas</span><strong>${assignments.length}/${scouts.length*2}</strong></article><article class="card metric"><span>Melhor julg. habilidade</span><strong>${Math.max(...scouts.map(s=>s.judgingAbility))}</strong></article><article class="card metric"><span>Melhor julg. potencial</span><strong>${Math.max(...scouts.map(s=>s.judgingPotential))}</strong></article></section>
  <div class="staff-layout"><section class="card"><div class="section-title"><h2>Scouts</h2><span>${scouts.length} profissionais</span></div><table><thead><tr><th>Nome</th><th>Idade</th><th>Habilidade</th><th>Potencial</th><th>Adapt.</th><th>Região</th><th>Carga</th></tr></thead><tbody>${scouts.map(s=>{const load=assignments.filter(a=>a.scoutId===s.id).length;return `<tr><td>${s.name}</td><td>${s.age}</td><td><b>${s.judgingAbility}</b></td><td><b>${s.judgingPotential}</b></td><td>${s.adaptability}</td><td>${s.preferredRegion}</td><td>${load}/2</td></tr>`;}).join('')}</tbody></table></section>
  <aside class="card"><div class="section-title"><h2>Conhecimento regional</h2><span>Rede do clube</span></div><div class="region-list">${scoutingRegions().map(region=>{const value=regionalKnowledge(world,club.id,region);return `<div class="region-row"><div><b>${region}</b><small>${value>=75?'Rede consolidada':value>=45?'Conhecimento razoável':value>=25?'Cobertura limitada':'Mercado pouco conhecido'}</small></div><span>${value}%</span><div class="region-meter"><i style="width:${value}%"></i></div></div>`;}).join('')}</div></aside></div>`;
}
