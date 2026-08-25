import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const manifestPath=path.join(root,'public/data/visual/visual-assets-2026.json');
const outDir=path.join(root,'public/data/visual/assets');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
await fs.mkdir(outDir,{recursive:true});
const allowed=new Set(['CC0','CC BY','CC BY-SA','Public domain']);
let downloaded=0,failed=0;

function extFor(url,contentType=''){
  const clean=url.split('?')[0];
  const ext=path.extname(clean).toLowerCase();
  if(['.png','.jpg','.jpeg','.webp','.svg'].includes(ext))return ext;
  if(contentType.includes('svg'))return'.svg';
  if(contentType.includes('png'))return'.png';
  if(contentType.includes('webp'))return'.webp';
  return'.jpg';
}
async function localize(asset,label){
  if(!asset?.freeToRedistribute||!allowed.has(asset.license))return asset;
  const source=asset.thumbnailUrl||asset.url;if(!source||!/^https:/i.test(source))return asset;
  try{
    const r=await fetch(source,{headers:{'user-agent':'TheTouchlineBeta/0.2 visual asset bundler'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const buf=Buffer.from(await r.arrayBuffer()),hash=crypto.createHash('sha1').update(source).digest('hex').slice(0,12),ext=extFor(source,r.headers.get('content-type')||''),file=`${label}-${hash}${ext}`.replace(/[^a-z0-9._-]/gi,'-');
    await fs.writeFile(path.join(outDir,file),buf);downloaded++;
    return{...asset,url:`data/visual/assets/${file}`,thumbnailUrl:`data/visual/assets/${file}`,remoteSourceUrl:asset.url,remoteThumbnailUrl:asset.thumbnailUrl};
  }catch(e){failed++;console.warn('asset bundle failed',label,String(e));return asset}
}
for(const [i,club] of (manifest.clubs||[]).entries()){
  club.crest=await localize(club.crest,`club-${i}-crest`);
  club.stadiumImage=await localize(club.stadiumImage,`club-${i}-stadium`);
}
for(const [i,player] of (manifest.players||[]).entries())player.portrait=await localize(player.portrait,`player-${i}`);
manifest.portableBundle={generatedAt:new Date().toISOString(),downloaded,failed};
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
console.log(`Portable visual bundle: ${downloaded} downloaded, ${failed} failed`);
