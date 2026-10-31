import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const results = [];
for (const [name, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') console.log(name, 'console', m.text()); });
  page.on('requestfailed', r => console.log(name, 'requestfailed', r.url(), r.failure()?.errorText));
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByRole('button', { name: 'Tài liệu', exact: true }).waitFor();
  const cacheFiles = await page.evaluate(async () => { const key = (await caches.keys()).find(k => k.startsWith('agenty-')); return (await (await caches.open(key)).keys()).map(r => r.url); });
  console.log(name, 'cache-probe', await page.evaluate(async () => { const k = (await caches.keys())[0], c = await caches.open(k); const rs = await c.keys(); const p = rs.find(r => /assets\/index-.*\.js/.test(r.url)); const response = await c.match(p); return { headers: Object.fromEntries(response.headers), bytes: (await response.arrayBuffer()).byteLength, control: navigator.serviceWorker.controller?.scriptURL }; }));
  if (!cacheFiles.some(url => url.includes('Roboto-Regular.ttf'))) throw new Error(name + ': font not cached');
  await context.setOffline(true); await page.reload();
  try { await page.getByRole('button', { name: 'Tài liệu', exact: true }).click({ timeout: 10000 }); }
  catch (e) { console.log(name, 'offline failed', JSON.stringify({ errors, body: await page.locator('body').innerText(), cacheFiles })); await page.screenshot({ path: 'test-results/offline-failure.png' }); throw e; }
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await page.getByLabel('Tiêu đề tài liệu mới').fill('Báo cáo offline');
  await page.getByLabel('Nội dung tài liệu mới').fill('Nguyễn Văn An – 1234.56 đồng');
  await page.getByRole('button', { name: 'Tạo file', exact: true }).click();
  await page.locator('#blocks-list').getByText(/Nguyễn Văn An/).waitFor();
  if (errors.length) throw new Error(name + ': ' + errors.join(';'));
  results.push({ browser: name, offlinePDFVietnamese: true, serviceWorker: true, staticCacheFiles: cacheFiles.length, pageErrors: errors });
  await page.screenshot({ path: `.impeccable/review/${name}-production-offline.png`, fullPage: true });
  await browser.close();
}
await writeFile('test-results/production-check.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
