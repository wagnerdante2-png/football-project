import type { Player, World } from './engine';
import { emitWorldEvent } from './event-bus';

export type PersonKind='player'|'manager'|'staff'|'journalist'|'supporter'|'partner'|'family'|'celebrity'|'footballer';
export type RelationshipType='friend'|'closeFriend'|'mentor'|'rival'|'partner'|'spouse'|'family'|'professional'|'conflict';
export type LifeEventType='familyIllness'|'relationshipConflict'|'relationshipSupport'|'pregnancy'|'paternityLeave'|'birth'|'nightOut'|'lateNight'|'fanEncounter'|'charityEvent'|'mediaAppearance'|'relationshipRumour'|'publicRelationship'|'breakup'|'friendConflict'|'friendSupport'|'bereavement'|'familyVisit'|'socialMediaPraise'|'socialMediaBacklash'|'publicIncident'|'partnerRivalryPressure'|'teamDinner'|'dressingRoomDispute';
export type LifeEventStatus='active'|'resolved'|'scheduled';
export type PublicProfile='private'|'known'|'celebrity'|'highProfile';

export type LifePerson={id:string;kind:PersonKind;name:string;clubId?:string;fame:number;mediaInterest:number;privacy:number;temperament:number;professionalism:number;sociability:number};
export type Relationship={id:string;aId:string;bId:string;type:RelationshipType;closeness:number;stability:number;publicVisibility:number;startedDate:string;lastChangedDate:string;notes:string[]};
export type PersonalLoad={concentration:number;morale:number;fatigue:number;availability:boolean;performancePct:number;mediaPressure:number;socialSupport:number};
export type LifeChoiceOption={id:string;label:string;description:string;effects:Partial<PersonalLoad>;relationshipDelta?:number;publicityDelta?:number;professionalismDelta?:number};
export type LifeEvent={id:string;type:LifeEventType;personId:string;relatedPersonIds:string[];clubIds:string[];startDate:string;endDate:string;status:LifeEventStatus;severity:number;publicity:number;truth:'confirmed'|'rumour'|'false';headline:string;description:string;choiceRequired:boolean;options?:LifeChoiceOption[];chosenOptionId?:string;effects:PersonalLoad;tags:string[]};
export type LifeProfile={personId:string;familyOrientation:number;nightlifeAffinity:number;fameComfort:number;scandalRisk:number;relationshipNeed:number;stressResilience:number;currentLoad:PersonalLoad;publicProfile:PublicProfile};
export type HumanLifeState={people:Map<string,LifePerson>;profiles:Map<string,LifeProfile>;relationships:Relationship[];events:LifeEvent[];lastDailyTick?:string};
export type HumanLifeSnapshot={people:[string,LifePerson][];profiles:[string,LifeProfile][];relationships:Relationship[];events:LifeEvent[];lastDailyTick?:string};

const states=new WeakMap<World,HumanLifeState>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const addDays=(iso:string,days:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0)};
const pseudo=(seed:number,offset:number)=>{const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)};
const pick=<T>(xs:T[],seed:number,o:number)=>xs[Math.floor(pseudo(seed,o)*xs.length)];
const baseLoad=():PersonalLoad=>({concentration:0,morale:0,fatigue:0,availability:true,performancePct:100,mediaPressure:0,socialSupport:0});

function playerPerson(p:Player):LifePerson{
  const s=hash(`life-person-${p.id}`);const fame=clamp(p.currentAbility*.72+p.potentialAbility*.18+(p.age<23?4:0));
  return{id:p.id,kind:'player',name:p.name,clubId:p.clubId,fame,mediaInterest:Math.round(25+p.currentAbility*.45+pseudo(s,1)*25),privacy:Math.round(25+pseudo(s,2)*70),temperament:Math.round(20+pseudo(s,3)*78),professionalism:Math.round(35+pseudo(s,4)*60),sociability:Math.round(25+pseudo(s,5)*70)};
}
function playerProfile(p:Player):LifeProfile{
  const s=hash(`life-profile-${p.id}`);const fame=p.currentAbility*.75+p.potentialAbility*.15;const publicProfile:PublicProfile=fame>=82?'highProfile':fame>=72?'celebrity':fame>=60?'known':'private';
  return{personId:p.id,familyOrientation:Math.round(25+pseudo(s,1)*72),nightlifeAffinity:Math.round(8+pseudo(s,2)*85),fameComfort:Math.round(20+pseudo(s,3)*78),scandalRisk:Math.round(5+pseudo(s,4)*70),relationshipNeed:Math.round(20+pseudo(s,5)*75),stressResilience:Math.round(25+pseudo(s,6)*72),currentLoad:baseLoad(),publicProfile};
}
function externalPerson(seedKey:string,kind:PersonKind,clubId?:string):LifePerson{
  const s=hash(seedKey);const first=['Ana','Beatriz','Camila','Daniela','Eduarda','Fernanda','Gabriela','Helena','Isabela','Juliana','Larissa','Marina','Natália','Paula','Rafaela','Sofia'];const last=['Almeida','Barros','Campos','Duarte','Ferreira','Gomes','Lima','Martins','Moura','Oliveira','Rocha','Santos','Vieira'];
  const fame=kind==='celebrity'?65+pseudo(s,1)*33:kind==='footballer'?45+pseudo(s,1)*45:10+pseudo(s,1)*30;
  return{id:`ext-${hash(seedKey)}`,kind,name:`${pick(first,s,2)} ${pick(last,s,3)}`,clubId,fame:Math.round(fame),mediaInterest:Math.round(fame*.75+pseudo(s,4)*20),privacy:Math.round(20+pseudo(s,5)*75),temperament:Math.round(20+pseudo(s,6)*75),professionalism:Math.round(30+pseudo(s,7)*65),sociability:Math.round(30+pseudo(s,8)*65)};
}

export function humanLifeState(world:World):HumanLifeState{
  let s=states.get(world);if(!s){s={people:new Map(),profiles:new Map(),relationships:[],events:[]};states.set(world,s);}
  for(const club of world.clubs)for(const p of club.players){if(!s.people.has(p.id))s.people.set(p.id,playerPerson(p));if(!s.profiles.has(p.id))s.profiles.set(p.id,playerProfile(p));}
  ensureTeamSocialGraph(world,s);return s;
}

function relationBetween(s:HumanLifeState,a:string,b:string):Relationship|undefined{return s.relationships.find(r=>(r.aId===a&&r.bId===b)||(r.aId===b&&r.bId===a));}
function ensureTeamSocialGraph(world:World,s:HumanLifeState):void{
  for(const club of world.clubs){for(let i=0;i<club.players.length;i++){const a=club.players[i];const seed=hash(`social-${club.id}-${a.id}`);if(pseudo(seed,1)>.32)continue;const candidates=club.players.filter(x=>x.id!==a.id);const b=candidates[Math.floor(pseudo(seed,2)*candidates.length)];if(!b||relationBetween(s,a.id,b.id))continue;const closeness=35+Math.round(pseudo(seed,3)*58);s.relationships.push({id:`rel-${a.id}-${b.id}`,aId:a.id,bId:b.id,type:closeness>=78?'closeFriend':closeness>=48?'friend':'professional',closeness,stability:45+Math.round(pseudo(seed,4)*45),publicVisibility:5+Math.round(pseudo(seed,5)*25),startedDate:`${world.season}-07-01`,lastChangedDate:`${world.season}-07-01`,notes:['Relação formada no ambiente do clube.']});}}
}
function ensureRomanticRelationship(world:World,p:Player,date:string):Relationship|undefined{
  const s=humanLifeState(world);const profile=s.profiles.get(p.id)!;const person=s.people.get(p.id)!;const existing=s.relationships.find(r=>(r.aId===p.id||r.bId===p.id)&&['partner','spouse'].includes(r.type));if(existing)return existing;
  const chance=(profile.relationshipNeed+person.sociability)/120000;if(Math.random()>chance)return undefined;
  const roll=Math.random();const kind:PersonKind=roll<.18?'celebrity':roll<.34?'footballer':'partner';const partnerClub=kind==='footballer'&&Math.random()<.7?world.clubs[Math.floor(Math.random()*world.clubs.length)]?.id:undefined;const partner=externalPerson(`partner-${p.id}-${date}`,kind,partnerClub);s.people.set(partner.id,partner);
  const r:Relationship={id:`rel-${p.id}-${partner.id}`,aId:p.id,bId:partner.id,type:'partner',closeness:55+Math.round(Math.random()*30),stability:45+Math.round(Math.random()*40),publicVisibility:kind==='celebrity'?65:kind==='footballer'?45:15,startedDate:date,lastChangedDate:date,notes:[]};s.relationships.push(r);return r;
}

function eventEffect(type:LifeEventType,severity:number):PersonalLoad{
  const e=baseLoad();
  if(type==='familyIllness'){e.concentration=-3-severity*.7;e.morale=-2-severity*.6;e.performancePct=100-(2+severity*.7);e.socialSupport=4;}
  if(type==='relationshipConflict'||type==='breakup'||type==='friendConflict'||type==='dressingRoomDispute'){e.concentration=-2-severity*.65;e.morale=-3-severity*.8;e.performancePct=100-(1+severity*.6);e.mediaPressure=severity*.7;}
  if(type==='relationshipSupport'||type==='friendSupport'||type==='familyVisit'||type==='teamDinner'){e.morale=2+severity*.5;e.performancePct=100+Math.min(2,severity*.2);e.socialSupport=3+severity*.6;}
  if(type==='paternityLeave'){e.availability=false;e.morale=4;e.performancePct=100;e.socialSupport=8;}
  if(type==='pregnancy'||type==='birth'){e.morale=4;e.concentration=-1;e.socialSupport=5;}
  if(type==='nightOut'||type==='lateNight'){e.fatigue=2+severity;e.concentration=-severity*.4;e.performancePct=100-Math.min(5,severity*.7);}
  if(type==='mediaAppearance'||type==='fanEncounter'||type==='charityEvent'||type==='socialMediaPraise'){e.morale=1+severity*.2;e.mediaPressure=severity*.3;}
  if(type==='relationshipRumour'||type==='socialMediaBacklash'||type==='publicIncident'||type==='partnerRivalryPressure'){e.concentration=-1-severity*.5;e.mediaPressure=3+severity;e.performancePct=100-Math.min(4,severity*.45);}
  if(type==='bereavement'){e.availability=severity>=7;e.morale=-8;e.concentration=-7;e.performancePct=92;e.socialSupport=6;}
  return e;
}
function combineLoad(events:LifeEvent[]):PersonalLoad{const x=baseLoad();for(const ev of events){x.concentration+=ev.effects.concentration;x.morale+=ev.effects.morale;x.fatigue+=ev.effects.fatigue;x.mediaPressure+=ev.effects.mediaPressure;x.socialSupport+=ev.effects.socialSupport;x.availability=x.availability&&ev.effects.availability;x.performancePct*=ev.effects.performancePct/100;}x.performancePct=clamp(x.performancePct,82,104);return x;}
function createEvent(world:World,p:Player,date:string,type:LifeEventType,severity:number,duration:number,publicity:number,headline:string,description:string,relatedPersonIds:string[]=[],options?:LifeChoiceOption[]):LifeEvent{
  const s=humanLifeState(world);const ev:LifeEvent={id:`life-${world.season}-${hash(`${p.id}-${date}-${type}-${Math.random()}`)}`,type,personId:p.id,relatedPersonIds,clubIds:[p.clubId],startDate:date,endDate:addDays(date,duration),status:'active',severity,publicity,truth:type==='relationshipRumour'?(Math.random()<.55?'rumour':'false'):'confirmed',headline,description,choiceRequired:Boolean(options?.length),options,effects:eventEffect(type,severity),tags:[type]};s.events.push(ev);
  emitWorldEvent(world,{type:'PersonalLifeEvent',date,clubIds:[p.clubId],playerIds:[p.id],importance:severity>=8?4:severity>=5?3:2,summary:headline,payload:{lifeEventId:ev.id,type,severity,publicity,endDate:ev.endDate,description,choiceRequired:ev.choiceRequired}});return ev;
}

function maybeDailyEvent(world:World,p:Player,date:string):void{
  const s=humanLifeState(world);const profile=s.profiles.get(p.id)!;const person=s.people.get(p.id)!;const active=s.events.some(e=>e.personId===p.id&&e.status==='active'&&e.endDate>=date);const base=.0028+(100-profile.stressResilience)/70000+person.mediaInterest/70000;if(Math.random()>base*(active?.55:1))return;
  const partner=s.relationships.find(r=>(r.aId===p.id||r.bId===p.id)&&['partner','spouse'].includes(r.type));const partnerId=partner?(partner.aId===p.id?partner.bId:partner.aId):undefined;const partnerPerson=partnerId?s.people.get(partnerId):undefined;
  const friend=s.relationships.find(r=>(r.aId===p.id||r.bId===p.id)&&['friend','closeFriend'].includes(r.type));const friendId=friend?(friend.aId===p.id?friend.bId:friend.aId):undefined;
  const roll=Math.random();let type:LifeEventType;let sev=2+Math.round(Math.random()*6);let dur=2+Math.round(Math.random()*10);let pub=person.mediaInterest*.25;let headline='Evento pessoal';let desc='Um acontecimento fora do futebol afeta a rotina.';let options:LifeChoiceOption[]|undefined;
  if(roll<.09){type='familyIllness';sev=4+Math.round(Math.random()*5);dur=5+Math.round(Math.random()*24);headline=`${p.name} vive preocupação familiar`;desc='Doença de familiar gera carga emocional temporária.';}
  else if(roll<.18&&partner){type='relationshipConflict';headline=`Momento delicado na vida pessoal de ${p.name}`;desc='Conflito no relacionamento aumenta estresse fora de campo.';pub=partnerPerson?.fame??10;}
  else if(roll<.25&&partner){type='relationshipSupport';headline=`Apoio pessoal fortalece ${p.name}`;desc='Relacionamento estável oferece suporte emocional.';}
  else if(roll<.30&&partner){type='pregnancy';dur=30;headline=`Família de ${p.name} espera um filho`;desc='Expectativa de nascimento altera agenda e estado emocional.';}
  else if(roll<.37){type='nightOut';sev=Math.max(1,Math.round((profile.nightlifeAffinity+Math.random()*40)/18));dur=1;headline=`${p.name} é visto em evento noturno`;desc='Noite fora pode ser irrelevante ou gerar questionamentos dependendo do contexto.';pub=person.fame*.45;options=[{id:'ignore',label:'Tratar como vida privada',description:'O clube não reage publicamente.',effects:{mediaPressure:-1}},{id:'warn',label:'Advertir internamente',description:'Preserva disciplina, com pequeno custo de moral.',effects:{morale:-1},professionalismDelta:2},{id:'public',label:'Cobrar publicamente',description:'Reduz tolerância a novas ocorrências, mas aumenta exposição.',effects:{morale:-3,mediaPressure:4},publicityDelta:20}];}
  else if(roll<.46){type='fanEncounter';dur=1;headline=`${p.name} encontra torcedores fora do clube`;desc='Abordagem espontânea de fãs pode gerar boa repercussão ou desgaste.';pub=person.fame*.5;}
  else if(roll<.53){type='charityEvent';dur=1;headline=`${p.name} participa de ação social`;desc='Participação pública reforça imagem positiva.';pub=person.fame*.55;}
  else if(roll<.60&&partnerPerson&&partnerPerson.fame>55){type='publicRelationship';dur=7;headline=`Relacionamento de ${p.name} ganha destaque`;desc='Relacionamento com pessoa conhecida amplia exposição pública de forma volátil.';pub=Math.max(person.fame,partnerPerson.fame);}
  else if(roll<.66&&partnerPerson?.kind==='footballer'&&partnerPerson.clubId&&partnerPerson.clubId!==p.clubId){type='partnerRivalryPressure';dur=5;headline=`Relacionamento de ${p.name} vira assunto antes de confronto`;desc='Parceira atleta de outro clube gera narrativa esportiva e pressão externa, sem implicar queda automática de profissionalismo.';pub=Math.max(person.fame,partnerPerson.fame)*.8;}
  else if(roll<.73){type='relationshipRumour';dur=4;headline=`Imprensa especula sobre vida pessoal de ${p.name}`;desc='Rumor sem confirmação circula em veículos e redes sociais.';pub=person.mediaInterest*.8;options=[{id:'deny',label:'Negar publicamente',description:'Pode encerrar rumor falso, mas prolonga o ciclo de notícias.',effects:{mediaPressure:1},publicityDelta:10},{id:'silence',label:'Não comentar',description:'Evita alimentar o tema.',effects:{mediaPressure:-1}},{id:'confirm',label:'Confirmar se verdadeiro',description:'Aumenta exposição agora, mas reduz especulação futura.',effects:{mediaPressure:2},publicityDelta:18}];}
  else if(roll<.80){type='mediaAppearance';dur=1;headline=`${p.name} participa de evento de mídia`;desc='Exposição pública aumenta visibilidade temporária.';pub=person.fame*.7;}
  else if(roll<.88&&friendId){type=Math.random()<.22?'friendConflict':'friendSupport';dur=3;headline=type==='friendConflict'?`${p.name} tem atrito com pessoa próxima`:`Amizades ajudam ${p.name} em semana importante`;desc=type==='friendConflict'?'Atrito externo gera ruído emocional temporário.':'Rede social próxima reduz pressão emocional.';}
  else if(roll<.94){type='teamDinner';dur=1;headline=`Elenco de ${p.clubId} se reúne fora do clube`;desc='Convívio social pode fortalecer vínculos internos.';}
  else {type='socialMediaBacklash';dur=3;headline=`Publicação envolvendo ${p.name} repercute mal`;desc='Reação negativa nas redes aumenta ruído externo.';pub=person.mediaInterest*.9;}
  createEvent(world,p,date,type,sev,dur,Math.round(clamp(pub)),headline,desc,partnerId?[partnerId]:friendId?[friendId]:[],options);
}

function processScheduledFamily(world:World,p:Player,date:string):void{
  const s=humanLifeState(world);const pregnancy=s.events.find(e=>e.personId===p.id&&e.type==='pregnancy'&&e.status==='active');if(!pregnancy)return;const daysToEnd=Math.round((new Date(`${pregnancy.endDate}T12:00:00Z`).getTime()-new Date(`${date}T12:00:00Z`).getTime())/86400000);
  if(daysToEnd===2&&!s.events.some(e=>e.personId===p.id&&e.type==='paternityLeave'&&e.startDate===date))createEvent(world,p,date,'paternityLeave',5,4,15,`${p.name} recebe licença-paternidade`,'Nascimento próximo torna o atleta indisponível por alguns dias.',pregnancy.relatedPersonIds);
  if(daysToEnd<=0&&!s.events.some(e=>e.personId===p.id&&e.type==='birth'&&e.startDate===date))createEvent(world,p,date,'birth',4,3,25,`Nasce filho de ${p.name}`,'Nascimento traz impacto emocional positivo e altera temporariamente a rotina familiar.',pregnancy.relatedPersonIds);
}

export function resolveLifeChoice(world:World,eventId:string,optionId:string,date:string):boolean{
  const s=humanLifeState(world);const ev=s.events.find(x=>x.id===eventId);if(!ev||!ev.choiceRequired||ev.chosenOptionId)return false;const option=ev.options?.find(o=>o.id===optionId);if(!option)return false;ev.chosenOptionId=option.id;ev.choiceRequired=false;
  for(const [k,v] of Object.entries(option.effects) as [keyof PersonalLoad,number|boolean][])if(typeof v==='number'&&typeof ev.effects[k]==='number')(ev.effects[k] as number)+=v;else if(k==='availability'&&typeof v==='boolean')ev.effects.availability=v;
  ev.publicity=clamp(ev.publicity+(option.publicityDelta??0));const person=s.people.get(ev.personId);if(person&&option.professionalismDelta)person.professionalism=clamp(person.professionalism+option.professionalismDelta);
  if(option.relationshipDelta)for(const rel of s.relationships.filter(r=>r.aId===ev.personId||r.bId===ev.personId))rel.closeness=clamp(rel.closeness+option.relationshipDelta);
  emitWorldEvent(world,{type:'PersonalDecisionMade',date,clubIds:ev.clubIds,playerIds:[ev.personId],importance:2,summary:`Decisão tomada em ${ev.headline}: ${option.label}.`,payload:{lifeEventId:ev.id,optionId:option.id}});return true;
}

export function tickHumanLife(world:World,date:string):void{
  const s=humanLifeState(world);if(s.lastDailyTick===date)return;s.lastDailyTick=date;for(const ev of s.events)if(ev.status==='active'&&date>ev.endDate)ev.status='resolved';
  for(const club of world.clubs)for(const p of club.players){ensureRomanticRelationship(world,p,date);processScheduledFamily(world,p,date);maybeDailyEvent(world,p,date);const active=s.events.filter(e=>e.personId===p.id&&e.status==='active'&&e.startDate<=date&&e.endDate>=date);const profile=s.profiles.get(p.id)!;profile.currentLoad=combineLoad(active);p.morale=Math.round(clamp(p.morale+profile.currentLoad.morale*.04-profile.currentLoad.mediaPressure*.01,20,100));}
}

export function personalPerformanceFactor(world:World,playerId:string):number{return (humanLifeState(world).profiles.get(playerId)?.currentLoad.performancePct??100)/100;}
export function personalAvailability(world:World,playerId:string):boolean{return humanLifeState(world).profiles.get(playerId)?.currentLoad.availability??true;}
export function activeLifeEvents(world:World,personId:string):LifeEvent[]{return humanLifeState(world).events.filter(e=>e.personId===personId&&e.status==='active');}
export function relationshipsOf(world:World,personId:string):Relationship[]{return humanLifeState(world).relationships.filter(r=>r.aId===personId||r.bId===personId);}
export function pendingLifeChoices(world:World):LifeEvent[]{return humanLifeState(world).events.filter(e=>e.status==='active'&&e.choiceRequired&&!e.chosenOptionId);}

export function snapshotHumanLife(world:World):HumanLifeSnapshot{const s=humanLifeState(world);return{people:[...s.people.entries()].map(([k,v])=>[k,{...v}]),profiles:[...s.profiles.entries()].map(([k,v])=>[k,{...v,currentLoad:{...v.currentLoad}}]),relationships:s.relationships.map(r=>({...r,notes:[...r.notes]})),events:s.events.map(e=>({...e,relatedPersonIds:[...e.relatedPersonIds],clubIds:[...e.clubIds],effects:{...e.effects},options:e.options?.map(o=>({...o,effects:{...o.effects}})),tags:[...e.tags]})),lastDailyTick:s.lastDailyTick};}
export function restoreHumanLife(world:World,snapshot?:HumanLifeSnapshot):void{if(!snapshot)return;states.set(world,{people:new Map(snapshot.people.map(([k,v])=>[k,{...v}])),profiles:new Map(snapshot.profiles.map(([k,v])=>[k,{...v,currentLoad:{...v.currentLoad}}])),relationships:snapshot.relationships.map(r=>({...r,notes:[...r.notes]})),events:snapshot.events.map(e=>({...e,relatedPersonIds:[...e.relatedPersonIds],clubIds:[...e.clubIds],effects:{...e.effects},options:e.options?.map(o=>({...o,effects:{...o.effects}})),tags:[...e.tags]})),lastDailyTick:snapshot.lastDailyTick});}
