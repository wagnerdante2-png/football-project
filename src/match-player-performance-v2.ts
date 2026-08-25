import type { Club } from './engine';
import type { MatchCoreState } from './match-core-v2';
import { teamOf } from './match-core-v2';
import { decisionTrace } from './match-decision-ai-v2';
import { shotResolutionLog } from './match-goalkeeper-resolution-v2';
import { receptionLog } from './match-first-touch-v2';
import { aerialDuelLog } from './match-aerial-duel-v2';
import { matchInjuries } from './match-contact-injury-v2';
import { officiatingLog } from './match-officiating-v2';

export type PlayerMatchPerformance={
 playerId:string;clubId:string;minutes:number;rating:number;
 shots:number;shotsOnTarget:number;goals:number;xg:number;postShotXg:number;
 passDecisions:number;progressiveIntentions:number;dribbleIntentions:number;pressIntentions:number;interceptIntentions:number;
 receptions:number;receptionSuccess:number;looseTouches:number;
 aerialDuels:number;aerialWins:number;aerialShots:number;
 foulsCommitted:number;foulsWon:number;yellowCards:number;redCards:number;
 saves:number;goalsConceded:number;keeperErrors:number;
 injuries:number;forcedOff:boolean;
 positives:string[];negatives:string[];explanation:string;
};
const clamp=(v:number,a=0,b=10)=>Math.max(a,Math.min(b,v));
function round(v:number,n=2){const p=10**n;return Math.round(v*p)/p}
function clubOf(state:MatchCoreState,id:string){const p=[...state.home.players,...state.away.players].find(x=>x.playerId===id);return p?.clubId}
function minutesOf(state:MatchCoreState,id:string){const p=[...state.home.players,...state.away.players].filter(x=>x.playerId===id).sort((a,b)=>b.minutesPlayed-a.minutesPlayed)[0];return p?.minutesPlayed??0}
function cardFor(state:MatchCoreState,id:string){const p=[...state.home.players,...state.away.players].find(x=>x.playerId===id);return{yellow:p?.yellowCards??0,red:p?.sentOff?1:0}}
function basePerformance(state:MatchCoreState,id:string,clubId:string):PlayerMatchPerformance{return{playerId:id,clubId,minutes:round(minutesOf(state,id),1),rating:6,shots:0,shotsOnTarget:0,goals:0,xg:0,postShotXg:0,passDecisions:0,progressiveIntentions:0,dribbleIntentions:0,pressIntentions:0,interceptIntentions:0,receptions:0,receptionSuccess:0,looseTouches:0,aerialDuels:0,aerialWins:0,aerialShots:0,foulsCommitted:0,foulsWon:0,yellowCards:0,redCards:0,saves:0,goalsConceded:0,keeperErrors:0,injuries:0,forcedOff:false,positives:[],negatives:[],explanation:''}}
function allParticipants(state:MatchCoreState,home:Club,away:Club){const ids=new Set<string>();for(const p of [...state.home.players,...state.away.players])ids.add(p.playerId);for(const p of [...home.players,...away.players])if(minutesOf(state,p.id)>0)ids.add(p.id);return[...ids]}
export function playerMatchPerformances(state:MatchCoreState,home:Club,away:Club):PlayerMatchPerformance[]{const out=new Map<string,PlayerMatchPerformance>();for(const id of allParticipants(state,home,away)){const clubId=clubOf(state,id)??(home.players.some(p=>p.id===id)?home.id:away.id);out.set(id,basePerformance(state,id,clubId))}
 const shots=shotResolutionLog(state);for(const s of shots){const p=out.get(s.shooterId);if(p){p.shots++;p.xg+=s.xg;p.postShotXg+=s.postShotXg;if(s.onTarget)p.shotsOnTarget++;if(s.goal)p.goals++}if(s.goalkeeperId){const g=out.get(s.goalkeeperId);if(g){if(s.onTarget&&!s.goal)g.saves++;if(s.goal)g.goalsConceded++;if(s.keeperError)g.keeperErrors++}}}
 for(const d of decisionTrace(state)){const p=out.get(d.playerId);if(!p)continue;if(['shortPass','progressivePass','throughBall','switchPlay','longBall','cross'].includes(d.chosen)){p.passDecisions++;if(['progressivePass','throughBall','switchPlay','longBall','cross'].includes(d.chosen))p.progressiveIntentions++}if(d.chosen==='dribble'||d.chosen==='carry')p.dribbleIntentions++;if(d.chosen==='press')p.pressIntentions++;if(d.chosen==='intercept')p.interceptIntentions++}
 for(const r of receptionLog(state)){const p=out.get(r.playerId);if(!p)continue;p.receptions++;if(r.success)p.receptionSuccess++;if(r.looseBall)p.looseTouches++}
 for(const a of aerialDuelLog(state)){const w=out.get(a.winnerId);if(w){w.aerialDuels++;w.aerialWins++;if(a.intent==='headToGoal')w.aerialShots++}if(a.loserId){const l=out.get(a.loserId);if(l)l.aerialDuels++}}
 const refs=officiatingLog(state);for(const e of refs){if(e.tacklerId){const p=out.get(e.tacklerId);if(p&&e.foul)p.foulsCommitted++}if(e.victimId){const p=out.get(e.victimId);if(p&&e.foul)p.foulsWon++}}
 for(const i of matchInjuries(state)){const p=out.get(i.playerId);if(p){p.injuries++;if(i.forcedOff)p.forcedOff=true}}
 for(const p of out.values()){const c=cardFor(state,p.playerId);p.yellowCards=c.yellow;p.redCards=c.red;let score=6;score+=p.goals*1.05;score+=(p.postShotXg-p.xg)*.55;score+=p.shotsOnTarget*.08;score-=Math.max(0,p.xg-p.goals)*.2;score+=p.aerialWins*.045;score-=Math.max(0,p.aerialDuels-p.aerialWins)*.02;score+=p.foulsWon*.025;score-=p.foulsCommitted*.045;score-=p.yellowCards*.18;score-=p.redCards*.85;score-=p.looseTouches*.04;score+=p.receptions?((p.receptionSuccess/p.receptions)-.72)*.8:0;score+=Math.min(.28,p.progressiveIntentions*.006);score+=Math.min(.22,p.pressIntentions*.003+p.interceptIntentions*.005);score+=p.saves*.13;score-=p.goalsConceded*.12;score-=p.keeperErrors*.75;if(p.forcedOff)score-=.12;if(p.minutes<20)score=6+(score-6)*.55;p.rating=round(clamp(score,3,10),1);
 if(p.goals)p.positives.push(`${p.goals} gol${p.goals>1?'s':''}`);if(p.saves>=4)p.positives.push(`${p.saves} defesas`);if(p.aerialWins>=4)p.positives.push(`${p.aerialWins} duelos aéreos ganhos`);if(p.progressiveIntentions>=8)p.positives.push('alta participação progressiva');if(p.receptions>=8&&p.receptionSuccess/p.receptions>.88)p.positives.push('controle de bola seguro');if(p.keeperErrors)p.negatives.push('erro de goleiro em finalização');if(p.redCards)p.negatives.push('expulsão');else if(p.yellowCards)p.negatives.push('advertência disciplinar');if(p.looseTouches>=3)p.negatives.push('vários primeiros toques imprecisos');if(p.shots>=3&&p.goals===0&&p.xg>.65)p.negatives.push('desperdiçou volume relevante de xG');if(p.aerialDuels>=4&&p.aerialWins/p.aerialDuels<.35)p.negatives.push('baixo rendimento aéreo');if(p.forcedOff)p.negatives.push('saiu por lesão');const good=p.positives.length?p.positives.join(', '):'contribuição sem destaque estatístico';const bad=p.negatives.length?`; pontos negativos: ${p.negatives.join(', ')}`:'';p.explanation=`Nota ${p.rating.toFixed(1)}: ${good}${bad}.`;p.xg=round(p.xg);p.postShotXg=round(p.postShotXg)}return[...out.values()].filter(p=>p.minutes>0).sort((a,b)=>b.rating-a.rating)}
export function playerOfTheMatch(state:MatchCoreState,home:Club,away:Club){return playerMatchPerformances(state,home,away)[0]}
export function clubPerformanceSummary(state:MatchCoreState,club:Club,opponent:Club){const rows=playerMatchPerformances(state,club.id===state.home.clubId?club:opponent,club.id===state.home.clubId?opponent:club).filter(p=>p.clubId===club.id);return{clubId:club.id,averageRating:rows.length?round(rows.reduce((a,b)=>a+b.rating,0)/rows.length,2):0,best:rows[0],worst:[...rows].sort((a,b)=>a.rating-b.rating)[0],players:rows}}
