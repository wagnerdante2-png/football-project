const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;

const num=(value:string|undefined,fallback=50)=>{const n=Number((value??'').replace('%',''));return Number.isFinite(n)?n:fallback};
const clamp=(n:number,min=2,max=98)=>Math.max(min,Math.min(max,n));

function visualPercent(el:HTMLElement,pitch:HTMLElement){
  const er=el.getBoundingClientRect(),pr=pitch.getBoundingClientRect();
  return{x:clamp(((er.left+er.width/2-pr.left)/Math.max(1,pr.width))*100),y:clamp(((er.top+er.height/2-pr.top)/Math.max(1,pr.height))*100)};
}

function curveMid(from:{x:number,y:number},to:{x:number,y:number},seed:number){
  const dx=to.x-from.x,dy=to.y-from.y,dist=Math.hypot(dx,dy);
  const bend=Math.min(7,Math.max(1.2,dist*.10))*((seed%2)?1:-1);
  const nx=dist?(-dy/dist):0,ny=dist?(dx/dist):0;
  return{x:clamp((from.x+to.x)/2+nx*bend),y:clamp((from.y+to.y)/2+ny*bend)};
}

function animateBall(ball:HTMLElement,pitch:HTMLElement){
  const target={x:num(ball.style.left),y:num(ball.style.top)};
  const previous={x:num(ball.dataset.continuityX,target.x),y:num(ball.dataset.continuityY,target.y)};
  const dist=Math.hypot(target.x-previous.x,target.y-previous.y);
  ball.dataset.continuityX=String(target.x);ball.dataset.continuityY=String(target.y);
  if(dist<1||reduceMotion)return;
  const mid=curveMid(previous,target,Math.round(target.x+target.y));
  const duration=Math.max(360,Math.min(920,360+dist*7));
  ball.getAnimations().filter(a=>(a as Animation).id==='tl-ball-continuity').forEach(a=>a.cancel());
  const animation=ball.animate([
    {left:`${previous.x}%`,top:`${previous.y}%`,transform:'translate(-50%,-50%) scale(1)'},
    {left:`${mid.x}%`,top:`${mid.y}%`,transform:'translate(-50%,-50%) scale(1.13)',offset:.52},
    {left:`${target.x}%`,top:`${target.y}%`,transform:'translate(-50%,-50%) scale(1)'}
  ],{duration,easing:'cubic-bezier(.22,.72,.22,1)',fill:'none'});
  animation.id='tl-ball-continuity';
  pitch.style.setProperty('--md-flow-x',`${target.x}%`);pitch.style.setProperty('--md-flow-y',`${target.y}%`);
}

function animatePlayer(player:HTMLElement,index:number){
  const target={x:num(player.style.left,num(player.dataset.baseX)),y:num(player.style.top,num(player.dataset.baseY))};
  const previous={x:num(player.dataset.continuityX,target.x),y:num(player.dataset.continuityY,target.y)};
  player.dataset.continuityX=String(target.x);player.dataset.continuityY=String(target.y);
  const dist=Math.hypot(target.x-previous.x,target.y-previous.y);
  if(dist<.7||reduceMotion)return;
  const mid=curveMid(previous,target,index+Math.round(target.x));
  const duration=Math.max(430,Math.min(880,450+dist*10));
  player.getAnimations().filter(a=>(a as Animation).id==='tl-player-continuity').forEach(a=>a.cancel());
  const animation=player.animate([
    {left:`${previous.x}%`,top:`${previous.y}%`},
    {left:`${mid.x}%`,top:`${mid.y}%`,offset:.48},
    {left:`${target.x}%`,top:`${target.y}%`}
  ],{duration,easing:'cubic-bezier(.2,.68,.25,1)',fill:'none'});
  animation.id='tl-player-continuity';
}

function addFlowTrail(pitch:HTMLElement,from:{x:number,y:number},to:{x:number,y:number}){
  if(reduceMotion)return;
  const dist=Math.hypot(to.x-from.x,to.y-from.y);if(dist<5)return;
  const trail=document.createElement('i');trail.className='md-continuity-trail';
  const dx=to.x-from.x,dy=to.y-from.y;const angle=Math.atan2(dy,dx)*180/Math.PI;
  trail.style.left=`${from.x}%`;trail.style.top=`${from.y}%`;trail.style.width=`${dist}%`;trail.style.transform=`rotate(${angle}deg)`;
  pitch.appendChild(trail);window.setTimeout(()=>trail.remove(),780);
}

function bindCenter(center:HTMLElement){
  if(center.dataset.continuityBound)return;center.dataset.continuityBound='1';
  const pitch=center.querySelector<HTMLElement>('.md-live-pitch');if(!pitch)return;
  const ball=pitch.querySelector<HTMLElement>('.md-ball');const players=[...pitch.querySelectorAll<HTMLElement>('[data-live-player]')];if(!ball)return;
  const initial=visualPercent(ball,pitch);ball.dataset.continuityX=String(initial.x);ball.dataset.continuityY=String(initial.y);
  players.forEach(p=>{const pos=visualPercent(p,pitch);p.dataset.continuityX=String(pos.x);p.dataset.continuityY=String(pos.y)});
  let lastBall={x:initial.x,y:initial.y};
  const run=()=>requestAnimationFrame(()=>{
    const target={x:num(ball.style.left),y:num(ball.style.top)};
    addFlowTrail(pitch,lastBall,target);animateBall(ball,pitch);lastBall=target;
    players.forEach(animatePlayer);
    pitch.classList.remove('md-continuity-beat');void pitch.offsetWidth;pitch.classList.add('md-continuity-beat');
  });
  const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'))run()});
  observer.observe(ball,{attributes:true,attributeFilter:['style','class']});
  players.forEach(p=>observer.observe(p,{attributes:true,attributeFilter:['style','class']}));
}

function scan(root:ParentNode=document){root.querySelectorAll<HTMLElement>('.matchday-center').forEach(bindCenter)}
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement){if(node.matches('.matchday-center'))bindCenter(node);scan(node)}});
observer.observe(document.body,{subtree:true,childList:true});
queueMicrotask(()=>scan());
