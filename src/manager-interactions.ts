import type { Player, World } from './engine';
import { emitWorldEvent, onWorldEvent, type WorldEvent } from './event-bus';
import { humanLifeState } from './human-life';
import { clubDressingRoom } from './dressing-room';
import { institutionalState } from './institutional-memory';

export type ManagerAxis='discipline'|'empathy'|'patience'|'assertiveness'|'publicProtection'|'diplomacy'|'confrontation'|'pragmatism'|'consistency'|'mediaSkill'|'adaptability'|'forgiveness';
export type ManagerProfile={managerId:string;clubId:string;discipline:number;empathy:number;patience:number;assertiveness:number;publicProtection:number;diplomacy:number;confrontation:number;pragmatism:number;consistency:number;mediaSkill:number;adaptability:number;forgiveness:number;stress:number;authority:number;reputation:number;createdSeason:number;lastEvolutionDate:string};
export type PlayerManagerRelationship={clubId:string;managerId:string;playerId:string;trust:number;respect:number;warmth:number;openness:number;friction:number;fear:number;credibility:number;history:InteractionMemory[]};
export type InteractionMemory={date:string;interactionId:string;optionId:string;summary:string;trustDelta:number;respectDelta:number;frictionDelta:number;moraleDelta:number;publicityDelta:number};
export type InteractionKind='discipline'|'support'|'performance'|'media'|'conflict'|'transfer'|'dressingRoom'|'personal'|'contract'|'leadership';
export type InteractionOption={id:string;label:string;description:string;tone:'supportive'|'calm'|'firm'|'harsh'|'public'|'silent';requires?:Partial<Record<ManagerAxis,number>>;trust:number;respect:number;friction:number;morale:number;authority:number;publicity:number;disciplineSignal:number;empathySignal:number;confrontationSignal:number;};
export type ManagerInteraction={id:string;clubId:string;managerId:string;playerId?:string;sourceEventId:string;kind:InteractionKind;date:string;severity:number;publicity:number;truth:'confirmed'|'rumour'|'false'|'unknown';context:string;status:'pending'|'resolved'|'expired';options:InteractionOption[];chosenOptionId?:string;resolvedDate?:string;aiControlled:boolean;deadlineDate:string;};
export type ManagerInteractionState={profiles:Map<string,ManagerProfile>;relationships:Map<string,PlayerManagerRelationship>;interactions:ManagerInteraction[];wired:boolean;lastTick?:string;};
export type ManagerInteractionSnapshot={profiles:[string,ManagerProfile][];relationships:[string,PlayerManagerRelationship][];interactions:ManagerInteraction[];lastTick?:string;};

const states=new WeakMap<World,ManagerInteractionState>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0)};
const pseudo=(seed:number,o:number)=>{const x=Math.sin(seed*12.9898+o*78.233)*43758.5453;return x-Math.floor(x)};
const addDays=(iso:string,d:number)=>{const x=new Date(`${iso}T12:00:00Z`);x.setUTCDate(x.getUTCDate()+d);return x.toISOString().slice(0,10)};
const relKey=(clubId:string,playerId:string)=>`${clubId}:${playerId}`;
function findPlayer(world:World,id?:string):Player|undefined{if(!id)return;for(const c of world.clubs){const p=c.players.find(x=>x.id===id);if(p)return p;}return undefined;}

function initialProfile(clubId:string,season:number):ManagerProfile{const s=hash(`manager-profile-${clubId}`);return{managerId:`manager-${clubId}`,clubId,discipline:Math.round(38+pseudo(s,1)*52),empathy:Math.round(30+pseudo(s,2)*60),patience:Math.round(28+pseudo(s,3)*62),assertiveness:Math.round(38+pseudo(s,4)*55),publicProtection:Math.round(28+pseudo(s,5)*65),diplomacy:Math.round(28+pseudo(s,6)*65),confrontation:Math.round(18+pseudo(s,7)*68),pragmatism:Math.round(35+pseudo(s,8)*58),consistency:Math.round(35+pseudo(s,9)*58),mediaSkill:Math.round(28+pseudo(s,10)*65),adaptability:Math.round(30+pseudo(s,11)*62),forgiveness:Math.round(25+pseudo(s,12)*65),stress:25,reputation:50,authority:58,createdSeason:season,lastEvolutionDate:`${season}-07-25`};}
function initialRelationship(clubId:string,managerId:string,playerId:string):PlayerManagerRelationship{const s=hash(`${clubId}-${playerId}-manager-rel`);return{clubId,managerId,playerId,trust:Math.round(48+pseudo(s,1)*25),respect:Math.round(50+pseudo(s,2)*25),warmth:Math.round(42+pseudo(s,3)*30),openness:Math.round(38+pseudo(s,4)*35),friction:Math.round(5+pseudo(s,5)*20),fear:Math.round(5+pseudo(s,6)*18),credibility:60,history:[]};}
export function managerInteractionState(world:World):ManagerInteractionState{let s=states.get(world);if(!s){s={profiles:new Map(),relationships:new Map(),interactions:[],wired:false};states.set(world,s);}for(const club of world.clubs){if(!s.profiles.has(club.id))s.profiles.set(club.id,initialProfile(club.id,world.season));const m=s.profiles.get(club.id)!;for(const p of club.players){const key=relKey(club.id,p.id);if(!s.relationships.has(key))s.relationships.set(key,initialRelationship(club.id,m.managerId,p.id));}}if(!s.wired){wireInteractions(world);s.wired=true;}return s;}
export function managerProfile(world:World,clubId:string){return managerInteractionState(world).profiles.get(clubId);}
export function managerPlayerRelationship(world:World,clubId:string,playerId:string){return managerInteractionState(world).relationships.get(relKey(clubId,playerId));}
export function setManagerCreationProfile(world:World,clubId:string,patch:Partial<Record<ManagerAxis,number>>):void{const p=managerProfile(world,clubId);if(!p)return;for(const [k,v] of Object.entries(patch) as [ManagerAxis,number][])p[k]=clamp(v);}

function option(id:string,label:string,description:string,tone:InteractionOption['tone'],values:Partial<Omit<InteractionOption,'id'|'label'|'description'|'tone'>>={}):InteractionOption{return{id,label,description,tone,trust:0,respect:0,friction:0,morale:0,authority:0,publicity:0,disciplineSignal:0,empathySignal:0,confrontationSignal:0,...values};}
function commonSupport():InteractionOption[]{return[
  option('private_support','Conversar em particular','Apoiar sem retirar responsabilidade do atleta.','supportive',{trust:5,respect:2,friction:-3,morale:4,empathySignal:2}),
  option('professional_support','Oferecer apoio profissional','Encaminhar suporte e combinar expectativas claras.','calm',{trust:4,respect:3,friction:-2,morale:3,authority:1,empathySignal:2,disciplineSignal:1}),
  option('give_space','Dar espaço por alguns dias','Evitar pressão adicional e observar a evolução.','silent',{trust:1,morale:2,empathySignal:1})
];}
function disciplineOptions(severity:number,publicity:number):InteractionOption[]{const rows=[
  option('ignore_private','Tratar como vida privada','Não agir enquanto não houver impacto profissional.','silent',{trust:1,respect:-1,authority:-1,disciplineSignal:-1}),
  option('private_warning','Advertência reservada','Cobrar comportamento sem exposição pública.','firm',{trust:-1,respect:3,friction:2,morale:-1,authority:3,disciplineSignal:3}),
  option('formal_warning','Advertência formal','Registrar a ocorrência e exigir mudança de conduta.','firm',{trust:-3,respect:5,friction:4,morale:-2,authority:5,disciplineSignal:5}),
  option('drop_squad','Retirar temporariamente da equipe','Consequência esportiva clara por quebra de disciplina.','harsh',{trust:-7,respect:severity>=7?6:1,friction:8,morale:-6,authority:8,disciplineSignal:7,confrontationSignal:3}),
  option('public_defense_private_charge','Proteger em público e cobrar em privado','Reduz exposição externa sem ser permissivo internamente.','public',{trust:4,respect:4,friction:1,morale:2,authority:3,publicity:-8,disciplineSignal:3,empathySignal:2}),
  option('public_criticism','Criticar publicamente','Transformar o episódio em mensagem pública de disciplina.','public',{trust:-10,respect:severity>=8?4:-4,friction:12,morale:-7,authority:5,publicity:12,disciplineSignal:6,confrontationSignal:7})
];return rows.filter(x=>x.id!=='public_criticism'||publicity>=40||severity>=8);}
function performanceOptions():InteractionOption[]{return[
  option('encourage','Reforçar confiança','Mostrar confiança e pedir reação.','supportive',{trust:3,respect:1,morale:4,empathySignal:2}),
  option('firm_private','Cobrar em particular','Apontar queda de rendimento e exigir resposta.','firm',{trust:-1,respect:3,friction:2,morale:-1,authority:2,disciplineSignal:2}),
  option('bench','Tirar pressão e deixar no banco','Reduz exposição competitiva, mas ameaça o status.','calm',{trust:-2,respect:1,friction:2,morale:-2,authority:2}),
  option('challenge','Desafiar diretamente','Cobrança forte para atletas que respondem à pressão.','harsh',{trust:-3,respect:4,friction:4,morale:-2,authority:3,confrontationSignal:3})
];}
function conflictOptions():InteractionOption[]{return[
  option('mediate','Mediar pessoalmente','Ouvir envolvidos e buscar acordo.','calm',{trust:3,respect:3,friction:-4,authority:2,empathySignal:2}),
  option('captain_mediate','Usar a liderança do elenco','Pedir ao capitão para ajudar a conter o conflito.','calm',{trust:1,respect:2,friction:-2,authority:1}),
  option('separate','Separar os envolvidos','Reduz contato por alguns dias.','firm',{trust:-1,respect:2,friction:-1,authority:2,disciplineSignal:2}),
  option('zero_tolerance','Tolerância zero','Cobrança dura e ameaça de punição para nova ocorrência.','harsh',{trust:-5,respect:4,friction:5,morale:-3,authority:5,disciplineSignal:5,confrontationSignal:4})
];}
function mediaOptions():InteractionOption[]{return[
  option('no_comment','Não comentar','Evitar alimentar especulação.','silent',{publicity:-2}),
  option('protect','Proteger o atleta','Rejeitar exposição excessiva e preservar o jogador.','public',{trust:4,respect:2,morale:2,publicity:-5,empathySignal:2}),
  option('confirm_facts','Responder objetivamente','Confirmar apenas fatos conhecidos e encerrar o assunto.','calm',{respect:2,authority:1,publicity:-1}),
  option('distance','Distanciar o clube do episódio','Sinalizar que o comportamento não representa o clube.','public',{trust:-5,respect:3,friction:5,morale:-3,authority:4,publicity:4,disciplineSignal:4}),
  option('attack_media','Confrontar a imprensa','Questionar a fonte ou a abordagem do veículo.','public',{trust:2,respect:-1,friction:1,authority:1,publicity:8,confrontationSignal:5})
];}
function optionsFor(kind:InteractionKind,severity:number,publicity:number):InteractionOption[]{if(kind==='discipline')return disciplineOptions(severity,publicity);if(kind==='support'||kind==='personal')return commonSupport();if(kind==='performance')return performanceOptions();if(kind==='conflict'||kind==='dressingRoom')return conflictOptions();if(kind==='media')return mediaOptions();return[...performanceOptions(),...commonSupport().slice(0,1)];}

function classify(event:WorldEvent):{kind:InteractionKind;severity:number;publicity:number;truth:ManagerInteraction['truth'];playerId?:string;context:string}|undefined{
  const playerId=event.playerIds[0];
  if(event.type==='PersonalLifeEvent'){
    const type=String(event.payload.type??'');const severity=Number(event.payload.severity??event.importance*2);const publicity=Number(event.payload.publicity??0);const truth=String(event.payload.truth??'confirmed') as ManagerInteraction['truth'];
    if(['nightOut','lateNight','publicIncident','socialMediaBacklash'].includes(type))return{kind:'discipline',severity,publicity,truth,playerId,context:event.summary};
    if(['familyIllness','bereavement','relationshipConflict','breakup','paternityLeave','pregnancy'].includes(type))return{kind:'personal',severity,publicity,truth,playerId,context:event.summary};
    if(['relationshipRumour','publicRelationship','partnerRivalryPressure'].includes(type))return{kind:'media',severity,publicity,truth,playerId,context:event.summary};
  }
  if(event.type==='DressingRoomConcern')return{kind:'performance',severity:Math.max(4,event.importance*2),publicity:10,truth:'confirmed',playerId,context:event.summary};
  if(event.type==='DressingRoomCrisis')return{kind:'dressingRoom',severity:Math.max(6,Number(event.payload.crisisLevel??2)*2),publicity:35,truth:'confirmed',playerId,context:event.summary};
  if(event.type==='TransferRequested')return{kind:'transfer',severity:6,publicity:25,truth:'confirmed',playerId,context:event.summary};
  if(event.type==='MediaStoryPublished'&&playerId)return{kind:'media',severity:event.importance*2,publicity:55,truth:'unknown',playerId,context:event.summary};
  return undefined;
}
function shouldOpen(world:World,event:WorldEvent,c:{severity:number;publicity:number;playerId?:string;kind:InteractionKind}):boolean{
  if(!event.clubIds[0])return false;if(c.playerId&&!findPlayer(world,c.playerId))return false;
  const rel=c.playerId?managerPlayerRelationship(world,event.clubIds[0],c.playerId):undefined;const threshold=c.kind==='personal'?5:c.kind==='media'?4:3;
  return c.severity>=threshold||c.publicity>=45||(rel?.friction??0)>=55;
}
function createFromEvent(world:World,event:WorldEvent):void{const c=classify(event);if(!c||!shouldOpen(world,event,c))return;const clubId=event.clubIds[0];if(!clubId)return;const s=managerInteractionState(world);if(s.interactions.some(i=>i.sourceEventId===event.id))return;const p=s.profiles.get(clubId)!;const interaction:ManagerInteraction={id:`mi-${event.id}`,clubId,managerId:p.managerId,playerId:c.playerId,sourceEventId:event.id,kind:c.kind,date:event.date,severity:clamp(c.severity,1,10),publicity:clamp(c.publicity),truth:c.truth,context:c.context,status:'pending',options:optionsFor(c.kind,c.severity,c.publicity),aiControlled:true,deadlineDate:addDays(event.date,c.severity>=8?1:c.publicity>=60?2:4)};s.interactions.push(interaction);emitWorldEvent(world,{type:'ManagerInteractionOpened',date:event.date,clubIds:[clubId],playerIds:c.playerId?[c.playerId]:[],importance:c.severity>=8?4:2,summary:`Decisão do treinador necessária: ${c.context}`,payload:{interactionId:interaction.id,kind:c.kind,deadline:interaction.deadlineDate}});}

function scoreOption(world:World,i:ManagerInteraction,o:InteractionOption):number{const p=managerProfile(world,i.clubId)!;const player=i.playerId?findPlayer(world,i.playerId):undefined;const person=player?humanLifeState(world).people.get(player.id):undefined;const rel=i.playerId?managerPlayerRelationship(world,i.clubId,i.playerId):undefined;let score=50;
  score+=o.disciplineSignal*(p.discipline-50)/8+o.empathySignal*(p.empathy-50)/8+o.confrontationSignal*(p.confrontation-50)/8;
  if(o.tone==='supportive')score+=(p.empathy+p.patience-100)*.16;if(o.tone==='firm')score+=(p.assertiveness+p.discipline-100)*.15;if(o.tone==='harsh')score+=(p.confrontation+p.discipline-100)*.18;if(o.tone==='public')score+=(p.mediaSkill+p.publicProtection-100)*.08;
  score+=i.severity>=8?o.disciplineSignal*2:0;score+=i.truth==='rumour'||i.truth==='false'?Math.max(0,o.publicity<0?6:-6):0;score+=(person?.professionalism??55)>=70&&o.tone==='firm'?5:0;score+=(person?.temperament??55)<=35&&o.tone==='harsh'?-8:0;score+=(rel?.trust??55)>=70&&o.tone==='firm'?3:0;score+=(rel?.friction??10)>=60&&o.tone==='harsh'?-5:0;
  const room=clubDressingRoom(world,i.clubId);if(room?.culture.discipline&&room.culture.discipline>=70)score+=o.disciplineSignal*.7;if(room?.crisisLevel&&room.crisisLevel>=3&&o.id==='mediate')score+=8;
  const pressure=institutionalState(world).pressure.get(i.clubId);if((pressure?.media??0)>=70&&o.id==='no_comment')score+=6;if((pressure?.supporters??0)>=75&&o.id==='public_defense_private_charge')score-=3;
  score+=Math.random()*8;return score;}
function evolveProfile(p:ManagerProfile,o:InteractionOption,date:string):void{const move=(k:ManagerAxis,d:number)=>{p[k]=clamp(p[k]+d)};move('discipline',o.disciplineSignal*.05);move('empathy',o.empathySignal*.05);move('confrontation',o.confrontationSignal*.05);if(o.tone==='public')move('mediaSkill',.06);if(o.id==='mediate'||o.id==='professional_support')move('diplomacy',.05);if(o.id==='give_space')move('patience',.04);if(o.id==='drop_squad'||o.id==='zero_tolerance')move('assertiveness',.05);p.lastEvolutionDate=date;}
function applyResolution(world:World,i:ManagerInteraction,o:InteractionOption,date:string):void{const p=managerProfile(world,i.clubId)!;const player=i.playerId?findPlayer(world,i.playerId):undefined;const rel=i.playerId?managerPlayerRelationship(world,i.clubId,i.playerId):undefined;
  if(rel){const person=player?humanLifeState(world).people.get(player.id):undefined;let trust=o.trust,respect=o.respect,friction=o.friction,morale=o.morale;const temperament=person?.temperament??55,pro=person?.professionalism??55;
    if(o.tone==='harsh'&&temperament<40){trust-=3;friction+=3;morale-=2;}if(o.tone==='firm'&&pro>=70){respect+=3;morale+=1;}if(i.truth==='false'&&['public_criticism','formal_warning','drop_squad'].includes(o.id)){trust-=7;respect-=5;friction+=8;}if(i.severity>=8&&['ignore_private','give_space'].includes(o.id)){respect-=4;p.authority=clamp(p.authority-3);}if(i.kind==='personal'&&o.tone==='supportive'){trust+=3;friction-=2;}
    rel.trust=clamp(rel.trust+trust);rel.respect=clamp(rel.respect+respect);rel.friction=clamp(rel.friction+friction);rel.warmth=clamp(rel.warmth+o.empathySignal*.8-o.confrontationSignal*.6);rel.fear=clamp(rel.fear+Math.max(0,o.confrontationSignal)*.8);rel.openness=clamp(rel.openness+(o.tone==='supportive'||o.tone==='calm'?2:o.tone==='harsh'?-2:0));rel.credibility=clamp(rel.credibility+(i.truth==='confirmed'&&o.disciplineSignal>0?1:0)+(i.truth==='false'&&o.disciplineSignal>1?-4:0));
    if(player)player.morale=Math.round(clamp(player.morale+morale,20,100));rel.history.push({date,interactionId:i.id,optionId:o.id,summary:i.context,trustDelta:trust,respectDelta:respect,frictionDelta:friction,moraleDelta:morale,publicityDelta:o.publicity});if(rel.history.length>120)rel.history.shift();
  }
  p.authority=clamp(p.authority+o.authority);p.stress=clamp(p.stress+(o.tone==='harsh'?2:o.tone==='supportive'?-1:0));evolveProfile(p,o,date);i.status='resolved';i.chosenOptionId=o.id;i.resolvedDate=date;
  emitWorldEvent(world,{type:'ManagerInteractionResolved',date,clubIds:[i.clubId],playerIds:i.playerId?[i.playerId]:[],importance:i.severity>=8?4:2,summary:`Treinador decidiu: ${o.label}.`,payload:{interactionId:i.id,optionId:o.id,kind:i.kind,trust:o.trust,respect:o.respect,friction:o.friction,morale:o.morale,publicity:o.publicity}});
  if(i.playerId&&rel)emitWorldEvent(world,{type:'PlayerManagerRelationshipChanged',date,clubIds:[i.clubId],playerIds:[i.playerId],importance:Math.abs(o.trust)+Math.abs(o.friction)>=10?3:1,summary:'Relação entre treinador e atleta foi alterada.',payload:{interactionId:i.id,trust:rel.trust,respect:rel.respect,friction:rel.friction,managerAuthority:p.authority}});
}
export function resolveManagerInteraction(world:World,interactionId:string,optionId:string,date?:string):boolean{const s=managerInteractionState(world);const i=s.interactions.find(x=>x.id===interactionId&&x.status==='pending');if(!i)return false;const o=i.options.find(x=>x.id===optionId);if(!o)return false;applyResolution(world,i,o,date??i.date);return true;}
function autoResolve(world:World,i:ManagerInteraction,date:string):void{const ranked=i.options.map(o=>({o,score:scoreOption(world,i,o)})).sort((a,b)=>b.score-a.score);const pick=ranked[0]?.o;if(pick)applyResolution(world,i,pick,date);}

function dailyEvolution(world:World,date:string):void{const s=managerInteractionState(world);for(const p of s.profiles.values()){const pressure=institutionalState(world).pressure.get(p.clubId);const room=clubDressingRoom(world,p.clubId);const pressureLoad=((pressure?.board??30)+(pressure?.media??30)+(pressure?.supporters??30))/3;p.stress=clamp(p.stress*.97+Math.max(0,pressureLoad-50)*.045+Math.max(0,(room?.crisisLevel??0)-1)*.7-.35);if(p.stress>78){p.patience=clamp(p.patience-.015);p.confrontation=clamp(p.confrontation+.012);}if(p.stress<35){p.patience=clamp(p.patience+.006);p.adaptability=clamp(p.adaptability+.004);}for(const club of world.clubs.filter(c=>c.id===p.clubId))for(const player of club.players){const r=s.relationships.get(relKey(club.id,player.id));if(!r)continue;r.friction=clamp(r.friction-.06);r.fear=clamp(r.fear-.025);r.warmth=clamp(r.warmth+(r.trust>65?.012:0));}}
}
export function tickManagerInteractions(world:World,date:string):void{const s=managerInteractionState(world);if(s.lastTick===date)return;s.lastTick=date;dailyEvolution(world,date);for(const i of s.interactions.filter(x=>x.status==='pending')){if(i.aiControlled&&i.date<date&&Math.random()<.55)autoResolve(world,i,date);else if(i.deadlineDate<=date){if(i.aiControlled)autoResolve(world,i,date);else{i.status='expired';emitWorldEvent(world,{type:'ManagerInteractionExpired',date,clubIds:[i.clubId],playerIds:i.playerId?[i.playerId]:[],importance:2,summary:'O treinador deixou uma situação sem resposta dentro do prazo.',payload:{interactionId:i.id}});}}}if(s.interactions.length>2000)s.interactions.splice(0,s.interactions.length-2000);}
function wireInteractions(world:World):void{onWorldEvent(world,'PersonalLifeEvent',e=>createFromEvent(world,e));onWorldEvent(world,'DressingRoomConcern',e=>createFromEvent(world,e));onWorldEvent(world,'DressingRoomCrisis',e=>createFromEvent(world,e));onWorldEvent(world,'TransferRequested',e=>createFromEvent(world,e));onWorldEvent(world,'MediaStoryPublished',e=>createFromEvent(world,e));}

export function pendingManagerInteractions(world:World,clubId?:string){return managerInteractionState(world).interactions.filter(i=>i.status==='pending'&&(!clubId||i.clubId===clubId));}
export function managerRelationshipSummary(world:World,clubId:string){const rows=[...managerInteractionState(world).relationships.values()].filter(r=>r.clubId===clubId);return{avgTrust:rows.length?Math.round(rows.reduce((s,r)=>s+r.trust,0)/rows.length):50,avgRespect:rows.length?Math.round(rows.reduce((s,r)=>s+r.respect,0)/rows.length):50,avgFriction:rows.length?Math.round(rows.reduce((s,r)=>s+r.friction,0)/rows.length):0,highConflict:rows.filter(r=>r.friction>=65).length,strongBonds:rows.filter(r=>r.trust>=75&&r.respect>=70).length};}
export function snapshotManagerInteractions(world:World):ManagerInteractionSnapshot{const s=managerInteractionState(world);return{profiles:[...s.profiles.entries()].map(([k,v])=>[k,{...v}]),relationships:[...s.relationships.entries()].map(([k,v])=>[k,{...v,history:v.history.map(h=>({...h}))}]),interactions:s.interactions.map(i=>({...i,options:i.options.map(o=>({...o}))})),lastTick:s.lastTick};}
export function restoreManagerInteractions(world:World,snapshot?:ManagerInteractionSnapshot):void{if(!snapshot)return;states.set(world,{profiles:new Map(snapshot.profiles.map(([k,v])=>[k,{...v}])),relationships:new Map(snapshot.relationships.map(([k,v])=>[k,{...v,history:v.history.map(h=>({...h}))}])),interactions:snapshot.interactions.map(i=>({...i,options:i.options.map(o=>({...o}))})),wired:false,lastTick:snapshot.lastTick});managerInteractionState(world);}
