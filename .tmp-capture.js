const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  await page.goto('http://127.0.0.1:8000/frontend/index.html', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'c:/Users/Administrator/NetChill/movie-display-home.png', fullPage: true });
  const links = page.locator('a[href*="Download.html"]');
  const count = await links.count();
  console.log('download-link-count', count);
  if (count > 0) {
    await links.first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'c:/Users/Administrator/NetChill/movie-display-download.png', fullPage: true });
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
