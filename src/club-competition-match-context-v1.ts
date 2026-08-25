import type { Club, World } from './engine';
import type { MatchCoreState } from './match-core-v2';
import { eligibleClubForCompetition } from './club-squad-registration-v1';
import { eligibleByDiscipline, recordMatchDiscipline, serveSuspensionForFixture } from './club-discipline-v1';
import { playerUnavailableForClub } from './international-duty-v1';
import { applyAwayTravelLoad } from './club-travel-recovery-v1';
import { historicalMatchContext } from './club-memory-consequences-v1';

const clamp=(v:number,a=0,b=100)=>Math.max(a,Math.min(b,v));
export function competitionClubForMatch(w:World,club:Club,competitionId:string,date:string,season=w.season){let base=eligibleClubForCompetition(w,club,competitionId,season);const disciplinary=eligibleByDiscipline(w,base,competitionId,season);if(disciplinary.length>=11)base={...base,players:disciplinary};const available=base.players.filter(p=>!playerUnavailableForClub(w,p.id,date));if(available.length>=11)base={...base,players:available};return base}
function applyHistoricalEmotion(club:Club,context:ReturnType<typeof historicalMatchContext>){const net=(context.motivation-50)*.07+(context.confidenceFactor-50)*.04-(context.anxiety-50)*.06;return{...club,players:club.players.map(p=>({...p,morale:Number(clamp(p.morale+net).toFixed(1))}))}}
export function prepareClubCompetitionMatch(w:World,input:{home:Club;away:Club;competitionId:string;date:string;season?:number}){const season=input.season??w.season,homeBase=competitionClubForMatch(w,input.home,input.competitionId,input.date,season),awayBase=competitionClubForMatch(w,input.away,input.competitionId,input.date,season),homeHistory=historicalMatchContext(w,input.home.id,input.away.id),awayHistory=historicalMatchContext(w,input.away.id,input.home.id),home=applyHistoricalEmotion(homeBase,homeHistory),away=applyHistoricalEmotion(awayBase,awayHistory);applyAwayTravelLoad(w,{awayClub:input.away,homeClub:input.home,date:input.date,competitionId:input.competitionId});const served=[...serveSuspensionForFixture(w,input.home,input.competitionId,season,input.date),...serveSuspensionForFixture(w,input.away,input.competitionId,season,input.date)];return{home,away,served,historicalContext:{home:homeHistory,away:awayHistory}}}
export function completeClubCompetitionDiscipline(w:World,state:MatchCoreState,input:{home:Club;away:Club;competitionId:string;date:string;season?:number}){const season=input.season??w.season,changed=recordMatchDiscipline(w,state,{competitionId:input.competitionId,season,date:input.date});return{changed}}
