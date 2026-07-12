const { chromium } = require('playwright');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'images', 'howto');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 800 },
    deviceScaleFactor: 1
  });

  await page.goto('https://spiderimp.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('title:', await page.title());

  await page.locator('input[name="radioBtn"][value="1"]').check();
  await page.click('#play-btn');
  await page.waitForSelector('body.playing', { timeout: 20000 });
  await page.waitForTimeout(2000);

  const topbarDisplay = await page.evaluate(() => {
    const el = document.getElementById('game-topbar');
    return el ? getComputedStyle(el).display : 'missing';
  });
  console.log('topbar display:', topbarDisplay);

  await page.screenshot({
    path: path.join(outDir, 'guide-layout.png'),
    clip: { x: 0, y: 0, width: 1366, height: 720 }
  });
  console.log('wrote guide-layout.png');

  // Use hint a few times for a mid-game look
  for (let i = 0; i < 5; i++) {
    await page.click('.btn-hint');
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(outDir, 'guide-build.png'),
    clip: { x: 0, y: 0, width: 1366, height: 720 }
  });
  console.log('wrote guide-build.png');

  // Deal if columns are non-empty
  const canDeal = await page.evaluate(() => {
    const cols = document.querySelectorAll('.wrapper .column');
    for (let i = 0; i < cols.length; i++) {
      if (!cols[i].children.length) return false;
    }
    return true;
  });
  if (canDeal) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
  }
  await page.screenshot({
    path: path.join(outDir, 'guide-deal.png'),
    clip: { x: 0, y: 0, width: 1366, height: 720 }
  });
  console.log('wrote guide-deal.png');

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
