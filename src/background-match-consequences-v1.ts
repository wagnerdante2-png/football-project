import type { Fixture, Player, World } from './engine';
import { selectStartingEleven } from './engine';
import { ensurePlayerBehavior } from './player-behavior-v2';
import { recordMatchExposure } from './player-match-state-v2';
import { recordPartnershipMinutes } from './player-partnerships-v2';
import { recordPositionMinutes } from './player-technical-profile-v2';

export type BackgroundLineupSnapshot={fixtureKey:string;homeIds:string[];awayIds:string[]};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const key=(f:Fixture)=>`${f.round}:${f.home}:${f.away}`;

export function captureBackgroundLineups(world:World,round:number,excludeClubId?:string):BackgroundLineupSnapshot[]{
 return world.fixtures.filter(f=>f.round===round&&!f.played&&(!excludeClubId||(f.home!==excludeClubId&&f.away!==excludeClubId))).map(f=>{
  const home=world.clubs.find(c=>c.id===f.home),away=world.clubs.find(c=>c.id===f.away);
  return{fixtureKey:key(f),homeIds:home?selectStartingEleven(home).map(p=>p.id):[],awayIds:away?selectStartingEleven(away).map(p=>p.id):[]};
 });
}

function minutesFor(fixture:Fixture,starterIds:string[]){
 const minutes=new Map<string,number>(starterIds.map(id=>[id,90]));
 for(const e of fixture.events??[]){if(e.type!=='substitution'||!e.playerId)continue;const minute=clamp(e.minute,1,89);minutes.set(e.playerId,Math.max(minutes.get(e.playerId)??0,90-minute));if(e.secondaryPlayerId&&minutes.has(e.secondaryPlayerId))minutes.set(e.secondaryPlayerId,Math.min(minutes.get(e.secondaryPlayerId)??90,minute));}
 return minutes;
}
function ratingFor(fixture:Fixture,clubId:string,p:Player){
 const hg=fixture.homeGoals??0,ag=fixture.awayGoals??0,isHome=fixture.home===clubId,forGoals=isHome?hg:ag,against=isHome?ag:hg;
 let rating=6.35+(forGoals>against?.28:forGoals<against?-.18:.04);
 for(const e of fixture.events??[]){if(e.playerId!==p.id)continue;if(e.type==='goal')rating+=.58;else if(e.type==='shot')rating+=.05;else if(e.type==='yellow')rating-=.12;}
 return Number(clamp(rating,5.4,8.6).toFixed(2));
}
function partnershipPairs(used:{p:Player;m:number}[]){
 // Background matches intentionally approximate collective chemistry using a sparse
 // positional neighbourhood rather than all 55 XI pairs. The watched V2 match still
 // records the complete pair matrix; this keeps calendar simulation comfortably fast.
 const pairs:[{p:Player;m:number},{p:Player;m:number}][]=[];
 const seen=new Set<string>();
 const add=(a:{p:Player;m:number}|undefined,b:{p:Player;m:number}|undefined)=>{if(!a||!b||a.p.id===b.p.id)return;const k=[a.p.id,b.p.id].sort().join('|');if(seen.has(k))return;seen.add(k);pairs.push([a,b]);};
 for(let i=0;i<used.length-1;i++)add(used[i],used[i+1]);
 const byPos=(...pos:Player['position'][])=>(used.find(x=>pos.includes(x.p.position)));
 add(byPos('GK'),byPos('CB'));add(byPos('RB'),byPos('RW','AM'));add(byPos('LB'),byPos('LW','AM'));add(byPos('DM'),byPos('CM'));add(byPos('CM'),byPos('AM'));add(byPos('AM'),byPos('ST'));
 return pairs;
}
function feedClub(world:World,fixture:Fixture,clubId:string,starterIds:string[],date:string){
 const club=world.clubs.find(c=>c.id===clubId);if(!club)return;
 const mins=minutesFor(fixture,starterIds),used=[...mins.entries()].filter(([,m])=>m>0).map(([id,m])=>({p:club.players.find(x=>x.id===id),m})).filter((x):x is {p:Player;m:number}=>Boolean(x.p));
 for(const {p,m} of used){ensurePlayerBehavior(world,p);recordMatchExposure(world,p,m,ratingFor(fixture,clubId,p),date);recordPositionMinutes(world,p,p.position,m);}
 const won=(fixture.home===clubId?(fixture.homeGoals??0)>(fixture.awayGoals??0):(fixture.awayGoals??0)>(fixture.homeGoals??0)),lost=(fixture.home===clubId?(fixture.homeGoals??0)<(fixture.awayGoals??0):(fixture.awayGoals??0)<(fixture.homeGoals??0)),sharedSuccess=won?68:lost?38:52;
 for(const [a,b] of partnershipPairs(used)){const shared=Math.min(a.m,b.m);if(shared>=15)recordPartnershipMinutes(world,a.p,b.p,shared,{sharedSuccess});}
}

/** Gives fast background fixtures the same persistent player-state outputs that matter to the wider career without paying the full 0.25 s spatial simulation cost. */
export function applyBackgroundMatchConsequences(world:World,round:number,date:string,snapshots:BackgroundLineupSnapshot[]):void{
 const byKey=new Map(snapshots.map(x=>[x.fixtureKey,x]));
 for(const fixture of world.fixtures.filter(f=>f.round===round&&f.played)){
  if((fixture as Fixture&{broadcastTape?:unknown}).broadcastTape)continue;
  const snap=byKey.get(key(fixture));if(!snap)continue;
  feedClub(world,fixture,fixture.home,snap.homeIds,date);feedClub(world,fixture,fixture.away,snap.awayIds,date);
 }
}
