import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { createMatchCore } from '../src/match-core-v2';
import { simulateAdaptiveMatchCore } from '../src/match-adaptive-runtime-v1';
import { applyWorldWeatherToMatch } from '../src/match-weather-runtime-v1';
import { matchEventLedger } from '../src/match-event-ledger-v2';
import { shotResolutionLog } from '../src/match-goalkeeper-resolution-v2';

const world=createBrazilRealWorld2026();
const fixtures=world.fixtures.filter(f=>f.round===1).slice(0,4);
if(fixtures.length<4)throw new Error(`Expected four calibration fixtures, got ${fixtures.length}`);
type Row={goals:number;shots:number;xg:number;homeGoals:number;awayGoals:number;seed:number;pair:string;logicalGoals:number;physicalGoals:number;ownGoals:number;ledgerShots:number;onTarget:number;keeperErrors:number;avgKeeperPositionError:number;goalKeeperPositionError:number};
const rows:Row[]=[];
for(let f=0;f<fixtures.length;f++){
  const fixture=fixtures[f],home=world.clubs.find(c=>c.id===fixture.home),away=world.clubs.find(c=>c.id===fixture.away);
  if(!home||!away)throw new Error('Calibration fixture club missing');
  for(let i=0;i<4;i++){
    const seed=(0x3f21a90d+f*104729+i*7919)>>>0;
    const state=createMatchCore(home,away,{seed});
    applyWorldWeatherToMatch(world,state,home,`2026-07-${String(25+f).padStart(2,'0')}`);
    simulateAdaptiveMatchCore(state,home,away);
    const goals=state.home.score+state.away.score,shots=state.home.shots+state.away.shots,xg=state.home.xg+state.away.xg,ledger=matchEventLedger(state),resolutions=shotResolutionLog(state),logicalGoals=ledger.filter(e=>e.type==='goal').length,physicalGoals=ledger.filter(e=>e.type==='physicalGoal').length,ownGoals=ledger.filter(e=>e.type==='ownGoal').length,ledgerShots=ledger.filter(e=>e.type==='shot').length,onTarget=resolutions.filter(r=>r.onTarget).length,keeperErrors=resolutions.filter(r=>r.keeperError).length,withKeeper=resolutions.filter(r=>r.goalkeeperId),goalWithKeeper=withKeeper.filter(r=>r.goal),avgKeeperPositionError=withKeeper.length?withKeeper.reduce((n,r)=>n+r.keeperPositionError,0)/withKeeper.length:0,goalKeeperPositionError=goalWithKeeper.length?goalWithKeeper.reduce((n,r)=>n+r.keeperPositionError,0)/goalWithKeeper.length:0;
    if(state.phase!=='finished'||![goals,shots,xg,state.home.score,state.away.score].every(Number.isFinite))throw new Error(`Invalid calibrated match state for ${home.name} vs ${away.name} seed ${seed}`);
    if(goals!==logicalGoals+physicalGoals)throw new Error(`Score/ledger mismatch for ${home.name} vs ${away.name} seed ${seed}: score=${goals}, logical=${logicalGoals}, physical=${physicalGoals}`);
    if(logicalGoals>ledgerShots)throw new Error(`Logical goals exceed shot events for ${home.name} vs ${away.name} seed ${seed}: goals=${logicalGoals}, shots=${ledgerShots}`);
    if(physicalGoals!==ownGoals)throw new Error(`Physical goals must match own goals for ${home.name} vs ${away.name} seed ${seed}: physical=${physicalGoals}, own=${ownGoals}`);
    rows.push({goals,shots,xg,homeGoals:state.home.score,awayGoals:state.away.score,seed,pair:`${home.name} vs ${away.name}`,logicalGoals,physicalGoals,ownGoals,ledgerShots,onTarget,keeperErrors,avgKeeperPositionError,goalKeeperPositionError});
  }
}
const mean=(key:'goals'|'shots'|'xg')=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
const draws=rows.filter(r=>r.homeGoals===r.awayGoals).length,homeWins=rows.filter(r=>r.homeGoals>r.awayGoals).length,high=rows.filter(r=>r.goals>=7).length,maxGoals=Math.max(...rows.map(r=>r.goals)),logical=rows.reduce((n,r)=>n+r.logicalGoals,0),physical=rows.reduce((n,r)=>n+r.physicalGoals,0),own=rows.reduce((n,r)=>n+r.ownGoals,0),ledgerShots=rows.reduce((n,r)=>n+r.ledgerShots,0),onTarget=rows.reduce((n,r)=>n+r.onTarget,0),keeperErrors=rows.reduce((n,r)=>n+r.keeperErrors,0),weightedKeeperError=rows.reduce((n,r)=>n+r.avgKeeperPositionError*r.ledgerShots,0)/Math.max(1,ledgerShots),weightedGoalKeeperError=rows.reduce((n,r)=>n+r.goalKeeperPositionError*r.logicalGoals,0)/Math.max(1,logical);
console.log(`[profile-active-match] matches=${rows.length} · goals=${mean('goals').toFixed(2)} · shots=${mean('shots').toFixed(2)} · xG=${mean('xg').toFixed(2)} · highScoring>=7=${high} · maxGoals=${maxGoals} · logicalGoals=${logical} · physicalGoals=${physical} · ownGoals=${own} · ledgerShots=${ledgerShots} · onTarget=${onTarget} · logicalConversion=${(logical/Math.max(1,ledgerShots)*100).toFixed(1)}% · onTargetGoalRate=${(logical/Math.max(1,onTarget)*100).toFixed(1)}% · keeperErrors=${keeperErrors} · avgGKPosErr=${weightedKeeperError.toFixed(2)} · goalGKPosErr=${weightedGoalKeeperError.toFixed(2)} · homeWins=${homeWins} · draws=${draws}`);
for(const row of rows)console.log(`[profile-active-match] ${row.pair} · seed=${row.seed} · ${row.homeGoals}-${row.awayGoals} · shots=${row.shots} · xG=${row.xg.toFixed(2)} · logical=${row.logicalGoals} · physical=${row.physicalGoals} · onTarget=${row.onTarget} · gkErr=${row.keeperErrors} · gkPos=${row.avgKeeperPositionError.toFixed(2)} · goalGKPos=${row.goalKeeperPositionError.toFixed(2)}`);
