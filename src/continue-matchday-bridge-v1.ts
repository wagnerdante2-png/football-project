import type { World } from './engine';
import { userManager } from './manager-character';

function world(){return window.__touchlineWorld as World|undefined}

function openLatestManagedMatch(){
  const w=world(),clubId=w?userManager(w)?.currentClubId:undefined;
  if(!w||!clubId)return;
  const fixtures=w.fixtures.filter(f=>(f.home===clubId||f.away===clubId)).slice(0,38);
  let target=-1;
  for(let i=fixtures.length-1;i>=0;i--)if(fixtures[i].played){target=i;break}
  if(target<0)return;
  const calendar=document.querySelector<HTMLButtonElement>('.game-sidebar [data-view="calendar"]');
  calendar?.click();
  window.setTimeout(()=>{
    const rows=[...document.querySelectorAll<HTMLElement>('.v2-calendar-list article')];
    const button=rows[target]?.querySelector<HTMLButtonElement>('.md-open');
    if(!button)return;
    button.click();
    window.setTimeout(()=>document.querySelector<HTMLButtonElement>('.matchday-backdrop [data-replay-play]')?.click(),120);
  },0);
}

window.addEventListener('touchline:continue-day',event=>{
  const detail=(event as CustomEvent).detail as {result?:{matchDay?:boolean}}|undefined;
  if(detail?.result?.matchDay)openLatestManagedMatch();
});
