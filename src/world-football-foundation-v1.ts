import type { World } from './engine';
import { alias, registerConfederation, type ConfederationRecord } from './world-football-data-v1';
import { seedGlobalNationalTeams } from './national-team-registry-v1';

const foundation={sourceId:'football-project-foundation',license:'internal',historical:false,confidence:100};
const confeds:ConfederationRecord[]=[
{id:'FIFA',name:'FIFA',aliases:[alias('Fédération Internationale de Football Association')],memberAssociationIds:[],provenance:[foundation]},
{id:'UEFA',name:'UEFA',aliases:[alias('Union of European Football Associations')],memberAssociationIds:[],provenance:[foundation]},
{id:'CONMEBOL',name:'CONMEBOL',aliases:[alias('Confederación Sudamericana de Fútbol')],memberAssociationIds:[],provenance:[foundation]},
{id:'CONCACAF',name:'CONCACAF',aliases:[alias('Confederation of North, Central America and Caribbean Association Football')],memberAssociationIds:[],provenance:[foundation]},
{id:'AFC',name:'AFC',aliases:[alias('Asian Football Confederation')],memberAssociationIds:[],provenance:[foundation]},
{id:'CAF',name:'CAF',aliases:[alias('Confédération Africaine de Football')],memberAssociationIds:[],provenance:[foundation]},
{id:'OFC',name:'OFC',aliases:[alias('Oceania Football Confederation')],memberAssociationIds:[],provenance:[foundation]}
];

export function seedFootballGovernanceFoundation(world:World){for(const c of confeds)registerConfederation(world,c);const global=seedGlobalNationalTeams(world);return{confederations:confeds.length,associations:global.associations,nationalTeams:global.nationalTeams,historicalNationalTeams:global.historical}}
