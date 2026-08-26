import type { World } from './engine';
import { onWorldEvent, emitWorldEvent } from './event-bus';
import { advanceToNextSeason, seasonFinished } from './lifecycle';
import { resetDailyCalendarForNewSeason } from './daily-simulation';

const wired=new WeakSet<World>();
const pending=new WeakSet<World>();
const completedSeason=new WeakMap<World,number>();

export function wireAutomaticSeasonTransition(world:World){
  if(wired.has(world))return;
  wired.add(world);
  onWorldEvent(world,'MatchCompleted',(event,w)=>{
    const season=w.season;
    if(!seasonFinished(w)||completedSeason.get(w)===season||pending.has(w))return;
    pending.add(w);
    queueMicrotask(()=>{
      pending.delete(w);
      if(w.season!==season||!seasonFinished(w)||completedSeason.get(w)===season)return;
      completedSeason.set(w,season);
      emitWorldEvent(w,{type:'SeasonEnded',date:event.date,importance:4,summary:`Temporada ${season} encerrada.`,payload:{season}});
      advanceToNextSeason(w);
      resetDailyCalendarForNewSeason(w);
    });
  });
}

function currentWorld(){return window.__touchlineWorld as World|undefined}
function bind(){const w=currentWorld();if(w)wireAutomaticSeasonTransition(w)}
document.addEventListener('touchline:world-ready',bind);
document.addEventListener('touchline:view-rendered',bind);
queueMicrotask(bind);
