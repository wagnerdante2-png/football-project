import type { World } from './engine';
import { clubVisual, crestMarkup } from './visual-identity-v1';
import { userManager } from './manager-character';

function world(){return window.__touchlineWorld as World|undefined}
function clubNameFromCell(cell:HTMLElement){return cell.textContent?.trim()||''}
function decorateWorld(){
  const w=world();
  if(!w)return;
  const rows=[...document.querySelectorAll<HTMLTableRowElement>('.engine-table tbody tr')];
  rows.forEach(row=>{
    const cells=row.querySelectorAll<HTMLElement>('td');
    if(cells.length<2||cells[1].querySelector('.world-club-crest'))return;
    const name=clubNameFromCell(cells[1]);
    if(!w.clubs.some(c=>c.name===name))return;
    const wrap=document.createElement('span');
    wrap.className='engine-club-name';
    wrap.innerHTML=`${crestMarkup(name,'world-club-crest')}<b>${name}</b>`;
    cells[1].replaceChildren(wrap);
  });
}
function decorateClub(){
  const w=world();
  if(!w)return;
  const manager=userManager(w);
  const club=w.clubs.find(c=>c.id===(manager?.currentClubId??w.clubs[0]?.id));
  const hero=document.querySelector<HTMLElement>('.view-hero');
  if(!club||!hero)return;
  const visual=clubVisual(club.name);
  hero.classList.add('club-context-hero');
  hero.style.setProperty('--context-primary',visual.primaryColor);
  if(visual.stadiumImage?.url){
    const url=visual.stadiumImage.thumbnailUrl??visual.stadiumImage.url;
    hero.style.setProperty('--context-stadium',`url("${url}")`);
    hero.classList.add('has-stadium');
  }
  if(!hero.querySelector('.club-context-crest')){
    const crest=document.createElement('span');
    crest.className='club-context-crest';
    crest.innerHTML=crestMarkup(club.name,'club-hero-crest');
    hero.appendChild(crest);
  }
}
document.addEventListener('touchline:view-rendered',event=>{
  const view=(event as CustomEvent).detail?.view;
  if(view==='world')setTimeout(decorateWorld,0);
  if(view==='club')setTimeout(decorateClub,0);
});
