import type { Position, Tactics, World } from './engine';
import { managerProfile, setManagerCreationProfile, type ManagerAxis } from './manager-interactions';
import { worldRandom } from './world-core-v2';

export type ManagerGender='male'|'female'|'nonbinary'|'unspecified';
export type EducationLevel='none'|'basic'|'secondary'|'technical'|'bachelor'|'postgraduate'|'masters'|'doctorate';
export type PlayingLevel='none'|'amateur'|'semiPro'|'professional'|'elite';
export type CoachingLicence='none'|'regionalC'|'regionalB'|'regionalA'|'continentalC'|'continentalB'|'continentalA'|'continentalPro';
export type CourseId='refereeing'|'footballManagement'|'performanceAnalysis'|'sportsPsychology'|'sportsScience'|'fitness'|'scouting'|'dataAnalysis'|'mediaRelations'|'leadership'|'youthDevelopment'|'setPieces'|'goalkeeping'|'sportsLaw'|'finance';
export type DegreeField='physicalEducation'|'sportsManagement'|'business'|'psychology'|'physiology'|'statistics'|'dataScience'|'law'|'communication'|'medicine'|'other';
export type ManagerCareerRole='player'|'youthCoach'|'assistant'|'analyst'|'scout'|'fitnessCoach'|'goalkeepingCoach'|'director'|'headCoach';
export type ManagerAppearance={heightCm:number;build:'slim'|'average'|'athletic'|'stocky'|'large';hair:'bald'|'short'|'medium'|'long';hairColor:'black'|'brown'|'blond'|'red'|'gray'|'white';facialHair:'none'|'stubble'|'beard'|'moustache';style:'tracksuit'|'suit'|'smartCasual'|'casual';glasses:boolean};
export type SocialBackground={maritalStatus:'single'|'dating'|'married'|'divorced'|'widowed';children:number;languages:string[];nationality:string;secondNationality?:string;birthCity:string;homeCity?:string;clubSupported?:string;rivalClubs:string[]};
export type PlayingCareerEntry={clubName:string;country:string;startYear:number;endYear:number;position:Position;appearances?:number;goals?:number;captain?:boolean;titles:string[];awards:string[]};
export type StaffCareerEntry={clubName:string;country:string;role:ManagerCareerRole;startYear:number;endYear:number;achievements:string[]};
export type EducationProfile={level:EducationLevel;field?:DegreeField;institution?:string;licence:CoachingLicence;courses:CourseId[]};
export type ManagerKnowledge={tactics:number;training:number;manManagement:number;scouting:number;dataAnalysis:number;medicalAwareness:number;financialAwareness:number;media:number;refereeing:number;youthDevelopment:number;setPieces:number;goalkeeping:number;contractLaw:number;networking:number};
export type TacticalPhilosophy={favoriteFormation:string;secondaryFormations:string[];mentality:'defensive'|'balanced'|'positive'|'attacking';possessionPreference:number;pressingPreference:number;tempoPreference:number;directness:number;defensiveLinePreference:number;widthPreference:number;counterAttack:number;buildFromBack:number;creativeFreedom:number;setPieceImportance:number;youthUsage:number;rotation:number};
export type TrainingPhilosophy={intensity:number;physical:number;technical:number;tactical:number;individualDevelopment:number;videoAnalysis:number;opponentPreparation:number;recovery:number;repetition:number;playerFreedom:number};
export type CareerAmbition={startingClubId:string;dreamClubs:string[];preferredCountries:string[];avoidCountries:string[];nationalTeamAmbition:number;salaryImportance:number;stabilityImportance:number;trophyAmbition:number;reputationAmbition:number;youthProjectPreference:number;financialProjectPreference:number};
export type ManagerReputation={domestic:number;continental:number;world:number;formerPlayerPrestige:number;coachingPrestige:number;mediaProfile:number};
export type ManagerCharacter={
  id:string;name:string;nickname?:string;dateOfBirth:string;age:number;gender:ManagerGender;appearance:ManagerAppearance;social:SocialBackground;
  playingLevel:PlayingLevel;primaryPlayingPosition?:Position;playingCareer:PlayingCareerEntry[];staffCareer:StaffCareerEntry[];education:EducationProfile;
  personality:Record<ManagerAxis,number>;knowledge:ManagerKnowledge;tactical:TacticalPhilosophy;training:TrainingPhilosophy;ambition:CareerAmbition;reputation:ManagerReputation;
  currentClubId:string;createdSeason:number;experienceYears:number;careerPoints:number;history:{date:string;type:string;summary:string;impact?:number}[];
};
export type ManagerCharacterSnapshot={characters:[string,ManagerCharacter][];userManagerId?:string};
export type ManagerCharacterState={characters:Map<string,ManagerCharacter>;userManagerId?:string};

const states=new WeakMap<World,ManagerCharacterState>();
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,v));

export function managerCharacterState(world:World):ManagerCharacterState{let s=states.get(world);if(!s){s={characters:new Map()};states.set(world,s);}return s;}

const licenceBase:Record<CoachingLicence,number>={none:20,regionalC:30,regionalB:38,regionalA:46,continentalC:55,continentalB:64,continentalA:74,continentalPro:86};
const courseEffects:Record<CourseId,Partial<ManagerKnowledge>>={
  refereeing:{refereeing:14},footballManagement:{financialAwareness:9,contractLaw:6,networking:4},performanceAnalysis:{dataAnalysis:11,tactics:6},sportsPsychology:{manManagement:11},sportsScience:{training:8,medicalAwareness:6},fitness:{training:9,medicalAwareness:4},scouting:{scouting:13,networking:4},dataAnalysis:{dataAnalysis:14},mediaRelations:{media:13},leadership:{manManagement:9,networking:3},youthDevelopment:{youthDevelopment:14,training:4},setPieces:{setPieces:14,tactics:3},goalkeeping:{goalkeeping:16,training:2},sportsLaw:{contractLaw:14},finance:{financialAwareness:14}
};
const degreeEffects:Partial<Record<DegreeField,Partial<ManagerKnowledge>>>={physicalEducation:{training:10,medicalAwareness:3},sportsManagement:{financialAwareness:8,networking:5,contractLaw:4},business:{financialAwareness:9,networking:4},psychology:{manManagement:11},physiology:{medicalAwareness:10,training:5},statistics:{dataAnalysis:12},dataScience:{dataAnalysis:14},law:{contractLaw:12},communication:{media:11},medicine:{medicalAwareness:14}};

function baseKnowledge(input:Pick<ManagerCharacter,'education'|'playingLevel'|'primaryPlayingPosition'|'playingCareer'|'staffCareer'>):ManagerKnowledge{
  const base=licenceBase[input.education.licence];const k:ManagerKnowledge={tactics:base,training:base,manManagement:42,scouting:35,dataAnalysis:30,medicalAwareness:28,financialAwareness:28,media:35,refereeing:25,youthDevelopment:35,setPieces:35,goalkeeping:input.primaryPlayingPosition==='GK'?58:25,contractLaw:22,networking:35};
  const playBonus=input.playingLevel==='elite'?18:input.playingLevel==='professional'?12:input.playingLevel==='semiPro'?7:input.playingLevel==='amateur'?3:0;k.tactics+=playBonus;k.manManagement+=Math.round(playBonus*.45);k.networking+=Math.round(playBonus*.6);if(input.primaryPlayingPosition==='GK')k.goalkeeping+=18;if(['CB','DM','CM'].includes(input.primaryPlayingPosition??'ST'))k.tactics+=3;
  const yearsPlayed=input.playingCareer.reduce((s,e)=>s+Math.max(0,e.endYear-e.startYear),0);k.networking+=Math.min(16,Math.round(yearsPlayed*.55));k.tactics+=Math.min(8,Math.round(yearsPlayed*.25));
  for(const e of input.staffCareer){const yrs=Math.max(1,e.endYear-e.startYear);if(e.role==='analyst'){k.dataAnalysis+=yrs*1.1;k.tactics+=yrs*.5;}if(e.role==='scout'){k.scouting+=yrs*1.2;k.networking+=yrs*.5;}if(e.role==='youthCoach'){k.youthDevelopment+=yrs*1.1;k.training+=yrs*.6;}if(e.role==='assistant'||e.role==='headCoach'){k.tactics+=yrs*.8;k.manManagement+=yrs*.6;k.training+=yrs*.5;}if(e.role==='director'){k.financialAwareness+=yrs*.9;k.contractLaw+=yrs*.5;k.networking+=yrs*.8;}if(e.role==='fitnessCoach'){k.training+=yrs;k.medicalAwareness+=yrs*.6;}if(e.role==='goalkeepingCoach')k.goalkeeping+=yrs*1.2;}
  const deg=input.education.field?degreeEffects[input.education.field]:undefined;if(deg)for(const [key,val] of Object.entries(deg) as [keyof ManagerKnowledge,number][])k[key]+=val;
  for(const course of input.education.courses)for(const [key,val] of Object.entries(courseEffects[course]) as [keyof ManagerKnowledge,number][])k[key]+=val;
  for(const key of Object.keys(k) as (keyof ManagerKnowledge)[])k[key]=Math.round(clamp(k[key]));return k;
}

function reputationFromBackground(input:Pick<ManagerCharacter,'playingLevel'|'playingCareer'|'staffCareer'|'education'>):ManagerReputation{
  const titles=input.playingCareer.reduce((s,e)=>s+e.titles.length,0),awards=input.playingCareer.reduce((s,e)=>s+e.awards.length,0);const elite=input.playingLevel==='elite'?38:input.playingLevel==='professional'?22:input.playingLevel==='semiPro'?10:input.playingLevel==='amateur'?4:0;const coaching=input.staffCareer.filter(e=>e.role==='headCoach'||e.role==='assistant').reduce((s,e)=>s+Math.max(1,e.endYear-e.startYear),0);const licence=licenceBase[input.education.licence];return{domestic:Math.round(clamp(25+elite+titles*3+coaching*1.2)),continental:Math.round(clamp(12+elite*.7+titles*2+awards*2+coaching*.5)),world:Math.round(clamp(5+elite*.5+awards*3)),formerPlayerPrestige:Math.round(clamp(10+elite+titles*2.5+awards*3)),coachingPrestige:Math.round(clamp(15+coaching*2+licence*.35)),mediaProfile:Math.round(clamp(20+elite*.7+awards*3))};
}

export type ManagerCreationInput=Omit<ManagerCharacter,'id'|'knowledge'|'reputation'|'experienceYears'|'careerPoints'|'history'> & {id?:string};
export function createManagerCharacter(world:World,input:ManagerCreationInput,userControlled=true):ManagerCharacter{
  const id=input.id??`manager-character-${Math.floor(worldRandom(world,'humanLife','manager-character-id')*1e9)}`;const experienceYears=input.playingCareer.reduce((s,e)=>s+Math.max(0,e.endYear-e.startYear),0)+input.staffCareer.reduce((s,e)=>s+Math.max(0,e.endYear-e.startYear),0);
  const knowledge=baseKnowledge({...input,education:input.education});const reputation=reputationFromBackground({...input,education:input.education});
  const character:ManagerCharacter={...input,id,knowledge,reputation,experienceYears,careerPoints:0,history:[{date:`${world.season}-07-25`,type:'careerStart',summary:`Início da carreira como treinador no clube ${input.currentClubId}.`}]} as ManagerCharacter;
  const s=managerCharacterState(world);s.characters.set(id,character);if(userControlled)s.userManagerId=id;
  const profile=managerProfile(world,input.currentClubId);if(profile){profile.managerId=id;profile.reputation=Math.round((reputation.domestic+reputation.coachingPrestige)/2);setManagerCreationProfile(world,input.currentClubId,input.personality);}
  return character;
}

export function createDefaultManagerCharacter(world:World,clubId:string,name='Novo Treinador'):ManagerCharacter{
  const season=world.season;return createManagerCharacter(world,{name,dateOfBirth:`${season-38}-01-15`,age:38,gender:'unspecified',appearance:{heightCm:178,build:'average',hair:'short',hairColor:'brown',facialHair:'none',style:'smartCasual',glasses:false},social:{maritalStatus:'single',children:0,languages:['Português'],nationality:'Brasil',birthCity:'São Paulo',rivalClubs:[]},playingLevel:'semiPro',primaryPlayingPosition:'CM',playingCareer:[],staffCareer:[{clubName:'Categorias de base',country:'Brasil',role:'youthCoach',startYear:season-6,endYear:season-2,achievements:[]}],education:{level:'bachelor',field:'physicalEducation',licence:'continentalA',courses:['performanceAnalysis','leadership','youthDevelopment']},personality:{discipline:62,empathy:58,patience:61,assertiveness:60,publicProtection:55,diplomacy:60,confrontation:42,pragmatism:60,consistency:64,mediaSkill:52,adaptability:66,forgiveness:58},tactical:{favoriteFormation:'4-3-3',secondaryFormations:['4-2-3-1','4-4-2'],mentality:'positive',possessionPreference:62,pressingPreference:68,tempoPreference:64,directness:42,defensiveLinePreference:62,widthPreference:60,counterAttack:55,buildFromBack:68,creativeFreedom:58,setPieceImportance:52,youthUsage:65,rotation:56},training:{intensity:62,physical:55,technical:66,tactical:70,individualDevelopment:68,videoAnalysis:62,opponentPreparation:60,recovery:64,repetition:56,playerFreedom:58},ambition:{startingClubId:clubId,dreamClubs:[],preferredCountries:['Brasil'],avoidCountries:[],nationalTeamAmbition:55,salaryImportance:40,stabilityImportance:55,trophyAmbition:72,reputationAmbition:65,youthProjectPreference:65,financialProjectPreference:48},currentClubId:clubId,createdSeason:season},true);
}

export function userManager(world:World):ManagerCharacter|undefined{const s=managerCharacterState(world);return s.userManagerId?s.characters.get(s.userManagerId):undefined;}
export function managerByClub(world:World,clubId:string):ManagerCharacter|undefined{return [...managerCharacterState(world).characters.values()].find(m=>m.currentClubId===clubId);}
export function managerKnowledgeEffect(world:World,clubId:string,domain:keyof ManagerKnowledge):number{const m=managerByClub(world,clubId);if(!m)return 1;return .82+m.knowledge[domain]/250;}
export function managerTacticalBias(world:World,clubId:string):Partial<Tactics>|undefined{const m=managerByClub(world,clubId);if(!m)return;return{mentality:m.tactical.mentality,tempo:m.tactical.tempoPreference,pressing:m.tactical.pressingPreference,defensiveLine:m.tactical.defensiveLinePreference,width:m.tactical.widthPreference,passingStyle:m.tactical.directness>=65?'direct':m.tactical.possessionPreference>=65?'short':'mixed',transition:m.tactical.counterAttack>=65?'counter':m.tactical.possessionPreference>=65?'hold':'balanced'};}
export function recordManagerCareerEvent(world:World,managerId:string,date:string,type:string,summary:string,impact=0):void{const m=managerCharacterState(world).characters.get(managerId);if(!m)return;m.careerPoints+=impact;m.history.push({date,type,summary,impact});if(m.history.length>500)m.history.shift();}
export function snapshotManagerCharacters(world:World):ManagerCharacterSnapshot{const s=managerCharacterState(world);return{characters:[...s.characters.entries()].map(([k,v])=>[k,JSON.parse(JSON.stringify(v)) as ManagerCharacter]),userManagerId:s.userManagerId};}
export function restoreManagerCharacters(world:World,snapshot?:ManagerCharacterSnapshot):void{if(!snapshot)return;states.set(world,{characters:new Map(snapshot.characters.map(([k,v])=>[k,JSON.parse(JSON.stringify(v)) as ManagerCharacter])),userManagerId:snapshot.userManagerId});}
