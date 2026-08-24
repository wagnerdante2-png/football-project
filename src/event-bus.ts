import type { World } from './engine';

export type WorldEventType =
  | 'DayAdvanced' | 'MatchDayStarted' | 'MatchCompleted' | 'TrainingCompleted' | 'TrainingOverloadWarning'
  | 'PlayerInjured' | 'PlayerRecovered' | 'PlayerRetired' | 'YouthPlayerGenerated'
  | 'TransferRequested' | 'RecruitmentApproved' | 'RecruitmentRejected'
  | 'NegotiationStarted' | 'NegotiationUpdated' | 'NegotiationLeaked' | 'NegotiationEnded'
  | 'ContractExpiring' | 'ContractRenewed' | 'PlayerReleased'
  | 'PromiseMade' | 'PromiseBroken' | 'PromiseKept'
  | 'ManagerRelationshipChanged' | 'BoardPressureChanged'
  | 'SupporterMoodChanged' | 'MediaStoryPublished'
  | 'PersonalLifeEvent' | 'PersonalDecisionMade' | 'RelationshipChanged'
  | 'CaptaincyChanged' | 'MentorshipStarted' | 'SquadTurnover' | 'DressingRoomConcern' | 'DressingRoomCrisis'
  | 'ManagerInteractionOpened' | 'ManagerInteractionResolved' | 'ManagerInteractionExpired' | 'PlayerManagerRelationshipChanged'
  | 'ManagerEducationStarted' | 'ManagerEducationCompleted' | 'ManagerLicenceUpgraded'
  | 'ManagerIdentityShift' | 'ManagerSpecialisationUnlocked'
  | 'ManagerSacked' | 'ManagerResigned' | 'ManagerHired' | 'ManagerJobOffer' | 'ManagerJobOfferRejected' | 'ManagerJobOfferWithdrawn' | 'ManagerContractRenewed'
  | 'SeasonEnded' | 'SeasonStarted';

export type WorldEvent={id:string;sequence:number;type:WorldEventType;date:string;season:number;round:number;actorIds:string[];clubIds:string[];playerIds:string[];importance:1|2|3|4|5;tags:string[];summary:string;payload:Record<string,unknown>};
export type EventListener=(event:WorldEvent,world:World)=>void;
export type EventBusState={events:WorldEvent[];nextSequence:number;listeners:Map<WorldEventType|'*',Set<EventListener>>};
export type EventBusSnapshot={events:WorldEvent[];nextSequence:number};
const states=new WeakMap<World,EventBusState>();
export function eventBusState(world:World):EventBusState{let state=states.get(world);if(!state){state={events:[],nextSequence:1,listeners:new Map()};states.set(world,state);}return state;}
export function onWorldEvent(world:World,type:WorldEventType|'*',listener:EventListener):()=>void{const state=eventBusState(world);let set=state.listeners.get(type);if(!set){set=new Set();state.listeners.set(type,set);}set.add(listener);return()=>set!.delete(listener);}
export function emitWorldEvent(world:World,input:{type:WorldEventType;date?:string;actorIds?:string[];clubIds?:string[];playerIds?:string[];importance?:1|2|3|4|5;tags?:string[];summary:string;payload?:Record<string,unknown>}):WorldEvent{const state=eventBusState(world);const seq=state.nextSequence++;const event:WorldEvent={id:`evt-${world.season}-${seq}`,sequence:seq,type:input.type,date:input.date??`${world.season}-01-01`,season:world.season,round:world.round,actorIds:input.actorIds??[],clubIds:input.clubIds??[],playerIds:input.playerIds??[],importance:input.importance??2,tags:input.tags??[],summary:input.summary,payload:input.payload??{}};state.events.push(event);if(state.events.length>10000)state.events.splice(0,state.events.length-10000);for(const listener of state.listeners.get(event.type)??[])listener(event,world);for(const listener of state.listeners.get('*')??[])listener(event,world);return event;}
export function recentWorldEvents(world:World,limit=100,filter?:{clubId?:string;playerId?:string;types?:WorldEventType[]}):WorldEvent[]{return [...eventBusState(world).events].reverse().filter(e=>(!filter?.clubId||e.clubIds.includes(filter.clubId))&&(!filter?.playerId||e.playerIds.includes(filter.playerId))&&(!filter?.types||filter.types.includes(e.type))).slice(0,limit);}
export function snapshotEventBus(world:World):EventBusSnapshot{const state=eventBusState(world);return{events:state.events.map(e=>({...e,actorIds:[...e.actorIds],clubIds:[...e.clubIds],playerIds:[...e.playerIds],tags:[...e.tags],payload:{...e.payload}})),nextSequence:state.nextSequence};}
export function restoreEventBus(world:World,snapshot:EventBusSnapshot):void{const state=eventBusState(world);state.events=snapshot.events.map(e=>({...e,actorIds:[...e.actorIds],clubIds:[...e.clubIds],playerIds:[...e.playerIds],tags:[...e.tags],payload:{...e.payload}}));state.nextSequence=Math.max(snapshot.nextSequence,(state.events.at(-1)?.sequence??0)+1);}
