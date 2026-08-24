import type { World } from './engine';
import { snapshotDailyCalendar, restoreDailyCalendar, type DailyCalendarSnapshot } from './daily-simulation';
import { snapshotEventBus, restoreEventBus, type EventBusSnapshot } from './event-bus';
import { snapshotInstitutionalState, restoreInstitutionalState, type InstitutionalSnapshot } from './institutional-memory';

export type SaveGameV1={
  schemaVersion:1;
  createdAt:string;
  world:World;
  calendar:DailyCalendarSnapshot;
  events:EventBusSnapshot;
  institutional:InstitutionalSnapshot;
};

export function createSaveSnapshot(world:World):SaveGameV1{
  return{schemaVersion:1,createdAt:new Date().toISOString(),world:JSON.parse(JSON.stringify(world)) as World,calendar:snapshotDailyCalendar(world),events:snapshotEventBus(world),institutional:snapshotInstitutionalState(world)};
}

export function serializeSave(world:World):string{return JSON.stringify(createSaveSnapshot(world));}

export function restoreSave(serialized:string):World{
  const parsed=JSON.parse(serialized) as SaveGameV1;if(parsed.schemaVersion!==1)throw new Error(`Save incompatível: versão ${String((parsed as {schemaVersion?:unknown}).schemaVersion)}`);
  const world=parsed.world;restoreDailyCalendar(world,parsed.calendar);restoreEventBus(world,parsed.events);restoreInstitutionalState(world,parsed.institutional);return world;
}

export function downloadSave(world:World,fileName=`football-project-${world.season}.json`):void{
  const blob=new Blob([serializeSave(world)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);
}
