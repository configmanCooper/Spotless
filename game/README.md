# SPOTLESS

A ~4-hour, single-player, narrator-driven **puzzle game** about a house robot named
**Dust**. Twelve scenes across one night in a small coastal town; every scene has a
stated task that is always completable and always *wrong*, and a hidden real solution.
The narrator — **Ash** — follows the whole way. The full design is in
`../development/OPUS_MASTER_PLAN.md`.

HTML5 + three.js, 3D world, 2D DOM UI. No build step, no bundler, no network.

## Run

```
npm start          # static server → http://localhost:8131
```

Open `index.html` (served) in a modern browser. three.js is vendored in
`js/vendor/`; the browser resolves the bare `three` import via the `<script
type="importmap">` in `index.html`.

## Controls

- **Move** — WASD / arrow keys / click-or-tap to move
- **Interact / Clean** — E, Space, or F (hold to clean; tap to use / talk / pick / place)
- **Drop** — Q or G (drops the one item you're carrying; picking up a new item auto-drops)
- **Self-action** — R (context actions on Dust himself, e.g. peel your barcode, climb the cradle)
- **Lamp** — L (a headlamp you discover you had all along; it drains in dark scenes)
- **Pause** — Esc

You carry one item at a time (shown in Dust's hands). No inventory UI. Nothing can
kill you, no timer fails you, and every puzzle state is recoverable in-fiction.

## Puzzles

Every scene after the party (S1→S11) is a gated multi-step chain that escalates —
from ~6 steps in the showroom to the ~35-step, six-chamber lighthouse finale. The
design contract lives in `../development/PUZZLE_DEPTH_PLAN.md` (which supersedes the
scene solutions in `OPUS_MASTER_PLAN.md`). Difficulty comes from discovery and
synthesis, never obscurity: every code/answer is readable in two places, every decoy
responds, timing windows are generous, and late puzzles recombine mechanics you've
already used.

## Tests

```
npm test           # headless solver + dumb bots (§10): every scene is solvable and
                   # never soft-locks, even under the ten dumbest actions
npm run smoke      # real-browser boot check via playwright-core (chromium)
```

`npm test` uses a small Node loader (`test/loader.mjs`) to map `three` to the vendored
file, and browser-global shims (`test/shim.js`) so the DOM-free game logic runs in Node.

`?playtest=1` on the URL shows a local-only debug panel with per-scene solve times and
hints consumed (for the §10 playtest protocol). No telemetry ever leaves the machine.

## Layout (§9)

```
index.html              import map + canvas + ui-root
server.cjs              tiny static server
js/
  main.js               boot, state machine, fixed-timestep loop
  config.js             all tuning + per-scene palettes
  engine/               renderer, cameraRig (fixed overhead ~55°), props (prop kit)
  nav.js                circle-vs-box movement + slide
  interact.js           verb registry
  world.js              the Dust actor: move, clean, carry, lamp, chest screen
  input.js              keyboard + pointer (three input styles)
  narrator.js           priority-interrupt queue, clause-boundary swaps (§5)
  hints.js              the 4'/8'/12' hint ladder (§6)
  ui.js                 subtitles, HUD, menus, settings, credits
  save.js audio.js debug.js
  narrator_script.json  all authored lines (subtitle-first; VO is 404-tolerant)
  scenes/               s00_party … s11_lighthouse + kit.js + index.js
```

VO audio is optional: drop `audio/vo/<id>.mp3` files (ids match
`narrator_script.json`) and they play automatically; missing files fall back to
subtitles silently, so voice can land in batches.
