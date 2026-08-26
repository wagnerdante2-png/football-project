import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name)&&!e.name.endsWith('.d.ts'))files.push(p)}}
walk(srcRoot);
const rel=p=>path.relative(root,p).replaceAll('\\','/');
const srcSet=new Set(files.map(rel));
const imports=new Map();
const importedBy=new Map([...srcSet].map(f=>[f,new Set()]));
const importRe=/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
function resolve(from,spec){if(!spec.startsWith('.'))return null;const base=path.posix.normalize(path.posix.join(path.posix.dirname(from),spec));for(const c of [base,`${base}.ts`,`${base}.tsx`,`${base}/index.ts`,`${base}/index.tsx`])if(srcSet.has(c))return c;return null}
for(const f of srcSet){const text=fs.readFileSync(path.join(root,f),'utf8');const deps=new Set();for(const m of text.matchAll(importRe)){const spec=m[1]||m[2];const r=resolve(f,spec);if(r){deps.add(r);importedBy.get(r)?.add(f)}}imports.set(f,deps)}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entries=[];
for(const m of html.matchAll(/<script[^>]+type=['"]module['"][^>]+src=['"]([^'"]+)['"]/g)){const s=m[1].replace(/^\//,'');const r=resolve('index.html',`./${s}`)||s;if(srcSet.has(r))entries.push(r)}
const desktopMain='electron/main.cjs';
const reachable=new Set();
const stack=[...entries];
while(stack.length){const f=stack.pop();if(!f||reachable.has(f))continue;reachable.add(f);for(const d of imports.get(f)||[])stack.push(d)}

const unreachable=[...srcSet].filter(f=>!reachable.has(f)).sort();
const roots=unreachable.filter(f=>(importedBy.get(f)?.size||0)===0);
const referencedOnlyByUnreachable=unreachable.filter(f=>(importedBy.get(f)?.size||0)>0);
const uiLike=unreachable.filter(f=>/(ui|view|screen|shell|visual|workspace|bootstrap|main|manager\.ts$)/i.test(f));
const engineLike=unreachable.filter(f=>!uiLike.includes(f)&&/(engine|world|manager|player|club|competition|match|transfer|scout|medical|training|staff|career|finance|econom|social|human|press|news|school|national|international|contract|agent|retire|development|academy|youth|governance|recruit)/i.test(f));

console.log('=== TOUCHLINE MODULE COVERAGE AUDIT ===');
console.log(`Source modules: ${srcSet.size}`);
console.log(`Active HTML entrypoints: ${entries.length}`);
for(const e of entries)console.log(`  ENTRY ${e}`);
console.log(`Reachable from active app: ${reachable.size}`);
console.log(`Unreachable from active app: ${unreachable.length}`);
console.log(`Unreachable root modules (zero importers): ${roots.length}`);
console.log(`Unreachable engine/domain candidates: ${engineLike.length}`);
console.log(`Unreachable UI/legacy candidates: ${uiLike.length}`);
console.log('\n--- UNREACHABLE ENGINE / DOMAIN CANDIDATES ---');
for(const f of engineLike)console.log(`${f} | imported-by=${[...(importedBy.get(f)||[])].join(',')||'NONE'}`);
console.log('\n--- UNREACHABLE UI / LEGACY CANDIDATES ---');
for(const f of uiLike)console.log(`${f} | imported-by=${[...(importedBy.get(f)||[])].join(',')||'NONE'}`);
console.log('\n--- ALL UNREACHABLE ROOTS ---');
for(const f of roots)console.log(f);
console.log('\n--- ACTIVE REACHABLE MODULES ---');
for(const f of [...reachable].sort())console.log(f);
console.log(`\nDesktop entry exists: ${fs.existsSync(path.join(root,desktopMain))?'YES':'NO'} (${desktopMain})`);

const report={generatedAt:new Date().toISOString(),sourceModules:srcSet.size,entrypoints:entries,reachable:[...reachable].sort(),unreachable,roots,engineLike,uiLike,referencedOnlyByUnreachable};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/module-coverage-audit.json'),JSON.stringify(report,null,2));
