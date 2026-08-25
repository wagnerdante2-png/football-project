import type { World } from './engine';
import type { SportNewsIssue } from './sport-news-weekly-v1';

export type SportNewsArchiveEntry={id:string;edition:number;date:string;season:number;coverHeadline:string;pageHeadlines:[string[],string[],string[]];featuredClubIds:string[];featuredPlayerIds:string[];featuredManagerIds:string[];articleCount:number};
export type SportNewsArchiveSnapshot={entries:SportNewsArchiveEntry[]};
const states=new WeakMap<World,SportNewsArchiveEntry[]>();
function state(w:World){let s=states.get(w);if(!s){s=[];states.set(w,s)}return s}
export function archiveSportNewsIssue(w:World,issue:SportNewsIssue){const s=state(w);if(s.some(x=>x.id===issue.id))return s.find(x=>x.id===issue.id)!;const entry:SportNewsArchiveEntry={id:issue.id,edition:issue.edition,date:issue.date,season:issue.season,coverHeadline:issue.coverHeadline,pageHeadlines:[issue.pages[0].articles.map(a=>a.headline),issue.pages[1].articles.map(a=>a.headline),issue.pages[2].articles.map(a=>a.headline)],featuredClubIds:[...issue.featuredClubIds],featuredPlayerIds:[...issue.featuredPlayerIds],featuredManagerIds:[...issue.featuredManagerIds],articleCount:issue.pages.reduce((n,p)=>n+p.articles.length,0)};s.push(entry);s.sort((a,b)=>a.date.localeCompare(b.date));return entry}
export function sportNewsArchive(w:World,filter:{season?:number;clubId?:string;playerId?:string;managerId?:string}={}){return state(w).filter(x=>(filter.season===undefined||x.season===filter.season)&&(!filter.clubId||x.featuredClubIds.includes(filter.clubId))&&(!filter.playerId||x.featuredPlayerIds.includes(filter.playerId))&&(!filter.managerId||x.featuredManagerIds.includes(filter.managerId))).map(x=>JSON.parse(JSON.stringify(x)) as SportNewsArchiveEntry)}
export function snapshotSportNewsArchive(w:World):SportNewsArchiveSnapshot{return{entries:JSON.parse(JSON.stringify(state(w)))}}
export function restoreSportNewsArchive(w:World,x?:SportNewsArchiveSnapshot){states.set(w,JSON.parse(JSON.stringify(x?.entries??[])))}
