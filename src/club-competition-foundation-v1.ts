import type { World } from './engine';
import { alias, footballCompetition, registerCompetitionRecord, type CompetitionRecord } from './world-football-data-v1';

const provenance={sourceId:'club-competition-foundation-v1',historical:false,confidence:100};
const defs:Array<{id:string;name:string;countryId?:string;confederationId?:string;scope:'domestic'|'continental';kind:'cup'|'supercup';aliases?:string[];calendarPattern:'calendar-year'|'cross-year'}>=[
 {id:'comp-bra-cup',name:'Copa do Brasil',countryId:'BRA',scope:'domestic',kind:'cup',aliases:['Brazil Cup'],calendarPattern:'calendar-year'},
 {id:'comp-eng-fa-cup',name:'FA Cup',countryId:'ENG',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-eng-league-cup',name:'EFL Cup',countryId:'ENG',scope:'domestic',kind:'cup',aliases:['League Cup','Carabao Cup'],calendarPattern:'cross-year'},
 {id:'comp-ger-dfb-pokal',name:'DFB-Pokal',countryId:'GER',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-esp-copa-del-rey',name:'Copa del Rey',countryId:'ESP',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-ita-coppa-italia',name:'Coppa Italia',countryId:'ITA',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-fra-coupe-de-france',name:'Coupe de France',countryId:'FRA',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-por-taca-portugal',name:'Taça de Portugal',countryId:'POR',scope:'domestic',kind:'cup',calendarPattern:'cross-year'},
 {id:'comp-ned-knvb-cup',name:'KNVB Cup',countryId:'NED',scope:'domestic',kind:'cup',aliases:['KNVB Beker'],calendarPattern:'cross-year'},
 {id:'comp-conmebol-libertadores',name:'Copa Libertadores',confederationId:'CONMEBOL',scope:'continental',kind:'cup',aliases:['Libertadores'],calendarPattern:'calendar-year'},
 {id:'comp-conmebol-sudamericana',name:'Copa Sudamericana',confederationId:'CONMEBOL',scope:'continental',kind:'cup',aliases:['Sudamericana'],calendarPattern:'calendar-year'},
 {id:'comp-uefa-cl',name:'UEFA Champions League',confederationId:'UEFA',scope:'continental',kind:'cup',aliases:['Champions League'],calendarPattern:'cross-year'},
 {id:'comp-uefa-el',name:'UEFA Europa League',confederationId:'UEFA',scope:'continental',kind:'cup',aliases:['Europa League'],calendarPattern:'cross-year'},
 {id:'comp-uefa-conf',name:'UEFA Conference League',confederationId:'UEFA',scope:'continental',kind:'cup',aliases:['Conference League'],calendarPattern:'cross-year'}
];
const rules=(calendarPattern:'calendar-year'|'cross-year'):CompetitionRecord['rules']=>({pointsWin:3,pointsDraw:1,legs:1,tiebreakers:['goalDifference','goalsFor'],promotion:[],relegation:[],qualification:[],calendarPattern,seasonStartMonth:calendarPattern==='calendar-year'?2:8,seasonEndMonth:calendarPattern==='calendar-year'?11:5,usesPlayoffs:true});
export function seedClubCompetitionFoundation(world:World){let created=0;for(const d of defs){if(footballCompetition(world,d.id))continue;registerCompetitionRecord(world,{id:d.id,name:d.name,aliases:(d.aliases??[]).map(x=>alias(x)),scope:d.scope,kind:d.kind,countryId:d.countryId,confederationId:d.confederationId,active:true,rules:rules(d.calendarPattern),provenance:[provenance]});created++}return{created,total:defs.length}}
export function clubCompetitionDefinitions(){return defs.map(x=>({...x,aliases:[...(x.aliases??[])]}))}
