import type { Club } from './engine';
import { createMatchCore } from './match-core-v2';
import { simulateMatchCore } from './match-stepper-v2';
import { officiatingLog } from './match-officiating-v2';
import { shotResolutionLog } from './match-goalkeeper-resolution-v2';

function digest(home:Club,away:Club,seed:number){const s=createMatchCore(home,away,{seed});simulateMatchCore(s,home,away);return JSON.stringify({score:[s.home.score,s.away.score],shots:[s.home.shots,s.away.shots],xg:[Number(s.home.xg.toFixed(4)),Number(s.away.xg.toFixed(4))],passes:[s.home.attemptedPasses,s.home.completedPasses,s.away.attemptedPasses,s.away.completedPasses],cards:[s.home.yellowCards,s.home.redCards,s.away.yellowCards,s.away.redCards],corners:[s.home.corners,s.away.corners],offsides:[s.home.offsides,s.away.offsides],seconds:Number(s.seconds.toFixed(2)),officials:officiatingLog(s),shotsLog:shotResolutionLog(s)})}
export function verifyMatchDeterminism(home:Club,away:Club,seed=20260824,runs=3){const values:string[]=[];for(let i=0;i<Math.max(2,runs);i++)values.push(digest(home,away,seed));const deterministic=values.every(v=>v===values[0]);return{deterministic,runs:values.length,seed,uniqueDigests:new Set(values).size,firstDigest:values[0]}}
export function verifySeedDiversity(home:Club,away:Club,seeds:number[]=[20260824,20260825,20260826,20260827]){const values=seeds.map(seed=>({seed,digest:digest(home,away,seed)}));return{diverse:new Set(values.map(x=>x.digest)).size>1,uniqueDigests:new Set(values.map(x=>x.digest)).size,total:values.length}}
