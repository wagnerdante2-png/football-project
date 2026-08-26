import type { Club, Player, World } from './engine';
import { realPlayerByIdV2, realPlayersV2 } from './real-world-player-import-v2';
import { playerProfile } from './player-profile-v2';

export type WorldPlayerPoolEntry={
  player:Player;
  runtimeClub?:Club;
  source:'runtime-club'|'real-background'|'extra';
  retired:boolean;
};

export function worldPlayerPool(world:World,options:{includeRetired?:boolean;extras?:Player[]}={}){
  const byId=new Map<string,WorldPlayerPoolEntry>();
  for(const club of world.clubs)for(const player of club.players){
    byId.set(player.id,{player,runtimeClub:club,source:'runtime-club',retired:!!playerProfile(world,player.id)?.retired});
  }
  for(const row of realPlayersV2(world))if(!byId.has(row.player.id)){
    byId.set(row.player.id,{player:row.player,source:'real-background',retired:!!playerProfile(world,row.player.id)?.retired});
  }
  for(const player of options.extras??[])if(!byId.has(player.id)){
    byId.set(player.id,{player,source:'extra',retired:!!playerProfile(world,player.id)?.retired});
  }
  const rows=[...byId.values()];
  return options.includeRetired?rows:rows.filter(x=>!x.retired);
}

export function worldPlayerById(world:World,playerId:string,extras:Player[]=[]){
  for(const club of world.clubs){const player=club.players.find(p=>p.id===playerId);if(player)return player;}
  const real=realPlayerByIdV2(world,playerId)?.player;if(real)return real;
  return extras.find(p=>p.id===playerId);
}
export function worldPlayerClub(world:World,playerId:string){
  return world.clubs.find(club=>club.players.some(player=>player.id===playerId));
}
export function worldPlayerPoolEntryById(world:World,playerId:string,extras:Player[]=[]):WorldPlayerPoolEntry|undefined{
  const runtimeClub=worldPlayerClub(world,playerId);
  const player=runtimeClub?.players.find(p=>p.id===playerId);
  if(player)return{player,runtimeClub,source:'runtime-club',retired:!!playerProfile(world,playerId)?.retired};
  const real=realPlayerByIdV2(world,playerId)?.player;
  if(real)return{player:real,source:'real-background',retired:!!playerProfile(world,playerId)?.retired};
  const extra=extras.find(p=>p.id===playerId);
  return extra?{player:extra,source:'extra',retired:!!playerProfile(world,playerId)?.retired}:undefined;
}
export function worldPlayerPoolCounts(world:World){
  const rows=worldPlayerPool(world,{includeRetired:true});
  return{total:rows.length,active:rows.filter(x=>!x.retired).length,runtimeClub:rows.filter(x=>x.source==='runtime-club').length,backgroundReal:rows.filter(x=>x.source==='real-background').length,retired:rows.filter(x=>x.retired).length};
}
