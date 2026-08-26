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

  await click('.game-sidebar [data-view="club"]');
  await page.locator('.view-hero.club-context-hero').waitFor({state:'visible',timeout:5000});
  await page.locator('.club-context-crest').waitFor({state:'visible',timeout:5000});

  await click('.game-sidebar [data-view="analytics"]');
  await page.locator('.records-history-v1').waitFor({state:'visible',timeout:5000});
  await page.locator('.rh-canonical').waitFor({state:'visible',timeout:5000});

  await click('.game-sidebar [data-view="world"]');
  await page.locator('.engine-table tbody tr').first().waitFor({state:'visible',timeout:5000});
  await page.locator('.world-club-crest').first().waitFor({state:'visible',timeout:5000});

  if(errors.length)throw new Error(errors.join('\n'));
  console.log('UI lifecycle bridge passed: club, analytics/history and world decorators receive canonical view events.');
}finally{await browser.close()}
