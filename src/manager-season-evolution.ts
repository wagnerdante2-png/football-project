import type { World } from './engine';
import { onWorldEvent } from './event-bus';
import { managerCharacterState } from './manager-character';
import { finalizeManagerSeasonEvolution } from './manager-longterm-evolution';
const wired=new WeakSet<World>();
export function wireManagerSeasonEvolution(world:World){if(wired.has(world))return;wired.add(world);onWorldEvent(world,'SeasonEnded',(event)=>{for(const m of managerCharacterState(world).characters.values())finalizeManagerSeasonEvolution(world,m,event.date,event.season);});}
