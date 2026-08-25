import type { World } from './engine';
import { worldEvents } from './world-core-v2';
import { footballDataSnapshot } from './world-football-data-v1';
import { clubGovernance } from './club-governance';
import { supporterCulture } from './club-supporter-culture-v1';
import { managerProfile } from './manager-interactions';
import { generateSportNewsIssue, sportNewsIssues, sportNewsIssue, snapshotSportNews, restoreSportNews, type SportNewsArticle, type SportNewsIssue, type SportNewsSnapshot } from './sport-news-weekly-v1';
import { archiveSportNewsIssue } from './sport-news-archive-v1';

const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));
const isSunday=(iso:string)=>new Date(`${iso}T12:00:00Z`).getUTCDay()===0;
const nameFor=(w:World,id:string)=>{const f=footballDataSnapshot(w);return f.clubs.find(x=>x.id===id)?.name??f.nationalTeams.find(x=>x.id===id)?.name??w.clubs.find(x=>x.id===id)?.name??id};
const list=(w:World,ids:string[])=>ids.filter(Boolean).map(id=>nameFor(w,id)).join(', ');
function article(input:Omit<SportNewsArticle,'id'> & {id:string}):SportNewsArticle{return input}
function coreArticles(w:World,from:string,to:string):SportNewsArticle[]{const events=worldEvents(w,{from,to}).filter(e=>!['DayTick','SportNewsWeeklyPublished'].includes(e.type)),out:SportNewsArticle[]=[];for(const e of events){const p=e.payload as Record<string,any>;
  if(e.type==='DomesticSeasonCompleted'){
    const champion=String(p.champion??''),promoted=(p.promoted??[]) as string[],relegated=(p.relegated??[]) as string[],competitionId=String(e.entityIds[0]??'');
    const body=[champion?`${nameFor(w,champion)} confirmou o título.`:'',promoted.length?`Subiram: ${list(w,promoted)}.`:'',relegated.length?`Rebaixados: ${list(w,relegated)}.`:''].filter(Boolean).join(' ');
    out.push(article({id:`sn-core-${e.id}`,page:2,category:'competition',headline:champion?`${nameFor(w,champion)} fecha a temporada como campeão`:'Temporada nacional chega ao desfecho',deck:'Título, acessos e rebaixamentos redesenham a próxima temporada.',body:body||'A competição foi encerrada e a pirâmide nacional já começa a mudar.',importance:92,sentiment:'mixed',clubIds:[champion,...promoted,...relegated].filter(Boolean),playerIds:[],managerIds:[],competitionIds:competitionId?[competitionId]:[],sourceEventIds:[e.id],effects:[...(champion?[{target:'supporters' as const,entityId:champion,pressure:-4,reputation:4,morale:6}]:[]),...relegated.map(id=>({target:'club' as const,entityId:id,pressure:7,reputation:-3,morale:-6}))]}));continue;
  }
  if(e.type==='InternationalChampionCrowned'){
    const champion=String(p.champion??e.entityIds[0]??''),runner=String(p.runnerUp??''),competitionId=String(p.competitionId??'');
    out.push(article({id:`sn-core-${e.id}`,page:1,category:'international',headline:`${nameFor(w,champion)} conquista o grande título internacional`,deck:runner?`${nameFor(w,runner)} termina como vice.`:'A final entrou para a história do futebol mundial.',body:`A conquista passa a integrar o histórico permanente da competição${competitionId?` ${competitionId}`:''}.`,importance:100,sentiment:'positive',clubIds:[],playerIds:[],managerIds:[],competitionIds:competitionId?[competitionId]:[],sourceEventIds:[e.id],effects:[]}));continue;
  }
  if(e.type==='InternationalFinalsDraw'){
    out.push(article({id:`sn-core-${e.id}`,page:2,category:'international',headline:'Sorteio define o caminho do torneio internacional',deck:'Grupos e cruzamentos colocam as seleções diante dos primeiros grandes testes.',body:`O sorteio da competição ${String(p.tournamentId??'internacional')} foi realizado.`,importance:73,sentiment:'neutral',clubIds:[],playerIds:[],managerIds:[],competitionIds:[],sourceEventIds:[e.id],effects:[]}));continue;
  }
  if(/Qualifier|Qualification|International/i.test(e.type)){
    out.push(article({id:`sn-core-${e.id}`,page:2,category:'international',headline:'Seleções movimentam o cenário internacional',deck:'Classificação, eliminatórias e datas internacionais alteram o mapa da temporada.',body:`${e.type}: ${e.entityIds.length?list(w,e.entityIds.slice(0,6)):'o calendário internacional teve novos desdobramentos'}.`,importance:clamp(45+e.importance*6),sentiment:'neutral',clubIds:[],playerIds:[],managerIds:[],competitionIds:[],sourceEventIds:[e.id],effects:[]}));continue;
  }
  if(e.type==='ClubOwnershipChanged'||e.type==='ClubElection'){
    const clubId=e.entityIds[0];if(!clubId)continue;out.push(article({id:`sn-core-${e.id}`,page:3,category:'governance',headline:e.type==='ClubOwnershipChanged'?`${nameFor(w,clubId)} muda sua estrutura de controle`:`Eleição altera o cenário político do ${nameFor(w,clubId)}`,deck:'A decisão institucional pode repercutir em finanças, futebol e relação com a torcida.',body:e.type==='ClubOwnershipChanged'?'Mudança de propriedade abre uma nova fase administrativa.':'O novo ciclo diretivo terá influência sobre prioridades esportivas e financeiras.',importance:82,sentiment:'mixed',clubIds:[clubId],playerIds:[],managerIds:[],competitionIds:[],sourceEventIds:[e.id],effects:[{target:'club',entityId:clubId,pressure:3,reputation:1,morale:0}]}));continue;
  }
  if(e.type==='ClubSupporterBaseShift'){
    const clubId=e.entityIds[0];if(!clubId)continue;out.push(article({id:`sn-core-${e.id}`,page:3,category:'supporters',headline:`Torcida do ${nameFor(w,clubId)} muda de dimensão`,deck:'Resultados e reputação começam a alterar o alcance popular do clube.',body:`A base estimada passou de ${Number(p.previous??0).toLocaleString('pt-BR')} para ${Number(p.current??0).toLocaleString('pt-BR')} torcedores.`,importance:61,sentiment:Number(p.current??0)>=Number(p.previous??0)?'positive':'negative',clubIds:[clubId],playerIds:[],managerIds:[],competitionIds:[],sourceEventIds:[e.id],effects:[]}));continue;
  }
  if(e.type==='ClubRoundPostponedForInternationalDuty'){
    out.push(article({id:`sn-core-${e.id}`,page:2,category:'competition',headline:'Data FIFA força mudança no calendário de clubes',deck:'Convocações e disponibilidade de atletas provocaram remarcação.',body:`A rodada ${String(p.round??'')} foi transferida de ${String(p.oldDate??'')} para ${String(p.newDate??'')}.`,importance:58,sentiment:'neutral',clubIds:e.entityIds,playerIds:[],managerIds:[],competitionIds:[],sourceEventIds:[e.id],effects:[]}));
  }
}return out.sort((a,b)=>b.importance-a.importance)}
function applyExtraEffects(w:World,articles:SportNewsArticle[]){for(const a of articles)for(const e of a.effects){if(e.target==='club'){const g=clubGovernance(w,e.entityId);if(!g)continue;g.mediaPressure=clamp(g.mediaPressure+e.pressure);g.managerConfidence=clamp(g.managerConfidence+e.reputation);g.fanApproval=clamp(g.fanApproval+e.morale)}else if(e.target==='supporters'){const s=supporterCulture(w,e.entityId);s.patience=clamp(s.patience-e.pressure*.3);s.commercialEngagement=clamp(s.commercialEngagement+e.reputation*.25)}else{const m=managerProfile(w,e.entityId);if(!m)continue;m.stress=clamp(m.stress+e.pressure);m.reputation=clamp(m.reputation+e.reputation)}}}
function enrich(w:World,issue:SportNewsIssue){if((issue as any).__worldEnriched){archiveSportNewsIssue(w,issue);return issue}const extras=coreArticles(w,issue.weekStart,issue.weekEnd),p1=extras.filter(x=>x.page===1),p2=extras.filter(x=>x.page===2),p3=extras.filter(x=>x.page===3);issue.pages[0].articles=[...p1,...issue.pages[0].articles].sort((a,b)=>b.importance-a.importance).slice(0,7);issue.pages[1].articles=[...p2,...issue.pages[1].articles].sort((a,b)=>b.importance-a.importance).slice(0,10);issue.pages[2].articles=[...p3,...issue.pages[2].articles].sort((a,b)=>b.importance-a.importance).slice(0,10);const top=issue.pages.flatMap(p=>p.articles).sort((a,b)=>b.importance-a.importance)[0];if(top)issue.coverHeadline=top.headline;issue.featuredClubIds=[...new Set(issue.pages.flatMap(p=>p.articles.flatMap(a=>a.clubIds)))].slice(0,16);applyExtraEffects(w,extras);(issue as any).__worldEnriched=true;archiveSportNewsIssue(w,issue);return issue}
export function tickSportNewsWeeklyV2(w:World,date:string){if(!isSunday(date))return;const latest=sportNewsIssues(w,1)[0];if(latest?.date===date)return enrich(w,latest);return enrich(w,generateSportNewsIssue(w,date))}
export function latestSportNews(w:World){const x=sportNewsIssues(w,1)[0];return x?enrich(w,x):undefined}
export { sportNewsIssues, sportNewsIssue, snapshotSportNews, restoreSportNews };
export type { SportNewsIssue, SportNewsSnapshot };
