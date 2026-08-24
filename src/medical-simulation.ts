import type { Player, PlayerAttributes, World } from './engine';
import { selectStartingEleven } from './engine';
import { playCurrentRoundWithRoles } from './roles';
import { effectiveAttributes, prepareAvailableSquads, restoreSquads, simulateMedicalAfterRound } from './injuries';

export function playCurrentRoundWithMedical(world:World):void {
  const removed=prepareAvailableSquads(world);
  const participants=new Map<string,Set<string>>();
  const snapshots=new Map<Player,PlayerAttributes>();
  try {
    for(const club of world.clubs){
      const xi=selectStartingEleven(club);
      participants.set(club.id,new Set(xi.map(p=>p.id)));
      for(const player of club.players){
        snapshots.set(player,{...player.attributes});
        player.attributes=effectiveAttributes(world,player);
      }
    }
    playCurrentRoundWithRoles(world);
  } finally {
    for(const [player,attributes] of snapshots) player.attributes=attributes;
    restoreSquads(removed);
  }
  simulateMedicalAfterRound(world,participants);
}
