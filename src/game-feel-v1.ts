const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
let advanceLayer:HTMLElement|undefined;
let advanceStartedAt=0;
let advanceTimer:number|undefined;
let statusTimer:number|undefined;

const motionSelectors='section,article,.v2-card,[class*="card"],table,.panel,[class*="panel"]';
const dialogSelectors='dialog,[role="dialog"],.modal,[class*="modal"],.overlay [class*="panel"]';

function animateView(){
  if(reduceMotion)return;
  const view=document.querySelector<HTMLElement>('.game-stage main.view');
  if(!view)return;
  view.classList.remove('tl-view-enter');
  void view.offsetWidth;
  view.classList.add('tl-view-enter');
  [...view.querySelectorAll<HTMLElement>(motionSelectors)].slice(0,8).forEach((item,index)=>{
    item.dataset.motionItem='';
    item.style.setProperty('--motion-index',String(index));
  });
  window.setTimeout(()=>view.classList.remove('tl-view-enter'),520);
}

function animateDialogs(root:ParentNode=document){
  if(reduceMotion)return;
  root.querySelectorAll<HTMLElement>(dialogSelectors).forEach(node=>{
    if(node.dataset.tlMotionBound)return;
    node.dataset.tlMotionBound='1';
    node.classList.add('tl-dialog-enter');
    window.setTimeout(()=>node.classList.remove('tl-dialog-enter'),420);
  });
}

function ensureAdvanceLayer(){
  const stage=document.querySelector<HTMLElement>('.game-stage');
  if(!stage)return undefined;
  if(getComputedStyle(stage).position==='static')stage.style.position='relative';
  let layer=stage.querySelector<HTMLElement>('.tl-advance-layer');
  if(!layer){
    layer=document.createElement('div');
    layer.className='tl-advance-layer';
    layer.innerHTML='<div class="tl-advance-panel"><span class="tl-advance-kicker">SIMULAÇÃO EM ANDAMENTO</span><div class="tl-advance-title">O mundo continua</div><span class="tl-advance-status">Atualizando calendário e acontecimentos…</span><div class="tl-advance-track"><i></i></div></div>';
    stage.appendChild(layer);
  }
  return layer;
}

function beginAdvance(){
  if(advanceLayer?.classList.contains('is-visible'))return;
  advanceLayer=ensureAdvanceLayer();
  if(!advanceLayer)return;
  advanceStartedAt=performance.now();
  const status=advanceLayer.querySelector<HTMLElement>('.tl-advance-status');
  const messages=['Atualizando calendário e acontecimentos…','Processando clubes, pessoas e competições…','Consolidando as consequências do dia…'];
  let index=0;
  if(statusTimer)window.clearInterval(statusTimer);
  statusTimer=window.setInterval(()=>{if(status)status.textContent=messages[++index%messages.length]},360);
  requestAnimationFrame(()=>advanceLayer?.classList.add('is-visible'));
  if(advanceTimer)window.clearTimeout(advanceTimer);
  advanceTimer=window.setTimeout(endAdvance,2500);
}

function endAdvance(){
  if(!advanceLayer)return;
  const elapsed=performance.now()-advanceStartedAt;
  const wait=Math.max(0,260-elapsed);
  window.setTimeout(()=>{
    advanceLayer?.classList.remove('is-visible');
    if(statusTimer)window.clearInterval(statusTimer);
    statusTimer=undefined;
  },wait);
}

function pulseDate(node:HTMLElement){
  if(reduceMotion)return;
  node.classList.remove('tl-date-pulse');
  void node.offsetWidth;
  node.classList.add('tl-date-pulse');
  window.setTimeout(()=>node.classList.remove('tl-date-pulse'),480);
}

function toast(title:string,message:string){
  document.querySelector('.tl-career-toast')?.remove();
  const node=document.createElement('div');
  node.className='tl-career-toast';
  node.innerHTML=`<b>${title}</b><span>${message}</span>`;
  document.body.appendChild(node);
  window.setTimeout(()=>node.classList.add('is-leaving'),2600);
  window.setTimeout(()=>node.remove(),2900);
}

function bind(){
  document.addEventListener('click',event=>{
    const target=event.target as HTMLElement|null;
    if(target?.closest('[data-continue]'))beginAdvance();
  },true);

  window.addEventListener('touchline:view-rendered',()=>requestAnimationFrame(()=>{animateView();animateDialogs()}));
  window.addEventListener('touchline:save-loaded',()=>toast('Carreira carregada','O mundo foi restaurado e está pronto para continuar.'));
  window.addEventListener('touchline:world-hydrated',()=>animateView());

  const observer=new MutationObserver(records=>{
    let shouldCheckDialogs=false;
    for(const record of records){
      if(record.type==='childList'&&record.addedNodes.length)shouldCheckDialogs=true;
      const target=record.target as HTMLElement;
      if(target?.matches?.('[data-world-date]')){pulseDate(target);endAdvance();}
      for(const node of record.addedNodes){
        if(node instanceof HTMLElement){
          const date=node.matches('[data-world-date]')?node:node.querySelector<HTMLElement>('[data-world-date]');
          if(date){pulseDate(date);endAdvance();}
        }
      }
    }
    if(shouldCheckDialogs)queueMicrotask(()=>animateDialogs());
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}

bind();
