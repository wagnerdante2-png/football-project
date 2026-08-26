import type { World } from './engine';
import { transitionClubWorldSeason, type ClubSeasonTransitionReport } from './club-season-transition-v1';
import { footballDataSnapshot } from './world-football-data-v1';

export type IntegratedSeasonTransitionResult={
  targetSeason:number;
  usedClubWorldTransition:boolean;
  report?:ClubSeasonTransitionReport;
};

/**
 * Advances the canonical season exactly once. The rich club transition only
 * becomes authoritative after domestic competitions have actually been seeded.
 * International metadata alone (World Cup, Copa América, continental cups)
 * must not accidentally create a parallel domestic season.
 */
export function advanceIntegratedSeasonTransition(world:World,targetSeason=world.season+1):IntegratedSeasonTransitionResult{
  const football=footballDataSnapshot(world);
  const hasDomesticClubWorld=football.competitions.some(c=>c.scope==='domestic'&&c.kind==='league'&&c.active!==false);
  if(!hasDomesticClubWorld){world.season=targetSeason;return{targetSeason,usedClubWorldTransition:false}}
  const report=transitionClubWorldSeason(world,{force:true});
  if(world.season!==targetSeason)world.season=targetSeason;
  return{targetSeason,usedClubWorldTransition:true,report};
}
