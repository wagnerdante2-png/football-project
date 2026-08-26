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
    });
  });
}

window.addEventListener('touchline:view-rendered',event=>{
  if((event as CustomEvent).detail?.view==='inbox')queueMicrotask(bindInbox);
});
