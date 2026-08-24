import type { Club, Player, World } from './engine';
import { medicalProfile, medicalSnapshot, severityName } from './injuries';

const sideLabel:Record<string,string>={left:'esquerda',right:'direita',central:'central',bilateral:'bilateral'};
const footLabel:Record<string,string>={right:'Destro',left:'Canhoto',both:'Ambidestro'};
const attrLabel:Record<string,string>={pace:'Velocidade',passing:'Passe',technique:'Técnica',finishing:'Finalização',tackling:'Desarme',positioning:'Posicionamento',stamina:'Resistência',decisions:'Decisões',goalkeeping:'Defesa'};

export function renderMedicalCenter(world:World,club:Club,selectedPlayerId?:string):string {
  const squad=[...club.players].sort((a,b)=>{
    const aa=medicalSnapshot(world,a.id),bb=medicalSnapshot(world,b.id);
    return Number(!aa?.available)-Number(!bb?.available)||(bb?.riskIndex??0)-(aa?.riskIndex??0);
  });
  const selected=squad.find(p=>p.id===selectedPlayerId)??squad[0];
  const snap=selected?medicalSnapshot(world,selected.id):undefined;
  const profile=selected?medicalProfile(world,selected.id):undefined;
  const unavailable=squad.filter(p=>!medicalSnapshot(world,p.id)?.available).length;
  const highRisk=squad.filter(p=>(medicalSnapshot(world,p.id)?.riskIndex??0)>=65).length;
  const chronic=squad.filter(p=>(medicalSnapshot(world,p.id)?.vulnerabilities.some(v=>v.chronicity>=40)??false)).length;
  return `<header><div><span class="eyebrow">DEPARTAMENTO MÉDICO · ${club.name.toUpperCase()}</span><h1>Centro Médico e Histórico Físico</h1><p>Lesões possuem gravidade, estrutura anatômica, lateralidade, recorrência, fases de recuperação, sequelas temporárias e fragilidades crônicas.</p></div></header>
  <section class="cards"><article class="card metric"><span>Indisponíveis</span><strong>${unavailable}</strong></article><article class="card metric"><span>Alto risco</span><strong>${highRisk}</strong></article><article class="card metric"><span>Fragilidades crônicas</span><strong>${chronic}</strong></article><article class="card metric"><span>Elenco monitorado</span><strong>${squad.length}</strong></article></section>
  <div class="medical-layout"><section class="card medical-list"><div class="section-title"><h2>Elenco</h2><span>Risco e disponibilidade</span></div><table><thead><tr><th>Jogador</th><th>Pos</th><th>Idade</th><th>Pé</th><th>Status</th><th>Risco</th></tr></thead><tbody>${squad.map(p=>{const s=medicalSnapshot(world,p.id)!;return `<tr class="${selected?.id===p.id?'selected-medical':''}"><td><button class="medical-player" data-medical-player="${p.id}">${p.name}</button></td><td>${p.position}</td><td>${p.age}</td><td>${footLabel[s.footedness]}</td><td>${s.available?'Disponível':s.activeInjuries[0]?.name??'Indisponível'}</td><td><b class="risk-${s.riskIndex>=70?'high':s.riskIndex>=45?'mid':'low'}">${s.riskIndex}</b></td></tr>`;}).join('')}</tbody></table></section>
  <aside class="card medical-detail">${selected&&snap&&profile?`<div class="section-title"><h2>${selected.name}</h2><span>${selected.position} · ${footLabel[snap.footedness]}</span></div><div class="medical-body"><div class="medical-kpis"><div><span>Predisposição</span><b>${profile.injuryProneness}</b></div><div><span>Recuperação</span><b>${profile.recovery}</b></div><div><span>Durabilidade</span><b>${profile.durability}</b></div><div><span>Jogos perdidos</span><b>${snap.matchesMissed}</b></div></div>
  <h3>Lesões ativas</h3>${snap.activeInjuries.length?snap.activeInjuries.map(i=>`<article class="injury-card severity-${i.severity}"><div><b>${i.name}</b><span>${severityName(i.severity)} · ${sideLabel[i.side]}</span></div><p>Fase: ${i.phase} · previsão restante: ${i.roundsRemaining} rodada(s)</p><p>${i.notes.join(' ')}</p></article>`).join(''):'<p>Sem lesões ativas.</p>'}
  <h3>Déficits funcionais pós-lesão</h3>${snap.deficits.length?snap.deficits.map(d=>`<div class="deficit-row"><div><b>${attrLabel[d.attribute]??d.attribute}</b><small>${d.description}</small></div><span>-${d.currentPenaltyPct.toFixed(1)}%</span><small>piso permanente ${d.permanentFloorPct.toFixed(1)}%</small></div>`).join(''):'<p>Nenhum déficit funcional relevante.</p>'}
  <h3>Fragilidades anatômicas</h3>${snap.vulnerabilities.length?snap.vulnerabilities.map(v=>`<div class="vulnerability-row"><div><b>${v.region} · ${sideLabel[v.side]}</b><small>${v.tissue} · ${v.sourceInjuryIds.length} ocorrência(s)</small></div><span>${v.susceptibility.toFixed(0)}% suscet.</span><small>cronicidade ${v.chronicity.toFixed(0)}</small></div>`).join(''):'<p>Sem fragilidades registradas.</p>'}
  <h3>Histórico completo</h3>${snap.history.length?`<div class="history-list">${snap.history.map(i=>`<div><span>${i.season}/${i.round}</span><b>${i.name}</b><small>${severityName(i.severity)} · ${sideLabel[i.side]} · ${i.roundsOutInitial} rodadas · ${i.occurredContext}${i.dominantSideAffected?' · lado dominante':''}</small></div>`).join('')}</div>`:'<p>Sem histórico de lesões.</p>'}</div>`:'<div class="empty-state">Selecione um jogador.</div>'}</aside></div>`;
}

export function bindMedicalCenter(setSelected:(playerId:string)=>void):void {
  document.querySelectorAll<HTMLButtonElement>('[data-medical-player]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.medicalPlayer;if(id)setSelected(id);}));
}
