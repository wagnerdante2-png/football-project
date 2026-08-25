import type { OpenFootballSource } from './openfootball-importer-v1';

export type CountrySourceBundle={
  countryId:string;
  countryName:string;
  confederationId:string;
  leagueSources:OpenFootballSource[];
  clubSources:OpenFootballSource[];
  stadiumSources:OpenFootballSource[];
};

const src=(id:string,repo:string,path:string,kind:OpenFootballSource['kind'],countryId?:string,confederationId?:string,sectionCountryMap?:Record<string,string>):OpenFootballSource=>({id,repo,path,kind,countryId,confederationId,sectionCountryMap,license:'CC0-1.0',historical:true});

const southAmericaSections:Record<string,string>={
  Paraguay:'PAR',Peru:'PER',Bolivia:'BOL',Chile:'CHI',Colombia:'COL',Uruguay:'URU',Ecuador:'ECU',Venezuela:'VEN'
};

const europeSections:Record<string,string>={
  Scotland:'SCO',Wales:'WAL','Northern Ireland':'NIR',Ireland:'IRL',Iceland:'ISL','Faroe Islands':'FRO',
  Spain:'ESP',Portugal:'POR',Gibraltar:'GIB',Andorra:'AND',France:'FRA',Italy:'ITA','San Marino':'SMR',Turkey:'TUR',Greece:'GRE',Cyprus:'CYP',Malta:'MLT',
  Denmark:'DEN',Norway:'NOR',Sweden:'SWE',Finland:'FIN',Netherlands:'NED',Belgium:'BEL',Switzerland:'SUI',Austria:'AUT',Germany:'GER',
  Poland:'POL','Czech Republic':'CZE',Slovakia:'SVK',Hungary:'HUN',Romania:'ROU',Bulgaria:'BUL',Croatia:'CRO',Serbia:'SRB',Slovenia:'SVN',
  Ukraine:'UKR',Russia:'RUS',Georgia:'GEO',Armenia:'ARM',Azerbaijan:'AZE',Belarus:'BLR',Estonia:'EST',Latvia:'LVA',Lithuania:'LTU',
  Albania:'ALB','Bosnia-Herzegovina':'BIH','Bosnia & Herzegovina':'BIH',Montenegro:'MNE','North Macedonia':'MKD',Kosovo:'KOS',Moldova:'MDA',Luxembourg:'LUX',Liechtenstein:'LIE'
};

const europeLeague=src('of-europe-leagues','openfootball/leagues','europe/leagues.txt','leagues',undefined,'UEFA',europeSections);
const southAmericaLeague=src('of-conmebol-leagues','openfootball/leagues','south-america/leagues.txt','leagues',undefined,'CONMEBOL',southAmericaSections);

const bundle=(countryId:string,countryName:string,confederationId:string,clubPath?:string,stadiumPath?:string,specificLeaguePath?:string):CountrySourceBundle=>({
  countryId,countryName,confederationId,
  leagueSources:specificLeaguePath?[src(`of-${countryId.toLowerCase()}-leagues`,'openfootball/leagues',specificLeaguePath,'leagues',countryId,confederationId)]:[],
  clubSources:clubPath?[src(`of-${countryId.toLowerCase()}-clubs`,'openfootball/clubs',clubPath,'clubs',countryId,confederationId)]:[],
  stadiumSources:stadiumPath?[src(`of-${countryId.toLowerCase()}-stadiums`,'openfootball/clubs',stadiumPath,'stadiums',countryId,confederationId)]:[]
});

export const FOOTBALL_SOURCE_CATALOG:CountrySourceBundle[]=[
  bundle('BRA','Brasil','CONMEBOL','south-america/brazil/br.clubs.txt','south-america/brazil/br.stadiums.txt','south-america/brazil/br.leagues.txt'),
  bundle('ARG','Argentina','CONMEBOL','south-america/argentina/ar.clubs.txt','south-america/argentina/ar.stadiums.txt'),
  bundle('COL','Colômbia','CONMEBOL','south-america/colombia/co.clubs.txt','south-america/colombia/co.stadiums.txt'),

  bundle('ENG','Inglaterra','UEFA','europe/england/eng.clubs.txt','europe/england/eng.stadiums.txt','europe/england/eng.leagues.txt'),
  bundle('GER','Alemanha','UEFA','europe/germany/de.clubs.txt','europe/germany/de.stadiums.txt','europe/germany/de.leagues.txt'),
  bundle('ESP','Espanha','UEFA','europe/spain/es.clubs.txt','europe/spain/es.stadiums.txt'),
  bundle('ITA','Itália','UEFA','europe/italy/it.clubs.txt','europe/italy/it.stadiums.txt'),
  bundle('FRA','França','UEFA','europe/france/fr.clubs.txt','europe/france/fr.stadiums.txt'),
  bundle('POR','Portugal','UEFA','europe/portugal/pt.clubs.txt','europe/portugal/pt.stadiums.txt'),
  bundle('NED','Países Baixos','UEFA','europe/netherlands/nl.clubs.txt','europe/netherlands/nl.stadiums.txt'),
  bundle('BEL','Bélgica','UEFA','europe/belgium/be.clubs.txt'),

  bundle('SCO','Escócia','UEFA'),bundle('TUR','Turquia','UEFA'),bundle('GRE','Grécia','UEFA'),bundle('DEN','Dinamarca','UEFA'),bundle('NOR','Noruega','UEFA'),bundle('SWE','Suécia','UEFA'),bundle('FIN','Finlândia','UEFA'),bundle('AUT','Áustria','UEFA'),bundle('SUI','Suíça','UEFA'),bundle('POL','Polônia','UEFA'),bundle('CZE','Tchéquia','UEFA'),bundle('CRO','Croácia','UEFA'),bundle('SRB','Sérvia','UEFA'),bundle('UKR','Ucrânia','UEFA'),
  bundle('PAR','Paraguai','CONMEBOL'),bundle('PER','Peru','CONMEBOL'),bundle('BOL','Bolívia','CONMEBOL'),bundle('CHI','Chile','CONMEBOL'),bundle('URU','Uruguai','CONMEBOL'),bundle('ECU','Equador','CONMEBOL'),bundle('VEN','Venezuela','CONMEBOL')
];

export const GLOBAL_FOOTBALL_SOURCES={
  nationalAndInternational:src('of-global-leagues','openfootball/leagues','leagues.txt','leagues'),
  southAmericaMapped:southAmericaLeague,
  europeMapped:europeLeague
};

export function sourceBundle(countryId:string){return FOOTBALL_SOURCE_CATALOG.find(x=>x.countryId===countryId)}
export function catalogCountries(){return FOOTBALL_SOURCE_CATALOG.map(x=>x.countryId)}
export function allCatalogSources(){
  const raw=[GLOBAL_FOOTBALL_SOURCES.nationalAndInternational,GLOBAL_FOOTBALL_SOURCES.southAmericaMapped,GLOBAL_FOOTBALL_SOURCES.europeMapped,...FOOTBALL_SOURCE_CATALOG.flatMap(x=>[...x.leagueSources,...x.clubSources,...x.stadiumSources])];
  return [...new Map(raw.map(s=>[`${s.repo}:${s.path}`,s])).values()];
}
