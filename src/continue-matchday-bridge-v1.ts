import type { World } from './engine';
import { userManager } from './manager-character';

function world(){return window.__touchlineWorld as World|undefined}

function openManagedMatch(round?:number){
  const w=world(),clubId=w?userManager(w)?.currentClubId:undefined;
  if(!w||!clubId)return;
  const fixtures=w.fixtures.filter(f=>f.home===clubId||f.away===clubId).slice(0,38);
  let target=round?fixtures.findIndex(f=>f.round===round&&f.played):-1;
  if(target<0){for(let i=fixtures.length-1;i>=0;i--)if(fixtures[i].played){target=i;break}}
  if(target<0)return;
  document.querySelector<HTMLButtonElement>('.game-sidebar [data-view="calendar"]')?.click();
  let tries=0;
  const attempt=()=>{
    const rows=[...document.querySelectorAll<HTMLElement>('.v2-calendar-list article')];
    const button=rows[target]?.querySelector<HTMLButtonElement>('.md-open');
    if(button){button.click();window.setTimeout(()=>document.querySelector<HTMLButtonElement>('.matchday-backdrop [data-replay-play]')?.click(),160);return}
    if(++tries<20)window.setTimeout(attempt,100);
    else console.error('matchday bridge: played fixture found but Match Center trigger was not rendered');
  };
  window.setTimeout(attempt,0);
}

window.addEventListener('touchline:continue-day',event=>{
  const detail=(event as CustomEvent).detail as {result?:{matchDay?:boolean;playedRound?:number}}|undefined;
  if(detail?.result?.matchDay)openManagedMatch(detail.result.playedRound);
});
