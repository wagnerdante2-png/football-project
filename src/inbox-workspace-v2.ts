function bindInbox(){
  const layout=document.querySelector<HTMLElement>('.v2-inbox-layout');
  if(!layout)return;
  const buttons=[...layout.querySelectorAll<HTMLButtonElement>('aside button')];
  const panel=layout.querySelector<HTMLElement>('.v2-message');
  if(!panel||!buttons.length)return;
  const title=panel.querySelector('h2');
  const body=panel.querySelector('p');
  const meta=panel.querySelector<HTMLElement>('.v2-message-meta');
  buttons.forEach((button,index)=>button.addEventListener('click',()=>{
    buttons.forEach(x=>x.classList.toggle('active',x===button));
    const subject=button.querySelector('b')?.textContent?.trim()||'Mensagem';
    const summary=button.querySelector('span')?.textContent?.trim()||'Sem detalhes adicionais.';
    const date=button.querySelector('time')?.textContent?.trim()||'';
    if(title)title.textContent=subject;
    if(body)body.textContent=summary;
    if(meta)meta.textContent=`Mensagem ${index+1} de ${buttons.length} · ${date} · evento persistente do universo da carreira`;
  }));
}

document.addEventListener('touchline:view-rendered',event=>{
  if((event as CustomEvent).detail?.view==='inbox')queueMicrotask(bindInbox);
});
