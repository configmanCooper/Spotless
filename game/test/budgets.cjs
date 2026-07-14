const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium, launchOptions } = require('./browser.cjs');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const IDS = ['s00_party','s01_showroom','s02_office','s03_smarthome','s04_yard','s05_museum','s06_carehome','s07_theater','s08_scrapyard','s09_repair','s10_blackout','s11_lighthouse'];
const LIMITS = { calls: 360, triangles: 25000, geometries: 380, textures: 70 };

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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const port = server.address().port;
  let failed = false;
  const first = {};

  try {
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      window.__SPOTLESS._startNew();
      window.__SPOTLESS._setSetting('bloom', false);
    });
    for (const id of IDS) {
      await page.evaluate((sceneId) => window.__SPOTLESS.loadScene(sceneId), id);
      await page.waitForTimeout(400);
      const stats = await page.evaluate(() => {
        const info = window.__SPOTLESS.renderer.renderer.info;
        return {
          calls: info.render.calls,
          triangles: info.render.triangles,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
        };
      });
      if (id === 's00_party') Object.assign(first, stats);
      const bad = Object.entries(LIMITS).filter(([k, limit]) => stats[k] > limit);
      console.log(`${bad.length ? '  ✗ ' : '  ✓ '} ${id} draws:${stats.calls} tris:${stats.triangles} geo:${stats.geometries} tex:${stats.textures}`);
      if (bad.length) {
        failed = true;
        console.log('     over budget:', bad.map(([k, limit]) => `${k} ${stats[k]}>${limit}`).join(', '));
      }
    }

    await page.evaluate(() => window.__SPOTLESS._setSetting('bloom', true));
    for (const id of ['s00_party', 's05_museum']) {
      await page.evaluate((sceneId) => window.__SPOTLESS.loadScene(sceneId), id);
      await page.waitForTimeout(500);
      const stats = await page.evaluate(() => {
        const info = window.__SPOTLESS.renderer.renderer.info;
        return { calls: info.render.calls, triangles: info.render.triangles, textures: info.memory.textures };
      });
      const bloomOk = stats.calls <= LIMITS.calls && stats.triangles <= LIMITS.triangles && stats.textures <= LIMITS.textures;
      console.log(`${bloomOk ? '  ✓ ' : '  ✗ '} ${id} remains in budget with bloom`);
      if (!bloomOk) failed = true;
    }
    await page.evaluate(() => window.__SPOTLESS._setSetting('bloom', false));

    await page.evaluate(() => window.__SPOTLESS.loadScene('s00_party'));
    await page.waitForTimeout(400);
    const memoryBaseline = await page.evaluate(() => {
      const info = window.__SPOTLESS.renderer.renderer.info.memory;
      return { geometries: info.geometries, textures: info.textures };
    });

    // Run a second complete scene sweep to approximate a full replay before
    // returning to S0 for the teardown-memory comparison.
    for (const id of IDS) {
      await page.evaluate((sceneId) => window.__SPOTLESS.loadScene(sceneId), id);
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.__SPOTLESS.loadScene('s00_party'));
    await page.waitForTimeout(400);
    const revisit = await page.evaluate(() => {
      const info = window.__SPOTLESS.renderer.renderer.info.memory;
      return { geometries: info.geometries, textures: info.textures };
    });
    const stable = revisit.geometries <= memoryBaseline.geometries + 12 && revisit.textures <= memoryBaseline.textures + 8;
    console.log(`${stable ? '  ✓ ' : '  ✗ '} scene teardown memory returns near baseline`);
    if (!stable) {
      failed = true;
      console.log('     baseline:', memoryBaseline, 'revisit:', revisit);
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? '\nBUDGET CHECK FAILED' : '\nBUDGET CHECK OK ✓');
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
