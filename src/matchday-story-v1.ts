import type { Fixture, MatchEvent, Player, World } from './engine';

export type MatchStoryPoint={x:number;y:number};
export type MatchStoryActionType='recover'|'intercept'|'tackle'|'loose'|'press'|'block'|'carry'|'dribble'|'pass'|'oneTwo'|'through'|'switch'|'longBall'|'overlap'|'underlap'|'cross'|'cutback'|'header'|'rebound'|'shot'|'save'|'goal'|'foul'|'restart';
export type MatchStoryAction={type:MatchStoryActionType;playerId?:string;targetPlayerId?:string;from:MatchStoryPoint;to:MatchStoryPoint;label:string};
export type MatchStory={event:MatchEvent;actions:MatchStoryAction[];narration:string;origin:MatchStoryPoint;target:MatchStoryPoint;assistPlayerId?:string};

const clamp=(n:number,min=4,max=96)=>Math.max(min,Math.min(max,n));
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h>>>0)};
const pseudo=(seed:number,offset:number)=>{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)};
const player=(world:World,id?:string)=>id?world.clubs.flatMap(c=>c.players).find(p=>p.id===id):undefined;
const surname=(p?:Player)=>p?.name.split(' ').slice(-1)[0]??'';
const club=(world:World,id?:string)=>id?world.clubs.find(c=>c.id===id):undefined;

function attackingPlayers(world:World,clubId:string,exclude?:string){const c=club(world,clubId);return (c?.players??[]).filter(p=>p.id!==exclude&&['RB','LB','DM','CM','AM','RW','LW','ST'].includes(p.position));}
function pickSupport(world:World,e:MatchEvent,seed:number,offset=9,exclude?:string){if(!e.clubId)return undefined;const pool=attackingPlayers(world,e.clubId,exclude??e.playerId);if(!pool.length)return undefined;const weighted=[...pool].sort((a,b)=>((b.attributes.passing+b.attributes.decisions)-(a.attributes.passing+a.attributes.decisions)));const top=weighted.slice(0,Math.min(7,weighted.length));return top[Math.floor(pseudo(seed,offset)*top.length)]}
function point(seed:number,offset:number,homeAttack:boolean,depth:number,widthScale=1):MatchStoryPoint{const progression=12+depth*17+pseudo(seed,offset)*9;const x=homeAttack?progression:100-progression;const y=50+(pseudo(seed,offset+1)-.5)*62*widthScale;return{x:clamp(x),y:clamp(y,8,92)}}
function actionSentence(a:MatchStoryAction){return a.label.trim()}

function narrationFor(world:World,e:MatchEvent,actions:MatchStoryAction[],assist?:Player){const actor=player(world,e.playerId),name=surname(actor);const c=club(world,e.clubId);if(e.type==='kickoff')return'A bola está rolando. As equipes começam a disputar território e posse.';if(e.type==='fulltime')return e.text;if(e.type==='yellow')return`${name||'O jogador'} chega atrasado na disputa. O árbitro para o jogo e mostra o cartão amarelo.`;if(e.type==='substitution'){const out=player(world,e.secondaryPlayerId);return`${surname(actor)||'O reserva'} entra em campo no lugar de ${surname(out)||'um companheiro'}. O time se reorganiza.`}if(e.type==='save')return`${name||'O goleiro'} lê a finalização e faz a defesa, evitando o gol.`;const sequence=actions.filter(a=>!['shot','goal','header','rebound'].includes(a.type)).map(actionSentence).join(' ');if(e.type==='goal')return`${sequence}${sequence?' ':''}${assist?`${surname(assist)} participa da construção. `:''}${name||'O atacante'} conclui e É GOL! ${c?.name??'A equipe'} transforma a jogada em vantagem.`;if(e.type==='shot')return`${sequence}${sequence?' ':''}${name||'O atacante'} encontra espaço e finaliza${e.xg?` — chance de xG ${e.xg.toFixed(2)}`:''}.`;return sequence||e.text}

function buildAttack(world:World,fixture:Fixture,e:MatchEvent,seed:number,homeAttack:boolean,actor?:Player){const actions:MatchStoryAction[]=[];const c=club(world,e.clubId),support=pickSupport(world,e,seed,9),support2=pickSupport(world,e,seed,23,support?.id);const buildStart=point(seed,12,homeAttack,1.05,1),middle=point(seed,14,homeAttack,1.9,.95),creator=point(seed,16,homeAttack,2.8,.78),origin=point(seed,1,homeAttack,3.45,.72),target=point(seed,5,homeAttack,4.15,.5);const carrier=support??actor;const regain=pseudo(seed,30);
  if(regain<.22)actions.push({type:'intercept',playerId:carrier?.id,from:buildStart,to:buildStart,label:`${surname(carrier)||'A equipe'} antecipa o passe e recupera a posse.`});
  else if(regain<.42)actions.push({type:'tackle',playerId:carrier?.id,from:buildStart,to:buildStart,label:`${surname(carrier)||'O marcador'} vence a disputa e fica com a bola.`});
  else if(regain<.56)actions.push({type:'press',playerId:carrier?.id,from:buildStart,to:buildStart,label:`${surname(carrier)||'A equipe'} aperta a saída e força o erro.`});
  else if(regain<.68)actions.push({type:'loose',playerId:carrier?.id,from:buildStart,to:buildStart,label:`A segunda bola sobra para ${surname(carrier)||'a equipe'}.`});
  else actions.push({type:'recover',playerId:carrier?.id,from:buildStart,to:buildStart,label:`${surname(carrier)||'A equipe'} recupera a bola.`});

  const direct=c?.tactics.passingStyle==='direct',counter=c?.tactics.transition==='counter';const pattern=pseudo(seed,34);
  if(direct&&pattern<.62){actions.push({type:'longBall',playerId:carrier?.id,targetPlayerId:actor?.id,from:buildStart,to:creator,label:`${surname(carrier)||'O meio-campo'} lança em profundidade.`})}
  else if(counter&&pattern<.5){actions.push({type:'through',playerId:carrier?.id,targetPlayerId:actor?.id,from:buildStart,to:creator,label:`${surname(carrier)||'O portador'} acelera a transição com um passe vertical.`})}
  else if(pattern<.2&&support2){actions.push({type:'switch',playerId:carrier?.id,targetPlayerId:support2.id,from:buildStart,to:middle,label:`${surname(carrier)||'O meio-campo'} vira o jogo para o lado oposto.`});actions.push({type:'pass',playerId:support2.id,targetPlayerId:actor?.id,from:middle,to:creator,label:`${surname(support2)} encontra espaço entre as linhas.`})}
  else if(pattern<.42&&support2){actions.push({type:'oneTwo',playerId:carrier?.id,targetPlayerId:support2.id,from:buildStart,to:middle,label:`${surname(carrier)||'O portador'} tabela curto e recebe de volta em movimento.`});actions.push({type:'carry',playerId:carrier?.id,from:middle,to:creator,label:`${surname(carrier)||'O portador'} progride com a defesa recuando.`})}
  else if(pattern<.64){actions.push({type:'dribble',playerId:carrier?.id,from:buildStart,to:middle,label:`${surname(carrier)||'O portador'} supera a primeira pressão no drible.`});actions.push({type:'pass',playerId:carrier?.id,targetPlayerId:actor?.id,from:middle,to:creator,label:'A bola chega ao último terço.'})}
  else{actions.push({type:'carry',playerId:carrier?.id,from:buildStart,to:middle,label:`${surname(carrier)||'O portador'} conduz e ganha metros.`});actions.push({type:'pass',playerId:carrier?.id,targetPlayerId:actor?.id,from:middle,to:creator,label:'A equipe aproxima as linhas e encontra o atacante.'})}

  const wideActor=!!actor&&['RW','LW'].includes(actor.position);const wideSupport=!!support&&['RB','LB','RW','LW'].includes(support.position);const runnerPoint={x:clamp(creator.x+(homeAttack?8:-8)),y:clamp(creator.y+(creator.y<50?-9:9),8,92)};
  if(wideActor&&wideSupport&&pseudo(seed,51)>.42)actions.push({type:'overlap',playerId:support?.id,targetPlayerId:actor?.id,from:creator,to:runnerPoint,label:`${surname(support)} passa por fora e oferece a ultrapassagem.`});
  else if(actor&&['AM','CM','ST'].includes(actor.position)&&support&&['AM','CM','DM'].includes(support.position)&&pseudo(seed,52)>.6)actions.push({type:'underlap',playerId:support.id,targetPlayerId:actor.id,from:creator,to:{x:clamp(origin.x+(homeAttack?-4:4)),y:clamp((origin.y+50)/2,12,88)},label:`${surname(support)} ataca o corredor interno sem a bola.`});

  const wide=wideActor||pseudo(seed,18)>.62;if(wide){const deliveryFrom=actions.at(-1)?.to??creator;const useCutback=pseudo(seed,53)>.66&&Math.abs(deliveryFrom.y-50)>14;if(useCutback)actions.push({type:'cutback',playerId:support?.id??carrier?.id,targetPlayerId:actor?.id,from:deliveryFrom,to:origin,label:'A bola volta rasteira para a entrada da área.'});else{actions.push({type:'cross',playerId:support?.id??carrier?.id,targetPlayerId:actor?.id,from:deliveryFrom,to:origin,label:'A bola é levantada na área.'});if(actor?.position==='ST'&&pseudo(seed,39)>.5)actions.push({type:'header',playerId:actor.id,from:origin,to:target,label:`${surname(actor)} sobe para cabecear.`})}}
  else if(pseudo(seed,40)>.72&&support2)actions.push({type:'oneTwo',playerId:actor?.id,targetPlayerId:support2.id,from:creator,to:origin,label:`${surname(actor)||'O atacante'} faz uma tabela curta na entrada da área.`});

  return{actions,support,origin,target};
}

export function matchStory(world:World,fixture:Fixture,e:MatchEvent,index:number):MatchStory{const seed=hash(`${fixture.home}|${fixture.away}|${e.minute}|${e.type}|${e.playerId??''}|${index}`);const homeAttack=e.clubId?e.clubId===fixture.home:true;const actor=player(world,e.playerId);const defaultOrigin=point(seed,1,homeAttack,e.type==='shot'||e.type==='goal'?3:2,.9),defaultTarget=point(seed,5,homeAttack,e.type==='shot'||e.type==='goal'?4:3,.55);let actions:MatchStoryAction[]=[];let assist:Player|undefined,origin=defaultOrigin,target=defaultTarget;
  if(e.type==='shot'||e.type==='goal'){
    const build=buildAttack(world,fixture,e,seed,homeAttack,actor);actions=build.actions;assist=build.support;origin=build.origin;target=build.target;
    if(e.type==='shot'&&pseudo(seed,58)>.84)actions.push({type:'block',playerId:actor?.id,from:origin,to:{x:clamp(origin.x+(homeAttack?5:-5)),y:clamp(origin.y+(pseudo(seed,59)-.5)*10,8,92)},label:'A defesa fecha o espaço e desvia a tentativa.'});
    const hasHeader=actions.some(a=>a.type==='header');if(!hasHeader)actions.push({type:e.type==='goal'?'goal':'shot',playerId:actor?.id,from:origin,to:target,label:e.type==='goal'?'Finalização para o gol.':'Finalização.'});
    else if(e.type==='goal')actions.push({type:'goal',playerId:actor?.id,from:origin,to:target,label:'A cabeçada encontra o gol.'});
    if(e.type==='shot'&&pseudo(seed,47)>.82)actions.push({type:'rebound',playerId:actor?.id,from:target,to:{x:clamp(target.x+(homeAttack?-4:4)),y:clamp(target.y+(pseudo(seed,48)-.5)*12,8,92)},label:'A bola rebate e continua viva na área.'});
  }else if(e.type==='save')actions.push({type:'save',playerId:actor?.id,from:origin,to:target,label:'O goleiro se ajusta, acompanha a trajetória e faz a defesa.'});
  else if(e.type==='yellow')actions.push({type:'foul',playerId:actor?.id,from:origin,to:origin,label:`${surname(actor)||'O jogador'} interrompe a jogada com falta.`});
  else if(e.type==='kickoff')actions.push({type:'restart',from:{x:50,y:50},to:{x:54,y:50},label:'Saída de bola.'});
  const narration=narrationFor(world,e,actions,assist);return{event:e,actions,narration,origin:actions[0]?.from??origin,target:actions.at(-1)?.to??target,assistPlayerId:assist?.id};
}

export function matchStories(world:World,fixture:Fixture,events:MatchEvent[]){return events.map((e,i)=>matchStory(world,fixture,e,i))}
