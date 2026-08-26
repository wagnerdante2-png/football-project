import type { World } from './engine';
import { transitionClubWorldSeason, type ClubSeasonTransitionReport } from './club-season-transition-v1';
import { allDomesticSeasons } from './domestic-competition-runtime-v1';

export type IntegratedSeasonTransitionResult={
  targetSeason:number;
  usedClubWorldTransition:boolean;
  report?:ClubSeasonTransitionReport;
};

/**
 * Advances the canonical season exactly once. Competition metadata alone is
 * not enough to make the richer club-world transition authoritative: a real
 * DomesticSeasonState must exist for the season being closed. This allows the
 * playable beta league to be mirrored into world-football-data without ever
 * spawning a parallel domestic scheduler.
 */
export function advanceIntegratedSeasonTransition(world:World,targetSeason=world.season+1):IntegratedSeasonTransitionResult{
  const hasDomesticRuntime=allDomesticSeasons(world).some(s=>s.season===world.season);
  if(!hasDomesticRuntime){world.season=targetSeason;return{targetSeason,usedClubWorldTransition:false}}
  const report=transitionClubWorldSeason(world,{force:true});
  if(world.season!==targetSeason)world.season=targetSeason;
  return{targetSeason,usedClubWorldTransition:true,report};
}
