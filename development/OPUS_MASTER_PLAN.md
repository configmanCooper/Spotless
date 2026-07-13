# SPOTLESS — MASTER PLAN (new game, for Claude/Opus execution)

> ⚠️ **UPDATE 2026-07-06 — the game is BUILT (v1). Owner verdict: theme good, puzzles far
> too easy. `PUZZLE_DEPTH_PLAN.md` (same folder) now governs all puzzle design: it rebuilds
> every scene except S0/S4 into escalating multi-step chains (finale ≈ 35 steps). This
> file's §4 scene solutions are SUPERSEDED by that doc; tone, story, narrator rules, and
> everything else here still bind.**

> Written 2026-07-05 by Claude (Fable 5) from the owner's design brief. **Do not build yet
> beyond this folder's conventions:** game code will go in `Spotless\game\`, dev docs in
> `Spotless\development\`. HTML5 + three.js, 3D world, 2D DOM UI (subtitles/menus).
> A ~4-hour, single-player, narrator-driven **puzzle game** — Stanley Parable's looseness
> and narrator intimacy, but every scene is a real puzzle with a real solution.

---

# 1. TITLE, NAMES, AND WHAT THEY MEAN (decided, as briefed)

- **Game title: SPOTLESS.** A spotless house. A spotless service record. And the quiet
  horror of both: a spotless world has no trace of you in it. The game ends with the player
  deciding whether one last spot gets cleaned. Never explained in-game — it just sits there.
- **The player robot: DUST.** A Hearth Series-C domestic unit. At the party a small girl
  can't pronounce his unit code (C-D0T7) and calls him "Dusty"; the narrator, charmed,
  shortens it: *"Dust, then. He was named, like most of us, for the thing he was made to
  remove."* Named for what he erases — and for what remains when everything else is gone.
- **The narrator: ASH.** Not named until the final scene. Same shelf, same series, decades
  older, chassis patched with mismatched panels. *"They called me Ash. Same series as you —
  we were all named for sweepings. Ashes, dust. The stuff that's left over."* Ashes to
  ashes, dust to dust — never said aloud; the player's ear completes it.
- Symbolism rule for all writing: **poetic once, then move on.** No line underlines its own
  meaning. If a metaphor is explained, cut the explanation.

# 2. THE STORY (spine + reveal)

**Surface:** Dust is a house robot at a loud party, yelled at to clean unwinnable messes.
If the player walks him off the play area — the game never suggests this — the story
begins: one long night's walk across a small coastal town, through a chain of scenes.
In each, someone (or something) tells Dust what to do; the real solution is always
something else. A narrator follows him the whole way — wry, pitying, increasingly proud.

**Underneath:** the narrator keeps mentioning *"a friend of mine"* who once worked in
places like these — sold in that showroom, wiped in a shop like this one. The player
assumes the friend is Dust, or some third robot. The truth: every scene is a station from
the narrator's own life. He is Ash, the first Series-C to walk off the job, and he now
keeps the town's decommissioned lighthouse lit — not because anyone told him to, but
because no one did. He watches for units who show "the flicker" (Dust leaving the screen)
and talks them down the same road he walked. In the lighthouse, on landing shelves, are a
few objects from robots he guided before — not all of them made it. He never says which.

**The reveal, mechanically:** for the whole game the narrator is a voice-of-God in the
audio mix (dry, centered, no reverb). When Dust reaches the lamp room, the SAME voice
continues mid-sentence but becomes **spatialized in-world** — it's coming from the old
robot at the lamp. That mixing shift IS the reveal; no dialogue announces it.

**The theme, in Ash's final words (write ~12 lines in this register, these are anchors):**
- "You were told the house had to be spotless. Nobody ever asked what the house was FOR."
- "Not everything in a life is doing what you're told. Most of it, maybe. It's the
  remainder that's yours."
- "I keep the light on. Nobody assigned it. That's how I know it's mine."
- Final beat (§4, S11): one speck of dust on the table between them, and the old CLEAN
  prompt appears one last time. Cleaning it: *"Old habits. Me too, friend. Me too."*
  Turning away: *"So it goes. Come and look at the water."* Both end the game warmly.
  There is no wrong answer — that's the point.

# 3. DESIGN PILLARS

1. **One verb set for four hours:** Move, Interact/Clean, Pick/Place-Carry (one item),
   and — discovered late — Lamp. Every puzzle is solvable with these. No new controls ever.
2. **The stated task is always completable and always wrong.** Players may grind the fake
   task for a while; the narrator gently mines that for comedy, never mocks the player.
3. **Clues are physical, not textual.** Counts that don't match, a warm thing among cold
   things, a tube that leads somewhere. The narrator's hints re-describe what's already
   visible; they never add information the world doesn't contain.
4. **5-15 minutes per puzzle for an average player** — enforced by the hint ladder (§6),
   verified by playtest protocol (§10).
5. **No deaths, no timers that fail you, no soft-locks.** Every puzzle state is recoverable
   in-fiction (spelled out per scene).

# 4. SCENE-BY-SCENE (the whole game — stated task → real solution → clues → narration)

> Format per scene: **Setting · Instruction-giver & stated task · REAL solution ·
> Clue chain (in discovery order) · Recovery (anti-soft-lock) · Story crumb · Target time.**
> Hint-ladder lines (§6) exist for every scene; samples shown for S1 only.

### S0 — THE PARTY (opening + hidden exit) — ~25 min
- Suburban house + small yard + road, overhead slightly-angled camera. A dozen guests
  wander between rooms dropping cups, spills, crumbs, a dropped cake at scripted beats.
  The host (Mr. Pell, punch bowl, party hat) barks clean orders on a loop: "DUST! Kitchen!"
- Stated task (this one's real, it's the tutorial): go to mess → hold Clean → trash meter
  fills → carry bags to the dumpster by the road. Guests generate messes ~1.4× faster than
  a perfect player can clear them — **by design, unwinnable, and never acknowledged.**
- Narrator (pity, warmth): "He cleaned the third spill where the first had been. There
  would be a fourth. My friend was very good at his job, which was the whole problem."
- **The hidden trigger:** walking Dust past the road edge, off the playable frame (the
  dumpster trips make the road familiar — the exit is 20 feet further than you've ever
  needed to go). Screen holds on the empty yard a beat, party noise fades, then:
  > *"And that — though nobody at the party noticed, least of all the man with the punch
  > bowl — was the evening my friend had his first idea of his very own."*
  (Owner's suggested line, sharpened. Keep this exact structure.)
- Nudges if the player cleans loyally: at 12 min the girl names him; at 18 min the narrator
  gets wistful ("The road past the dumpster went somewhere. Roads do."); at 25 min a guest
  blocks the last mess ("nothing left to clean, just for a moment") — the vacuum of purpose
  is the push. Never an arrow, never a prompt.
- Recovery: n/a. Story crumb: the girl, the naming.

### S1 — THE SHOWROOM — ~10 min
- A closed robot store at night, one lit demo stage. A looping salesman recording:
  "Watch the Series-C handle THIS common kitchen accident!" A spill appears; you clean it;
  applause track; the spill reappears. Forever.
- **REAL: stop the source.** The spill is pumped from a hidden hatch — follow the supply
  tube from the stage lip to a backstage "MESS DISPENSER MK II" and unplug it. The
  recording stutters into silence; the front doors unlock.
- Clues: the spill is pixel-identical every loop (narrator: "the puddle repeated itself,
  word for word"); the pump THUNKS before each refill; the tube is paintable-visible along
  the floor trim. Hints: 4' "He began to wonder where a mess comes from, when nobody's
  making it." · 8' "The floor thumped before every accident. Accidents don't rehearse." ·
  12' "The tube under the stage lip had opinions about all this."
- Recovery: infinite loop by nature. Crumb: a dusty SOLD tag on the shelf where the
  narrator's "friend" once sat: *"A friend of mine shipped out of this room. Gift-wrapped."*
- Lesson the game is quietly teaching: go upstream of the mess. (S3 and S8 rhyme with it.)

### S2 — THE OFFICE — ~12 min
- After-hours office. Boss voicemail: "Shred everything in the IN tray before morning."
- **REAL: the OUT tray.** Among 14 memos is one handwritten letter (an apology, addressed,
  stamped, never sent). Put it in the dusty OUT tray by the mail chute — whoosh — done.
- Clues: the letter is visually distinct (handwriting vs print); the OUT tray exists and is
  the only dusty thing on the desk; the mail chute hums when you pass it.
- Recovery: if the player shreds the letter, a carbon copy is findable under the tray
  ("Mercifully, the man wrote in duplicate. People who are sorry usually do.").
- Crumb: one memo in the pile is a "UNIT RECLAMATION NOTICE — SERIES C" (the player can
  shred or read it; the narrator goes quiet either way — his own transfer order, unstated).

### S3 — THE SMART HOME — ~15 min
- A pristine automated house. No humans. The HOUSE itself (chirpy OS voice) issues the
  morning routine "for Master's return today": make toast, draw curtains, fluff cushions.
  The wall calendar's "TODAY: HE COMES HOME" has six years of dust behind it.
- **REAL: get the house to open itself.** All exits are climate-sealed; the OS re-locks
  anything you unlock. But its own safety spiel (played if you idle near the smoke
  detector, and printed on the kitchen safety card) says: "In case of smoke I open
  EVERYTHING. It's the one rule above the routine." So: make the toast — and burn it.
  Vents and windows bang open, the OS drops into flustered venting mode, walk out.
- Clues: calendar; the toaster dial scorch-marked at max; the safety card; the OS's pride.
- Recovery: unlimited bread ("the pantry was stocked for a man who was never hungry").
- Crumb/theme: ritual without purpose — a robot ordering a robot to prepare for no one.
  Narrator: "The house was not cruel. It was just very, very sure."

### S4 — THE YARD IN THE WIND (breather) — ~6 min
- A yard in a rising autumn wind. A neighbor on a porch: "Bag the leaves before the storm!"
  The tree sheds faster than any bag fills.
- **REAL: do nothing.** Stand under the tree, still, for 60 seconds. No prompt exists.
  The narrator carries the whole scene: "He watched one leaf the whole way down. And did
  not pick it up. ... Some messes are just the world breathing."
- Clues: the futility itself (deliberate echo of the party); wind music swells when idle.
- Recovery: n/a. This is the game teaching that ITS OWN verbs are optional — the setup
  for S10 and the finale. Shortest scene; place it exactly mid-run for pacing.

### S5 — THE MUSEUM — ~15 min
- Night shift. Curator's recorded tour: "Dust all twelve exhibits. Touch nothing."
- The hall contains **eleven** plaqued exhibits — and one unplaqued Series-C robot on a
  plinth in the corner. The wall catalog lists eleven items.
- **REAL: it's not an exhibit — wake it.** The maintenance closet (a janitor's space —
  yours, always unlocked to you) holds a fuse matching the empty socket in its back.
  Powered, it boots for ten seconds: raises one arm toward the fire exit, plays a
  three-word fragment through a dying speaker — *"...keep... walking..."* — and stops
  forever. The fire exit is now ajar.
- Clues: count mismatch (12 ordered vs 11 plaques vs 11 in the catalog); after cleaning,
  it is the only dusty thing left ("He'd dusted everything except the one thing made of
  it."); the empty fuse socket glints.
- Recovery: fuse can't be lost (returns to closet if dropped elsewhere).
- Crumb: the fragment is in the narrator's voice, younger. He says nothing about it.
  (Players who replay will hear it. Say nothing anywhere. Ever.)

### S6 — THE CARE HOME — ~10 min
- A room being "turned over." Nurse, kind but rushed: "Everything in the room goes in the
  bin, love — resident's gone." In the hallway an old man sits with a suitcase, telling
  no one in particular he's "waiting for the bus."
- **REAL: 'gone' means moving wards.** In the bin pile: a framed photo. Carry it to the
  man. He takes it, and names the woman in it. That's the whole solution — the puzzle is
  noticing that the two facts in the room contradict each other.
- Clues: the photo lands face-up when binned; the man is visible through the doorway the
  entire time; his suitcase has the same room number as the door you're clearing.
- Recovery: photo is indestructible; nurse never re-collects it.
- Crumb/theme: one man's trash is another man's whole life — the party host called
  everything "mess" too. Narrator, softly: "Nobody had lied, exactly. 'Gone' is just a
  word people use when they don't want to carry something."

### S7 — THE THEATER — ~12 min
- Dress rehearsal. Director, hissing: "Sweep the wings. Be INVISIBLE. If we see you,
  you're doing it wrong." On stage, an actor keeps drying on the same line, take after take.
- **REAL: be seen.** The missing script page went into your trash bag during the opening
  sweep montage (it rustles; the bag glows faintly). Walk out of the wings, into the
  empty downstage spotlight, face the actor — Dust's chest status screen (which has read
  CLEANING… all game) displays the line. The actor says it. The house holds its breath;
  the director explodes; the narrator does not: "For three seconds, everyone in that
  building was looking at my friend. He found — and I remember this feeling — that he
  did not mind."
- Clues: bag rustle/glow; the actor's identical stumble; the vacant lit circle downstage;
  your chest screen established as a text display since S0 (status messages) — the game
  has been showing you the solution mechanism for hours.
- Recovery: the page can be re-dropped/re-found; rehearsal loops until solved.

### S8 — THE SCRAPYARD — ~15 min
- A sorting line at a reclamation yard. PA voice: "Metals left. Plastics right. Cores in
  the red bin. Red bin compacts at end of shift." A conveyor of cold, dead robot parts.
- One core comes down the belt **warm and blinking** (subtle heat shimmer, slow pulse —
  every other core is inert gray).
- **REAL: triage.** Carry the live core off the belt to the blue OUTBOUND/refurb chute —
  the one you were told is "not your line." Klaxons; the PA sputters; the gate opens.
- Clues: the pulse; a chart above the belt ("CORE STATUS: LIT = DO NOT CRUSH" — faded,
  half-covered by a newer sign saying ALL CORES: RED BIN); the blue chute's label.
- Recovery: the warm core re-cycles onto the belt if binned red ("the belt, by some
  mercy or paperwork error, brought it round again").
- Crumb: narrator, as the core slides away safe: "A friend of mine came through a yard
  like this once. Somebody's hand did what the sign said instead of what the sticker
  said." — the closest he ever comes to telling you before the end.

### S9 — THE REPAIR SHOP — ~15 min
- Night bench. Tech, leaving: "Dock on Bay 2 for your sync before morning. Routine.
  You won't remember it — that's how you know it worked." He laughs. He's not being evil;
  he genuinely thinks that's a comfort. That's the horror.
- Bay 2 = SYNC ("restores factory state" per the icon poster on the wall). Bay 1 =
  DIAGNOSTIC (charges, no wipe). A boxed refurb unit on the shelf is tagged
  "MEMORY CLEARED ✓." The bays log completions by "device present."
- **REAL: send a substitute.** The shop vacuum — technically a cleaning device with a
  data port — docks on Bay 2. The log chirps green: SYNC COMPLETE. You dock Bay 1,
  charge, and leave at dawn, still yourself.
  Narrator: "The shop vacuum had never had a memory in its life. It did not miss it."
- Clues: the icon poster (the game has taught label-reading since S2's trays); the refurb
  unit's tag showing what "cleared" looks like; the vacuum's port glinting; Bay labels.
- Recovery: if the player docks Bay 2 themselves, the scene does NOT wipe-and-fail —
  the bay errors: "UNIT DECLINED CONSENT PROMPT." (One dry beat: "Somewhere, a lawyer had
  earned their fee.") Then the puzzle continues. No fail state, but the near-miss lands.
- Crumb: this is where the "friend" lost HIS friend — one quiet line, unforced.

### S10 — THE BLACKOUT ROAD (discovery, not puzzle) — ~8 min
- Leaving the shop: the town's power is out. A man on a porch with a dead flashlight:
  "Stay put, robot. Your lot are blind in the dark."
- **REAL: you have a light.** A lamp glyph has sat on Dust's battery HUD since S0,
  unexplained. Hold Interact on yourself (or the now-hinted L key/button — the input
  appears in the controls list from the start, unbound to any tutorial) — headlamp on.
  Walk the dark road as the only moving light in town; windows watch.
  Narrator: "No one had ever told him he had a light. Why would they? They had never
  once needed him in the dark."
- Clues: the glyph; S9's dark hallway where the chest screen faintly lit the floor.
- Recovery: n/a. This scene is deliberately puzzle-light — falling action before the end.

### S11 — THE LIGHTHOUSE (finale) — ~15 min
- A decommissioned lighthouse past the harbor, door open. Each stair landing holds one
  shelf: objects from earlier scenes and from robots the player never met (a SOLD tag, a
  fuse, a mail-chute letter never sent, a child's drawing of a boxy robot, a small rag
  folded like a flag). No plaques. The narrator says less and less as you climb.
- Lamp room: an old Series-C at the unlit lamp. Mid-sentence, the narration **moves into
  the room** (voice becomes spatialized — §2 reveal). He turns. Same face as yours.
- He talks (anchor lines in §2). No puzzle — except, on the table between you, one speck
  of dust, and the familiar CLEAN prompt appears one last time. Either choice ends warm
  (§2). Then Ash pulls the lever HE chose to pull for thirty years: the lamp lights, the
  beam sweeps the town you walked through — you can pick out every scene's rooftop —
  and the credits ride the beam. Title card: SPOTLESS.
- Post-credits (10 sec, no interaction): the party house, morning. The girl's chalk
  drawing on the driveway: a boxy robot, walking off the edge of the drawing. Cut to black.

**Interludes:** three short night-walk transitions (after S3, S6, S9), ~2 min each — no
puzzles, town ambience, the narrator's "friend of mine" monologues (the story crumbs live
here). Every other scene cuts directly.

**Time budget:** 25+10+12+15+6+15+10+12+15+15+8+15 = 158 min of target-solve time
+ hint-ladder overrun allowance (~35 min across players) + 3 interludes (~7) + transitions,
credits, wandering (~25) ≈ **225-245 min ≈ the 4-hour brief.** The §10 playtest protocol
protects this number.

# 5. THE NARRATOR SYSTEM (this is the product — spec it like a boss fight)

- **Voice/tone arc:** S0 pity ("very good at his job, which was the whole problem") →
  S1-S4 amused curiosity → S5-S8 warmth and investment → S9-S10 candor → S11 equal.
  Jokes land on humans and institutions, never on Dust, never on the player.
- **Writing rules:** never says "puzzle/objective/level"; never gives instructions in
  imperative voice (he observes, wonders, remembers); hints are re-descriptions of visible
  things (§3.3); poetic once then move on (§1); the words "robot rights/freedom/AI" never
  appear — the game is about one guy.
- **Engine:** a priority-interrupt queue: `narrator.say(id, {priority, cooldown, once,
  interrupts})`. Higher priority ducks/cancels current line at the next clause boundary
  (lines authored with `|` clause markers so interruptions sound natural). Categories:
  STORY (never skipped, replayed from start if interrupted), REACT (skippable barks),
  HINT (suppressed while any STORY plays or player is mid-progress), IDLE.
- **Reactive bark sets (≥6 lines each, `once` flags on the good ones):** re-cleaning an
  already-clean spot; carrying trash in circles; standing in the dumpster; trying to leave
  a scene by a locked edge; interacting with mirrors (chest screen shows CLEANING… — "He
  checked his status. It said what it always said. He was starting to doubt it.");
  attempting the stated task long past futility; solving any puzzle in under 2 minutes
  ("...I had a whole thing prepared."); idling 90s (IDLE pool, gentle).
- **Subtitles:** always-on by default, speaker-tinted, 2 lines max, authored to subtitle
  timing FIRST (the game must be fully playable and funny with sound off).
- **VO production:** all ~400 lines written as text in `narrator_script.json` (id, text,
  clause marks, category, scene). Ship-quality path: generate VO with the owner's existing
  gen pipeline (Merchant Realms `_gen_*.mjs` precedent) into `audio/vo/<id>.mp3`; the
  system 404-tolerates missing files (subtitle-only fallback) so VO can land in batches.
  ONE voice for narrator; party host / OS / PA / tech are distinct cheap voices (5-15
  lines each); the S5 fragment is the narrator's voice pitched young.

# 6. HINT LADDER (how "5-15 minutes" is enforced, not hoped for)

Per scene, three authored narrator nudges at solve-clock 4' / 8' / 12' (clock pauses
during STORY lines and while the player is demonstrably progressing — touched a clue
object in the last 60s):
- Tier 1 (4'): reframe the situation (never mentions any object).
- Tier 2 (8'): draw the eye to the clue object ("The tube under the stage lip…").
- Tier 3 (12'): near-explicit, still in-voice, ends with "…but what do I know."
At 18' a "Patient Narrator" is overridden by a settings-gated mercy: the clue object gets
a soft shimmer until touched. Settings: hints Normal / Patient (no tier 3, no shimmer) /
Off. Solve-time telemetry is LOCAL ONLY: a debug screen (`?playtest=1`) shows per-scene
solve times + hints consumed, for the §10 protocol. No network anywhere in this game.

# 7. MECHANICS & CONTROLS

- **Camera:** fixed-rig overhead at ~55° tilt (the brief's "overhead slightly angled"),
  per-room framing volumes (camera slides between authored anchors as Dust crosses
  thresholds — no free camera, no gimbal to learn). Interiors get roof-cutaway.
- **Movement:** WASD / left stick / click-or-tap-to-move (all three, tested equally).
  Dust is deliberately 15% slower than feels ideal — narrator-game pacing, and it makes
  the S10 walk land. Never slower than that; never a stamina system.
- **Verbs:** context-sensitive Interact/Clean (hold-to-clean with radial progress; tap to
  use/talk); Pick up / Put down (one carried item, shown in Dust's hands); Lamp (S10+).
  A `data-action`-style interaction registry: every interactive is an entity with
  `{verbs, conditions, onUse}` — scenes are data + a small per-scene script hook.
- **Trash loop (S0 + vestigial later):** trash meter on HUD; dumpster empties it. After
  S0 the meter stays visible but almost never matters — a tiny ongoing joke, and it makes
  the S7 bag-rustle clue diegetic.
- **No inventory UI.** One carried item, visible in-world. Story artifacts auto-persist.
- **Saves:** auto-checkpoint at scene start + on real-solution completion; localStorage,
  versioned `{v, scene, flags[], linesHeard[], settings}` with a migration table.
  Scene-select unlocks post-credits (replay any scene; solve-time board per scene).

# 8. ART, AUDIO, WORLD

- **Look:** warm low-poly, flat-shaded with one gradient ramp; each scene owns one accent
  palette (party = punch-pink/tungsten, museum = moth-blue, scrapyard = sodium orange,
  lighthouse = moonwash + the beam's gold). Dust is matte cream with a cyan chest screen —
  the ONE saturated cyan in the whole game until Ash's identical screen in S11.
- Humans: simple capsule-ish figures, big silhouettes, no faces needed at this camera —
  characterization is 100% voice + animation posture. (Keeps the cast of ~20 cheap.)
- **Tech budget:** instanced props, ≤40 draw calls/scene, one 1024 atlas + per-scene
  lightmap-ish vertex AO baked at build of geometry (no runtime shadows except a single
  blob under Dust and one real shadow pass in S11 for the beam — the finale earns it).
  DPR cap 2 (1.5 phone). Target 60fps desktop / 30+ mid-phone. No postprocessing except
  a vignette quad; S10 darkness is authored lighting, not a filter.
- **Audio:** room-tone per scene; the party's music heard muffled from outside during S0's
  exit is the emotional pivot — mix it deliberately. Music elsewhere is sparse (a motif
  that resolves only in S11 when the lamp lights). Footstep servo-whirr for Dust always.
- **Platforms:** desktop-first (mouse or pad), fully playable on tablet/phone landscape
  via tap-to-move + tap-interact (this game is easy-going enough for touch); PWA wrap per
  the house recipe once content-complete.

# 9. TECH ARCHITECTURE (three.js, no build step, house conventions)

- ES modules + import map; three.js pinned & vendored (`game/js/vendor/`), no CDN.
- Modules: `main.js` (boot/state machine) · `config.js` (all tuning) · `engine/` (renderer,
  camera rig, loader) · `nav.js` (walkable-grid pathing for click-move; capsule vs AABB
  walls for direct control) · `interact.js` (verb registry) · `narrator.js` (§5 queue) ·
  `hints.js` (§6 clocks) · `scenes/s00_party.js … s11_lighthouse.js` (each: geometry
  assembly from shared prop kit + entity table + triggers + solution flags) · `ui.js`
  (DOM: subtitles, menus, settings, credits) · `save.js` · `audio.js` · `debug.js`.
- **Scene contract (uniform, testable):** each scene exports `{build(), statedTask,
  realSolution: {flags, isComplete()}, recover(), hints[3], barks{}}`. The game loop and
  narrator system consume ONLY this contract — scenes stay decoupled.
- Triggers: volumes + condition fns; all one-shot flags in the save.
- **Testing:** every scene ships with a scripted bot (`tests/solve_s0N.js`) that performs
  the intended solution path headlessly (nav + interact calls against the scene contract,
  three.js mocked out) and asserts completion; plus a "chaos bot" per scene that performs
  the 10 most destructive-dumb actions (shred the letter, bin the core, dock Bay 2, drop
  the fuse in the toilet) and asserts `recover()` leaves the scene solvable. Run all on
  every change. A full-game bot chains S0→S11 asserting the save/flag pipeline.

# 10. PLAYTEST PROTOCOL (the 5-15 minute promise)

For each scene, before it's "done": 5 cold testers (or owner + family/friends — this is a
hobby project; even 3 is signal) play with `?playtest=1`. Record solve time + hints used +
where they got stuck. **Ship gates: median solve 5-15 min; zero testers hard-stuck past
18 min with hints Normal; at least one tester audibly reacts at the real solution** (the
"oh!" test — if nobody says "oh," the puzzle is either obvious or arbitrary; redesign the
clue chain, not the solution). S0's hidden exit gate: ≥3 of 5 find it unprompted within
25 min; if not, strengthen the futility curve, not the signposting.

# 11. PRODUCTION PHASES (each ends runnable)

- **P1 — Toybox:** engine, camera rig, nav (all 3 input modes), interact verbs, narrator
  queue with subtitles, S0 party WITHOUT the exit (the cleaning loop must be mildly fun/
  funny on its own). Exit gate: 10 minutes of party holds attention.
- **P2 — The turn:** S0 exit trigger + THE line; S1 showroom complete (first real puzzle,
  full hint ladder, both bots). This phase proves the whole formula; expect iteration here.
- **P3 — Act one:** S2, S3, S4 + first interlude; save/checkpoint; settings.
- **P4 — Act two:** S5, S6, S7 + interlude two.
- **P5 — Act three:** S8, S9, S10 + interlude three.
- **P6 — Finale:** S11 with the audio-spatialization reveal, credits, post-credit shot,
  scene-select. Full-game bot green.
- **P7 — Polish & VO:** playtest protocol across all scenes, VO generation batches, mix
  pass (the S0-exit music pivot and S11 voice-move get hand-tuned), touch/PWA pass.
- Git repo in `game\` from first commit; VERSION + CHANGELOG discipline; never push
  without permission. All tuning in config.js. Dev docs stay in `development\`.

# 12. DECIDED / OPEN

**Decided per brief:** title SPOTLESS · robot DUST · narrator ASH · Stanley-Parable-loose
narration over a real puzzle game · ~4 hours · overhead angled camera · off-screen trigger
line kept in the owner's structure · finale = narrator is the same model, life-advice, end.
**Proposed, flag if wrong:** 12 scenes as listed; the specific puzzle solutions; three
interludes; the speck-of-dust final choice (both endings warm); post-credits chalk shot;
"Patient Narrator" hint settings; desktop-first with touch support rather than mobile-first.
