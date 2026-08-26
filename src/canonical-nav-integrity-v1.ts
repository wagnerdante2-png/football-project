const canonicalOrder=['home','inbox','squad','tactics','training','calendar','medical','transfers','staff','systems','analytics','club','world','school','manager'] as const;
const canonicalNodes=new Map<string,HTMLButtonElement>();
let observedNav:HTMLElement|undefined;
let observer:MutationObserver|undefined;
let repairing=false;

function capture(nav:HTMLElement){
  for(const id of canonicalOrder){
    const node=nav.querySelector<HTMLButtonElement>(`:scope > [data-view="${id}"]`);
    if(node&&!canonicalNodes.has(id))canonicalNodes.set(id,node);
  }
}

function repair(nav:HTMLElement){
  if(repairing)return;
  repairing=true;
  try{
    capture(nav);
    let anchor:Element|null=null;
    for(const id of canonicalOrder){
      let node=nav.querySelector<HTMLButtonElement>(`:scope > [data-view="${id}"]`);
      if(!node){
        node=canonicalNodes.get(id);
        if(node){
          console.warn(`[canonical-nav] restored removed route: ${id}`);
          if(anchor?.nextSibling)nav.insertBefore(node,anchor.nextSibling);else if(anchor)nav.appendChild(node);else nav.prepend(node);
        }
      }
      if(node)anchor=node;
    }
  }finally{repairing=false}
}

function bind(){
  const nav=document.querySelector<HTMLElement>('.game-sidebar nav');
  if(!nav)return;
  if(nav!==observedNav){
    observer?.disconnect();
    observedNav=nav;
    capture(nav);
    observer=new MutationObserver(()=>queueMicrotask(()=>repair(nav)));
    observer.observe(nav,{childList:true});
  }
  repair(nav);
}

window.addEventListener('touchline:world-ready',bind);
window.addEventListener('touchline:world-hydrated',bind);
window.addEventListener('touchline:save-loaded',bind);
document.addEventListener('touchline:view-rendered',()=>queueMicrotask(bind));
bind();
