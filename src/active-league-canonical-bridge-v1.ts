import type { World } from './engine';
import { onWorldEvent } from './event-bus';
import {
  alias,
  footballClub,
  footballCompetition,
  footballDataSnapshot,
  registerClubRecord,
  registerCompetitionRecord,
  registerHistoricalMatch,
  registerMembership,
} from './world-football-data-v1';

export const ACTIVE_BRAZIL_LEAGUE_ID='comp-bra-1';
const provenance={sourceId:'active-league-canonical-bridge-v1',historical:false,confidence:100};
const wired=new WeakSet<World>();

function ensureCompetition(world:World){
  if(footballCompetition(world,ACTIVE_BRAZIL_LEAGUE_ID))return;
  registerCompetitionRecord(world,{
    id:ACTIVE_BRAZIL_LEAGUE_ID,
    name:'Campeonato Brasileiro Série A',
    aliases:[alias('Brasileirão Série A'),alias('Brazil Serie A')],
    scope:'domestic',
    kind:'league',
    countryId:'BRA',
    level:1,
    active:true,
    rules:{
      teams:world.clubs.length,
      pointsWin:3,
      pointsDraw:1,
      legs:2,
      rounds:Math.max(0,...world.fixtures.map(f=>f.round)),
      tiebreakers:['points','wins','goalDifference','goalsFor'],
      promotion:[],
      relegation:[],
      qualification:[],
      calendarPattern:'calendar-year',
      seasonStartMonth:7,
      seasonEndMonth:5,
      usesPlayoffs:false,
    },
    provenance:[provenance],
  });
}

function ensureClubsAndMemberships(world:World){
  const existingMemberships=new Set(
    footballDataSnapshot(world).memberships
      .filter(m=>m.competitionId===ACTIVE_BRAZIL_LEAGUE_ID&&m.season===String(world.season))
      .map(m=>m.teamId),
  );
  for(const club of world.clubs){
    if(!footballClub(world,club.id))registerClubRecord(world,{
      id:club.id,
      name:club.name,
      aliases:[],
      countryId:'BRA',
      active:true,
      stadiumIds:[],
      historicalNames:[],
      provenance:[provenance],
    });
    if(!existingMemberships.has(club.id)){
      registerMembership(world,{
        season:String(world.season),
        competitionId:ACTIVE_BRAZIL_LEAGUE_ID,
        teamId:club.id,
        teamKind:'club',
        status:'participant',
        source:'simulated',
        provenance:[provenance],
      });
      existingMemberships.add(club.id);
    }
  }
}

function mirrorCompletedMatch(world:World,event:{date:string;season:number;round:number;clubIds:string[]}){
  const [homeId,awayId]=event.clubIds;
  if(!homeId||!awayId)return;
  const fixture=world.fixtures.find(f=>f.round===event.round&&f.home===homeId&&f.away===awayId&&f.played);
  if(!fixture||fixture.homeGoals===undefined||fixture.awayGoals===undefined)return;
  registerHistoricalMatch(world,{
    id:`active-${ACTIVE_BRAZIL_LEAGUE_ID}-${event.season}-r${event.round}-${homeId}-${awayId}`,
    date:event.date,
    competitionId:ACTIVE_BRAZIL_LEAGUE_ID,
    season:String(event.season),
    homeTeamId:homeId,
    awayTeamId:awayId,
    homeGoals:fixture.homeGoals,
    awayGoals:fixture.awayGoals,
    round:String(event.round),
    source:'simulated',
    provenance:[provenance],
  });
}

export function ensureActiveLeagueCanonicalBridge(world:World){
  ensureCompetition(world);
  ensureClubsAndMemberships(world);
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'MatchCompleted',(event,w)=>{
    if(event.season!==w.season&&event.season!==w.season-1)return;
    mirrorCompletedMatch(w,event);
  });
}
