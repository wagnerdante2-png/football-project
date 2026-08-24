import type { World } from './engine';
import { advanceToNextSeason, seasonFinished } from './lifecycle';
import { emitWorldEvent } from './event-bus';
import { resetDailyCalendarForNewSeason } from './daily-simulation';
import { wireManagerSeasonEvolution } from './manager-season-evolution';
import { wireManagerCareerDevelopment, annualManagerAging } from './manager-career-development';

export function advanceCareerSeason(world:World,date?:string):boolean{
 if(!seasonFinished(world))return false;wireManagerSeasonEvolution(world);wireManagerCareerDevelopment(world);const endingSeason=world.season;const endDate=date??`${endingSeason+1}-05-31`;emitWorldEvent(world,{type:'SeasonEnded',date:endDate,importance:5,summary:`Temporada ${endingSeason} encerrada.`,payload:{season:endingSeason}});advanceToNextSeason(world);annualManagerAging(world,`${world.season}-07-01`);resetDailyCalendarForNewSeason(world);return true;
}
