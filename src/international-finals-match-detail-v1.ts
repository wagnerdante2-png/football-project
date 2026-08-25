import type { World } from './engine';
import type { FinalsFixture, FinalsState } from './international-finals-v1';
import { playFinalsFixture } from './international-finals-v1';
import { matchEventLedger } from './match-event-ledger-v2';

export type FinalsMatchDetail={fixtureId:string;stage:FinalsFixture['stage'];score:{home:number;away:number};wentToExtraTime:boolean;shootout?:{home:number;away:number;winnerTeamId:string;kicks:Array<{clubId:string;playerId:string;scored:boolean;round:number;suddenDeath:boolean}>};timeline:Array<{second:number;minute:number;type:string;clubId?:string;playerId?:string}>};
const details=new WeakMap<World,Map<string,FinalsMatchDetail>>();
function store(w:World){let x=details.get(w);if(!x){x=new Map();details.set(w,x)}return x}
export function playFinalsFixtureDetailed(w:World,t:FinalsState,f:FinalsFixture){if(f.played)return store(w).get(`${t.id}:${f.id}`);playFinalsFixture(w,t,f);const resultState=(f as any).__matchState;if(resultState)return capture(w,t,f,resultState);return undefined}
export function captureFinalsMatchDetail(w:World,t:FinalsState,f:FinalsFixture,state:any){return capture(w,t,f,state)}
function capture(w:World,t:FinalsState,f:FinalsFixture,state:any){const so=(state as any).__shootout,ledger=matchEventLedger(state),row:FinalsMatchDetail={fixtureId:f.id,stage:f.stage,score:{home:f.homeGoals??0,away:f.awayGoals??0},wentToExtraTime:!!f.extraTime,timeline:ledger.map((e:any)=>({second:e.second,minute:Math.floor(e.second/60),type:e.type,clubId:e.clubId,playerId:e.playerId}))};if(so)row.shootout={home:so.home,away:so.away,winnerTeamId:so.winnerClubId,kicks:so.kicks.map((k:any)=>({...k}))};store(w).set(`${t.id}:${f.id}`,row);return row}
export function finalsMatchDetail(w:World,tournamentId:string,fixtureId:string){return store(w).get(`${tournamentId}:${fixtureId}`)}
export function snapshotFinalsMatchDetails(w:World){return{matches:[...store(w)].map(([k,v])=>[k,JSON.parse(JSON.stringify(v))] as [string,FinalsMatchDetail])}}
export function restoreFinalsMatchDetails(w:World,x:{matches:[string,FinalsMatchDetail][]}){details.set(w,new Map((x?.matches??[]).map(([k,v])=>[k,JSON.parse(JSON.stringify(v))])))}
