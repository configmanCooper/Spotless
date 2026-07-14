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
  const page = await browser.newPage({ viewport: { width: 1280, height: 500 } });
  const port = server.address().port;
  let failed = false;
  const assert = (name, cond) => { console.log((cond ? '  ✓ ' : '  ✗ ') + name); if (!cond) failed = true; };

  try {
    await page.goto(`http://localhost:${port}/index.html?debug=1&playtest=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    await page.evaluate(() => window.__SPOTLESS._startNew());
    await page.waitForTimeout(150);
    assert('debug=1 shows Party real-solution checklist', await page.evaluate(() => {
      const el = document.querySelector('#solution-debug');
      return el.classList.contains('show') && el.textContent.includes('The Party')
        && el.querySelectorAll('.solution-step').length === 1;
    }));

    await page.evaluate(() => window.__SPOTLESS.loadScene('s01_showroom'));
    await page.waitForTimeout(150);
    assert('Showroom checklist contains all six real steps', await page.evaluate(() =>
      document.querySelectorAll('#solution-debug .solution-step').length === 6));
    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.api._chain.advance('staffkey', { silent: true });
      g.debug.updateSolution(g.scene, g.api);
    });
    assert('completed steps check live and next step highlights', await page.evaluate(() => {
      const steps = [...document.querySelectorAll('#solution-debug .solution-step')];
      return steps[0].querySelector('input').checked && steps[1].classList.contains('current');
    }));

    await page.evaluate(() => window.__SPOTLESS.loadScene('s11_lighthouse'));
    await page.waitForTimeout(150);
    assert('Lighthouse checklist is scrollable and contains 21 steps', await page.evaluate(() => {
      const el = document.querySelector('#solution-debug');
      return el.querySelectorAll('.solution-step').length === 21
        && getComputedStyle(el).overflowY === 'auto'
        && el.scrollHeight > el.clientHeight;
    }));
    assert('solution and playtest panels do not overlap', await page.evaluate(() => {
      const solution = document.querySelector('#solution-debug').getBoundingClientRect();
      const telemetry = document.querySelector('#debug').getBoundingClientRect();
      return solution.bottom <= telemetry.top;
    }));
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? '\nDEBUG MENU FAILED' : '\nDEBUG MENU OK ✓');
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
