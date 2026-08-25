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
export type OfficialRosterPerson={name:string;shirtNumber?:number};
export type OfficialRosterSnapshot={version:number;season:number;clubs:Array<{id:string;name:string;source:string;sourceUrl?:string;players:OfficialRosterPerson[]}>};
export type VerifiedRosterSnapshot={version:number;generatedAt:string;season:number;counts:{clubs:number;clubsWithPlayers:number;players:number};rosters:Array<{id:string;name:string;wikidataId:string;players:VerifiedRosterPerson[]}>};
export type RuntimeRosterPlayer=Player&{dateOfBirth?:string;wikidataId?:string;nationality?:string;heightCm?:number;shirtNumber?:number;factualRoleGroup?:FactualRoleGroup;dataOrigin?:'wikidata-membership'|'official-roster'|'procedural-filler';ratingsOrigin?:'engine-estimate';positionOrigin?:'verified-specific'|'engine-role-estimate';identitySource?:string};
export type RosterHydrationReport={loaded:boolean;verifiedPlayers:number;officialPlayers?:number;clubsTouched:number;sourceVersion?:number;estimatedPositions?:number;reason?:string};

declare global { interface Window { __touchlineWorld?: World } }

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const publicUrl=(path:string)=>new URL(path.replace(/^\/+/,''),document.baseURI).toString();
function ageAtSeason(dob:string|undefined,season:number){if(!dob)return;const y=Number(dob.slice(0,4));return Number.isFinite(y)?season-y:undefined}
function groupForPosition(position:Position):FactualRoleGroup{if(position==='GK')return'goalkeeper';if(['CB','RB','LB'].includes(position))return'defender';if(['DM','CM','AM'].includes(position))return'midfielder';return'forward'}
function validPerson(p:VerifiedRosterPerson,season:number){const age=ageAtSeason(p.dateOfBirth,season);return Boolean(p.wikidataId&&p.name&&(p.position||p.roleGroup)&&age!=null&&age>=16&&age<=42)}
function factualPlayer(source:VerifiedRosterPerson,template:Player,season:number):RuntimeRosterPlayer{
  const age=ageAtSeason(source.dateOfBirth,season)??template.age,specific=Boolean(source.position),position=source.position??template.position;
  return{...template,id:`wd-${source.wikidataId}`,name:source.name,age,position,dateOfBirth:source.dateOfBirth,wikidataId:source.wikidataId,nationality:source.nationality,heightCm:source.heightCm,factualRoleGroup:source.roleGroup??groupForPosition(position),dataOrigin:'wikidata-membership',ratingsOrigin:'engine-estimate',positionOrigin:specific?'verified-specific':'engine-role-estimate',identitySource:'Wikidata membership',condition:template.condition,morale:template.morale,currentAbility:template.currentAbility,potentialAbility:Math.max(template.currentAbility,template.potentialAbility-(age>29?Math.min(5,age-29):0))};
}
function officialPlayer(source:OfficialRosterPerson,template:RuntimeRosterPlayer,clubName:string,index:number):RuntimeRosterPlayer{return{...template,id:`official-${norm(clubName).replace(/\s+/g,'-')}-${source.shirtNumber??index+1}-${norm(source.name).replace(/\s+/g,'-')}`,name:source.name,shirtNumber:source.shirtNumber,dataOrigin:'official-roster',ratingsOrigin:'engine-estimate',positionOrigin:'engine-role-estimate',identitySource:'official club roster'}}
function looseIdentityMatch(a:string,b:string){const x=norm(a),y=norm(b);if(x===y)return true;const xa=x.split(' ')[0],ya=y.split(' ')[0];return xa.length>=4&&xa===ya&&(x.startsWith(y)||y.startsWith(x))}
async function jsonOrUndefined<T>(path:string){try{const r=await fetch(publicUrl(path),{cache:'no-cache'});return r.ok?await r.json() as T:undefined}catch{return undefined}}

export async function hydrateVerifiedRosters(world:World,url='data/rosters/brazil-serie-a-2026.json'):Promise<RosterHydrationReport>{
  window.__touchlineWorld=world;
  window.dispatchEvent(new CustomEvent('touchline:world-ready',{detail:{season:world.season}}));
  const [snapshot,official]=await Promise.all([jsonOrUndefined<VerifiedRosterSnapshot>(url),jsonOrUndefined<OfficialRosterSnapshot>('data/rosters/official-club-rosters-2026.json')]);
  if(!snapshot&&!official)return{loaded:false,verifiedPlayers:0,officialPlayers:0,clubsTouched:0,reason:'roster sources unavailable'};
  if(snapshot&&(!Array.isArray(snapshot.rosters)||snapshot.version<2))return{loaded:false,verifiedPlayers:0,officialPlayers:0,clubsTouched:0,sourceVersion:snapshot.version,reason:'roster snapshot is not temporally strict v2+'};
  let verifiedPlayers=0,officialPlayers=0,clubsTouched=0,estimatedPositions=0;
  for(const c of world.clubs){
    const procedural=c.players.map(p=>({...p,dataOrigin:'procedural-filler',ratingsOrigin:'engine-estimate'} as RuntimeRosterPlayer)),used=new Set<number>(),real:RuntimeRosterPlayer[]=[];
    const roster=snapshot?.rosters.find(r=>norm(r.name)===norm(c.name));
    const verified=(roster?.players??[]).filter(p=>validPerson(p,world.season));
    for(const p of verified.slice(0,30)){
      let ti=p.position?procedural.findIndex((t,j)=>!used.has(j)&&t.position===p.position):-1;
      if(ti<0&&p.roleGroup)ti=procedural.findIndex((t,j)=>!used.has(j)&&groupForPosition(t.position)===p.roleGroup);
      if(ti<0)ti=procedural.findIndex((_,j)=>!used.has(j));if(ti<0)break;used.add(ti);const runtime=factualPlayer(p,procedural[ti],world.season);if(runtime.positionOrigin==='engine-role-estimate')estimatedPositions++;real.push(runtime);verifiedPlayers++;
    }
    const officialClub=official?.clubs.find(x=>x.id===c.id||norm(x.name)===norm(c.name));
    if(officialClub?.players?.length){
      const prioritized:RuntimeRosterPlayer[]=[];
      for(const [idx,p] of officialClub.players.slice(0,procedural.length).entries()){
        const already=real.find(r=>looseIdentityMatch(r.name,p.name));if(already){already.shirtNumber=p.shirtNumber;prioritized.push(already);continue}
        const ti=procedural.findIndex((_,j)=>!used.has(j));if(ti<0)break;used.add(ti);prioritized.push(officialPlayer(p,procedural[ti],c.name,idx));officialPlayers++;
      }
      const keepVerified=real.filter(r=>!prioritized.includes(r));const fillers=procedural.filter((_,i)=>!used.has(i));c.players=[...prioritized,...keepVerified,...fillers].slice(0,procedural.length);
    }else if(real.length){const fillers=procedural.filter((_,i)=>!used.has(i));c.players=[...real,...fillers].slice(0,procedural.length)}
    if(real.length||officialClub?.players?.length)clubsTouched++;
  }
  window.dispatchEvent(new CustomEvent('touchline:world-hydrated',{detail:{verifiedPlayers,officialPlayers,clubsTouched}}));
  return{loaded:true,verifiedPlayers,officialPlayers,clubsTouched,sourceVersion:snapshot?.version,estimatedPositions};
}

export function isVerifiedRuntimePlayer(player:Player):player is RuntimeRosterPlayer{const o=(player as RuntimeRosterPlayer).dataOrigin;return o==='wikidata-membership'||o==='official-roster'}
export function runtimePlayerDob(player:Player){return (player as RuntimeRosterPlayer).dateOfBirth}
export function runtimePlayerNationality(player:Player){return (player as RuntimeRosterPlayer).nationality}
export function runtimePlayerHeight(player:Player){return (player as RuntimeRosterPlayer).heightCm}
export function runtimePlayerPositionEstimated(player:Player){return (player as RuntimeRosterPlayer).positionOrigin==='engine-role-estimate'}
export function runtimePlayerIdentitySource(player:Player){return (player as RuntimeRosterPlayer).identitySource}
