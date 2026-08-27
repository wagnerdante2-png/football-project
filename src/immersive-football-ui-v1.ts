const SVG:Record<string,string>={
 inbox:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 16h44v32H10z"/><path d="M11 18l21 18 21-18"/></svg>',
 media:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="10" width="40" height="44" rx="3"/><path d="M19 19h26M19 27h26M19 35h16M19 43h10"/></svg>',
 squad:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="21" r="9"/><path d="M15 53c2-13 9-20 17-20s15 7 17 20"/></svg>',
 training:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 49h46M16 49l8-32h16l8 32M21 34h22"/><circle cx="32" cy="13" r="4"/></svg>',
 calendar:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="14" width="44" height="40" rx="4"/><path d="M10 25h44M21 9v10M43 9v10M19 34h7M30 34h7M41 34h5M19 43h7M30 43h7"/></svg>',
 medical:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 8h16v16h16v16H40v16H24V40H8V24h16z"/></svg>',
 scouting:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="27" cy="27" r="16"/><path d="M39 39l15 15M27 18v18M18 27h18"/></svg>',
 staff:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="23" cy="22" r="8"/><circle cx="43" cy="25" r="6"/><path d="M9 53c1-13 7-20 14-20s13 7 14 20M35 52c1-10 4-16 9-16 6 0 10 6 11 16"/></svg>',
 school:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 28l24-15 24 15-24 15z"/><path d="M17 34v13c9 6 21 6 30 0V34"/></svg>',
 generic:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"/><path d="M32 10v44M10 32h44"/></svg>'
};

function viewKey(root:HTMLElement){
 const text=(root.querySelector('h1,h2')?.textContent??'').toLowerCase();
 if(text.includes('caixa de entrada'))return'inbox';
 if(text.includes('imprensa')||text.includes('sport news'))return'media';
 if(text.includes('elenco'))return'squad';
 if(text.includes('trein'))return'training';
 if(text.includes('calend')||text.includes('competi'))return'calendar';
 if(text.includes('médico')||text.includes('medico')||text.includes('físico'))return'medical';
 if(text.includes('scouting')||text.includes('recrutamento')||text.includes('transfer'))return'scouting';
 if(text.includes('comissão')||text.includes('ecossistema técnico'))return'staff';
 if(text.includes('escolinha')||text.includes('bola do futuro'))return'school';
 return'generic';
}
function decorateHeader(root:HTMLElement,key:string){
 const header=root.querySelector<HTMLElement>('.view-hero,.media-hub-head,.tactics-head,header');
 if(!header||header.querySelector('.immersive-view-symbol'))return;
 const symbol=document.createElement('div');symbol.className=`immersive-view-symbol ivs-${key}`;symbol.innerHTML=SVG[key]??SVG.generic;header.appendChild(symbol);
 const shine=document.createElement('div');shine.className='immersive-header-shine';header.appendChild(shine);
}
function numberFrom(text:string){const m=text.replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN}
function decorateMedical(root:HTMLElement){root.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row=>{const cells=[...row.cells];const risk=cells.length?numberFrom(cells.at(-1)?.textContent??''):NaN;if(!Number.isFinite(risk))return;row.classList.toggle('risk-high',risk>=60);row.classList.toggle('risk-mid',risk>=40&&risk<60);row.classList.toggle('risk-low',risk<40)});}
function decorateScouting(root:HTMLElement){root.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row=>{const txt=(row.textContent??'').toLowerCase();let signal='neutral';if(txt.includes('elite'))signal='green';else{const perc=[...txt.matchAll(/(\d{1,3})%/g)].map(m=>Number(m[1])).at(-1);if(perc!==undefined)signal=perc>=70?'green':perc>=50?'amber':'red'}row.dataset.marketSignal=signal});}
function decorateStaff(root:HTMLElement){root.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row=>{const first=row.cells[0];if(!first||first.querySelector('.staff-persona'))return;const name=(first.querySelector('b,strong')?.textContent??first.textContent??'').trim();if(!name)return;const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();const badge=document.createElement('span');badge.className='staff-persona';badge.textContent=initials;first.prepend(badge)});}
function decorateTraining(root:HTMLElement){root.querySelectorAll<HTMLButtonElement>('.training-v2-presets button,.training-options button').forEach((b,i)=>{if(b.querySelector('.training-glyph'))return;const g=document.createElement('i');g.className='training-glyph';g.textContent=['◈','↻','▲','◎','⚡','▦','◆'][i%7];b.prepend(g)});}
function decorateCalendar(root:HTMLElement){root.querySelectorAll<HTMLElement>('article,.calendar-match,.fixture-card').forEach(x=>x.classList.add('broadcast-fixture'));}
function decorate(root:HTMLElement){
 const key=viewKey(root);root.dataset.immersiveView=key;root.classList.add('immersive-football-view');decorateHeader(root,key);
 root.querySelectorAll<HTMLElement>('section.glass,article.glass,.engine-table,.daily-feed,.media-side,.training-v2-summary article,.training-card').forEach(x=>x.classList.add('immersive-surface'));
 if(key==='medical')decorateMedical(root);if(key==='scouting')decorateScouting(root);if(key==='staff')decorateStaff(root);if(key==='training')decorateTraining(root);if(key==='calendar')decorateCalendar(root);
}
function run(){document.querySelectorAll<HTMLElement>('.game-stage main.view').forEach(decorate)}
let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})};
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',run);queue();
