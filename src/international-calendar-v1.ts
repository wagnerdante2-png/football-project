import type { World } from './engine';
import { worldCore } from './world-core-v2';
export type InternationalWindowKind='friendly'|'qualifier'|'continental'|'worldCup';
export type InternationalWindow={id:string;start:string;end:string;kind:InternationalWindowKind;priority:number;competitive:boolean;clubReleaseRequired:boolean};
const iso=(y:number,m:number,d:number)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const plus=(date:string,days:number)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
export function internationalWindowsForYear(year:number):InternationalWindow[]{return[
{id:`int-${year}-mar`,start:iso(year,3,18),end:iso(year,3,31),kind:'qualifier',priority:70,competitive:true,clubReleaseRequired:true},
{id:`int-${year}-jun`,start:iso(year,6,1),end:iso(year,6,16),kind:'qualifier',priority:75,competitive:true,clubReleaseRequired:true},
{id:`int-${year}-sep`,start:iso(year,9,1),end:iso(year,9,15),kind:'qualifier',priority:75,competitive:true,clubReleaseRequired:true},
{id:`int-${year}-oct`,start:iso(year,10,1),end:iso(year,10,15),kind:'qualifier',priority:75,competitive:true,clubReleaseRequired:true},
{id:`int-${year}-nov`,start:iso(year,11,1),end:iso(year,11,18),kind:'qualifier',priority:75,competitive:true,clubReleaseRequired:true}
]}
export function tournamentWindow(id:string,start:string,end:string,kind:Extract<InternationalWindowKind,'continental'|'worldCup'>):InternationalWindow{return{id,start,end,kind,priority:kind==='worldCup'?100:90,competitive:true,clubReleaseRequired:true}}
export function activeInternationalWindow(w:World,date=worldCore(w).date){return internationalWindowsForYear(Number(date.slice(0,4))).find(x=>date>=x.start&&date<=x.end)}
export function isInternationalReleaseDate(w:World,date=worldCore(w).date){return !!activeInternationalWindow(w,date)?.clubReleaseRequired}
export function releasePeriod(window:InternationalWindow){return{reportDate:window.start,releaseDate:plus(window.end,1),days:Math.max(1,Math.round((Date.parse(window.end)-Date.parse(window.start))/86400000)+1)}}
export function clubFixtureConflict(window:InternationalWindow,fixtureDate:string){return fixtureDate>=window.start&&fixtureDate<=window.end&&window.clubReleaseRequired}
export function calendarForRange(fromYear:number,toYear:number){const out:InternationalWindow[]=[];for(let y=fromYear;y<=toYear;y++)out.push(...internationalWindowsForYear(y));return out}
