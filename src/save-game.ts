import type { World } from './engine';
import { snapshotDailyCalendar, restoreDailyCalendar, type DailyCalendarSnapshot } from './daily-simulation';
import { snapshotEventBus, restoreEventBus, type EventBusSnapshot } from './event-bus';
import { snapshotInstitutionalState, restoreInstitutionalState, type InstitutionalSnapshot } from './institutional-memory';
import { snapshotTemporalState, restoreTemporalState, type TemporalSnapshot } from './temporal-persistence';

export type SaveGameV1={
  schemaVersion:1;
  createdAt:string;
  world:World;
  calendar:DailyCalendarSnapshot;
  events:EventBusSnapshot;
  institutional:InstitutionalSnapshot;
};

export type SaveGameV2={
  schemaVersion:2;
  createdAt:string;
  world:World;
  calendar:DailyCalendarSnapshot;
  events:EventBusSnapshot;
  institutional:InstitutionalSnapshot;
  temporal:TemporalSnapshot;
};

export type SaveGame=SaveGameV1|SaveGameV2;

export function createSaveSnapshot(world:World):SaveGameV2{
  return{
    schemaVersion:2,
    createdAt:new Date().toISOString(),
    world:JSON.parse(JSON.stringify(world)) as World,
    calendar:snapshotDailyCalendar(world),
    events:snapshotEventBus(world),
    institutional:snapshotInstitutionalState(world),
    temporal:snapshotTemporalState(world),
  };
}

export function serializeSave(world:World):string{return JSON.stringify(createSaveSnapshot(world));}

export function restoreSave(serialized:string):World{
  const parsed=JSON.parse(serialized) as SaveGame;
  if(parsed.schemaVersion!==1&&parsed.schemaVersion!==2)throw new Error(`Save incompatível: versão ${String((parsed as {schemaVersion?:unknown}).schemaVersion)}`);
  const world=parsed.world;
  restoreDailyCalendar(world,parsed.calendar);
  restoreEventBus(world,parsed.events);
  restoreInstitutionalState(world,parsed.institutional);
  if(parsed.schemaVersion===2)restoreTemporalState(world,parsed.temporal);
  return world;
}

export function downloadSave(world:World,fileName=`football-project-${world.season}.json`):void{
  const blob=new Blob([serializeSave(world)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);
}
