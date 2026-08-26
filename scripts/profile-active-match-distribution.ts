import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { createMatchCore } from '../src/match-core-v2';
import { simulateAdaptiveMatchCore } from '../src/match-adaptive-runtime-v1';
import { applyWorldWeatherToMatch } from '../src/match-weather-runtime-v1';

const world=createBrazilRealWorld2026();
const fixtures=world.fixtures.filter(f=>f.round===1).slice(0,4);
if(fixtures.length<4)throw new Error(`Expected four calibration fixtures, got ${fixtures.length}`);
const rows:Array<{goals:number;shots:number;xg:number;homeGoals:number;awayGoals:number;seed:number;pair:string}>=[];
for(let f=0;f<fixtures.length;f++){
  const fixture=fixtures[f],home=world.clubs.find(c=>c.id===fixture.home),away=world.clubs.find(c=>c.id===fixture.away);
  if(!home||!away)throw new Error('Calibration fixture club missing');
  for(let i=0;i<4;i++){
    const seed=(0x3f21a90d+f*104729+i*7919)>>>0;
    const state=createMatchCore(home,away,{seed});
    applyWorldWeatherToMatch(world,state,home,`2026-07-${String(25+f).padStart(2,'0')}`);
    simulateAdaptiveMatchCore(state,home,away);
    const goals=state.home.score+state.away.score,shots=state.home.shots+state.away.shots,xg=state.home.xg+state.away.xg;
    if(state.phase!=='finished'||![goals,shots,xg,state.home.score,state.away.score].every(Number.isFinite))throw new Error(`Invalid calibrated match state for ${home.name} vs ${away.name} seed ${seed}`);
    rows.push({goals,shots,xg,homeGoals:state.home.score,awayGoals:state.away.score,seed,pair:`${home.name} vs ${away.name}`});
  }
}
const mean=(key:'goals'|'shots'|'xg')=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
const draws=rows.filter(r=>r.homeGoals===r.awayGoals).length,homeWins=rows.filter(r=>r.homeGoals>r.awayGoals).length,high=rows.filter(r=>r.goals>=7).length,maxGoals=Math.max(...rows.map(r=>r.goals));
console.log(`[profile-active-match] matches=${rows.length} · goals=${mean('goals').toFixed(2)} · shots=${mean('shots').toFixed(2)} · xG=${mean('xg').toFixed(2)} · highScoring>=7=${high} · maxGoals=${maxGoals} · homeWins=${homeWins} · draws=${draws}`);
for(const row of rows)console.log(`[profile-active-match] ${row.pair} · seed=${row.seed} · ${row.homeGoals}-${row.awayGoals} · shots=${row.shots} · xG=${row.xg.toFixed(2)}`);
