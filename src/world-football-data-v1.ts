import type { World } from './engine';

export type ConfederationId='FIFA'|'UEFA'|'CONMEBOL'|'CONCACAF'|'AFC'|'CAF'|'OFC'|string;
export type CompetitionScope='domestic'|'continental'|'international';
export type CompetitionKind='league'|'cup'|'supercup'|'qualifier'|'tournament'|'stateLeague'|'playoff';
export type TeamKind='club'|'national';
export type CalendarPattern='calendar-year'|'cross-year';
export type TieBreaker='points'|'wins'|'goalDifference'|'goalsFor'|'headToHead'|'headToHeadGoalDifference'|'headToHeadGoalsFor'|'awayGoals'|'fairPlay'|'playoff';

export type DataProvenance={sourceId:string;sourceEntityId?:string;sourcePath?:string;license?:string;retrievedAt?:string;historical:boolean;confidence:number};
export type Alias={value:string;normalized:string;language?:string;validFrom?:string;validTo?:string;commercial?:boolean};
export type ConfederationRecord={id:ConfederationId;name:string;aliases:Alias[];memberAssociationIds:string[];provenance:DataProvenance[]};
export type AssociationRecord={id:string;name:string;countryId:string;confederationId:ConfederationId;foundedYear?:number;aliases:Alias[];provenance:DataProvenance[]};
export type NationalTeamRecord={id:string;countryId:string;associationId:string;name:string;aliases:Alias[];teamKind:'senior'|'u23'|'u21'|'u20'|'u19'|'u17';gender:'men'|'women';active:boolean;provenance:DataProvenance[]};
export type StadiumRecord={id:string;name:string;aliases:Alias[];countryId:string;cityName?:string;cityId?:string;capacity?:number;openedYear?:number;surface?:'grass'|'hybrid'|'artificial';ownerClubIds:string[];commercialName?:string;provenance:DataProvenance[]};
export type ClubRecord={id:string;name:string;aliases:Alias[];countryId:string;associationId?:string;cityName?:string;cityId?:string;foundedYear?:number;ceasedYear?:number;active:boolean;stadiumIds:string[];parentClubId?:string;reserveOfClubId?:string;historicalNames:Alias[];provenance:DataProvenance[]};
export type PromotionRule={toCompetitionId:string;automaticSlots:number;playoffSlots?:number;fromRank?:number;toRank?:number};
export type RelegationRule={toCompetitionId:string;automaticSlots:number;playoffSlots?:number;fromRank?:number;toRank?:number};
export type QualificationRule={toCompetitionId:string;slots:number;fromRank:number;toRank:number;stage?:string};
export type CompetitionRules={teams?:number;pointsWin:number;pointsDraw:number;legs?:1|2;rounds?:number;tiebreakers:TieBreaker[];promotion:PromotionRule[];relegation:RelegationRule[];qualification:QualificationRule[];calendarPattern:CalendarPattern;seasonStartMonth?:number;seasonEndMonth?:number;registrationForeignLimit?:number;registrationSquadLimit?:number;usesPlayoffs?:boolean};
export type CompetitionRecord={id:string;name:string;aliases:Alias[];scope:CompetitionScope;kind:CompetitionKind;countryId?:string;confederationId?:ConfederationId;associationId?:string;level?:number;parentCompetitionId?:string;active:boolean;validFrom?:string;validTo?:string;rules:CompetitionRules;provenance:DataProvenance[]};
export type MembershipRecord={season:string;competitionId:string;teamId:string;teamKind:TeamKind;status:'participant'|'champion'|'promoted'|'relegated'|'qualified'|'withdrawn';source:'historical'|'simulated';provenance:DataProvenance[]};
export type HistoricalMatchRecord={id:string;date:string;competitionId:string;season:string;homeTeamId:string;awayTeamId:string;homeGoals:number;awayGoals:number;venueId?:string;stage?:string;round?:string;source:'historical'|'simulated';provenance:DataProvenance[]};
export type TitleRecord={id:string;teamId:string;teamKind:TeamKind;competitionId:string;season:string;date?:string;source:'historical'|'simulated';provenance:DataProvenance[]};
export type WorldFootballDataSnapshot={version:number;cutoverDate:string;confederations:ConfederationRecord[];associations:AssociationRecord[];nationalTeams:NationalTeamRecord[];clubs:ClubRecord[];stadiums:StadiumRecord[];competitions:CompetitionRecord[];memberships:MembershipRecord[];matches:HistoricalMatchRecord[];titles:TitleRecord[]};

type Store={version:number;cutoverDate:string;confederations:Map<string,ConfederationRecord>;associations:Map<string,AssociationRecord>;nationalTeams:Map<string,NationalTeamRecord>;clubs:Map<string,ClubRecord>;stadiums:Map<string,StadiumRecord>;competitions:Map<string,CompetitionRecord>;memberships:MembershipRecord[];matches:HistoricalMatchRecord[];titles:TitleRecord[];aliases:Map<string,Set<string>>};
const stores=new WeakMap<World,Store>();
export const WORLD_FOOTBALL_DATA_VERSION=1;
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
function store(w:World){let s=stores.get(w);if(!s){s={version:WORLD_FOOTBALL_DATA_VERSION,cutoverDate:`${w.season}-07-01`,confederations:new Map(),associations:new Map(),nationalTeams:new Map(),clubs:new Map(),stadiums:new Map(),competitions:new Map(),memberships:[],matches:[],titles:[],aliases:new Map()};stores.set(w,s)}return s}
function indexAliases(w:World,id:string,name:string,aliases:Alias[]){const s=store(w);for(const v of [name,...aliases.map(a=>a.value)]){const k=norm(v);if(!k)continue;let ids=s.aliases.get(k);if(!ids){ids=new Set();s.aliases.set(k,ids)}ids.add(id)}}
export function alias(value:string,extra:Partial<Alias>={}):Alias{return{value,normalized:norm(value),...extra}}
export function setHistoricalCutover(w:World,date:string){store(w).cutoverDate=date}
export function historicalCutover(w:World){return store(w).cutoverDate}
export function registerConfederation(w:World,r:ConfederationRecord){store(w).confederations.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerAssociation(w:World,r:AssociationRecord){store(w).associations.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerNationalTeam(w:World,r:NationalTeamRecord){store(w).nationalTeams.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerClubRecord(w:World,r:ClubRecord){store(w).clubs.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerStadiumRecord(w:World,r:StadiumRecord){store(w).stadiums.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerCompetitionRecord(w:World,r:CompetitionRecord){store(w).competitions.set(r.id,clone(r));indexAliases(w,r.id,r.name,r.aliases);return r}
export function registerMembership(w:World,r:MembershipRecord){store(w).memberships.push(clone(r));return r}
export function registerHistoricalMatch(w:World,r:HistoricalMatchRecord){const s=store(w);if(!s.matches.some(x=>x.id===r.id))s.matches.push(clone(r));return r}
export function registerTitle(w:World,r:TitleRecord){const s=store(w);if(!s.titles.some(x=>x.id===r.id))s.titles.push(clone(r));return r}
export function resolveFootballEntity(w:World,text:string){const ids=[...(store(w).aliases.get(norm(text))??[])];return ids}
export function footballClub(w:World,id:string){return store(w).clubs.get(id)}
export function footballCompetition(w:World,id:string){return store(w).competitions.get(id)}
export function domesticPyramid(w:World,countryId:string){return[...store(w).competitions.values()].filter(c=>c.countryId===countryId&&c.kind==='league'&&c.level).sort((a,b)=>(a.level??99)-(b.level??99))}
export function footballDataSnapshot(w:World):WorldFootballDataSnapshot{const s=store(w);return{version:s.version,cutoverDate:s.cutoverDate,confederations:[...s.confederations.values()].map(clone),associations:[...s.associations.values()].map(clone),nationalTeams:[...s.nationalTeams.values()].map(clone),clubs:[...s.clubs.values()].map(clone),stadiums:[...s.stadiums.values()].map(clone),competitions:[...s.competitions.values()].map(clone),memberships:s.memberships.map(clone),matches:s.matches.map(clone),titles:s.titles.map(clone)}}
export function restoreFootballData(w:World,x:WorldFootballDataSnapshot){const s:Store={version:x.version,cutoverDate:x.cutoverDate,confederations:new Map(x.confederations.map(v=>[v.id,clone(v)])),associations:new Map(x.associations.map(v=>[v.id,clone(v)])),nationalTeams:new Map(x.nationalTeams.map(v=>[v.id,clone(v)])),clubs:new Map(x.clubs.map(v=>[v.id,clone(v)])),stadiums:new Map(x.stadiums.map(v=>[v.id,clone(v)])),competitions:new Map(x.competitions.map(v=>[v.id,clone(v)])),memberships:x.memberships.map(clone),matches:x.matches.map(clone),titles:x.titles.map(clone),aliases:new Map()};stores.set(w,s);for(const v of [...s.confederations.values(),...s.associations.values(),...s.nationalTeams.values(),...s.clubs.values(),...s.stadiums.values(),...s.competitions.values()])indexAliases(w,(v as any).id,(v as any).name,(v as any).aliases??[])}
export function validateFootballData(w:World){const s=store(w),issues:string[]=[];for(const c of s.competitions.values()){if(c.level&&c.scope!=='domestic')issues.push(`nível doméstico em competição não doméstica: ${c.id}`);for(const p of c.rules.promotion)if(!s.competitions.has(p.toCompetitionId))issues.push(`promoção aponta para competição ausente: ${c.id}->${p.toCompetitionId}`);for(const r of c.rules.relegation)if(!s.competitions.has(r.toCompetitionId))issues.push(`rebaixamento aponta para competição ausente: ${c.id}->${r.toCompetitionId}`)}for(const club of s.clubs.values())for(const st of club.stadiumIds)if(!s.stadiums.has(st))issues.push(`estádio ausente em ${club.id}: ${st}`);return{ok:issues.length===0,issues,counts:{confederations:s.confederations.size,associations:s.associations.size,nationalTeams:s.nationalTeams.size,clubs:s.clubs.size,stadiums:s.stadiums.size,competitions:s.competitions.size,memberships:s.memberships.length,matches:s.matches.length,titles:s.titles.length},cutoverDate:s.cutoverDate}}
