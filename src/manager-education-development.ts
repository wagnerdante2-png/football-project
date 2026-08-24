import type { World } from './engine';
import { emitWorldEvent } from './event-bus';
import { managerByClub, managerCharacterState, type CoachingLicence, type CourseId, type ManagerCharacter, type ManagerKnowledge } from './manager-character';
import { managerProfile } from './manager-interactions';

export type DevelopmentKind='course'|'licence';
export type ManagerDevelopmentActivity={id:string;managerId:string;clubId:string;kind:DevelopmentKind;courseId?:CourseId;targetLicence?:CoachingLicence;startDate:string;expectedEndDate:string;progress:number;workload:number;status:'active'|'completed'|'cancelled';};
export type ManagerDevelopmentState={activities:ManagerDevelopmentActivity[];lastTick?:string};
export type ManagerDevelopmentSnapshot={activities:ManagerDevelopmentActivity[];lastTick?:string};

const states=new WeakMap<World,ManagerDevelopmentState>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));
const addDays=(iso:string,d:number)=>{const x=new Date(`${iso}T12:00:00Z`);x.setUTCDate(x.getUTCDate()+d);return x.toISOString().slice(0,10)};
const licenceOrder:CoachingLicence[]=['none','regionalC','regionalB','regionalA','continentalC','continentalB','continentalA','continentalPro'];
const courseDuration:Record<CourseId,number>={refereeing:75,footballManagement:120,performanceAnalysis:90,sportsPsychology:105,sportsScience:120,fitness:90,scouting:90,dataAnalysis:120,mediaRelations:60,leadership:70,youthDevelopment:90,setPieces:55,goalkeeping:80,sportsLaw:100,finance:90};
const courseGain:Record<CourseId,Partial<ManagerKnowledge>>={
  refereeing:{refereeing:8},footballManagement:{financialAwareness:5,contractLaw:4,networking:3},performanceAnalysis:{dataAnalysis:6,tactics:4},sportsPsychology:{manManagement:7},sportsScience:{training:5,medicalAwareness:4},fitness:{training:6,medicalAwareness:3},scouting:{scouting:8,networking:2},dataAnalysis:{dataAnalysis:8},mediaRelations:{media:8},leadership:{manManagement:6,networking:2},youthDevelopment:{youthDevelopment:8,training:2},setPieces:{setPieces:9,tactics:2},goalkeeping:{goalkeeping:10,training:2},sportsLaw:{contractLaw:9},finance:{financialAwareness:9}
};

export function managerDevelopmentState(world:World):ManagerDevelopmentState{let s=states.get(world);if(!s){s={activities:[]};states.set(world,s);}return s;}
function managerById(world:World,id:string):ManagerCharacter|undefined{return managerCharacterState(world).characters.get(id);}
function activeFor(world:World,managerId:string){return managerDevelopmentState(world).activities.find(a=>a.managerId===managerId&&a.status==='active');}

export function startManagerCourse(world:World,clubId:string,courseId:CourseId,date:string):ManagerDevelopmentActivity|undefined{
  const m=managerByClub(world,clubId);if(!m||activeFor(world,m.id)||m.education.courses.includes(courseId))return undefined;
  const duration=courseDuration[courseId];const a:ManagerDevelopmentActivity={id:`mgr-dev-${m.id}-${date}-${courseId}`,managerId:m.id,clubId,kind:'course',courseId,startDate:date,expectedEndDate:addDays(date,duration),progress:0,workload:courseId==='dataAnalysis'||courseId==='sportsScience'?72:courseId==='mediaRelations'?42:58,status:'active'};managerDevelopmentState(world).activities.push(a);emitWorldEvent(world,{type:'ManagerEducationStarted',date,actorIds:[m.id],clubIds:[clubId],importance:2,summary:`${m.name} iniciou formação complementar: ${courseId}.`,payload:{activityId:a.id,courseId,expectedEndDate:a.expectedEndDate}});return a;
}

export function startLicenceUpgrade(world:World,clubId:string,date:string):ManagerDevelopmentActivity|undefined{
  const m=managerByClub(world,clubId);if(!m||activeFor(world,m.id))return undefined;const idx=licenceOrder.indexOf(m.education.licence);if(idx<0||idx>=licenceOrder.length-1)return undefined;const target=licenceOrder[idx+1];
  const duration=target==='continentalPro'?240:target.startsWith('continental')?180:120;const a:ManagerDevelopmentActivity={id:`mgr-lic-${m.id}-${date}-${target}`,managerId:m.id,clubId,kind:'licence',targetLicence:target,startDate:date,expectedEndDate:addDays(date,duration),progress:0,workload:78,status:'active'};managerDevelopmentState(world).activities.push(a);emitWorldEvent(world,{type:'ManagerEducationStarted',date,actorIds:[m.id],clubIds:[clubId],importance:3,summary:`${m.name} iniciou preparação para a licença ${target}.`,payload:{activityId:a.id,targetLicence:target,expectedEndDate:a.expectedEndDate}});return a;
}

function applyCourse(m:ManagerCharacter,id:CourseId):void{if(!m.education.courses.includes(id))m.education.courses.push(id);for(const [k,v] of Object.entries(courseGain[id]) as [keyof ManagerKnowledge,number][])m.knowledge[k]=clamp(m.knowledge[k]+v*(.55+.45*(1-m.knowledge[k]/110)));}
function applyLicence(m:ManagerCharacter,target:CoachingLicence):void{m.education.licence=target;m.knowledge.tactics=clamp(m.knowledge.tactics+4);m.knowledge.training=clamp(m.knowledge.training+4);m.knowledge.manManagement=clamp(m.knowledge.manManagement+2);m.reputation.coachingPrestige=clamp(m.reputation.coachingPrestige+3);}

function complete(world:World,a:ManagerDevelopmentActivity,date:string):void{
  const m=managerById(world,a.managerId);if(!m)return;a.status='completed';a.progress=100;
  if(a.kind==='course'&&a.courseId){applyCourse(m,a.courseId);m.history.push({date,type:'courseCompleted',summary:`Curso concluído: ${a.courseId}.`,impact:2});emitWorldEvent(world,{type:'ManagerEducationCompleted',date,actorIds:[m.id],clubIds:[a.clubId],importance:2,summary:`${m.name} concluiu o curso ${a.courseId}.`,payload:{activityId:a.id,courseId:a.courseId}});}
  if(a.kind==='licence'&&a.targetLicence){applyLicence(m,a.targetLicence);m.history.push({date,type:'licenceUpgraded',summary:`Nova licença obtida: ${a.targetLicence}.`,impact:5});emitWorldEvent(world,{type:'ManagerLicenceUpgraded',date,actorIds:[m.id],clubIds:[a.clubId],importance:3,summary:`${m.name} obteve a licença ${a.targetLicence}.`,payload:{activityId:a.id,targetLicence:a.targetLicence}});}
}

export function tickManagerDevelopment(world:World,date:string):void{
  const s=managerDevelopmentState(world);if(s.lastTick===date)return;s.lastTick=date;
  for(const a of s.activities.filter(x=>x.status==='active')){const m=managerById(world,a.managerId);if(!m){a.status='cancelled';continue;}const profile=managerProfile(world,a.clubId);const stress=profile?.stress??30;const adaptability=m.personality.adaptability;const discipline=m.personality.discipline;const pace=clamp(.28+(adaptability+discipline)/520-(stress>75?.08:stress>55?.035:0),.12,.62);a.progress=clamp(a.progress+pace);if(a.progress>=100||a.expectedEndDate<=date)complete(world,a,date);}
  if(s.activities.length>500)s.activities.splice(0,s.activities.length-500);
}

export function activeManagerDevelopment(world:World,clubId:string){const m=managerByClub(world,clubId);return m?activeFor(world,m.id):undefined;}
export function cancelManagerDevelopment(world:World,activityId:string):boolean{const a=managerDevelopmentState(world).activities.find(x=>x.id===activityId&&x.status==='active');if(!a)return false;a.status='cancelled';return true;}
export function snapshotManagerDevelopment(world:World):ManagerDevelopmentSnapshot{const s=managerDevelopmentState(world);return{activities:s.activities.map(a=>({...a})),lastTick:s.lastTick};}
export function restoreManagerDevelopment(world:World,snapshot?:ManagerDevelopmentSnapshot):void{if(!snapshot)return;states.set(world,{activities:snapshot.activities.map(a=>({...a})),lastTick:snapshot.lastTick});}
