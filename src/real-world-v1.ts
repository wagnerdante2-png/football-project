import { tacticPresets, type Club, type Player, type PlayerAttributes, type Position, type Standing, type Tactics, type World } from './engine';

const POSITIONS: Position[]=['GK','GK','RB','RB','CB','CB','CB','CB','LB','LB','DM','DM','CM','CM','CM','AM','AM','RW','RW','LW','LW','ST','ST','ST'];
const CLUBS=[
  ['sao-paulo','São Paulo FC',84,88,'posse'],['sport-recife','SC Recife',68,70,'contraAtaque'],['cruzeiro','Cruzeiro EC',82,86,'equilibrado'],['mirassol','Mirassol FC',72,68,'equilibrado'],
  ['gremio','Grêmio FBPA',79,84,'posse'],['atletico-mg','CA Mineiro',83,88,'gegenpress'],['fortaleza','Fortaleza EC',78,81,'equilibrado'],['fluminense','Fluminense FC',80,84,'posse'],
  ['juventude','EC Juventude',69,68,'blocoBaixo'],['vitoria','EC Vitória',71,72,'contraAtaque'],['flamengo','CR Flamengo',89,94,'gegenpress'],['internacional','SC Internacional',80,85,'equilibrado'],
  ['palmeiras','SE Palmeiras',89,94,'gegenpress'],['botafogo','Botafogo FR',85,89,'equilibrado'],['vasco','CR Vasco da Gama',76,82,'contraAtaque'],['santos','Santos FC',77,87,'posse'],
  ['bahia','EC Bahia',80,80,'posse'],['corinthians','SC Corinthians Paulista',81,90,'equilibrado'],['bragantino','RB Bragantino',76,76,'gegenpress'],['ceara','Ceará SC',71,72,'blocoBaixo']
] as const;

const FIRST=['Caio','Davi','Felipe','Gabriel','Igor','João','Lucas','Mateus','Pedro','Rafael','Samuel','Thiago','Vinícius','Wesley','Yuri'];
const LAST=['Almeida','Barbosa','Cardoso','Duarte','Ferreira','Gomes','Lima','Martins','Oliveira','Pereira','Rocha','Silva','Teixeira','Vieira'];
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function hash(text:string){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function pseudo(seed:number,offset:number){const x=Math.sin(seed*12.9898+offset*78.233)*43758.5453;return x-Math.floor(x)}
function attr(base:number,bias:number,seed:number,offset:number){return Math.round(clamp(base+bias+(pseudo(seed,offset)-.5)*18,25,95))}
function player(clubId:string,base:number,position:Position,index:number):Player{
  const seed=hash(`${clubId}:${position}:${index}`),age=17+Math.floor(pseudo(seed,1)*18),ca=Math.round(clamp(base+(pseudo(seed,3)-.5)*18,45,91));
  const growth=age<=21?8+Math.floor(pseudo(seed,2)*18):2+Math.floor(pseudo(seed,2)*8),name=`${FIRST[Math.floor(pseudo(seed,4)*FIRST.length)]} ${LAST[Math.floor(pseudo(seed,5)*LAST.length)]}`;
  const fin=position==='ST'?14:['RW','LW','AM'].includes(position)?8:position==='GK'?-25:-4,pass=['CM','AM','DM'].includes(position)?12:['RW','LW'].includes(position)?7:position==='GK'?-10:1,tackle=['CB','RB','LB','DM'].includes(position)?12:position==='GK'?-18:-5;
  const attributes:PlayerAttributes={pace:attr(ca,['RW','LW','RB','LB'].includes(position)?11:position==='GK'?-12:1,seed,10),passing:attr(ca,pass,seed,11),technique:attr(ca,['AM','RW','LW','ST'].includes(position)?8:0,seed,12),finishing:attr(ca,fin,seed,13),tackling:attr(ca,tackle,seed,14),positioning:attr(ca,['CB','DM','GK'].includes(position)?10:3,seed,15),stamina:attr(ca,['CM','DM','RB','LB'].includes(position)?8:0,seed,16),decisions:attr(ca,age>=27?7:0,seed,17),goalkeeping:attr(ca,position==='GK'?18:-38,seed,18)};
  return{id:`${clubId}-generated-${index+1}`,clubId,name,position,age,currentAbility:ca,potentialAbility:Math.round(clamp(ca+growth,ca,96)),condition:92+Math.round(pseudo(seed,6)*8),morale:65+Math.round(pseudo(seed,7)*30),attributes};
}
function club(row:typeof CLUBS[number]):Club{const[id,name,base,reputation,preset]=row;return{id,name,reputation,players:POSITIONS.map((p,i)=>player(id,base,p,i)),tactics:{...tacticPresets[preset]} as Tactics}}
function standings(clubs:Club[]):Record<string,Standing>{return Object.fromEntries(clubs.map(c=>[c.id,{clubId:c.id,played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0}]))}
function fixtures(clubs:Club[]){const ids=clubs.map(c=>c.id);if(ids.length%2)ids.push('BYE');const fixed=ids[0];let rotating=ids.slice(1);const first:World['fixtures']=[];for(let round=1;round<ids.length;round++){const a=[fixed,...rotating];for(let i=0;i<a.length/2;i++){const x=a[i],y=a[a.length-1-i];if(x!=='BYE'&&y!=='BYE'){const swap=round%2===0;first.push({round,home:swap?y:x,away:swap?x:y,played:false})}}rotating=[rotating.at(-1)!,...rotating.slice(0,-1)]}const r=ids.length-1;return[...first,...first.map(f=>({...f,round:f.round+r,home:f.away,away:f.home}))]}

/**
 * Primary 2026 bootstrap: real Brazilian club identities with engine-generated squads.
 * Real player names are intentionally NOT assigned to clubs until a factual roster source is verified.
 */
export function createBrazilRealWorld2026():World{const clubs=CLUBS.map(club);return{season:2026,round:1,clubs,fixtures:fixtures(clubs),standings:standings(clubs)}}
export const realWorldBootstrapInfo={competition:'Brasileirão Série A',clubIdentitySource:'OpenFootball 2025 stable fixture set',rosterMode:'procedural-pending-factual-roster' as const,clubCount:CLUBS.length};
