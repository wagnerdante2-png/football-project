type HumanFeedItem={speakerId:string;role:string;topic:string;text:string;voiceSignature:string};
const feed=()=>(((globalThis as any).__touchlineHumanDialogueFeed??[]) as HumanFeedItem[]);
function renderHumanVoice(panel:HTMLElement){panel.querySelector('.v2-human-dialogue')?.remove();const item=feed().at(-1);if(!item)return;const block=document.createElement('blockquote');block.className='v2-human-dialogue';block.innerHTML=`<small>CONVERSA HUMANA · ${escapeHtml(item.role.toUpperCase())}</small><p>${escapeHtml(item.text)}</p><footer><b>${escapeHtml(item.speakerId)}</b><span>${escapeHtml(item.voiceSignature)}</span></footer>`;const meta=panel.querySelector('.v2-message-meta');panel.insertBefore(block,meta??null)}
function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
function bindInbox(){
  const layout=document.querySelector<HTMLElement>('.v2-inbox-layout');
  if(!layout||layout.dataset.inboxBound==='1')return;
  const buttons=[...layout.querySelectorAll<HTMLButtonElement>('aside button')];
  const panel=layout.querySelector<HTMLElement>('.v2-message');
  if(!panel||!buttons.length)return;
  layout.dataset.inboxBound='1';
  const title=panel.querySelector('h2');
  const body=panel.querySelector('p');
  const meta=panel.querySelector<HTMLElement>('.v2-message-meta');
  buttons.forEach((button,index)=>{
    button.setAttribute('aria-selected',index===0?'true':'false');
    button.addEventListener('click',()=>{
      buttons.forEach(x=>{
        const selected=x===button;
        x.classList.toggle('active',selected);
        x.setAttribute('aria-selected',selected?'true':'false');
      });
      const subject=button.querySelector('b')?.textContent?.trim()||'Mensagem';
      const summary=button.querySelector('span')?.textContent?.trim()||'Sem detalhes adicionais.';
      const date=button.querySelector('time')?.textContent?.trim()||'';
      if(title)title.textContent=subject;
      if(body)body.textContent=summary;
      if(meta)meta.textContent=`Mensagem ${index+1} de ${buttons.length} · ${date} · evento persistente do universo da carreira`;
      renderHumanVoice(panel);
    });
  });
  renderHumanVoice(panel);
}
window.addEventListener('touchline:view-rendered',event=>{if((event as CustomEvent).detail?.view==='inbox')queueMicrotask(bindInbox)});
window.addEventListener('touchline:human-dialogue',()=>{const panel=document.querySelector<HTMLElement>('.v2-inbox-layout .v2-message');if(panel)renderHumanVoice(panel)});
