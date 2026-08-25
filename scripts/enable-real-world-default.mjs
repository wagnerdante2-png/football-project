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
  s=s.replace('let world:World=createWorld();','let world:World=createBrazilRealWorld2026();');
  s=s.replace('WORLD ENGINE V1','BRAZIL REAL WORLD · ENGINE V1');
  await fs.writeFile(path,s);
}

await Promise.all([patchMain(),patchGame()]);
console.log('real world default enabled in active and legacy shells');
