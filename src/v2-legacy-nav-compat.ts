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
  const buttons=[...nav.querySelectorAll<HTMLButtonElement>('button')];
  buttons.forEach((b,i)=>{
    const label=b.textContent?.trim().replace(/\s+/g,' ').toLowerCase();
    if(!label)return;
    const first=buttons.findIndex((x:HTMLButtonElement)=>x.textContent?.trim().replace(/\s+/g,' ').toLowerCase()===label&&!x.hidden);
    if(first>=0&&first<i&&!b.dataset.saveView)b.hidden=true;
  });
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;syncLegacyNavigation()})}
function launchCanonicalSystem(id:string){
  const direct=document.querySelector<HTMLButtonElement>(`[data-engine-launch="${id}"]`);
  if(direct){direct.click();return}
  const systems=document.querySelector<HTMLButtonElement>('.game-sidebar [data-system-view="systems"]');
  if(!systems)return;
  systems.click();
  queueMicrotask(()=>document.querySelector<HTMLButtonElement>(`[data-engine-launch="${id}"]`)?.click());
}

document.addEventListener('click',e=>{
  const direct=(e.target as HTMLElement).closest<HTMLElement>('[data-system-direct]');
  if(direct?.dataset.systemDirect){e.preventDefault();e.stopPropagation();launchCanonicalSystem(direct.dataset.systemDirect);return}
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('.game-sidebar [data-view]');
  if(!b)return;
  const id=b.dataset.view;
  if(id==='school'){
    const proxy=document.querySelector<HTMLButtonElement>('.game-sidebar [data-system-view="school"]');
    if(proxy&&proxy!==b){e.preventDefault();e.stopPropagation();queueMicrotask(()=>proxy.click())}
  }
},true);

window.addEventListener('touchline:world-ready',schedule);
window.addEventListener('touchline:world-hydrated',schedule);
document.addEventListener('touchline:view-rendered',schedule);
schedule();
