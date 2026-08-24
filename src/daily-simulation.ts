import type { Club, World } from './engine';
import { playCurrentRoundWithMedical } from './medical-simulation';
import { tickScoutingRound } from './scouting';
import { emitWorldEvent } from './event-bus';
import { institutionalState, tickPromises } from './institutional-memory';
import { tickTemporalProcesses } from './temporal-processes';
import { tickHumanLife } from './human-life';
import { tickSocialWorld } from './social-world';
import { tickDressingRoom } from './dressing-room';
import { executeTrainingDay } from './training-engine';
import { executeRestDay } from './training-rest';
import { wireTrainingMedical } from './training-medical';

export type TrainingFocus='recovery'|'physical'|'technical'|'tactical'|'attacking'|'defending';
export type TrainingIntensity='low'|'medium'|'high';
export type DailyClubPlan={clubId:string;focus:TrainingFocus;intensity:TrainingIntensity;restDay:boolean};
export type DailyCalendarState={date:string;seasonStart:string;matchDates:Map<number,string>;clubPlans:Map<string,DailyClubPlan>;daysAdvanced:number};
export type DailyCalendarSnapshot={date:string;seasonStart:string;matchDates:[number,string][];clubPlans:[string,DailyClubPlan][];daysAdvanced:number};

const states=new WeakMap<World,DailyCalendarState>();
const addDays=(iso:string,days:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const diffDays=(a:string,b:string)=>Math.round((new Date(`${a}T12:00:00Z`).getTime()-new Date(`${b}T12:00:00Z`).getTime())/86400000);
const weekday=(iso:string)=>new Date(`${iso}T12:00:00Z`).getUTCDay();
function defaultPlan(club:Club):DailyClubPlan{const intense=club.tactics.pressing>=72||club.tactics.tempo>=72;return{clubId:club.id,focus:intense?'recovery':'tactical',intensity:intense?'low':'medium',restDay:false};}
function buildMatchDates(world:World,start:string):Map<number,string>{const rounds=[...new Set(world.fixtures.map(f=>f.round))].sort((a,b)=>a-b);const map=new Map<number,string>();rounds.forEach((round,i)=>map.set(round,addDays(start,i*7)));return map;}
export function dailyCalendar(world:World):DailyCalendarState{let state=states.get(world);if(!state){const start=`${world.season}-07-25`;state={date:start,seasonStart:start,matchDates:buildMatchDates(world,start),clubPlans:new Map(),daysAdvanced:0};states.set(world,state);}for(const club of world.clubs)if(!state.clubPlans.has(club.id))state.clubPlans.set(club.id,defaultPlan(club));return state;}
export function setClubTrainingPlan(world:World,clubId:string,patch:Partial<Omit<DailyClubPlan,'clubId'>>):void{const state=dailyCalendar(world);const current=state.clubPlans.get(clubId)??{clubId,focus:'tactical',intensity:'medium',restDay:false};state.clubPlans.set(clubId,{...current,...patch,clubId});}
function trainingContext(world:World,date:string){const state=dailyCalendar(world);const dates=[...state.matchDates.values()].sort();const previous=[...dates].reverse().find(d=>d<date);const next=dates.find(d=>d>date);const seven=addDays(date,7);const matchesNext7=dates.filter(d=>d>date&&d<=seven).length;return{daysToNextMatch:next?diffDays(next,date):undefined,daysSinceLastMatch:previous?diffDays(date,previous):undefined,matchesNext7};}

export function advanceOneDay(world:World):{date:string;matchDay:boolean;playedRound?:number}{const state=dailyCalendar(world);const date=state.date;wireTrainingMedical(world);institutionalState(world);tickPromises(world,date);tickTemporalProcesses(world,date);tickHumanLife(world,date);tickSocialWorld(world,date);tickDressingRoom(world,date);const matchDate=state.matchDates.get(world.round);const matchDay=matchDate===date&&world.fixtures.some(f=>f.round===world.round&&!f.played);let playedRound:number|undefined;emitWorldEvent(world,{type:'DayAdvanced',date,importance:1,summary:`Calendário avançou para ${date}.`,payload:{}});if(matchDay){playedRound=world.round;emitWorldEvent(world,{type:'MatchDayStarted',date,importance:2,summary:`Início da rodada ${playedRound}.`,payload:{round:playedRound}});playCurrentRoundWithMedical(world);tickScoutingRound(world);tickTemporalProcesses(world,date);tickDressingRoom(world,date);for(const fixture of world.fixtures.filter(f=>f.round===playedRound&&f.played))emitWorldEvent(world,{type:'MatchCompleted',date,clubIds:[fixture.home,fixture.away],importance:2,summary:`${fixture.home} ${fixture.homeGoals}–${fixture.awayGoals} ${fixture.away}.`,payload:{round:playedRound,homeGoals:fixture.homeGoals,awayGoals:fixture.awayGoals,homeXg:fixture.homeXg,awayXg:fixture.awayXg}});}else{const ctx=trainingContext(world,date);const scheduledRest=(weekday(date)===0||weekday(date)===3)&&!(ctx.daysToNextMatch!==undefined&&ctx.daysToNextMatch<=1);if(scheduledRest)executeRestDay(world,date);else executeTrainingDay(world,date,ctx);}state.date=addDays(date,1);state.daysAdvanced++;return{date,matchDay,playedRound};}
export function advanceDays(world:World,days:number):void{for(let i=0;i<Math.max(0,Math.floor(days));i++)advanceOneDay(world);}
export function advanceUntilNextMatch(world:World,maxDays=14):void{for(let i=0;i<maxDays;i++){if(advanceOneDay(world).matchDay)return;}}
export function resetDailyCalendarForNewSeason(world:World):void{const state=dailyCalendar(world);const start=`${world.season}-07-25`;state.date=start;state.seasonStart=start;state.matchDates=buildMatchDates(world,start);state.daysAdvanced=0;emitWorldEvent(world,{type:'SeasonStarted',date:start,importance:4,summary:`Temporada ${world.season} começou.`,payload:{season:world.season}});}
export function snapshotDailyCalendar(world:World):DailyCalendarSnapshot{const s=dailyCalendar(world);return{date:s.date,seasonStart:s.seasonStart,matchDates:[...s.matchDates.entries()],clubPlans:[...s.clubPlans.entries()].map(([k,v])=>[k,{...v}]),daysAdvanced:s.daysAdvanced};}
export function restoreDailyCalendar(world:World,snapshot:DailyCalendarSnapshot):void{states.set(world,{date:snapshot.date,seasonStart:snapshot.seasonStart,matchDates:new Map(snapshot.matchDates),clubPlans:new Map(snapshot.clubPlans.map(([k,v])=>[k,{...v}])),daysAdvanced:snapshot.daysAdvanced});}
