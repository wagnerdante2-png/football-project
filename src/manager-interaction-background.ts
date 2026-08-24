import type { World } from './engine';
import { onWorldEvent } from './event-bus';
import { managerByClub } from './manager-character';
import { managerInteractionState, type InteractionOption, type ManagerInteraction } from './manager-interactions';

const wired=new WeakSet<World>();
const option=(id:string,label:string,description:string,tone:InteractionOption['tone'],values:Partial<Omit<InteractionOption,'id'|'label'|'description'|'tone'>>={}):InteractionOption=>({id,label,description,tone,trust:0,respect:0,friction:0,morale:0,authority:0,publicity:0,disciplineSignal:0,empathySignal:0,confrontationSignal:0,...values});
const hasCourse=(world:World,clubId:string,id:string)=>managerByClub(world,clubId)?.education.courses.includes(id as never)??false;
const add=(i:ManagerInteraction,o:InteractionOption)=>{if(!i.options.some(x=>x.id===o.id))i.options.push(o);};

function enrich(world:World,i:ManagerInteraction):void{
  const m=managerByClub(world,i.clubId);if(!m)return;
  if(hasCourse(world,i.clubId,'sportsPsychology')&&['personal','support','performance','conflict','dressingRoom'].includes(i.kind))add(i,option('psychology_plan','Abordagem psicológica estruturada','Usar técnicas de escuta, regulação emocional e plano de acompanhamento em vez de uma reação pontual.','supportive',{trust:6,respect:3,friction:-5,morale:4,authority:1,empathySignal:4}));
  if(hasCourse(world,i.clubId,'performanceAnalysis')&&i.kind==='performance')add(i,option('evidence_review','Revisar dados com o atleta','Apresentar evidências de desempenho, contexto tático e metas objetivas antes da cobrança.','calm',{trust:2,respect:5,friction:-1,morale:1,authority:2,disciplineSignal:1}));
  if(hasCourse(world,i.clubId,'dataAnalysis')&&['performance','dressingRoom'].includes(i.kind))add(i,option('data_context','Contextualizar com dados','Separar percepção, ruído externo e evidência mensurável antes de decidir.','calm',{trust:2,respect:4,friction:-2,authority:1}));
  if(hasCourse(world,i.clubId,'refereeing')&&i.kind==='discipline')add(i,option('rules_review','Revisar o episódio pela ótica disciplinar','Explicar limites de conduta, risco de punição e impacto esportivo com base nas regras.','firm',{trust:0,respect:5,friction:1,morale:-1,authority:4,disciplineSignal:4}));
  if(hasCourse(world,i.clubId,'mediaRelations')&&i.kind==='media')add(i,option('controlled_statement','Emitir comunicado controlado','Responder apenas o necessário, protegendo jogador e clube sem alimentar o ciclo de notícias.','public',{trust:3,respect:3,friction:-1,morale:1,authority:2,publicity:-10,empathySignal:1}));
  if(hasCourse(world,i.clubId,'leadership')&&['conflict','dressingRoom','leadership'].includes(i.kind))add(i,option('leadership_circle','Reunir núcleo de liderança','Envolver capitão e líderes relevantes numa solução coletiva com responsabilidade compartilhada.','calm',{trust:2,respect:5,friction:-4,authority:3,disciplineSignal:2,empathySignal:1}));
  if(hasCourse(world,i.clubId,'sportsLaw')&&['contract','transfer','media','discipline'].includes(i.kind))add(i,option('legal_review','Consultar enquadramento jurídico','Evitar uma decisão precipitada antes de revisar contrato, regulamento e risco jurídico.','calm',{trust:1,respect:3,friction:-1,authority:2,publicity:-2}));
  if(hasCourse(world,i.clubId,'footballManagement')&&['transfer','contract','discipline'].includes(i.kind))add(i,option('institutional_protocol','Aplicar protocolo institucional','Alinhar treinador, direção e política do clube antes da resposta definitiva.','firm',{trust:0,respect:4,friction:1,authority:4,disciplineSignal:3}));
  if((hasCourse(world,i.clubId,'sportsScience')||hasCourse(world,i.clubId,'fitness'))&&['personal','performance'].includes(i.kind))add(i,option('load_assessment','Avaliar carga física e mental','Revisar fadiga, recuperação e condição antes de atribuir o problema somente à atitude do jogador.','calm',{trust:4,respect:3,friction:-2,morale:2,empathySignal:2}));
  if(m.knowledge.media>=80&&i.kind==='media')add(i,option('off_record_bridge','Trabalhar bastidor com fonte confiável','Reduzir especulação por meio de relação profissional com jornalistas de confiança, sem exposição direta.','silent',{trust:1,respect:2,publicity:-7,authority:1}));
  if(m.knowledge.manManagement>=82&&i.severity>=7)add(i,option('tailored_conversation','Conversa personalizada ao perfil do atleta','Adaptar linguagem, nível de cobrança e suporte ao histórico específico da relação.','calm',{trust:5,respect:5,friction:-4,morale:3,authority:2,empathySignal:3,disciplineSignal:1}));
}

export function wireManagerBackgroundInteractions(world:World):void{
  if(wired.has(world))return;wired.add(world);
  onWorldEvent(world,'ManagerInteractionOpened',(event)=>{const id=String(event.payload.interactionId??'');if(!id)return;const interaction=managerInteractionState(world).interactions.find(i=>i.id===id);if(interaction)enrich(world,interaction);});
}
