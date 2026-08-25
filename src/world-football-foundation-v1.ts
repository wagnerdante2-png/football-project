import type { World } from './engine';
import { alias, registerAssociation, registerConfederation, registerNationalTeam, type ConfederationRecord } from './world-football-data-v1';
import { registerCountryProfile } from './world-geography-climate-v2';

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

type NationSeed={id:string;name:string;continent:string;confederationId:string;associationId:string;associationName:string;aliases:string[];hemisphere:'north'|'south'|'equatorial';climate:'tropical'|'subtropical'|'temperate'|'continental'|'arid'|'polar'|'highland'};
const nations:NationSeed[]=[
{id:'BRA',name:'Brasil',continent:'South America',confederationId:'CONMEBOL',associationId:'CBF',associationName:'Confederação Brasileira de Futebol',aliases:['Brazil','Seleção Brasileira'],hemisphere:'south',climate:'tropical'},
{id:'ARG',name:'Argentina',continent:'South America',confederationId:'CONMEBOL',associationId:'AFA',associationName:'Asociación del Fútbol Argentino',aliases:['Argentina National Team','La Albiceleste'],hemisphere:'south',climate:'temperate'},
{id:'COL',name:'Colômbia',continent:'South America',confederationId:'CONMEBOL',associationId:'FCF',associationName:'Federación Colombiana de Fútbol',aliases:['Colombia'],hemisphere:'equatorial',climate:'tropical'},
{id:'PAR',name:'Paraguai',continent:'South America',confederationId:'CONMEBOL',associationId:'APF',associationName:'Asociación Paraguaya de Fútbol',aliases:['Paraguay'],hemisphere:'south',climate:'subtropical'},
{id:'PER',name:'Peru',continent:'South America',confederationId:'CONMEBOL',associationId:'FPF',associationName:'Federación Peruana de Fútbol',aliases:['Peru'],hemisphere:'south',climate:'highland'},
{id:'BOL',name:'Bolívia',continent:'South America',confederationId:'CONMEBOL',associationId:'FBF',associationName:'Federación Boliviana de Fútbol',aliases:['Bolivia'],hemisphere:'south',climate:'highland'},
{id:'CHI',name:'Chile',continent:'South America',confederationId:'CONMEBOL',associationId:'FFCH',associationName:'Federación de Fútbol de Chile',aliases:['Chile'],hemisphere:'south',climate:'temperate'},
{id:'URU',name:'Uruguai',continent:'South America',confederationId:'CONMEBOL',associationId:'AUF',associationName:'Asociación Uruguaya de Fútbol',aliases:['Uruguay'],hemisphere:'south',climate:'temperate'},
{id:'ECU',name:'Equador',continent:'South America',confederationId:'CONMEBOL',associationId:'FEF',associationName:'Federación Ecuatoriana de Fútbol',aliases:['Ecuador'],hemisphere:'equatorial',climate:'highland'},
{id:'VEN',name:'Venezuela',continent:'South America',confederationId:'CONMEBOL',associationId:'FVF',associationName:'Federación Venezolana de Fútbol',aliases:['Venezuela'],hemisphere:'north',climate:'tropical'},
{id:'ENG',name:'Inglaterra',continent:'Europe',confederationId:'UEFA',associationId:'FA',associationName:'The Football Association',aliases:['England'],hemisphere:'north',climate:'temperate'},
{id:'GER',name:'Alemanha',continent:'Europe',confederationId:'UEFA',associationId:'DFB',associationName:'Deutscher Fußball-Bund',aliases:['Germany','Deutschland'],hemisphere:'north',climate:'temperate'},
{id:'ESP',name:'Espanha',continent:'Europe',confederationId:'UEFA',associationId:'RFEF',associationName:'Real Federación Española de Fútbol',aliases:['Spain','España'],hemisphere:'north',climate:'temperate'},
{id:'ITA',name:'Itália',continent:'Europe',confederationId:'UEFA',associationId:'FIGC',associationName:'Federazione Italiana Giuoco Calcio',aliases:['Italy','Italia'],hemisphere:'north',climate:'temperate'},
{id:'FRA',name:'França',continent:'Europe',confederationId:'UEFA',associationId:'FFF',associationName:'Fédération Française de Football',aliases:['France'],hemisphere:'north',climate:'temperate'},
{id:'POR',name:'Portugal',continent:'Europe',confederationId:'UEFA',associationId:'FPF-POR',associationName:'Federação Portuguesa de Futebol',aliases:['Portugal'],hemisphere:'north',climate:'temperate'},
{id:'NED',name:'Países Baixos',continent:'Europe',confederationId:'UEFA',associationId:'KNVB',associationName:'Koninklijke Nederlandse Voetbalbond',aliases:['Netherlands','Holland'],hemisphere:'north',climate:'temperate'},
{id:'BEL',name:'Bélgica',continent:'Europe',confederationId:'UEFA',associationId:'RBFA',associationName:'Royal Belgian Football Association',aliases:['Belgium'],hemisphere:'north',climate:'temperate'},
{id:'SCO',name:'Escócia',continent:'Europe',confederationId:'UEFA',associationId:'SFA',associationName:'Scottish Football Association',aliases:['Scotland'],hemisphere:'north',climate:'temperate'},
{id:'TUR',name:'Turquia',continent:'Europe',confederationId:'UEFA',associationId:'TFF',associationName:'Türkiye Futbol Federasyonu',aliases:['Turkey','Türkiye'],hemisphere:'north',climate:'temperate'}
];

export function seedFootballGovernanceFoundation(world:World){
  for(const c of confeds)registerConfederation(world,c);
  for(const n of nations){
    registerCountryProfile(world,{id:n.id,name:n.name,continent:n.continent,associationId:n.associationId,hemisphere:n.hemisphere,defaultClimate:n.climate});
    registerAssociation(world,{id:n.associationId,name:n.associationName,countryId:n.id,confederationId:n.confederationId,aliases:[alias(n.associationId)],provenance:[foundation]});
    registerNationalTeam(world,{id:`nt-${n.id.toLowerCase()}-men-senior`,countryId:n.id,associationId:n.associationId,name:n.name,aliases:n.aliases.map(x=>alias(x)),teamKind:'senior',gender:'men',active:true,provenance:[foundation]});
  }
  return{confederations:confeds.length,associations:nations.length,nationalTeams:nations.length};
}
