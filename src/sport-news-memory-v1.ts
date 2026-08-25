import type { World } from './engine';
import { sportNewsArchive, type SportNewsArchiveEntry } from './sport-news-archive-v1';

export type SportNewsMemoryContext={date:string;season?:number;clubIds?:string[];playerIds?:string[];managerIds?:string[];competitionIds?:string[];category?:string;query?:string;limit?:number;minAgeDays?:number};
export type SportNewsMemoryHit={issueId:string;edition:number;date:string;season:number;coverHeadline:string;headline:string;score:number;reasons:string[];clubIds:string[];playerIds:string[];managerIds:string[];competitionIds:string[]};
export type SportNewsCallback={kind:'revenge'|'reunion'|'repeat-final'|'transfer-saga'|'manager-return'|'record-echo'|'historical-echo';title:string;summary:string;source:SportNewsMemoryHit};

const day=(iso:string)=>Math.floor(Date.parse(`${iso}T00:00:00Z`)/86400000);
const overlap=(a:string[]=[],b:string[]=[])=>a.filter(x=>b.includes(x));
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export function recallSportNews(w:World,c:SportNewsMemoryContext):SportNewsMemoryHit[]{
 const now=day(c.date),min=c.minAgeDays??28,q=norm(c.query??'').split(' ').filter(Boolean);const hits:SportNewsMemoryHit[]=[];
 for(const issue of sportNewsArchive(w,{to:c.date})){
  const age=now-day(issue.date);if(age<min)continue;
  for(const a of issue.articles){let score=0;const reasons:string[]=[];
   const clubs=overlap(a.clubIds,c.clubIds),players=overlap(a.playerIds,c.playerIds),managers=overlap(a.managerIds,c.managerIds),comps=overlap(a.competitionIds,c.competitionIds);
   if(players.length){score+=players.length*32;reasons.push('mesmo jogador')} if(managers.length){score+=managers.length*34;reasons.push('mesmo treinador')} if(clubs.length){score+=clubs.length*18;reasons.push('mesmo clube')} if(comps.length){score+=comps.length*10;reasons.push('mesma competição')}
   if(c.category&&a.category===c.category){score+=8;reasons.push('mesmo tema')} const text=norm(`${issue.coverHeadline} ${a.headline}`);const qm=q.filter(x=>text.includes(x));if(qm.length){score+=qm.length*5;reasons.push('termos relacionados')}
   score+=Math.min(18,Math.floor(age/365));score+=Math.min(12,Math.floor(a.importance/10));
   if(score>=24)hits.push({issueId:issue.id,edition:issue.edition,date:issue.date,season:issue.season,coverHeadline:issue.coverHeadline,headline:a.headline,score,reasons:[...new Set(reasons)],clubIds:a.clubIds,playerIds:a.playerIds,managerIds:a.managerIds,competitionIds:a.competitionIds});
  }
 }
 return hits.sort((a,b)=>b.score-a.score||b.date.localeCompare(a.date)).slice(0,c.limit??8);
}

function sharedPair(a:string[],b:string[]){return overlap(a,b).length>=2}
export function sportNewsCallbacks(w:World,c:SportNewsMemoryContext):SportNewsCallback[]{return recallSportNews(w,{...c,limit:Math.max(c.limit??6,12)}).map(h=>{
 const sameManager=overlap(h.managerIds,c.managerIds).length>0,samePlayer=overlap(h.playerIds,c.playerIds).length>0,twoClubs=sharedPair(h.clubIds,c.clubIds??[]);const t=norm(h.headline);
 let kind:SportNewsCallback['kind']='historical-echo',title='O arquivo lembra';
 if(twoClubs&&(t.includes('final')||t.includes('titulo')||t.includes('decis'))) {kind='repeat-final';title='A decisão tem memória'}
 else if(sameManager&&(t.includes('demit')||t.includes('saida')||t.includes('adeus'))) {kind='manager-return';title='O treinador reencontra o passado'}
 else if(samePlayer&&(t.includes('transfer')||t.includes('negocia')||t.includes('contrat')||t.includes('rumor'))) {kind='transfer-saga';title='Uma novela antiga volta à pauta'}
 else if(twoClubs){kind='revenge';title='Velhos adversários, novas contas'}
 else if(sameManager||samePlayer){kind='reunion';title='Reencontro com a própria história'}
 else if(t.includes('record')||t.includes('histor')){kind='record-echo';title='O presente desafia o arquivo'}
 return{kind,title,summary:`Na edição ${h.edition}, de ${h.date}, o Sport News registrou: “${h.headline}”. O episódio volta a ser relevante no contexto atual.`,source:h};
 }).slice(0,c.limit??6)}

export function sportNewsMemoryBrief(w:World,c:SportNewsMemoryContext){const callbacks=sportNewsCallbacks(w,c);return{generatedAt:c.date,count:callbacks.length,callbacks,editorialHooks:callbacks.map(x=>({kind:x.kind,title:x.title,sourceEdition:x.source.edition,sourceDate:x.source.date,sourceHeadline:x.source.headline,weight:x.source.score}))}}

export function relatedHistoricalIssues(w:World,issue:SportNewsArchiveEntry,limit=5){return recallSportNews(w,{date:issue.date,season:issue.season,clubIds:issue.featuredClubIds,playerIds:issue.featuredPlayerIds,managerIds:issue.featuredManagerIds,competitionIds:issue.competitionIds,query:issue.coverHeadline,limit,minAgeDays:7})}
