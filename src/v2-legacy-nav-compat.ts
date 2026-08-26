import './v2-system-overrides.css';

let scheduled=false;
function syncLegacyNavigation(){
  const nav=document.querySelector<HTMLElement>('.game-sidebar nav');
  if(!nav)return;
  const nativeTraining=nav.querySelector<HTMLButtonElement>('[data-view="training"]');
  const legacyTraining=nav.querySelector<HTMLButtonElement>('[data-training-view]');
  if(nativeTraining&&legacyTraining){legacyTraining.hidden=true;legacyTraining.dataset.v2Proxy='training'}
  for(const id of ['medical','systems','school'] as const){
    const native=nav.querySelector<HTMLButtonElement>(`[data-view="${id}"]`);
    const legacy=nav.querySelector<HTMLButtonElement>(`[data-system-view="${id}"]`);
    if(native&&legacy){legacy.hidden=true;legacy.dataset.v2Proxy=id}
  }
  const buttons=[...nav.querySelectorAll<HTMLButtonElement>('button')];
  buttons.forEach(b=>{
    if(b.dataset.view||b.dataset.saveView)return;
    const label=b.textContent?.trim().replace(/\s+/g,' ').toLowerCase();
    if(!label)return;
    const canonical=buttons.find(x=>x.dataset.view&&x.textContent?.trim().replace(/\s+/g,' ').toLowerCase()===label);
    if(canonical)b.hidden=true;
  });
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;syncLegacyNavigation()})}
function launchCanonicalSystem(id:string){
  const canonical=document.querySelector<HTMLButtonElement>(`.game-sidebar [data-view="${id}"]`);
  if(canonical){canonical.click();return}
  const direct=document.querySelector<HTMLButtonElement>(`[data-engine-launch="${id}"]`);
  if(direct){direct.click();return}
  const systems=document.querySelector<HTMLButtonElement>('.game-sidebar [data-view="systems"]');
  if(!systems)return;
  systems.click();
  if(id!=='systems')queueMicrotask(()=>document.querySelector<HTMLButtonElement>(`[data-engine-launch="${id}"]`)?.click());
}

document.addEventListener('click',e=>{
  const direct=(e.target as HTMLElement).closest<HTMLElement>('[data-system-direct]');
  if(direct?.dataset.systemDirect){e.preventDefault();e.stopPropagation();launchCanonicalSystem(direct.dataset.systemDirect)}
},true);

window.addEventListener('touchline:world-ready',schedule);
window.addEventListener('touchline:world-hydrated',schedule);
document.addEventListener('touchline:view-rendered',schedule);
schedule();
