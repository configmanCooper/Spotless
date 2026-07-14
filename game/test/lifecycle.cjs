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
      g._setSetting('subs', false);
      g.narrator.line('This subtitle should stay hidden.', { id: 'test_hidden_sub', category: 'STORY' });
      g.narrator.update(0);
    });
    assert('subtitle setting hides subtitles', await page.evaluate(() => !document.querySelector('#subs').classList.contains('show')));
    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g._setSetting('subs', true);
      g._setSetting('master', 0.5);
    });
    assert('master volume setting reaches audio', await page.evaluate(() => window.__SPOTLESS.audio.master === 0.5));
    assert('muted SFX remains safe', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g._setSetting('master', 0);
      try { g.audio.sfx('clean'); } catch { return false; }
      g._setSetting('master', 0.5);
      return true;
    }));
    assert('bloom setting reaches renderer', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g._setSetting('bloom', false); const off = !g.renderer.bloomEnabled;
      g._setSetting('bloom', true); return off && g.renderer.bloomEnabled;
    }));

    assert('virtual touch interact presses and holds', await page.evaluate(() => {
      const i = window.__SPOTLESS.input;
      i.setVirtualInteract(true);
      return i.interactHeld && i.cleanHeld && i.consumeInteractTap();
    }));
    await page.evaluate(() => window.__SPOTLESS.input.setVirtualInteract(false));

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s01_showroom');
      g.world.dust.position.set(2.2, 0, -2.5);
      g.input.clickTarget = { x: 2.2, z: -2.5 };
      g.input._queuedPointerInteract = true;
      g._tick(1 / 60);
    });
    assert('queued pointer tap interacts on arrival', await page.evaluate(() => window.__SPOTLESS.scene._speedT > 0));

    const assist = await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g._setSetting('assist', false);
      g.loadScene('s01_showroom');
      const normalCycle = g.scene._cycleDuration();
      g._setSetting('assist', true);
      const s1 = g.scene._cycleDuration();
      g.loadScene('s07_theater'); const s7 = g.scene._snoreWindow();
      g.loadScene('s08_scrapyard'); const s8 = [g.scene._restartDelay(), g.scene._shipDuration()];
      g.loadScene('s10_blackout'); const s10 = [g.world.lampDrainScale, g.world.darkMoveScale];
      g.loadScene('s11_lighthouse'); const s11 = g.world.lampDrainScale;
      g._setSetting('assist', false);
      return { normalCycle, s1, s7, s8, s10, s11 };
    });
    assert('Assist widens timing across timed scenes',
      assist.normalCycle === 24 && assist.s1 === 32 && assist.s7 === 4.5 && assist.s8[0] === 30 && assist.s8[1] === 90
      && assist.s10[0] === 1.5 && assist.s10[1] === 0.75 && assist.s11 === 1.5);

    assert('gamepad Start pauses and resumes', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      let pressed = false;
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{
        axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 9 && pressed })),
      }] });
      g.mode = 'play'; g.input.enabled = true;
      g._tick(1 / 60);
      pressed = true; g._tick(1 / 60);
      const paused = g.mode === 'paused';
      pressed = false; g._tick(1 / 60);
      pressed = true; g._tick(1 / 60);
      const resumed = g.mode === 'play';
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
      return paused && resumed;
    }));

    await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.settings.reducedMotion = true;
      g.ui.showCredits([{ h: 'SPOTLESS' }, { t: 'Test' }], () => {});
    });
    assert('reduced motion uses static credits', await page.evaluate(() =>
      document.querySelector('#credits').classList.contains('static')
      && !!document.querySelector('#credits-continue')));
    await page.click('#credits-continue');
    await page.evaluate(() => { window.__SPOTLESS.settings.reducedMotion = false; });

    await page.evaluate(() => {
      window.__SPOTLESS.ui.showMemory([
        { id: 't', text: 'Routine.', speaker: 'tech', scene: 's09_repair' },
      ], () => {});
    });
    assert('Memory identifies speaker and scene', await page.evaluate(() => {
      const text = document.querySelector('#pause').textContent;
      return text.includes('TECH') && text.toLowerCase().includes('repair');
    }));
    await page.evaluate(() => window.__SPOTLESS.ui.hidePause());

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

    assert('heavy carry metadata changes Dust posture and speed state', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s09_repair');
      const ballast = g.interact.entities.find(e => e.id === 'ballast');
      g.world.pickUp(ballast);
      const heavy = g.world.carryWeight === 'heavy';
      g.world._animate(0.2, false);
      const lowered = g.world.rig.carryAnchor.position.y < 0.9;
      g.world.clearCarry({ dispose: false });
      return heavy && lowered;
    }));
    assert('carried gear restores its authored rotation when dropped', await page.evaluate(() => {
      const g = window.__SPOTLESS;
      g.loadScene('s08_scrapyard');
      const gear = g.interact.entities.find(e => e.id === 'sort_metal');
      const before = gear.mesh.rotation.x;
      g.world.pickUp(gear);
      g.world.drop();
      return Math.abs(gear.mesh.rotation.x - before) < 0.0001;
    }));

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
      const drain = (until) => {
        for (let i = 0; i < 80 && !until(); i++) {
          g.narrator.update(0);
          if (g.narrator.cur) g.narrator.cur.t = 0;
          g.narrator.update(0);
        }
      };
      g.scene._ignite(g.api, { lamp: { userData: { open() {} } } });
      drain(() => g.scene._revealStage === 'enter');
      g.world.dust.position.z = 40; g.scene.update(0, g.api);
      drain(() => g.scene._revealStage === 'ash');
      g.interact.entities.find(e => e.id === 'ash').onUse(g.api);
      drain(() => g.scene._revealStage === 'lens');
      g.interact.entities.find(e => e.id === 'lamp_lens').onUse(g.api);
      drain(() => g.scene._revealStage === 'window');
      g.ui.hideExamine(); g.mode = 'play'; g.input.enabled = true;
      g.interact.entities.find(e => e.id === 'lamp_window').onUse(g.api);
      drain(() => g.scene._phase === 'choice');
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
