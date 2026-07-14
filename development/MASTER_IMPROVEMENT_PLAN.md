# SPOTLESS — Current Master Improvement Plan

**Date:** 2026-07-13  
**Status:** Active master plan for the current post-improvement codebase  
**Repository baseline:** `1545d67`  
**Supersedes for future work:** `COMPREHENSIVE_IMPROVEMENT_PLAN.md`  
**Historical design references:** `OPUS_MASTER_PLAN.md`,
`PUZZLE_DEPTH_PLAN.md`, and `COMPREHENSIVE_IMPROVEMENT_PLAN.md`

---

# 1. Executive assessment

The previous comprehensive improvement plan has already been implemented to a
large degree. The current game is not the sparse first-generation build that
the older plans describe.

The repository now includes:

- ACES filmic tone mapping and explicit sRGB output.
- Distinct light, fog, and exposure rigs for all twelve scenes.
- GPU resource disposal between scenes.
- Contact shadows for Dust and human characters.
- Dust idle, turn, reach, and cleaning animation.
- Reusable particles, smoke, sparks, motes, and beam effects.
- Physically mounted signs and denser scene dressing.
- A real Examine overlay.
- Action-sensitive hint infrastructure.
- A Memory transcript panel.
- Subtitle size, reading-speed, opacity, contrast, and reduced-motion options.
- Honest scene selection.
- Total scene-time telemetry.
- Bounded checkpoints in S8, S9, and S11.
- A real spatial-audio path for Ash's reveal.
- Solver, dumb-bot, checkpoint, navigation-reachability, replay, scene-sweep,
  and smoke-test infrastructure.

The next improvement pass should therefore **not rebuild systems that already
exist** or add puzzle steps simply to increase a count.

The current priorities are:

1. Fix verified release-blocking state, sequencing, and menu bugs.
2. Finish wiring settings, Assist mode, touch controls, and test portability.
3. Roll the existing Examine and action-sensitive hint systems into more
   scenes.
4. Improve final-scene pacing without making the ending longer.
5. Complete the remaining visual and audio polish while preserving the
   procedural low-poly identity.
6. Establish cold-playtest and release gates based on measured behavior.

---

# 2. Non-negotiable design pillars

All work in this plan must preserve the following:

- Dust remains a quiet domestic robot discovering agency through observation,
  care, and selective disobedience.
- Ash remains dry, restrained, intimate, and compassionate.
- The game remains about one individual life, not abstract speeches about
  artificial intelligence or robot politics.
- The stated assignment and the meaningful action remain in tension.
- Difficulty comes from discovery, synthesis, and interpretation—not pixel
  hunts, punishment, or arbitrary codes.
- No deaths, combat, destructive failure states, or bad endings.
- Every puzzle remains recoverable.
- One carried item remains the inventory model.
- The controls remain compact and contextual.
- The ending remains warm regardless of whether the final speck is cleaned.
- The low-poly diorama style, matte cream robots, dark linework, and singular
  cyan chest-screen language remain visually central.
- The finale should become better paced and better staged, not bloated with
  filler interactions.

---

# 3. Completed work that must not be repeated

The following older recommendations are verified complete and should be
treated as foundations:

- Per-scene lighting rigs in `js/config.js`.
- ACES tone mapping and sRGB output in `js/engine/renderer.js`.
- Exposure easing.
- Cache-aware scene disposal.
- Contact shadows under Dust and human characters.
- Dust's smooth turning, idle movement, arm reach, and cleaning lean.
- Reduced-motion support for Dust and several scene animations.
- `js/engine/fx.js` particle and atmosphere helpers.
- Camera push and impulse methods.
- Mounted and posted signage helpers.
- Distinct museum exhibit silhouettes.
- Dressed party, office, smart-home, museum, care-home, theater, scrapyard,
  repair-shop, blackout-road, and lighthouse scenes.
- Real scene select.
- Memory transcript storage and pause-menu access.
- Subtitle size, speed, background, and contrast settings.
- Hint suffix variety; the old ninety-three identical endings are gone.
- Raw `(R)` notation removal from narrator text.
- S1 duplicate narration correction.
- Whole-scene solve-time telemetry.
- S8, S9, and S11 checkpoint infrastructure.
- Navigation-reachability audit.
- S0 doorway and mess-placement fixes.
- Real HRTF panner creation for the S11 spatial reveal.

These systems may receive bug fixes or wider adoption, but should not be
redesigned from zero.

---

# 4. Phase 0 — Release-blocking correctness and lifecycle fixes

This phase comes before new content or visual polish.

## 4.1 Fix narrator queue ordering

### Current defect

`Narrator.say()` places STORY lines at the front of the queue with
`unshift()`, then sorts by priority. Equal-priority STORY lines therefore play
in reverse call order.

A direct probe currently produces:

```text
say(a), say(b), say(c) -> queue c,b,a
```

This affects ordinary scene setup and severely damages the finale:

- S11 queues `s11_intro` and then `s11_plaque`; the plaque can play first.
- The ignition sequence queues the optional barcode beat, cradle beat,
  revelation, `s11_a1`, `s11_a2`, and `s11_a3`.
- `s11_a3` can play before the actual revelation.
- Its `onDone` can offer the final speck while earlier revelation lines remain
  queued.

### Required change

- Add a monotonically increasing queue sequence number.
- Sort by priority descending and sequence ascending.
- STORY lines should jump ahead of lower-priority categories without reversing
  other STORY lines.
- Add an explicit `saySequence()` helper or callback chain for tightly authored
  sequences such as S11.
- Do not rely on multiple same-frame `say()` calls for ordered cinematics.

### Acceptance tests

- Three equal-priority STORY lines play A, B, C.
- S11 begins with intro, then plaque.
- S11 ignition order is:
  1. Optional barcode beat.
  2. Cradle beat.
  3. Reveal.
  4. Ash introduction.
  5. Ash's remainder line.
  6. Ash's lighthouse line.
  7. Speck choice.
- The speck cannot spawn until all intended pre-choice lines complete.

## 4.2 Replace the interlude transition with a guarded state

### Current defects

- Interludes never set `Game.mode = 'interlude'`.
- The game therefore continues updating movement, hints, reactions, scene
  scripts, and interactions beneath the black screen.
- Input remains enabled.
- The transition callback can run twice: once through narrator `onDone`, and
  again through the nine-second safety timeout.
- `_interludeGuard` is assigned but does not guard anything.

### Required change

- Enter a real `interlude` mode.
- Disable player input and world interaction.
- Stop hints and idle reactions.
- Use one idempotent `finishInterlude()` callback.
- Clear the safety timeout when narration finishes normally.
- Restore input only after the next scene is loaded.

### Acceptance tests

- Dust cannot move while an interlude is active.
- No hint, idle bark, or scene interaction fires beneath the fade.
- The next scene loads exactly once.
- A missing or suppressed interlude line still advances safely.

## 4.3 Fix Pause → Quit to Title → Start input lock

### Current defect

Pausing disables `input.enabled`. Quitting to title does not re-enable it, and
starting or continuing does not force it back on.

The guaranteed reproduction is:

1. Pause.
2. Quit to Title.
3. Begin or Continue.
4. Dust cannot move.

### Required change

- Centralize mode transitions.
- `_begin()` must always restore the expected play input state.
- `_quitToTitle()` must explicitly normalize input, prompts, examine state,
  carry state, and narrator state.

### Acceptance test

Automate the exact reproduction above in a real-browser test.

## 4.4 Clear carried items safely between scenes

### Current defect

`loadScene()` does not clear `world.carry`.

S10 completes while Dust still carries the crank. The crank can therefore
remain attached to Dust in S11 with an entity and original parent belonging to
the disposed S10 scene.

This creates:

- A stale carried entity.
- A visual continuity error.
- A detached/disposed-parent reference.
- A resource leak because a carried mesh is no longer under the scene group
  being disposed.
- Confusing auto-drop behavior when the player picks up S11's first item.

### Required change

- Add `World.clearCarry({ dispose })`.
- Call it before disposing the outgoing scene.
- Scene-to-scene carry is forbidden unless explicitly declared through a
  future transition payload.
- Reset carry prompts and telemetry.

### Acceptance tests

- S10 → S11 begins with empty hands.
- Scene select never inherits a previous scene's item.
- Quit to title with an item, then Continue, begins with empty hands.

## 4.5 Complete scene and New Game state normalization

### Current defects

New Game resets progress flags and heard lines but does not reset:

- `state.memoryLog`
- `narrator.log`
- `state.solveTimes`

S11 sets `narrator.mode = 'spatial'`, but scene loading and New Game never
restore narrator mode to normal.

After finishing or replaying the finale, future narration can retain spatial
subtitle styling and spatial playback intent.

### Required change

Create explicit state-normalization methods:

- `resetRunState()`
- `resetSceneState()`
- `resetNarratorMode()`
- `resetInputState()`

New Game must clear:

- Scene completion.
- Cross-scene flags.
- Heard-once lines.
- Transcript.
- Solve-time history.
- Checkpoint.
- Spatial narrator mode.
- Any stale carry.

Scene load must reset narrator mode unless the incoming scene explicitly
changes it.

### Acceptance tests

- New Game after credits has an empty Memory panel.
- Old solve times do not survive New Game.
- S0 subtitles use normal narrator styling after completing S11.

## 4.6 Fix quit-to-title disposal

`_quitToTitle()` removes the scene group without using the cache-aware disposal
path used by `loadScene()`.

Required:

- Route all scene teardown through one method.
- Clear carry before teardown.
- Dispose the scene group.
- Clear interactions and navigation.
- Clear spatial audio.

## 4.7 Correct material-cache identity

### Current defect

`P.mat()` caches materials using color, roughness, emissive color, and a
partially resolved flat-shading flag.

The key omits:

- Metalness.
- Emissive intensity.

Calls requesting the same color with different metalness or emissive intensity
can therefore receive the wrong cached material.

### Required change

Build the key from all resolved material properties:

- Color.
- Roughness.
- Metalness.
- Emissive color.
- Emissive intensity.
- Flat shading.
- Any future transparency or side mode accepted by the helper.

Add development assertions against mutating cached shared materials directly.
Animated materials should be cloned or created as explicitly unique.

### Acceptance tests

- Same color and roughness with different metalness returns distinct materials.
- Same emissive color with different emissive intensity returns distinct
  materials.
- Identical fully resolved options still share one material.

## 4.8 Add regression tests for Phase 0

Add focused tests for:

- STORY FIFO order.
- S11 complete dialogue sequence.
- Interlude single advancement.
- Interlude input lock.
- Pause → Quit → Begin input recovery.
- Carry cleanup across S10 → S11.
- New Game transcript and solve-time reset.
- Narrator spatial-mode reset.
- Material cache-key correctness.
- Scene-group disposal through both transitions and quit-to-title.

---

# 5. Phase 1 — Settings, input, platform, and accessibility completion

## 5.1 Make the subtitle toggle real

### Current defect

The Settings menu exposes Subtitles On/Off, but `UI.showSub()` does not consult
the setting. The toggle currently has no effect.

### Required change

- Route subtitle-enabled state into UI.
- Continue timing narration even when subtitles are hidden.
- Keep the Memory transcript recording regardless of visibility.
- If no VO file exists, warn before allowing subtitles to be disabled, or
  provide a "subtitles recommended: voice pack incomplete" message.

## 5.2 Add and wire master volume

`settings.master` and `Audio.setMaster()` exist, but:

- Boot does not apply saved master volume.
- Settings provides no volume control.
- Existing room-tone and spatial gain nodes are not updated when master volume
  changes.

Required:

- Add a master-volume slider or segmented levels.
- Apply it during boot.
- Update active VO, room tone, SFX gain, and spatial gain.
- Persist the value.

## 5.3 Make Assist mode meaningful everywhere

### Current state

Assist is exposed globally but is concretely used only for the S5 guard check.
`assistWindow()` exists but has no call sites.

### Required coverage

- S1: lengthen the camera-away/dim phase or slow the cycle.
- S5: retain the wider guard-safe condition.
- S7: lengthen the snore window.
- S8: optionally slow the crane interface and increase shipment window.
- S10: increase lamp duration or reduce dark movement penalty.
- S11: increase any timing-sensitive window without changing answers.

Assist should never alter story meaning, puzzle answers, or rewards.

## 5.4 Deliver actual touch controls or change the platform claim

### Current mismatch

Pointer movement and hold-to-clean exist, but touch players have no direct
controls for:

- Drop.
- Self-action.
- Lamp.
- Pause.

The game therefore cannot currently complete S9–S11 on a touch-only device,
despite documentation claiming tablet and phone playability.

### Required change

Add context-sensitive touch buttons:

- Interact/Clean.
- Drop when carrying.
- Self-action when available.
- Lamp when known.
- Pause.

Buttons should only appear when relevant and respect safe-area insets.

If this work is intentionally deferred, update the README and store claims to
desktop-only.

## 5.5 Correct click-to-move interaction behavior

A quick pointer tap currently sets a movement target and an interaction tap at
the same time. The interaction is consumed immediately, before Dust reaches
the destination.

Required:

- Raycast or otherwise identify a clicked interactable.
- Queue an interaction target.
- Walk into reach.
- Interact once on arrival.
- Cancel cleanly if movement is interrupted or the entity becomes unavailable.

## 5.6 Harden keyboard input

- Use `event.code` for movement and action bindings where appropriate.
- Ignore repeated keydown events for toggle actions such as Lamp and
  Self-action.
- Clear held keys and pointer state on window blur or visibility loss.
- Prevent stuck movement after alt-tab.
- Add gamepad support if desktop-controller play remains a target.
- Add basic remapping only after the control paths are centralized.

## 5.7 Complete reduced-motion behavior

Reduced motion currently affects Dust and several scene animations, but the
credit roll is a JavaScript-driven animation and continues regardless.

Required:

- Reduced-motion credits should use manual pages or a much slower static
  presentation.
- Add Pause/Continue and Skip controls.
- Reduce camera impulses and repetitive pulse effects.
- Avoid random per-frame flicker in reduced-motion mode.

## 5.8 Improve Memory and settings clarity

- Display the actual speaker name in Memory.
- Preserve scene title with each transcript entry.
- Use distinct styling for Ash, named people, PA systems, and machine voices.
- Rename `patient` to a clear player-facing label such as
  **Patient Narrator — fewer explicit hints**.
- Add short descriptions for Normal, Patient, and Off.

---

# 6. Phase 2 — Narrative and puzzle-system adoption pass

The engine work for this phase largely exists. The goal is consistent use, not
new infrastructure.

## 6.1 Roll out action-sensitive nudges

`wrongTry()` is implemented but used only in S3.

Add targeted nudges where repeated actions reveal a specific misunderstanding:

- S1: repeatedly taking the key while watched.
- S5: repeatedly approaching the case while the guard is near.
- S5: repeated wrong installation order.
- S7: repeated wrong ropes.
- S7: repeated key attempts outside the snore.
- S8: repeated empty crane drops.
- S8: trying the gate before lockout.
- S9: repeated Bay 2 attempts with the same missing requirement.
- S10: repeated bare-handed cutoff or winch attempts.
- S11: repeated wrong breaker pattern, wrong prism, or missing boathook.

Each nudge should respond to the observed misunderstanding rather than repeat
the timer hint.

## 6.2 Expand Examine where observation is the intended skill

The Examine overlay is currently concentrated in S2 and S6.

Add it selectively:

- S1: inspect the camera sweep indicator or employee display.
- S3: inspect the six-year-old calendar and routine schedule.
- S5: inspect catalog discrepancies, wear marks, and the service diagram.
- S7: inspect fly-rail tags and cue sheet.
- S8: inspect the LOTO procedure and core-status contradiction.
- S9: inspect the sync poster, bay checklist, and service-card notch.
- S11: inspect the keeper's letter, breaker sconces, prism damage, and cradle
  contact diagram.

Examine should add understanding, not duplicate a sign word-for-word.

## 6.3 Add chain-definition validation

The current chain helper silently returns false for unknown step names.

Required development-time checks:

- Duplicate step names.
- Unknown prerequisites.
- Cycles.
- Unknown advance names.
- Requested restore milestones that cannot be applied.
- Hint-pool names that do not match any step.

Production behavior can remain safe, but development should surface mistakes
immediately.

## 6.4 Record meaningful telemetry

Current telemetry records total time and a few counters, but:

- `wrong` only increments through `wrongTry()`, currently making most scene
  values meaningless.
- Per-step time history is not stored.
- Auto-drops are not counted.

Required:

- Record entry and completion time for every chain step.
- Record wrong action by kind and entity.
- Record hint tier per step.
- Record automatic and manual drops separately.
- Record checkpoint reloads.
- Add local JSON export from the playtest panel.

No telemetry should leave the machine automatically.

## 6.5 Pace the lighthouse revelation through player-controlled beats

After queue ordering is corrected, avoid replacing the current reversed
monologue with one uninterrupted correctly ordered monologue.

Recommended staging:

1. Ignition and cradle beat.
2. Player walks through the newly opened lamp-room door.
3. Ash turns toward Dust.
4. Reveal line.
5. Player approaches Ash or looks at the lens.
6. Ash names himself.
7. Player is allowed to move to the window or table.
8. Remainder and lighthouse lines.
9. Speck appears.

The lines should remain short. The improvement is spatial pacing, not more
exposition.

## 6.6 Give the final choice a subtle acknowledgment

Both outcomes remain equally warm, but the choice should be remembered:

- Cleaning could leave a slightly warmer, narrower beam or a clean tabletop in
  the final shot.
- Walking away could leave the speck visible in the beam and shift Ash and
  Dust toward the water.
- `s11_beam` may receive one branch-specific final clause.

Do not create a good/bad ending split.

## 6.7 Use false-task completion selectively

The fake-task system now appears in five scenes. Do not force it into every
location.

Good candidates:

- S2: shred a small set of meaningless office papers.
- S3: complete one harmless routine cycle.
- S8: perform a brief sorting loop that visibly feeds the wrong system.

Avoid adding busywork to S6, S10, or S11.

## 6.8 Do not add finale steps merely to match an old number

The lighthouse currently has roughly twenty-one gated steps across six
chambers. The older target of approximately thirty-five was a planning proxy,
not a quality requirement.

Add a step only if it:

- Introduces a meaningful cross-scene synthesis.
- Improves spatial use of the tower.
- Creates an emotional or mechanical payoff.
- Does not repeat another carry/place action.

Cold-playtest duration and insight quality override step count.

---

# 7. Phase 3 — Visual, animation, and audio polish

## 7.1 Conduct a room-footprint pass

The scenes are more dressed than before, but several interior floors remain
larger than their meaningful content.

Priority scenes:

- S2 Office.
- S3 Smart Home.
- S7 Theater.
- S8 Scrapyard.
- S9 Repair Shop.
- S10 Blackout Road.

Options:

- Shrink floor and navigation bounds.
- Add architectural subdivisions.
- Add secondary flooring, aisles, rugs, work zones, and light pools.
- Move non-critical background geometry to frame the active space.

Empty space should communicate loneliness, ritual, danger, or distance—not
unfinished dressing.

## 7.2 Add restrained optional bloom

Bloom is the largest remaining global visual upgrade, but it must preserve the
matte low-poly style.

Targets:

- Dust and Ash chest screens.
- Showroom stage.
- Theater footlights and spotlight.
- Museum exhibit lights.
- Repair checklist lamps.
- Blackout warning lights.
- Lighthouse lens and beam.

Requirements:

- High threshold.
- Low strength.
- Resolution scaling.
- Graphics setting or automatic low-power fallback.
- Re-tune emissive intensity after bloom is active.
- Measure on the current highest-draw scenes.

Current initial-view measurements:

| Scene | Draw calls | Triangles |
|---|---:|---:|
| S0 Party | 298 | 15,486 |
| S5 Museum | 260 | 3,682 |
| S3 Smart Home | 167 | 2,482 |
| S8 Scrapyard | 157 | 3,372 |
| S9 Repair | 155 | 1,642 |
| Most others | 79–121 | 1,284–3,824 |

Bloom should be validated first in S1 and S7, then tested against S0 and S5.

## 7.3 Add lightweight NPC life

Standing humans still read largely as furniture.

Build one reusable helper for:

- Gentle posture sway.
- Head turn toward Dust.
- Reaction lean when addressed.
- Small idle hand movement.
- Cart or seated-body bob where appropriate.

Apply with scene-specific phase offsets. Respect reduced motion.

## 7.4 Add contact shadows to selected static props

Do not automatically shadow every object.

Add opt-in contact shadows to:

- Couches and tables.
- Large bins.
- Barrels.
- Carts.
- Vacuum.
- Large machinery.
- Lighthouse pedestal.

Use them where floating is visible at the fixed camera angle.

## 7.5 Add carry-weight variation

Tag items with lightweight metadata:

- `carryWeight: 'light'`
- `carryWeight: 'normal'`
- `carryWeight: 'heavy'`

Heavy objects should:

- Sit lower in Dust's hands.
- Reduce arm-lift speed.
- Add a slight chassis lean.
- Optionally reduce movement by a small amount.

Do not create stamina or punishment.

## 7.6 Finish the lighthouse beam

Improve the current additive cone with:

- A narrow bright core.
- A wider faint atmospheric cone.
- Motes that brighten inside the beam.
- A slow sweep that reveals tower architecture and the town.
- A deliberate final camera composition.

## 7.7 Expand audio beyond one noise-bed preset

Current room tones collapse mostly to party noise, generic filtered noise, or
silence.

Add procedural or authored presets for:

- Fluorescent office hum.
- Smart-home appliance bed.
- Wind and leaves.
- Museum ventilation and distant guard mechanics.
- Care-home hallway ambience.
- Theater room tone and stage creaks.
- Scrapyard belt, diesel, and metal ticks.
- Repair-shop charger and transformer hum.
- Blackout wind, distant harbor, and electrical arcing.
- Lighthouse ocean and rotating machinery.

Replace the most noticeable oscillator SFX with a small cohesive sound set.

## 7.8 Decide and execute the VO strategy

No VO files currently ship.

Choose one:

1. Subtitle-first release with no VO claims.
2. Full Ash narration plus limited external voices.
3. Complete voice pack.

Do not ship a partially voiced story without clear expectations.

If VO is produced:

- Lock text first.
- Verify every script ID.
- Test missing-file fallback.
- Hand-tune S0's party fade and S11's spatial transition.

---

# 8. Phase 4 — Scene-specific remaining work

## S0 — Party

- Preserve the current behavior-triggered road invitation.
- Add touch-friendly tutorial prompts without pointing directly at the exit.
- Add idle life to guests.
- Ensure chatter cannot bury `s0_name`, `s0_wistful`, or the exit beat.
- Measure whether the road is found naturally before the fallback timers.
- Consider a background house or road silhouette if the exterior still feels
  visually empty.

## S1 — Showroom

- Apply Assist to the dim/camera window.
- Add wrong-attempt nudges for repeated watched key grabs.
- Use as the first bloom pilot.
- Test click-to-interact arrival on the key, display, and breaker.

## S2 — Office

- Add a short optional false-task shred loop.
- Preserve the Examine treatment of the letter.
- Consider shrinking or zoning the oversized floor.
- Add action telemetry for wrong fragment and unstamped mail attempts.

## S3 — Smart Home

- Keep its one existing `wrongTry()` implementation as the reference.
- Add Examine to the calendar and routine schedule.
- Ensure the routine's state is readable without relying entirely on signs.
- Add a low-power screen treatment.

## S4 — Yard

- Preserve the scene's current stillness and bark suppression.
- Do not add puzzle complexity.
- Verify reduced motion still communicates the wind calming through sound and
  lighting.

## S5 — Museum

- Add Examine for catalog disagreement, service diagram, and wear marks.
- Add action-sensitive nudges for guard timing and wrong install order.
- Consider one checkpoint only if cold tests show excessive repeat burden.
- Validate dim lighting after bloom.

## S6 — Care Home

- Preserve its short, observational structure.
- Improve transcript speaker labeling for the old man's lines.
- Add subtle idle animation to the old man and nurse cart.
- Do not add busywork.

## S7 — Theater

- Apply Assist to the snore window.
- Add action-sensitive rope and snore nudges.
- Add non-color rope identifiers.
- Use as the second bloom pilot.
- Stage the final spotlight solve with a camera push after dialogue ordering is
  fixed.

## S8 — Scrapyard

- Add wrong-attempt nudges for crane misses and lockout-order confusion.
- Improve telemetry around the long safety chain.
- Add one stronger crane or welding hero silhouette.
- Consider a brief false sorting loop only if it reinforces the moral
  contradiction.
- Validate checkpoint restoration with a real browser, not only headless state.

## S9 — Repair Shop

- Add Examine to the sync poster, port card, and Bay 2 checklist.
- Convert repeated Bay 2 failures into requirement-specific wrong-attempt
  telemetry.
- Preserve the live checklist.
- Add heavy-carry animation for ballast and vacuum.
- Real-browser test the post-sync checkpoint and technician sequence.

## S10 — Blackout

- Add touch controls for Lamp and Drop before claiming mobile support.
- Apply Assist to battery duration and dark movement penalty.
- Add a porchman callback after the line is made safe.
- Clear the crank at the scene transition.
- Preserve darkness by using high-threshold bloom.

## S11 — Lighthouse

- Correct narration order first.
- Reset spatial mode after leaving the scene.
- Pace the revelation through player movement.
- Add Examine to keeper artifacts and mechanical clues.
- Add wrong-attempt nudges.
- Improve the beam.
- Give the final choice a subtle branch acknowledgment.
- Do not add filler steps to chase the old thirty-five-step estimate.

---

# 9. Phase 5 — Test infrastructure, playtesting, and documentation

## 9.1 Make browser tests repository-local

Current browser tests import Playwright from an absolute path inside the
sibling Fish-Friends repository.

Required:

- Add `playwright-core` as a development dependency or document a supported
  local browser driver.
- Remove absolute machine-specific imports.
- Detect installed Chrome or use a configured environment variable.
- Make the tests runnable in a clean checkout.

## 9.2 Add complete npm scripts

Add scripts for:

- `test`
- `test:checkpoints`
- `test:nav`
- `test:replay`
- `test:scenes`
- `test:smoke`
- `test:all`

`test:all` should execute every non-interactive regression check.

## 9.3 Add UI and state integration tests

The current solver suite is excellent for scene logic but does not cover many
Game/UI lifecycle defects.

Add browser tests for:

- Settings toggles.
- Pause and title transitions.
- Input restoration.
- Touch controls.
- Scene select.
- Transcript persistence and New Game reset.
- S10 → S11 carry cleanup.
- S11 dialogue order.
- Interludes.
- Reduced-motion credits.

## 9.4 Cold-playtest protocol

For each scene, record:

- Total solve time.
- Time per step.
- Wrong-action type and count.
- Hint tier used.
- Examine use.
- Drop and recovery count.
- Checkpoint reload count.
- Where the player verbally states an incorrect mental model.

Ship targets:

- No player hard-stuck beyond 1.5 times the target duration with Normal hints.
- No mandatory step solved primarily by brute force.
- Every scene produces at least one clear insight or emotional reaction.
- S6 remains shorter and gentler than its neighbors.
- S11 feels cumulative rather than exhausting.

## 9.5 Update documentation

The README and changelog are stale.

Required:

- Point README to this master plan as the current implementation roadmap.
- Correct the lighthouse step-count description.
- Document Examine, Memory, Assist, accessibility settings, checkpoints, and
  scene select.
- State the actual supported platforms.
- Document all test commands.
- Add changelog entries for Phases 1–5, completion passes, navigation fixes,
  and future releases.

---

# 10. Milestone order

## Milestone A — Stability

- Narrator FIFO and sequence support.
- S11 sequence test.
- Interlude state and single transition.
- Pause/title input recovery.
- Carry cleanup.
- New Game and spatial-state reset.
- Material-cache correction.
- Local browser-test setup.

## Milestone B — Input and settings

- Functional subtitle toggle.
- Master volume.
- Assist coverage.
- Touch controls.
- Click-to-interact arrival.
- Keyboard blur and repeat handling.
- Reduced-motion credits.

## Milestone C — Content-system rollout

- `wrongTry()` coverage.
- Examine coverage.
- Chain validation.
- Per-step telemetry.
- S11 player-paced reveal.
- Final-choice acknowledgment.

## Milestone D — Presentation polish

- Room-footprint pass.
- Bloom pilot and rollout.
- NPC idle life.
- Selective static contact shadows.
- Carry-weight animation.
- Lighthouse beam.
- Scene-specific audio beds.

## Milestone E — Release candidate

- Full cold-playtest pass.
- Performance pass.
- Complete documentation.
- VO decision executed.
- All regression and browser tests green.

---

# 11. Ship gates

The next major release is not complete until:

- STORY lines preserve authored order.
- S11 revelation order is covered by an automated test.
- Interludes load the next scene exactly once.
- Pause → Quit → Begin always restores input.
- No item survives a scene transition unintentionally.
- New Game clears transcript, timing history, checkpoint, and spatial state.
- Subtitle and volume settings work.
- Assist changes every timing-sensitive puzzle it claims to support.
- Touch-only play can complete S9, S10, and S11, or mobile support claims are
  removed.
- Browser tests run from a clean Spotless checkout.
- No material-cache collision can change metalness or emissive intensity.
- Long scenes expose meaningful per-step telemetry.
- The final revelation is player-paced.
- The final choice is acknowledged without becoming a moral branch.
- Reduced motion covers credits and camera/effect pulses.
- S0 and S5 remain within measured render budgets after bloom.
- GPU memory does not increase monotonically through a full run and replay.
- README and changelog describe the actual game.

---

# 12. Estimated remaining scope

Assuming one developer and preservation of the current procedural art
approach:

- **Phase 0 correctness and tests:** 1–2 weeks.
- **Input, settings, Assist, and touch completion:** 1–2 weeks.
- **Narrative and puzzle adoption pass:** 1–2 weeks.
- **Visual and audio polish:** 2–4 weeks.
- **Cold playtesting and release documentation:** 1–2 weeks.

Expected total: **6–12 focused weeks**, depending primarily on touch support,
bloom compatibility work, audio production, and the number of cold-playtest
iterations.

The immediate first task should be narrator ordering plus the S11 sequence
test. It is the highest-severity defect because it currently corrupts the
game's central reveal.
