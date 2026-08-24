import type { World } from './engine';
import { temporalState, type MedicalTimeline, type NegotiationTimeline } from './temporal-processes';

export type TemporalSnapshot={
  medical:[string,MedicalTimeline][];
  negotiations:[string,NegotiationTimeline][];
  contractWarnings:string[];
  deferredRecruitment:[string,string][];
  lastMedicalRecoveryDate?:string;
};

export function snapshotTemporalState(world:World):TemporalSnapshot{
  const s=temporalState(world);
  return{
    medical:[...s.medical.entries()].map(([k,v])=>[k,{...v}]),
    negotiations:[...s.negotiations.entries()].map(([k,v])=>[k,{...v}]),
    contractWarnings:[...s.contractWarnings],
    deferredRecruitment:[...s.deferredRecruitment.entries()],
    lastMedicalRecoveryDate:s.lastMedicalRecoveryDate,
  };
}

export function restoreTemporalState(world:World,snapshot?:TemporalSnapshot):void{
  if(!snapshot)return;
  const s=temporalState(world);
  s.medical=new Map(snapshot.medical.map(([k,v])=>[k,{...v}]));
  s.negotiations=new Map(snapshot.negotiations.map(([k,v])=>[k,{...v}]));
  s.contractWarnings=new Set(snapshot.contractWarnings);
  s.deferredRecruitment=new Map(snapshot.deferredRecruitment);
  s.lastMedicalRecoveryDate=snapshot.lastMedicalRecoveryDate;
}
