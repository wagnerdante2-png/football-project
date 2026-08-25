import fs from 'node:fs/promises';

async function patchMain(){
  const path='src/main.ts';let s=await fs.readFile(path,'utf8');
  if(!s.includes("from './real-world-v1'")) s=s.replace("import { advanceToNextSeason, careerState, isAcademyPlayer, seasonFinished, simulateSeasons } from './lifecycle';", "import { advanceToNextSeason, careerState, isAcademyPlayer, seasonFinished, simulateSeasons } from './lifecycle';\nimport { createBrazilRealWorld2026, realWorldBootstrapInfo } from './real-world-v1';");
  s=s.replace('let world: World = createWorld();','let world: World = createBrazilRealWorld2026();');
  s=s.replace("<span class=\"eyebrow\">TEMPORADA ${world.season}</span><h1>Centro do Manager</h1><p>O mundo agora envelhece, desenvolve jogadores, aposenta veteranos e recebe novas gerações da base todos os anos.</p>","<span class=\"eyebrow\">TEMPORADA ${world.season} · ${realWorldBootstrapInfo.competition}</span><h1>Centro do Manager</h1><p>O universo principal agora nasce com clubes reais do futebol brasileiro. Elencos reais só são vinculados quando a fonte factual é verificada; até lá, atletas procedurais preservam a integridade da simulação.</p>");
  s=s.replace("world = createWorld(); selectedClubId = world.clubs[0].id;", "world = createBrazilRealWorld2026(); selectedClubId = world.clubs[0].id;");
  await fs.writeFile(path,s);
}

async function patchGame(){
  const path='src/game-ui-v1.ts';let s=await fs.readFile(path,'utf8');
  if(!s.includes("from './real-world-v1'")) s=s.replace("import { buildManagerCareerProfile } from './manager-career-profile';", "import { buildManagerCareerProfile } from './manager-career-profile';\nimport { createBrazilRealWorld2026 } from './real-world-v1';");
  if(!s.includes("from './verified-rosters-v1'")) s=s.replace("import { createBrazilRealWorld2026 } from './real-world-v1';", "import { createBrazilRealWorld2026 } from './real-world-v1';\nimport { hydrateVerifiedRosters, isVerifiedRuntimePlayer, runtimePlayerDob } from './verified-rosters-v1';");
  s=s.replace('let world:World=createWorld();','let world:World=createBrazilRealWorld2026();');
  s=s.replace('WORLD ENGINE V1','BRAZIL REAL WORLD · ENGINE V1');
  if(!s.includes('let rosterHydration=')) s=s.replace("let selectedClubId=world.clubs[0]?.id??'';", "let selectedClubId=world.clubs[0]?.id??'';\nlet rosterHydration={loaded:false,verifiedPlayers:0,clubsTouched:0};\nvoid hydrateVerifiedRosters(world).then(r=>{rosterHydration=r;if(r.loaded&&stage!=='login')render()});");
  s=s.replace("<span>Reputação ${c.reputation} · ${c.players.length} jogadores</span>","<span>Reputação ${c.reputation} · ${c.players.length} jogadores${c.players.some(isVerifiedRuntimePlayer)?' · elenco factual parcial':''}</span>");
  s=s.replace("<tr class=\"${xi.has(p.id)?'starter':''}\"><td>","<tr data-player-dob=\"${esc(runtimePlayerDob(p)??'')}\" data-player-origin=\"${isVerifiedRuntimePlayer(p)?'verified':'procedural'}\" class=\"${xi.has(p.id)?'starter':''}\"><td>");
  s=s.replace("<b>${esc(p.name)}</b></div></td>","<b>${esc(p.name)}${isVerifiedRuntimePlayer(p)?'<em class=\"verified-player\" title=\"Vínculo de clube verificado em fonte CC0\">REAL</em>':''}</b></div></td>");
  s=s.replace("<button class=\"player-chip\" style=\"left:${positions[i]?.[0]??50}%;top:${positions[i]?.[1]??50}%\">","<button class=\"player-chip\" data-player-dob=\"${esc(runtimePlayerDob(p)??'')}\" data-player-origin=\"${isVerifiedRuntimePlayer(p)?'verified':'procedural'}\" style=\"left:${positions[i]?.[0]??50}%;top:${positions[i]?.[1]??50}%\">");
  await fs.writeFile(path,s);
}

await Promise.all([patchMain(),patchGame()]);
console.log('real world default and verified roster hydration enabled');
