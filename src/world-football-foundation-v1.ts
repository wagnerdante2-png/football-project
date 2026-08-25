import type { World } from './engine';
import { alias, registerAssociation, registerConfederation, registerNationalTeam, type ConfederationRecord } from './world-football-data-v1';
import { registerCountryProfile } from './world-geography-climate-v2';

const cc0={sourceId:'football-project-foundation',license:'internal',historical:false,confidence:100};
const confeds:ConfederationRecord[]=[
{id:'FIFA',name:'FIFA',aliases:[alias('Fédération Internationale de Football Association')],memberAssociationIds:[],provenance:[cc0]},
{id:'UEFA',name:'UEFA',aliases:[alias('Union of European Football Associations')],memberAssociationIds:[],provenance:[cc0]},
{id:'CONMEBOL',name:'CONMEBOL',aliases:[alias('Confederación Sudamericana de Fútbol')],memberAssociationIds:[],provenance:[cc0]},
{id:'CONCACAF',name:'CONCACAF',aliases:[alias('Confederation of North, Central America and Caribbean Association Football')],memberAssociationIds:[],provenance:[cc0]},
{id:'AFC',name:'AFC',aliases:[alias('Asian Football Confederation')],memberAssociationIds:[],provenance:[cc0]},
{id:'CAF',name:'CAF',aliases:[alias('Confédération Africaine de Football')],memberAssociationIds:[],provenance:[cc0]},
{id:'OFC',name:'OFC',aliases:[alias('Oceania Football Confederation')],memberAssociationIds:[],provenance:[cc0]}
];

export function seedFootballGovernanceFoundation(world:World){for(const c of confeds)registerConfederation(world,c);registerCountryProfile(world,{id:'BRA',name:'Brasil',continent:'South America',associationId:'CBF',hemisphere:'south',defaultClimate:'tropical'});registerAssociation(world,{id:'CBF',name:'Confederação Brasileira de Futebol',countryId:'BRA',confederationId:'CONMEBOL',aliases:[alias('CBF'),alias('Brazilian Football Confederation')],provenance:[cc0]});registerNationalTeam(world,{id:'nt-bra-men-senior',countryId:'BRA',associationId:'CBF',name:'Brasil',aliases:[alias('Brazil'),alias('Seleção Brasileira')],teamKind:'senior',gender:'men',active:true,provenance:[cc0]});return{confederations:confeds.length,associations:1,nationalTeams:1}}
