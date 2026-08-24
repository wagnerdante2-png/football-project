import { createWorld } from './engine';
import { mountManagerCreation } from './manager-creation-ui';
import { userManager } from './manager-character';
import { managerProfileSummary } from './manager-biography-effects';

const app=document.querySelector<HTMLDivElement>('#app')!;
const world=createWorld();
mountManagerCreation(world,app,(_world,clubId)=>{
  const m=userManager(world),club=world.clubs.find(c=>c.id===clubId),summary=managerProfileSummary(world,clubId);
  app.innerHTML=`<div class="manager-creation-shell"><section class="mc-hero compact"><div class="mc-kicker">PERSONAGEM CRIADO</div><h1>${m?.name??'Treinador'}</h1><p>Sua jornada está pronta para ser conectada ao runtime principal. Esta rota existe para testar o Character Creator e o prólogo sem interferir no restante da interface atual.</p></section><section class="mc-principles"><article><b>Clube inicial</b><span>${club?.name??clubId}</span></article><article><b>Autoridade inicial</b><span>${summary?.authority??'—'}</span></article><article><b>Experiência</b><span>${summary?.experienceYears??0} anos registrados</span></article></section><section class="mc-opening"><h3>Estado do personagem</h3><p>Conhecimento tático: ${m?.knowledge.tactics.toFixed(0)??'—'} · treino: ${m?.knowledge.training.toFixed(0)??'—'} · gestão humana: ${m?.knowledge.manManagement.toFixed(0)??'—'}</p><p>Reputação doméstica: ${m?.reputation.domestic.toFixed(0)??'—'} · prestígio como ex-jogador: ${m?.reputation.formerPlayerPrestige.toFixed(0)??'—'}</p><p>Formação favorita: ${m?.tactical.favoriteFormation??'—'} · mentalidade: ${m?.tactical.mentality??'—'}</p></section><button class="mc-primary large" onclick="location.reload()">Criar outro treinador</button></div>`;
});
