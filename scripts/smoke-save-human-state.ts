import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { humanDialogueFeed, speakAs, snapshotHumanVoices } from '../src/human-voice-state-v1';
import { importRealPlayer, snapshotRealWorldPeople } from '../src/real-world-person-import-v1';
import { serializeSave, restoreSave } from '../src/save-game';

function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}
const world=createBrazilRealWorld2026();
const isolatedWorld=createBrazilRealWorld2026();

speakAs(world,'journalist-regression','journalist',{audience:'press',topic:'result',tone:'firm',seed:'save-human-state',positive:false,pressure:82},0);
speakAs(world,'journalist-regression','journalist',{audience:'press',topic:'result',tone:'firm',seed:'save-human-state-2',positive:false,pressure:82},1);
assert(humanDialogueFeed(world).length===2,'Primary world dialogue feed was not populated');
assert(humanDialogueFeed(isolatedWorld).length===0,'Dialogue feed leaked into a second world');

speakAs(isolatedWorld,'journalist-isolated','journalist',{audience:'press',topic:'transfer',tone:'calm',seed:'isolated-world',positive:true,pressure:30},0);
assert(humanDialogueFeed(isolatedWorld).length===1,'Second world dialogue feed was not populated independently');
assert(humanDialogueFeed(world).length===2,'Second world dialogue mutated the primary world feed');

importRealPlayer(world,{name:'Persistence Test Player',dateOfBirth:'2004-03-12',position:'CM',nationalityCountryIds:['BR'],birthCountryId:'BR',currentAbility:63,potentialAbility:78,provenance:[{source:'manual-public-fact',snapshotDate:'2026-08-27',license:'public-fact-reference',confidence:95}]});

const voicesBefore=snapshotHumanVoices(world),peopleBefore=snapshotRealWorldPeople(world);
assert(voicesBefore.profiles.length>0,'Human voice profile was not created');
assert((voicesBefore.feed?.length??0)===2,'Human dialogue feed was not populated');
assert(peopleBefore.players.length===1,'Real-world person import state was not populated');

const restored=restoreSave(serializeSave(world));
const voicesAfter=snapshotHumanVoices(restored),peopleAfter=snapshotRealWorldPeople(restored);
assert(JSON.stringify(voicesAfter)===JSON.stringify(voicesBefore),'Human voice state diverged after save/load');
assert(JSON.stringify(peopleAfter)===JSON.stringify(peopleBefore),'Real-world person provenance state diverged after save/load');
assert(humanDialogueFeed(isolatedWorld).length===1,'Restoring another world contaminated the isolated feed');
console.log(`[smoke-save-human-state] voices=${voicesAfter.profiles.length} feed=${voicesAfter.feed?.length??0} realPeople=${peopleAfter.players.length} isolation=OK roundtrip=OK`);
