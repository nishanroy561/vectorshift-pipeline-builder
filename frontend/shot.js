const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1380, height: 800 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8088/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.vs-node', { timeout: 10000 });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: 'shot-editor.png' });
  await browser.close();
  console.log('ok');
})();
