import './v2-system-overrides.css';

let scheduled=false;
function syncLegacyNavigation(){
  const nav=document.querySelector<HTMLElement>('.game-sidebar nav');
  if(!nav)return;
  const nativeTraining=nav.querySelector<HTMLButtonElement>('[data-view="training"]');
  const legacyTraining=nav.querySelector<HTMLButtonElement>('[data-training-view]');
  if(nativeTraining&&legacyTraining){legacyTraining.hidden=true;legacyTraining.dataset.v2Proxy='training'}
  for(const id of ['medical','systems'] as const){
    const native=nav.querySelector<HTMLButtonElement>(`[data-view="${id}"]`);
    const legacy=nav.querySelector<HTMLButtonElement>(`[data-system-view="${id}"]`);
    if(native&&legacy){legacy.hidden=true;legacy.dataset.v2Proxy=id}
  }
  nav.querySelectorAll<HTMLButtonElement>('button').forEach((b,i,all)=>{
    const label=b.textContent?.trim().replace(/\s+/g,' ').toLowerCase();
    if(!label)return;
    const first=all.findIndex(x=>x.textContent?.trim().replace(/\s+/g,' ').toLowerCase()===label&&!x.hidden);
    if(first>=0&&first<i&&!b.dataset.saveView)b.hidden=true;
  });
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;syncLegacyNavigation()})}

document.addEventListener('click',e=>{
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('.game-sidebar [data-view]');
  if(!b)return;
  const id=b.dataset.view;
  if(id==='training'){
    const proxy=document.querySelector<HTMLButtonElement>('.game-sidebar [data-training-view]');
    if(proxy&&proxy!==b){e.preventDefault();queueMicrotask(()=>proxy.click())}
  }else if(id==='medical'||id==='systems'){
    const proxy=document.querySelector<HTMLButtonElement>(`.game-sidebar [data-system-view="${id}"]`);
    if(proxy&&proxy!==b){e.preventDefault();queueMicrotask(()=>proxy.click())}
  }
},true);

window.addEventListener('touchline:world-ready',schedule);
window.addEventListener('touchline:view-rendered',schedule);
const root=document.querySelector('#app');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
