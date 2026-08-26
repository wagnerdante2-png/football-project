import type { Player, World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { FOOTBALL_SOURCE_CATALOG } from './world-football-source-catalog-v1';
import { realPlayersV2 } from './real-world-player-import-v2';
import { realStaff } from './real-world-staff-import-v1';

export type CountryCoverage={countryId:string;countryName:string;clubs:number;stadiums:number;competitions:number;leagueLevels:number[];hasTopDivision:boolean;hasSecondDivision:boolean;hasNationalTeam:boolean;hasAssociation:boolean;sourceCoverage:{leagues:boolean;clubs:boolean;stadiums:boolean};score:number;issues:string[]};
type RuntimeFactPlayer=Player&{dataOrigin?:string;ratingsOrigin?:string;wikidataId?:string;dateOfBirth?:string};

export function footballWorldCoverage(world:World){
 const snap=footballDataSnapshot(world),rows:CountryCoverage[]=[];
 for(const b of FOOTBALL_SOURCE_CATALOG){
  const clubs=snap.clubs.filter(x=>x.countryId===b.countryId).length,stadiums=snap.stadiums.filter(x=>x.countryId===b.countryId).length,competitions=snap.competitions.filter(x=>x.countryId===b.countryId),leagueLevels=[...new Set(competitions.filter(x=>x.kind==='league'&&x.level).map(x=>x.level as number))].sort((a,b)=>a-b),hasTopDivision=leagueLevels.includes(1),hasSecondDivision=leagueLevels.includes(2),hasNationalTeam=snap.nationalTeams.some(x=>x.countryId===b.countryId),hasAssociation=snap.associations.some(x=>x.countryId===b.countryId),issues:string[]=[];
  if(!hasTopDivision)issues.push('1ª divisão ausente');if(!hasSecondDivision)issues.push('2ª divisão ausente');if(clubs===0&&b.clubSources.length)issues.push('fonte de clubes configurada mas nenhum clube importado');if(stadiums===0&&b.stadiumSources.length)issues.push('fonte de estádios configurada mas nenhum estádio importado');if(!hasNationalTeam)issues.push('seleção principal ausente');if(!hasAssociation)issues.push('federação ausente');
  const score=Math.round(([hasTopDivision,hasSecondDivision,clubs>0||b.clubSources.length===0,stadiums>0||b.stadiumSources.length===0,hasNationalTeam,hasAssociation].filter(Boolean).length/6)*100);
  rows.push({countryId:b.countryId,countryName:b.countryName,clubs,stadiums,competitions:competitions.length,leagueLevels,hasTopDivision,hasSecondDivision,hasNationalTeam,hasAssociation,sourceCoverage:{leagues:b.leagueSources.length>0,clubs:b.clubSources.length>0,stadiums:b.stadiumSources.length>0},score,issues});
 }
 const fullyCovered=rows.filter(x=>x.score===100).length,withTwoDivisions=rows.filter(x=>x.hasTopDivision&&x.hasSecondDivision).length,totalClubs=rows.reduce((n,x)=>n+x.clubs,0),totalStadiums=rows.reduce((n,x)=>n+x.stadiums,0);
 return{ok:rows.every(x=>x.hasTopDivision||x.sourceCoverage.leagues===false),countries:rows.length,fullyCovered,withTwoDivisions,totalClubs,totalStadiums,rows};
}

export function footballPopulationCoverage(world:World){
 const snap=footballDataSnapshot(world),clubPlayers=world.clubs.flatMap(c=>c.players) as RuntimeFactPlayer[],real=realPlayersV2(world),realById=new Map(real.map(r=>[r.id,r])),players=new Map<string,RuntimeFactPlayer>();for(const p of clubPlayers)players.set(p.id,p);for(const r of real)if(!players.has(r.id))players.set(r.id,r.player as RuntimeFactPlayer);
 let factualIdentity=0,proceduralIdentity=0,estimatedRatings=0,factualPosition=0,estimatedPosition=0;for(const p of players.values()){const r=realById.get(p.id),runtimeFact=p.dataOrigin==='wikidata-membership'||p.dataOrigin==='official-roster';if(r||runtimeFact)factualIdentity++;else proceduralIdentity++;if(r||p.ratingsOrigin==='engine-estimate'||runtimeFact)estimatedRatings++;const positionEvidence=r?.fieldEvidence?.position;if(positionEvidence?.estimated===false||(!r&&runtimeFact&&(p as any).positionOrigin==='verified-specific'))factualPosition++;else estimatedPosition++}
 const total=players.size,pct=(n:number)=>total?Number((n*100/total).toFixed(2)):0,countries=new Set([...snap.associations.map(a=>a.countryId),...snap.nationalTeams.map(t=>t.countryId),...snap.clubs.map(c=>c.countryId)]),domesticLeagues=snap.competitions.filter(c=>c.scope==='domestic'&&c.kind==='league').length,domesticCups=snap.competitions.filter(c=>c.scope==='domestic'&&['cup','supercup'].includes(c.kind)).length,continental=snap.competitions.filter(c=>c.scope==='continental').length,international=snap.competitions.filter(c=>c.scope==='international').length;
 return{countries:countries.size,clubs:snap.clubs.length,players:total,staff:realStaff(world).length,nationalTeams:snap.nationalTeams.length,associations:snap.associations.length,confederations:snap.confederations.length,leagues:domesticLeagues,cups:domesticCups,continentalCompetitions:continental,internationalCompetitions:international,stadiums:snap.stadiums.length,origins:{factualIdentity,proceduralIdentity,estimatedRatings,factualPosition,estimatedPosition},percentages:{factualIdentity:pct(factualIdentity),proceduralIdentity:pct(proceduralIdentity),estimatedRatings:pct(estimatedRatings),factualPosition:pct(factualPosition),estimatedPosition:pct(estimatedPosition)}}
}
