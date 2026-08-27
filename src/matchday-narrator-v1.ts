import type { MatchStory, MatchStoryAction } from './matchday-story-v1';

const speakers=new WeakMap<HTMLElement,(copy:string,tone?:string)=>void>();

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
  center.querySelector('.md-live-stage')?.insertAdjacentElement('afterend',bar);
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
  const bar=ensureBar(center),current=bar.querySelector<HTMLElement>('[data-narrator-current]')!,previous=bar.querySelector<HTMLElement>('[data-narrator-previous]')!;
  let last='';
  const speak=(copy:string,tone='neutral')=>{if(!copy||copy===last)return;if(last)previous.textContent=last;last=copy;current.textContent=copy;bar.className=`md-narrator-bar ${tone}`;bar.classList.remove('is-speaking');void bar.offsetWidth;bar.classList.add('is-speaking')};
  speakers.set(center,speak);
  const update=()=>{const eventType=(type.textContent??'PARTIDA').trim().toUpperCase();speak(enrich(eventType,(headline?.textContent??'').trim(),(text.textContent??'').trim(),(minute?.textContent??'').trim(),text.dataset.liveNarration),narratorTone(eventType))};
  const observer=new MutationObserver(update);
  [type,headline,minute].filter(Boolean).forEach(node=>observer.observe(node!,{subtree:true,childList:true,characterData:true}));
  observer.observe(text,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-live-narration']});
  update();
}

function actionCopy(story:MatchStory,action:MatchStoryAction,index:number,total:number){const minute=`${story.event.minute}'`;const beat=action.label.trim();if(action.type==='goal')return`${minute} · ${beat} GOOOOOL!`;if(action.type==='shot')return`${minute} · ${beat} Vai a finalização!`;if(action.type==='cross')return`${minute} · ${beat} Bola na área!`;if(action.type==='through')return`${minute} · ${beat} A defesa precisa correr para trás.`;if(action.type==='save')return`${minute} · ${beat} O goleiro segura a equipe.`;return`${minute} · ${beat}${index===total-1?'':' A jogada continua...'}`}

document.addEventListener('touchline:match-action',e=>{const detail=(e as CustomEvent<{center:HTMLElement;story:MatchStory;action:MatchStoryAction;index:number;total:number}>).detail;if(!detail?.center)return;const speak=speakers.get(detail.center);if(!speak)return;speak(actionCopy(detail.story,detail.action,detail.index,detail.total),detail.action.type==='goal'?'goal':detail.action.type==='shot'||detail.action.type==='cross'||detail.action.type==='through'?'attack':detail.action.type==='save'?'save':'neutral')});

function scan(root:ParentNode=document){root.querySelectorAll<HTMLElement>('.matchday-center').forEach(bindCenter)}
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement){if(node.matches('.matchday-center'))bindCenter(node);scan(node)}});
observer.observe(document.body,{subtree:true,childList:true});
queueMicrotask(()=>scan());
