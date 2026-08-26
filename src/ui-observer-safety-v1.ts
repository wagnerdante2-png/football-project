// Temporary compatibility boundary for legacy UI injectors.
// Older beta modules observe #app with subtree:true only to discover when the game shell exists.
// That makes every view render, overlay and table update wake every observer. We preserve the
// intended shell-lifecycle behavior while preventing subtree observer storms.
const NativeMutationObserver = window.MutationObserver;

class TouchlineMutationObserver extends NativeMutationObserver {
  observe(target: Node, options?: MutationObserverInit): void {
    if (target instanceof HTMLElement && target.id === 'app' && options?.childList && options?.subtree) {
      super.observe(target, { childList: true, subtree: false });
      return;
    }
    super.observe(target, options);
  }
}

window.MutationObserver = TouchlineMutationObserver;
