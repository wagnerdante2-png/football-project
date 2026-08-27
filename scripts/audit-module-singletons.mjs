import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(e.name)&&!e.name.endsWith('.d.ts'))files.push(p)}}
walk(srcRoot);

const byModule=new Map();
for(const file of files){const rel=path.relative(srcRoot,file).replaceAll('\\','/');const key=rel.replace(/\.(ts|tsx)$/,'');byModule.set(key,{file,text:fs.readFileSync(file,'utf8')})}
function resolveLocal(fromKey,spec){if(!spec.startsWith('.'))return null;const base=path.posix.normalize(path.posix.join(path.posix.dirname(fromKey),spec));if(byModule.has(base))return base;if(byModule.has(`${base}/index`))return`${base}/index`;return null}
function localImports(key){const node=byModule.get(key);if(!node)return[];const specs=[];for(const m of node.text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g))specs.push(m[1]);return specs.map(s=>resolveLocal(key,s)).filter(Boolean)}
function reachable(starts){const seen=new Set(),stack=[...starts];while(stack.length){const key=stack.pop();if(!key||seen.has(key)||!byModule.has(key))continue;seen.add(key);for(const dep of localImports(key))stack.push(dep)}return seen}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const activeEntries=[];for(const m of html.matchAll(/<script[^>]+type=['"]module['"][^>]+src=['"]([^'"]+)['"]/g)){const key=m[1].replace(/^\//,'').replace(/^src\//,'').replace(/\.(ts|tsx)$/,'');if(byModule.has(key))activeEntries.push(key)}
const active=reachable(activeEntries);

const suspiciousName=/(state|states|cache|pending|running|loaded|history|events|queue|memory|registry|profiles|records|feed|status|current|active|last|counter|sequence|store|runtime|session|matches|hydrated|report)/i;
const candidates=[];
function initializerKind(init){if(!init)return'none';if(ts.isNewExpression(init)&&ts.isIdentifier(init.expression)){const n=init.expression.text;if(n==='WeakMap'||n==='WeakSet')return'weak-world-safe';if(n==='Map'||n==='Set')return n.toLowerCase()}if(ts.isArrayLiteralExpression(init))return'array';if(ts.isObjectLiteralExpression(init))return'object';return'other'}
function mutationCount(text,name){const e=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const patterns=[`\\b${e}\\.(?:push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\\s*\\(`,`\\b${e}\\s*(?:\\+\\+|--|[+\\-*/]?=)`];return patterns.reduce((sum,p)=>sum+((text.match(new RegExp(p,'g'))||[]).length),0)}
for(const [key,{file,text}] of byModule){if(!active.has(key))continue;const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);for(const stmt of source.statements){if(!ts.isVariableStatement(stmt))continue;const isLet=(stmt.declarationList.flags&ts.NodeFlags.Let)!==0;for(const decl of stmt.declarationList.declarations){if(!ts.isIdentifier(decl.name))continue;const name=decl.name.text,kind=initializerKind(decl.initializer);if(kind==='weak-world-safe')continue;const mutations=mutationCount(text,name);const suspicious=suspiciousName.test(name);if(!isLet&&!['map','set','array','object'].includes(kind))continue;if(!isLet&&!mutations&&!suspicious)continue;const pos=source.getLineAndCharacterOfPosition(decl.getStart(source));candidates.push({module:key,file:`src/${path.relative(srcRoot,file).replaceAll('\\','/')}`,line:pos.line+1,name,kind,isLet,mutations,suspicious})}}
}
candidates.sort((a,b)=>(b.mutations-a.mutations)||(Number(b.suspicious)-Number(a.suspicious))||a.file.localeCompare(b.file)||a.line-b.line);
const highRisk=candidates.filter(x=>x.mutations>0&&x.suspicious);
console.log('=== TOUCHLINE MODULE SINGLETON STATE INVENTORY ===');
console.log(`Active reachable modules: ${active.size}`);
console.log(`Module-scope mutable candidates: ${candidates.length}`);
console.log(`High-risk mutable singleton candidates: ${highRisk.length}`);
for(const x of highRisk.slice(0,80))console.log(`  HIGH ${x.file}:${x.line} ${x.name} kind=${x.kind} let=${x.isLet} mutations=${x.mutations}`);
for(const x of candidates.filter(x=>!highRisk.includes(x)).slice(0,80))console.log(`  INFO ${x.file}:${x.line} ${x.name} kind=${x.kind} let=${x.isLet} mutations=${x.mutations}`);
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/module-singletons-audit.json'),JSON.stringify({generatedAt:new Date().toISOString(),activeReachableCount:active.size,candidates,highRisk},null,2));
