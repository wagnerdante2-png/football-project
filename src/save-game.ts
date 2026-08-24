import type { World } from './engine';
import { snapshotDailyCalendar, restoreDailyCalendar, type DailyCalendarSnapshot } from './daily-simulation';
import { snapshotEventBus, restoreEventBus, type EventBusSnapshot } from './event-bus';
import { snapshotInstitutionalState, restoreInstitutionalState, type InstitutionalSnapshot } from './institutional-memory';
import { snapshotTemporalState, restoreTemporalState, type TemporalSnapshot } from './temporal-persistence';
import { snapshotHumanLife, restoreHumanLife, type HumanLifeSnapshot } from './human-life';

export type SaveGameV1={schemaVersion:1;createdAt:string;world:World;calendar:DailyCalendarSnapshot;events:EventBusSnapshot;institutional:InstitutionalSnapshot};
export type SaveGameV2={schemaVersion:2;createdAt:string;world:World;calendar:DailyCalendarSnapshot;events:EventBusSnapshot;institutional:InstitutionalSnapshot;temporal:TemporalSnapshot};
export type SaveGameV3={schemaVersion:3;createdAt:string;world:World;calendar:DailyCalendarSnapshot;events:EventBusSnapshot;institutional:InstitutionalSnapshot;temporal:TemporalSnapshot;humanLife:HumanLifeSnapshot};
export type SaveGame=SaveGameV1|SaveGameV2|SaveGameV3;

export function createSaveSnapshot(world:World):SaveGameV3{
  return{schemaVersion:3,createdAt:new Date().toISOString(),world:JSON.parse(JSON.stringify(world)) as World,calendar:snapshotDailyCalendar(world),events:snapshotEventBus(world),institutional:snapshotInstitutionalState(world),temporal:snapshotTemporalState(world),humanLife:snapshotHumanLife(world)};
}

export function serializeSave(world:World):string{return JSON.stringify(createSaveSnapshot(world));}

export function restoreSave(serialized:string):World{
  const parsed=JSON.parse(serialized) as SaveGame;if(![1,2,3].includes(parsed.schemaVersion))throw new Error(`Save incompatível: versão ${String((parsed as {schemaVersion?:unknown}).schemaVersion)}`);
  const world=parsed.world;restoreDailyCalendar(world,parsed.calendar);restoreEventBus(world,parsed.events);restoreInstitutionalState(world,parsed.institutional);
  if(parsed.schemaVersion>=2)restoreTemporalState(world,(parsed as SaveGameV2|SaveGameV3).temporal);
  if(parsed.schemaVersion===3)restoreHumanLife(world,parsed.humanLife);
  return world;
}

export function downloadSave(world:World,fileName=`football-project-${world.season}.json`):void{
  const blob=new Blob([serializeSave(world)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);
}
