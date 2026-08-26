import type { World } from './engine';
import { onWorldEvent } from './event-bus';
import { clubDressingRoom } from './dressing-room';
import { clubTraining } from './training-engine';

const wired=new WeakSet<World>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));

export function mentorshipTrainingModifier(world:World,clubId:string,playerId:string):number{
  const mentorship=clubDressingRoom(world,clubId)?.mentorships.find(m=>m.active&&m.menteeId===playerId);
  if(!mentorship)return 1;
  const net=clamp((mentorship.benefit-mentorship.friction)/100,-.12,.18);
  return 1+net;
}

function applyMentorshipAfterTraining(world:World,clubId:string):void{
  const room=clubDressingRoom(world,clubId),training=clubTraining(world,clubId);
  if(!room||!training)return;
  for(const mentorship of room.mentorships){
    if(!mentorship.active)continue;
    const player=training.players.get(mentorship.menteeId),plan=player?.individual;
    if(!player||!plan)continue;
    const modifier=mentorshipTrainingModifier(world,clubId,mentorship.menteeId),net=modifier-1;
    if(Math.abs(net)<1e-9)continue;
    const bonus=.3*net;
    plan.progress=clamp(plan.progress+bonus);
    plan.satisfaction=clamp(plan.satisfaction+net*.15);
    if(plan.focus==='weakFoot')player.weakFootProgress=clamp(player.weakFootProgress+bonus*.45);
    if(plan.focus==='roleWork')player.roleProgress=clamp(player.roleProgress+bonus*.45);
    if(plan.focus==='newPosition'&&plan.targetPosition)player.positionProgress[plan.targetPosition]=clamp((player.positionProgress[plan.targetPosition]??0)+bonus*.4);
  }
}

export function wireTrainingMentorshipRuntime(world:World):void{
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'TrainingCompleted',event=>{
    for(const clubId of event.clubIds)applyMentorshipAfterTraining(world,clubId);
  });
}

function currentWorld():World|undefined{return window.__touchlineWorld as World|undefined;}
function ensureCurrentWorldWired(){const world=currentWorld();if(world)wireTrainingMentorshipRuntime(world);}
if(typeof document!=='undefined'){
  queueMicrotask(ensureCurrentWorldWired);
  document.addEventListener('touchline:view-rendered',ensureCurrentWorldWired);
}
