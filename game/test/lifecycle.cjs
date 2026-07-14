const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium, launchOptions } = require('./browser.cjs');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.mp3': 'audio/mpeg' };
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
  const port = server.address().port;
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage();
  let failed = false;
  const assert = (name, cond) => { console.log((cond ? '  ✓ ' : '  ✗ ') + name); if (!cond) failed = true; };

  try {
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__SPOTLESS._startNew());

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g._togglePause();
      g._quitToTitle();
      g._startNew();
    });
    assert('Pause → Quit → Begin restores input', await page.evaluate(() => window.__SPOTLESS.input.enabled && window.__SPOTLESS.mode === 'play'));

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s10_blackout');
      g.world.pickUp(g.scene._crankEnt);
      g.loadScene('s11_lighthouse');
    });
    assert('scene transition clears carried item', await page.evaluate(() => window.__SPOTLESS.world.carry === null));

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.state.memoryLog = [{ id: 'old', text: 'old', speaker: 'narrator', scene: 's11_lighthouse' }];
      g.narrator.log = g.state.memoryLog.slice();
      g.state.solveTimes = { s11_lighthouse: { solveTime: 1 } };
      g.narrator.mode = 'spatial';
      g._startNew();
    });
    const reset = await page.evaluate(() => {
      const g = window.__SPOTLESS;
      return {
        memory: g.state.memoryLog.length,
        narratorMemory: g.narrator.log.length,
        solveTimes: Object.keys(g.state.solveTimes).length,
        mode: g.narrator.mode,
      };
    });
    assert('New Game clears transcript and solve times', reset.memory === 0 && reset.narratorMemory === 0 && reset.solveTimes === 0);
    assert('New Game resets narrator spatial mode', reset.mode === 'narrator');

    const revealOrder = await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s11_lighthouse');
      g.narrator.reset();
      g.state.flags = {};
      const heard = [];
      g.narrator.onLine = (id) => heard.push(id);
      g.scene._ignite(g.api, { lamp: { userData: { open() {} } } });
      for (let i = 0; i < 30 && heard.length < 5; i++) {
        g.narrator.update(0);
        if (g.narrator.cur) g.narrator.cur.t = 0;
        g.narrator.update(0);
      }
      return heard.slice(0, 5);
    });
    assert('S11 reveal begins in authored order', revealOrder.join(',') === 's11_c5_cradle_beat,s11_reveal,s11_a1,s11_a2,s11_a3');

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s03_smarthome');
      g.__loads = 0;
      g.__realLoad = g.loadScene;
      g.loadScene = () => { g.__loads++; };
      g._advance();
    });
    await page.waitForTimeout(1300);
    assert('interlude disables input and enters interlude mode', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      return g.mode === 'interlude' && !g.input.enabled && !g.world.enabled;
    }));
    await page.waitForTimeout(10500);
    assert('interlude advances exactly once', await page.evaluate(() => window.__SPOTLESS.__loads === 1));

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene = g.__realLoad;
      g.loadScene('s01_showroom');
      g._advance();
    });
    await page.waitForTimeout(2200);
    assert('normal scene advance restores pointer input', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      return g.scene.id === 's02_office' && g.mode === 'play' && g.input.enabled;
    }));
  } finally {
    await browser.close();
    server.close();
  }

  console.log(failed ? '\nLIFECYCLE FAILED' : '\nLIFECYCLE OK ✓');
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
