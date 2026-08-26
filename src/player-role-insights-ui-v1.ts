import './player-role-insights-ui-v1.css';
import type { Player, World } from './engine';
import { bestRoles, type TacticalRole } from './player-role-evaluation-v2';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const labels:Record<TacticalRole,string>={
  goalkeeper:'Goleiro',sweeperKeeper:'Goleiro-líbero',fullback:'Lateral',wingback:'Ala',centralDefender:'Zagueiro',ballPlayingDefender:'Zagueiro construtor',stopper:'Zagueiro de combate',anchor:'Volante âncora',deepLyingPlaymaker:'Armador recuado',ballWinningMidfielder:'Meio-campista recuperador',centralMidfielder:'Meio-campista central',boxToBox:'Box-to-box',advancedPlaymaker:'Armador avançado',attackingMidfielder:'Meia ofensivo',shadowStriker:'Segundo atacante',winger:'Ponta',insideForward:'Atacante interior',widePlaymaker:'Armador aberto',advancedForward:'Atacante avançado',targetForward:'Centroavante pivô',falseNine:'Falso 9'
};
function world(){return window.__touchlineWorld as World|undefined}
function playerById(w:World,id:string):Player|undefined{for(const c of w.clubs){const p=c.players.find(x=>x.id===id);if(p)return p}}
function renderStrengths(items:{attribute:string;value:number}[]){return items.map(x=>`<span>${esc(x.attribute)} <b>${x.value}</b></span>`).join('')}
export function injectPlayerRoleInsights(playerId:string){
  const w=world(),player=w?playerById(w,playerId):undefined,overview=document.querySelector<HTMLElement>('.v2-profile-body[data-panel="overview"]');
  if(!w||!player||!overview||overview.querySelector('[data-role-insights]'))return;
  const roles=bestRoles(w,player,3);
  const section=document.createElement('section');
  section.className='v2-profile-card v2-role-insights';
  section.dataset.roleInsights='1';
  section.innerHTML=`<div class="v2-profile-section-title"><span>LEITURA TÁTICA</span><h3>Melhores funções</h3></div><div class="v2-role-list">${roles.map((r,i)=>`<article><div><span>${i===0?'MELHOR ENCAIXE':`OPÇÃO ${i+1}`}</span><b>${esc(labels[r.role])}</b><small>${r.position} · familiaridade ${Math.round(r.familiarity)}%</small></div><strong>${r.score.toFixed(1)}</strong><footer>${renderStrengths(r.strengths)}</footer></article>`).join('')}</div><p>Avaliação derivada dos atributos técnicos, familiaridade posicional e habilidade efetiva do motor. Não altera a tática nem os ratings do atleta.</p>`;
  overview.appendChild(section);
}
function fromClick(e:Event){const el=(e.target as HTMLElement).closest<HTMLElement>('[data-player-id]');if(el?.dataset.playerId)queueMicrotask(()=>injectPlayerRoleInsights(el.dataset.playerId!))}
document.addEventListener('click',fromClick);
document.addEventListener('touchline:open-player',e=>{const id=(e as CustomEvent).detail?.playerId;if(id)queueMicrotask(()=>injectPlayerRoleInsights(id))});
