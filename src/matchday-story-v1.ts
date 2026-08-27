import type { Fixture, MatchEvent, Player, World } from './engine';

export type MatchStoryPoint={x:number;y:number};
export type MatchStoryActionType='recover'|'carry'|'pass'|'through'|'switch'|'cross'|'shot'|'save'|'goal'|'restart';
export type MatchStoryAction={type:MatchStoryActionType;playerId?:string;targetPlayerId?:string;from:MatchStoryPoint;to:MatchStoryPoint;label:string};
export type MatchStory={event:MatchEvent;actions:MatchStoryAction[];narration:string;origin:MatchStoryPoint;target:MatchStoryPoint;assistPlayerId?:string};

const clamp=(n:number,min=4,max=96)=>Math.max(min,Math.min(max,n));
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h>>>0)};
const pseudo=(seed:number,offset:number)=>{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)};
const player=(world:World,id?:string)=>id?world.clubs.flatMap(c=>c.players).find(p=>p.id===id):undefined;
const surname=(p?:Player)=>p?.name.split(' ').slice(-1)[0]??'';
const club=(world:World,id?:string)=>id?world.clubs.find(c=>c.id===id):undefined;

function attackingPlayers(world:World,clubId:string,exclude?:string){const c=club(world,clubId);return (c?.players??[]).filter(p=>p.id!==exclude&&['RB','LB','DM','CM','AM','RW','LW','ST'].includes(p.position));}
function pickSupport(world:World,e:MatchEvent,seed:number){if(!e.clubId)return undefined;const pool=attackingPlayers(world,e.clubId,e.playerId);if(!pool.length)return undefined;const weighted=[...pool].sort((a,b)=>((b.attributes.passing+b.attributes.decisions)-(a.attributes.passing+a.attributes.decisions)));const top=weighted.slice(0,Math.min(6,weighted.length));return top[Math.floor(pseudo(seed,9)*top.length)]}
function point(seed:number,offset:number,homeAttack:boolean,depth:number,widthScale=1):MatchStoryPoint{const progression=12+depth*17+pseudo(seed,offset)*9;const x=homeAttack?progression:100-progression;const y=50+(pseudo(seed,offset+1)-.5)*62*widthScale;return{x:clamp(x),y:clamp(y,8,92)}}

function narrationFor(world:World,e:MatchEvent,actions:MatchStoryAction[],assist?:Player){const actor=player(world,e.playerId),name=surname(actor);const c=club(world,e.clubId);if(e.type==='kickoff')return'A bola está rolando. As equipes começam a disputar território e posse.';if(e.type==='fulltime')return e.text;if(e.type==='yellow')return`${name||'O jogador'} chega atrasado na disputa. O árbitro para o jogo e mostra o cartão amarelo.`;if(e.type==='substitution'){const out=player(world,e.secondaryPlayerId);return`${surname(actor)||'O reserva'} entra em campo no lugar de ${surname(out)||'um companheiro'}. O time se reorganiza.`}if(e.type==='save')return`${name||'O goleiro'} lê a finalização e faz a defesa, evitando o gol.`;const sequence=actions.filter(a=>a.type!=='shot'&&a.type!=='goal').map(a=>a.label).join(' ');if(e.type==='goal')return`${sequence}${sequence?' ':''}${assist?`${surname(assist)} encontra ${name} em condição de finalizar. `:''}${name||'O atacante'} bate e É GOL! ${c?.name??'A equipe'} transforma a jogada em vantagem.`;if(e.type==='shot')return`${sequence}${sequence?' ':''}${name||'O atacante'} encontra espaço e finaliza${e.xg?` — chance de xG ${e.xg.toFixed(2)}`:''}.`;return`${sequence||e.text}`}

export function matchStory(world:World,fixture:Fixture,e:MatchEvent,index:number):MatchStory{const seed=hash(`${fixture.home}|${fixture.away}|${e.minute}|${e.type}|${e.playerId??''}|${index}`);const homeAttack=e.clubId?e.clubId===fixture.home:true;const actor=player(world,e.playerId),support=pickSupport(world,e,seed);const origin=point(seed,1,homeAttack,e.type==='shot'||e.type==='goal'?3:2,.9);const target=point(seed,5,homeAttack,e.type==='shot'||e.type==='goal'?4:3,.55);const actions:MatchStoryAction[]=[];
  if(e.type==='shot'||e.type==='goal'){
    const buildStart=point(seed,12,homeAttack,1.15,1);const middle=point(seed,14,homeAttack,2.05,.9);const creator=point(seed,16,homeAttack,3.05,.72);
    const carrier=support??actor;
    actions.push({type:'recover',playerId:carrier?.id,from:buildStart,to:buildStart,label:`${surname(carrier)||'A equipe'} recupera a bola.`});
    const direct=club(world,e.clubId)?.tactics.passingStyle==='direct';
    if(direct)actions.push({type:'through',playerId:carrier?.id,targetPlayerId:actor?.id,from:buildStart,to:creator,label:`${surname(carrier)||'O meio-campo'} acelera com um passe vertical.`});
    else{actions.push({type:'carry',playerId:carrier?.id,from:buildStart,to:middle,label:`${surname(carrier)||'O portador'} conduz e ganha metros.`});actions.push({type:'pass',playerId:carrier?.id,targetPlayerId:actor?.id,from:middle,to:creator,label:`A bola chega ao último terço.`})}
    const wide=actor&&['RW','LW'].includes(actor.position)||pseudo(seed,18)>.64;
    if(wide)actions.push({type:'cross',playerId:support?.id,targetPlayerId:actor?.id,from:creator,to:origin,label:'A jogada é levada à área por um cruzamento.'});
    actions.push({type:e.type==='goal'?'goal':'shot',playerId:actor?.id,from:origin,to:target,label:e.type==='goal'?'Finalização para o gol.':'Finalização.'});
  }else if(e.type==='save')actions.push({type:'save',playerId:actor?.id,from:origin,to:target,label:'O goleiro intervém.'});
  else if(e.type==='kickoff')actions.push({type:'restart',from:{x:50,y:50},to:{x:54,y:50},label:'Saída de bola.'});
  const narration=narrationFor(world,e,actions,support);
  return{event:e,actions,narration,origin:actions[0]?.from??origin,target:actions.at(-1)?.to??target,assistPlayerId:support?.id};
}

export function matchStories(world:World,fixture:Fixture,events:MatchEvent[]){return events.map((e,i)=>matchStory(world,fixture,e,i))}
