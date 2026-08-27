import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const dailyPath=path.join(srcRoot,'daily-simulation.ts');
const daily=fs.readFileSync(dailyPath,'utf8');
const advanceStart=daily.indexOf('export function advanceOneDay');
const advanceEnd=daily.indexOf('export function advanceDays',advanceStart);
if(advanceStart<0||advanceEnd<0)throw new Error('Unable to locate advanceOneDay boundaries');
const advance=daily.slice(advanceStart,advanceEnd);

const tickCalls=[...advance.matchAll(/\b(tick[A-Z][A-Za-z0-9_]*)\s*\(/g)].map(m=>m[1]);
const counts=new Map();
for(const name of tickCalls)counts.set(name,(counts.get(name)??0)+1);
const repeated=[...counts.entries()].filter(([,count])=>count>1).sort((a,b)=>a[0].localeCompare(b[0]));
const allowedRepeatedTicks=new Map([
  ['tickTemporalProcesses','pre-match calendar progression plus post-match consequence ingestion'],
  ['tickDressingRoom','pre-day dressing-room state plus post-match reaction'],
  ['tickManagerInteractions','pre-day interaction queue plus post-match reaction'],
  ['tickManagerBiographyEffects','pre-day biography effects plus post-match consequence ingestion'],
  ['tickManagerLongTermRuntime','pre-day long-term state plus post-match career consequences'],
  ['tickManagerEmployment','pre-day employment state plus post-match result evaluation'],
  ['tickManagerPersonalFinance','pre-day finance state plus post-match consequence ingestion'],
  ['tickManagerJobInterviews','pre-day interviews plus post-match reputation/result reaction'],
  ['tickManagerJobMarket','pre-day market plus post-match result reaction'],
  ['tickStaff','pre-day staff state plus post-match result reaction'],
  ['tickInstitution','pre-day governance/commercial state plus post-match result reaction']
]);
const unexpectedRepeated=repeated.filter(([name])=>!allowedRepeatedTicks.has(name));
const staleAllowlist=[...allowedRepeatedTicks].filter(([name])=>(counts.get(name)??0)<2);

const legacyImports=[...daily.matchAll(/from\s+['"]\.\/([^'"]*legacy[^'"]*)['"]/gi)].map(m=>m[1]);
const allowedActiveLegacy=new Map([
  ['football-school-legacy-v1','Active alumni/legacy consequence extension for football-school-v1; not a superseded game-loop implementation.']
]);
const unexpectedLegacy=legacyImports.filter(name=>!allowedActiveLegacy.has(name));

const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(e.name)&&!e.name.endsWith('.d.ts'))files.push(p)}}
walk(srcRoot);
const byModule=new Map();
for(const file of files){
  const rel=path.relative(srcRoot,file).replaceAll('\\','/');
  const key=rel.replace(/\.(ts|tsx)$/,'');
  byModule.set(key,{file,text:fs.readFileSync(file,'utf8')});
}
function resolveLocal(fromKey,spec){
  if(!spec.startsWith('.'))return null;
  const base=path.posix.normalize(path.posix.join(path.posix.dirname(fromKey),spec));
  if(byModule.has(base))return base;
  if(byModule.has(`${base}/index`))return `${base}/index`;
  return null;
}
function localImports(key){const node=byModule.get(key);if(!node)return[];const specs=[];for(const m of node.text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g))specs.push(m[1]);return specs.map(s=>resolveLocal(key,s)).filter(Boolean)}
function reachable(starts){const seen=new Set(),stack=[...(Array.isArray(starts)?starts:[starts])];while(stack.length){const key=stack.pop();if(!key||seen.has(key)||!byModule.has(key))continue;seen.add(key);for(const dep of localImports(key))stack.push(dep)}return seen}
const dailyReachable=reachable('daily-simulation');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const activeEntries=[];
for(const m of html.matchAll(/<script[^>]+type=['"]module['"][^>]+src=['"]([^'"]+)['"]/g)){
  const src=m[1].replace(/^\//,'').replace(/^src\//,'').replace(/\.(ts|tsx)$/,'');
  if(byModule.has(src))activeEntries.push(src);
}
const activeReachable=reachable(activeEntries);

const rng=[];
const snapshots=new Set(),restores=new Set();
const persistentModules=[];
for(const [key,{text,file}] of byModule){
  const randomCount=(text.match(/Math\.random\s*\(/g)||[]).length;
  if(randomCount)rng.push({file:`src/${key}${file.endsWith('.tsx')?'.tsx':'.ts'}`,count:randomCount});
  const snap=[...text.matchAll(/export\s+function\s+(snapshot[A-Z][A-Za-z0-9_]*)\s*\(/g)].map(m=>m[1]);
  const restore=[...text.matchAll(/export\s+function\s+(restore[A-Z][A-Za-z0-9_]*)\s*\(/g)].map(m=>m[1]);
  for(const name of snap)snapshots.add(name.slice('snapshot'.length));
  for(const name of restore)restores.add(name.slice('restore'.length));
  if(snap.length&&restore.length)persistentModules.push({module:key,snapshotFunctions:snap,restoreFunctions:restore,reachableFromDaily:dailyReachable.has(key),reachableFromActiveApp:activeReachable.has(key)});
}
rng.sort((a,b)=>b.count-a.count||a.file.localeCompare(b.file));
const rngCalls=rng.reduce((a,x)=>a+x.count,0);
const maxDirectRandomCalls=12;
const snapshotWithoutRestore=[...snapshots].filter(x=>!restores.has(x)).sort();
const restoreWithoutSnapshot=[...restores].filter(x=>!snapshots.has(x)).sort();

// Any stateful engine reachable through an active game surface must participate in a canonical save surface.
// Daily reachability catches simulation chains; active-app reachability additionally catches UI/event-driven consequence engines.
const saveHostNames=['save-game.ts','world-save-schema-v2.ts','save-beta-ui-v1.ts'];
const saveHosts=saveHostNames.map(name=>fs.readFileSync(path.join(srcRoot,name),'utf8')).join('\n');
for(const x of persistentModules)x.persisted=x.snapshotFunctions.some(name=>saveHosts.includes(name))||x.restoreFunctions.some(name=>saveHosts.includes(name));
const transitivePersistentModules=persistentModules.filter(x=>x.reachableFromDaily).sort((a,b)=>a.module.localeCompare(b.module));
const activePersistentModules=persistentModules.filter(x=>x.reachableFromActiveApp).sort((a,b)=>a.module.localeCompare(b.module));
const unpersistedTransitiveModules=transitivePersistentModules.filter(x=>!x.persisted);
const unpersistedActiveModules=activePersistentModules.filter(x=>!x.persisted);

console.log('=== TOUCHLINE ECOSYSTEM INTEGRATION AUDIT ===');
console.log(`advanceOneDay tick calls: ${tickCalls.length}`);
console.log(`Repeated tick functions: ${repeated.length}`);
for(const [name,count] of repeated)console.log(`  ${name} x${count} | ${allowedRepeatedTicks.get(name)??'UNREGISTERED'}`);
console.log(`Active legacy-named imports: ${legacyImports.length}`);
for(const name of legacyImports)console.log(`  ${name} | ${allowedActiveLegacy.get(name)??'UNREGISTERED'}`);
console.log(`Source files using Math.random(): ${rng.length} (${rngCalls} calls; ceiling=${maxDirectRandomCalls})`);
for(const x of rng.slice(0,25))console.log(`  ${x.file}: ${x.count}`);
console.log(`Snapshot families without matching restore name: ${snapshotWithoutRestore.length}`);
for(const x of snapshotWithoutRestore)console.log(`  snapshot${x}`);
console.log(`Restore families without matching snapshot name: ${restoreWithoutSnapshot.length}`);
for(const x of restoreWithoutSnapshot)console.log(`  restore${x}`);
console.log(`Active HTML entrypoints audited: ${activeEntries.length}; reachable modules: ${activeReachable.size}`);
console.log(`Transitive daily stateful modules with snapshot/restore: ${transitivePersistentModules.length}`);
for(const x of transitivePersistentModules)console.log(`  DAILY ${x.module}: ${x.persisted?'PERSISTED':'MISSING SAVE PATH'} | ${x.snapshotFunctions.join(', ')}`);
console.log(`Active-app stateful modules with snapshot/restore: ${activePersistentModules.length}`);
for(const x of activePersistentModules)console.log(`  ACTIVE ${x.module}: ${x.persisted?'PERSISTED':'MISSING SAVE PATH'} | ${x.snapshotFunctions.join(', ')}`);

const report={generatedAt:new Date().toISOString(),tickCalls,repeated:repeated.map(([name,count])=>({name,count,rationale:allowedRepeatedTicks.get(name)})),unexpectedRepeated:unexpectedRepeated.map(([name,count])=>({name,count})),staleAllowlist:staleAllowlist.map(([name,rationale])=>({name,rationale})),legacyImports,unexpectedLegacy,rng,rngCalls,maxDirectRandomCalls,snapshotWithoutRestore,restoreWithoutSnapshot,activeEntries,activeReachableCount:activeReachable.size,transitivePersistentModules,activePersistentModules,unpersistedTransitiveModules,unpersistedActiveModules};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/ecosystem-integration-audit.json'),JSON.stringify(report,null,2));

if(unexpectedRepeated.length)throw new Error(`Unregistered repeated daily ticks: ${unexpectedRepeated.map(([name,count])=>`${name} x${count}`).join(', ')}`);
if(unexpectedLegacy.length)throw new Error(`Unreviewed legacy-named runtime imports in daily simulation: ${unexpectedLegacy.join(', ')}`);
if(staleAllowlist.length)throw new Error(`Daily tick phase allowlist is stale: ${staleAllowlist.map(([name])=>name).join(', ')}`);
if(rngCalls>maxDirectRandomCalls)throw new Error(`Direct Math.random() debt regressed: ${rngCalls} calls exceeds ceiling ${maxDirectRandomCalls}. Use worldRandom/deterministicRandom for new simulation randomness.`);
if(unpersistedTransitiveModules.length)throw new Error(`Transitive daily stateful engines missing from save paths: ${unpersistedTransitiveModules.map(x=>x.module).join(', ')}`);
if(unpersistedActiveModules.length)throw new Error(`Active-app stateful engines missing from save paths: ${unpersistedActiveModules.map(x=>x.module).join(', ')}`);
