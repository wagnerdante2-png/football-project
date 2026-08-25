import type { World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { nationalRankingTable } from './national-team-ranking-v1';

export type HostBid={countryIds:string[];infrastructure:number;commercial:number;travel:number;legacy:number;climate:number;score:number};
export type VenueAssignment={fixtureId:string;venueId:string;countryId:string;capacity:number};
const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));
function hostInfrastructure(w:World,countryIds:string[]){const s=footballDataSnapshot(w).stadiums.filter(x=>countryIds.includes(x.countryId)),cap=s.reduce((a,b)=>a+(b.capacity??0),0),large=s.filter(x=>(x.capacity??0)>=40000).length;return clamp(large*7+cap/12000)}
function hostCommercial(w:World,countryIds:string[]){const snap=footballDataSnapshot(w),rank=new Map(nationalRankingTable(w).map(x=>[x.teamId,x.rank])),teams=snap.nationalTeams.filter(t=>countryIds.includes(t.countryId)&&t.active),best=Math.min(...teams.map(t=>rank.get(t.id)??200));return clamp(85-best*.25)}
export function evaluateHostBid(w:World,countryIds:string[]):HostBid{const infrastructure=hostInfrastructure(w,countryIds),commercial=hostCommercial(w,countryIds),travel=clamp(92-countryIds.length*8),legacy=clamp(45+countryIds.length*5),climate=72,score=Number((infrastructure*.34+commercial*.24+travel*.18+legacy*.14+climate*.1).toFixed(2));return{countryIds:[...countryIds],infrastructure,commercial,travel,legacy,climate,score}}
export function chooseHostBid(w:World,bids:string[][]){return bids.map(x=>evaluateHostBid(w,x)).sort((a,b)=>b.score-a.score)[0]}
export function tournamentVenues(w:World,hostCountryIds:string[],minimumCapacity=30000){return footballDataSnapshot(w).stadiums.filter(s=>hostCountryIds.includes(s.countryId)&&(s.capacity??0)>=minimumCapacity).sort((a,b)=>(b.capacity??0)-(a.capacity??0))}
export function assignTournamentVenues(w:World,fixtureIds:string[],hostCountryIds:string[],minimumCapacity=30000):VenueAssignment[]{const venues=tournamentVenues(w,hostCountryIds,minimumCapacity);if(!venues.length)return[];return fixtureIds.map((fixtureId,i)=>{const v=venues[i%venues.length];return{fixtureId,venueId:v.id,countryId:v.countryId,capacity:v.capacity??0}})}
