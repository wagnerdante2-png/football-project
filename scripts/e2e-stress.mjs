import { chromium } from 'playwright';

const base=process.env.TOUCHLINE_E2E_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const failures=[];
const consoleErrors=[];
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
page.on('pageerror',error=>consoleErrors.push(error.message));

async function click(selector,timeout=5000){const node=page.locator(selector).first();await node.waitFor({state:'visible',timeout});await node.click()}
async function clickCreatorNext(){await click('[data-next]',10000)}
async function assertResponsive(label){
 const app=page.locator('#app');
 const box=await app.boundingBox();
 if(!box||box.width<500||box.height<300)failures.push(`${label}: app shell is not visibly rendered`);
}
async function assertNoWhiteScreen(label){
 const text=(await page.locator('#app').innerText()).trim();
 if(text.length<50)failures.push(`${label}: suspiciously empty app (${text.length} chars)`);
}
async function assertDateMoves(){
 const before=await page.locator('[data-world-date]').textContent();
 await click('[data-continue]',8000);
 await page.waitForFunction(prev=>{
   const date=document.querySelector('[data-world-date]')?.textContent||'';
   const overlay=document.querySelector('.v2-processing');
   return date!==prev&&(!overlay||overlay.hasAttribute('hidden'));
 },before,{timeout:15000});
 return page.locator('[data-world-date]').textContent();
}
async function smokeSystems(){
 await click('.game-sidebar [data-view="systems"]');
 await page.locator('[data-engine-launch="medical"]').first().waitFor({ state: 'visible', timeout: 5000 });
}

try {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await click('[data-start]', 15000);
  for (let i = 0; i < 6; i++) await clickCreatorNext();
  await page.locator('.game-sidebar').waitFor({ state: 'visible', timeout: 15000 });

  const views = ['squad','tactics','training','calendar','medical','transfers','staff','analytics','club','world','inbox','home'];
  for (let round = 0; round < 3; round++) {
    for (const view of views) {
      await click(`.game-sidebar [data-view="${view}"]`);
      await assertResponsive(`${view} navigation ${round + 1}`);
    }
  }

  let previousDate = await page.locator('[data-world-date]').textContent();
  for (let i = 0; i < 5; i++) {
    await click('[data-continue]', 8000);
    await page.waitForFunction(prev => {
      const date = document.querySelector('[data-world-date]')?.textContent || '';
      const overlay = document.querySelector('.v2-processing');
      return date !== prev && (!overlay || overlay.hasAttribute('hidden'));
    }, previousDate, { timeout: 15000 });
    previousDate = await page.locator('[data-world-date]').textContent();
    if(i===0){
      const matchCenter=page.locator('.matchday-backdrop .matchday-center');
      if(await matchCenter.count()){
        await matchCenter.first().waitFor({state:'visible',timeout:5000});
        const replay=page.locator('.matchday-backdrop [data-replay-play]');
        if(!(await replay.count()))failures.push('continue matchday: Match Center opened without replay control');
        await page.keyboard.press('Escape');
      }
    }
    await assertResponsive(`continue ${i + 1}`);
  }

  await click('.game-sidebar [data-view="inbox"]');
  const inboxItems = page.locator('.v2-inbox-layout aside button');
  if (await inboxItems.count() >= 2) {
    const total = await inboxItems.count();
    const secondSubject = (await inboxItems.nth(1).locator('b').textContent())?.trim();
    const secondSummary = (await inboxItems.nth(1).locator('span').textContent())?.trim();
    if(!secondSubject||!secondSummary)failures.push(`inbox: second item incomplete among ${total}`);
  }

  await smokeSystems();
  await assertNoWhiteScreen('final');
} catch(error) {
  failures.push(error instanceof Error?`${error.name}: ${error.message}`:String(error));
} finally {
  await browser.close();
}

for(const error of consoleErrors)console.error(`[browser] ${error}`);
for(const failure of failures)console.error(`[failure] ${failure}`);
if(consoleErrors.length||failures.length)process.exit(1);
console.log('[e2e-stress] navigation, Continue/day progression, matchday handoff and UI runtime OK');
