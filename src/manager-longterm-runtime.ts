import type { World } from './engine';
import { tickManagerLongTermEvolution, wireManagerLongTermEvolution } from './manager-longterm-evolution';
const wired=new WeakSet<World>();
export function tickManagerLongTermRuntime(world:World,date:string){if(!wired.has(world)){wired.add(world);wireManagerLongTermEvolution(world);}tickManagerLongTermEvolution(world,date);}
