import './continue-flow-v1.css';
import type { World } from './engine';
import { advanceOneDay, dailyCalendar } from './daily-simulation';

let running=false;
const world=()=>window.__touchlineWorld as World|undefined;
const fmt=(iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${iso}T12:00:00Z`));

function button(){return document.querySelector<HTMLButtonElement>('[data-continue]')}
function setButton(active:boolean){const b=button();if(!b)return;b.disabled=active;b.classList.toggle('is-advancing',active);b.innerHTML=active?'PROCESSANDO <i>■</i>':'CONTINUAR <i>▶</i>'}
function setStatus(text:string){const overlay=document.querySelector<HTMLElement>('.v2-processing');if(!overlay)return;overlay.hidden=false;const span=overlay.querySelector<HTMLElement>('span');if(span)span.textContent=text}
function hideStatus(){const overlay=document.querySelector<HTMLElement>('.v2-processing');if(overlay)overlay.hidden=true}
function refreshDate(w:World){const date=dailyCalendar(w).date;document.querySelectorAll<HTMLElement>('[data-world-date]').forEach(x=>x.textContent=fmt(date))}
function refreshView(){const active=document.querySelector<HTMLButtonElement>('.game-sidebar [data-view].active');active?.click()}

async function runContinue(w:World){
 if(running)return;
 running=true;setButton(true);setStatus(`Avançando ${fmt(dailyCalendar(w).date)}…`);
 try{
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   const result=advanceOneDay(w);
   refreshDate(w);
   refreshView();
   hideStatus();
   setButton(false);
   running=false;
   window.dispatchEvent(new CustomEvent('touchline:continue-day',{detail:{date:dailyCalendar(w).date,days:1,result}}));
 }catch(error){
   console.error('continue flow failed',error);
   running=false;setButton(false);hideStatus();
   window.dispatchEvent(new ErrorEvent('error',{error,message:String(error)}));
 }
}

document.addEventListener('click',event=>{
 const target=(event.target as HTMLElement|null)?.closest<HTMLElement>('[data-continue]');if(!target)return;
 const w=world();if(!w)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(running)return;
 void runContinue(w);
},true);

window.addEventListener('touchline:world-ready',()=>setButton(false));
window.addEventListener('touchline:save-loaded',()=>{running=false;setButton(false);hideStatus()});
