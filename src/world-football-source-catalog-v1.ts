import type { OpenFootballSource } from './openfootball-importer-v1';

export type CountrySourceBundle={countryId:string;countryName:string;confederationId:string;leagueSources:OpenFootballSource[];clubSources:OpenFootballSource[];stadiumSources:OpenFootballSource[]};
const src=(id:string,repo:string,path:string,kind:OpenFootballSource['kind'],countryId?:string,confederationId?:string,sectionCountryMap?:Record<string,string>):OpenFootballSource=>({id,repo,path,kind,countryId,confederationId,sectionCountryMap,license:'CC0-1.0',historical:true});
const southAmericaSections:Record<string,string>={Paraguay:'PAR',Peru:'PER',Bolivia:'BOL',Chile:'CHI',Colombia:'COL',Uruguay:'URU',Ecuador:'ECU',Venezuela:'VEN'};

export const FOOTBALL_SOURCE_CATALOG:CountrySourceBundle[]=[
 {countryId:'BRA',countryName:'Brasil',confederationId:'CONMEBOL',leagueSources:[src('of-bra-leagues','openfootball/leagues','south-america/brazil/br.leagues.txt','leagues','BRA','CONMEBOL')],clubSources:[src('of-bra-clubs','openfootball/clubs','south-america/brazil/br.clubs.txt','clubs','BRA','CONMEBOL')],stadiumSources:[src('of-bra-stadiums','openfootball/clubs','south-america/brazil/br.stadiums.txt','stadiums','BRA','CONMEBOL')]},
 {countryId:'ENG',countryName:'Inglaterra',confederationId:'UEFA',leagueSources:[src('of-eng-leagues','openfootball/leagues','europe/england/eng.leagues.txt','leagues','ENG','UEFA')],clubSources:[src('of-eng-clubs','openfootball/clubs','europe/england/eng.clubs.txt','clubs','ENG','UEFA')],stadiumSources:[src('of-eng-stadiums','openfootball/clubs','europe/england/eng.stadiums.txt','stadiums','ENG','UEFA')]},
 {countryId:'GER',countryName:'Alemanha',confederationId:'UEFA',leagueSources:[src('of-ger-leagues','openfootball/leagues','europe/germany/de.leagues.txt','leagues','GER','UEFA')],clubSources:[],stadiumSources:[]}
];

export const GLOBAL_FOOTBALL_SOURCES={
 nationalAndInternational:src('of-global-leagues','openfootball/leagues','leagues.txt','leagues'),
 southAmericaMapped:src('of-conmebol-leagues','openfootball/leagues','south-america/leagues.txt','leagues',undefined,'CONMEBOL',southAmericaSections)
};

export function sourceBundle(countryId:string){return FOOTBALL_SOURCE_CATALOG.find(x=>x.countryId===countryId)}
export function allCatalogSources(){return[GLOBAL_FOOTBALL_SOURCES.nationalAndInternational,GLOBAL_FOOTBALL_SOURCES.southAmericaMapped,...FOOTBALL_SOURCE_CATALOG.flatMap(x=>[...x.leagueSources,...x.clubSources,...x.stadiumSources])]}
