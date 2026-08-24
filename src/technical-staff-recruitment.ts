import type { World } from './engine';
import { clubTechnicalStaff } from './technical-staff';
import { improveRegionalKnowledge, scoutingRegions } from './staff';

export function tickRecruitmentAnalystEffects(world:World,date:string):void{
  if(!date.endsWith('-01'))return;
  for(const club of world.clubs){
    const analysts=clubTechnicalStaff(world,club.id).filter(s=>s.role==='recruitmentAnalyst');
    if(!analysts.length)continue;
    const quality=analysts.reduce((a,s)=>a+s.skills.recruitment*.65+s.skills.analysis*.35,0)/analysts.length;
    const harmony=analysts.reduce((a,s)=>a+s.staffHarmony,0)/analysts.length;
    const monthly=Math.max(.2,(quality*.75+harmony*.25-45)/35);
    for(const region of scoutingRegions())improveRegionalKnowledge(world,club.id,region,region==='Brasil'?monthly*.35:monthly*.16);
  }
}
