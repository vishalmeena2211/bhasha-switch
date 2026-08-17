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
  if (url === '/demo-custom.html') return serveFile(res, path.join(DIR, 'demo-custom.html'), 'text/html');
  if (url === '/src/index.js') return serveFile(res, path.join(DIR, 'src/index.js'), 'application/javascript');
  if (url === '/mock-translate' && req.method === 'POST') {
    // Deterministic mock engine: prefixes '[<lang>] ' and passes «N» glossary
    // placeholders through untouched — like a real MT API preserving tokens.
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try {
        const { target, texts } = JSON.parse(body);
        const results = {};
        for (const t of texts) results[t] = { t: `[${target}] ${t}` };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
      } catch { res.writeHead(400); res.end('{}'); }
    });
    return;
  }
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

  // 4) Custom engine + glossary (fresh context so localStorage starts clean)
  const ctx2 = await browser.newContext({ viewport: { width: 900, height: 1150 } });
  const p2 = await ctx2.newPage();
  p2.on('console', m => { if (m.type() === 'error') errs.push('custom: ' + m.text().slice(0, 120)); });
  await p2.goto(base + 'demo-custom.html', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(500);
  const customFresh = await p2.evaluate(() => ({
    widget: !!document.querySelector('.bhasha-switch select'),
    optionCount: (document.querySelector('.bhasha-switch select') || { length: 0 }).length,
    googleInjected: !!document.getElementById('bhasha-google-host'),
    hasBodo: Array.from((document.querySelector('.bhasha-switch select') || { options: [] }).options)
      .some(o => o.value === 'brx'),
  }));
  console.log('CUSTOM_FRESH', JSON.stringify(customFresh));
  if (!customFresh.widget || customFresh.googleInjected || !customFresh.hasBodo) {
    throw new Error('custom engine boot assertions failed: ' + JSON.stringify(customFresh));
  }

  await p2.evaluate(() => window.BhashaSwitch.setLanguage('hi'));
  await p2.waitForTimeout(1500);
  const customHi = await p2.evaluate(() => ({
    heading: document.querySelector('.hdr div div').innerText,
    para: document.querySelector('main p').innerText,
    gstPara: document.querySelectorAll('main p')[1].innerText,
    due: document.querySelector('.grand td').innerText,
    amount: document.querySelectorAll('.grand td')[1].innerText,
    pii: document.querySelector('[data-bhasha-skip]').innerText,
    placeholder: document.querySelector('input').getAttribute('placeholder'),
  }));
  console.log('CUSTOM_HI', JSON.stringify(customHi));
  const a = [];
  if (customHi.heading !== '[hi] Hotel प्रॉपर्टी Dashboard') a.push('heading wrong (want mock prefix + glossary rendering): ' + customHi.heading);
  if (!customHi.para.includes('प्रॉपर्टी')) a.push('glossary term Property not rendered: ' + customHi.para);
  if (!customHi.para.includes('चेक-इन')) a.push('glossary term Check-in not rendered: ' + customHi.para);
  if (customHi.para.includes('«')) a.push('placeholder leaked: ' + customHi.para);
  if (!customHi.gstPara.includes('GST') || !customHi.gstPara.includes('UPI')) a.push('DNT terms mangled: ' + customHi.gstPara);
  if (!customHi.para.includes('101')) a.push('number lost: ' + customHi.para);
  if (customHi.amount !== '₹10,250.00') a.push('amount mutated: ' + customHi.amount);
  if (customHi.pii !== 'Guest: Ramesh Kumar (never translated — PII)') a.push('data-bhasha-skip violated: ' + customHi.pii);
  if (!customHi.placeholder.startsWith('[hi]')) a.push('attribute not translated: ' + customHi.placeholder);
  if (a.length) throw new Error('custom engine hi assertions failed:\n  ' + a.join('\n  '));
  await p2.screenshot({ path: path.join(DIR, 'proof-4-custom-hindi-glossary.png'), fullPage: true });

  // 5) Revert to English — must restore originals byte-for-byte
  await p2.evaluate(() => window.BhashaSwitch.setLanguage('en'));
  await p2.waitForTimeout(500);
  const customRevert = await p2.evaluate(() => ({
    heading: document.querySelector('.hdr div div').innerText,
    para: document.querySelector('main p').innerText,
    placeholder: document.querySelector('input').getAttribute('placeholder'),
  }));
  console.log('CUSTOM_REVERT', JSON.stringify(customRevert));
  if (customRevert.heading !== 'Hotel Property Dashboard' ||
      !customRevert.para.startsWith('Property performance') ||
      customRevert.placeholder !== 'Search bookings by guest name') {
    throw new Error('custom engine revert failed: ' + JSON.stringify(customRevert));
  }
  await p2.screenshot({ path: path.join(DIR, 'proof-5-custom-reverted.png'), fullPage: true });

  // 6) Glossary unit checks (protect/restore round-trip via exposed helpers)
  const unit = await p2.evaluate(() => {
    const g = window.BhashaSwitch._glossary;
    const gi = g.index({ doNotTranslate: ['GST'], terms: { Property: { hi: 'प्रॉपर्टी' } } });
    const prot = g.protect('Property Details with GST', gi);
    const rest = g.restore('[hi] ' + prot.out, prot.slots, 'hi', gi);
    return { protected: prot.out, slots: prot.slots.length, restored: rest.text, lost: rest.lost,
             gstinSafe: g.protect('GSTIN', gi).slots.length === 0 };
  });
  console.log('GLOSSARY_UNIT', JSON.stringify(unit));
  if (unit.slots !== 2 || unit.lost || !unit.restored.includes('प्रॉपर्टी') ||
      !unit.restored.includes('GST') || !unit.gstinSafe) {
    throw new Error('glossary unit checks failed: ' + JSON.stringify(unit));
  }

  console.log('CONSOLE_ERRORS', JSON.stringify(errs));
  await browser.close();
  server.close();
})().catch(e => { console.error('FATAL', e); server.close(); process.exit(1); });
