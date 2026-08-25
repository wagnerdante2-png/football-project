import type { Club, Player } from './engine';

export type VisualAssetLicense='CC0'|'CC BY'|'CC BY-SA'|'Public domain'|'reference-only'|'procedural';
export type VisualAsset={url:string;thumbnailUrl?:string;source:string;license:VisualAssetLicense;attribution?:string;sourcePage?:string;freeToRedistribute:boolean};
export type ClubVisualIdentity={name:string;wikidataId?:string;primaryColor:string;secondaryColor:string;accentColor:string;crest?:VisualAsset;stadiumName?:string;stadiumImage?:VisualAsset;kitSource:'wikidata'|'derived-from-crest'|'procedural';sourceConfidence:number};
export type PlayerVisualIdentity={name:string;dateOfBirth?:string;wikidataId?:string;portrait?:VisualAsset;sourceConfidence:number};
export type VisualAssetManifest={version:number;generatedAt:string;clubs:ClubVisualIdentity[];players:PlayerVisualIdentity[];notes:string[]};

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const state:{manifest?:VisualAssetManifest;loading?:Promise<VisualAssetManifest|undefined>}={};

function hash(text:string){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function colorFrom(text:string,offset=0){const h=(hash(text)+offset*137)%360;return `hsl(${h} 58% ${offset?42:34}%)`}
export function proceduralClubVisual(name:string):ClubVisualIdentity{return{name,primaryColor:colorFrom(name),secondaryColor:colorFrom(name,1),accentColor:`hsl(${(hash(name)+70)%360} 72% 58%)`,kitSource:'procedural',sourceConfidence:15}}

export async function loadVisualAssetManifest(base='/data/visual/visual-assets-2026.json'){if(state.manifest)return state.manifest;if(state.loading)return state.loading;state.loading=fetch(base).then(async r=>{if(!r.ok)return;const m=await r.json() as VisualAssetManifest;state.manifest=m;return m}).catch(()=>undefined);return state.loading}
export function setVisualAssetManifest(m:VisualAssetManifest|undefined){state.manifest=m;state.loading=undefined}
export function visualManifest(){return state.manifest}
export function clubVisual(name:string):ClubVisualIdentity{const found=state.manifest?.clubs.find(x=>norm(x.name)===norm(name));return found??proceduralClubVisual(name)}
export function playerVisual(player:Pick<Player,'name'> & {dateOfBirth?:string}):PlayerVisualIdentity|undefined{if(!player.dateOfBirth)return undefined;const candidates=state.manifest?.players.filter(x=>norm(x.name)===norm(player.name)&&x.dateOfBirth===player.dateOfBirth)??[];return candidates.length===1?candidates[0]:undefined}

function esc(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]!))}
export function crestMarkup(name:string,className='visual-crest'){const v=clubVisual(name);if(v.crest?.url)return `<img class="${className}" src="${esc(v.crest.thumbnailUrl??v.crest.url)}" alt="Escudo ${esc(name)}" loading="lazy" referrerpolicy="no-referrer">`;const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();return `<span class="${className} procedural-crest" style="--vc1:${v.primaryColor};--vc2:${v.secondaryColor}">${esc(initials||'FC')}</span>`}
export function playerFaceMarkup(player:Pick<Player,'name'> & {dateOfBirth?:string},className='player-face'){const v=playerVisual(player);return v?.portrait?.url?`<img class="${className}" src="${esc(v.portrait.thumbnailUrl??v.portrait.url)}" alt="${esc(player.name)}" loading="lazy" referrerpolicy="no-referrer">`:`<span class="${className} procedural-face" aria-hidden="true"><i></i></span>`}
export function kitSvg(name:string,kind:'home'|'away'|'third'='home'){const v=clubVisual(name),a=kind==='away'?v.secondaryColor:v.primaryColor,b=kind==='away'?v.primaryColor:v.secondaryColor,accent=kind==='third'?v.accentColor:b;return `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><path d="M35 11 49 4h22l14 7 25 13-10 23-15-7v83H35V40l-15 7-10-23z" fill="url(#g)" stroke="rgba(255,255,255,.35)" stroke-width="2"/><path d="M49 4c2 11 20 11 22 0" fill="none" stroke="${b}" stroke-width="5"/><path d="M35 58h50" stroke="rgba(255,255,255,.16)" stroke-width="3"/></svg>`}
export function applyClubTheme(root:HTMLElement,name:string){const v=clubVisual(name);root.style.setProperty('--club-primary',v.primaryColor);root.style.setProperty('--club-secondary',v.secondaryColor);root.style.setProperty('--club-accent',v.accentColor);if(v.stadiumImage?.url)root.style.setProperty('--club-stadium',`url("${v.stadiumImage.thumbnailUrl??v.stadiumImage.url}")`);else root.style.removeProperty('--club-stadium')}

export function assetAttributionForClub(name:string){const v=clubVisual(name);return [v.crest,v.stadiumImage].filter((x):x is VisualAsset=>Boolean(x)).map(x=>({source:x.source,license:x.license,attribution:x.attribution,sourcePage:x.sourcePage}))}
export function freeAsset(asset?:VisualAsset){return Boolean(asset?.freeToRedistribute)}
export function clubVisualFor(club:Club){return clubVisual(club.name)}
