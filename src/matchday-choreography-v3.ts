const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;

function pct(value:string|undefined){const n=Number((value??'').replace('%',''));return Number.isFinite(n)?n:50}
function center(el:HTMLElement){return{x:pct(el.style.left),y:pct(el.style.top)}}
function svgEl<K extends keyof SVGElementTagNameMap>(name:K){return document.createElementNS('http://www.w3.org/2000/svg',name)}

function ensureOverlay(pitch:HTMLElement){
  let svg=pitch.querySelector<SVGSVGElement>('.md-choreo-svg');
  if(svg)return svg;
  svg=svgEl('svg');svg.classList.add('md-choreo-svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
  pitch.appendChild(svg);return svg;
}
function clearOverlay(svg:SVGSVGElement){svg.replaceChildren()}
function path(svg:SVGSVGElement,d:string,cls:string){const p=svgEl('path');p.setAttribute('d',d);p.setAttribute('class',cls);svg.appendChild(p);return p}
function circle(svg:SVGSVGElement,x:number,y:number,r:number,cls:string){const c=svgEl('circle');c.setAttribute('cx',String(x));c.setAttribute('cy',String(y));c.setAttribute('r',String(r));c.setAttribute('class',cls);svg.appendChild(c)}
function line(svg:SVGSVGElement,x1:number,y1:number,x2:number,y2:number,cls:string){return path(svg,`M ${x1} ${y1} L ${x2} ${y2}`,cls)}
function arc(svg:SVGSVGElement,x1:number,y1:number,x2:number,y2:number,cls:string){const mx=(x1+x2)/2,my=Math.max(7,Math.min(93,(y1+y2)/2-10));return path(svg,`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`,cls)}

function classify(type:string,text:string){const t=`${type} ${text}`.toLowerCase();if(/goal|gol/.test(t))return'goal';if(/save|defesa/.test(t))return'save';if(/shot|finaliza|chute/.test(t))return'shot';if(/yellow|cart[aã]o/.test(t))return'yellow';if(/substitution|substitui/.test(t))return'substitution';if(/cross|cruzamento|corner|escanteio/.test(t))return'cross';if(/counter|contra-ataque|contra ataque/.test(t))return'counter';if(/fulltime|fim de jogo/.test(t))return'fulltime';return'build-up'}
function attackingRight(actor:HTMLElement|undefined){return !!actor?.classList.contains('home')}
function nearest(players:HTMLElement[],point:{x:number,y:number},limit=3){return [...players].sort((a,b)=>{const pa=center(a),pb=center(b);return Math.hypot(pa.x-point.x,pa.y-point.y)-Math.hypot(pb.x-point.x,pb.y-point.y)}).slice(0,limit)}

function choreography(root:HTMLElement){
  const pitch=root.querySelector<HTMLElement>('.md-live-pitch');if(!pitch)return;
  const typeNode=root.querySelector<HTMLElement>('[data-live-type]');const textNode=root.querySelector<HTMLElement>('[data-live-text]');
  const ball=pitch.querySelector<HTMLElement>('.md-ball');if(!typeNode||!ball)return;
  const svg=ensureOverlay(pitch);clearOverlay(svg);
  pitch.classList.remove('choreo-goal','choreo-shot','choreo-save','choreo-cross','choreo-counter','choreo-yellow','choreo-build-up','choreo-substitution','choreo-fulltime');
  const kind=classify(typeNode.textContent??'',textNode?.textContent??'');pitch.classList.add(`choreo-${kind}`);
  const players=[...pitch.querySelectorAll<HTMLElement>('[data-live-player]')];const actor=players.find(p=>p.classList.contains('actor'));const bp=center(ball);const right=attackingRight(actor);const goalX=right?97:3;
  const teammates=players.filter(p=>actor&&p!==actor&&p.classList.contains(right?'home':'away'));const opponents=players.filter(p=>actor&&p.classList.contains(right?'away':'home'));
  const ap=actor?center(actor):bp;
  circle(svg,bp.x,bp.y,2.2,'md-choreo-pulse');
  if(kind==='goal'||kind==='shot'||kind==='save'){
    const targetY=kind==='save'?Math.max(38,Math.min(62,bp.y)):50+((bp.y-50)*.18);
    arc(svg,ap.x,ap.y,goalX,targetY,`md-choreo-flight ${kind}`);
    circle(svg,goalX,targetY,kind==='goal'?5:3.5,`md-choreo-target ${kind}`);
    nearest(teammates,bp,3).forEach((p,i)=>{const q=center(p);line(svg,q.x,q.y,Math.max(4,Math.min(96,q.x+(right?1:-1)*(8+i*3))),Math.max(7,Math.min(93,q.y+(i-1)*5)),'md-choreo-run')});
    nearest(opponents,bp,2).forEach(p=>{const q=center(p);line(svg,q.x,q.y,bp.x+(q.x-bp.x)*.42,bp.y+(q.y-bp.y)*.42,'md-choreo-press')});
  }else if(kind==='cross'){
    arc(svg,ap.x,ap.y,goalX+(right?-8:8),50,'md-choreo-flight cross');
    nearest(teammates,{x:goalX,y:50},4).forEach((p,i)=>{const q=center(p);line(svg,q.x,q.y,goalX+(right?-11:11),38+i*8,'md-choreo-run')});
  }else if(kind==='counter'){
    nearest([...(actor?[actor]:[]),...teammates],bp,5).forEach((p,i)=>{const q=center(p);line(svg,q.x,q.y,Math.max(5,Math.min(95,q.x+(right?1:-1)*(13+i*2))),Math.max(8,Math.min(92,q.y+(i-2)*3)),'md-choreo-run counter')});
    nearest(opponents,bp,3).forEach(p=>{const q=center(p);line(svg,q.x,q.y,q.x+(right?-6:6),q.y,'md-choreo-recovery')});
  }else if(kind==='yellow'){
    circle(svg,ap.x,ap.y,7,'md-choreo-card-focus');
  }else if(kind==='substitution'){
    const touchX=right?8:92;line(svg,ap.x,ap.y,touchX,ap.y,'md-choreo-sub-line');
  }else if(kind==='build-up'){
    nearest(teammates,bp,3).forEach((p,i)=>{const q=center(p);const tx=bp.x+(right?1:-1)*(7+i*3),ty=bp.y+(i-1)*7;line(svg,q.x,q.y,Math.max(5,Math.min(95,tx)),Math.max(7,Math.min(93,ty)),'md-choreo-support')});
  }
}

function bindCenter(center:HTMLElement){
  if(center.dataset.choreoBound)return;center.dataset.choreoBound='1';
  const type=center.querySelector<HTMLElement>('[data-live-type]');const text=center.querySelector<HTMLElement>('[data-live-text]');if(!type)return;
  const run=()=>requestAnimationFrame(()=>choreography(center));
  const observer=new MutationObserver(run);observer.observe(type,{childList:true,characterData:true,subtree:true});if(text)observer.observe(text,{childList:true,characterData:true,subtree:true});
  run();
}
function scan(root:ParentNode=document){root.querySelectorAll<HTMLElement>('.matchday-center').forEach(bindCenter)}
const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n instanceof HTMLElement){if(n.matches('.matchday-center'))bindCenter(n);scan(n)}});observer.observe(document.body,{subtree:true,childList:true});
if(!reduceMotion)queueMicrotask(()=>scan());
