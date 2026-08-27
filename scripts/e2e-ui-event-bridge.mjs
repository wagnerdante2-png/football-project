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
  const legacySystemProxies=await page.locator('.game-sidebar [data-system-view]').count();
  if(legacySystemProxies!==0)throw new Error(`Canonical sidebar must not contain legacy system proxies: ${legacySystemProxies}`);

  // Runtime hydration is intentionally no longer exposed through browser globals.
  // Prove the same integration through the active user surfaces that consume the per-World state.
  await click('.game-sidebar [data-view="transfers"]');
  await page.locator('#scout-query').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
    const raw=document.querySelector('.cards .metric strong')?.textContent??'0';
    return Number(raw.replace(/\D/g,''))>=30000;
  },{timeout:90000});
  const universe=Number(((await page.locator('.cards .metric').first().locator('strong').textContent())??'0').replace(/\D/g,''));
  if(universe<30000)throw new Error(`Active Transfers view did not expose global population: ${universe}`);
  await page.locator('#scout-country').selectOption('BRA');
  await page.locator('.scouting-list tbody tr').first().waitFor({state:'visible',timeout:15000});
  const brazilRows=await page.locator('.scouting-list tbody tr').count();
  if(brazilRows<1)throw new Error('Brazil filter produced no global scouting candidates');
  await page.locator('.scouting-list tbody tr').first().locator('[data-scout-player]').click();
  await page.locator('.scouting-report #shortlist-player').waitFor({state:'visible',timeout:5000});
  const marketText=(await page.locator('.scouting-report .scouting-market-reason').textContent())?.trim()??'';
  if(!marketText)throw new Error('Global scouting report did not expose market provenance/status');

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
  await page.locator('.engine-table tbody tr').first().waitFor({state:'visible',timeout:15000});
  await page.locator('.world-club-crest').first().waitFor({state:'visible',timeout:15000});
  const coverage=page.locator('[data-world-football-coverage]');
  await coverage.waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
    const first=document.querySelector('[data-world-football-coverage] .wfc-kpis article b')?.textContent??'0';
    return Number(first.replace(/\D/g,''))>0;
  },{timeout:90000});
  const coverageKpis=coverage.locator('.wfc-kpis article');
  if(await coverageKpis.count()!==4)throw new Error(`World coverage expected 4 KPIs, got ${await coverageKpis.count()}`);
  const countries=Number((await coverageKpis.nth(0).locator('b').textContent())?.trim()||0);
  if(countries<=0)throw new Error(`World coverage did not expose catalogued countries: ${countries}`);
  if(await coverage.locator('.wfc-table tbody tr').count()!==countries)throw new Error('World coverage row count does not match catalogued country count');

  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`UI lifecycle bridge passed: offlinePeople=${universe} · globalScoutingBRA=${brazilRows} · worldCountries=${countries} · marketStatus=OK · club/history/world OK.`);
}finally{await browser.close()}
