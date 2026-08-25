import type { World } from './engine';
import { footballCompetition } from './world-football-data-v1';

export type ClubStageRegulation={legs:1|2;neutralVenue:boolean;awayGoals:boolean;extraTime:boolean;penalties:boolean;yellowResetBeforeStage?:boolean;registrationChangesAllowed?:number};
export type ClubCompetitionRegulation={competitionId:string;season:number;stages:Record<string,ClubStageRegulation>;defaultStage:ClubStageRegulation};
const one:ClubStageRegulation={legs:1,neutralVenue:false,awayGoals:false,extraTime:true,penalties:true,registrationChangesAllowed:5};
const two:ClubStageRegulation={legs:2,neutralVenue:false,awayGoals:false,extraTime:true,penalties:true,registrationChangesAllowed:5};
function copy<T>(x:T):T{return JSON.parse(JSON.stringify(x))}
export function clubCompetitionRegulation(w:World,competitionId:string,season=w.season):ClubCompetitionRegulation{const c=footballCompetition(w,competitionId),id=competitionId.toLowerCase();let stages:Record<string,ClubStageRegulation>={};let def={...one};
 if(id.includes('uefa-cl')||id.includes('uefa-el')||id.includes('uefa-conf'))stages={playoff:{...two},r16:{...two,yellowResetBeforeStage:true},qf:{...two},sf:{...two},final:{...one,neutralVenue:true,registrationChangesAllowed:0}};
 else if(id.includes('libertadores')||id.includes('sudamericana'))stages={playoff:{...two},r16:{...two,yellowResetBeforeStage:true},qf:{...two},sf:{...two},final:{...one,neutralVenue:true,registrationChangesAllowed:0}};
 else if(id.includes('copa-do-brasil')||id.includes('copa-brasil'))stages={roundOf32:{...one},roundOf16:{...two},quarterfinal:{...two},semifinal:{...two},final:{...two}};
 else if(id.includes('fa-cup'))stages={...Object.fromEntries(['roundOf64','roundOf32','roundOf16','quarterfinal','semifinal'].map(s=>[s,{...one}])),final:{...one,neutralVenue:true,registrationChangesAllowed:0}};
 else if(id.includes('efl')||id.includes('league-cup'))stages={semifinal:{...two},final:{...one,neutralVenue:true,registrationChangesAllowed:0}};
 else if(id.includes('dfb')||id.includes('copa-del-rey')||id.includes('coppa')||id.includes('coupe')||id.includes('taca')||id.includes('knvb'))stages={final:{...one,neutralVenue:true,registrationChangesAllowed:0}};
 if(c?.rules.legs)def={...def,legs:c.rules.legs};return{competitionId,season,stages:copy(stages),defaultStage:copy(def)}}
export function stageRegulation(w:World,competitionId:string,stage:string,season=w.season){const r=clubCompetitionRegulation(w,competitionId,season);return copy(r.stages[stage]??r.defaultStage)}
