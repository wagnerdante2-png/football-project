import type { World } from './engine';
import { loadBundledPublicPeople2026, type PublicPeople2026LoadReport } from './real-world-2026-loader-v1';
import { realPlayersV2 } from './real-world-player-import-v2';
import { realStaff } from './real-world-staff-import-v1';

export type WorldPeopleStatus={state:'idle'|'loading'|'ready'|'unavailable'|'error';message?:string;players?:number;staff?:number};
declare global { interface Window { __touchlineWorld?:World } }
const hydrated=new WeakSet<World>();
const reports=new WeakMap<World,PublicPeople2026LoadReport>();
const statuses=new WeakMap<World,WorldPeopleStatus>();
const pending=new WeakMap<World,Promise<void>>();
export function worldPeopleReport(world:World){return reports.get(world)}
export function worldPeopleStatus(world:World):WorldPeopleStatus{return statuses.get(world)??{state:'idle'}}
async function hydrate(world:World){const active=pending.get(world);if(hydrated.has(world)||active)return active;statuses.set(world,{state:'loading'});const task=(async()=>{try{const report=await loadBundledPublicPeople2026(world,'/data/people',{fallbackToLicensedLive:false});hydrated.add(world);reports.set(world,report);const status:WorldPeopleStatus={state:'ready',players:realPlayersV2(world).length+report.players.adoptedRuntime,staff:realStaff(world).length};statuses.set(world,status);window.dispatchEvent(new CustomEvent('touchline:world-people-ready',{detail:{report,status}}))}catch(error){const message=error instanceof Error?error.message:String(error),unavailable=/404|Falha ao carregar/i.test(message);statuses.set(world,{state:unavailable?'unavailable':'error',message});window.dispatchEvent(new CustomEvent('touchline:world-people-unavailable',{detail:{message}}))}finally{pending.delete(world)}})();pending.set(world,task);return task}
function activate(){const world=window.__touchlineWorld;if(world)void hydrate(world)}
window.addEventListener('touchline:world-hydrated',activate);
window.addEventListener('touchline:world-ready',activate);
queueMicrotask(activate);
export function ensureOfflineWorldPeople(world:World){return hydrate(world)}
