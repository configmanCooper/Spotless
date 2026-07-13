# SPOTLESS — Comprehensive Improvement Plan

## Overall verdict

*Spotless* has an excellent thematic and narrative foundation, but its
presentation is still much closer to a strong prototype than a finished
atmospheric game. The best path is **not more puzzle steps**. It is better
puzzle variety, clearer physical storytelling, denser and more distinctive
environments, stronger animation and lighting, and a more disciplined
dialogue and hint pass.

This analysis covers the actual game in `Spotless\game`, including all 12
scenes, the narrator script, puzzle framework, UI, renderer, save system,
tests, development plans, and rendered screenshots of every scene.

## What must remain unchanged

These elements are the game's identity and should be treated as
non-negotiable:

- Dust remains a quiet domestic robot whose personhood emerges through
  disobedience, observation, and care.
- Ash remains restrained, dry, compassionate, and increasingly personal—not
  a loud comedy narrator.
- Every location presents an assigned purpose that is incomplete, harmful,
  absurd, or spiritually empty.
- No combat, deaths, harsh failure states, timers that end the game, or
  punitive endings.
- No traditional inventory grid or sprawling control scheme.
- The final speck remains a choice with no morally wrong answer.
- Preserve the warm low-poly diorama style, matte cream Dust, and the
  "one cyan" visual rule.
- Preserve the strongest existing lines, especially `s0_pity`, `s2_solve`,
  `s5_wake`, `s6_solve`, `s7_solve`, `s9_step_sync`, `s10_light`, and Ash's
  final lighthouse dialogue.

# Central diagnosis

## Dialogue

The prose is genuinely good, but distribution and repetition weaken it.

- `narrator_script.json` contains **499 keyed lines**: 307 hints, 90 story
  lines, 64 reactions, 36 external voices, and 2 idle lines.
- The phrase **"But what do I know." appears 93 times**. As a recurring Ash
  tic it works; as the universal final hint suffix it becomes mechanical and
  is heard most often when the player is already frustrated.
- Nearly every hint follows the same rhythm: poetic observation, object
  location, literal instruction. The system is sound, but the writing becomes
  templated.
- The fake-task completion lines `fake_done_1..6` are among the best writing
  in the game, yet the full mechanic is meaningfully used in only a few
  scenes.
- Raw `(R)` notation appears inside otherwise diegetic narration in S9 and
  S11.
- Several excellent lines are easy to miss, and there is no transcript or
  subtitle history.
- S11 stacks several unskippable story lines together immediately before the
  reveal, creating the game's only major exposition wall.
- The intended spatial-audio reveal is not actually complete:
  `main.js` supplies `setSpatialSource: (p) => {}`, so the crucial "voice of
  God becomes a physical robot in the room" moment is largely a subtitle-style
  change rather than the promised acoustic reveal.

## Puzzle mechanics

The system architecture is strong; the interaction variety is not.

- `kit.js` provides a clean chain system, step-specific hint pools, dials,
  patrollers, self-actions, and shimmer clues.
- The solver, dumb-bot, and solve-after-dumb tests are unusually strong and
  establish recoverability as a real contract.
- However, most of the game reduces to three repeated shapes: walk and tap,
  carry A to B, and read a plaque then set a dial.
- Longer late-game scenes create depth primarily by adding dependencies and
  errands. S9 and S11 are structurally complex, but they still use essentially
  the same input grammar as S1.
- Repeated labels and plaques often tell the answer instead of letting room
  layout, animation, sound, material, or object behavior communicate it.
- S0 and S4 are thematically excellent but have the weakest onboarding and
  hint affordances.
- The "Patient" hint mode matches the design document—fewer explicit hints—but
  its label is ambiguous. It should be renamed or explained, not treated as a
  code bug.
- Save data checkpoints only at scene boundaries. Losing progress during S9
  or the long lighthouse finale would be unacceptable after the puzzle-depth
  expansion.
- `Hints.setPool()` resets `clock`, while `stats()` reports that clock as
  `solveTime`; current playtest telemetry therefore records mostly the final
  step's stuck time, not total scene duration. That undermines the stated
  playtest protocol.
- The post-completion Scene Select button is unfinished: `_sceneSelect()`
  simply starts a new game.

## Graphics and presentation

The rendered screenshots expose the largest quality gap.

- The low-poly prop kit is coherent and readable, and Dust's cyan chest screen
  gives excellent player-character hierarchy.
- S1 and S7 are visually strongest because they use bespoke spotlights tied
  directly to their mechanics.
- Most other scenes use the same hemisphere, key, and fill rig with only fog
  and ground colors changed. An office, museum, yard, care home, scrapyard,
  and repair shop therefore share nearly identical shading language.
- Rooms are substantially oversized for their contents. Large empty floors
  make puzzle objects look like debug props placed in arenas rather than
  belongings in lived-in spaces.
- Many signs float above boxes and read as developer labels. Environmental
  clues are too often text placards rather than integrated objects.
- Objects lack contact shadows and frequently appear to float.
- Dust only has a tiny movement bob and instant snap-turn. NPCs translate
  without expressive animation.
- Effects are nearly absent: no dust motes, convincing sparks, smoke, wind
  motion, practical-light flicker, cleaning particles, or substantial
  lighthouse beam.
- S10 is conceptually one of the strongest scenes but visually consists
  largely of near-black boxes. Darkness needs silhouettes and landmarks, not
  merely reduced visibility.
- The lighthouse's emotional payoff object is under-designed relative to its
  importance.
- Scene resources are removed but not explicitly disposed, creating a likely
  GPU-memory growth problem across a full playthrough or repeated scene loads.

# Comprehensive improvement plan

## 1. Rebuild the dialogue system around variety, memory, and silence

### Preserve and classify existing lines

Create a narrative-content audit with four labels:

1. **Locked:** lines that should remain nearly verbatim.
2. **Rewrite:** strong idea, weak or repetitive wording.
3. **Conditional:** only play after a relevant player behavior.
4. **Cut or merge:** duplicate, redundant, or over-explanatory.

Immediately merge or diversify the duplicate
`s1_step1`/`s1_step_breaker` text.

### Replace the universal hint template

Keep three tiers, but give them explicit functions:

- **Tier 1 — Observation:** identify a contradiction or unusual behavior
  without naming the solution.
- **Tier 2 — Relationship:** connect two already-visible facts.
- **Tier 3 — Action:** state the next physical action plainly while remaining
  in Ash's voice.

Replace the 93 identical suffixes with 8–12 restrained variants and sometimes
no suffix at all. The variants should differ by scene mood: dry in the
showroom, gentle in the care home, sparse in the blackout, and nearly absent
in the lighthouse.

Add action-sensitive hints before timer hints. Repeatedly using the wrong rope,
wrong dial, wrong bay, or wrong item should generate a specific nudge. The
player should not wait eight minutes for help when the game already knows
exactly what misunderstanding they have.

### Keep key labels out of Ash's prose

Ash should say "the barcode on your own chassis" or "the cradle was made for
him." The UI can display the contextual `R` badge separately. Spoken narration
should remain diegetic.

### Expand external voices without making the game noisier

The 36 external-voice lines are spread thinly across many speakers. Give
important locations a distinct linguistic fingerprint:

- Showroom PA: polished euphemisms and customer-service cadence.
- Smart-home OS: rigid reassurance that becomes subtly unstable.
- Curator: clinical catalog language.
- Care-home nurse: hurried kindness rather than villainy.
- Theater director: theatrical specificity rather than generic shouting.
- Scrapyard PA: industrial safety language contradicting production quotas.
- Repair technician: banal, procedural familiarity with erasure.

Avoid increasing total chatter dramatically. Fewer, more character-specific
lines will work better than larger repetitive pools.

### Build a transcript and memory panel

Add a pause-menu **Memory** screen containing the last 10–20 STORY and
important VOICE lines. It should preserve speaker, scene, and order while
excluding routine hints unless requested.

This is both an accessibility feature and a thematic fit: Dust preserving
words is especially meaningful in a story about memory erasure.

Add subtitle size, reading speed, background opacity, and high-contrast
settings. Allow credits to pause or advance manually.

### Use silence intentionally

- Suppress S4's neighbor bark once the player begins sustained stillness.
- Reduce Ash's chatter in the second half of S11.
- Break the final monologue into player-controlled spatial beats: Ash turns,
  Dust approaches, the lens rotates, the player looks at the sea, then the
  next line arrives.
- Do not fill every puzzle advancement with prose. Some solved mechanisms
  should be allowed to sound and move without explanation.

### Make assigned work playable more consistently

Where appropriate, give the false assignment a short tactile loop before the
player rejects it:

- S2: shred several mundane corporate pages that produce increasingly hollow
  responses.
- S3: perform one or two harmless routine tasks before realizing the routine
  is endless.
- S5: preserve the exhibit-dusting loop.
- S7: preserve sweeping but make it visibly undoable.
- S8: allow a brief sorting loop that clearly feeds the harmful system.
- S9: permit docking preparations that expose the bay's requirements and
  horror.

Do not force busywork into S6, S10, or S11 when quiet observation is
thematically stronger.

## 2. Improve puzzle depth through new reasoning, not longer errands

### Keep the same controls while broadening interaction meaning

Do not add a conventional inventory or multiple action buttons. Instead,
extend the existing contextual Interact action with a first-class
**Examine/Observe** state:

- Camera pushes closer to an object.
- Dust pauses and turns toward it.
- The player can rotate or inspect a letter, photo, diagram, machine readout,
  damaged part, or reflection.
- The same Interact button exits.

This creates investigative play without breaking the one-verb theme.

### Establish five puzzle families and deliberately rotate them

1. **Causal systems:** trace power, belts, air, light, or sound to a source.
2. **Spatial reasoning:** move or align physical objects in a room, not only
   cycle dials.
3. **Observation and comparison:** identify handwriting, wear, rhythm,
   posture, reflection, or material differences.
4. **Social interpretation:** decide who an instruction is serving and who is
   being ignored.
5. **Self-knowledge:** use Dust's own body, light, barcode, screen, weight, or
   position as part of the mechanism.

No two consecutive scenes should lean primarily on the same family.

### Reduce plaque-answer puzzles

A written clue may confirm an answer, but it should not usually be the entire
answer. Replace some labels with behavior:

- The correct museum hand case shows worn maintenance scratches.
- The correct care-home photo shares recognizable physical props with the
  suitcase.
- The theater rope moves or hums in response to the raised batten.
- The repair bay displays a live visual checklist instead of requiring the
  player to remember six conditions.
- The lighthouse breaker solution is demonstrated by actual light behavior,
  not only text.

### Improve state feedback

Every multi-requirement mechanism should visibly preserve progress:

- Bay 2: ID, weight, power, and paperwork lights.
- Museum robot: empty sockets visibly fill and animate.
- Scrapyard safety chain: generator, E-stop, lockout, and gate indicators.
- Lighthouse: a persistent brass diagram illuminates FIRE, GLASS, and TURN as
  each system is restored.

Use Dust's chest screen as a restrained recall aid. It can show symbols or a
progress pattern, but should not become a quest log that states solutions.

### Fix timing accessibility

Add an Assist setting that widens camera, guard, and snore windows without
changing puzzle logic. Give timing cues visual and auditory redundancy. Never
rely on hue alone.

### Add bounded checkpoints

Do not attempt arbitrary serialization of every closure immediately. Add
authored milestone checkpoints:

- S8 after permanent lockout.
- S9 after identity construction and after successful sync.
- S11 after each chamber.

Store the chain milestone plus a small explicit scene-state payload. Loading
should rebuild the scene and replay milestone application deterministically.

### Repair playtest telemetry

Track at least:

- Total scene time.
- Time per chain step.
- Wrong interactions per entity.
- Hint tiers consumed per step.
- Number of drops and re-pickups.
- Restarts or checkpoint reloads.

Keep it local and exportable. The current `solveTime` value should not reset
with each hint pool.

## 3. Raise the visual quality without abandoning the low-poly style

### Rendering foundation

1. Explicitly configure sRGB output and ACES filmic tone mapping.
2. Add exposure per scene.
3. Add inexpensive soft contact-shadow decals beneath Dust, NPCs, and major
   props.
4. Create per-scene light rigs: key direction and color, fill, ambient level,
   fog range, and one or more practical lights.
5. Add resource disposal during scene teardown.
6. Track `renderer.info` in playtest mode to establish draw-call, geometry,
   texture, and memory budgets.

Bloom should be optional and restrained. The game should not become glossy
science fiction; only chest screens, practical lamps, warning lights, and the
lighthouse beam should bloom.

### Environment-density rules

Every scene should contain:

- One unmistakable **hero silhouette** visible immediately.
- One authored **practical light source** tied to the location.
- One low-cost **ambient animation**.
- Foreground, interaction layer, and background dressing.
- A clear contrast hierarchy: puzzle-critical objects highest, flavor props
  lower, architecture lowest.

Reduce room dimensions where possible rather than filling every void. Empty
space should be used deliberately for loneliness or ritual, not because the
room lacks props.

Integrate signage into machines, desks, walls, and fixtures. Remove the
appearance of floating debug labels.

### Character animation

Build a small hand-authored animation controller rather than a full skeletal
pipeline:

- Smooth turning rather than snap rotation.
- Idle servo shift and occasional head movement.
- Arm reach for pickup and placement.
- Cleaning pose and recoil.
- Head and chest orientation toward examined objects.
- Carry-weight variation for heavy items.
- NPC posture loops and reaction gestures.

Dust is visible in nearly every frame; improving him will benefit the entire
game more than adding dozens of minor props.

### Effects and atmosphere

Create reusable lightweight systems for:

- Dust motes and cleaning particles.
- Sparks and electrical arcing.
- Smoke and steam wisps.
- Wind-driven leaves and hanging objects.
- Practical-light flicker.
- Screen scanlines and low-power pulses.
- A fake volumetric beam using additive cone geometry and fog particles.

Effects should communicate puzzle state first and decorate second.

### Camera language

Extend camera anchors with optional FOV, vertical target, and mood settings.
Add subtle authored beats:

- Slow push when Dust recognizes a contradiction.
- Small impulse for machinery starting or stopping.
- Wider quiet frame for S4.
- Lower, more intimate framing for S6.
- Constricted lamp-lit framing for S10.
- Progressive upward and closer framing through S11.

Avoid free camera controls; the fixed authored perspective suits the game.

### UI

- Feed each scene's accent and warm colors into CSS variables.
- Add keyboard focus states.
- Replace the OS-dependent lightbulb emoji with a consistent vector icon.
- Differentiate tap and hold prompts visually.
- Let prompts identify the verb—Examine, Take, Place, Clean—without revealing
  outcomes.
- Add optional larger text and reduced-motion modes.

# Scene-by-scene redesign

## S0 — Party

### Dialogue

- Trigger naming and road lines from player behavior, not only
  12/18/25-minute clocks.
- Preserve the exit line.

### Mechanics

- Teach movement, cleaning, trash, and carrying invisibly.
- Let the road become subtly more inviting only after the player has
  experienced futility.

### Graphics

- Make this the richest social diorama.
- Add colored practical lights, moving guests, music-reactive decorations,
  clear kitchen and living-room identities, a visible night road, the child
  silhouette, and a stronger party-to-silence transition.

## S1 — Showroom

### Dialogue

- Deduplicate the breaker line.
- Keep the gift-wrapped ending.

### Mechanics

- Retain the camera timing puzzle as the first true test.
- Improve camera-cone and phase feedback rather than adding more steps.

### Graphics

- Use polished display lighting, reflections, mannequin silhouettes, moving
  demo signage, and stronger dark/backstage contrast.
- This should remain the model for mechanic-linked lighting.

## S2 — Office

### Dialogue

- Add short corporate memo voices and reactions.
- Preserve the letter and reclamation lines.

### Mechanics

- Make several IN-tray pages genuinely shreddable.
- Add a close examination mode for handwriting comparison.

### Graphics

- Add fluorescent strips, cubicle clutter, copier glow, office chairs, paper
  trails, and warmer light focused on the handwritten letter.

## S3 — Smart Home

### Dialogue

- Reduce repeated OS chatter.
- Sharpen its unique voice.

### Mechanics

- Make routine state visually observable.
- The cleverness should remain "obey once in order to disobey," not code-entry
  busywork.

### Graphics

- Add curtains, smart indicators, dormant household screens, toaster smoke,
  vent movement, and contrast between immaculate surfaces and six years of
  abandonment.

## S4 — Yard

### Dialogue

- Suppress the neighbor once stillness begins.
- Preserve the three stillness lines.

### Mechanics

- Keep the anti-puzzle.
- Use wind, sound, and slowing environmental motion as confirmation rather
  than a shimmer or explicit prompt.

### Graphics

- Build a storm progression with a moving canopy, drifting leaves,
  cloud-shadow changes, fence and porch details, and a widening quiet camera.

## S5 — Museum

### Dialogue

- Vary hint rhythm.
- Preserve the sculpture and dying-robot lines.

### Mechanics

- Make the count discrepancy physically legible.
- Guard timing must use movement, sound, and light—not color alone.

### Graphics

- Replace repeated identical exhibits with distinct silhouettes, individual
  spotlights, darker circulation space, visible archive and loading areas,
  and a hero Series-C plinth.

## S6 — Care Home

### Dialogue

- Guarantee the bus line.
- Preserve the old man's wrong-photo memories.
- Keep narration sparse.

### Mechanics

- Use close photo inspection and object comparison.
- Do not add a long chain; this scene should remain humane and observational.

### Graphics

- Furnish the room as a recently vacated life.
- Contrast warm room lamps with cold hall lighting.
- Animate the old man's hands and posture.
- Make photos visually readable.

## S7 — Theater

### Dialogue

- Expand actor and director specificity slightly.
- Preserve the final "be seen" line.

### Mechanics

- Give ropes number and shape tags in addition to colors.
- Make incorrect ropes teach through visible stage consequences.

### Graphics

- Add curtains, battens, trusses, scenery, footlights, dust in the spotlight,
  and a strong camera push when Dust enters the circle.

## S8 — Scrapyard

### Dialogue

- Let the PA increasingly expose the contradiction between safety and
  production.

### Mechanics

- Add a brief real sorting loop, then turn it against itself.
- Keep E-stop, crane, lockout, and core rescue.
- Trim redundant carries if playtests run long.

### Graphics

- Animate the belt and magnet.
- Add junk density and depth, sparks, diesel exhaust, industrial practical
  lights, large machinery silhouettes, and a visibly warm living core.

## S9 — Repair Shop

### Dialogue

- Preserve the identity-heist writing and technician banality.
- Reduce repeated hint cadence.

### Mechanics

- Add a live Bay 2 requirement board and milestone checkpoint.
- Consider removing one low-value fetch step if cold testers exceed target
  duration.

### Graphics

- Add diagnostic screens, task lights, cables, charging effects, grinder
  sparks, a cinematic barcode peel, and stronger visual separation between
  Bay 1 and Bay 2.

## S10 — Blackout

### Dialogue

- Add one porchman callback after Dust proves him wrong.
- Keep Ash otherwise quiet.

### Mechanics

- Preserve lamp discovery, recharge route, crank reuse, and bridge.
- Improve landmarks so darkness tests navigation and courage rather than
  monitor brightness.

### Graphics

- Replace black boxes with readable house silhouettes.
- Add a few distant warm windows, fog layers, rain and wind movement,
  reflective road edges, a real lamp cone, downed-line sparks, and harbor
  lights as the final destination.

## S11 — Lighthouse

### Dialogue

- Space Ash's reveal across movement and eye contact.
- Give the final choice a small downstream dialogue variation.

### Mechanics

- Add chamber checkpoints.
- Keep all six mechanical echoes, but ensure every chamber has a distinct
  reasoning family rather than only fetch and place.

### Graphics

- Build this as the visual culmination: coastal exterior, vertical
  architecture, unique chamber lighting, a bespoke Fresnel lens, weathered
  brass and glass, ocean glimpses, actual spatial audio, a volumetric beam,
  and an authored reveal camera.
- The clean or leave choice can subtly alter beam warmth or the final
  composition without changing the ending.

# Recommended production order

## Phase 0 — Baseline and safeguards

- Correct total and per-step telemetry.
- Capture performance and visual baselines for all scenes.
- Add renderer resource disposal.
- Implement transcript storage structure.
- Add milestone checkpoint framework.
- Hide or implement the false Scene Select button.

## Phase 1 — Shared presentation systems

- Tone mapping and scene light rigs.
- Contact shadows.
- CSS scene theming.
- Animation controller for Dust.
- Reusable atmosphere and effect helpers.
- Real spatial audio path.
- Examine interaction and camera push-in.

## Phase 2 — Three-scene vertical slice

Upgrade **S1, S6, and S10** first:

- S1 proves mechanical clarity and authored light.
- S6 proves emotional staging, inspection, and restrained narration.
- S10 proves darkness, navigation, atmosphere, and lamp rendering.

Do not proceed to all scenes until those three establish the final quality
bar.

## Phase 3 — Act One

Upgrade S0–S4, including onboarding, false-task consistency, office
examination, smart-home feedback, and the yard atmosphere pass.

## Phase 4 — Act Two

Upgrade S5–S7, focusing on hero environments, observation, human warmth, and
the spotlight payoff.

## Phase 5 — Act Three

Upgrade S8–S10, focusing on machinery animation, persistent system feedback,
checkpoints, and environmental navigation.

## Phase 6 — Finale

Rebuild S11 only after all reusable systems are stable. The finale should
reuse finished mechanics and visual motifs rather than inventing temporary
one-off systems.

## Phase 7 — Dialogue, VO, accessibility, and final playtests

- Full hint rewrite and suffix-variety pass.
- External-speaker differentiation.
- Transcript and reading settings.
- Colorblind and timing-assist audit.
- VO generation only after text is locked.
- Full audio mix, especially S0's party fade and S11's spatial reveal.

# Ship gates

The improvement pass should not be considered complete until:

- A screenshot of each scene is identifiable without its HUD or labels.
- Every scene has a hero silhouette, practical light, and ambient motion.
- No critical puzzle depends on color alone.
- No major room relies on floating labels as its primary clue language.
- Every critical story line can be reread.
- Total scene and per-step solve times are measured correctly.
- No cold tester remains hard-stuck beyond 1.5 times the intended scene time
  on Normal hints.
- S9 and each S11 chamber recover correctly from a reload.
- The lighthouse reveal uses genuine spatial audio and distinctive camera
  staging.
- The final choice receives a visible or audible acknowledgment while
  preserving two equally warm outcomes.
- Desktop maintains 60 FPS and the chosen lower-power target maintains at
  least 30 FPS using measured renderer budgets.
- GPU memory does not continually grow across a complete S0-to-S11
  playthrough.

# Scope estimate

For a solo developer preserving the procedural low-poly approach, this is
roughly a **14–22 week substantial quality pass**:

- 2–3 weeks for shared systems and safeguards.
- 8–12 weeks for scene-by-scene art and mechanics revisions.
- 2–3 weeks for the lighthouse and ending.
- 2–4 weeks for dialogue, accessibility, performance, audio, and cold
  playtesting.

The highest-return first milestone is the S1, S6, and S10 vertical slice. If
those three feel dramatically more alive while still unmistakably feeling
like *Spotless*, the rest of the roadmap is sound.
