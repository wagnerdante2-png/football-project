import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.cwd(),'data','openfootball');
const sources=[
 ['openfootball/leagues','leagues.txt'],
 ['openfootball/leagues','south-america/leagues.txt'],
 ['openfootball/leagues','south-america/brazil/br.leagues.txt'],
 ['openfootball/leagues','europe/leagues.txt'],
 ['openfootball/leagues','europe/england/eng.leagues.txt'],
 ['openfootball/leagues','europe/germany/de.leagues.txt'],
 ['openfootball/clubs','south-america/brazil/br.clubs.txt'],
 ['openfootball/clubs','south-america/brazil/br.stadiums.txt'],
 ['openfootball/clubs','europe/england/eng.clubs.txt'],
 ['openfootball/clubs','europe/england/eng.stadiums.txt']
];
const raw=(repo,file)=>`https://raw.githubusercontent.com/${repo}/master/${file}`;
async function get(repo,file){const res=await fetch(raw(repo,file),{headers:{'user-agent':'football-project-data-sync'}});if(!res.ok)throw new Error(`${res.status} ${repo}/${file}`);return await res.text()}
async function main(){await fs.mkdir(root,{recursive:true});const manifest=[];for(const [repo,file] of sources){const text=await get(repo,file),target=path.join(root,repo.replace('/','__'),file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text,'utf8');manifest.push({repo,path:file,bytes:Buffer.byteLength(text),license:'CC0-1.0',syncedAt:new Date().toISOString()});console.log(`synced ${repo}/${file}`)}await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({version:1,sources:manifest},null,2),'utf8');console.log(`done: ${manifest.length} files -> ${root}`)}
main().catch(err=>{console.error(err);process.exitCode=1});
