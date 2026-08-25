import type { World } from './engine';
import { alias, footballCompetition, registerCompetitionRecord, type CompetitionKind, type CompetitionRecord, type ConfederationId } from './world-football-data-v1';

const p={sourceId:'football-project-international-foundation',license:'internal',historical:false,confidence:100};
type Def={id:string;name:string;aliases?:string[];scope:'continental'|'international';kind:CompetitionKind;confederationId?:ConfederationId;validFrom?:string;rules?:Partial<CompetitionRecord['rules']>};
const defs:Def[]=[
{id:'comp-fifa-world-cup',name:'FIFA World Cup',aliases:['Copa do Mundo','World Cup'],scope:'international',kind:'tournament',validFrom:'1930'},
{id:'comp-conmebol-copa-america',name:'Copa América',aliases:['Copa America'],scope:'continental',kind:'tournament',confederationId:'CONMEBOL',validFrom:'1916'},
{id:'comp-uefa-euro',name:'UEFA European Championship',aliases:['Euro','European Championship'],scope:'continental',kind:'tournament',confederationId:'UEFA',validFrom:'1960'},
{id:'comp-uefa-cl',name:'UEFA Champions League',aliases:['Champions League','European Cup'],scope:'continental',kind:'cup',confederationId:'UEFA',validFrom:'1955'},
{id:'comp-uefa-el',name:'UEFA Europa League',aliases:['Europa League','UEFA Cup'],scope:'continental',kind:'cup',confederationId:'UEFA',validFrom:'1971'},
{id:'comp-uefa-conf',name:'UEFA Conference League',aliases:['Conference League','Europa Conference League'],scope:'continental',kind:'cup',confederationId:'UEFA',validFrom:'2021'},
{id:'comp-conmebol-libertadores',name:'Copa Libertadores',aliases:['Libertadores','Copa Libertadores da América'],scope:'continental',kind:'cup',confederationId:'CONMEBOL',validFrom:'1960'},
{id:'comp-conmebol-sudamericana',name:'Copa Sudamericana',aliases:['Sudamericana'],scope:'continental',kind:'cup',confederationId:'CONMEBOL',validFrom:'2002'},
{id:'comp-fifa-club-world-cup',name:'FIFA Club World Cup',aliases:['Mundial de Clubes'],scope:'international',kind:'tournament',validFrom:'2000'}
];
const baseRules=(d:Def):CompetitionRecord['rules']=>({pointsWin:3,pointsDraw:1,tiebreakers:['points','goalDifference','goalsFor'],promotion:[],relegation:[],qualification:[],calendarPattern:d.confederationId==='UEFA'?'cross-year':'calendar-year',usesPlayoffs:true,...d.rules});
export function seedInternationalCompetitions(world:World){let created=0;for(const d of defs){if(footballCompetition(world,d.id))continue;registerCompetitionRecord(world,{id:d.id,name:d.name,aliases:(d.aliases??[]).map(x=>alias(x)),scope:d.scope,kind:d.kind,confederationId:d.confederationId,active:true,validFrom:d.validFrom,rules:baseRules(d),provenance:[p]});created++}return{created,total:defs.length}}
export function internationalCompetitionDefinitions(){return defs.map(x=>({...x,aliases:[...(x.aliases??[])]}))}
