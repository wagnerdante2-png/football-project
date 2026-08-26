import fs from 'node:fs/promises';
import path from 'node:path';

const SNAPSHOT=path.resolve('public','data','rosters','world-tier-a-2026.json');

let world;
try{
  world=JSON.parse(await fs.readFile(SNAPSHOT,'utf8'));
}catch{
  console.log('[Tier A preflight] no previous snapshot; nothing to sanitize');
  process.exit(0);
}

const invalidCountries=new Set();
for(const country of world.countries??[]){
  const catalog=Number(country?.counts?.openFootballClubs);
  const matched=Number(country?.counts?.matchedClubs);
  if(Number.isFinite(catalog)&&Number.isFinite(matched)&&catalog>=0&&matched>catalog){
    invalidCountries.add(country.countryId);
    console.warn('[Tier A preflight] rejecting contaminated fallback',country.countryId,{matchedClubs:matched,openFootballClubs:catalog});
  }
}

if(!invalidCountries.size){
  console.log('[Tier A preflight] previous snapshot fallback integrity OK');
  process.exit(0);
}

const invalidClubQids=new Set((world.clubs??[]).filter(c=>invalidCountries.has(c.countryId)).map(c=>c.wikidataId).filter(Boolean));
world.countries=(world.countries??[]).filter(c=>!invalidCountries.has(c.countryId));
world.clubs=(world.clubs??[]).filter(c=>!invalidCountries.has(c.countryId));
world.players=(world.players??[]).filter(p=>{
  const country=p.clubCountryId??p.countryId;
  if(country&&invalidCountries.has(country))return false;
  if(p.clubWikidataId&&invalidClubQids.has(p.clubWikidataId))return false;
  return true;
});

await fs.writeFile(SNAPSHOT,JSON.stringify(world,null,2));
console.log('[Tier A preflight] sanitized previous snapshot',{removedCountries:[...invalidCountries]});
