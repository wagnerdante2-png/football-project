import type { World } from './engine';
import { loadBundledPublicPeople2026, type PublicPeople2026LoadReport } from './real-world-2026-loader-v1';
import { realPlayersV2 } from './real-world-player-import-v2';
import { realStaff } from './real-world-staff-import-v1';

declare global { interface Window { __touchlineWorld?:World;__touchlinePeopleReport?:PublicPeople2026LoadReport;__touchlinePeopleStatus?:{state:'idle'|'loading'|'ready'|'unavailable'|'error';message?:string;players?:number;staff?:number} } }
const hydrated=new WeakSet<World>();
let pending:Promise<void>|undefined;
async function hydrate(world:World){if(hydrated.has(world)||pending)return pending;window.__touchlinePeopleStatus={state:'loading'};pending=(async()=>{try{const report=await loadBundledPublicPeople2026(world,'/data/people',{fallbackToLicensedLive:false});hydrated.add(world);window.__touchlinePeopleReport=report;window.__touchlinePeopleStatus={state:'ready',players:realPlayersV2(world).length+report.players.adoptedRuntime,staff:realStaff(world).length};window.dispatchEvent(new CustomEvent('touchline:world-people-ready',{detail:{report,status:window.__touchlinePeopleStatus}}))}catch(error){const message=error instanceof Error?error.message:String(error),unavailable=/404|Falha ao carregar/i.test(message);window.__touchlinePeopleStatus={state:unavailable?'unavailable':'error',message};window.dispatchEvent(new CustomEvent('touchline:world-people-unavailable',{detail:{message}}))}finally{pending=undefined}})();return pending}
function activate(){const world=window.__touchlineWorld;if(world)void hydrate(world)}
window.addEventListener('touchline:world-hydrated',activate);
window.addEventListener('touchline:world-ready',activate);
queueMicrotask(activate);
export function ensureOfflineWorldPeople(world:World){return hydrate(world)}
