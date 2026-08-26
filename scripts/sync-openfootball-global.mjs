import fs from 'node:fs/promises';
import path from 'node:path';
const ROOT=path.resolve('public/data/openfootball-global');
const API='https://api.github.com/repos';
const repos=['openfootball/players','openfootball/clubs','openfootball/leagues','openfootball/world','openfootball/south-america','openfootball/europe','openfootball/england','openfootball/deutschland','openfootball/espana','openfootball/italy','openfootball/champions-league','openfootball/worldcup','openfootball/euro','openfootball/copa-america'];
const allow=(repo,p)=>{
 if(repo==='openfootball/players')return /\.players\.txt$/i.test(p);
 if(repo==='openfootball/clubs')return /\.(clubs|stadiums)\.txt$/i.test(p)||/^0-world\/[^/]+\.txt$/i.test(p);
 if(repo==='openfootball/leagues')return /(^|\/)leagues\.txt$/i.test(p)||/\.leagues\.txt$/i.test(p);
 return /\.txt$/i.test(p)&&!/(README|NOTES|LICENSE|CHANGELOG)/i.test(p);
};
const raw=(repo,p)=>`https://raw.githubusercontent.com/${repo}/master/${p}`;
async function json(url){const r=await fetch(url,{headers:{'user-agent':'football-project-global-sync','accept':'application/vnd.github+json'}});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()}
async function text(url){const r=await fetch(url,{headers:{'user-agent':'football-project-global-sync'}});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.text()}
async function main(){await fs.mkdir(ROOT,{recursive:true});const manifest={version:1,generatedAt:new Date().toISOString(),license:'CC0-1.0',repos:[],files:[],counts:{files:0,bytes:0,playersFiles:0,clubFiles:0,stadiumFiles:0,leagueFiles:0,tournamentFiles:0}};for(const repo of repos){const meta=await json(`${API}/${repo}`),branch=meta.default_branch||'master',tree=await json(`${API}/${repo}/git/trees/${branch}?recursive=1`),files=tree.tree.filter(x=>x.type==='blob'&&allow(repo,x.path));manifest.repos.push({repo,branch,commit:tree.sha,files:files.length});for(const f of files){const body=await text(`https://raw.githubusercontent.com/${repo}/${branch}/${f.path}`),target=path.join(ROOT,repo.replace('/','__'),f.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,body,'utf8');const bytes=Buffer.byteLength(body);manifest.files.push({repo,branch,path:f.path,sha:f.sha,bytes,license:'CC0-1.0'});manifest.counts.files++;manifest.counts.bytes+=bytes;if(/\.players\.txt$/i.test(f.path))manifest.counts.playersFiles++;else if(/\.clubs\.txt$/i.test(f.path))manifest.counts.clubFiles++;else if(/\.stadiums\.txt$/i.test(f.path))manifest.counts.stadiumFiles++;else if(/league/i.test(f.path))manifest.counts.leagueFiles++;else manifest.counts.tournamentFiles++;console.log(`${repo}/${f.path}`)}}await fs.writeFile(path.join(ROOT,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest.counts))}
main().catch(e=>{console.error(e);process.exitCode=1});
