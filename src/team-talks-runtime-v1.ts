import type { World } from './engine';
import { wireTeamTalkRuntime } from './team-talks-v1';
function activate(){const world=window.__touchlineWorld as World|undefined;if(world)wireTeamTalkRuntime(world)}
window.addEventListener('touchline:world-ready',activate);
window.addEventListener('touchline:world-hydrated',activate);
window.addEventListener('touchline:save-loaded',activate);
queueMicrotask(activate);
