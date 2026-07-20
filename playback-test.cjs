const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const executablePath = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1228', 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = 'http://localhost:10000/Download.html?id=hero-squad&type=movie';

  page.on('console', (msg) => {
    const line = `[browser:${msg.type()}] ${msg.text()}`;
    console.log(line);
    fs.appendFileSync('playback-test.log', `${line}\n`);
  });

  const log = (line) => {
    console.log(line);
    fs.appendFileSync('playback-test.log', `${line}\n`);
  };

  log(`Opening ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForSelector('#watch-online-btn', { timeout: 20000 });
  await page.click('#watch-online-btn');

  await page.waitForSelector('#watch-modal-player', { timeout: 15000 });

  const status = await page.evaluate(() => {
    const v = document.querySelector('#watch-modal-player');
    if (!v) return { error: 'video-element-missing' };
    return {
      src: v.src,
      currentTime: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
      networkState: v.networkState,
      muted: v.muted,
      errorCode: v.error?.code || null,
      errorMessage: v.error?.message || null,
      visible: !!(v.offsetWidth && v.offsetHeight),
    };
  });

  log('Initial video state: ' + JSON.stringify(status, null, 2));

  await page.waitForFunction(() => {
    const v = document.querySelector('#watch-modal-player');
    return !!v && v.readyState >= 2 && !v.paused;
  }, { timeout: 20000 });

  const finalStatus = await page.evaluate(() => {
    const v = document.querySelector('#watch-modal-player');
    return {
      src: v.src,
      currentTime: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
      networkState: v.networkState,
      muted: v.muted,
      duration: v.duration || null,
      errorCode: v.error?.code || null,
      errorMessage: v.error?.message || null,
    };
  });

  log('Final video state: ' + JSON.stringify(finalStatus, null, 2));

  await page.screenshot({ path: 'playback-test.png', fullPage: true });
  log('Screenshot saved as playback-test.png');

  fs.writeFileSync('playback-results.json', JSON.stringify({ initial: status, final: finalStatus }, null, 2));

  await browser.close();
})();
