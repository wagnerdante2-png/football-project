import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { clubTraining } from '../src/training-engine';
import { clubDressingRoom, tickDressingRoom } from '../src/dressing-room';
import { humanLifeState } from '../src/human-life';
import { emitWorldEvent, recentWorldEvents } from '../src/event-bus';
import { humanTrainingMemory, wireTrainingLoadConcerns, type HumanTrainingMemory } from '../src/training-load-concerns-runtime-v1';
import { pendingManagerInteractions, resolveManagerInteraction } from '../src/manager-interactions';
import { createDefaultManagerCharacter } from '../src/manager-character';
import { wireHumanManagerControl } from '../src/manager-human-control-runtime-v1';
import { restoreSave, serializeSave } from '../src/save-game';

const world=createBrazilRealWorld2026(),club=world.clubs[0],date=`${world.season}-08-26`;
createDefaultManagerCharacter(world,club.id,'Smoke Human Manager');
wireHumanManagerControl(world);
tickDressingRoom(world,date);
wireTrainingLoadConcerns(world);
const training=clubTraining(world,club.id),room=clubDressingRoom(world,club.id),life=humanLifeState(world);
if(!training||!room)throw new Error('Training or dressing room unavailable');
const players=club.players.slice(0,4);
if(players.length<4)throw new Error('Need at least four players for human training smoke');

function stateFor(index:number){
  const player=players[index],state=training.players.get(player.id),status=room.players.get(player.id),person=life.people.get(player.id),profile=life.profiles.get(player.id);
  if(!state||!status||!person||!profile)throw new Error(`Missing human state for ${player.name}`);
  return{player,state,status,person,profile};
}
function setTrainingMemory(state:(typeof training.players extends Map<string,infer T>?T:never),patch:HumanTrainingMemory){Object.assign(state,patch);}
function completePersistentConcern(target:ReturnType<typeof stateFor>,startDay:number,tag:string){
  for(let offset=0;offset<3;offset++)emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-${String(startDay+offset).padStart(2,'0')}`,clubIds:[club.id],summary:`Persistent ${tag} training response smoke.`,payload:{restDay:false}});
  return recentWorldEvents(world,80,{clubId:club.id,playerId:target.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes(tag));
}

const overload=stateFor(0);
overload.person.professionalism=55;overload.person.temperament=78;overload.profile.stressResilience=35;
overload.state.load.acuteLoad=32;overload.state.load.chronicLoad=15;overload.state.load.readiness=34;overload.state.load.overloadDays=4;overload.state.load.strain=1650;overload.state.load.monotony=2;
const overloadHappy=overload.status.overallHappiness,overloadTrust=overload.status.managerTrust;
emitWorldEvent(world,{type:'TrainingCompleted',date,clubIds:[club.id],summary:'Human training response overload smoke.',payload:{restDay:false}});
const overloadConcern=recentWorldEvents(world,40,{clubId:club.id,playerId:overload.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('training-load'));
if(!overloadConcern||overloadConcern.payload.reason!=='overload')throw new Error('Overload did not create a human training concern');
if(!(overload.status.overallHappiness<overloadHappy)||!(overload.status.managerTrust<overloadTrust))throw new Error('Overload concern did not affect happiness/trust');
if(overloadConcern.payload.stressResilience!==35||overloadConcern.payload.temperament!==78)throw new Error('Concern payload omitted human personality context');
const memoryAfterConcern=humanTrainingMemory(overload.state);
if(!(memoryAfterConcern.trainingSatisfaction<65)||memoryAfterConcern.trainingGrievanceDays!==1)throw new Error('Training-specific concern memory was not persisted in player training state');

const interaction=pendingManagerInteractions(world,club.id).find(item=>item.sourceEventId===overloadConcern.id);
if(!interaction)throw new Error('Training concern did not open a manager interaction');
if(interaction.aiControlled)throw new Error('User-controlled club interaction was left under AI control');
if(!interaction.options.some(option=>option.id==='reduce_training_load')||interaction.options.some(option=>option.id==='bench'))throw new Error('Overload interaction did not receive cause-specific training options');
const responseBefore=humanTrainingMemory(overload.state);
if(!resolveManagerInteraction(world,interaction.id,'reduce_training_load',`${world.season}-08-26`))throw new Error('Could not resolve training concern with specific load response');
const responseAfter=humanTrainingMemory(overload.state);
if(!(responseAfter.trainingSatisfaction>responseBefore.trainingSatisfaction)||!(responseAfter.trainingGrievanceDays<responseBefore.trainingGrievanceDays))throw new Error('Supportive manager response did not improve training sentiment');
const responded=recentWorldEvents(world,40,{clubId:club.id,playerId:overload.player.id,types:['TrainingConcernResponded']}).find(e=>e.payload.interactionId===interaction.id);
if(!responded||responded.payload.optionId!=='reduce_training_load')throw new Error('Resolved manager interaction did not feed the specific training response back into training state');

const afterConcernHappy=overload.status.overallHappiness,afterConcernTrust=overload.status.managerTrust,afterResponseMemory=humanTrainingMemory(overload.state);
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-27`,clubIds:[club.id],summary:'Rest should not affect training sentiment.',payload:{restDay:true}});
const afterRestMemory=humanTrainingMemory(overload.state);
if(overload.status.overallHappiness!==afterConcernHappy||overload.status.managerTrust!==afterConcernTrust||afterRestMemory.trainingSatisfaction!==afterResponseMemory.trainingSatisfaction||afterRestMemory.trainingGrievanceDays!==afterResponseMemory.trainingGrievanceDays)throw new Error('Rest day changed human training sentiment');

const restored=restoreSave(serializeSave(world)),restoredState=clubTraining(restored,club.id)?.players.get(overload.player.id);
if(!restoredState)throw new Error('Training player state missing after save/restore');
const restoredMemory=humanTrainingMemory(restoredState);
if(restoredMemory.trainingSatisfaction!==afterResponseMemory.trainingSatisfaction||restoredMemory.trainingGrievanceDays!==afterResponseMemory.trainingGrievanceDays||restoredMemory.trainingLastResolvedDate!==afterResponseMemory.trainingLastResolvedDate)throw new Error('Human training memory did not survive save/restore');
wireHumanManagerControl(restored);
wireTrainingLoadConcerns(restored);
const restoredRoom=clubDressingRoom(restored,club.id);
if(!restoredRoom)throw new Error('Dressing room missing after restore');
restoredState.load.overloadDays=3;restoredState.load.readiness=40;
emitWorldEvent(restored,{type:'TrainingCompleted',date:`${world.season}-09-03`,clubIds:[club.id],summary:'Post-restore human training concern smoke.',payload:{restDay:false}});
const postRestoreConcern=recentWorldEvents(restored,60,{clubId:club.id,playerId:overload.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('training-load'));
if(!postRestoreConcern)throw new Error('Post-restore training concern failed to materialize dressing-room player state');
const restoredInteraction=pendingManagerInteractions(restored,club.id).find(item=>item.sourceEventId===postRestoreConcern.id);
if(!restoredInteraction||restoredInteraction.aiControlled)throw new Error('Restored user-controlled interaction was not protected from AI control');
if(!restoredInteraction.options.some(option=>option.id==='reduce_training_load'))throw new Error('Post-restore concern lost its specialized training options');

const under=stateFor(1);
under.person.professionalism=95;under.person.temperament=45;under.profile.stressResilience=82;
setTrainingMemory(under.state,{trainingSatisfaction:52,trainingGrievanceDays:0});
under.state.load.acuteLoad=8;under.state.load.chronicLoad=20;under.state.load.readiness=92;under.state.load.overloadDays=0;under.state.load.strain=260;under.state.load.monotony=1.1;
const underConcern=completePersistentConcern(under,28,'undertraining');
if(!underConcern)throw new Error('Highly professional undertrained player did not raise persistent concern');
const underInteraction=pendingManagerInteractions(world,club.id).find(item=>item.sourceEventId===underConcern.id);
if(!underInteraction?.options.some(option=>option.id==='increase_training_load'))throw new Error('Undertraining concern did not receive higher-load response options');

const monotony=stateFor(2);
monotony.person.temperament=72;monotony.profile.stressResilience=55;
setTrainingMemory(monotony.state,{trainingSatisfaction:52,trainingGrievanceDays:0});
monotony.state.load.acuteLoad=20;monotony.state.load.chronicLoad=20;monotony.state.load.readiness=72;monotony.state.load.overloadDays=0;monotony.state.load.strain=1050;monotony.state.load.monotony=2.9;
const monotonyConcern=completePersistentConcern(monotony,31,'monotony');
if(!monotonyConcern)throw new Error('Persistent monotonous training did not raise concern');
const monotonyInteraction=pendingManagerInteractions(world,club.id).find(item=>item.sourceEventId===monotonyConcern.id);
if(!monotonyInteraction?.options.some(option=>option.id==='vary_training_sessions'))throw new Error('Monotony concern did not receive session-variation response options');

const individual=stateFor(3);
individual.state.load.acuteLoad=18;individual.state.load.chronicLoad=18;individual.state.load.readiness=70;individual.state.load.overloadDays=0;individual.state.load.strain=600;individual.state.load.monotony=1.4;
individual.state.individual={playerId:individual.player.id,focus:'roleWork',intensity:'medium',startedDate:`${world.season}-08-20`,progress:12,satisfaction:30};
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-09-04`,clubIds:[club.id],summary:'Human individual training frustration smoke.',payload:{restDay:false}});
const individualConcern=recentWorldEvents(world,100,{clubId:club.id,playerId:individual.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('individual-plan'));
if(!individualConcern)throw new Error('Severe individual-plan frustration did not raise concern');
const individualInteraction=pendingManagerInteractions(world,club.id).find(item=>item.sourceEventId===individualConcern.id);
if(!individualInteraction?.options.some(option=>option.id==='review_individual_plan'))throw new Error('Individual-plan concern did not receive plan-review response options');

console.log(`[smoke-training-human-response] overload=${overload.player.name} · humanControl=OK · specificOptions=OK · interactionLoop=OK · saveRestore=OK · postRestoreHumanControl=OK · postRestoreMaterialization=OK · undertraining=${under.player.name} · monotony=${monotony.player.name} · individual=${individual.player.name} · restNoChange=OK · personalityContext=OK · OK`);
