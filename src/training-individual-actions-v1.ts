import type { World } from './engine';
import { clubTraining } from './training-engine';

export function clearIndividualTraining(world:World,clubId:string,playerId:string):boolean{
  const state=clubTraining(world,clubId)?.players.get(playerId);
  if(!state?.individual)return false;
  delete state.individual;
  return true;
}
