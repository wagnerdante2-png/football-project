import type { Club } from './engine';
import { createMatchCore } from './match-core-v2';
import { simulateMatchCore } from './match-stepper-v2';
import { calibrateMatchEngineV2 } from './match-calibration-v2';
import { calibrateSensitivityV2 } from './match-sensitivity-calibration-v2';
import { verifyMatchDeterminism } from './match-determinism-v2';
import { validateMatchState } from './match-v2-diagnostics';
import { validateOfficiating } from './match-officiating-diagnostics-v2';
import { lifecyclePhysicsDiagnostics } from './match-lifecycle-physics-diagnostics-v2';
import { edgeCaseDiagnosticsV2 } from './match-edge-case-diagnostics-v2';
import { matchEventDiagnosticsV2 } from './match-event-diagnostics-v2';

export type RegressionCase={name:string;ok:boolean;score:number;issues:string[];metrics?:Record<string,number|string|boolean>};
export type RegressionSuite={ok:boolean;score:number;cases:RegressionCase[];failed:string[]};
function oneMatch(name:string,home:Club,away:Club,seed:number):RegressionCase{const s=createMatchCore(home,away,{seed});simulateMatchCore(s,home,away);const inv=validateMatchState(s),off=validateOfficiating(s),life=lifecyclePhysicsDiagnostics(s),evt=matchEventDiagnosticsV2(s,home,away),issues=[...inv,...off.issues,...life.issues,...evt.issues],ok=issues.length===0;return{name,ok,score:ok?100:Math.max(0,100-issues.length*12),issues,metrics:{homeGoals:s.home.score,awayGoals:s.away.score,homeXg:Number(s.home.xg.toFixed(2)),awayXg:Number(s.away.xg.toFixed(2)),seconds:Math.round(s.seconds)}}}
function mirrorClub(c:Club,id:string):Club{return{...c,id,name:`${c.name} ${id}`,players:c.players.map(p=>({...p,id:`${id}-${p.id}`,clubId:id,attributes:{...p.attributes}})),tactics:{...c.tactics}}}
export function runMatchRegressionSuiteV2(home:Club,away:Club,seed=20260824):RegressionSuite{const cases:RegressionCase[]=[];for(let i=0;i<8;i++)cases.push(oneMatch(`seed-${i+1}`,home,away,seed+i*104729));const det=verifyMatchDeterminism(home,away,seed+999,3);cases.push({name:'determinismo',ok:det.deterministic,score:det.deterministic?100:0,issues:det.deterministic?[]:['Mesma seed divergiu em execuções repetidas.']});const cal=calibrateMatchEngineV2(home,away,80,seed+2001);cases.push({name:'calibração agregada',ok:cal.score>=72,score:cal.score,issues:cal.score>=72?[]:[`Calibração ${cal.score}/72.`]});const sens=calibrateSensitivityV2(home,away,20,seed+3001);cases.push({name:'sensibilidade',ok:sens.score>=67,score:sens.score,issues:sens.checks.filter(x=>!x.ok).map(x=>`${x.name}: ${x.detail}`)});const edge=edgeCaseDiagnosticsV2(home,away,seed+4001);cases.push({name:'edge cases',ok:edge.ok,score:edge.ok?100:Math.max(0,100-edge.checks.filter(x=>!x.ok).length*15),issues:edge.checks.filter(x=>!x.ok).map(x=>`${x.name}: ${x.detail}`)});const sameA=mirrorClub(home,'mirror-a'),sameB=mirrorClub(home,'mirror-b');const symmetry=oneMatch('equipes espelhadas',sameA,sameB,seed+5001);cases.push(symmetry);const failed=cases.filter(c=>!c.ok).map(c=>c.name),score=Math.round(cases.reduce((a,b)=>a+b.score,0)/Math.max(1,cases.length));return{ok:failed.length===0,score,cases,failed}}
