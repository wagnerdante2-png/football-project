import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(e.name)&&!e.name.endsWith('.d.ts'))files.push(p)}}
walk(srcRoot);

const refs=[];
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  const rel=path.relative(root,file).replaceAll('\\','/');
  const lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(!/(?:globalThis|window)\s*(?:as\s+any\s*)?[.\[]|__touchline[A-Za-z0-9_]*/.test(line))continue;
    const keys=[...line.matchAll(/__(?:touchline)[A-Za-z0-9_]*/g)].map(m=>m[0]);
    const usesGlobalThis=/\bglobalThis\b/.test(line);
    const usesWindow=/\bwindow\b/.test(line);
    const writesGlobal=/\b(?:globalThis|window)(?:\s+as\s+any)?\s*(?:\.[A-Za-z_$][\w$]*|\[['"][^'"]+['"]\])\s*=/.test(line)||/\b(?:globalThis|window)(?:\s+as\s+any)?\s*(?:\.[A-Za-z_$][\w$]*|\[['"][^'"]+['"]\])\s*\?\?=/.test(line);
    refs.push({file:rel,line:i+1,keys,usesGlobalThis,usesWindow,writesGlobal,text:line.trim().slice(0,240)});
  }
}

// __touchlineWorld is the sole browser-global bridge allowed to identify the active World for UI/runtime adapters.
// Gameplay state, histories, queues, counters and memories must remain World-scoped instead of hiding on window/globalThis.
const gameplayGlobalRefs=refs.filter(x=>x.keys.some(k=>k!=='__touchlineWorld'));
const worldBridgeRefs=refs.filter(x=>x.keys.includes('__touchlineWorld'));
const rawGlobalThisRefs=refs.filter(x=>x.usesGlobalThis);
const globalWrites=refs.filter(x=>x.writesGlobal);

console.log('=== TOUCHLINE BROWSER-GLOBAL STATE AUDIT ===');
console.log(`Source files scanned: ${files.length}`);
console.log(`Global/window references: ${refs.length}`);
console.log(`__touchlineWorld bridge references: ${worldBridgeRefs.length}`);
console.log(`Other __touchline* references: ${gameplayGlobalRefs.length}`);
console.log(`globalThis references: ${rawGlobalThisRefs.length}`);
console.log(`Direct global/window writes: ${globalWrites.length}`);
for(const x of refs)console.log(`  ${x.file}:${x.line} ${x.writesGlobal?'WRITE':'READ '} keys=${x.keys.join(',')||'-'} | ${x.text}`);

const report={generatedAt:new Date().toISOString(),refs,worldBridgeRefs,gameplayGlobalRefs,rawGlobalThisRefs,globalWrites};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/global-state-audit.json'),JSON.stringify(report,null,2));

if(gameplayGlobalRefs.length)throw new Error(`Hidden Touchline browser-global state is forbidden. Review: ${gameplayGlobalRefs.map(x=>`${x.file}:${x.line} ${x.keys.join(',')}`).join(' | ')}`);
