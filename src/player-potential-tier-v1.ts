import type { Player, Position } from './engine';

export type PlayerPotentialTier='developmental'|'squad-level'|'intermediate'|'high-level'|'possible-star'|'possible-elite'|'possible-legend';
export type PlayerPotentialLabel={tier:PlayerPotentialTier;label:string;shortLabel:string;ceilingBand:[number,number];confidence:number;positionSpecific?:string};

const bands:Array<{min:number;tier:PlayerPotentialTier;label:string;shortLabel:string}>=[
 {min:96,tier:'possible-legend',label:'Possível jogador lendário',shortLabel:'Lendário?'},
 {min:91,tier:'possible-elite',label:'Possível craque de elite mundial',shortLabel:'Craque?'},
 {min:86,tier:'possible-star',label:'Possível estrela',shortLabel:'Estrela?'},
 {min:79,tier:'high-level',label:'Possível jogador de alto nível',shortLabel:'Alto nível'},
 {min:70,tier:'intermediate',label:'Possível jogador de nível intermediário',shortLabel:'Intermediário'},
 {min:60,tier:'squad-level',label:'Possível jogador de elenco profissional',shortLabel:'Elenco'},
 {min:0,tier:'developmental',label:'Talento em desenvolvimento',shortLabel:'Desenvolvimento'}
];

function positionalLabel(pos:Position,tier:PlayerPotentialTier){
 const elite=tier==='possible-elite'||tier==='possible-legend'||tier==='possible-star';
 if(pos==='GK'&&elite)return tier==='possible-legend'?'Possível goleiro lendário':tier==='possible-elite'?'Possível goleiro de elite mundial':'Possível goleiro de alto nível';
 if(['CB','RB','LB','DM'].includes(pos)&&elite)return tier==='possible-legend'?'Possível defensor lendário':'Possível defensor de elite';
 if(['AM','RW','LW','ST'].includes(pos)&&elite)return tier==='possible-legend'?'Possível craque geracional':'Possível estrela ofensiva';
 return undefined;
}

export function potentialTierFor(input:{potential:number;position:Position;certainty?:number;age?:number}):PlayerPotentialLabel{
 const base=bands.find(b=>input.potential>=b.min)!;const certainty=Math.max(5,Math.min(100,input.certainty??(input.age!==undefined&&input.age<=15?28:45)));
 const spread=Math.max(3,Math.round((100-certainty)*.12));
 return{tier:base.tier,label:positionalLabel(input.position,base.tier)??base.label,shortLabel:base.shortLabel,ceilingBand:[Math.max(30,input.potential-spread),Math.min(99,input.potential+Math.max(2,Math.round(spread*.45)))],confidence:certainty,positionSpecific:positionalLabel(input.position,base.tier)};
}

export function playerPotentialLabel(player:Player,certainty?:number){return potentialTierFor({potential:player.potentialAbility,position:player.position,certainty,age:player.age})}
