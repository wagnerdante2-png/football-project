import './manager-human-decisions-ui-v1.css';
import type { World } from './engine';
import { userManager } from './manager-character';
import { dailyCalendar } from './daily-simulation';
import { eventBusState } from './event-bus';
import { pendingManagerInteractions, resolveManagerInteraction, type ManagerInteraction } from './manager-interactions';

const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const currentWorld=()=>window.__touchlineWorld as World|undefined;
function managedClubId(world:World){return userManager(world)?.currentClubId??world.clubs[0]?.id;}
function playerName(world:World,id?:string){if(!id)return'Clube';for(const club of world.clubs){const player=club.players.find(p=>p.id===id);if(player)return player.name;}return id;}
function sourceLabel(world:World,interaction:ManagerInteraction){const source=eventBusState(world).events.find(event=>event.id===interaction.sourceEventId);if(source?.tags.includes('training-load'))return'TREINO';if(interaction.kind==='personal'||interaction.kind==='support')return'PESSOAL';if(interaction.kind==='dressingRoom'||interaction.kind==='conflict')return'VESTIÁRIO';if(interaction.kind==='media')return'IMPRENSA';if(interaction.kind==='transfer'||interaction.kind==='contract')return'MERCADO';return'ELENCO';}
function urgency(interaction:ManagerInteraction){return interaction.severity>=8?'critical':interaction.severity>=6?'high':'normal';}
function fmt(iso:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(`${iso}T12:00:00Z`)).replace('.','');}

function card(world:World,interaction:ManagerInteraction){
  return `<article class="mhd-card ${urgency(interaction)}" data-human-interaction="${esc(interaction.id)}"><header><div><span>${sourceLabel(world,interaction)} · ${esc(playerName(world,interaction.playerId).toUpperCase())}</span><h3>${esc(interaction.context)}</h3></div><b>${interaction.severity}/10</b></header><div class="mhd-meta"><span>Aberta ${fmt(interaction.date)}</span><span>Responder até ${fmt(interaction.deadlineDate)}</span></div><div class="mhd-options">${interaction.options.map(option=>`<button data-human-interaction-id="${esc(interaction.id)}" data-human-option-id="${esc(option.id)}"><b>${esc(option.label)}</b><small>${esc(option.description)}</small></button>`).join('')}</div></article>`;
}

function render(){
  const world=currentWorld();if(!world)return;
  const clubId=managedClubId(world);if(!clubId)return;
  document.querySelectorAll('[data-manager-human-decisions]').forEach(node=>node.remove());
  const pending=pendingManagerInteractions(world,clubId).filter(item=>item.status==='pending').sort((a,b)=>b.severity-a.severity||a.deadlineDate.localeCompare(b.deadlineDate));
  if(!pending.length)return;
  const host=document.querySelector<HTMLElement>('.game-stage main.view');if(!host)return;
  const home=host.querySelector<HTMLElement>('.manager-center-v10'),inbox=host.querySelector<HTMLElement>('.manager-inbox-v10'),target=inbox??home;
  if(!target)return;
  const section=document.createElement('section');section.className='mhd-panel';section.dataset.managerHumanDecisions='1';
  section.innerHTML=`<header class="mhd-title"><div><span>DECISÕES HUMANAS</span><h2>${pending.length===1?'1 conversa precisa da sua resposta':`${pending.length} conversas precisam da sua resposta`}</h2><p>As opções abaixo são as decisões reais do motor. A resposta altera relação, moral e, quando a origem é treinamento, volta à percepção do atleta sobre a rotina.</p></div><b>${pending.length}</b></header><div class="mhd-list">${pending.slice(0,inbox?8:4).map(item=>card(world,item)).join('')}</div>`;
  if(inbox)target.insertBefore(section,target.children[1]??null);else target.insertBefore(section,target.querySelector('.mc10-grid')??null);
  section.querySelectorAll<HTMLButtonElement>('[data-human-interaction-id]').forEach(button=>button.onclick=()=>{
    const interactionId=button.dataset.humanInteractionId,optionId=button.dataset.humanOptionId;if(!interactionId||!optionId)return;
    if(resolveManagerInteraction(world,interactionId,optionId,dailyCalendar(world).date))render();
  });
}

document.addEventListener('touchline:view-rendered',event=>{const view=(event as CustomEvent).detail?.view;if(view==='home'||view==='inbox')queueMicrotask(render);});
document.addEventListener('touchline:manager-human-refresh',render);
