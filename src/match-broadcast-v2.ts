import type { Club } from './engine';
import type { MatchCoreState, Vec2 } from './match-core-v2';
import { matchActionMap } from './match-action-map-v2';
import { matchEventLedger } from './match-event-ledger-v2';
import { lifecycleEvents } from './match-lifecycle-v2';

export type BroadcastActionType='kickoff'|'receive'|'pass'|'progressivePass'|'throughBall'|'switchPlay'|'longBall'|'cross'|'carry'|'dribble'|'press'|'tackle'|'intercept'|'foul'|'shot'|'save'|'goal'|'frameHit'|'turnover'|'assist'|'restart'|'fulltime';
export type BroadcastAction={second:number;type:BroadcastActionType;clubId?:string;playerId?:string;targetPlayerId?:string;from?:Vec2;to?:Vec2;position?:Vec2;success?:boolean;value?:number;detail?:string};
export type MatchBroadcastTape={version:2;pitch:{length:number;width:number};homeClubId:string;awayClubId:string;actions:BroadcastAction[]};

const finitePoint=(v:unknown):Vec2|undefined=>{const p=v as Partial<Vec2>|undefined;return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:Number(p.x),y:Number(p.y)}:undefined};
const liveClub=(s:MatchCoreState,id?:string)=>id?[...s.home.players,...s.away.players].find(p=>p.playerId===id)?.clubId:undefined;
const normalizeChoice=(choice:string):BroadcastActionType|undefined=>({shortPass:'pass',progressivePass:'progressivePass',throughBall:'throughBall',switchPlay:'switchPlay',longBall:'longBall',cross:'cross',carry:'carry',dribble:'dribble',press:'press',tackle:'tackle',intercept:'intercept',shoot:'shot'} as Record<string,BroadcastActionType>)[choice];

/** Compact transmission tape derived only from data actually produced by Match Engine V2.
 * It intentionally skips decision rows that have no spatial evidence instead of inventing coordinates.
 */
export function buildMatchBroadcastTape(state:MatchCoreState,home:Club,away:Club):MatchBroadcastTape{
  const actions:BroadcastAction[]=[];
  for(const event of lifecycleEvents(state)){
    const type:BroadcastActionType=event.type==='kickoff'?'kickoff':event.type==='fulltimeWhistle'?'fulltime':'restart';
    actions.push({second:event.second,type,clubId:event.clubId,position:event.type==='kickoff'||event.type==='secondHalfKickoff'||event.type==='extraTimeKickoff'||event.type==='extraTimeSecondKickoff'?{x:state.pitch.length/2,y:state.pitch.width/2}:undefined,detail:event.text});
  }
  const raw=state as any;
  const decisions=Array.isArray(raw.__decisionTrace)?raw.__decisionTrace as any[]:[];
  for(const row of decisions){
    const type=normalizeChoice(String(row.chosen??row.choice??''));if(!type)continue;
    const from=finitePoint(row.position??row.from??row.ballPosition??row.startPosition),to=finitePoint(row.targetPosition??row.to??row.destination);
    if(!from&&!to)continue;
    const playerId=typeof row.playerId==='string'?row.playerId:undefined,targetPlayerId=typeof row.targetPlayerId==='string'?row.targetPlayerId:typeof row.targetId==='string'?row.targetId:undefined;
    actions.push({second:Number(row.second??0),type,playerId,targetPlayerId,clubId:liveClub(state,playerId),from,to,position:to??from,success:row.success===undefined?undefined:Boolean(row.success),detail:typeof row.reason==='string'?row.reason:typeof row.detail==='string'?row.detail:undefined});
  }
  const map=matchActionMap(state);
  for(const p of map){
    const type:BroadcastActionType=p.type==='reception'?'receive':p.type==='foul'?'foul':p.type==='frameHit'?'frameHit':p.type==='goal'?'goal':p.type==='shot'?'shot':'receive';
    actions.push({second:p.second,type,playerId:p.playerId,clubId:p.clubId,position:{...p.position},to:{...p.position},success:p.success,value:p.value,detail:p.detail});
  }
  for(const e of matchEventLedger(state)){
    if(e.type==='keeperSave')actions.push({second:e.second,type:'save',clubId:e.clubId,playerId:e.playerId,targetPlayerId:e.secondaryPlayerId,position:finitePoint(e.meta?.position),success:true,value:e.postShotXg,detail:e.detail});
    if(e.type==='turnover')actions.push({second:e.second,type:'turnover',clubId:e.clubId,playerId:e.playerId,position:finitePoint(e.meta?.position),success:false,detail:e.detail});
    if(e.type==='assist')actions.push({second:e.second,type:'assist',clubId:e.clubId,playerId:e.playerId,targetPlayerId:e.secondaryPlayerId,position:finitePoint(e.meta?.position),success:true,value:e.xg});
  }
  actions.sort((a,b)=>a.second-b.second||order(a.type)-order(b.type));
  const deduped:BroadcastAction[]=[];
  for(const a of actions){const prev=deduped.at(-1);if(prev&&Math.abs(prev.second-a.second)<.01&&prev.type===a.type&&prev.playerId===a.playerId&&prev.detail===a.detail)continue;deduped.push(a)}
  return{version:2,pitch:{length:state.pitch.length,width:state.pitch.width},homeClubId:home.id,awayClubId:away.id,actions:deduped};
}
function order(t:BroadcastActionType){return t==='kickoff'||t==='restart'?0:t==='receive'?1:['pass','progressivePass','throughBall','switchPlay','longBall','cross','carry','dribble'].includes(t)?2:['press','tackle','intercept','foul','turnover'].includes(t)?3:t==='assist'?4:t==='shot'?5:t==='frameHit'||t==='save'?6:t==='goal'?7:t==='fulltime'?9:8}
