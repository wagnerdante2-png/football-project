import {readFile} from 'node:fs/promises';
import path from 'node:path';
const ROOT=path.resolve('public/data/people');
const read=async name=>JSON.parse(await readFile(path.join(ROOT,name),'utf8'));
const [players,staff,manifest,conflicts]=await Promise.all([read('real-players-2026.json'),read('real-staff-2026.json'),read('manifest-2026.json'),read('conflicts-2026.json')]);
const issues=[],positions=new Set(['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST']),allowedLicenses=new Set(['CC0','public-fact-reference','unknown']),external=new Map(),bio=new Map();
if(!Array.isArray(players)||players.length===0)issues.push('real-players-2026.json vazio ou inválido');
if(!Array.isArray(staff))issues.push('real-staff-2026.json inválido');
if(!manifest||manifest.cutover!=='2026')issues.push('manifesto 2026 ausente/inválido');
if(!Array.isArray(conflicts))issues.push('conflicts-2026.json inválido');
for(const [i,p] of players.entries()){
 if(!p?.name||typeof p.name!=='string')issues.push(`player[${i}] sem nome`);
 if(!positions.has(p?.position))issues.push(`player[${i}] posição inválida: ${p?.position}`);
 if(!Array.isArray(p?.nationalityCountryIds)||!p.nationalityCountryIds.length)issues.push(`player[${i}] sem nacionalidade`);
 if(p.currentAbility!==undefined||p.potentialAbility!==undefined||p.attributes!==undefined)issues.push(`player[${i}] contém rating factual não autorizado no artefato de origem`);
 for(const prov of p?.provenance??[]){if(!allowedLicenses.has(prov?.license))issues.push(`player[${i}] licença inválida: ${prov?.license}`);if(!prov?.source||!prov?.snapshotDate)issues.push(`player[${i}] proveniência incompleta`)}
 for(const [provider,id] of Object.entries(p?.externalIds??{})){const key=`${provider}:${id}`,old=external.get(key);if(old!==undefined)issues.push(`external id duplicado ${key}: ${old}/${i}`);else external.set(key,i)}
 if(p.dateOfBirth){const key=`${String(p.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}|${p.dateOfBirth}|${[...(p.nationalityCountryIds??[])].sort().join(',')}`,old=bio.get(key);if(old!==undefined)issues.push(`bio duplicada ${key}: ${old}/${i}`);else bio.set(key,i)}
}
for(const [i,s] of staff.entries()){if(!s?.name)issues.push(`staff[${i}] sem nome`);for(const prov of s?.provenance??[])if(!allowedLicenses.has(prov?.license))issues.push(`staff[${i}] licença inválida: ${prov?.license}`)}
if(manifest.mode==='licensed-only'){
 for(const p of players)for(const prov of p.provenance??[])if(prov.license!=='CC0')issues.push(`modo licensed-only contém origem não CC0: ${prov.source}`);
 if(staff.length)issues.push('modo licensed-only não deve inventar ou vendorizar staff sem fonte licenciada');
}
const result={ok:issues.length===0,players:players.length,staff:staff.length,conflicts:conflicts.length,mode:manifest.mode,issues};
console.log(JSON.stringify(result,null,2));if(issues.length)process.exitCode=1;
