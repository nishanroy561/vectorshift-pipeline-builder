import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:8088';
const OUT = process.argv[2] || 'baseline';
const DIR = 'C:\\Users\\nisha\\AppData\\Local\\Temp\\claude\\D--Internships-projects-VectorShift-frontend-technical-assessment\\a5dc18a2-4389-4caa-bd0b-4f92ffd1d598\\scratchpad\\';

const views = [
  { id: 'editor', label: 'Editor' },
  { id: 'playground', label: 'Playground' },
  { id: 'pipelines', label: 'My pipelines' },
];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

for (const v of views) {
  try {
    await page.getByRole('button', { name: v.label, exact: true }).click();
  } catch (e) {
    console.log('tab click failed for', v.label, e.message);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${DIR}${OUT}-${v.id}.png` });
  console.log('saved', `${OUT}-${v.id}.png`);
}

await browser.close();
