import { chromium } from 'playwright';

const base=process.env.E2E_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
async function click(selector,timeout=8000){const el=page.locator(selector).first();await el.waitFor({state:'visible',timeout});await el.click({timeout})}
try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await click('[data-start]',15000);
  for(let i=0;i<6;i++)await click('[data-next]');
  await page.locator('.game-sidebar').waitFor({state:'visible',timeout:15000});

  await page.waitForFunction(()=>window.__touchlinePeopleStatus?.status==='loaded',{timeout:90000});
  const people=await page.evaluate(()=>window.__touchlinePeopleStatus);
  const peopleCount=people?.report?.manifest?.counts?.deduplicatedPlayers??0;
  if(peopleCount<30000)throw new Error(`Offline people runtime did not load broad bundle: ${peopleCount}`);
  if(people?.report?.players?.inserted+people?.report?.players?.merged+people?.report?.players?.adoptedRuntime<30000)throw new Error('Offline people runtime did not hydrate global identities');

  await page.waitForFunction(()=>Boolean(window.__touchlineGlobalMetadata),{timeout:90000});
  const metadata=await page.evaluate(()=>window.__touchlineGlobalMetadata);
  if(metadata?.license!=='CC0-1.0')throw new Error(`Global metadata license mismatch: ${metadata?.license}`);
  if((metadata?.files?.clubs??0)<100)throw new Error(`Global metadata did not read broad club catalog: ${metadata?.files?.clubs}`);
  if((metadata?.parsed?.clubs??0)<=20)throw new Error(`Global metadata did not expand club identities: ${metadata?.parsed?.clubs}`);

  await click('.game-sidebar [data-view="club"]');
  await page.locator('.view-hero.club-context-hero').waitFor({state:'visible',timeout:5000});
  await page.locator('.club-context-crest').waitFor({state:'visible',timeout:5000});
  const legacy=page.locator('[data-club-legacy-insights]');
  await legacy.waitFor({state:'visible',timeout:5000});
  const legacyTitle=(await legacy.locator('h2').textContent())?.trim();
  if(legacyTitle!=='Legado & pressão histórica')throw new Error(`Club legacy panel title mismatch: ${legacyTitle}`);
  const legacyKpis=legacy.locator('.cli-kpis article');
  if(await legacyKpis.count()!==4)throw new Error(`Club legacy panel expected 4 KPIs, got ${await legacyKpis.count()}`);
  const pressureText=(await legacy.locator('header > strong').textContent())?.trim()||'';
  if(!/\d+/.test(pressureText))throw new Error(`Club legacy panel missing historical pressure value: ${pressureText}`);

  await click('.game-sidebar [data-view="analytics"]');
  await page.locator('.records-history-v1').waitFor({state:'visible',timeout:5000});
  await page.locator('.rh-canonical').waitFor({state:'visible',timeout:5000});

  await click('.game-sidebar [data-view="world"]');
  await page.locator('.engine-table tbody tr').first().waitFor({state:'visible',timeout:5000});
  await page.locator('.world-club-crest').first().waitFor({state:'visible',timeout:5000});
  const coverage=page.locator('[data-world-football-coverage]');
  await coverage.waitFor({state:'visible',timeout:5000});
  const coverageKpis=coverage.locator('.wfc-kpis article');
  if(await coverageKpis.count()!==4)throw new Error(`World coverage expected 4 KPIs, got ${await coverageKpis.count()}`);
  const countries=Number((await coverageKpis.nth(0).locator('b').textContent())?.trim()||0);
  if(countries<=0)throw new Error(`World coverage did not expose catalogued countries: ${countries}`);
  if(await coverage.locator('.wfc-table tbody tr').count()!==countries)throw new Error('World coverage row count does not match catalogued country count');

  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`UI lifecycle bridge passed: offlinePeople=${peopleCount} · metadataClubs=${metadata.parsed.clubs} · club visuals + history + world coverage OK.`);
}finally{await browser.close()}
