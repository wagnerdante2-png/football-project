import type { World } from './engine';
import { onWorldEvent } from './event-bus';
import { userManager } from './manager-character';
import { managerInteractionState } from './manager-interactions';

const wired=new WeakSet<World>();

export function enforceHumanManagerControl(world:World):number{
  const manager=userManager(world);if(!manager)return 0;
  let changed=0;
  for(const interaction of managerInteractionState(world).interactions){
    if(interaction.clubId!==manager.currentClubId||interaction.status!=='pending'||interaction.aiControlled===false)continue;
    interaction.aiControlled=false;changed++;
  }
  return changed;
}

export function wireHumanManagerControl(world:World):void{
  enforceHumanManagerControl(world);
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'ManagerInteractionOpened',()=>{enforceHumanManagerControl(world);});
}

function currentWorld():World|undefined{return window.__touchlineWorld as World|undefined;}
function ensure(){const world=currentWorld();if(world)wireHumanManagerControl(world);}
if(typeof document!=='undefined'){
  queueMicrotask(ensure);
  document.addEventListener('touchline:view-rendered',ensure);
}
