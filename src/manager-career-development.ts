import type { World } from './engine';
import { onWorldEvent, type WorldEvent } from './event-bus';
import { managerByClub, recordManagerCareerEvent, type ManagerCharacter, type ManagerKnowledge } from './manager-character';

const wired=new WeakSet<World>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));

function learn(m:ManagerCharacter,key:keyof ManagerKnowledge,amount:number):void{
  const diminishing=.35+.65*(1-m.knowledge[key]/110);
  m.knowledge[key]=clamp(m.knowledge[key]+amount*diminishing);
}
function rep(m:ManagerCharacter,key:keyof ManagerCharacter['reputation'],amount:number):void{m.reputation[key]=clamp(m.reputation[key]+amount*(.45+.55*(1-m.reputation[key]/110)));}
function managerFor(world:World,event:WorldEvent,clubId:string){const m=managerByClub(world,clubId);return m&&m.currentClubId===clubId?m:undefined;}

function processClubEvent(world:World,event:WorldEvent,clubId:string):void{
  const m=managerFor(world,event,clubId);if(!m)return;
  if(event.type==='TrainingCompleted'){
    learn(m,'training',.018);const sessions=(event.payload.sessions as {type?:string}[]|undefined)??[];
    if(sessions.some(s=>['teamShape','pressing','transition','opponentSpecific'].includes(String(s.type))))learn(m,'tactics',.014);
    if(sessions.some(s=>String(s.type)==='videoAnalysis'))learn(m,'dataAnalysis',.012);
    if(sessions.some(s=>String(s.type)==='setPieces'))learn(m,'setPieces',.016);
    if(sessions.some(s=>['recovery','rehabilitation'].includes(String(s.type))))learn(m,'medicalAwareness',.008);
  }
  if(event.type==='MatchCompleted'){
    learn(m,'tactics',.026);learn(m,'manManagement',.009);m.careerPoints+=.1;
    const [home,away]=event.clubIds,hg=Number(event.payload.homeGoals??0),ag=Number(event.payload.awayGoals??0);const won=clubId===home?hg>ag:clubId===away?ag>hg:false;const lost=clubId===home?hg<ag:clubId===away?ag<hg:false;
    if(won){rep(m,'coachingPrestige',.035);rep(m,'domestic',.02);m.careerPoints+=1;}else if(lost){rep(m,'coachingPrestige',-.008);}
  }
  if(event.type==='RecruitmentApproved'){learn(m,'scouting',.03);learn(m,'financialAwareness',.012);learn(m,'networking',.015);}
  if(event.type==='RecruitmentRejected'){learn(m,'financialAwareness',.009);learn(m,'scouting',.008);}
  if(event.type==='NegotiationEnded'){learn(m,'contractLaw',.02);learn(m,'networking',.018);learn(m,'financialAwareness',.012);}
  if(event.type==='PlayerInjured'||event.type==='PlayerRecovered')learn(m,'medicalAwareness',.015);
  if(event.type==='MediaStoryPublished'){learn(m,'media',.012);rep(m,'mediaProfile',event.importance>=4?.018:.006);}
  if(event.type==='PromiseKept'){learn(m,'manManagement',.02);rep(m,'coachingPrestige',.015);}
  if(event.type==='PromiseBroken'){learn(m,'manManagement',.006);rep(m,'coachingPrestige',-.018);}
  if(event.type==='YouthPlayerGenerated'){learn(m,'youthDevelopment',.012);}
  if(event.type==='DressingRoomCrisis'){learn(m,'manManagement',.015);}
  if(event.type==='ManagerInteractionResolved'){learn(m,'manManagement',.014);if(String(event.payload.kind)==='media')learn(m,'media',.018);}
  if(event.type==='SeasonEnded'){
    m.experienceYears+=1;rep(m,'coachingPrestige',.4);rep(m,'domestic',.22);m.careerPoints+=10;
    recordManagerCareerEvent(world,m.id,event.date,'seasonCompleted',`Temporada ${event.season} concluída por ${m.name}.`,10);
  }
}

function processEvent(world:World,event:WorldEvent):void{
  const clubs=[...new Set(event.clubIds)];for(const clubId of clubs)processClubEvent(world,event,clubId);
}

export function wireManagerCareerDevelopment(world:World):void{
  if(wired.has(world))return;wired.add(world);onWorldEvent(world,'*',(event)=>processEvent(world,event));
}

export function annualManagerAging(world:World,date:string):void{
  for(const club of world.clubs){const m=managerByClub(world,club.id);if(!m)continue;const year=Number(date.slice(0,4));const birth=Number(m.dateOfBirth.slice(0,4));if(Number.isFinite(year)&&Number.isFinite(birth))m.age=Math.max(18,year-birth);}
}
