const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]!));

function narratorTone(type:string){
  const t=type.toLowerCase();
  if(t==='goal')return'goal';
  if(t==='shot')return'attack';
  if(t==='save')return'save';
  if(t==='yellow')return'card';
  if(t==='substitution')return'change';
  if(t==='fulltime')return'fulltime';
  return'neutral';
}

function enrich(type:string,headline:string,text:string,minute:string,story?:string){
  const m=minute?`${minute} · `:'';
  if(story?.trim())return `${m}${story.trim()}`;
  const who=headline&&headline.toLowerCase()!==type.toLowerCase()?headline:'';
  const clean=text.trim();
  if(type==='GOAL')return `${m}${who?`${who} aparece no momento decisivo! `:''}${clean||'É gol! A rede balança e o estádio explode.'}`;
  if(type==='SHOT')return `${m}${who?`${who} chega para finalizar. `:''}${clean||'A equipe encontra espaço e conclui a jogada.'}`;
  if(type==='SAVE')return `${m}${who?`${who} participa do lance. `:''}${clean||'Grande intervenção do goleiro para evitar o gol.'}`;
  if(type==='YELLOW')return `${m}${clean||'O árbitro interrompe a jogada e mostra o cartão amarelo.'}`;
  if(type==='SUBSTITUTION')return `${m}${clean||'Mudança em campo. O treinador mexe na equipe.'}`;
  if(type==='FULLTIME')return `${m}${clean||'Fim de jogo. O árbitro encerra a partida.'}`;
  if(type==='INÍCIO'||type==='KICKOFF')return `${m}${clean||'Bola rolando. Começa a partida.'}`;
  return `${m}${clean||'A posse circula e as equipes procuram espaço para progredir.'}`;
}

function ensureBar(center:HTMLElement){
  let bar=center.querySelector<HTMLElement>('.md-narrator-bar');
  if(bar)return bar;
  bar=document.createElement('section');
  bar.className='md-narrator-bar neutral';
  bar.setAttribute('aria-live','polite');
  bar.innerHTML='<div class="md-narrator-badge"><span>AO VIVO</span><b>NARRAÇÃO</b></div><div class="md-narrator-copy"><p data-narrator-current>A bola vai rolar.</p><small data-narrator-previous>O narrador acompanha cada mudança importante da partida.</small></div><div class="md-narrator-pulse" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  const stage=center.querySelector('.md-live-stage');
  stage?.insertAdjacentElement('afterend',bar);
  return bar;
}

function bindCenter(center:HTMLElement){
  if(center.dataset.narratorBound)return;
  const type=center.querySelector<HTMLElement>('[data-live-type]');
  const headline=center.querySelector<HTMLElement>('[data-live-headline]');
  const text=center.querySelector<HTMLElement>('[data-live-text]');
  const minute=center.querySelector<HTMLElement>('[data-replay-minute]')??center.querySelector<HTMLElement>('[data-live-clock]');
  if(!type||!text)return;
  center.dataset.narratorBound='1';
  const bar=ensureBar(center);
  const current=bar.querySelector<HTMLElement>('[data-narrator-current]')!;
  const previous=bar.querySelector<HTMLElement>('[data-narrator-previous]')!;
  let last='';
  const update=()=>{
    const eventType=(type.textContent??'PARTIDA').trim().toUpperCase();
    const narration=enrich(eventType,(headline?.textContent??'').trim(),(text.textContent??'').trim(),(minute?.textContent??'').trim(),text.dataset.liveNarration);
    if(!narration||narration===last)return;
    if(last)previous.textContent=last;
    last=narration;
    current.textContent=narration;
    bar.className=`md-narrator-bar ${narratorTone(eventType)}`;
    bar.classList.remove('is-speaking');
    void bar.offsetWidth;
    bar.classList.add('is-speaking');
  };
  const observer=new MutationObserver(update);
  [type,headline,minute].filter(Boolean).forEach(node=>observer.observe(node!,{subtree:true,childList:true,characterData:true}));
  observer.observe(text,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-live-narration']});
  update();
}

function scan(root:ParentNode=document){root.querySelectorAll<HTMLElement>('.matchday-center').forEach(bindCenter)}
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement){if(node.matches('.matchday-center'))bindCenter(node);scan(node)}});
observer.observe(document.body,{subtree:true,childList:true});
queueMicrotask(()=>scan());
