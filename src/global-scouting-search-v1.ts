import type { Position, World } from './engine';
import { GLOBAL_NATIONAL_TEAM_SEEDS } from './national-team-registry-v1';
import { playerProfile } from './player-profile-v2';
import { scoutingReport, type ScoutingReport } from './scouting';
import { worldPlayerPool } from './world-player-pool-v1';

export type GlobalScoutingSearchInput={
  observerClubId:string;
  query?:string;
  countryId?:string;
  position?:Position;
  limit?:number;
};

export type GlobalScoutingSearchResult={
  reports:ScoutingReport[];
  matched:number;
  scanned:number;
};

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const countryNames=new Map(GLOBAL_NATIONAL_TEAM_SEEDS.map(x=>[x.id,x.name]));

function score(report:ScoutingReport){
  return (report.currentAbility.min+report.currentAbility.max)*.34+(report.potentialAbility.min+report.potentialAbility.max)*.16+(report.age<=21?7:report.age<=24?3:0)+report.confidence*.05;
}

export function globalScoutingSearch(world:World,input:GlobalScoutingSearchInput):GlobalScoutingSearchResult{
  const limit=Math.max(1,Math.min(200,input.limit??40));
  const query=normalize(input.query??'');
  const rows=worldPlayerPool(world);
  const matches=[] as typeof rows;
  for(const entry of rows){
    const player=entry.player;
    if(player.clubId===input.observerClubId)continue;
    if(input.position&&player.position!==input.position)continue;
    const profile=playerProfile(world,player.id);
    const nationalities=profile?.nationalities??[];
    if(input.countryId&&!nationalities.includes(input.countryId))continue;
    if(query){
      const countryText=nationalities.map(id=>countryNames.get(id)??id).join(' ');
      const clubText=entry.runtimeClub?.name??player.clubId??'';
      const haystack=normalize(`${player.name} ${countryText} ${clubText} ${player.position}`);
      if(!haystack.includes(query))continue;
    }
    matches.push(entry);
  }
  const reports=matches.map(entry=>scoutingReport(world,input.observerClubId,entry.player.id)).filter((x):x is ScoutingReport=>!!x).sort((a,b)=>score(b)-score(a)).slice(0,limit);
  return{reports,matched:matches.length,scanned:rows.length};
}

export function globalScoutingCountries(world:World){
  const counts=new Map<string,number>();
  for(const entry of worldPlayerPool(world))for(const id of playerProfile(world,entry.player.id)?.nationalities??[])counts.set(id,(counts.get(id)??0)+1);
  return[...counts.entries()].map(([id,count])=>({id,name:countryNames.get(id)??id,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
}
