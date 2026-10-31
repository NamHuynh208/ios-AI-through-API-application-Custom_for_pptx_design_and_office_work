import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('.impeccable/review', { recursive: true });
const browser = await webkit.launch();
const results = [];
for (const size of [{ width: 390, height: 844, id: 'mobile' }, { width: 844, height: 390, id: 'landscape' }, { width: 1440, height: 900, id: 'desktop' }]) {
  const page = await browser.newPage({ viewport: size, colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('heading', { name: /Bạn cần hoàn thành/ }).waitFor();
  await page.locator(':focus').evaluateAll(es => es.forEach(e => e.blur()));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.impeccable/review/${size.id}-viewport.png` });
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const prompt = page.getByLabel('Yêu cầu cho trợ lý'); await prompt.scrollIntoViewIfNeeded();
  const box = await prompt.boundingBox(), nav = await page.locator('.bottom-nav').boundingBox();
  if (box.y + box.height > nav.y + 1) throw new Error('Composer unreachable: ' + size.id);
  if (size.id === 'mobile') {
    await page.getByRole('navigation').getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await page.getByRole('combobox', { name: 'Giao diện', exact: true }).selectOption('dark');
    await page.getByLabel('Model chat').fill('qa');
    await page.getByRole('button', { name: 'Lưu cài đặt', exact: true }).click();
    await page.locator(':focus').evaluateAll(es => es.forEach(e => e.blur()));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: '.impeccable/review/mobile-dark-viewport.png' });
  }
  results.push({ viewport: size.id, noHorizontalOverflow: fits, composerReachable: true, reducedMotion: true });
  await page.close();
}
await browser.close();
await writeFile('.impeccable/review/capture-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
