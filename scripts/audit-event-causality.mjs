import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(e.name)&&!e.name.endsWith('.d.ts'))files.push(p)}}
walk(srcRoot);

const byModule=new Map();
for(const file of files){const rel=path.relative(srcRoot,file).replaceAll('\\','/'),key=rel.replace(/\.(ts|tsx)$/,'');byModule.set(key,{file,text:fs.readFileSync(file,'utf8')})}
function resolveLocal(fromKey,spec){if(!spec.startsWith('.'))return null;const base=path.posix.normalize(path.posix.join(path.posix.dirname(fromKey),spec));if(byModule.has(base))return base;if(byModule.has(`${base}/index`))return `${base}/index`;return null}
function localImports(key){const node=byModule.get(key);if(!node)return[];return [...node.text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map(m=>resolveLocal(key,m[1])).filter(Boolean)}
function reachable(starts){const seen=new Set(),stack=[...starts];while(stack.length){const key=stack.pop();if(!key||seen.has(key)||!byModule.has(key))continue;seen.add(key);for(const dep of localImports(key))stack.push(dep)}return seen}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entries=[];
for(const m of html.matchAll(/<script[^>]+type=['"]module['"][^>]+src=['"]([^'"]+)['"]/g)){const src=m[1].replace(/^\//,'').replace(/^src\//,'').replace(/\.(ts|tsx)$/,'');if(byModule.has(src))entries.push(src)}
const active=reachable(entries);
const producers=new Map(),consumers=new Map();
function add(map,type,module){let set=map.get(type);if(!set){set=new Set();map.set(type,set)}set.add(module)}
function literals(text){return [...text.matchAll(/['"]([A-Za-z][A-Za-z0-9_-]+)['"]/g)].map(m=>m[1])}

for(const key of active){const text=byModule.get(key)?.text??'';
  for(const m of text.matchAll(/(?:emitWorldEvent|queueWorldEvent)\s*\([^,]+,\s*\{[\s\S]{0,280}?\btype\s*:\s*['"]([^'"]+)['"]/g))add(producers,m[1],key);
  for(const m of text.matchAll(/onWorldEvent\s*\([^,]+,\s*['"]([^'"]+)['"]/g))add(consumers,m[1],key);
  for(const m of text.matchAll(/\b(?:event|e)\.type\s*={2,3}\s*['"]([^'"]+)['"]/g))add(consumers,m[1],key);
  for(const m of text.matchAll(/\[([^\]]{0,700})\]\.includes\(\s*(?:event|e)\.type\s*\)/g))for(const t of literals(m[1]))add(consumers,t,key);
}

const produced=[...producers.keys()].sort(),consumed=[...consumers.keys()].sort();
const orphans=produced.filter(t=>!consumers.has(t));
const critical=['MatchCompleted','PlayerInjured','DressingRoomCrisis','TransferRequested','ManagerInteractionResolved','PromiseBroken','RecruitmentRejected','NegotiationLeaked'];
const missingCritical=critical.filter(t=>producers.has(t)&&!consumers.has(t));
const criticalStatus=critical.map(type=>({type,producers:[...(producers.get(type)??[])].sort(),consumers:[...(consumers.get(type)??[])].sort()}));

console.log('=== TOUCHLINE EVENT CAUSALITY AUDIT ===');
console.log(`Active entrypoints: ${entries.length}; reachable modules: ${active.size}`);
console.log(`Produced event types: ${produced.length}; consumed event types: ${consumed.length}; produced without detected consumer: ${orphans.length}`);
for(const x of criticalStatus)console.log(`  ${x.type}: producers=${x.producers.length} consumers=${x.consumers.length}`);
if(orphans.length){console.log('Produced event types without detected consumer (inventory):');for(const type of orphans.slice(0,80))console.log(`  ${type} <- ${[...producers.get(type)].sort().join(', ')}`)}

const report={generatedAt:new Date().toISOString(),entries,activeReachableCount:active.size,producedEventTypes:produced,consumedEventTypes:consumed,orphanProducedEventTypes:orphans,criticalStatus,missingCriticalConsumers:missingCritical};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/event-causality-audit.json'),JSON.stringify(report,null,2));
if(missingCritical.length)throw new Error(`Critical ecosystem events have producers but no detected consumers: ${missingCritical.join(', ')}`);
