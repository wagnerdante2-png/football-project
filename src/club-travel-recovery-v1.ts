import type { Club, World } from './engine';
import { footballDataSnapshot } from './world-football-data-v1';
import { geographySnapshot } from './world-geography-climate-v2';
import { playerProfile } from './player-profile-v2';
import { queueWorldEvent } from './world-core-v2';

export type ClubTravelRecord={clubId:string;date:string;opponentId:string;competitionId:string;distanceKm:number;timezoneShiftHours:number;fatigueImpact:number;conditionImpact:number};
export type ClubTravelSnapshot={records:ClubTravelRecord[]};
const states=new WeakMap<World,ClubTravelRecord[]>();
function state(w:World){let s=states.get(w);if(!s){s=[];states.set(w,s)}return s}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function rad(x:number){return x*Math.PI/180}
function hav(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const R=6371,dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude),x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function offset(tz:string){const map:Record<string,number>={'America/Sao_Paulo':-3,'America/Cuiaba':-4,'Europe/London':0,'Europe/Berlin':1,'Europe/Madrid':1,'Europe/Rome':1,'Europe/Paris':1,'Europe/Lisbon':0,'Europe/Amsterdam':1,'America/Argentina/Buenos_Aires':-3,'America/Bogota':-5};return map[tz]??0}
function cityForClub(w:World,clubId:string){const snap=footballDataSnapshot(w),club=snap.clubs.find(c=>c.id===clubId),geo=geographySnapshot(w);if(!club)return;const byName=geo.cities.find(c=>c.countryId===club.countryId&&c.cityName.toLowerCase()===club.cityName.toLowerCase());if(byName)return byName;const stadium=snap.stadiums.find(s=>club.stadiumIds.includes(s.id));if(stadium)return geo.cities.find(c=>c.countryId===club.countryId&&c.cityName.toLowerCase()===stadium.cityName.toLowerCase());return geo.cities.find(c=>c.countryId===club.countryId)}
export function estimateClubTrip(w:World,awayClubId:string,homeClubId:string){const a=cityForClub(w,awayClubId),h=cityForClub(w,homeClubId);if(!a||!h)return{distanceKm:0,timezoneShiftHours:0};return{distanceKm:Math.round(hav(a,h)),timezoneShiftHours:Math.abs(offset(a.timezone)-offset(h.timezone))}}
export function applyAwayTravelLoad(w:World,input:{awayClub:Club;homeClub:Club;date:string;competitionId:string}){const trip=estimateClubTrip(w,input.awayClub.id,input.homeClub.id),baseFatigue=clamp(trip.distanceKm/1800+trip.timezoneShiftHours*.65,0,8),baseCondition=clamp(trip.distanceKm/4500+trip.timezoneShiftHours*.35,0,4);for(const p of input.awayClub.players){const adaptability=playerProfile(w,p.id)?.hidden.adaptability??50,modifier=1+(50-adaptability)/180;p.condition=Math.round(clamp(p.condition-baseCondition*modifier,30,100))}const r:ClubTravelRecord={clubId:input.awayClub.id,date:input.date,opponentId:input.homeClub.id,competitionId:input.competitionId,distanceKm:trip.distanceKm,timezoneShiftHours:trip.timezoneShiftHours,fatigueImpact:Number(baseFatigue.toFixed(2)),conditionImpact:Number(baseCondition.toFixed(2))};state(w).push(r);if(trip.distanceKm>2500||trip.timezoneShiftHours>=3)queueWorldEvent(w,{date:input.date,type:'ClubLongDistanceTravel',scope:'club',entityIds:[input.awayClub.id,input.homeClub.id],importance:2,payload:r});return r}
export function clubTravelHistory(w:World,clubId:string){return state(w).filter(x=>x.clubId===clubId)}
export function recentTravelLoad(w:World,clubId:string,date:string,days=14){const end=new Date(`${date}T12:00:00Z`).getTime(),start=end-days*86400000;const xs=clubTravelHistory(w,clubId).filter(x=>{const t=new Date(`${x.date}T12:00:00Z`).getTime();return t>=start&&t<=end});return{trips:xs.length,distanceKm:xs.reduce((a,b)=>a+b.distanceKm,0),timezoneHours:xs.reduce((a,b)=>a+b.timezoneShiftHours,0),fatigueImpact:Number(xs.reduce((a,b)=>a+b.fatigueImpact,0).toFixed(2))}}
export function snapshotClubTravel(w:World):ClubTravelSnapshot{return{records:state(w).map(x=>({...x}))}}
export function restoreClubTravel(w:World,x:ClubTravelSnapshot){states.set(w,(x?.records??[]).map(v=>({...v})))}
