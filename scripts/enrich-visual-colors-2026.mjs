import fs from 'node:fs/promises';
import path from 'node:path';

const FILE=path.resolve('public','data','visual','visual-assets-2026.json');
const normHex=x=>{let h=x.toLowerCase();if(h.length===4)h='#'+h.slice(1).split('').map(c=>c+c).join('');return h};
const rgb=h=>{const x=normHex(h).slice(1);return [parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16)]};
const sat=h=>{const [r,g,b]=rgb(h).map(x=>x/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx===mn?0:(mx-mn)/(1-Math.abs(mx+mn-1))};
const lum=h=>{const [r,g,b]=rgb(h);return (.2126*r+.7152*g+.0722*b)/255};
const dist=(a,b)=>Math.sqrt(rgb(a).reduce((s,v,i)=>s+(v-rgb(b)[i])**2,0));
function palette(svg){const matches=svg.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g)??[],counts=new Map();for(const raw of matches){const h=normHex(raw);if(!/^#[0-9a-f]{6}$/.test(h))continue;counts.set(h,(counts.get(h)??0)+1)}const rows=[...counts].map(([hex,count])=>({hex,count,s:sat(hex),l:lum(hex)})).filter(x=>x.l>.025&&x.l<.975).sort((a,b)=>(b.s*2+b.count*.08)-(a.s*2+a.count*.08));const chosen=[];for(const x of rows){if(chosen.every(c=>dist(c.hex,x.hex)>70))chosen.push(x);if(chosen.length===3)break}if(!chosen.length)return;const primary=chosen[0]?.hex,secondary=chosen[1]?.hex??(chosen[0].l>.5?'#111315':'#f3f5f4'),accent=chosen[2]?.hex??secondary;return{primary,secondary,accent}}
async function fetchSvg(url){const r=await fetch(url,{headers:{'user-agent':'football-project-visual-color-enricher/1.0'}});if(!r.ok)return;const type=r.headers.get('content-type')??'';if(!type.includes('svg')&&!url.toLowerCase().includes('.svg'))return;return r.text()}

const manifest=JSON.parse(await fs.readFile(FILE,'utf8'));let enriched=0;
for(const club of manifest.clubs??[]){const crest=club.crest;if(!crest?.freeToRedistribute||!crest.url||!crest.url.toLowerCase().includes('.svg'))continue;try{const svg=await fetchSvg(crest.url),p=svg&&palette(svg);if(!p)continue;club.primaryColor=p.primary;club.secondaryColor=p.secondary;club.accentColor=p.accent;club.kitSource='derived-from-crest';club.paletteProvenance={source:'verified-free-crest',sourcePage:crest.sourcePage,method:'dominant-svg-colors'};enriched++}catch(e){console.warn('palette skip',club.name,String(e))}}
manifest.colorEnrichment={derivedFromVerifiedCrests:enriched,generatedAt:new Date().toISOString()};
manifest.notes=[...(manifest.notes??[]),'Kit/UI palettes may be derived from verified free SVG crest colors; this is a visual approximation, not a claim that the generated shirt reproduces an official kit design.'];
await fs.writeFile(FILE,JSON.stringify(manifest,null,2));console.log({derivedClubPalettes:enriched});
