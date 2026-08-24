import type { World } from './engine';
import { emitWorldEvent } from './event-bus';
import { clubDressingRoom } from './dressing-room';
import { adjustRelationship, institutionalState } from './institutional-memory';
import { managerByClub, recordManagerCareerEvent } from './manager-character';
import { managerInteractionState } from './manager-interactions';

export type OnboardingStage='board'|'squad'|'media';
export type OnboardingChoice={id:string;stage:OnboardingStage;title:string;description:string;boardTrust?:number;boardAlignment?:number;authority?:number;squadTrust?:number;squadRespect?:number;mediaPressure?:number;supporterPressure?:number;personalitySignals?:Record<string,number>};
export type ManagerOnboardingState={clubId:string;managerId:string;date:string;resolved:Partial<Record<OnboardingStage,string>>;completed:boolean};
const states=new WeakMap<World,Map<string,ManagerOnboardingState>>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));

export const onboardingChoices:OnboardingChoice[]=[
  {id:'board_results',stage:'board',title:'Resultados primeiro',description:'Comprometer-se com competitividade imediata e cobrança por desempenho.',boardTrust:2,boardAlignment:3,authority:2,supporterPressure:-1},
  {id:'board_project',stage:'board',title:'Construir um projeto',description:'Pedir tempo para implantar método, identidade e desenvolvimento de elenco.',boardAlignment:4,boardTrust:1,authority:1},
  {id:'board_youth',stage:'board',title:'Apostar na base',description:'Assumir publicamente que jovens terão caminho real para a equipe principal.',boardAlignment:2,boardTrust:1,supporterPressure:-1},
  {id:'board_autonomy',stage:'board',title:'Pedir autonomia',description:'Deixar claro que decisões esportivas precisam de espaço para funcionar.',boardTrust:-1,boardAlignment:-1,authority:4},
  {id:'squad_listen',stage:'squad',title:'Ouvir antes de cobrar',description:'Abrir a primeira reunião reconhecendo hierarquia e experiências do elenco.',squadTrust:5,squadRespect:2,authority:0},
  {id:'squad_standard',stage:'squad',title:'Definir padrões',description:'Estabelecer disciplina, comportamento e exigência competitiva desde o primeiro dia.',squadTrust:-1,squadRespect:5,authority:5},
  {id:'squad_merit',stage:'squad',title:'Ninguém tem vaga garantida',description:'Prometer meritocracia e competição aberta por espaço.',squadTrust:1,squadRespect:3,authority:3},
  {id:'squad_protect',stage:'squad',title:'Proteger o grupo',description:'Assumir que críticas públicas serão absorvidas pelo treinador enquanto o elenco responder internamente.',squadTrust:5,squadRespect:3,authority:2},
  {id:'media_ambitious',stage:'media',title:'“Viemos para vencer”',description:'Elevar expectativa pública logo na apresentação.',mediaPressure:5,supporterPressure:-2,boardTrust:1},
  {id:'media_calm',stage:'media',title:'“O trabalho falará por nós”',description:'Reduzir promessas e evitar transformar a chegada em espetáculo.',mediaPressure:-3,supporterPressure:1},
  {id:'media_identity',stage:'media',title:'“Teremos identidade”',description:'Prometer um time reconhecível pela forma de jogar, sem cravar resultados.',mediaPressure:1,supporterPressure:-1,boardAlignment:1},
  {id:'media_youth',stage:'media',title:'“A base terá espaço”',description:'Colocar desenvolvimento de jovens no centro do discurso público.',mediaPressure:1,supporterPressure:-2}
];

function map(world:World){let m=states.get(world);if(!m){m=new Map();states.set(world,m);}return m;}
export function managerOnboardingState(world:World,clubId:string):ManagerOnboardingState|undefined{return map(world).get(clubId);}
export function startManagerOnboarding(world:World,clubId:string,date=`${world.season}-07-25`):ManagerOnboardingState|undefined{
  const manager=managerByClub(world,clubId);if(!manager)return;let s=map(world).get(clubId);if(s)return s;s={clubId,managerId:manager.id,date,resolved:{},completed:false};map(world).set(clubId,s);return s;
}
function applyPressure(world:World,clubId:string,date:string,media=0,supporters=0){const p=institutionalState(world).pressure.get(clubId);if(!p)return;p.media=Math.round(clamp(p.media+media));p.supporters=Math.round(clamp(p.supporters+supporters));p.updatedDate=date;}
export function resolveOnboardingChoice(world:World,clubId:string,choiceId:string):boolean{
  const s=startManagerOnboarding(world,clubId);const c=onboardingChoices.find(x=>x.id===choiceId);if(!s||!c||s.resolved[c.stage])return false;
  const m=managerByClub(world,clubId);if(!m)return false;s.resolved[c.stage]=c.id;
  if(c.boardTrust)adjustRelationship(world,clubId,'trust',c.boardTrust,s.date,`Primeira reunião: ${c.title}.`);
  if(c.boardAlignment)adjustRelationship(world,clubId,'alignment',c.boardAlignment,s.date,`Primeira reunião: ${c.title}.`);
  const room=clubDressingRoom(world,clubId);if(room&&c.authority)room.managerAuthority=clamp(room.managerAuthority+c.authority);
  if(c.squadTrust||c.squadRespect){const relations=managerInteractionState(world).relationships;for(const [key,r] of relations){if(!key.startsWith(`${clubId}:`))continue;r.trust=clamp(r.trust+(c.squadTrust??0));r.respect=clamp(r.respect+(c.squadRespect??0));}}
  applyPressure(world,clubId,s.date,c.mediaPressure??0,c.supporterPressure??0);
  recordManagerCareerEvent(world,m.id,s.date,'onboardingDecision',`${c.stage}: ${c.title}.`,1);
  emitWorldEvent(world,{type:'ManagerInteractionResolved',date:s.date,actorIds:[m.id],clubIds:[clubId],importance:2,summary:`Primeiro dia do treinador: ${c.title}.`,payload:{onboarding:true,stage:c.stage,choiceId:c.id}});
  s.completed=Boolean(s.resolved.board&&s.resolved.squad&&s.resolved.media);
  return true;
}
export function onboardingChoicesForStage(stage:OnboardingStage){return onboardingChoices.filter(c=>c.stage===stage);}
