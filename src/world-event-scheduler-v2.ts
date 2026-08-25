import type { World } from './engine';
import { queueWorldEvent, worldCore, worldRandom, type WorldCadence, type WorldEvent } from './world-core-v2';

export type ScheduledWorldEvent={id:string;date:string;type:string;scope:WorldEvent['scope'];entityIds:string[];importance:number;payload:Record<string,unknown>;repeat?:{cadence:WorldCadence;until?:string;remaining?:number};processed:boolean};
const schedules=new WeakMap<World,ScheduledWorldEvent[]>();
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
const addDays=(iso:string,days:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const addMonths=(iso:string,months:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+months);return d.toISOString().slice(0,10)};
const addYears=(iso:string,years:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCFullYear(d.getUTCFullYear()+years);return d.toISOString().slice(0,10)};
function list(world:World){let x=schedules.get(world);if(!x){x=[];schedules.set(world,x)}return x}
function nextDate(date:string,cadence:WorldCadence){return cadence==='daily'?addDays(date,1):cadence==='weekly'?addDays(date,7):cadence==='monthly'?addMonths(date,1):addYears(date,1)}
export function scheduleWorldEvent(world:World,input:Omit<ScheduledWorldEvent,'id'|'processed'>){const id=`se-${hash(`${worldCore(world).worldId}:${input.date}:${input.type}:${input.entityIds.join(',')}:${list(world).length}`)}`,event:ScheduledWorldEvent={...input,id,processed:false,entityIds:[...input.entityIds],payload:{...input.payload},repeat:input.repeat?{...input.repeat}:undefined};list(world).push(event);list(world).sort((a,b)=>a.date.localeCompare(b.date)||b.importance-a.importance||a.id.localeCompare(b.id));return id}
export function cancelScheduledWorldEvent(world:World,id:string){const x=list(world),i=x.findIndex(e=>e.id===id);if(i<0)return false;x.splice(i,1);return true}
export function dueWorldEvents(world:World,date:string){return list(world).filter(e=>!e.processed&&e.date<=date)}
export function processScheduledWorldEvents(world:World,date:string){const due=dueWorldEvents(world,date),emitted:string[]=[];for(const e of due){emitted.push(queueWorldEvent(world,{date:e.date,type:e.type,scope:e.scope,entityIds:[...e.entityIds],importance:e.importance,payload:{...e.payload,scheduledEventId:e.id}}));e.processed=true;if(e.repeat){const remaining=e.repeat.remaining===undefined?undefined:e.repeat.remaining-1,next=nextDate(e.date,e.repeat.cadence),allowed=(remaining===undefined||remaining>0)&&(!e.repeat.until||next<=e.repeat.until);if(allowed)scheduleWorldEvent(world,{date:next,type:e.type,scope:e.scope,entityIds:[...e.entityIds],importance:e.importance,payload:{...e.payload},repeat:{...e.repeat,remaining}})}}return emitted}
export function scheduleWindow(world:World,from:string,to:string){return list(world).filter(e=>e.date>=from&&e.date<=to).map(e=>({...e,entityIds:[...e.entityIds],payload:{...e.payload},repeat:e.repeat?{...e.repeat}:undefined}))}
export function schedulerSnapshot(world:World){return list(world).map(e=>({...e,entityIds:[...e.entityIds],payload:{...e.payload},repeat:e.repeat?{...e.repeat}:undefined}))}
export function restoreScheduler(world:World,snapshot:ScheduledWorldEvent[]){schedules.set(world,snapshot.map(e=>({...e,entityIds:[...e.entityIds],payload:{...e.payload},repeat:e.repeat?{...e.repeat}:undefined})))}
export function maybeGenerateAmbientWorldEvent(world:World,date:string){const r=worldRandom(world,'world',`ambient:${date}`);if(r>.985)return scheduleWorldEvent(world,{date,type:'AmbientWorldDevelopment',scope:'world',entityIds:[],importance:1,payload:{roll:r}});}
