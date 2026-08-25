import fs from 'node:fs/promises';
import path from 'node:path';

const VISUAL=path.resolve('public','data','visual','visual-assets-2026.json');
const PEOPLE=path.resolve('public','data','people','real-players-2026.json');
const OUT=path.resolve('public','data','rosters');
const UA='football-project-roster-sync/1.4 (educational football simulation)';
const SNAPSHOT=new Date().toISOString();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function request(url){for(let i=0;i<4;i++){const r=await fetch(url,{headers:{'user-agent':UA,accept:'application/sparql-results+json'}});if(r.status===429||r.status===503){const retry=Math.min(20,Number(r.headers.get('retry-after')||0));await sleep(Math.max(retry*1000,1200*2**i));continue}if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()}throw new Error(`rate limit exhausted: ${url}`)}
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const qidFromUri=u=>String(u??'').match(/Q\d+$/)?.[0];
const isoDate=v=>String(v??'').slice(0,10)||undefined;
const heightCm=v=>{const n=Number(v);if(!Number.isFinite(n)||n<=0)return undefined;const cm=n<3?Math.round(n*100):Math.round(n);return cm>=145&&cm<=220?cm:undefined};
function specificPosition(label=''){const s=norm(label);if(/\bgoalkeeper\b|\bgoleiro\b/.test(s))return'GK';if(/\bright back\b|\blateral direito\b/.test(s))return'RB';if(/\bleft back\b|\blateral esquerdo\b/.test(s))return'LB';if(/\bcentre back\b|\bcenter back\b|\bzagueiro\b/.test(s))return'CB';if(/\bdefensive midfielder\b|\bdefensive midfield\b|\bvolante\b/.test(s))return'DM';if(/\battacking midfielder\b|\battacking midfield\b|\bmeia atacante\b/.test(s))return'AM';if(/\bright winger\b|\bright wing\b|\bponta direita\b/.test(s))return'RW';if(/\bleft winger\b|\bleft wing\b|\bponta esquerda\b/.test(s))return'LW';if(/\bcentre forward\b|\bcenter forward\b|\bstriker\b|\bcentroavante\b/.test(s))return'ST';return undefined}
const personKey=(name,dob)=>`${norm(name)}|${dob??''}`;
let peopleIndex=new Map();try{const rows=JSON.parse(await fs.readFile(PEOPLE,'utf8'));peopleIndex=new Map(rows.filter(p=>p.name&&p.dateOfBirth&&p.position).map(p=>[personKey(p.name,p.dateOfBirth),p.position]))}catch{console.warn('OpenFootball people index unavailable; using specific Wikidata positions only')}

async function rosterFor(club){const q=`SELECT DISTINCT ?player ?playerLabel ?dob ?position ?positionLabel ?started ?rank ?country ?countryLabel ?height WHERE {
  VALUES ?club { wd:${club.wikidataId} }
  ?player p:P54 ?membership ; wdt:P21 wd:Q6581097 ; wdt:P569 ?dob .
  ?membership ps:P54 ?club ; wikibase:rank ?rank .
  OPTIONAL { ?membership pq:P580 ?started }
  OPTIONAL { ?membership pq:P582 ?ended }
  FILTER(YEAR(?dob) >= 1984 && YEAR(?dob) <= 2010)
  FILTER(!BOUND(?ended) || ?ended >= \"2026-01-01T00:00:00Z\"^^xsd:dateTime)
  FILTER(?rank = wikibase:PreferredRank || (BOUND(?started) && ?started >= \"2024-01-01T00:00:00Z\"^^xsd:dateTime))
  OPTIONAL { ?player wdt:P413 ?position }
  OPTIONAL { ?player wdt:P27 ?country }
  OPTIONAL { ?player wdt:P2048 ?height }
  SERVICE wikibase:label { bd:serviceParam wikibase:language \"pt,en\". }
}`;
  const url='https://query.wikidata.org/sparql?query='+encodeURIComponent(q)+'&format=json';
  const data=await request(url),rows=data.results?.bindings??[],seen=new Set(),players=[];
  for(const r of rows){const wikidataId=qidFromUri(r.player?.value);if(!wikidataId||seen.has(wikidataId))continue;seen.add(wikidataId);const name=r.playerLabel?.value||wikidataId,dob=isoDate(r.dob?.value),wikiPosition=specificPosition(r.positionLabel?.value),openFootballPosition=peopleIndex.get(personKey(name,dob)),position=wikiPosition||openFootballPosition,nationality=r.countryLabel?.value||undefined,height=heightCm(r.height?.value);players.push({wikidataId,name,dateOfBirth:dob,nationality,heightCm:height,position,positionSource:wikiPosition?'Wikidata specific label':openFootballPosition?'OpenFootball CC0':undefined,clubId:club.id,clubName:club.name,membershipStart:isoDate(r.started?.value),membershipRank:String(r.rank?.value??'').split('#').pop(),provenance:{source:'Wikidata',license:'CC0',snapshotDate:SNAPSHOT.slice(0,10),clubStatement:'P54',genderStatement:'P21',nationalityStatement:nationality?'P27':undefined,heightStatement:height?'P2048':undefined,temporalRule:'preferred-rank-or-started-2024+',positionSource:wikiPosition?'Wikidata P413 specific role':openFootballPosition?'OpenFootball exact name+DOB':undefined,rawPositionLabel:r.positionLabel?.value||undefined}})}
  return players;
}

await fs.mkdir(OUT,{recursive:true});
const manifest=JSON.parse(await fs.readFile(VISUAL,'utf8'));
const clubs=(manifest.clubs??[]).filter(c=>c.wikidataId&&c.sourceConfidence>=80).map(c=>({id:norm(c.name).replace(/ /g,'-'),name:c.name,wikidataId:c.wikidataId}));
const rosters=[];for(const club of clubs){try{const players=await rosterFor(club);rosters.push({club,...club,players,count:players.length,positionedPlayers:players.filter(p=>p.position).length});console.log(club.name,players.length,players.filter(p=>p.position).length,'positioned');await sleep(900)}catch(e){console.warn('roster skip',club.name,String(e));rosters.push({club,...club,players:[],count:0,positionedPlayers:0,error:String(e)})}}
const allPlayers=rosters.flatMap(r=>r.players);
const out={version:5,generatedAt:SNAPSHOT,season:2026,source:{name:'Wikidata',license:'CC0',membershipProperty:'P54',positionFallback:'OpenFootball CC0 exact name+DOB'},rules:['Only male players with a known birth date and a plausible active-professional birth year (1984-2010) are included.','Memberships ended before 2026 are rejected.','A surviving membership must be PreferredRank or explicitly start in 2024 or later; undated historical memberships are rejected.','Generic Wikidata roles such as defender, midfielder or forward are not converted into a specific engine position.','Wikidata P413 is accepted only when its label names a specific role; otherwise OpenFootball may fill position only on exact normalized name + date-of-birth identity.','Nationality and height are included only when explicitly available as Wikidata P27/P2048 statements; neither field is inferred.','Unknown positions and biographical fields remain undefined rather than guessed.','Club identities come from the already-verified visual manifest; no second club identity registry is maintained.'],counts:{clubs:rosters.length,clubsWithPlayers:rosters.filter(r=>r.count>0).length,players:allPlayers.length,positionedPlayers:allPlayers.filter(p=>p.position).length,positionsFromWikidata:allPlayers.filter(p=>p.positionSource==='Wikidata specific label').length,positionsFromOpenFootball:allPlayers.filter(p=>p.positionSource==='OpenFootball CC0').length,playersWithNationality:allPlayers.filter(p=>p.nationality).length,playersWithHeight:allPlayers.filter(p=>p.heightCm).length},rosters};
await fs.writeFile(path.join(OUT,'brazil-serie-a-2026.json'),JSON.stringify(out,null,2));
console.log(out.counts);
