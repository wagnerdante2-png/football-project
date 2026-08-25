import type { Player, Position, World } from './engine';

export type FactualRoleGroup='goalkeeper'|'defender'|'midfielder'|'forward';
export type VerifiedRosterPerson={
  wikidataId:string;
  name:string;
  dateOfBirth?:string;
  nationality?:string;
  heightCm?:number;
  roleGroup?:FactualRoleGroup;
  position?:Position;
  positionSource?:string;
  clubId:string;
  clubName:string;
  membershipStart?:string;
  membershipRank?:string;
};
export type VerifiedRosterSnapshot={version:number;generatedAt:string;season:number;counts:{clubs:number;clubsWithPlayers:number;players:number};rosters:Array<{id:string;name:string;wikidataId:string;players:VerifiedRosterPerson[]}>};
export type RuntimeRosterPlayer=Player&{dateOfBirth?:string;wikidataId?:string;factualRoleGroup?:FactualRoleGroup;dataOrigin?:'wikidata-membership'|'procedural-filler';ratingsOrigin?:'engine-estimate';positionOrigin?:'verified-specific'|'engine-role-estimate'};
export type RosterHydrationReport={loaded:boolean;verifiedPlayers:number;clubsTouched:number;sourceVersion?:number;estimatedPositions?:number;reason?:string};

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function ageAtSeason(dob:string|undefined,season:number){if(!dob)return;const y=Number(dob.slice(0,4));return Number.isFinite(y)?season-y:undefined}
function groupForPosition(position:Position):FactualRoleGroup{if(position==='GK')return'goalkeeper';if(['CB','RB','LB'].includes(position))return'defender';if(['DM','CM','AM'].includes(position))return'midfielder';return'forward'}
function validPerson(p:VerifiedRosterPerson,season:number){const age=ageAtSeason(p.dateOfBirth,season);return Boolean(p.wikidataId&&p.name&&(p.position||p.roleGroup)&&age!=null&&age>=16&&age<=42)}
function factualPlayer(source:VerifiedRosterPerson,template:Player,season:number):RuntimeRosterPlayer{
  const age=ageAtSeason(source.dateOfBirth,season)??template.age,specific=Boolean(source.position),position=source.position??template.position;
  return{...template,id:`wd-${source.wikidataId}`,name:source.name,age,position,dateOfBirth:source.dateOfBirth,wikidataId:source.wikidataId,factualRoleGroup:source.roleGroup??groupForPosition(position),dataOrigin:'wikidata-membership',ratingsOrigin:'engine-estimate',positionOrigin:specific?'verified-specific':'engine-role-estimate',condition:template.condition,morale:template.morale,currentAbility:template.currentAbility,potentialAbility:Math.max(template.currentAbility,template.potentialAbility-(age>29?Math.min(5,age-29):0))};
}

export async function hydrateVerifiedRosters(world:World,url='/data/rosters/brazil-serie-a-2026.json'):Promise<RosterHydrationReport>{
  let snapshot:VerifiedRosterSnapshot;
  try{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)return{loaded:false,verifiedPlayers:0,clubsTouched:0,reason:`HTTP ${r.status}`};snapshot=await r.json() as VerifiedRosterSnapshot}catch(e){return{loaded:false,verifiedPlayers:0,clubsTouched:0,reason:String(e)}}
  if(!Array.isArray(snapshot.rosters)||snapshot.version<2)return{loaded:false,verifiedPlayers:0,clubsTouched:0,sourceVersion:snapshot.version,reason:'roster snapshot is not temporally strict v2+'};
  let verifiedPlayers=0,clubsTouched=0,estimatedPositions=0;
  for(const club of world.clubs){const roster=snapshot.rosters.find(r=>norm(r.name)===norm(club.name));if(!roster)continue;const verified=(roster.players??[]).filter(p=>validPerson(p,world.season));if(!verified.length)continue;
    const procedural=club.players.map(p=>({...p,dataOrigin:'procedural-filler',ratingsOrigin:'engine-estimate'} as RuntimeRosterPlayer)),used=new Set<number>(),real:RuntimeRosterPlayer[]=[];
    for(const p of verified.slice(0,30)){
      let ti=p.position?procedural.findIndex((t,j)=>!used.has(j)&&t.position===p.position):-1;
      if(ti<0&&p.roleGroup)ti=procedural.findIndex((t,j)=>!used.has(j)&&groupForPosition(t.position)===p.roleGroup);
      if(ti<0)ti=procedural.findIndex((_,j)=>!used.has(j));if(ti<0)break;used.add(ti);const runtime=factualPlayer(p,procedural[ti],world.season);if(runtime.positionOrigin==='engine-role-estimate')estimatedPositions++;real.push(runtime);
    }
    const fillers=procedural.filter((_,i)=>!used.has(i));club.players=[...real,...fillers].slice(0,Math.max(24,Math.min(30,real.length+fillers.length)));verifiedPlayers+=real.length;clubsTouched++;
  }
  return{loaded:true,verifiedPlayers,clubsTouched,sourceVersion:snapshot.version,estimatedPositions};
}

export function isVerifiedRuntimePlayer(player:Player):player is RuntimeRosterPlayer{return (player as RuntimeRosterPlayer).dataOrigin==='wikidata-membership'}
export function runtimePlayerDob(player:Player){return (player as RuntimeRosterPlayer).dateOfBirth}
export function runtimePlayerPositionEstimated(player:Player){return (player as RuntimeRosterPlayer).positionOrigin==='engine-role-estimate'}
