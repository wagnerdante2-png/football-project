import { performance } from 'node:perf_hooks';
import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { createDefaultManagerCharacter } from '../src/manager-character';
import { ensureAIManagerCharacters } from '../src/manager-ai-characters';
import { advanceOneDay, dailyCalendar } from '../src/daily-simulation';
import { worldCore } from '../src/world-core-v2';

const MAX_QUIET_DAY_MS=5000;
// A managed matchday deliberately resolves one full 0.25 s physical V2 match in addition
// to the background world. Keep a separate hard budget so richer match fidelity does not
// silently weaken the ordinary-calendar performance guard.
const MAX_PHYSICAL_MATCH_DAY_MS=9000;
const MAX_BOOTSTRAP_MS=5000;
const DAYS=3;
const world=createBrazilRealWorld2026();
const club=world.clubs[0];
if(!club)throw new Error('Smoke runtime has no starting club');
createDefaultManagerCharacter(world,club.id,'Runtime Smoke Manager');
const startDate=dailyCalendar(world).date;
console.log(`[smoke] start ${startDate} · clubs=${world.clubs.length} · players=${world.clubs.reduce((n,c)=>n+c.players.length,0)}`);
const managerT0=performance.now();
ensureAIManagerCharacters(world);
const managerMs=performance.now()-managerT0;
console.log(`[smoke] AI manager bootstrap · ${managerMs.toFixed(1)}ms`);
if(managerMs>MAX_BOOTSTRAP_MS)throw new Error(`AI manager bootstrap exceeded ${MAX_BOOTSTRAP_MS}ms: ${managerMs.toFixed(1)}ms`);
for(let i=0;i<DAYS;i++){
  const t0=performance.now();
  const result=advanceOneDay(world);
  const elapsed=performance.now()-t0;
  const budget=result.matchDay?MAX_PHYSICAL_MATCH_DAY_MS:MAX_QUIET_DAY_MS;
  console.log(`[smoke] day ${i+1} ${result.date} -> ${worldCore(world).date} · ${elapsed.toFixed(1)}ms · budget=${budget}ms · events=${worldCore(world).events.length}`);
  if(!Number.isFinite(elapsed)||elapsed>budget)throw new Error(`Daily runtime exceeded ${budget}ms: ${elapsed.toFixed(1)}ms on ${result.date}${result.matchDay?' (physical matchday)':''}`);
}
if(dailyCalendar(world).daysAdvanced!==DAYS)throw new Error(`Expected ${DAYS} advanced days, got ${dailyCalendar(world).daysAdvanced}`);
console.log('[smoke] daily runtime OK');
