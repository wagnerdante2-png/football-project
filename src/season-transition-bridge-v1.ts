import type { World } from './engine';
import { transitionClubWorldSeason, type ClubSeasonTransitionReport } from './club-season-transition-v1';
import { footballDataSnapshot } from './world-football-data-v1';

export type IntegratedSeasonTransitionResult={
  targetSeason:number;
  usedClubWorldTransition:boolean;
  report?:ClubSeasonTransitionReport;
};

/**
 * Advances the canonical season exactly once. When the richer world-football
 * layer has been seeded, use its full club transition (pyramid, continental
 * qualification, supporter culture, reputation and institutional memory).
 * A lightweight career that has not loaded that layer keeps the legacy season
 * number transition without inventing empty competitions.
 */
export function advanceIntegratedSeasonTransition(world:World,targetSeason=world.season+1):IntegratedSeasonTransitionResult{
  const football=footballDataSnapshot(world);
  const hasClubWorld=football.competitions.some(c=>c.scope==='domestic'||c.scope==='continental');
  if(!hasClubWorld){world.season=targetSeason;return{targetSeason,usedClubWorldTransition:false}}
  const report=transitionClubWorldSeason(world,{force:true});
  // Defensive compatibility: the lifecycle owns the intended target season.
  if(world.season!==targetSeason)world.season=targetSeason;
  return{targetSeason,usedClubWorldTransition:true,report};
}
