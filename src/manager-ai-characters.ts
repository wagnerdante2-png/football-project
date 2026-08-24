import type { World } from './engine';
import { managerCharacterState, managerByClub, userManager } from './manager-character';
import { archetypeDraft, finalizeManagerCreation, type ManagerArchetypeId } from './manager-creation';

const first=['André','Bruno','Carlos','Diego','Eduardo','Fábio','Gustavo','Henrique','João','Leandro','Marcelo','Paulo','Rafael','Renato','Ricardo','Sérgio'];
const last=['Almeida','Barros','Costa','Duarte','Ferreira','Lima','Martins','Moraes','Nunes','Oliveira','Prado','Ribeiro','Santos','Torres','Vieira'];
const hash=(s:string)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0)};
function nameFor(clubId:string){const h=hash(`ai-manager-${clubId}`);return `${first[h%first.length]} ${last[Math.floor(h/17)%last.length]}`;}
function archetypeFor(world:World,clubId:string):ManagerArchetypeId{
  const club=world.clubs.find(c=>c.id===clubId)!;const h=hash(clubId);
  if(club.reputation>=82&&h%4===0)return 'exStar';
  if(club.tactics.pressing>=72)return h%2?'tactician':'dataDriven';
  if(club.reputation<=68&&h%3===0)return 'youthDeveloper';
  const options:ManagerArchetypeId[]=['careerProfessional','scholar','peopleManager','journeyman','tactician'];return options[h%options.length];
}

export function ensureAIManagerCharacters(world:World):void{
  const state=managerCharacterState(world);const user=userManager(world);
  for(const club of world.clubs){
    if(managerByClub(world,club.id))continue;
    if(user&&user.currentClubId===club.id)continue;
    const archetype=archetypeFor(world,club.id),draft=archetypeDraft(world,club.id,archetype);draft.name=nameFor(club.id);draft.ambition.startingClubId=club.id;draft.currentClubId=club.id;
    const manager=finalizeManagerCreation(world,draft,false);manager.history[0].summary=`${manager.name} inicia a temporada ${world.season} no ${club.name}.`;manager.history.push({date:`${world.season}-07-25`,type:'aiProfile',summary:`Perfil inicial: ${archetype}.`});
  }
  void state;
}
