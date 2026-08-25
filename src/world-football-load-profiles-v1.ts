export type FootballLoadProfileId='brazil'|'south-america'|'major'|'broad';
export type FootballLoadProfile={id:FootballLoadProfileId;name:string;description:string;countries:string[];includeHistory:boolean;historyFromYear:number};

export const FOOTBALL_LOAD_PROFILES:Record<FootballLoadProfileId,FootballLoadProfile>={
 brazil:{id:'brazil',name:'Brasil',description:'Brasil completo com estrutura nacional e histórico disponível.',countries:['BRA'],includeHistory:true,historyFromYear:2018},
 'south-america':{id:'south-america',name:'América do Sul',description:'Estrutura das dez associações CONMEBOL, com clubes detalhados onde a fonte está configurada.',countries:['BRA','ARG','COL','PAR','PER','BOL','CHI','URU','ECU','VEN'],includeHistory:true,historyFromYear:2018},
 major:{id:'major',name:'Principais mercados',description:'América do Sul + principais ligas europeias, mantendo ao menos primeira e segunda divisões quando disponíveis.',countries:['BRA','ARG','COL','PAR','PER','BOL','CHI','URU','ECU','VEN','ENG','GER','ESP','ITA','FRA','POR','NED','BEL','SCO','TUR'],includeHistory:true,historyFromYear:2018},
 broad:{id:'broad',name:'Mundo ampliado',description:'Cobertura estrutural ampla com países adicionais mapeados no catálogo público.',countries:['BRA','ARG','COL','PAR','PER','BOL','CHI','URU','ECU','VEN','ENG','GER','ESP','ITA','FRA','POR','NED','BEL','SCO','TUR','GRE','DEN','NOR','SWE','FIN','AUT','SUI','POL','CZE','CRO','SRB','UKR'],includeHistory:true,historyFromYear:2018}
};

export function footballLoadProfile(id:FootballLoadProfileId='major'){return FOOTBALL_LOAD_PROFILES[id]}
