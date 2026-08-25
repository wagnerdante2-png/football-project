import type { World } from './engine';
import type { SportNewsCategory, SportNewsIssue } from './sport-news-weekly-v1';

export type SportNewsArchiveArticle={id:string;page:1|2|3;category:SportNewsCategory;headline:string;importance:number;clubIds:string[];playerIds:string[];managerIds:string[];competitionIds:string[]};
export type SportNewsArchiveEntry={id:string;edition:number;date:string;season:number;weekStart:string;weekEnd:string;coverHeadline:string;pageHeadlines:[string[],string[],string[]];featuredClubIds:string[];featuredPlayerIds:string[];featuredManagerIds:string[];competitionIds:string[];articleCount:number;articles:SportNewsArchiveArticle[];keywords:string[]};
export type SportNewsArchiveSnapshot={entries:SportNewsArchiveEntry[]};
export type SportNewsArchiveFilter={season?:number;clubId?:string;playerId?:string;managerId?:string;competitionId?:string;category?:SportNewsCategory;from?:string;to?:string;query?:string};
export type SportNewsArchiveSeasonSummary={season:number;editions:number;articles:number;firstDate:string;lastDate:string;topClubs:{id:string;mentions:number}[];topPlayers:{id:string;mentions:number}[];topManagers:{id:string;mentions:number}[];topCategories:{category:SportNewsCategory;mentions:number}[]};

const states=new WeakMap<World,SportNewsArchiveEntry[]>();
function state(w:World){let s=states.get(w);if(!s){s=[];states.set(w,s)}return s}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const unique=(xs:string[])=>[...new Set(xs.filter(Boolean))];
function keywordsFor(issue:SportNewsIssue){const text=[issue.coverHeadline,...issue.pages.flatMap(p=>p.articles.flatMap(a=>[a.headline,a.deck,a.body]))].join(' ');return unique(normalize(text).split(' ').filter(x=>x.length>=4)).slice(0,160)}

export function archiveSportNewsIssue(w:World,issue:SportNewsIssue){
  const s=state(w),existing=s.find(x=>x.id===issue.id);if(existing)return existing;
  const articles:SportNewsArchiveArticle[]=issue.pages.flatMap(p=>p.articles.map(a=>({id:a.id,page:a.page,category:a.category,headline:a.headline,importance:a.importance,clubIds:[...a.clubIds],playerIds:[...a.playerIds],managerIds:[...a.managerIds],competitionIds:[...a.competitionIds]})));
  const entry:SportNewsArchiveEntry={id:issue.id,edition:issue.edition,date:issue.date,season:issue.season,weekStart:issue.weekStart,weekEnd:issue.weekEnd,coverHeadline:issue.coverHeadline,pageHeadlines:[issue.pages[0].articles.map(a=>a.headline),issue.pages[1].articles.map(a=>a.headline),issue.pages[2].articles.map(a=>a.headline)],featuredClubIds:[...issue.featuredClubIds],featuredPlayerIds:[...issue.featuredPlayerIds],featuredManagerIds:[...issue.featuredManagerIds],competitionIds:unique(articles.flatMap(a=>a.competitionIds)),articleCount:articles.length,articles,keywords:keywordsFor(issue)};
  s.push(entry);s.sort((a,b)=>a.date.localeCompare(b.date)||a.edition-b.edition);return entry;
}

export function archiveSportNewsIssues(w:World,issues:SportNewsIssue[]){for(const issue of issues)archiveSportNewsIssue(w,issue);return state(w).length}

export function sportNewsArchive(w:World,filter:SportNewsArchiveFilter={}){
  const q=filter.query?normalize(filter.query).split(' ').filter(Boolean):[];
  return state(w).filter(x=>(filter.season===undefined||x.season===filter.season)&&(!filter.clubId||x.featuredClubIds.includes(filter.clubId)||x.articles.some(a=>a.clubIds.includes(filter.clubId!)))&&(!filter.playerId||x.featuredPlayerIds.includes(filter.playerId)||x.articles.some(a=>a.playerIds.includes(filter.playerId!)))&&(!filter.managerId||x.featuredManagerIds.includes(filter.managerId)||x.articles.some(a=>a.managerIds.includes(filter.managerId!)))&&(!filter.competitionId||x.competitionIds.includes(filter.competitionId))&&(!filter.category||x.articles.some(a=>a.category===filter.category))&&(!filter.from||x.date>=filter.from)&&(!filter.to||x.date<=filter.to)&&(!q.length||q.every(term=>x.keywords.some(k=>k.includes(term))||normalize(x.coverHeadline).includes(term)))).map(x=>JSON.parse(JSON.stringify(x)) as SportNewsArchiveEntry);
}

export function sportNewsArchiveIssue(w:World,idOrEdition:string|number){const x=typeof idOrEdition==='number'?state(w).find(e=>e.edition===idOrEdition):state(w).find(e=>e.id===idOrEdition);return x?JSON.parse(JSON.stringify(x)) as SportNewsArchiveEntry:undefined}

function topCounts(ids:string[],limit=8){const m=new Map<string,number>();for(const id of ids)m.set(id,(m.get(id)??0)+1);return[...m].map(([id,mentions])=>({id,mentions})).sort((a,b)=>b.mentions-a.mentions||a.id.localeCompare(b.id)).slice(0,limit)}
export function sportNewsSeasonSummary(w:World,season:number):SportNewsArchiveSeasonSummary|undefined{const rows=state(w).filter(x=>x.season===season);if(!rows.length)return;const articles=rows.flatMap(x=>x.articles),cats=new Map<SportNewsCategory,number>();for(const a of articles)cats.set(a.category,(cats.get(a.category)??0)+1);return{season,editions:rows.length,articles:articles.length,firstDate:rows[0].date,lastDate:rows[rows.length-1].date,topClubs:topCounts(articles.flatMap(a=>a.clubIds)),topPlayers:topCounts(articles.flatMap(a=>a.playerIds)),topManagers:topCounts(articles.flatMap(a=>a.managerIds)),topCategories:[...cats].map(([category,mentions])=>({category,mentions})).sort((a,b)=>b.mentions-a.mentions).slice(0,8)}}

export function sportNewsCareerTimeline(w:World,entity:{clubId?:string;playerId?:string;managerId?:string},limit=120){return sportNewsArchive(w,entity).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit).map(x=>({id:x.id,edition:x.edition,date:x.date,season:x.season,coverHeadline:x.coverHeadline,relevantHeadlines:x.articles.filter(a=>(!entity.clubId||a.clubIds.includes(entity.clubId))&&(!entity.playerId||a.playerIds.includes(entity.playerId))&&(!entity.managerId||a.managerIds.includes(entity.managerId))).sort((a,b)=>b.importance-a.importance).slice(0,4).map(a=>a.headline)}))}

export function snapshotSportNewsArchive(w:World):SportNewsArchiveSnapshot{return{entries:JSON.parse(JSON.stringify(state(w)))}}
export function restoreSportNewsArchive(w:World,x?:SportNewsArchiveSnapshot){states.set(w,JSON.parse(JSON.stringify(x?.entries??[])))}
