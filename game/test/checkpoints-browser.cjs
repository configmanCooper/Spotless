const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium, launchOptions } = require('./browser.cjs');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      fs.readFile(path.join(ROOT, p), (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, () => resolve(server));
  });
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage();
  const port = server.address().port;
  let failed = false;
  const assert = (name, cond) => { console.log((cond ? '  ✓ ' : '  ✗ ') + name); if (!cond) failed = true; };

  const advanceTo = async (scene, target) => page.evaluate(({ scene, target }) => {
    const g = window.__SPOTLESS;
    g.loadScene(scene);
    const ch = g.api._chain;
    let guard = 0;
    while (!ch.done(target) && guard++ < 200) {
      const cur = ch.current();
      if (!cur) break;
      ch.advance(cur);
    }
    return {
      done: ch.done(target),
      checkpoint: g.state.checkpoint,
    };
  }, { scene, target });

  try {
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.__SPOTLESS._startNew());

    const s8Saved = await advanceTo('s08_scrapyard', 'lockout');
    assert('S8 browser checkpoint saved', s8Saved.done && s8Saved.checkpoint?.milestone === 'lockout');
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
    await page.evaluate(() => window.__SPOTLESS._continue()); await page.waitForTimeout(500);
    assert('S8 browser checkpoint restored', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      return g.scene.id === 's08_scrapyard' && g.scene.lockedOut === true
        && g.api._chain.done('lockout') && g.api._chain.ready('gate');
    }));

    const s9Saved = await advanceTo('s09_repair', 'sync');
    assert('S9 browser checkpoint saved', s9Saved.done && s9Saved.checkpoint?.milestone === 'sync');
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
    await page.evaluate(() => window.__SPOTLESS._continue()); await page.waitForTimeout(500);
    assert('S9 browser checkpoint restored', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      return g.scene.id === 's09_repair' && g.api._chain.done('sync')
        && g.api._chain.ready('turnstile') && g.scene._vacEnt.hasChip
        && g.scene._vacEnt.hasBarcode && g.scene._vacEnt.ballast === 2
        && g.scene._vacEnt.charged;
    }));
    assert('S9 technician sequence runs after restored sync', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      const turnstile = g.interact.entities.find(e => e.id === 'turnstile');
      turnstile.onUse(g.api);
      for (let i = 0; i < 300 && !g.scene.coatHung; i++) g.scene.update(0.1, g.api);
      return g.scene.coatHung && g.api._chain.done('turnstile') && g.api._chain.ready('cagekey');
    }));
  } finally {
    await browser.close();
    server.close();
  }

  console.log(failed ? '\nBROWSER CHECKPOINTS FAILED' : '\nBROWSER CHECKPOINTS OK ✓');
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
