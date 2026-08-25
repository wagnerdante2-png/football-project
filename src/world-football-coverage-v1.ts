import type { World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { FOOTBALL_SOURCE_CATALOG } from './world-football-source-catalog-v1';

export type CountryCoverage={countryId:string;countryName:string;clubs:number;stadiums:number;competitions:number;leagueLevels:number[];hasTopDivision:boolean;hasSecondDivision:boolean;hasNationalTeam:boolean;hasAssociation:boolean;sourceCoverage:{leagues:boolean;clubs:boolean;stadiums:boolean};score:number;issues:string[]};

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
