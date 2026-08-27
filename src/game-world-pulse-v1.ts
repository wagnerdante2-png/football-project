import './game-world-pulse-v1.css';
import type { World } from './engine';
import { onWorldEvent, type WorldEvent } from './event-bus';
import { userManager } from './manager-character';

const wiredWorlds=new WeakSet<World>();
const pulseTypes=new Set<WorldEvent['type']>([
  'PlayerRecovered','TrainingOverloadWarning','DressingRoomConcern','ContractExpiring','ContractRenewed',
  'StaffConflict','StaffPromoted','MediaStoryPublished','SupporterMoodChanged','ManagerRelationshipChanged',
  'RecruitmentRejected','NegotiationUpdated','PromiseKept','PromiseBroken','CommercialPartnershipSigned',
  'MediaObligationsMissed','MentorshipStarted','CaptaincyChanged'
]);

function currentWorld():World|undefined{return (window as Window&{__touchlineWorld?:World}).__touchlineWorld}
function managedClubId(world:World){return userManager(world)?.currentClubId}

function relevantToManager(world:World,event:WorldEvent){
  const clubId=managedClubId(world);
  if(!clubId)return false;
  if(event.clubIds.includes(clubId))return true;
  const club=world.clubs.find(c=>c.id===clubId);
  if(event.playerIds.some(id=>club?.players.some(player=>player.id===id)))return true;
  const manager=userManager(world);
  return Boolean(manager&&event.actorIds.includes(manager.id));
}

function label(event:WorldEvent){
  const labels:Partial<Record<WorldEvent['type'],string>>={
    PlayerRecovered:'DEPARTAMENTO MÉDICO',TrainingOverloadWarning:'TREINAMENTO',DressingRoomConcern:'VESTIÁRIO',
    ContractExpiring:'CONTRATO',ContractRenewed:'CONTRATO',StaffConflict:'COMISSÃO TÉCNICA',StaffPromoted:'COMISSÃO TÉCNICA',
    MediaStoryPublished:'IMPRENSA',SupporterMoodChanged:'TORCIDA',ManagerRelationshipChanged:'RELAÇÕES',RecruitmentRejected:'MERCADO',
    NegotiationUpdated:'NEGOCIAÇÃO',PromiseKept:'PROMESSA CUMPRIDA',PromiseBroken:'PROMESSA QUEBRADA',CommercialPartnershipSigned:'COMERCIAL',
    MediaObligationsMissed:'IMPRENSA',MentorshipStarted:'VESTIÁRIO',CaptaincyChanged:'LIDERANÇA'
  };
  return labels[event.type]??'MUNDO DO FUTEBOL';
}

function showPulse(world:World,event:WorldEvent){
  if(event.importance>=4||!pulseTypes.has(event.type)||!relevantToManager(world,event))return;
  if(document.querySelector('.tl-world-pulse'))return;
  const node=document.createElement('aside');
  node.className=`tl-world-pulse importance-${event.importance}`;
  node.innerHTML=`<i></i><div><span>${label(event)}</span><b>${event.summary}</b></div>`;
  document.body.appendChild(node);
  requestAnimationFrame(()=>node.classList.add('is-visible'));
  window.setTimeout(()=>node.classList.add('is-leaving'),2300);
  window.setTimeout(()=>node.remove(),2600);
}

function wire(){
  const world=currentWorld();
  if(!world||wiredWorlds.has(world))return;
  wiredWorlds.add(world);
  onWorldEvent(world,'*',event=>showPulse(world,event));
}

window.addEventListener('touchline:world-ready',wire);
window.addEventListener('touchline:world-hydrated',wire);
window.addEventListener('touchline:save-loaded',wire);
queueMicrotask(wire);
