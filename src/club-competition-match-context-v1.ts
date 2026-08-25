import type { Club, World } from './engine';
import type { MatchCoreState } from './match-core-v2';
import { eligibleClubForCompetition } from './club-squad-registration-v1';
import { eligibleByDiscipline, recordMatchDiscipline, serveSuspensionForFixture } from './club-discipline-v1';
import { playerUnavailableForClub } from './international-duty-v1';
import { applyAwayTravelLoad } from './club-travel-recovery-v1';

export function competitionClubForMatch(w:World,club:Club,competitionId:string,date:string,season=w.season){let base=eligibleClubForCompetition(w,club,competitionId,season);const disciplinary=eligibleByDiscipline(w,base,competitionId,season);if(disciplinary.length>=11)base={...base,players:disciplinary};const available=base.players.filter(p=>!playerUnavailableForClub(w,p.id,date));if(available.length>=11)base={...base,players:available};return base}
export function prepareClubCompetitionMatch(w:World,input:{home:Club;away:Club;competitionId:string;date:string;season?:number}){const season=input.season??w.season,home=competitionClubForMatch(w,input.home,input.competitionId,input.date,season),away=competitionClubForMatch(w,input.away,input.competitionId,input.date,season);applyAwayTravelLoad(w,{awayClub:input.away,homeClub:input.home,date:input.date,competitionId:input.competitionId});const served=[...serveSuspensionForFixture(w,input.home,input.competitionId,season,input.date),...serveSuspensionForFixture(w,input.away,input.competitionId,season,input.date)];return{home,away,served}}
export function completeClubCompetitionDiscipline(w:World,state:MatchCoreState,input:{home:Club;away:Club;competitionId:string;date:string;season?:number}){const season=input.season??w.season,changed=recordMatchDiscipline(w,state,{competitionId:input.competitionId,season,date:input.date});return{changed}}
