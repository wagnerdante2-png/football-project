import type { Player, World } from './engine';
import { onWorldEvent } from './event-bus';
import { inflictInjury, injuryDefinitions, medicalProfile } from './injuries';

const wired=new WeakSet<World>();
function findPlayer(world:World,id:string):Player|undefined{for(const club of world.clubs){const p=club.players.find(x=>x.id===id);if(p)return p;}return undefined;}
function weightedTrainingInjury(){const candidates=injuryDefinitions.filter(d=>d.overloadBias>=.6&&d.baseSeverity!=='careerThreatening');const weights=candidates.map(d=>Math.max(.05,d.overloadBias));const total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total;for(let i=0;i<candidates.length;i++){roll-=weights[i];if(roll<=0)return candidates[i];}return candidates[0];}

export function wireTrainingMedical(world:World):void{
  if(wired.has(world))return;wired.add(world);
  onWorldEvent(world,'TrainingOverloadWarning',(event)=>{
    const playerId=event.playerIds[0];if(!playerId)return;const player=findPlayer(world,playerId);if(!player)return;
    const pressure=Number(event.payload.riskPressure??35);const profile=medicalProfile(world,playerId);const proneness=(profile?.injuryProneness??50)/100;const durability=(profile?.durability??55)/100;
    const chance=Math.min(.62,.12+pressure/120*proneness*(1.2-durability*.45));if(Math.random()>chance)return;
    const def=weightedTrainingInjury();if(!def)return;inflictInjury(world,player,def,Math.random()<.25?'recurrence':'overload');
  });
}
