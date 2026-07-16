const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
function serveFile(res, file, type) {
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(buf);
  });
}
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/' || url === '/demo.html') return serveFile(res, path.join(DIR, 'demo.html'), 'text/html');
  if (url === '/src/index.js') return serveFile(res, path.join(DIR, 'src/index.js'), 'application/javascript');
  res.writeHead(404); res.end('nf');
});

(async () => {
  await new Promise(r => server.listen(8200, '127.0.0.1', r));
  const base = 'http://127.0.0.1:8200/';
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1150 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

  // 1) Fresh load — expect English, custom dropdown, NO google banner
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const fresh = await p.evaluate(() => ({
    widget: !!document.querySelector('.bhasha-switch select'),
    optionCount: (document.querySelector('.bhasha-switch select') || { length: 0 }).length,
    googleBannerVisible: !!document.querySelector('.goog-te-banner-frame') &&
      getComputedStyle(document.querySelector('.goog-te-banner-frame')).display !== 'none',
    bodyTop: getComputedStyle(document.body).top,
    heading: document.querySelector('.hdr div div').innerText,
  }));
  await p.screenshot({ path: path.join(DIR, 'proof-1-fresh-english.png'), fullPage: true });
  console.log('FRESH', JSON.stringify(fresh));

  // 2) Switch to Tamil via the widget (programmatic setLanguage → same path as onchange)
  await p.evaluate(() => window.BhashaSwitch.setLanguage('ta'));
  await p.waitForTimeout(4500);
  const tamil = await p.evaluate(() => ({
    stored: localStorage.getItem('bhasha_lang'),
    heading: document.querySelector('.hdr div div').innerText,
    dueLabel: document.querySelector('.grand td').innerText,
    banner: !!document.querySelector('.goog-te-banner-frame') &&
      getComputedStyle(document.querySelector('.goog-te-banner-frame')).display !== 'none',
  }));
  await p.screenshot({ path: path.join(DIR, 'proof-2-tamil.png'), fullPage: true });
  console.log('TAMIL', JSON.stringify(tamil));

  // 3) Reload — prove persistence: should come back Tamil with no manual action
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  const persisted = await p.evaluate(() => ({
    stored: localStorage.getItem('bhasha_lang'),
    heading: document.querySelector('.hdr div div').innerText,
    selectValue: (document.querySelector('.bhasha-switch select') || {}).value,
  }));
  await p.screenshot({ path: path.join(DIR, 'proof-3-persisted-after-reload.png'), fullPage: true });
  console.log('PERSISTED', JSON.stringify(persisted));

  console.log('CONSOLE_ERRORS', JSON.stringify(errs));
  await browser.close();
  server.close();
})().catch(e => { console.error('FATAL', e); server.close(); process.exit(1); });
