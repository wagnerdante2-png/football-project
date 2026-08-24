import type { World } from './engine';
import { clubTraining } from './training-engine';
import { staffDepartmentEffects } from './technical-staff';

const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));

export function syncTechnicalStaffEffects(world:World):void{
  for(const club of world.clubs){
    const training=clubTraining(world,club.id);if(!training)continue;
    const effects=staffDepartmentEffects(world,club.id);
    training.sportsScience=clamp(training.sportsScience*.7+effects.physicalPreparation*.3);
    training.medicalCoordination=clamp(training.medicalCoordination*.65+effects.medicalQuality*.35);
    training.academyIntegration=clamp(training.academyIntegration*.7+effects.youthQuality*.3);
  }
}
