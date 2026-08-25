import type { Club, Player, PlayerAttributes, Position, World } from './engine';

export type Footedness = 'right' | 'left' | 'both';
export type InjurySeverity = 'minor' | 'moderate' | 'serious' | 'severe' | 'critical' | 'careerThreatening';
export type InjuryPhase = 'acute' | 'immobilization' | 'rehab' | 'returnToTraining' | 'returnToPlay' | 'resolved';
export type BodySide = 'left' | 'right' | 'central' | 'bilateral';
export type BodyRegion = 'head' | 'neck' | 'shoulder' | 'arm' | 'hand' | 'back' | 'hip' | 'groin' | 'thigh' | 'knee' | 'lowerLeg' | 'ankle' | 'foot';
export type Tissue = 'muscle' | 'tendon' | 'ligament' | 'bone' | 'joint' | 'nerve' | 'concussion' | 'bruise';

export type InjuryDefinition = {
  id: string;
  name: string;
  region: BodyRegion;
  tissue: Tissue;
  sides: BodySide[];
  baseSeverity: InjurySeverity;
  minRounds: number;
  maxRounds: number;
  recurrenceBase: number;
  contactBias: number;
  overloadBias: number;
  attributeEffects: Partial<Record<keyof PlayerAttributes, number>>;
};

export type InjuryEvent = {
  id: string;
  playerId: string;
  clubId: string;
  season: number;
  round: number;
  definitionId: string;
  name: string;
  region: BodyRegion;
  tissue: Tissue;
  side: BodySide;
  severity: InjurySeverity;
  phase: InjuryPhase;
  occurredContext: 'match' | 'training' | 'overload' | 'contact' | 'recurrence';
  roundsOutInitial: number;
  roundsRemaining: number;
  recurrenceRiskAtInjury: number;
  permanentDamage: number;
  dominantSideAffected: boolean;
  notes: string[];
};

export type Vulnerability = {
  playerId: string;
  region: BodyRegion;
  side: BodySide;
  tissue: Tissue;
  susceptibility: number;
  chronicity: number;
  lastInjurySeason: number;
  lastInjuryRound: number;
  sourceInjuryIds: string[];
};

export type FunctionalDeficit = {
  id: string;
  playerId: string;
  sourceInjuryId: string;
  region: BodyRegion;
  side: BodySide;
  attribute: keyof PlayerAttributes;
  originalPenaltyPct: number;
  currentPenaltyPct: number;
  recoveryPerRound: number;
  trainingSensitive: boolean;
  permanentFloorPct: number;
  description: string;
};

export type MedicalProfile = {
  playerId: string;
  footedness: Footedness;
  injuryProneness: number;
  painTolerance: number;
  recovery: number;
  durability: number;
  activeInjuries: InjuryEvent[];
  history: InjuryEvent[];
  vulnerabilities: Vulnerability[];
  deficits: FunctionalDeficit[];
  matchesMissed: number;
  daysEquivalentOut: number;
};

export type MedicalState = { profiles: Map<string, MedicalProfile> };

const stateByWorld = new WeakMap<World, MedicalState>();
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rnd = () => Math.random();
const randomInt = (min:number,max:number)=>min+Math.floor(rnd()*(max-min+1));

const severityWeight: Record<InjurySeverity,number> = { minor:1, moderate:2, serious:3, severe:4, critical:5, careerThreatening:6 };
const severityLabel: Record<InjurySeverity,string> = { minor:'leve', moderate:'moderada', serious:'séria', severe:'grave', critical:'gravíssima', careerThreatening:'ameaça à carreira' };

export const injuryDefinitions: InjuryDefinition[] = [
  { id:'hamstring-strain', name:'Distensão dos isquiotibiais', region:'thigh', tissue:'muscle', sides:['left','right'], baseSeverity:'moderate', minRounds:1, maxRounds:5, recurrenceBase:.18, contactBias:.1, overloadBias:1.7, attributeEffects:{pace:-4,stamina:-3} },
  { id:'adductor-strain', name:'Lesão dos adutores', region:'groin', tissue:'muscle', sides:['left','right','bilateral'], baseSeverity:'moderate', minRounds:1, maxRounds:5, recurrenceBase:.17, contactBias:.15, overloadBias:1.55, attributeEffects:{pace:-2,stamina:-3,finishing:-2} },
  { id:'calf-strain', name:'Distensão da panturrilha', region:'lowerLeg', tissue:'muscle', sides:['left','right'], baseSeverity:'moderate', minRounds:1, maxRounds:4, recurrenceBase:.16, contactBias:.08, overloadBias:1.5, attributeEffects:{pace:-3,stamina:-3} },
  { id:'ankle-sprain', name:'Entorse de tornozelo', region:'ankle', tissue:'ligament', sides:['left','right'], baseSeverity:'moderate', minRounds:1, maxRounds:5, recurrenceBase:.2, contactBias:1.2, overloadBias:.6, attributeEffects:{pace:-3,technique:-2} },
  { id:'knee-mcl', name:'Lesão do ligamento colateral medial', region:'knee', tissue:'ligament', sides:['left','right'], baseSeverity:'serious', minRounds:3, maxRounds:9, recurrenceBase:.2, contactBias:1.3, overloadBias:.45, attributeEffects:{pace:-5,stamina:-3,tackling:-2} },
  { id:'knee-acl', name:'Ruptura do ligamento cruzado anterior', region:'knee', tissue:'ligament', sides:['left','right'], baseSeverity:'critical', minRounds:12, maxRounds:28, recurrenceBase:.28, contactBias:.85, overloadBias:.75, attributeEffects:{pace:-9,stamina:-8,positioning:-2} },
  { id:'meniscus', name:'Lesão de menisco', region:'knee', tissue:'joint', sides:['left','right'], baseSeverity:'serious', minRounds:4, maxRounds:10, recurrenceBase:.24, contactBias:.8, overloadBias:.8, attributeEffects:{pace:-4,stamina:-4} },
  { id:'metatarsal-fracture', name:'Fratura do metatarso', region:'foot', tissue:'bone', sides:['left','right'], baseSeverity:'severe', minRounds:7, maxRounds:16, recurrenceBase:.12, contactBias:1.1, overloadBias:.25, attributeEffects:{pace:-5,technique:-5,finishing:-6} },
  { id:'tibia-fracture', name:'Fratura da tíbia', region:'lowerLeg', tissue:'bone', sides:['left','right'], baseSeverity:'critical', minRounds:14, maxRounds:30, recurrenceBase:.16, contactBias:1.5, overloadBias:.15, attributeEffects:{pace:-10,stamina:-9,finishing:-5,tackling:-4} },
  { id:'fibula-fracture', name:'Fratura da fíbula', region:'lowerLeg', tissue:'bone', sides:['left','right'], baseSeverity:'severe', minRounds:9, maxRounds:20, recurrenceBase:.14, contactBias:1.3, overloadBias:.2, attributeEffects:{pace:-7,stamina:-6} },
  { id:'achilles', name:'Ruptura do tendão de Aquiles', region:'ankle', tissue:'tendon', sides:['left','right'], baseSeverity:'critical', minRounds:14, maxRounds:28, recurrenceBase:.22, contactBias:.3, overloadBias:1.15, attributeEffects:{pace:-10,stamina:-8} },
  { id:'hip-flexor', name:'Lesão do flexor do quadril', region:'hip', tissue:'muscle', sides:['left','right','bilateral'], baseSeverity:'serious', minRounds:3, maxRounds:8, recurrenceBase:.2, contactBias:.25, overloadBias:1.25, attributeEffects:{pace:-4,finishing:-3} },
  { id:'lumbar', name:'Lesão lombar', region:'back', tissue:'joint', sides:['central'], baseSeverity:'serious', minRounds:2, maxRounds:8, recurrenceBase:.27, contactBias:.35, overloadBias:1.1, attributeEffects:{stamina:-5,positioning:-2} },
  { id:'shoulder-dislocation', name:'Luxação de ombro', region:'shoulder', tissue:'joint', sides:['left','right'], baseSeverity:'serious', minRounds:3, maxRounds:7, recurrenceBase:.32, contactBias:1.5, overloadBias:.15, attributeEffects:{goalkeeping:-5} },
  { id:'hand-fracture', name:'Fratura da mão', region:'hand', tissue:'bone', sides:['left','right'], baseSeverity:'serious', minRounds:4, maxRounds:9, recurrenceBase:.1, contactBias:1.1, overloadBias:.1, attributeEffects:{goalkeeping:-8} },
  { id:'concussion', name:'Concussão', region:'head', tissue:'concussion', sides:['central'], baseSeverity:'serious', minRounds:1, maxRounds:4, recurrenceBase:.12, contactBias:1.8, overloadBias:.05, attributeEffects:{decisions:-5,positioning:-3} },
  { id:'facial-fracture', name:'Fratura facial', region:'head', tissue:'bone', sides:['central'], baseSeverity:'severe', minRounds:4, maxRounds:10, recurrenceBase:.06, contactBias:1.5, overloadBias:.02, attributeEffects:{decisions:-2} },
  { id:'bruise', name:'Contusão muscular', region:'thigh', tissue:'bruise', sides:['left','right'], baseSeverity:'minor', minRounds:0, maxRounds:2, recurrenceBase:.04, contactBias:1.6, overloadBias:.25, attributeEffects:{stamina:-1} },
];

function deterministicFoot(player:Player):Footedness {
  const n = [...player.id].reduce((s,c)=>s+c.charCodeAt(0),0)%100;
  return n < 73 ? 'right' : n < 93 ? 'left' : 'both';
}

function createProfile(player:Player):MedicalProfile {
  const agePenalty = Math.max(0,player.age-29);
  const seed = [...player.id].reduce((s,c)=>s+c.charCodeAt(0),0);
  return {
    playerId:player.id,
    footedness:deterministicFoot(player),
    injuryProneness:clamp(38+(seed%27)+agePenalty*1.5,20,88),
    painTolerance:clamp(45+((seed*7)%40),35,90),
    recovery:clamp(48+((seed*11)%40)-agePenalty*.7,30,92),
    durability:clamp(70-((seed*13)%28)-agePenalty*.9,28,88),
    activeInjuries:[], history:[], vulnerabilities:[], deficits:[], matchesMissed:0, daysEquivalentOut:0,
  };
}

export function medicalState(world:World):MedicalState {
  let state=stateByWorld.get(world);
  if(!state){state={profiles:new Map()};stateByWorld.set(world,state);}
  for(const club of world.clubs) for(const player of club.players) if(!state.profiles.has(player.id)) state.profiles.set(player.id,createProfile(player));
  return state;
}

export function medicalProfile(world:World,playerId:string):MedicalProfile|undefined { return medicalState(world).profiles.get(playerId); }
export function playerFootedness(world:World,playerId:string):Footedness { return medicalProfile(world,playerId)?.footedness ?? 'right'; }
export function activeInjuries(world:World,playerId:string):InjuryEvent[]{ return medicalProfile(world,playerId)?.activeInjuries ?? []; }
export function isUnavailable(world:World,playerId:string):boolean { return activeInjuries(world,playerId).some(i=>i.phase!=='returnToPlay'&&i.phase!=='resolved'); }

function findPlayer(world:World,id:string):Player|undefined { for(const club of world.clubs){const p=club.players.find(x=>x.id===id);if(p)return p;} return undefined; }
function clubFor(world:World,id:string):Club|undefined { return world.clubs.find(c=>c.players.some(p=>p.id===id)); }

function dominantAffected(profile:MedicalProfile,side:BodySide):boolean {
  return (profile.footedness==='right'&&side==='right')||(profile.footedness==='left'&&side==='left')||profile.footedness==='both';
}

function escalateSeverity(base:InjurySeverity,roll:number):InjurySeverity {
  const order:InjurySeverity[]=['minor','moderate','serious','severe','critical','careerThreatening'];
  let idx=order.indexOf(base);
  if(roll>.92) idx=Math.min(order.length-1,idx+2); else if(roll>.72) idx=Math.min(order.length-1,idx+1); else if(roll<.08) idx=Math.max(0,idx-1);
  return order[idx];
}

function vulnerabilityFor(profile:MedicalProfile,region:BodyRegion,side:BodySide,tissue:Tissue):Vulnerability|undefined {
  return profile.vulnerabilities.find(v=>v.region===region&&v.side===side&&v.tissue===tissue);
}

function createDeficits(profile:MedicalProfile,player:Player,injury:InjuryEvent,def:InjuryDefinition):void {
  const severity=severityWeight[injury.severity];
  for(const [attribute,raw] of Object.entries(def.attributeEffects) as [keyof PlayerAttributes,number][]) {
    let penalty=Math.abs(raw)*(0.45+severity*.16);
    if(injury.dominantSideAffected && ['finishing','technique','passing'].includes(attribute)) penalty*=1.45;
    if(def.tissue==='bone'&&['pace','stamina'].includes(attribute)) penalty*=1.25;
    if(def.id==='knee-acl'&&attribute==='pace') penalty*=1.25;
    const permanentFloor = injury.severity==='careerThreatening' ? penalty*.22 : injury.severity==='critical' ? penalty*.08 : 0;
    profile.deficits.push({
      id:`def-${injury.id}-${attribute}`,playerId:player.id,sourceInjuryId:injury.id,region:injury.region,side:injury.side,attribute,
      originalPenaltyPct:Number(penalty.toFixed(2)),currentPenaltyPct:Number(penalty.toFixed(2)),recoveryPerRound:Number((0.35+profile.recovery*.012).toFixed(2)),
      trainingSensitive:true,permanentFloorPct:Number(permanentFloor.toFixed(2)),
      description:`Déficit pós-${injury.name.toLowerCase()} em ${String(attribute)}${injury.dominantSideAffected?' no lado dominante':''}.`
    });
  }
}

function registerVulnerability(profile:MedicalProfile,injury:InjuryEvent,def:InjuryDefinition):void {
  let v=vulnerabilityFor(profile,injury.region,injury.side,injury.tissue);
  const severity=severityWeight[injury.severity];
  const increase=def.recurrenceBase*100*(0.55+severity*.18)+(injury.permanentDamage*18);
  if(!v){v={playerId:injury.playerId,region:injury.region,side:injury.side,tissue:injury.tissue,susceptibility:0,chronicity:0,lastInjurySeason:injury.season,lastInjuryRound:injury.round,sourceInjuryIds:[]};profile.vulnerabilities.push(v);}
  v.susceptibility=clamp(v.susceptibility+increase,0,92);
  v.chronicity=clamp(v.chronicity+(severity>=4?18:severity>=3?10:5),0,100);
  v.lastInjurySeason=injury.season;v.lastInjuryRound=injury.round;v.sourceInjuryIds.push(injury.id);
}

export function inflictInjury(world:World,player:Player,definition:InjuryDefinition,context:InjuryEvent['occurredContext'],forcedSide?:BodySide):InjuryEvent {
  const profile=medicalProfile(world,player.id)!;
  const side=forcedSide ?? definition.sides[randomInt(0,definition.sides.length-1)];
  const pre=vulnerabilityFor(profile,definition.region,side,definition.tissue);
  const severity=escalateSeverity(definition.baseSeverity,rnd()+((pre?.susceptibility??0)/220));
  const weight=severityWeight[severity];
  let rounds=Math.round(randomInt(definition.minRounds,definition.maxRounds)*(0.78+weight*.12)*(1.1-profile.recovery/500));
  if(severity==='careerThreatening') rounds=Math.max(rounds,24+randomInt(0,18));
  const dominant=dominantAffected(profile,side);
  const permanentDamage=clamp((weight-2)*.05+(pre?.chronicity??0)/550+(dominant&&definition.tissue==='bone'?.04:0),0,.45);
  const injury:InjuryEvent={
    id:`inj-${world.season}-${world.round}-${player.id}-${Math.floor(rnd()*1e7)}`,playerId:player.id,clubId:player.clubId,season:world.season,round:world.round,
    definitionId:definition.id,name:definition.name,region:definition.region,tissue:definition.tissue,side,severity,phase:'acute',occurredContext:context,
    roundsOutInitial:Math.max(1,rounds),roundsRemaining:Math.max(1,rounds),recurrenceRiskAtInjury:Number((definition.recurrenceBase+(pre?.susceptibility??0)/1000).toFixed(3)),permanentDamage:Number(permanentDamage.toFixed(3)),dominantSideAffected:dominant,notes:[]
  };
  if(dominant&&definition.tissue==='bone'&&['lowerLeg','ankle','foot'].includes(definition.region)) injury.notes.push('Lesão no membro dominante: risco temporário de perda de confiança técnica e no chute.');
  if(severity==='critical'||severity==='careerThreatening') injury.notes.push('Lesão de altíssima gravidade: pode deixar sequela funcional e elevar risco de recorrência a longo prazo.');
  if(pre&&pre.susceptibility>=30) injury.notes.push('Área já vulnerável por histórico anterior.');
  profile.activeInjuries.push(injury);profile.history.push(injury);registerVulnerability(profile,injury,definition);createDeficits(profile,player,injury,definition);
  player.morale=Math.round(clamp(player.morale-(weight>=5?14:weight>=4?9:weight>=3?5:2),30,100));
  return injury;
}

function injuryRiskForPlayer(world:World,club:Club,player:Player,played:boolean):number {
  const profile=medicalProfile(world,player.id)!;
  const age=Math.max(0,player.age-28)*.00035;
  const condition=Math.max(0,78-player.condition)*.0006;
  const tacticalLoad=((club.tactics.tempo+club.tactics.pressing)/200)*.0026;
  const history=profile.vulnerabilities.reduce((s,v)=>s+v.susceptibility,0)*.000018;
  const proneness=profile.injuryProneness*.000035;
  const durability=(100-profile.durability)*.000018;
  return clamp((played?.004:.0012)+age+condition+tacticalLoad+history+proneness+durability,.0004,.045);
}

function chooseDefinition(profile:MedicalProfile,contact:boolean):InjuryDefinition {
  const weighted=injuryDefinitions.map(def=>{
    let w=.4+(contact?def.contactBias:def.overloadBias);
    for(const v of profile.vulnerabilities) if(v.region===def.region&&v.tissue===def.tissue) w*=1+v.susceptibility/55;
    return {def,w};
  });
  let cursor=rnd()*weighted.reduce((s,x)=>s+x.w,0);
  for(const x of weighted){cursor-=x.w;if(cursor<=0)return x.def;}return weighted[weighted.length-1].def;
}

export function simulateMedicalAfterRound(world:World,participants?:Map<string,Set<string>>):void {
  medicalState(world);
  for(const club of world.clubs){
    const playedIds=participants?.get(club.id)??new Set<string>();
    for(const player of club.players){
      if(isUnavailable(world,player.id)) continue;
      const played=playedIds.has(player.id);
      const risk=injuryRiskForPlayer(world,club,player,played);
      if(rnd()<risk){
        const contact=played&&rnd()<.46;
        const profile=medicalProfile(world,player.id)!;
        const def=chooseDefinition(profile,contact);
        const recurrence=profile.vulnerabilities.some(v=>v.region===def.region&&v.susceptibility>35)&&rnd()<.35;
        inflictInjury(world,player,def,recurrence?'recurrence':contact?'contact':played?'match':'training');
      }
    }
  }
  tickRecovery(world);
}

function phaseFor(injury:InjuryEvent):InjuryPhase {
  const ratio=injury.roundsRemaining/injury.roundsOutInitial;
  if(injury.roundsRemaining<=0) return 'resolved';
  if(ratio>.78) return injury.tissue==='bone'?'immobilization':'acute';
  if(ratio>.36) return 'rehab';
  if(ratio>.12) return 'returnToTraining';
  return 'returnToPlay';
}

export function tickRecovery(world:World):void {
  const state=medicalState(world);
  for(const profile of state.profiles.values()){
    const player=findPlayer(world,profile.playerId);
    if(!player) continue;
    for(const injury of profile.activeInjuries){
      const accel=profile.recovery>=78&&rnd()<.2?1:0;
      injury.roundsRemaining=Math.max(0,injury.roundsRemaining-1-accel);
      injury.phase=phaseFor(injury);
      if(injury.roundsRemaining>0){profile.matchesMissed+=1;profile.daysEquivalentOut+=7;}
      if(injury.phase==='returnToPlay') player.condition=Math.min(player.condition,74);
    }
    profile.activeInjuries=profile.activeInjuries.filter(i=>i.phase!=='resolved');
    for(const deficit of profile.deficits){
      const relatedActive=profile.activeInjuries.some(i=>i.id===deficit.sourceInjuryId);
      if(relatedActive) continue;
      const trainingBonus=player.condition>=80?1.18:.82;
      deficit.currentPenaltyPct=Math.max(deficit.permanentFloorPct,deficit.currentPenaltyPct-deficit.recoveryPerRound*trainingBonus);
    }
    profile.deficits=profile.deficits.filter(d=>d.currentPenaltyPct>d.permanentFloorPct+.05 || d.permanentFloorPct>0);
    for(const v of profile.vulnerabilities){
      const activeSame=profile.activeInjuries.some(i=>i.region===v.region&&i.side===v.side);
      if(!activeSame) v.susceptibility=Math.max(v.chronicity*.18,v.susceptibility-.35);
    }
  }
}

export function effectiveAttributes(world:World,player:Player):PlayerAttributes {
  const result={...player.attributes};
  const profile=medicalProfile(world,player.id);
  if(!profile) return result;
  for(const deficit of profile.deficits){
    result[deficit.attribute]=Math.round(clamp(result[deficit.attribute]*(1-deficit.currentPenaltyPct/100),20,99));
  }
  for(const injury of profile.activeInjuries){
    if(injury.phase==='returnToPlay'){
      const def=injuryDefinitions.find(d=>d.id===injury.definitionId);
      if(def) for(const [attr,raw] of Object.entries(def.attributeEffects) as [keyof PlayerAttributes,number][]) result[attr]=Math.round(clamp(result[attr]+raw*.35,20,99));
    }
  }
  return result;
}

export function medicalSnapshot(world:World,playerId:string){
  const profile=medicalProfile(world,playerId);if(!profile)return undefined;
  return {
    available:!isUnavailable(world,playerId),footedness:profile.footedness,activeInjuries:profile.activeInjuries,
    history:[...profile.history].reverse(),vulnerabilities:[...profile.vulnerabilities].sort((a,b)=>b.susceptibility-a.susceptibility),
    deficits:[...profile.deficits].sort((a,b)=>b.currentPenaltyPct-a.currentPenaltyPct),matchesMissed:profile.matchesMissed,daysEquivalentOut:profile.daysEquivalentOut,
    riskIndex:Math.round(clamp(profile.injuryProneness*.45+(100-profile.durability)*.3+profile.vulnerabilities.reduce((s,v)=>s+v.susceptibility,0)*.08,0,100))
  };
}

export function severityName(severity:InjurySeverity):string{return severityLabel[severity];}
export function prepareAvailableSquads(world:World):Map<Club,Player[]> {
  const removed=new Map<Club,Player[]>();medicalState(world);
  for(const club of world.clubs){const unavailable=club.players.filter(p=>isUnavailable(world,p.id));removed.set(club,unavailable);club.players=club.players.filter(p=>!isUnavailable(world,p.id));}
  return removed;
}
export function restoreSquads(removed:Map<Club,Player[]>):void { for(const [club,players] of removed) club.players=[...club.players,...players]; }
