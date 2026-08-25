import type { Player, Position, World } from './engine';

export type VerifiedRosterPerson={
  wikidataId:string;
  name:string;
  dateOfBirth?:string;
  position?:Position;
  clubId:string;
  clubName:string;
  membershipStart?:string;
  membershipRank?:string;
};
export type VerifiedRosterSnapshot={version:number;generatedAt:string;season:number;counts:{clubs:number;clubsWithPlayers:number;players:number};rosters:Array<{id:string;name:string;wikidataId:string;players:VerifiedRosterPerson[]}>};
export type RuntimeRosterPlayer=Player&{dateOfBirth?:string;wikidataId?:string;dataOrigin?:'wikidata-membership'|'procedural-filler';ratingsOrigin?:'engine-estimate'};
export type RosterHydrationReport={loaded:boolean;verifiedPlayers:number;clubsTouched:number;sourceVersion?:number;reason?:string};

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function ageAtSeason(dob:string|undefined,season:number){if(!dob)return;const y=Number(dob.slice(0,4));return Number.isFinite(y)?season-y:undefined}
function validPerson(p:VerifiedRosterPerson,season:number){const age=ageAtSeason(p.dateOfBirth,season);return Boolean(p.wikidataId&&p.name&&p.position&&age!=null&&age>=16&&age<=42)}
function factualPlayer(source:VerifiedRosterPerson,template:Player,season:number,index:number):RuntimeRosterPlayer{
  const age=ageAtSeason(source.dateOfBirth,season)??template.age;
  return{...template,id:`wd-${source.wikidataId}`,name:source.name,age,position:source.position??template.position,dateOfBirth:source.dateOfBirth,wikidataId:source.wikidataId,dataOrigin:'wikidata-membership',ratingsOrigin:'engine-estimate',condition:template.condition,morale:template.morale,currentAbility:template.currentAbility,potentialAbility:Math.max(template.currentAbility,template.potentialAbility-(age>29?Math.min(5,age-29):0))};
}

export async function hydrateVerifiedRosters(world:World,url='/data/rosters/brazil-serie-a-2026.json'):Promise<RosterHydrationReport>{
  let snapshot:VerifiedRosterSnapshot;
  try{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)return{loaded:false,verifiedPlayers:0,clubsTouched:0,reason:`HTTP ${r.status}`};snapshot=await r.json() as VerifiedRosterSnapshot}catch(e){return{loaded:false,verifiedPlayers:0,clubsTouched:0,reason:String(e)}}
  if(!Array.isArray(snapshot.rosters)||snapshot.version<2)return{loaded:false,verifiedPlayers:0,clubsTouched:0,sourceVersion:snapshot.version,reason:'roster snapshot is not temporally strict v2+'};
  let verifiedPlayers=0,clubsTouched=0;
  for(const club of world.clubs){const roster=snapshot.rosters.find(r=>norm(r.name)===norm(club.name));if(!roster)continue;const verified=(roster.players??[]).filter(p=>validPerson(p,world.season));if(!verified.length)continue;
    const procedural=club.players.map(p=>({...p,dataOrigin:'procedural-filler',ratingsOrigin:'engine-estimate'} as RuntimeRosterPlayer)),used=new Set<number>(),real:RuntimeRosterPlayer[]=[];
    for(const [i,p] of verified.slice(0,30).entries()){
      let ti=procedural.findIndex((t,j)=>!used.has(j)&&t.position===p.position);if(ti<0)ti=procedural.findIndex((_,j)=>!used.has(j));if(ti<0)break;used.add(ti);real.push(factualPlayer(p,procedural[ti],world.season,i));
    }
    const fillers=procedural.filter((_,i)=>!used.has(i));club.players=[...real,...fillers].slice(0,Math.max(24,Math.min(30,real.length+fillers.length)));verifiedPlayers+=real.length;clubsTouched++;
  }
  return{loaded:true,verifiedPlayers,clubsTouched,sourceVersion:snapshot.version};
}

export function isVerifiedRuntimePlayer(player:Player):player is RuntimeRosterPlayer{return (player as RuntimeRosterPlayer).dataOrigin==='wikidata-membership'}
export function runtimePlayerDob(player:Player){return (player as RuntimeRosterPlayer).dateOfBirth}
