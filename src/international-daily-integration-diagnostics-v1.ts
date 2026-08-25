import type { World } from './engine';
import { internationalWindowsForYear } from './international-calendar-v1';
import { ensureQualifierCycle, qualifierCalendar } from './international-qualifier-runtime-v1';
import { tickInternationalMatches } from './international-daily-runtime-v1';
import { assessClubInternationalConflict } from './international-club-conflict-v1';
import { snapshotWorldFoundation, validateWorldFoundationSave } from './world-save-schema-v2';
import { worldCore } from './world-core-v2';

function nextWorldCupYear(season:number){let y=Math.max(2030,season);while((y-2026)%4!==0)y++;return y}
export function runInternationalDailyIntegrationDiagnostics(w:World){const issues:string[]=[],year=Number(worldCore(w).date.slice(0,4)),windows=internationalWindowsForYear(year);if(!windows.length)issues.push('nenhuma janela internacional configurada');const cycle=ensureQualifierCycle(w,nextWorldCupYear(year));if(cycle.length<6)issues.push('ciclo classificatório incompleto');const rows=cycle.flatMap(q=>qualifierCalendar(w,q.config.id).map(x=>({...x,competitionId:q.config.id})));if(!rows.length)issues.push('calendário classificatório vazio');const first=rows[0];let result:any;if(first){result=tickInternationalMatches(w,first.date);if(result.qualifierMatchdays<1)issues.push('matchday classificatório não executou na data prevista')}for(const c of w.clubs.slice(0,3)){const a=assessClubInternationalConflict(w,c.id,windows[0]?.start??worldCore(w).date);if(a.unavailable<0||a.squadSize!==c.players.length)issues.push(`avaliação de conflito inválida: ${c.id}`)}const save=snapshotWorldFoundation(w),valid=validateWorldFoundationSave(save);if(!valid.ok)issues.push(...valid.issues.map(x=>`save: ${x}`));if(save.schemaVersion<10)issues.push('save schema não persiste runtime internacional diário');return{ok:issues.length===0,issues,year,windows:windows.length,qualifierCycles:cycle.length,qualifierRows:rows.length,executed:result,saveSchema:save.schemaVersion}}
