import type { World } from './engine';
import { restoreWorldCore,snapshotWorldCore,type WorldCoreSnapshot } from './world-core-v2';
import { restoreWorldScheduler,snapshotWorldScheduler,type ScheduledWorldTask } from './world-scheduler-v2';
export const WORLD_SAVE_VERSION=2;
export type WorldSaveEnvelope={format:'football-project-world';version:number;createdAt:string;core:WorldCoreSnapshot;scheduler:ScheduledWorldTask[];extensions:Record<string,unknown>};
export function createWorldSave(world:World,extensions:Record<string,unknown>={}):WorldSaveEnvelope{return{format:'football-project-world',version:WORLD_SAVE_VERSION,createdAt:new Date().toISOString(),core:snapshotWorldCore(world),scheduler:snapshotWorldScheduler(world),extensions:{...extensions}}}
function migrate(raw:any):WorldSaveEnvelope{if(!raw||raw.format!=='football-project-world')throw new Error('Save mundial inválido.');let x={...raw};if(x.version===1){x.scheduler=x.scheduler??[];x.extensions=x.extensions??{};x.version=2}if(x.version!==WORLD_SAVE_VERSION)throw new Error(`Versão de save não suportada: ${x.version}.`);return x as WorldSaveEnvelope}
export function restoreWorldSave(world:World,raw:unknown){const x=migrate(raw);restoreWorldCore(world,x.core);restoreWorldScheduler(world,x.scheduler);return{version:x.version,extensions:{...x.extensions}}}
export function validateWorldSave(raw:unknown){try{const x=migrate(raw as any),issues:string[]=[];if(!x.core?.worldId)issues.push('worldId ausente.');if(!Array.isArray(x.scheduler))issues.push('scheduler inválido.');if(!x.createdAt)issues.push('createdAt ausente.');return{ok:issues.length===0,issues,version:x.version}}catch(e){return{ok:false,issues:[e instanceof Error?e.message:String(e)],version:undefined}}
