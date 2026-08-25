import type { Player, World } from './engine';
import { playerSeasonStats } from './match-season-history-v2';

export type PlayerMatchState={playerId:string;condition:number;sharpness:number;fatigue:number;trainingLoad:number;form:number;lastMatchDate?:string;version:number};
export type MatchStateSnapshot={players:[string,PlayerMatchState][]};
type State={players:Map<string,PlayerMatchState>};const states=new WeakMap<World,State>();const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));
function state(w:World){let s=states.get(w);if(!s){s={players:new Map()};states.set(w,s)}return s}
export function ensurePlayerMatchState(w:World,p:Player){const s=state(w);let x=s.players.get(p.id);if(!x){x={playerId:p.id,condition:p.condition,sharpness:Math.round(clamp(58+(playerSeasonStats(w,p.id,w.season)?.minutes??0)/45)),fatigue:Math.max(0,100-p.condition),trainingLoad:45,form:50,version:1};s.players.set(p.id,x)}return x}
export function playerMatchState(w:World,id:string){for(const c of w.clubs){const p=c.players.find(x=>x.id===id);if(p)return ensurePlayerMatchState(w,p)}return state(w).players.get(id)}
export function applyTrainingLoad(w:World,p:Player,load:number){const x=ensurePlayerMatchState(w,p);x.trainingLoad=clamp(x.trainingLoad*.65+load*.35);x.fatigue=clamp(x.fatigue+Math.max(0,load-55)*.08-Math.max(0,45-load)*.04);x.condition=clamp(p.condition-x.fatigue*.08);return x}
export function recordMatchExposure(w:World,p:Player,minutes:number,rating=6.5,date?:string){const x=ensurePlayerMatchState(w,p),exposure=clamp(minutes/90,0,1.3);x.sharpness=clamp(x.sharpness+(100-x.sharpness)*(.08+exposure*.14));x.fatigue=clamp(x.fatigue+exposure*(10+x.trainingLoad*.05));x.condition=clamp(p.condition-x.fatigue*.12);x.form=clamp(x.form*.78+clamp((rating-5)*24,0,100)*.22);x.lastMatchDate=date;x.version++;return x}
export function recoverPlayerMatchState(w:World,p:Player,days=1){const x=ensurePlayerMatchState(w,p);for(let i=0;i<days;i++){x.fatigue=clamp(x.fatigue-(6+(100-x.trainingLoad)*.025));x.condition=clamp(x.condition+(100-x.condition)*.12);x.sharpness=clamp(x.sharpness-(x.sharpness>78?.35:x.sharpness<35?.05:.15));x.trainingLoad=clamp(x.trainingLoad*.93)}p.condition=Math.round(x.condition);return x}
export function injuryLayoffEffect(w:World,p:Player,daysOut:number){const x=ensurePlayerMatchState(w,p);x.sharpness=clamp(x.sharpness-Math.min(65,daysOut*.48));x.condition=clamp(x.condition-Math.min(32,daysOut*.18));x.fatigue=clamp(x.fatigue*.35);return x}
export function effectiveReadiness(w:World,p:Player){const x=ensurePlayerMatchState(w,p);return{condition:x.condition,sharpness:x.sharpness,fatigue:x.fatigue,form:x.form,overall:Number(clamp(x.condition*.34+x.sharpness*.28+(100-x.fatigue)*.23+x.form*.15).toFixed(1))}}
export function snapshotPlayerMatchStates(w:World):MatchStateSnapshot{return{players:[...state(w).players.entries()].map(([k,v])=>[k,{...v}])}}
export function restorePlayerMatchStates(w:World,x:MatchStateSnapshot){states.set(w,{players:new Map(x.players.map(([k,v])=>[k,{...v}]))})}
