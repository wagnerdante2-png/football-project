import type { Club } from './engine';
import type { MatchCoreState, LivePlayer } from './match-core-v2';
import { opponentOf, teamOf } from './match-core-v2';
import { stepMatch } from './match-stepper-v2';
import { syncMatchLifecycle } from './match-lifecycle-v2';
import { adaptiveDefensiveTactics, observeOpponentPattern } from './match-tactical-learning-v2';
import type { KnockoutContext } from './match-time-competition-v2';

const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));
function nearestCarrier(state:MatchCoreState):LivePlayer|undefined{
  const active=[...state.home.players,...state.away.players].filter(p=>p.onPitch&&!p.sentOff);
  let best:LivePlayer|undefined,bestDistance=Infinity;
  for(const p of active){const d=Math.hypot(p.position.x-state.ball.position.x,p.position.y-state.ball.position.y);if(d<bestDistance){best=p;bestDistance=d}}
  return bestDistance<=3?best:undefined;
}
function observe(state:MatchCoreState){const carrier=(state.ball.ownerId&&[...state.home.players,...state.away.players].find(p=>p.playerId===state.ball.ownerId))||nearestCarrier(state);if(!carrier)return false;const defending=opponentOf(state,carrier.clubId);const channel=state.ball.position.y<state.pitch.width/3?'left':state.ball.position.y>state.pitch.width*2/3?'right':'centre';const targetGoalX=teamOf(state,carrier.clubId).attackingRight?state.pitch.length:0;const goalDistance=Math.abs(targetGoalX-state.ball.position.x);const intent=carrier.currentIntent;const action=intent==='cross'?'cross':intent==='carry'?'dribble':intent==='pass'?'progression':'progression';const danger=clamp(100-goalDistance*.85+(intent==='cross'?12:intent==='carry'?7:0));observeOpponentPattern(state,defending.clubId,{opponentId:carrier.clubId,channel,action,success:true,danger});return true}
function applyAdaptive(club:Club,state:MatchCoreState){const base={pressing:club.tactics.pressing,compactness:100-club.tactics.width,defensiveLine:club.tactics.defensiveLine};const a=adaptiveDefensiveTactics(state,club.id,base);club.tactics.pressing=Math.round(clamp(a.pressing));club.tactics.defensiveLine=Math.round(clamp(a.defensiveLine));club.tactics.width=Math.round(clamp(100-a.compactness));return a}
export function simulateAdaptiveMatchCore(state:MatchCoreState,home:Club,away:Club,maxTicks=24000,knockout:KnockoutContext={requiresWinner:false}){const original={home:{pressing:home.tactics.pressing,width:home.tactics.width,defensiveLine:home.tactics.defensiveLine},away:{pressing:away.tactics.pressing,width:away.tactics.width,defensiveLine:away.tactics.defensiveLine}};try{for(let i=0;i<maxTicks&&state.phase!=='finished';i++){stepMatch(state,home,away,knockout);if(i%20===0)observe(state);if(i%80===0){applyAdaptive(home,state);applyAdaptive(away,state)}}syncMatchLifecycle(state);return state}finally{Object.assign(home.tactics,original.home);Object.assign(away.tactics,original.away)}}
