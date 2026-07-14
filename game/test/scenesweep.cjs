const path = require('path'); const http = require('http'); const fs = require('fs');
const { chromium, launchOptions } = require('./browser.cjs');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
function serve() { return new Promise((res) => { const s = http.createServer((rq, rs) => { let p = rq.url.split('?')[0]; if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { rs.writeHead(404); rs.end(); } else { rs.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); rs.end(d); } }); }); s.listen(0, () => res(s)); }); }
(async () => {
  const server = await serve(); const port = server.address().port;
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/i.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__SPOTLESS._startNew());
  const ids = ['s00_party','s01_showroom','s02_office','s03_smarthome','s04_yard','s05_museum','s06_carehome','s07_theater','s08_scrapyard','s09_repair','s10_blackout','s11_lighthouse'];
  let bad = false;
  for (const id of ids) {
    errs.length = 0;
    await page.evaluate((sid) => window.__SPOTLESS.loadScene(sid), id);
    await page.waitForTimeout(500); // render a few frames
    const ok = await page.evaluate((sid) => window.__SPOTLESS.scene.id === sid && window.__SPOTLESS.mode === 'play', id);
    const clean = errs.length === 0;
    console.log((ok && clean ? '  ✓ ' : '  ✗ ') + id + (clean ? '' : ' — ' + errs[0]));
    if (!ok || !clean) bad = true;
  }
  await browser.close(); server.close();
  console.log(bad ? '\nSCENE SWEEP FAILED' : '\nALL 12 SCENES BUILD & RENDER ✓');
  process.exit(bad ? 1 : 0);
})();
