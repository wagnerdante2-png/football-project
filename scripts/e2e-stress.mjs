import { chromium } from 'playwright';

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];
page.on('pageerror', err => failures.push(`pageerror: ${err.message}`));
page.on('console', msg => { if (msg.type() === 'error') failures.push(`console: ${msg.text()}`); });

async function click(selector, timeout = 8000) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout });
  await el.click();
}
async function assertResponsive(label) {
  const ok = await page.evaluate(() => new Promise(resolve => {
    const start = performance.now();
    requestAnimationFrame(() => resolve(performance.now() - start < 1500));
  }));
  if (!ok) throw new Error(`UI unresponsive after ${label}`);
}

try {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await click('[data-start]', 15000);
  for (let i = 0; i < 6; i++) await click('[data-next]');
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
    }, previousDate, { timeout: 8000 });
    previousDate = await page.locator('[data-world-date]').textContent();
    await assertResponsive(`continue ${i + 1}`);
  }

  await click('.game-sidebar [data-view="calendar"]');
  const matchButton = page.locator('.md-open').first();
  if (await matchButton.count()) {
    await matchButton.click();
    await page.locator('.matchday-backdrop').waitFor({ state: 'visible', timeout: 5000 });
    const play = page.locator('[data-replay-play]');
    if (await play.count()) {
      await play.click();
      await page.waitForTimeout(700);
      await play.click();
    }
    await click('.md-close');
    await page.locator('.matchday-backdrop').waitFor({ state: 'detached', timeout: 5000 });
  }

  for (let i = 0; i < 10; i++) {
    await click('.game-sidebar [data-view="squad"]');
    const player = page.locator('[data-player-id]').first();
    if (await player.count()) {
      await player.click();
      await page.locator('.v2-profile-backdrop').waitFor({ state: 'visible', timeout: 3000 });
      await click('.v2-profile-close');
    }
    await click('.game-sidebar [data-view="home"]');
  }

  const runtimeErrors = await page.evaluate(() => {
    try { return JSON.parse(sessionStorage.getItem('touchline-beta-runtime-issues-v1') || '[]'); }
    catch { return [{ message: 'invalid runtime diagnostics JSON' }]; }
  });
  if (runtimeErrors.length) failures.push(...runtimeErrors.map(x => `runtime: ${x.message || JSON.stringify(x)}`));
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('E2E stress passed: repeated navigation, 5 day advances, matchday overlay and player profiles remained responsive.');
} finally {
  await browser.close();
}
