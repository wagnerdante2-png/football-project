import { createBrazilRealWorld2026 } from '../src/real-world-v1';
import { simulateFixtureV2 } from '../src/match-world-integration-v2';
import { snapshotTacticalMemory } from '../src/match-tactical-learning-v2';

const world=createBrazilRealWorld2026();
const fixture=world.fixtures.find(f=>f.round===1);
if(!fixture)throw new Error('No fixture available for match integration smoke');
const home=world.clubs.find(c=>c.id===fixture.home),away=world.clubs.find(c=>c.id===fixture.away);
if(!home||!away)throw new Error('Fixture clubs missing');
const homeTactics={...home.tactics},awayTactics={...away.tactics};
const state=simulateFixtureV2(world,fixture,{competitionId:'league',date:'2026-07-25'});
if(!fixture.played)throw new Error('Fixture was not completed');
if(!fixture.stats||fixture.homeGoals===undefined||fixture.awayGoals===undefined)throw new Error('Fixture result/stats missing');
const actionMap=((fixture as any).actionMap??[]) as Array<{second:number;type:string;position:{x:number;y:number}}>;
if(!actionMap.length)throw new Error('Persisted action map is missing');
for(const point of actionMap){
  if(!Number.isFinite(point.second)||!Number.isFinite(point.position?.x)||!Number.isFinite(point.position?.y))throw new Error(`Invalid action-map point: ${JSON.stringify(point)}`);
  if(point.position.x<0||point.position.x>state.pitch.length||point.position.y<0||point.position.y>state.pitch.width)throw new Error(`Action-map point outside pitch: ${JSON.stringify(point)}`);
}
if(!actionMap.some(point=>point.type==='shot'||point.type==='goal'))throw new Error('Action map contains no recorded shot/goal position');
const env=(state as any).__environment;
if(!env||!Number.isFinite(env.temperature)||!env.weather)throw new Error('World weather was not attached to match state');
const memories=snapshotTacticalMemory(state);
if(memories.length<2)throw new Error(`Expected tactical learning for both clubs, got ${memories.length}`);
if(!memories.some(([,m])=>m.observations.length>0))throw new Error('Tactical learning produced no observations');
for(const key of ['pressing','width','defensiveLine'] as const){
  if(home.tactics[key]!==homeTactics[key])throw new Error(`Home tactics ${key} leaked after match`);
  if(away.tactics[key]!==awayTactics[key])throw new Error(`Away tactics ${key} leaked after match`);
}
console.log(`[smoke-match] ${home.name} ${fixture.homeGoals}-${fixture.awayGoals} ${away.name} · ${env.weather} ${env.temperature}C · tactical memories=${memories.length} · actionMap=${actionMap.length} · OK`);
