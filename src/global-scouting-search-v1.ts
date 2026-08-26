import type { Position, World } from './engine';
import { GLOBAL_NATIONAL_TEAM_SEEDS } from './national-team-registry-v1';
import { playerProfile } from './player-profile-v2';
import { scoutingReport, type ScoutingReport } from './scouting';
import { worldPlayerPool } from './world-player-pool-v1';

export type GlobalScoutingSearchInput={observerClubId:string;query?:string;countryId?:string;position?:Position;limit?:number};
export type GlobalScoutingSearchResult={reports:ScoutingReport[];matched:number;scanned:number;profiled:number};

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const countryNames=new Map(GLOBAL_NATIONAL_TEAM_SEEDS.map(x=>[x.id,x.name]));
const countryCache=new WeakMap<World,{population:number;rows:Array<{id:string;name:string;count:number}>}>();
const reportScore=(report:ScoutingReport)=>(report.currentAbility.min+report.currentAbility.max)*.34+(report.potentialAbility.min+report.potentialAbility.max)*.16+(report.age<=21?7:report.age<=24?3:0)+report.confidence*.05;
const discoveryScore=(entry:ReturnType<typeof worldPlayerPool>[number])=>{const p=entry.player;return p.currentAbility+(p.age<=23?(p.potentialAbility-p.currentAbility)*.42:0)+(p.age<=21?5:p.age<=24?2:0)+(entry.runtimeClub?.reputation??48)*.035};

export function globalScoutingSearch(world:World,input:GlobalScoutingSearchInput):GlobalScoutingSearchResult{
  const limit=Math.max(1,Math.min(200,input.limit??40)),query=normalize(input.query??''),rows=worldPlayerPool(world),matches=[] as typeof rows;
  for(const entry of rows){
    const player=entry.player;if(player.clubId===input.observerClubId)continue;if(input.position&&player.position!==input.position)continue;
    const profile=playerProfile(world,player.id),nationalities=profile?.nationalities??[];if(input.countryId&&!nationalities.includes(input.countryId))continue;
    if(query){const countryText=nationalities.map(id=>countryNames.get(id)??id).join(' '),clubText=entry.runtimeClub?.name??player.clubId??'',haystack=normalize(`${player.name} ${countryText} ${clubText} ${player.position}`);if(!haystack.includes(query))continue}
    matches.push(entry);
  }
  const profilingCap=Math.min(matches.length,Math.max(limit*4,query?80:160));
  const shortlist=[...matches].sort((a,b)=>discoveryScore(b)-discoveryScore(a)).slice(0,profilingCap);
  const reports=shortlist.map(entry=>scoutingReport(world,input.observerClubId,entry.player.id)).filter((x):x is ScoutingReport=>!!x).sort((a,b)=>reportScore(b)-reportScore(a)).slice(0,limit);
  return{reports,matched:matches.length,scanned:rows.length,profiled:shortlist.length};
}

export function globalScoutingCountries(world:World){
  const pool=worldPlayerPool(world),cached=countryCache.get(world);if(cached&&cached.population===pool.length)return cached.rows;
  const counts=new Map<string,number>();for(const entry of pool)for(const id of playerProfile(world,entry.player.id)?.nationalities??[])counts.set(id,(counts.get(id)??0)+1);
  const rows=[...counts.entries()].map(([id,count])=>({id,name:countryNames.get(id)??id,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));countryCache.set(world,{population:pool.length,rows});return rows;
}
