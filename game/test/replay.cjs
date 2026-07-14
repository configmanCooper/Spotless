const path = require('path'); const http = require('http'); const fs = require('fs');
const { chromium, launchOptions } = require('./browser.cjs');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
function serve() { return new Promise((res) => { const s = http.createServer((rq, rs) => { let p = rq.url.split('?')[0]; if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { rs.writeHead(404); rs.end(); } else { rs.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); rs.end(d); } }); }); s.listen(0, () => res(s)); }); }
(async () => {
  const server = await serve(); const port = server.address().port;
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage();
  // Simulate a REPLAY save: s0_exit (and other once lines) already heard.
  await page.addInitScript(() => {
    localStorage.setItem('spotless.save.v1', JSON.stringify({
      v: 1, scene: 's00_party', flags: [], scenesDone: ['s00_party', 's01_showroom'],
      linesHeard: ['s0_exit', 's0_pity', 'boot_line', 's11_a3', 's11_beam'],
      solveTimes: {}, settings: { hints: 'normal', subs: true, master: 0.9 },
    }));
  });
  let failed = false; const assert = (n, c) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) failed = true; };
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  // Continue (not New Game) so the replay heard-set is used
  await page.evaluate(() => window.__SPOTLESS._continue());
  await page.waitForTimeout(600);
  assert('S0 loaded on continue', await page.evaluate(() => window.__SPOTLESS.scene.id === 's00_party'));
  await page.evaluate(() => window.__SPOTLESS.world.dust.position.set(0, 0, -14.5));
  let advanced = null;
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(1000); advanced = await page.evaluate(() => window.__SPOTLESS.scene.id); if (advanced === 's01_showroom') break; }
  assert('REPLAY: still advances past the party even though s0_exit was already heard', advanced === 's01_showroom');
  if (advanced !== 's01_showroom') console.log('   stuck at:', advanced);
  await browser.close(); server.close();
  console.log(failed ? '\nREPLAY TEST FAILED' : '\nREPLAY OK ✓');
  process.exit(failed ? 1 : 0);
})();
