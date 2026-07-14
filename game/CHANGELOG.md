# SPOTLESS — Changelog

## v3 — Master Improvement Pass

### Correctness and lifecycle

- Preserved FIFO order for equal-priority narrator lines.
- Added cancellable authored narration sequences.
- Rebuilt the S11 reveal as an ordered, player-paced spatial sequence.
- Fixed interludes continuing gameplay beneath the fade and advancing twice.
- Fixed pointer input remaining disabled after transitions or quitting to title.
- Cleared stale carried items safely between scenes.
- Reset transcript, timing history, checkpoints, and spatial narrator state on
  New Game.
- Fixed material-cache collisions involving metalness and emissive intensity.
- Made checkpoint restoration tolerant of stale step names.

### Input and accessibility

- Added complete touch controls and queued interact-on-arrival movement.
- Added gamepad movement and action controls.
- Hardened keyboard handling against repeats, blur, and stuck movement.
- Wired the subtitle toggle and master volume.
- Expanded Assist across timed scenes.
- Added reduced-motion credit controls and pause/skip support.
- Improved Memory with speaker and scene labels.
- Added optional full-resolution bloom, off by default.

### Puzzles and narrative

- Added strict chain-definition validation and per-step telemetry.
- Expanded action-sensitive nudges and Examine clues.
- Added an optional playable sorting assignment in the scrapyard.
- Added redundant numbered/symbol theater rope markings.
- Added a live scrapyard crane silhouette and clearer industrial feedback.
- Added a porchman callback after Dust proves he can navigate the blackout.
- Gave both final choices distinct but equally warm beam acknowledgments.

### Graphics and audio

- Added shared NPC idle motion and heavy-item carry posture.
- Added selective static contact shadows and framed diorama floors.
- Added smart-home screen scanlines and low-battery chest-screen pulses.
- Added a layered lighthouse beam and complete tower flooring.
- Added distinct procedural room-tone presets for every environment.
- Tightened scene footprints and improved the party exterior, theater,
  scrapyard, blackout road, and lighthouse compositions.

### Testing and tooling

- Removed machine-specific Playwright imports.
- Added narrator/material/chain regression tests.
- Added lifecycle, settings, input, Assist, carry, and finale tests.
- Added navigation and checkpoint audits.
- Added local detailed telemetry and JSON export.
- Added automated render budgets and teardown-memory checks.

## v2 — Puzzle Depth Pass

- Added the chain step machine, dials, patrollers, cross-scene memory,
  self-actions, per-step hints, lamp resource system, and the multi-step scene
  redesigns.
- Added solver, dumb-action, replay, scene-sweep, and browser smoke tests.

## v1 — Initial Build

- Built the complete twelve-scene narrator-driven game, save system, hint
  ladder, procedural 3D world, UI, and ending.
