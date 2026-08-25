import type { World } from './engine';
import { worldCore, syncWorldDate } from './world-core-v2';
export type SeasonPhase='preSeason'|'firstHalf'|'midSeason'|'secondHalf'|'postSeason';
const dayMs=86400000;
export const addWorldDays=(iso:string,n:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const worldDayDifference=(a:string,b:string)=>Math.round((new Date(`${a}T12:00:00Z`).getTime()-new Date(`${b}T12:00:00Z`).getTime())/dayMs);
export function seasonForDate(date:string,startMonth=7){const y=Number(date.slice(0,4)),m=Number(date.slice(5,7));return m>=startMonth?y:y-1}
export function seasonPhase(date:string):SeasonPhase{const m=Number(date.slice(5,7));return m===6||m===7?'preSeason':m>=8&&m<=12?'firstHalf':m===1?'midSeason':m>=2&&m<=5?'secondHalf':'postSeason'}
export function worldClock(world:World){const c=worldCore(world);return{date:c.date,season:c.season,dayIndex:c.dayIndex,phase:seasonPhase(c.date),weekday:new Date(`${c.date}T12:00:00Z`).getUTCDay(),year:Number(c.date.slice(0,4)),month:Number(c.date.slice(5,7)),day:Number(c.date.slice(8,10))}}
export function advanceWorldClock(world:World,days=1){const c=worldCore(world),from=c.date,to=addWorldDays(from,Math.max(0,Math.floor(days))),cadence=syncWorldDate(world,to);return{from,to,...cadence,clock:worldClock(world)}}
