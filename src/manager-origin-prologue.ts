import type { World } from './engine';
import { clubDressingRoom } from './dressing-room';
import { managerInitialAuthority, managerProfileSummary } from './manager-biography-effects';
import { managerByClub, type ManagerCharacter } from './manager-character';

export type FirstImpressionAudience='board'|'players'|'supporters'|'media'|'staff';
export type FirstImpression={audience:FirstImpressionAudience;score:number;label:'hostile'|'skeptical'|'neutral'|'positive'|'excited';headline:string;reason:string};
export type ManagerPrologue={managerId:string;clubId:string;title:string;subtitle:string;identity:string;careerSummary:string;footballIdentity:string;trainingIdentity:string;stakes:string[];firstImpressions:FirstImpression[];openingQuestions:string[];};

const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const label=(v:number):FirstImpression['label']=>v>=78?'excited':v>=62?'positive':v>=45?'neutral':v>=30?'skeptical':'hostile';
const formation=(m:ManagerCharacter)=>`${m.tactical.favoriteFormation}, ${m.tactical.mentality==='attacking'?'agressivo':m.tactical.mentality==='defensive'?'conservador':m.tactical.mentality==='positive'?'propositivo':'equilibrado'}`;
const styleWords=(m:ManagerCharacter)=>{
  const words:string[]=[];
  if(m.tactical.possessionPreference>=67)words.push('posse');
  if(m.tactical.pressingPreference>=70)words.push('pressão alta');
  if(m.tactical.counterAttack>=68)words.push('transições rápidas');
  if(m.tactical.directness>=68)words.push('jogo vertical');
  if(m.tactical.buildFromBack>=68)words.push('saída apoiada');
  if(m.tactical.youthUsage>=72)words.push('uso de jovens');
  return words.length?words.slice(0,3).join(', '):'equilíbrio entre fases do jogo';
};

function playingSummary(m:ManagerCharacter){
  if(m.playingLevel==='none')return 'sem carreira profissional como jogador';
  const years=m.playingCareer.reduce((s,e)=>s+Math.max(0,e.endYear-e.startYear),0),titles=m.playingCareer.reduce((s,e)=>s+e.titles.length,0),caps=m.playingCareer.filter(e=>e.captain).length;
  const level=m.playingLevel==='elite'?'ex-jogador de elite':m.playingLevel==='professional'?'ex-jogador profissional':m.playingLevel==='semiPro'?'ex-jogador semiprofissional':'ex-jogador amador';
  return `${level}, ${years} anos de carreira${titles?`, ${titles} título${titles>1?'s':''}`:''}${caps?', com experiência de capitania':''}`;
}
function educationSummary(m:ManagerCharacter){const licence=m.education.licence.replace('continental','Continental ').replace('regional','Regional ');const courses=m.education.courses.length;return `${licence}${courses?` · ${courses} curso${courses>1?'s':''} complementar${courses>1?'es':''}`:''}`;}

function impressions(world:World,m:ManagerCharacter):FirstImpression[]{
  const club=world.clubs.find(c=>c.id===m.currentClubId);const authority=managerInitialAuthority(world,m.currentClubId);const room=clubDressingRoom(world,m.currentClubId);const rep=(m.reputation.domestic+m.reputation.coachingPrestige)/2;const fame=m.reputation.formerPlayerPrestige;const knowledge=(m.knowledge.tactics+m.knowledge.training+m.knowledge.manManagement)/3;
  const board=clamp(30+rep*.35+knowledge*.26+m.personality.pragmatism*.1+m.knowledge.financialAwareness*.08-(club?.reputation??60)*.1);
  const players=clamp(authority*.62+m.knowledge.manManagement*.18+m.personality.assertiveness*.1+(room?.culture.discipline??50)*.03);
  const supporters=clamp(28+fame*.38+rep*.28+m.ambition.trophyAmbition*.12+(m.social.clubSupported===club?.name?8:0));
  const media=clamp(25+m.reputation.mediaProfile*.38+m.knowledge.media*.22+fame*.18+m.personality.mediaSkill*.12);
  const staff=clamp(30+knowledge*.38+m.personality.diplomacy*.18+m.personality.adaptability*.16+m.knowledge.networking*.08);
  const mk=(audience:FirstImpressionAudience,score:number,headline:string,reason:string):FirstImpression=>({audience,score:Math.round(score),label:label(score),headline,reason});
  return[
    mk('board',board,board>=65?'A diretoria vê potencial no projeto':'A diretoria ainda quer provas','Prestígio, preparação, pragmatismo e entendimento institucional moldam a autonomia inicial.'),
    mk('players',players,players>=65?'O vestiário presta atenção':'O vestiário testará sua autoridade','Carreira anterior, idade, conhecimento de pessoas e postura definem a credibilidade inicial.'),
    mk('supporters',supporters,supporters>=65?'A torcida recebeu o nome com entusiasmo':'A torcida começa cautelosa','Fama, ambição, identificação e expectativa por títulos afetam a recepção popular.'),
    mk('media',media,media>=65?'A apresentação domina o noticiário':'A imprensa trata a chegada com cautela','Perfil midiático, fama anterior e capacidade de comunicação influenciam o tom da cobertura.'),
    mk('staff',staff,staff>=65?'A comissão vê um líder preparado':'A comissão ainda precisa entender seu método','Conhecimento técnico, adaptabilidade e diplomacia influenciam a adesão dos profissionais do clube.')
  ];
}

export function buildManagerPrologue(world:World,clubId:string):ManagerPrologue|undefined{
  const m=managerByClub(world,clubId);const club=world.clubs.find(c=>c.id===clubId);if(!m||!club)return;
  const summary=managerProfileSummary(world,clubId);
  const stakes:string[]=[];
  if((summary?.authority??50)<52)stakes.push('Construir autoridade rapidamente sem depender de reputação prévia.');
  if(m.tactical.youthUsage>=72)stakes.push('Transformar a promessa de uso da base em decisões reais, mesmo sob pressão por resultados.');
  if(m.personality.discipline>=72)stakes.push('Equilibrar disciplina forte com a necessidade de não perder o vestiário.');
  if(m.personality.empathy>=72)stakes.push('Manter proximidade humana sem ser interpretado como permissivo.');
  if(m.reputation.formerPlayerPrestige>=75)stakes.push('Provar que prestígio como jogador também pode virar competência como treinador.');
  if(m.playingLevel==='none')stakes.push('Ganhar legitimidade esportiva diante de profissionais que tiveram carreira de alto nível.');
  if(m.knowledge.dataAnalysis>=75)stakes.push('Converter vantagem analítica em decisões compreensíveis para atletas, torcida e direção.');
  if(stakes.length<3)stakes.push('Definir uma identidade própria sem ficar preso às preferências declaradas na criação.');
  const openingQuestions=[
    'Quanto você está disposto a adaptar suas ideias ao elenco que recebeu?',
    'Quem será a primeira liderança do vestiário a comprar — ou desafiar — seu projeto?',
    'Quando resultado e filosofia entrarem em conflito, qual dos dois cederá primeiro?'
  ];
  return{managerId:m.id,clubId,title:`A jornada de ${m.name} começa no ${club.name}`,subtitle:'Sua biografia abre portas e cria resistências. Daqui em diante, cada decisão passa a reescrever esse personagem.',identity:`${m.age} anos · ${m.social.nationality} · ${playingSummary(m)}`,careerSummary:`${educationSummary(m)} · conhecimento tático ${Math.round(m.knowledge.tactics)} · gestão humana ${Math.round(m.knowledge.manManagement)} · reputação doméstica ${Math.round(m.reputation.domestic)}`,footballIdentity:`${formation(m)} · prioridade em ${styleWords(m)}`,trainingIdentity:`Treino ${m.training.intensity>=70?'intenso':m.training.intensity<=40?'controlado':'moderado'}, com ênfase em ${m.training.tactical>=m.training.technical&&m.training.tactical>=m.training.physical?'tática':m.training.technical>=m.training.physical?'técnica':'preparação física'}.`,stakes:stakes.slice(0,5),firstImpressions:impressions(world,m),openingQuestions};
}
