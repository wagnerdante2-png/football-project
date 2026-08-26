import './training-human-response-ui-v1.css';
import type { World } from './engine';
import { userManager } from './manager-character';
import { clubDressingRoom } from './dressing-room';
import { clubTraining } from './training-engine';

const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const tone=(value:number)=>value>=72?'good':value>=55?'warn':'danger';
function world(){return window.__touchlineWorld as World|undefined;}

function renderTrainingHumanResponse(){
  const w=world(),host=document.querySelector<HTMLElement>('.game-stage main.view');
  if(!w||!host||!host.querySelector('.training-v2-cycle'))return;
  host.querySelector('[data-training-human-response]')?.remove();
  const manager=userManager(w),club=w.clubs.find(c=>c.id===manager?.currentClubId);if(!club)return;
  const room=clubDressingRoom(w,club.id),training=clubTraining(w,club.id);if(!room||!training)return;
  const rows=club.players.map(player=>{
    const status=room.players.get(player.id),state=training.players.get(player.id);
    return status&&state?{player,status,state}:undefined;
  }).filter(Boolean) as {player:(typeof club.players)[number];status:NonNullable<ReturnType<typeof room.players.get>>;state:NonNullable<ReturnType<typeof training.players.get>>}[];
  if(!rows.length)return;
  const avgHappiness=Math.round(rows.reduce((sum,row)=>sum+row.status.overallHappiness,0)/rows.length);
  const avgTrust=Math.round(rows.reduce((sum,row)=>sum+row.status.managerTrust,0)/rows.length);
  const activeGrievances=rows.filter(row=>row.status.grievanceDays>0).length;
  const concernRisk=rows.filter(row=>row.status.grievanceDays>=3||row.status.overallHappiness<50||row.state.load.overloadDays>=3).length;
  const lowest=[...rows].sort((a,b)=>(a.status.overallHappiness+a.status.managerTrust*.2)-(b.status.overallHappiness+b.status.managerTrust*.2)).slice(0,5);
  const section=document.createElement('section');section.className='glass training-human-response';section.dataset.trainingHumanResponse='1';
  section.innerHTML=`<header><div><span>PERCEPÇÃO DO ELENCO</span><h2>Como os jogadores estão recebendo o treino</h2><p>A mesma carga não é percebida da mesma forma por todos. Personalidade, resiliência, confiança, monotonia, readiness e plano individual influenciam a reação humana.</p></div><div class="training-human-summary"><b class="${tone(avgHappiness)}">${avgHappiness}%</b><small>satisfação média</small></div></header><div class="training-human-metrics"><article><span>CONFIANÇA MÉDIA</span><b class="${tone(avgTrust)}">${avgTrust}%</b></article><article><span>QUEIXAS EM FORMAÇÃO</span><b class="${activeGrievances?'warn':'good'}">${activeGrievances}</b></article><article><span>RISCO DE CONVERSA</span><b class="${concernRisk?'danger':'good'}">${concernRisk}</b></article></div><div class="training-human-list"><strong>ATLETAS PARA ACOMPANHAR</strong>${lowest.map(({player,status,state})=>`<div><span><b>${esc(player.name)}</b><small>${player.position} · ${player.age} anos${state.individual?` · plano ${Math.round(state.individual.satisfaction)}%`:''}</small></span><span><small>Treino</small><b class="${tone(status.overallHappiness)}">${Math.round(status.overallHappiness)}%</b></span><span><small>Confiança</small><b class="${tone(status.managerTrust)}">${Math.round(status.managerTrust)}%</b></span><span><small>Readiness</small><b class="${tone(state.load.readiness)}">${Math.round(state.load.readiness)}%</b></span><span><small>Queixa</small><b>${status.grievanceDays}d</b></span></div>`).join('')}</div><footer>Insatisfação persistente pode virar uma conversa real de vestiário; descanso programado não gera punição nem avanço artificial da queixa.</footer>`;
  host.querySelector('.training-individual')?.insertAdjacentElement('beforebegin',section);
}

document.addEventListener('touchline:view-rendered',event=>{if((event as CustomEvent).detail?.view==='training')queueMicrotask(renderTrainingHumanResponse)});
document.addEventListener('touchline:training-human-refresh',renderTrainingHumanResponse);
