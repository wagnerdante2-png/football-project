import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.cwd(),'public','data','openfootball');
const baseSources=[
 ['openfootball/leagues','leagues.txt'],
 ['openfootball/leagues','south-america/leagues.txt'],
 ['openfootball/leagues','south-america/brazil/br.leagues.txt'],
 ['openfootball/leagues','europe/leagues.txt'],
 ['openfootball/leagues','europe/england/eng.leagues.txt'],
 ['openfootball/leagues','europe/germany/de.leagues.txt'],

 ['openfootball/clubs','south-america/brazil/br.clubs.txt'],['openfootball/clubs','south-america/brazil/br.stadiums.txt'],
 ['openfootball/clubs','south-america/argentina/ar.clubs.txt'],['openfootball/clubs','south-america/argentina/ar.stadiums.txt'],
 ['openfootball/clubs','south-america/colombia/co.clubs.txt'],['openfootball/clubs','south-america/colombia/co.stadiums.txt'],

 ['openfootball/clubs','europe/england/eng.clubs.txt'],['openfootball/clubs','europe/england/eng.stadiums.txt'],
 ['openfootball/clubs','europe/germany/de.clubs.txt'],['openfootball/clubs','europe/germany/de.stadiums.txt'],
 ['openfootball/clubs','europe/spain/es.clubs.txt'],['openfootball/clubs','europe/spain/es.stadiums.txt'],
 ['openfootball/clubs','europe/italy/it.clubs.txt'],['openfootball/clubs','europe/italy/it.stadiums.txt'],
 ['openfootball/clubs','europe/france/fr.clubs.txt'],['openfootball/clubs','europe/france/fr.stadiums.txt'],
 ['openfootball/clubs','europe/portugal/pt.clubs.txt'],['openfootball/clubs','europe/portugal/pt.stadiums.txt'],
 ['openfootball/clubs','europe/netherlands/nl.clubs.txt'],['openfootball/clubs','europe/netherlands/nl.stadiums.txt'],
 ['openfootball/clubs','europe/belgium/be.clubs.txt']
];
const history=[];
for(let year=2018;year<=2026;year++)for(const level of [1,2])history.push(['openfootball/south-america',`brazil/${year}_br${level}.txt`]);
const sources=[...new Map([...baseSources,...history].map(x=>[x.join(':'),x])).values()];
const raw=(repo,file)=>`https://raw.githubusercontent.com/${repo}/master/${file}`;
async function get(repo,file){const res=await fetch(raw(repo,file),{headers:{'user-agent':'football-project-data-sync'}});if(res.status===404)return null;if(!res.ok)throw new Error(`${res.status} ${repo}/${file}`);return await res.text()}
async function main(){await fs.mkdir(root,{recursive:true});const manifest=[],missing=[];for(const [repo,file] of sources){const text=await get(repo,file);if(text===null){missing.push({repo,path:file,status:404});console.warn(`skip 404 ${repo}/${file}`);continue}const target=path.join(root,repo.replace('/','__'),file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text,'utf8');manifest.push({repo,path:file,bytes:Buffer.byteLength(text),license:'CC0-1.0',syncedAt:new Date().toISOString()});console.log(`synced ${repo}/${file}`)}await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({version:3,sources:manifest,missing},null,2),'utf8');console.log(`done: ${manifest.length} files (${missing.length} missing) -> ${root}`)}
main().catch(err=>{console.error(err);process.exitCode=1});
