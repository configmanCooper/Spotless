# SPOTLESS — Changelog

## v2 — Puzzle Depth Pass (PUZZLE_DEPTH_PLAN.md)
Engine
- Added `api.chain(defs)` step machine (gated entities, per-step hint-pool swaps, step beats).
- Rewrote `hints.js` for per-step hint pools + `CONFIG.HINT_SCALE` per-scene timer stretch;
  the mercy shimmer now fires on the current step's clue object (was a no-op).
- Added `api.dial()` (in-world code wheels), `api.patroller()` (timed movers with
  isNear/isAway/paused), `api.memory` (cross-scene flags via save), `api.setSelfAction()`
  (R-key actions on Dust), and lamp battery drain/recharge (S10/S11).
- New keys: Q/G drop carried item (+ auto-swap on pickup), R self-action.

Scenes (S0 party and S4 yard unchanged, by design)
- S1 Showroom → 6-step chain (camera-window key, badge, breaker, dispenser).
- S2 Office → 9-step (shred-bin fragments, tape mend, hidden key, stamp, chute router).
- S3 Smart Home → 10-step (obey-the-routine closet, metronome/battery swap, birthday dial code).
- S5 Museum → 11-step (guard patrol + alarm dial, ordered HAND→RIBBON→FUSE install, freight lift).
- S6 Care Home → moderate chain (glasses off the nurse cart, two-object photo match; stays gentle).
- S7 Theater → 9-step (snore-timed key, page halves, fly-rope plot, catwalk bulb, board preset).
- S8 Scrapyard → multi-step (E-stop + generator, crane grid, LOTO tag, heap dig, pickup-bell window).
- S9 Repair → 14-step identity heist (grind chip, peel your barcode, ballast, sign fuse, paperwork,
  turnstile no longer knows you → ship yourself out; sets cross-scene `gaveBarcode`).
- S10 Blackout → 8-step resource route (lamp drain + recharge, mailbox keys, kept hex crank, bridge winch).
- S11 Lighthouse → six-chamber master puzzle (~22 gated steps) echoing every earlier scene; the
  igniter cradle is shaped like you; spatial reveal → Ash → speck choice → beam credits.

Fixes
- Scene advance now waits for the solve dialog to finish before transitioning (read buffer).
- `once` narrator lines fire their onDone even when suppressed (no replay soft-lock).
- New Game clears heard lines; dev server sends no-cache headers.
- S1 demo spill sits on the stage surface (was buried inside it).

Tests
- `test/run.js`: solver + dumb + solveAfterDumb bots rewritten per scene (36 checks, all green).
- `test/scenesweep.cjs`, `smoke.cjs`, `replay.cjs`: browser build/boot/replay checks.

## v1 — Initial build
- Full 12-scene narrator-driven puzzle game (engine, narrator queue, hint ladder, saves, 12 scenes).
