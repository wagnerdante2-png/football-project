const canonicalOrder=['home','inbox','squad','tactics','training','calendar','medical','transfers','staff','systems','analytics','club','world','school','manager'] as const;
const canonicalNodes=new Map<string,HTMLButtonElement>();
let observedNav:HTMLElement|undefined;
let navObserver:MutationObserver|undefined;
let bindScheduled=false;
let repairScheduled=false;
let repairing=false;

function capture(nav:HTMLElement){
  for(const id of canonicalOrder){
    const node=nav.querySelector<HTMLButtonElement>(`:scope > [data-view="${id}"]`);
    if(node)canonicalNodes.set(id,node);
  }
}

function repair(nav:HTMLElement){
  if(repairing||!nav.isConnected||nav!==observedNav)return;
  repairing=true;
  try{
    capture(nav);
    let anchor:Element|null=null;
    for(const id of canonicalOrder){
      let node=nav.querySelector<HTMLButtonElement>(`:scope > [data-view="${id}"]`);
      if(!node){
        node=canonicalNodes.get(id)??null;
        if(node){
          console.warn(`[canonical-nav] restored removed route: ${id}`);
          if(anchor?.nextSibling)nav.insertBefore(node,anchor.nextSibling);
          else if(anchor)nav.appendChild(node);
          else nav.prepend(node);
        }
      }
      if(node)anchor=node;
    }
  }finally{repairing=false}
}

function scheduleRepair(nav:HTMLElement){
  if(repairScheduled)return;
  repairScheduled=true;
  queueMicrotask(()=>{
    repairScheduled=false;
    if(nav.isConnected&&nav===observedNav)repair(nav);
    else scheduleBind();
  });
}

function bind(){
  const nav=document.querySelector<HTMLElement>('.game-sidebar nav');
  if(!nav){
    navObserver?.disconnect();
    navObserver=undefined;
    observedNav=undefined;
    return;
  }
  if(nav!==observedNav){
    navObserver?.disconnect();
    observedNav=nav;
    capture(nav);
    navObserver=new MutationObserver(()=>scheduleRepair(nav));
    navObserver.observe(nav,{childList:true});
  }
  repair(nav);
}

function scheduleBind(){
  if(bindScheduled)return;
  bindScheduled=true;
  queueMicrotask(()=>{
    bindScheduled=false;
    bind();
  });
}

const app=document.querySelector<HTMLElement>('#app');
if(app)new MutationObserver(scheduleBind).observe(app,{childList:true,subtree:true});
window.addEventListener('touchline:world-ready',scheduleBind);
window.addEventListener('touchline:world-hydrated',scheduleBind);
window.addEventListener('touchline:save-loaded',scheduleBind);
document.addEventListener('touchline:view-rendered',scheduleBind);
bind();
