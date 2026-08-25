import { createWorld } from './engine';
import { playCurrentRoundV2 } from './match-world-integration-v2';
import { matchArchive, persistCompletedMatchV2, playerCareerStats, snapshotMatchHistory } from './match-season-history-v2';
import { matchEventLedger } from './match-event-ledger-v2';
import { matchInjuries } from './match-contact-injury-v2';

export type WorldConsistencyCheck={name:string;ok:boolean;detail:string};
export type WorldConsistencyReport={ok:boolean;score:number;checks:WorldConsistencyCheck[];metrics:Record<string,number>};

export function worldConsistencyDiagnosticsV2():WorldConsistencyReport{
 const world=createWorld(),round=world.round,fixtures=world.fixtures.filter(f=>f.round===round),standingsBefore=JSON.parse(JSON.stringify(world.standings)),conditionsBefore=new Map(world.clubs.flatMap(c=>c.players.map(p=>[p.id,p.condition] as const))),states=playCurrentRoundV2(world,{competitionId:'consistency-league',date:'2026-08-24'}),archive=matchArchive(world),checks:WorldConsistencyCheck[]=[];const add=(name:string,ok:boolean,detail:string)=>checks.push({name,ok,detail});
 let fixtureScoreOk=true,xgOk=true,eventsOk=true,standingsOk=true,archiveOk=true,historyOk=true,conditionOk=true,injuryCarryoverOk=true,duplicateGuardOk=true,goalLedgerOk=true;
 for(let i=0;i<fixtures.length;i++){
  const f=fixtures[i],s=states[i];if(!s){fixtureScoreOk=false;continue}
  fixtureScoreOk&&=f.homeGoals===s.home.score&&f.awayGoals===s.away.score;
  xgOk&&=Math.abs((f.homeXg??0)-Number(s.home.xg.toFixed(2)))<.011&&Math.abs((f.awayXg??0)-Number(s.away.xg.toFixed(2)))<.011;
  eventsOk&&=Boolean(f.events?.some(e=>e.type==='fulltime'))&&Boolean(f.events?.some(e=>e.type==='kickoff'));
  const led=matchEventLedger(s),ledgerGoals=led.filter(e=>e.type==='goal'||e.type==='physicalGoal').length;goalLedgerOk&&=ledgerGoals===s.home.score+s.away.score;
  const a=archive.find(x=>x.homeClubId===f.home&&x.awayClubId===f.away&&x.round===f.round);archiveOk&&=Boolean(a&&a.homeGoals===f.homeGoals&&a.awayGoals===f.awayGoals&&Math.abs(a.homeXg-(f.homeXg??0))<.011&&Math.abs(a.awayXg-(f.awayXg??0))<.011);
  const livePlayers=[...s.home.players,...s.away.players].filter(p=>p.minutesPlayed>0);historyOk&&=livePlayers.some(lp=>(playerCareerStats(world,lp.playerId)?.appearances??0)>0);
  for(const lp of livePlayers){const p=world.clubs.flatMap(c=>c.players).find(x=>x.id===lp.playerId);if(p){const before=conditionsBefore.get(p.id)??100;if(lp.minutesPlayed>=30&&p.condition>=before)conditionOk=false}}
  const injuries=matchInjuries(s).filter(x=>x.severity!=='knock');if(injuries.length){injuryCarryoverOk&&=injuries.every(x=>{const p=world.clubs.flatMap(c=>c.players).find(y=>y.id===x.playerId);return Boolean(p&&p.condition<(conditionsBefore.get(p.id)??101))})}
 }
 for(const f of fixtures){const beforeH=standingsBefore[f.home],beforeA=standingsBefore[f.away],h=world.standings[f.home],a=world.standings[f.away],hg=f.homeGoals??0,ag=f.awayGoals??0;standingsOk&&=h.played===beforeH.played+1&&a.played===beforeA.played+1&&h.gf===beforeH.gf+hg&&h.ga===beforeH.ga+ag&&a.gf===beforeA.gf+ag&&a.ga===beforeA.ga+hg;const hp=hg>ag?3:hg===ag?1:0,ap=ag>hg?3:hg===ag?1:0;standingsOk&&=h.points===beforeH.points+hp&&a.points===beforeA.points+ap}
 const hist1=snapshotMatchHistory(world),processed1=hist1.processed.length,matches1=hist1.matches.length;for(let i=0;i<fixtures.length;i++){const f=fixtures[i],s=states[i],home=world.clubs.find(c=>c.id===f.home)!,away=world.clubs.find(c=>c.id===f.away)!;persistCompletedMatchV2(world,s,home,away,{fixtureId:`${world.season}:${f.round}:${f.home}:${f.away}`,competitionId:'consistency-league',date:'2026-08-24',round:f.round})}const hist2=snapshotMatchHistory(world);duplicateGuardOk=hist2.processed.length===processed1&&hist2.matches.length===matches1;
 add('placar fixture = V2',fixtureScoreOk,`${fixtures.length} partidas comparadas`);add('xG fixture = V2',xgOk,'xG persistido sem divergência > 0,01');add('eventos de ciclo preservados',eventsOk,'kickoff e fulltime em todas as fixtures');add('gols do ledger = placar',goalLedgerOk,'atribuição causal bate com o placar');add('classificação consistente',standingsOk,'J/GP/GC/pontos conferidos por fixture');add('arquivo histórico consistente',archiveOk,`${archive.length} partidas arquivadas`);add('carreira recebeu participantes',historyOk,'jogadores com minutos geraram aparições');add('carga física retornou ao mundo',conditionOk,'jogadores com >=30 min perderam condição');add('lesões V2 afetam condição',injuryCarryoverOk,'lesões não-knock reduziram condição quando existentes');add('persistência idempotente',duplicateGuardOk,'regravar a mesma fixture não duplica histórico');
 const score=Math.round(checks.filter(c=>c.ok).length/checks.length*100);return{ok:checks.every(c=>c.ok),score,checks,metrics:{fixtures:fixtures.length,archive:archive.length,states:states.length,processed:hist2.processed.length,checksPassed:checks.filter(c=>c.ok).length,checksTotal:checks.length}};
}
