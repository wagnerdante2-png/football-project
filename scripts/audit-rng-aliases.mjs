import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())walk(p);
    else if(/\.tsx?$/.test(entry.name)&&!entry.name.endsWith('.d.ts'))files.push(p);
  }
}
walk(srcRoot);

const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const findings=[];

for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  const aliases=[];
  const seen=new Set();
  const register=(name,kind,definition)=>{
    const key=`${name}:${kind}:${definition}`;
    if(!seen.has(key)){seen.add(key);aliases.push({name,kind,definition});}
  };

  for(const match of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*\)\s*=>\s*Math\.random\s*\(\s*\)/g))
    register(match[1],'arrow-wrapper',match[0]);
  for(const match of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*Math\.random\b/g))
    register(match[1],'direct-alias',match[0]);
  for(const match of text.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{\s*return\s+Math\.random\s*\(\s*\)\s*;?\s*\}/g))
    register(match[1],'function-wrapper',match[0]);

  for(const alias of aliases){
    const callPattern=new RegExp(`\\b${escapeRegExp(alias.name)}\\s*\\(`,'g');
    let calls=(text.match(callPattern)||[]).length;
    if(alias.kind==='function-wrapper')calls=Math.max(0,calls-1);
    findings.push({
      file:path.relative(root,file).replaceAll('\\','/'),
      alias:alias.name,
      kind:alias.kind,
      calls,
      hiddenCalls:Math.max(0,calls),
    });
  }
}

findings.sort((a,b)=>b.hiddenCalls-a.hiddenCalls||a.file.localeCompare(b.file)||a.alias.localeCompare(b.alias));
const hiddenCalls=findings.reduce((sum,item)=>sum+item.hiddenCalls,0);
const filesWithAliases=new Set(findings.map(item=>item.file)).size;

console.log('=== TOUCHLINE ALIASED RNG AUDIT ===');
console.log(`Files with Math.random aliases/wrappers: ${filesWithAliases}`);
console.log(`Alias definitions: ${findings.length}`);
console.log(`Observed calls hidden behind aliases/wrappers: ${hiddenCalls}`);
for(const item of findings)console.log(`  ${item.file}: ${item.alias} [${item.kind}] => ${item.hiddenCalls} call(s)`);
if(!findings.length)console.log('  No aliased Math.random usage detected.');

const report={generatedAt:new Date().toISOString(),filesWithAliases,aliasDefinitions:findings.length,hiddenCalls,findings};
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
fs.writeFileSync(path.join(root,'tmp/rng-alias-audit.json'),JSON.stringify(report,null,2));

// Baseline discovery gate: this audit intentionally reports the current hidden debt first.
// Once the baseline is observed in CI, a ceiling is ratcheted to that exact value so new debt fails.
