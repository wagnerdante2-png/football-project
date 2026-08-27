import type { Fixture, MatchEvent, Player, World } from './engine';

export type SetPieceKind='corner'|'freeKick'|'indirectFreeKick'|'penalty'|'throwIn'|'goalKick';
export type SetPieceDelivery='inswing'|'outswing'|'short'|'direct'|'floated'|'driven'|'long';
export type SetPieceZone='left'|'right'|'central';
export type SetPieceMatchEvent=Omit<MatchEvent,'type'> & {type:SetPieceKind;setPieceKind:SetPieceKind;delivery?:SetPieceDelivery;zone?:SetPieceZone};
export type ExtendedMatchEvent=MatchEvent|SetPieceMatchEvent;

const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h>>>0)};
const pseudo=(seed:number,offset:number)=>{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)};
const allPlayers=(world:World,clubId:string)=>world.clubs.find(c=>c.id===clubId)?.players??[];
const surname=(p?:Player)=>p?.name.split(' ').slice(-1)[0]??'';
function taker(world:World,clubId:string,seed:number,kind:SetPieceKind){const pool=allPlayers(world,clubId).filter(p=>kind==='goalKick'?p.position==='GK':p.position!=='GK');const sorted=[...pool].sort((a,b)=>{if(kind==='penalty')return(b.attributes.finishing+b.attributes.technique+b.attributes.decisions)-(a.attributes.finishing+a.attributes.technique+a.attributes.decisions);if(kind==='goalKick')return(b.attributes.passing+b.attributes.decisions)-(a.attributes.passing+a.attributes.decisions);return(b.attributes.passing+b.attributes.technique+b.attributes.decisions)-(a.attributes.passing+a.attributes.technique+a.attributes.decisions)});const top=sorted.slice(0,Math.min(6,sorted.length));return top[Math.floor(pseudo(seed,2)*Math.max(1,top.length))]}
function makeSetPiece(world:World,fixture:Fixture,clubId:string,minute:number,seed:number,kind:SetPieceKind):SetPieceMatchEvent{const p=taker(world,clubId,seed,kind);const zone:SetPieceZone=pseudo(seed,4)<.42?'left':pseudo(seed,4)>.68?'right':'central';const delivery:SetPieceDelivery=kind==='corner'?(pseudo(seed,5)<.52?'inswing':pseudo(seed,5)<.82?'outswing':'short'):kind==='freeKick'?(pseudo(seed,6)<.46?'direct':pseudo(seed,6)<.75?'floated':'short'):kind==='indirectFreeKick'?'floated':kind==='throwIn'?(pseudo(seed,7)<.72?'short':'long'):kind==='goalKick'?(pseudo(seed,8)<.56?'short':'long'):'direct';const club=world.clubs.find(c=>c.id===clubId);const text=kind==='corner'?`${surname(p)||club?.name||'A equipe'} prepara a cobrança de escanteio pela ${zone==='left'?'esquerda':'direita'}.`:kind==='freeKick'?`${surname(p)||club?.name||'A equipe'} se posiciona para uma falta perigosa${delivery==='direct'?' com possibilidade de chute direto':''}.`:kind==='indirectFreeKick'?`${surname(p)||club?.name||'A equipe'} cobra uma falta indireta e coloca jogadores na área.`:kind==='penalty'?`${surname(p)||club?.name||'O cobrador'} posiciona a bola na marca do pênalti.`:kind==='throwIn'?`${surname(p)||club?.name||'A equipe'} prepara a cobrança de lateral pela ${zone==='left'?'esquerda':'direita'}.`:`${surname(p)||'O goleiro'} prepara o tiro de meta para ${club?.name||'a equipe'}.`;return{minute,type:kind,clubId,playerId:p?.id,text,setPieceKind:kind,delivery,zone};}
function sameMinuteOrder(type:string){return['corner','freeKick','indirectFreeKick','penalty','throwIn','goalKick'].includes(type)?0:type==='shot'?1:type==='save'?2:type==='goal'?3:4}

/** Enriches already-resolved fast-match output without changing score/standings.
 * Existing shots/goals can acquire a real set-piece origin, so replay/narration stay causally faithful.
 */
export function enrichFixtureWithSetPieces(world:World,fixture:Fixture):void{
  if(!fixture.played||!fixture.events?.length)return;
  if(fixture.events.some(e=>['corner','freeKick','indirectFreeKick','penalty','throwIn','goalKick'].includes(String(e.type))))return;
  const seed=hash(`${world.season}|${fixture.round}|${fixture.home}|${fixture.away}|setpieces`);
  const events:[...MatchEvent[]]=[...fixture.events];const enriched:ExtendedMatchEvent[]=[];
  for(let i=0;i<events.length;i++){
    const e=events[i];const type=String(e.type);const clubId=e.clubId;
    if((type==='shot'||type==='goal')&&clubId){const roll=pseudo(seed,20+i*3);const penaltyCandidate=(e.xg??0)>=.18&&pseudo(seed,21+i*3)<.055;if(penaltyCandidate){enriched.push(makeSetPiece(world,fixture,clubId,e.minute,seed+i*109,'penalty'));e.text=type==='goal'?`GOL DE PÊNALTI! ${e.text.replace(/^GOL!\s*/,'')}`:`Após o pênalti, ${e.text.charAt(0).toLowerCase()}${e.text.slice(1)}`;}else if(roll<.18){const kind:SetPieceKind=roll<.08?'corner':roll<.145?'freeKick':'indirectFreeKick';enriched.push(makeSetPiece(world,fixture,clubId,e.minute,seed+i*101,kind));if(type==='shot')e.text=`Após a bola parada, ${e.text.charAt(0).toLowerCase()}${e.text.slice(1)}`;if(type==='goal')e.text=`GOL DE BOLA PARADA! ${e.text.replace(/^GOL!\s*/,'')}`;}}
    enriched.push(e);
  }
  const openMinutes=new Set(enriched.map(e=>e.minute));const extras=2+Math.floor(pseudo(seed,70)*4);
  for(let i=0;i<extras;i++){const clubId=pseudo(seed,80+i)<.5?fixture.home:fixture.away;let minute=6+Math.floor(pseudo(seed,90+i)*78);while(openMinutes.has(minute)&&minute<88)minute++;openMinutes.add(minute);const r=pseudo(seed,100+i);const kind:SetPieceKind=r<.28?'corner':r<.47?'freeKick':r<.59?'indirectFreeKick':r<.82?'throwIn':'goalKick';enriched.push(makeSetPiece(world,fixture,clubId,minute,seed+500+i,kind));}
  enriched.sort((a,b)=>a.minute-b.minute||sameMinuteOrder(String(a.type))-sameMinuteOrder(String(b.type)));
  fixture.events=enriched as MatchEvent[];
}
export function enrichRoundWithSetPieces(world:World,round:number):void{for(const fixture of world.fixtures.filter(f=>f.round===round&&f.played))enrichFixtureWithSetPieces(world,fixture)}
