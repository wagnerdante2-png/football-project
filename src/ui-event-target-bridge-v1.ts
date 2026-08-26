const bridgedEvents=['touchline:world-ready','touchline:world-hydrated','touchline:view-rendered','touchline:save-loaded'] as const;

/**
 * Compatibility bridge for UI modules created across different generations.
 * game-ui-v2 emits lifecycle events on window, while several active feature
 * modules subscribe on document. Mirror only events whose original target is
 * window; document-originated/bubbling events are ignored, preventing loops.
 */
for(const type of bridgedEvents){
  window.addEventListener(type,event=>{
    if(event.target!==window)return;
    const detail=(event as CustomEvent).detail;
    document.dispatchEvent(new CustomEvent(type,{detail}));
  });
}
