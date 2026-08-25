import type { World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { HISTORICAL_NATIONAL_IDENTITIES, nationalIdentitySuccessor } from './national-team-registry-v1';

export type NationalLineageLink={predecessorCountryId:string;successorCountryId:string;continuity:'official-successor'|'partial'|'none';validTo?:string;notes?:string};
export const NATIONAL_LINEAGE_LINKS:NationalLineageLink[]=[
{predecessorCountryId:'FRG',successorCountryId:'GER',continuity:'official-successor',validTo:'1990',notes:'Germany continues the DFB/West Germany football record.'},
{predecessorCountryId:'GDR',successorCountryId:'GER',continuity:'partial',validTo:'1990',notes:'East Germany ceased separately; historical results remain separately addressable.'},
{predecessorCountryId:'URS',successorCountryId:'RUS',continuity:'partial',validTo:'1991',notes:'USSR history remains distinct while Russia is a principal successor in football records.'},
{predecessorCountryId:'TCH',successorCountryId:'CZE',continuity:'partial',validTo:'1992',notes:'Czechoslovakia remains a distinct historical identity.'},
{predecessorCountryId:'YUG',successorCountryId:'SRB',continuity:'partial',validTo:'2003',notes:'Yugoslav history remains historically distinct; Serbia is a successor association lineage.'},
{predecessorCountryId:'SCG',successorCountryId:'SRB',continuity:'official-successor',validTo:'2006'}
];
export function nationalLineage(countryId:string){const links:NationLineageLinkCompat[]=NATIONAL_LINEAGE_LINKS.filter(x=>x.predecessorCountryId===countryId||x.successorCountryId===countryId);return{countryId,successor:nationalIdentitySuccessor(countryId),links}}
type NationLineageLinkCompat=NationalLineageLink;
export function historicalIdentitiesForSuccessor(countryId:string){return HISTORICAL_NATIONAL_IDENTITIES.filter(x=>x.successorCountryId===countryId)}
export function nationalHonoursWithLineage(world:World,currentCountryId:string,include:'official-successor'|'all-related'='official-successor'){const snap=footballDataSnapshot(world),teamIds=new Set<string>();for(const t of snap.nationalTeams)if(t.countryId===currentCountryId)teamIds.add(t.id);for(const link of NATIONAL_LINEAGE_LINKS){if(link.successorCountryId!==currentCountryId)continue;if(include==='official-successor'&&link.continuity!=='official-successor')continue;for(const t of snap.nationalTeams)if(t.countryId===link.predecessorCountryId)teamIds.add(t.id)}const titles=snap.titles.filter(t=>t.teamKind==='national'&&teamIds.has(t.teamId)).sort((a,b)=>a.season.localeCompare(b.season));return{countryId:currentCountryId,teamIds:[...teamIds],titles,total:titles.length,byCompetition:[...new Map(titles.map(t=>[t.competitionId,[] as typeof titles])).keys()].map(competitionId=>({competitionId,titles:titles.filter(t=>t.competitionId===competitionId),count:titles.filter(t=>t.competitionId===competitionId).length}))}}
