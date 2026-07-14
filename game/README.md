# SPOTLESS

A single-player, narrator-driven puzzle game about a house robot named
**Dust**. Twelve scenes unfold across one night in a small coastal town. Each
scene gives Dust an assignment; meaningful progress requires understanding
what the assignment ignores.

The active implementation roadmap is
`../development/MASTER_IMPROVEMENT_PLAN.md`. The original story and puzzle
designs remain in `OPUS_MASTER_PLAN.md` and `PUZZLE_DEPTH_PLAN.md`.

HTML5 + three.js, 3D procedural low-poly world, and 2D DOM UI. No build step,
bundler, CDN, account, analytics service, or required network connection.

## Run

```powershell
npm install
npm start
```

Open `http://localhost:8131`. Three.js and the required postprocessing modules
are vendored under `js/vendor/`.

## Controls

### Keyboard and mouse

- **Move:** WASD, arrow keys, or click to move.
- **Interact / Examine / Clean:** E, Space, or F. Tap to use; hold to clean.
- **Drop:** Q or G.
- **Self-action:** R when a contextual action appears on Dust.
- **Lamp:** L once Dust discovers it.
- **Pause:** Escape.

A click near an interactable walks Dust into range and performs the action on
arrival.

### Touch

Tap the ground to move. Contextual on-screen controls provide Interact, Drop,
Self-action, Lamp, and Pause. Hold the Interact control to clean.

### Gamepad

- Left stick: move.
- A: interact / clean.
- B: drop.
- X: self-action.
- Y: lamp.
- Start: pause / resume.

## Player-facing systems

- One visible carried item; no inventory menu.
- No deaths or destructive fail states.
- Recoverable puzzle state and adversarial anti-soft-lock tests.
- Examine close-ups for physical clues.
- Three-tier hints, Patient Narrator mode, Assist timing, and mercy shimmer.
- Memory transcript in the pause menu.
- Subtitle size, speed, background, and high-contrast options.
- Reduced motion.
- Master volume.
- Optional light bloom, off by default for performance.
- Bounded checkpoints for the scrapyard, repair shop, and lighthouse.
- Scene Select after completing the game.

## Puzzles

The puzzle curve grows from a six-step showroom chain to a six-chamber
lighthouse finale with roughly twenty-one gated steps and several
player-controlled narrative beats. Late puzzles recombine familiar mechanics
rather than adding arbitrary controls.

Difficulty comes from discovery and synthesis:

- Codes and ordered answers have redundant evidence.
- Wrong actions respond instead of silently failing.
- Timing windows are generous and widened by Assist.
- Critical clues never depend on color alone.
- No scene requires a pixel hunt.

## Audio strategy

The release baseline is **subtitle-first**. All story content is complete and
playable without voice files.

Optional VO files can be placed at `audio/vo/<line-id>.mp3`, where line IDs
match `js/narrator_script.json`. Missing files fall back to subtitles. Ash's
lighthouse reveal supports real HRTF spatial routing when VO is present.

## Tests

```powershell
npm test                 # 12 scene solvers + dumb actions + solve-after-dumb
npm run test:core        # narrator, material cache, chain validation/telemetry
npm run test:checkpoints # S8/S9/S11 checkpoint reconstruction
npm run test:checkpoints-browser # rendered S8/S9 reload + technician sequence
npm run test:nav         # navigation reachability audit
npm run test:replay      # heard-once replay safety
npm run test:scenes      # all scenes build and render
npm run test:budgets     # draw/triangle/resource budgets + teardown memory
npm run test:debug       # debug=1 solution checklist behavior
npm run test:lifecycle   # settings, input, transitions, finale ordering
npm run smoke            # real-browser boot and S0→S1 transition
npm run test:all         # complete suite
```

Browser tests use repository-local `playwright-core` and an installed Chrome,
Edge, or configured `CHROME_EXE`.

## Playtesting

Open `?playtest=1` to show the local telemetry panel. It reports solve time,
wrong attempts, drops, examines, reloads, and render budgets. Click the panel
to export JSON. No telemetry leaves the machine automatically.

The cold-test process and ship gates are in
`../development/PLAYTEST_PROTOCOL.md`.

## Solution debug checklist

Open:

```text
http://localhost:8131/index.html?debug=1
```

The upper-right panel lists the complete real solution for the current scene.
Steps check themselves as their chain flags complete, and the next active step
is highlighted. The panel is scrollable for long scenes such as the
lighthouse. This mode contains full puzzle spoilers and is intended for
development and testing.

## Layout

```text
index.html              import map + canvas + UI root
server.cjs              local no-cache static server
js/
  main.js               boot, lifecycle, transitions, checkpoints
  config.js             tuning, palettes, and scene light rigs
  engine/
    renderer.js         ACES/sRGB renderer + optional bloom
    cameraRig.js        fixed authored camera anchors and beats
    props.js            procedural low-poly prop library
    fx.js               motes, puffs, smoke, sparks, and beams
  input.js              keyboard, pointer, touch, and gamepad
  world.js              Dust movement, carry, cleaning, lamp, animation
  interact.js           contextual entity registry
  narrator.js           priority queue, sequences, Memory transcript
  hints.js              per-step hint ladder and telemetry
  ui.js                 HUD, menus, accessibility, Examine, credits
  save.js               versioned local save and bounded checkpoints
  audio.js              VO fallback, spatial audio, SFX, room tones
  scenes/               s00_party through s11_lighthouse
test/                   headless and real-browser regression suites
```
