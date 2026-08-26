import fs from 'node:fs';

const path='src/economy.ts';
let source=fs.readFileSync(path,'utf8');

const oldState=`export function economyState(world:World):EconomyState{\n  let state=economyByWorld.get(world); if(!state){state={contracts:new Map(),finances:new Map(),freeAgents:[],transfers:[],loans:[]};economyByWorld.set(world,state);}\n`;
const newState=`function economyContainer(world:World):EconomyState{\n  let state=economyByWorld.get(world);\n  if(!state){state={contracts:new Map(),finances:new Map(),freeAgents:[],transfers:[],loans:[]};economyByWorld.set(world,state);}\n  return state;\n}\nexport function economyState(world:World):EconomyState{\n  const state=economyContainer(world);\n`;

const oldFinance=`export function clubFinance(world:World,clubId:string):ClubFinance|undefined{return economyState(world).finances.get(clubId);}`;
const newFinance=`export function clubFinance(world:World,clubId:string):ClubFinance|undefined{\n  const state=economyContainer(world);\n  const existing=state.finances.get(clubId);\n  if(existing)return existing;\n  const club=world.clubs.find(c=>c.id===clubId);if(!club)return undefined;\n  const finance=createFinance(club);\n  finance.wageSpend=Math.round(club.players.reduce((sum,p)=>sum+suggestedWage(p,club),0));\n  state.finances.set(club.id,finance);\n  return finance;\n}`;

if(!source.includes(oldState))throw new Error('Expected economyState bootstrap block not found; refusing migration');
if(!source.includes(oldFinance))throw new Error('Expected clubFinance export not found; refusing migration');
source=source.replace(oldState,newState).replace(oldFinance,newFinance);
fs.writeFileSync(path,source);
console.log('Economy UI performance migration applied safely.');
