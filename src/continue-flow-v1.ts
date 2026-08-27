import './continue-flow-v1.css';
import type { World } from './engine';
import { advanceOneDay, dailyCalendar } from './daily-simulation';
import { userManager } from './manager-character';
import { worldCore } from './world-core-v2';

let running=false;
let stopRequested=false;
const sleep=(ms:number)=>new Promise<void>(resolve=>window.setTimeout(resolve,ms));
const world=()=>window.__touchlineWorld as World|undefined;
const fmt=(iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${iso}T12:00:00Z`));

const decisionTypes=new Set(['ManagerInteractionOpened','ManagerInterviewOpened','ManagerJobOffer','ManagerContractNegotiationStarted','NegotiationStarted','TeamTalkOpened','PromiseBroken','DressingRoomCrisis','PlayerInjured','RecruitmentApproved','RecruitmentRejected','MatchDayStarted','MatchCompleted']);
function relevantAttention(w:World,from:number){
 const manager=userManager(w),clubId=manager?.currentClubId;
 const events=worldCore(w).events.slice(from);
 return events.find(e=>{
   const related=!clubId||e.scope==='world'||e.scope==='competition'||e.entityIds.includes(clubId)||e.clubIds?.includes?.(clubId);
   return related&&(e.importance>=3||decisionTypes.has(e.type));
 });
}
function nextManagedFixtureDays(w:World){
 const clubId=userManager(w)?.currentClubId;if(!clubId)return 7;
 const fixture=w.fixtures.find(f=>!f.played&&(f.home===clubId||f.away===clubId));if(!fixture)return 14;
 const date=dailyCalendar(w).matchDates.get(fixture.round);if(!date)return 7;
 const now=new Date(`${dailyCalendar(w).date}T12:00:00Z`).getTime(),then=new Date(`${date}T12:00:00Z`).getTime();
 return Math.max(1,Math.ceil((then-now)/86400000));
}
function button(){return document.querySelector<HTMLButtonElement>('[data-continue]')}
function setButton(active:boolean){const b=button();if(!b)return;b.disabled=false;b.classList.toggle('is-advancing',active);b.innerHTML=active?'ASSUMIR CONTROLE <i>■</i>':'CONTINUAR <i>▶</i>'}
function setStatus(text:string){const overlay=document.querySelector<HTMLElement>('.v2-processing');if(!overlay)return;overlay.hidden=false;const span=overlay.querySelector<HTMLElement>('span');if(span)span.textContent=text}
function hideStatus(){const overlay=document.querySelector<HTMLElement>('.v2-processing');if(overlay)overlay.hidden=true}
function refreshDate(w:World){const date=dailyCalendar(w).date;document.querySelectorAll<HTMLElement>('[data-world-date]').forEach(x=>x.textContent=fmt(date))}
function refreshView(){const active=document.querySelector<HTMLButtonElement>('.game-sidebar [data-view].active');active?.click()}

async function runContinue(w:World){
 running=true;stopRequested=false;setButton(true);
 const startEvents=worldCore(w).events.length;
 const fixtureDistance=nextManagedFixtureDays(w);
 // Quiet periods may flow for several days, but never run away from the player.
 const maxDays=fixtureDistance>10?14:Math.max(1,Math.min(7,fixtureDistance));
 let days=0;
 try{
   while(!stopRequested&&days<maxDays){
     const beforeEvents=worldCore(w).events.length;
     const beforeRound=w.round;
     setStatus(days===0?'Processando o próximo dia…':`Calendário avançando · ${fmt(dailyCalendar(w).date)} · clique em ASSUMIR CONTROLE para parar`);
     await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
     const result=advanceOneDay(w);days++;refreshDate(w);
     window.dispatchEvent(new CustomEvent('touchline:continue-day',{detail:{date:dailyCalendar(w).date,days,result}}));
     const attention=relevantAttention(w,beforeEvents);
     const roundChanged=w.round!==beforeRound;
     if(attention||result.matchDay||result.domesticMatches>0||result.clubCupMatches>0||result.continentalClubMatches>0||roundChanged)break;
     await sleep(180);
   }
   if(!stopRequested&&!relevantAttention(w,startEvents)&&days>=maxDays)setStatus(`${days} dias processados · devolvendo o controle`);
 }catch(error){
   console.error('continue flow failed',error);
   window.dispatchEvent(new ErrorEvent('error',{error,message:String(error)}));
 }finally{
   refreshDate(w);refreshView();await sleep(120);running=false;stopRequested=false;setButton(false);hideStatus();
 }
}

document.addEventListener('click',event=>{
 const target=(event.target as HTMLElement|null)?.closest<HTMLElement>('[data-continue]');if(!target)return;
 const w=world();if(!w)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(running){stopRequested=true;setStatus('Assumindo controle…');return}
 void runContinue(w);
},true);

window.addEventListener('touchline:world-ready',()=>setButton(false));
window.addEventListener('touchline:save-loaded',()=>{running=false;stopRequested=false;setButton(false);hideStatus()});
