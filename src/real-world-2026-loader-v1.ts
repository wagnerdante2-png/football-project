import type { World } from './engine';
import { importRealPlayerBatchV2, type RealPlayerSeedV2 } from './real-world-player-import-v2';
import { importRealStaffBatch, type RealStaffSeed } from './real-world-staff-import-v1';
import { dedupePlayerRosters } from './player-roster-integrity-v1';
import { medicalState } from './injuries';
import { queueWorldEvent, worldCore } from './world-core-v2';

export type PublicPeople2026Payload={players:RealPlayerSeedV2[];staff:RealStaffSeed[];manifest?:any};
export type PublicPeople2026LoadReport={players:{inserted:number;merged:number;duplicatesPrevented:number;conflicts:number};staff:{inserted:number;merged:number};rosterDuplicatesRemoved:number;medicalProfiles:number;manifest?:any};

export function loadPublicPeople2026(w:World,payload:PublicPeople2026Payload):PublicPeople2026LoadReport{const p=importRealPlayerBatchV2(w,payload.players??[]),s=importRealStaffBatch(w,payload.staff??[]),integrity=dedupePlayerRosters(w),medical=medicalState(w);const report={players:{inserted:p.report.inserted,merged:p.report.merged,duplicatesPrevented:p.report.duplicatesPrevented,conflicts:p.report.conflicts.length},staff:{inserted:s.inserted,merged:s.merged},rosterDuplicatesRemoved:integrity.removed,medicalProfiles:medical.profiles.size,manifest:payload.manifest};queueWorldEvent(w,{date:worldCore(w).date,type:'PublicPeople2026Loaded',scope:'world',entityIds:[],importance:2,payload:report});return report}

async function json<T>(url:string):Promise<T>{const r=await fetch(url);if(!r.ok)throw new Error(`Falha ao carregar ${url}: ${r.status}`);return r.json() as Promise<T>}
export async function loadBundledPublicPeople2026(w:World,base='/data/people'){const [players,staff,manifest]=await Promise.all([json<RealPlayerSeedV2[]>(`${base}/real-players-2026.json`),json<RealStaffSeed[]>(`${base}/real-staff-2026.json`),json<any>(`${base}/manifest-2026.json`).catch(()=>undefined)]);return loadPublicPeople2026(w,{players,staff,manifest})}
