import fs from 'node:fs/promises';
import path from 'node:path';

const FILE=path.resolve('public','data','visual','visual-assets-2026.json');
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const canonical={
  'sao paulo fc':'Q38568',
  'cr flamengo':'Q17479',
  'gremio fbpa':'Q221695',
  'sc internacional':'Q80845'
};
const manifest=JSON.parse(await fs.readFile(FILE,'utf8'));let rejected=0;
for(const club of manifest.clubs??[]){const expected=canonical[norm(club.name)];if(!expected||!club.wikidataId||club.wikidataId===expected)continue;delete club.wikidataId;delete club.crest;delete club.stadiumName;delete club.stadiumImage;club.sourceConfidence=Math.min(club.sourceConfidence??20,20);club.identityRejected=`Expected ${expected}; rejected ambiguous ${club.wikidataId??'candidate'}`;club.kitSource='procedural';rejected++}
manifest.identitySanitization={rejectedAmbiguousClubMatches:rejected,generatedAt:new Date().toISOString()};
manifest.notes=[...(manifest.notes??[]),'Known ambiguous Brazilian club aliases are guarded by canonical Wikidata IDs; mismatches are discarded rather than displayed.'];
await fs.writeFile(FILE,JSON.stringify(manifest,null,2));console.log({rejectedAmbiguousClubMatches:rejected});
