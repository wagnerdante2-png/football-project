const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;

function addAmbientLayers(pitch:HTMLElement){
  if(pitch.querySelector('.md-immersion-atmosphere'))return;
  const atmosphere=document.createElement('div');
  atmosphere.className='md-immersion-atmosphere';
  atmosphere.innerHTML='<i class="md-stand top"></i><i class="md-stand bottom"></i><i class="md-floodlight left"></i><i class="md-floodlight right"></i><i class="md-pitch-haze"></i>';
  pitch.prepend(atmosphere);
}

function addRipple(pitch:HTMLElement,ball:HTMLElement,type:string){
  const ripple=document.createElement('i');
  ripple.className=`md-event-ripple ${type}`;
  ripple.style.left=ball.style.left||'50%';
  ripple.style.top=ball.style.top||'50%';
  pitch.appendChild(ripple);
  window.setTimeout(()=>ripple.remove(),900);
}

function addGoalBanner(center:HTMLElement,side:'home'|'away'|undefined){
  center.querySelector('.md-goal-immersion')?.remove();
  const node=document.createElement('div');
  node.className=`md-goal-immersion ${side??''}`;
  node.innerHTML='<span>GOOOOOOL!</span><small>O estádio explode. A partida muda de temperatura.</small>';
  center.appendChild(node);
  requestAnimationFrame(()=>node.classList.add('is-visible'));
  window.setTimeout(()=>{node.classList.add('is-leaving');window.setTimeout(()=>node.remove(),260)},1500);
}

function playerSide(pitch:HTMLElement):'home'|'away'|undefined{
  const actor=pitch.querySelector<HTMLElement>('.md-live-player.actor');
  if(actor?.classList.contains('home'))return'home';
  if(actor?.classList.contains('away'))return'away';
  return undefined;
}

function celebratePlayers(pitch:HTMLElement,side:'home'|'away'|undefined){
  pitch.querySelectorAll<HTMLElement>('.md-live-player').forEach(player=>{
    player.classList.remove('md-celebrate','md-recover');
    if(!side)return;
    if(player.classList.contains(side))player.classList.add('md-celebrate');
    else player.classList.add('md-recover');
  });
  window.setTimeout(()=>pitch.querySelectorAll('.md-live-player').forEach(player=>player.classList.remove('md-celebrate','md-recover')),1350);
}

function reactionLabel(type:string){
  if(type==='GOAL')return'GOL';
  if(type==='SHOT')return'FINALIZAÇÃO';
  if(type==='SAVE')return'DEFESA';
  if(type==='YELLOW')return'CARTÃO';
  if(type==='SUBSTITUTION')return'MUDANÇA TÁTICA';
  if(type==='FULLTIME')return'FIM DE JOGO';
  return'PARTIDA';
}

function enhance(center:HTMLElement){
  if(center.dataset.mdImmersive)return;
  center.dataset.mdImmersive='1';
  const pitch=center.querySelector<HTMLElement>('.md-live-pitch');
  const liveType=center.querySelector<HTMLElement>('[data-live-type]');
  const commentary=center.querySelector<HTMLElement>('.md-live-commentary article');
  const ball=center.querySelector<HTMLElement>('.md-ball');
  if(!pitch||!liveType||!ball)return;
  addAmbientLayers(pitch);
  center.classList.add('md-immersive-center');
  liveType.setAttribute('aria-live','polite');

  const react=()=>{
    const type=(liveType.textContent??'').trim().toUpperCase();
    if(!type)return;
    pitch.classList.remove('md-immersive-goal','md-immersive-shot','md-immersive-save','md-immersive-yellow','md-immersive-substitution','md-immersive-fulltime');
    commentary?.classList.remove('md-commentary-hit');
    void pitch.offsetWidth;
    const cssType=type.toLowerCase();
    if(['goal','shot','save','yellow','substitution','fulltime'].includes(cssType))pitch.classList.add(`md-immersive-${cssType}`);
    if(!reduceMotion&&['goal','shot','save','yellow'].includes(cssType))addRipple(pitch,ball,cssType);
    if(commentary){commentary.dataset.impact=reactionLabel(type);commentary.classList.add('md-commentary-hit')}
    if(type==='GOAL'){
      const side=playerSide(pitch);
      celebratePlayers(pitch,side);
      addGoalBanner(center,side);
    }
  };

  const observer=new MutationObserver(react);
  observer.observe(liveType,{subtree:true,childList:true,characterData:true});
  react();
}

function scan(root:ParentNode=document){
  root.querySelectorAll<HTMLElement>('.matchday-center').forEach(enhance);
}

const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(!(node instanceof HTMLElement))continue;
      if(node.matches('.matchday-center'))enhance(node);
      scan(node);
    }
  }
});
observer.observe(document.body,{subtree:true,childList:true});
scan();
