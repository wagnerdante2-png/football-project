import { createWorld } from './engine';
import { mountManagerCreation } from './manager-creation-ui';
import { userManager } from './manager-character';
import { managerProfileSummary } from './manager-biography-effects';
import { onboardingChoicesForStage, resolveOnboardingChoice, startManagerOnboarding, type OnboardingStage } from './manager-onboarding';

const app=document.querySelector<HTMLDivElement>('#app')!;
const world=createWorld();

function esc(s:string){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));}
function renderFirstDay(clubId:string,stage:OnboardingStage='board'){
  const m=userManager(world),club=world.clubs.find(c=>c.id===clubId),summary=managerProfileSummary(world,clubId),state=startManagerOnboarding(world,clubId);if(!m||!club||!state)return;
  const stages:OnboardingStage[]=['board','squad','media'];const index=stages.indexOf(stage);const title=stage==='board'?'Primeira reunião com a diretoria':stage==='squad'?'Primeiro encontro com o elenco':'Apresentação à imprensa';
  const intro=stage==='board'?'Antes de falar em escalação ou treino, o clube quer entender o que você considera prioridade.':stage==='squad'?'O grupo está observando seu tom, sua segurança e a forma como você pretende exercer autoridade.':'As primeiras frases públicas vão moldar expectativa, pressão e narrativa sobre sua chegada.';
  app.innerHTML=`<div class="manager-creation-shell"><section class="mc-hero compact"><div class="mc-kicker">PRIMEIRO DIA · ${index+1}/3</div><h1>${esc(title)}</h1><p>${esc(intro)}</p></section><section class="mc-principles"><article><b>${esc(m.name)}</b><span>${esc(club.name)} · autoridade inicial ${summary?.authority??'—'}</span></article><article><b>Identidade</b><span>${esc(m.tactical.favoriteFormation)} · ${m.tactical.mentality} · ${m.personality.discipline>=70?'disciplinador':m.personality.empathy>=70?'próximo':'equilibrado'}</span></article><article><b>Importante</b><span>Esta não é uma pergunta cosmética. A resposta altera relações e expectativas iniciais.</span></article></section><div class="mc-archetypes">${onboardingChoicesForStage(stage).map(c=>`<button data-choice="${c.id}"><b>${esc(c.title)}</b><span>${esc(c.description)}</span></button>`).join('')}</div></div>`;
  app.querySelectorAll<HTMLElement>('[data-choice]').forEach(el=>el.addEventListener('click',()=>{resolveOnboardingChoice(world,clubId,el.dataset.choice!);const next=stages[index+1];if(next)renderFirstDay(clubId,next);else renderReady(clubId);}));
}
function renderReady(clubId:string){
  const m=userManager(world),club=world.clubs.find(c=>c.id===clubId),summary=managerProfileSummary(world,clubId);if(!m||!club)return;
  app.innerHTML=`<div class="manager-creation-shell"><section class="mc-hero compact"><div class="mc-kicker">JORNADA INICIADA</div><h1>${esc(m.name)} assumiu o ${esc(club.name)}</h1><p>Seu personagem não terminou de ser criado. A partir daqui, ele continuará sendo moldado por resultados, relações, cursos, crises, convicções abandonadas e ideias que sobreviverem ao tempo.</p></section><section class="mc-principles"><article><b>Autoridade</b><span>${summary?.authority??'—'} no início da carreira</span></article><article><b>Conhecimento</b><span>Tática ${m.knowledge.tactics.toFixed(0)} · treino ${m.knowledge.training.toFixed(0)} · pessoas ${m.knowledge.manManagement.toFixed(0)}</span></article><article><b>Reputação</b><span>Doméstica ${m.reputation.domestic.toFixed(0)} · treinador ${m.reputation.coachingPrestige.toFixed(0)}</span></article></section><section class="mc-opening"><h3>Princípio do jogo</h3><p>A ficha técnica definiu quem você era ao chegar. As decisões do primeiro dia já começaram a definir quem você está se tornando.</p><p>Esta rota de desenvolvimento mantém o mesmo <code>World</code>, então personagem, IA dos outros treinadores, primeiras relações e decisões de onboarding permanecem no estado para os próximos módulos.</p></section><button class="mc-primary large" onclick="location.reload()">Testar outra origem</button></div>`;
}

mountManagerCreation(world,app,(_world,clubId)=>renderFirstDay(clubId));
