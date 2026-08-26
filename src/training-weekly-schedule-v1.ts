import type { World } from './engine';
import type { SessionIntensity, SessionType, TrainingUnit } from './training-engine';

export type TrainingPeriod='am'|'pm';
export type WeeklyTrainingSlot={type:SessionType;intensity:SessionIntensity;unit:TrainingUnit;durationMinutes:number};
export type ClubWeeklyTrainingSchedule={clubId:string;enabled:boolean;slots:Record<number,Record<TrainingPeriod,WeeklyTrainingSlot>>};
export type WeeklyTrainingScheduleSnapshot={clubs:[string,ClubWeeklyTrainingSchedule][]};

const states=new WeakMap<World,Map<string,ClubWeeklyTrainingSchedule>>();
const cloneSlot=(slot:WeeklyTrainingSlot):WeeklyTrainingSlot=>({...slot});
const defaultSlot=(day:number,period:TrainingPeriod):WeeklyTrainingSlot=>{
  if(day===0)return{type:'rest',intensity:'veryLow',unit:'all',durationMinutes:0};
  if(day===6&&period==='pm')return{type:'recovery',intensity:'low',unit:'all',durationMinutes:60};
  if(period==='am')return day===1||day===4?{type:'technical',intensity:'medium',unit:'all',durationMinutes:75}:{type:'teamShape',intensity:'medium',unit:'all',durationMinutes:75};
  return day===2?{type:'pressing',intensity:'medium',unit:'all',durationMinutes:70}:day===5?{type:'setPieces',intensity:'low',unit:'all',durationMinutes:55}:{type:'recovery',intensity:'low',unit:'all',durationMinutes:60};
};
function initialSchedule(clubId:string):ClubWeeklyTrainingSchedule{
  const slots={} as Record<number,Record<TrainingPeriod,WeeklyTrainingSlot>>;
  for(let day=0;day<7;day++)slots[day]={am:defaultSlot(day,'am'),pm:defaultSlot(day,'pm')};
  return{clubId,enabled:false,slots};
}
function state(world:World){let s=states.get(world);if(!s){s=new Map();states.set(world,s);}return s;}
export function clubWeeklyTrainingSchedule(world:World,clubId:string):ClubWeeklyTrainingSchedule{
  const s=state(world);let schedule=s.get(clubId);if(!schedule){schedule=initialSchedule(clubId);s.set(clubId,schedule);}return schedule;
}
export function setWeeklyTrainingEnabled(world:World,clubId:string,enabled:boolean){clubWeeklyTrainingSchedule(world,clubId).enabled=enabled;}
export function setWeeklyTrainingSlot(world:World,clubId:string,day:number,period:TrainingPeriod,patch:Partial<WeeklyTrainingSlot>){
  const schedule=clubWeeklyTrainingSchedule(world,clubId),safeDay=Math.max(0,Math.min(6,Math.floor(day))),current=schedule.slots[safeDay][period];
  const next={...current,...patch};if(next.type==='rest'){next.intensity='veryLow';next.durationMinutes=0;next.unit='all';}else next.durationMinutes=Math.max(30,Math.min(120,Math.round(next.durationMinutes||75)));
  schedule.slots[safeDay][period]=next;schedule.enabled=true;
}
export function weeklySessionsForDate(world:World,clubId:string,date:string):WeeklyTrainingSlot[]|undefined{
  const schedule=clubWeeklyTrainingSchedule(world,clubId);if(!schedule.enabled)return undefined;
  const day=new Date(`${date}T12:00:00Z`).getUTCDay();
  return(['am','pm'] as TrainingPeriod[]).map(period=>cloneSlot(schedule.slots[day][period])).filter(slot=>slot.type!=='rest');
}
export function snapshotWeeklyTrainingSchedule(world:World):WeeklyTrainingScheduleSnapshot{
  return{clubs:[...state(world)].map(([id,schedule])=>[id,{clubId:schedule.clubId,enabled:schedule.enabled,slots:Object.fromEntries(Object.entries(schedule.slots).map(([day,periods])=>[Number(day),{am:cloneSlot(periods.am),pm:cloneSlot(periods.pm)}])) as ClubWeeklyTrainingSchedule['slots']}])};
}
export function restoreWeeklyTrainingSchedule(world:World,snapshot?:WeeklyTrainingScheduleSnapshot){
  if(!snapshot)return;states.set(world,new Map(snapshot.clubs.map(([id,schedule])=>[id,{clubId:schedule.clubId,enabled:schedule.enabled,slots:Object.fromEntries(Object.entries(schedule.slots).map(([day,periods])=>[Number(day),{am:cloneSlot(periods.am),pm:cloneSlot(periods.pm)}])) as ClubWeeklyTrainingSchedule['slots']}])));
}
