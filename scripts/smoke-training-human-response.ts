import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { clubTraining } from '../src/training-engine';
import { clubDressingRoom, tickDressingRoom } from '../src/dressing-room';
import { humanLifeState } from '../src/human-life';
import { emitWorldEvent, recentWorldEvents } from '../src/event-bus';
import { wireTrainingLoadConcerns } from '../src/training-load-concerns-runtime-v1';

const world=createBrazilRealWorld2026(),club=world.clubs[0],date=`${world.season}-08-26`;
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

const overload=stateFor(0);
overload.person.professionalism=55;overload.person.temperament=78;overload.profile.stressResilience=35;
overload.state.load.acuteLoad=32;overload.state.load.chronicLoad=15;overload.state.load.readiness=34;overload.state.load.overloadDays=4;overload.state.load.strain=1650;overload.state.load.monotony=2;
const overloadHappy=overload.status.overallHappiness,overloadTrust=overload.status.managerTrust;
emitWorldEvent(world,{type:'TrainingCompleted',date,clubIds:[club.id],summary:'Human training response overload smoke.',payload:{restDay:false}});
const overloadConcern=recentWorldEvents(world,30,{clubId:club.id,playerId:overload.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('training-load'));
if(!overloadConcern||overloadConcern.payload.reason!=='overload')throw new Error('Overload did not create a human training concern');
if(!(overload.status.overallHappiness<overloadHappy)||!(overload.status.managerTrust<overloadTrust))throw new Error('Overload concern did not affect happiness/trust');
if(overloadConcern.payload.stressResilience!==35||overloadConcern.payload.temperament!==78)throw new Error('Concern payload omitted human personality context');
const afterConcernHappy=overload.status.overallHappiness,afterConcernTrust=overload.status.managerTrust,afterConcernGrievance=overload.status.grievanceDays;
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-27`,clubIds:[club.id],summary:'Rest should not affect training sentiment.',payload:{restDay:true}});
if(overload.status.overallHappiness!==afterConcernHappy||overload.status.managerTrust!==afterConcernTrust||overload.status.grievanceDays!==afterConcernGrievance)throw new Error('Rest day changed human training sentiment');

const under=stateFor(1);
under.person.professionalism=95;under.person.temperament=45;under.profile.stressResilience=82;under.status.overallHappiness=52;under.status.grievanceDays=2;
under.state.load.acuteLoad=8;under.state.load.chronicLoad=20;under.state.load.readiness=92;under.state.load.overloadDays=0;under.state.load.strain=260;under.state.load.monotony=1.1;
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-28`,clubIds:[club.id],summary:'Human training response undertraining smoke.',payload:{restDay:false}});
const underConcern=recentWorldEvents(world,30,{clubId:club.id,playerId:under.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('undertraining'));
if(!underConcern)throw new Error('Highly professional undertrained player did not raise concern');

const monotony=stateFor(2);
monotony.person.temperament=72;monotony.profile.stressResilience=55;monotony.status.overallHappiness=52;monotony.status.grievanceDays=2;
monotony.state.load.acuteLoad=20;monotony.state.load.chronicLoad=20;monotony.state.load.readiness=72;monotony.state.load.overloadDays=0;monotony.state.load.strain=1050;monotony.state.load.monotony=2.9;
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-29`,clubIds:[club.id],summary:'Human training response monotony smoke.',payload:{restDay:false}});
const monotonyConcern=recentWorldEvents(world,30,{clubId:club.id,playerId:monotony.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('monotony'));
if(!monotonyConcern)throw new Error('Persistent monotonous training did not raise concern');

const individual=stateFor(3);
individual.state.load.acuteLoad=18;individual.state.load.chronicLoad=18;individual.state.load.readiness=70;individual.state.load.overloadDays=0;individual.state.load.strain=600;individual.state.load.monotony=1.4;
individual.state.individual={playerId:individual.player.id,focus:'roleWork',intensity:'medium',startedDate:`${world.season}-08-20`,progress:12,satisfaction:30};
emitWorldEvent(world,{type:'TrainingCompleted',date:`${world.season}-08-30`,clubIds:[club.id],summary:'Human individual training frustration smoke.',payload:{restDay:false}});
const individualConcern=recentWorldEvents(world,30,{clubId:club.id,playerId:individual.player.id,types:['DressingRoomConcern']}).find(e=>e.tags.includes('individual-plan'));
if(!individualConcern)throw new Error('Severe individual-plan frustration did not raise concern');

console.log(`[smoke-training-human-response] overload=${overload.player.name} · undertraining=${under.player.name} · monotony=${monotony.player.name} · individual=${individual.player.name} · restNoChange=OK · personalityContext=OK · OK`);
