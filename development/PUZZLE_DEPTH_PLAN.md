# SPOTLESS — PUZZLE DEPTH MASTER PLAN (for Claude/Opus execution)

> Written 2026-07-06 by Claude (Fable 5) after reading the SHIPPED game code (all 12 scene
> files, kit/interact/hints/narrator/save/world, test harness). Owner's verdict on v1:
> **theme good, puzzles far too easy.** This plan rebuilds every puzzle EXCEPT S0 (party)
> and S4 (yard/tree) — owner explicitly keeps those — into multi-step chains that escalate
> hard through the game, ending in a finale with **dozens of steps**. Players are never told
> what to do; they figure it out. Difficulty must come from discovery and synthesis, never
> from obscurity — §2 is the contract for that.
> Companion: `OPUS_MASTER_PLAN.md` (original design — tone/story/narrator rules all still
> bind; where step counts conflict, THIS document wins).

## 0. What the code does today (verified — build on these, don't reinvent)

- Scene contract: each `js/scenes/sNN_*.js` exports a factory returning `{id, statedTask,
  hints:[3 ids], build(api), update(dt,api)}`; completion = some callback calling
  `api.solve()` [kit.js:19-24]. Sequencing is hand-rolled: `this.step`/booleans +
  `available: () => gate` on entities [pattern: s01_showroom.js:52,78].
- Interactions: flat registry [interact.js:12], one verb set — `onUse` tap, `pickable/
  onPick`, `acceptCarry(item,api)` place, `clean` hold [dispatch: world.js:155-185].
  **One-item carry, hard limit** [world.js:50-63] — chains are sequential item hops.
- Entities CAN be spawned/removed mid-scene (S02 stamp, S05 socketgrime, S08 core recycle)
  — dynamic chain growth is fully supported.
- Hints: stuck-clock (pauses on STORY lines and for 60s after every `api.hints.progress()`)
  with tiers at 4/8/12 min + mercy shimmer at 18 [hints.js:32-54, config.js:36]. Hint TEXT
  lives in narrator_script.json as `sN_h1..h3`. **Most scenes never register shimmer
  targets — the mercy shimmer is currently a no-op. Fix per scene while in there.**
- Save: `state.flags` exists but is dead — declared, wiped on New Game [main.js:81], never
  read/written. Cross-scene memory needs this plumbed (§3.4).
- Tests: `test/run.js` Harness drives scenes headlessly via `tap(id)/cleanEnt(id)/
  goto(x,z)/pump(sec)`; every scene has `solve`, `dumb`, `solveAfterDumb` plans [run.js:69-
  128]. **Every redesigned puzzle ships with updated bots in the same vocabulary.**
- Narrator: priority queue, categories STORY/VOICE/REACT/HINT/IDLE, `|` clause marks,
  `once`/`cooldown`, 123 lines total today. VO is 404-tolerant (subtitles always work).

## 1. Difficulty targets (the new curve)

| Scene | Today (steps / solve) | NEW target steps | NEW target solve time |
|---|---|---|---|
| S0 Party | 1 / hidden exit | **unchanged** | unchanged |
| S1 Showroom | 2 / ~3 min | 6 | 10-15 min |
| S2 Office | 6 / ~5 min | 9 | 12-18 min |
| S3 Smart Home | 5 / ~5 min | 10 | 15-22 min |
| S4 Yard | 1 / breather | **unchanged** | unchanged |
| S5 Museum | 5 / ~6 min | 11 | 18-25 min |
| S6 Care Home | 4 / ~4 min | 7 | 12-18 min |
| S7 Theater | 3 / ~4 min | 9 | 15-22 min |
| S8 Scrapyard | 4 / ~5 min | 12 | 20-30 min |
| S9 Repair Shop | 5 / ~6 min | 14 | 25-40 min |
| S10 Blackout | 3 / ~4 min | 8 | 15-25 min |
| S11 Lighthouse | 8 / ~10 min | **~35 (six chambers)** | 45-75 min |

New total ≈ 4.5-6.5 hours. "Step" = one discrete player interaction or deliberate move.
S6 stays moderate on purpose — it's the emotional scene; don't bury grief in busywork.

# 2. FAIR-DIFFICULTY CONSTITUTION (every redesigned step must pass all seven)

1. **Locally intuitive:** once discovered, each step makes immediate physical sense (a
   swollen door bar wants prying; a too-light device wants weight). Difficulty lives in
   discovering WHAT to do, never in guessing HOW to do it.
2. **Knowledge exists twice:** every code/order/match answer is readable in ≥2 places in
   the world (e.g. birthday on the banner AND the calendar). No single-pixel gates.
3. **Red herrings must respond:** a decoy (the big STOP DEMO button) gives feedback that
   teaches "not this" (it restarts the loop faster; narrator quips). Silent decoys are
   forbidden — silence reads as bug, not design.
4. **Timing windows are generous:** ≥4s window, ≤30s cycle, failing resets only to the
   window start. Never a fail state, never a full-chain reset.
5. **No pixel hunts:** interactables keep default reach [config.js INTERACT_REACH 1.7],
   readable silhouettes, and a `prompt`. Hiding = context, not size.
6. **Echo rule (late game):** from S8 on, ≥half the steps recombine mechanics the player
   has already performed once (stamp-and-tray, lever interlocks, self-interaction). The
   finale is ~100% echoes. Hard-late means "synthesize," not "new rules."
7. **Every step calls `api.hints.progress()` and belongs to a hint pool (§3.2).** If a
   step can't be hinted in-voice without spoiling, redesign the step.

# 3. ENGINE WORK (do once, before scene rewrites)

### 3.1 Chain helper (`kit.js`)
Hand-rolled `this.step` booleans won't survive 35-step scenes. Add ~40 lines:
`api.chain(['name1','name2',...])` → object with `at(name)` (bool: is current), `done
(name)` (bool: completed), `advance(name)` (idempotent, auto-calls `hints.progress()` +
swaps the active hint pool §3.2, fires optional per-step narrator id). Entities gate with
`available: () => ch.at('name')`. Branching chains: allow `advance` on any UNMET step
whose declared `after:[...]` prerequisites are met (S9/S11 have parallel tracks). Keep it
dumb — no events, no serialization (scene state stays per-load).

### 3.2 Per-step hint pools (`hints.js` + scene contract)
Today: 3 hints/scene — useless when a scene has 12 steps. Change `hints:` in the scene
contract to `hints: { step_name: ['id1','id2','id3'], ... }`; `Hints.begin` takes the map;
the chain's `advance()` calls `hints.setPool(name)` which RESETS the stuck-clock and swaps
tiers. Tier timers become per-scene via a new `CONFIG.HINT_SCALE` table: S1-S3 ×1 (4/8/12),
S5-S7 ×1.5, S8-S10 ×2, S11 ×2.5 per chamber. Settings semantics unchanged (normal/
patient/off). Mercy shimmer: on tier-3 timeout, shimmer THE CURRENT STEP's clue object —
which now means every step registers `addShimmerTarget` (fixes the existing no-op).

### 3.3 Two tiny world helpers (`kit.js`)
- `api.patroller({waypoints, dwell, speed})` → mesh that walks a loop; exposes
  `isNear(pos,r)` / `isAway(pos,r)`. Used by S5 guard-bot, S6 nurse cart, S9 clock
  pressure. Pure update-loop math, no nav dependency (waypoint lerp is fine).
- `api.dial({id, pos, positions:[...], onSet})` → tap cycles positions, label shows
  current. Used for S3 keypad (4 dials), S8 calibration kiosk, S11 breaker row. This keeps
  codes in-world — NO new DOM UI for puzzles.

### 3.4 Cross-scene flags (plumb the dead field)
Wire `state.flags` (already in save schema) into `createApi` as `api.memory.set(k,v)/
get(k)` persisted on scene solve. Used sparingly: S9 sets `gaveBarcode`; S10/S11 react
with one line each ("UNKNOWN DEVICE" at anything that scans). Do not build puzzle logic
across scenes — it's for FLAVOR continuity only (players can't revisit scenes mid-run).

### 3.5 Test harness
No changes needed — `tap/cleanEnt/goto/pump` covers everything below (dials are `tap`
N times; patroller windows are `pump` + `goto`). Every scene: rewrite `solve` plan,
extend `dumb` with the new worst-actions listed per scene, keep `solveAfterDumb`.
Add one assertion helper: `assertStep(h, name)` reading the chain state.

# 4. SCENE-BY-SCENE REDESIGN

> Format: **Chain** (numbered steps, → = unlocks) · **Clue chain** (how each step is
> discovered) · **Decoys** · **Recovery** · **Dumb-bot additions**. Stated tasks and
> instruction-giver lines are unchanged unless noted. All entity ids listed are the bot
> vocabulary — keep them stable.

## S1 — THE SHOWROOM (2 → 6 steps)
The dispenser and staff door survive; getting the door open grows a timed layer.
**Chain:** (1) observe the demo loop has PHASES (spill → clean-bot ad → applause →
lights-dim, 24s cycle; a phase clock drives stage lighting) → (2) during LIGHTS-DIM only,
the checkout counter's key hook is out of the security camera's cone — take `staffkey`
(outside the window: camera pivots, taking it triggers the PA "please do not handle
displays", key returns to hook — rule 4 reset) → (3) key opens `casedisplay` ("EMPLOYEE
OF THE MONTH — C-SERIES" mannequin) → (4) take `badge` off the mannequin → (5) badge on
`doorreader` (acceptCarry) opens staff door → (6) `breaker` inside now kills stage power
(moved backstage) → (7) unplug `dispenser` → solve.
**Clues:** the camera visibly sweeps; its cone is a light decal on the floor; the key hook
gleams; the mannequin wears the only badge in the room; reader has a badge-shaped decal.
**Decoys:** `stopdemo` big red button on stage — pressing it speeds the loop up 2× for one
cycle ("The button was for the demo, not of it."). The front doors still bark.
**Recovery:** key returns to hook on camera-catch; badge can't be dropped outside reach of
the reader (teleports back to mannequin with a narrator line).
**Dumb-bot adds:** press stopdemo ×5; grab key in full camera view; badge into dispenser.

## S2 — THE OFFICE (6 → 9 steps)
Keep trays/stamp/carbon skeleton; the letter now needs to be made WHOLE, not just stamped.
**Chain:** (1) find `letter` in IN tray — its address corner is TORN OFF → (2) the
shredder's output bin is a clean-target `shredpile`; holding-clean it 3 stages spawns 3
`fragment_N` pickables → (3) only `fragment_2` matches the letter's handwriting (each
fragment shows a distinct hand; the letter's hand is distinctive) → (4) tape: `dispenser2`
on desk 3 gives `tape` when tapped → (5) place fragment on `letter`, then tape on letter
(two acceptCarry stages, letter entity tracks `mended`) → (6) stamp: drawer key is now
taped UNDER the framed `handbook` plaque ("We believe in transparency") — tap plaque to
flip it → `hasKey` → (7) `drawer` → `stamp` → stamp letter (existing) → (8) the mail
chute is set to TRASH — flip `chuterouter` lever in the copy room (routing diagram beside
it shows MAIL/TRASH positions) → (9) letter into `out_tray` → solve.
**Clues:** torn corner is visually loud; shredder hums when passed (existing thunk
pattern); handwriting match per rule 2 (letter + matching fragment both on-screen when
carried); plaque hangs crooked; router diagram is explicit.
**Decoys:** two wrong fragments — placing one on the letter gets a polite decline + it
flutters back to the pile (responds, teaches).
**Recovery:** carbon-copy path survives for a shredded letter; fragments respawn with the
pile if lost; the router can be flipped freely.
**Dumb-bot adds:** shred the mended letter (carbon now spawns pre-mended, pre-stamped —
mercy escalates with progress); mail the letter unstamped (chute spits it back).

## S3 — THE SMART HOME (5 → 10 steps)
The OS now actively counter-cleans your setup. Beat it with its own routine.
**Chain:** (1) toaster has NO PLUG FUSE — OS chirps it "confiscated for fire safety" →
(2) confiscation bin is in the utility closet, OS-locked; closet unlocks only during
ROUTINE STEP 2 "vacuum hour" → (3) so OBEY: complete routine step 1 (fluff `cushion_1..3`,
three quick cleans) — OS announces vacuum hour, closet clicks open (the thematic hinge:
you must comply to defy; narrator lands it) → (4) `fusebox_bin` → take `plugfuse` →
(5) `detector` needs a battery (kept); battery is in the guest-room `clock` — taking it
silences the ticking; within 20s the OS notices and re-locks everything until ticking
resumes → (6) pre-stage the swap: take `metronome` from the piano room FIRST, place it by
the clock, THEN swap (one-carry forces the order: metronome down, battery out — the OS
hears continuous ticking) → (7) `breadvault` needs a 4-digit code: the owner's birthday —
on the dusty garage banner ("HAPPY 40TH, MARCH 3") AND circled on the kitchen calendar
(03-03; dial entity ×4) → (8) `bread` → toaster → (9) plugfuse → toaster → (10) battery →
detector, tap toaster → burn → vents open → solve.
**Clues:** OS announces its own routine schedule constantly (the timetable IS the clue);
confiscation policy printed on the closet door; clock/metronome both tick audibly;
banner + calendar per rule 2.
**Decoys:** the front-door keypad accepts the birthday code too — and the OS thanks you
for "testing the lock" and does nothing (responds; the door is climate-sealed, not
code-sealed).
**Recovery:** OS re-lock is a 20s pause, not a reset (re-place any ticking source);
unlimited bread (kept); dials freely re-enterable.
**Dumb-bot adds:** take battery with no metronome staged; enter wrong codes ×10; burn
toast with no battery in detector (OS smugly "handles" the smoke, scene continues).

## S5 — THE MUSEUM (5 → 11 steps)
The sleeping Series-C now needs three parts, installed in the right order, under patrol.
**Chain:** (1) count mismatch (kept: 12 ordered, 11 plaqued) → (2) closet: `screwdriver` +
`floormap` (tap to read: exhibit numbers; #7 "EARLY MANIPULATOR — artist unknown" is in
the ART wing — a robot HAND catalogued as sculpture) → (3) a `guardbot` patrols a fixed
loop (patroller helper, ~35s, dwell at each wing); the hand's case is alarmed — the
`alarmpanel` at the guard desk disarms ONE wing at a time (dial: wing A/B/C) → (4) set
dial to ART wing, wait for guardbot to be away, open `handcase`, take `hand` (case open +
guard near = PA warning + case re-locks, rule-4 reset) → (5) panel on robot (screwdriver,
kept) → reveals socket + a faded SERVICE DIAGRAM etched inside: install order
HAND → RIBBON → FUSE → (6) clean `socketgrime` (kept) → (7) `ribbon` (memory ribbon) is
in the archive drawers — drawer labels are exhibit numbers; the robot has NO number...
except the shipping crate in the loading bay stenciled "ITEM 12" — drawer 12 holds the
ribbon → (8) `fuse` is now up on the mezzanine junction box — freight `elevator` needs its
`crank` (mounted in the hands-on KIDS exhibit, the one thing labeled PLEASE TOUCH — the
joke pays for itself) → (9-11) install hand, ribbon, fuse in order (wrong order: harmless
spark, that slot resets, narrator: "Not that one first, he decided, on reflection.") →
ten-second boot, arm points at fire exit, "...keep... walking...", exit ajar → solve.
**Clues:** floormap + catalog disagree (rule 2 for the hand); guard loop is visible and
audible; install order exists in the etched diagram AND as wear-marks around the three
sockets (rule 2); crate stencil visible from the main hall.
**Decoys:** dusting the 11 real exhibits still "completes" the stated task — the curator
recording congratulates you and nothing happens (the emptiness is the push).
**Recovery:** hand/fuse/ribbon teleport home if abandoned (existing S5 pattern); alarm
dial re-settable; boot sequence only ever plays once (idempotent solve guard).
**Dumb-bot adds:** open case with guard adjacent; install fuse first ×3; ride elevator
without crank.

## S6 — THE CARE HOME (4 → 7 steps, gentle by design)
No name tag anymore. Identify Margaret by evidence, and get the man able to see her.
**Chain:** (1) `oldman` now won't take ANY photo: "can't see a blessed thing" → (2) his
`suitcase` (tap-examine, 3 sub-taps): a glasses case ("bifocals — RED frames"), a train
ticket, knitting needles → (3) the nurse's `lostcart` (patroller, slow hallway loop) —
tap while she dwells: she asks WHICH glasses; red vs blue `glasses_r`/`glasses_b`
pickables → take red → (4) give glasses (acceptCarry on oldman) → (5) now the photos: the
bin pile holds `photo_1..4` (tap-examine): only one shows a woman with knitting AND the
same mint tin that sits on his suitcase (two-object visual match, rule 2) → (6) wrong
photos he now examines and gently hands back with a memory of who they ARE ("That's the
Hendersons' girl.") — every wrong guess adds story, not punishment → (7) right photo →
he says her name → solve.
**Clues:** all physical matches; the man's dialogue seeds "she knit all winter."
**Decoys:** none — this scene's difficulty is observation only. Keep it kind.
**Recovery:** photos indestructible (kept); blue glasses returnable.
**Dumb-bot adds:** give blue glasses (he chuckles, hands back); give all wrong photos
first, then right one.

## S7 — THE THEATER (3 → 9 steps)
The page is torn, the spotlight is dead, and the board needs the right cue.
**Chain:** (1) `bag_1` page (kept) — it's HALF a page → (2) other half is in the
prompter's box; the `prompter` sleeps, key on his belt; he snores in a loud 6s rhythm —
take `boxkey` only during the snore (audio timing window, subtitle-visible as "HNNNK—"
for sound-off play) → (3) unlock `promptbox` → `page_b` → (4) `smdesk` (stage manager's
desk) has tape: mend the page (echo of S2 — second time taping paper, the player already
knows) → (5) spotlight is BLOWN: `bulbbox` spares are up the catwalk; the catwalk `ladder`
is blocked by a lowered batten — the fly-rope wall `rope_1..4` with a FLY PLOT chart
beside it (chart: "LX BATTEN — ROPE 3"); wrong rope drops a prop tree with a magnificent
crash, director apoplectic, rule-3 feedback → (6) rope_3 raises the batten → ladder →
take `bulb` → (7) place bulb on `spotrig` → (8) the `board` now needs a preset: the cue
sheet taped to it reads "ACT II, SC 4 — VERA ALONE — PRESET 7" and the actor keeps drying
on Vera's line (dial to 7) → spotlight lights downstage circle → (9) mended page in hand,
walk into the light → chest screen shows the line → solve.
**Clues:** snore rhythm is unmissable; fly plot + cue sheet are literal documents (the
scene teaches "theaters run on paperwork"); blown bulb visibly dark when board is first
touched.
**Decoys:** ropes 1/2/4 all do SOMETHING harmless-but-loud (curtain, snow bag, sandbag).
**Recovery:** prompter never wakes (bit); tree crash resets nothing; page halves
indestructible.
**Dumb-bot adds:** pull every wrong rope; enter light with unmended page (screen shows
"CLEANING…", actor squints, narrator beat); take key off-rhythm ×3.

## S8 — THE SCRAPYARD (4 → 12 steps)
Truly shutting down an industrial line, then shipping the survivor out.
**Chain:** (1) warm `core` visible mid-belt but buried — unreachable until belt stops AND
scrap cleared → (2) `estop` (kept) stops the belt… for 20s, then the BACKUP GENERATOR
restarts it (audible diesel cough — the counter-move teaches the real chain) → (3) kill
the generator: its `fuelcutoff` is behind stacked barrels → (4) move barrels with the
yard `cranecab`: two levers (`cranelat`, `cranelong`, dial entities) position the magnet
over a painted grid (row letters / column numbers on the ground — read from the cab
window), `cranedrop` lifts/releases; two placements clear the barrels (spatial
mini-puzzle, 4 interactions) → (5) fuelcutoff → generator dies → (6) NOW estop holds →
(7) `lockouttag` from the foreman's board (board key hangs IN the crane cab — you were
just there; reward for attention) → tag on the breaker = belt cannot restart (LOTO
procedure poster on the wall explains the ritual — industrial-safety realism as clue) →
(8) walkway gate (kept lever, interlocked on tag) → (9) clean `scrapheap` over the core
(3-stage hold-clean) → (10) pick core → (11) `bluechute` is plated "OUTBOUND EMPTY — NO
SHIPMENTS": the yard `bellpost` at the truck gate summons the outbound truck (schedule
board: "RING FOR PICKUP"); chute unseals for a 60s window (generous, re-ringable) →
(12) core into chute during window → klaxon, PA sputters, gate opens → solve.
**Clues:** every counter-move is loud (diesel cough, re-seal clunk); LOTO poster + tag
board (rule 2); crane grid painted like a loading yard actually is.
**Decoys:** red bin still recycles the core back (kept, now with a shorter PA scolding);
`kiosk` sort-calibration dials exist and change which side PLASTICS fall — plausible,
useless, responsive ("The plastics were having a strange night.").
**Recovery:** everything re-triggerable; core recycles; bell re-rings; crane can't drop
barrels anywhere blocking (drop zones whitelisted).
**Dumb-bot adds:** estop→watch restart; bin the core post-LOTO; ring bell with no core;
crane-drop barrel on walkway (whitelist proves harmless).

## S9 — THE REPAIR SHOP (5 → 14 steps) — the identity heist
Bay 2 now verifies ID + weight + charge + paperwork. Build a fake you.
**Chain:** (1) SYNC meaning discovery (kept: poster + refurb tag) → (2) `chip` from
refurb unit (kept) → (3) chip's notch doesn't fit the vacuum port — `servicecard` on the
bench shows port key shapes; grind the notch at `benchgrinder` (place chip, tap grinder,
sparks) → (4) chip → `vacuum` (kept) → (5) Bay 2's scanner reads a BARCODE: peel
`yourbarcode` off your own chassis (hold-interact on self — the lamp taught self-
interaction exists) → stick on vacuum. **Set `api.memory.gaveBarcode`.** Narrator goes
quiet for exactly one beat. → (6) scanner also WEIGHS: bay plate readout "EXPECTED 38kg /
READ 9kg" → load vacuum with `ballast_1`/`ballast_2` (two carries; vacuum entity tracks
attachments) → (7) Bay 1 charge (kept) — but Bay 1's dock fuse is blown: swap in the fuse
from the `opensign` neon (window sign dies; the shop is now "closed"; narrator notes it) →
(8) charge vacuum → (9) paperwork: the `worklog` clipboard demands a stamped work order —
`authstamp` is clipped to the tech's board; stamp the order, order into the `logtray`
(FULL ECHO of S2, deliberately: the player should smile) → (10) dock vacuum on `bay2` →
green: SYNC COMPLETE → (11) now LEAVE: the exit `turnstile` scans chassis barcodes — you
gave yours away: "UNKNOWN DEVICE" (the consequence lands mechanically) → (12) the parts
`deliveryhatch` on the alley wall ships unlabeled components out — its release is inside
the parts cage → (13) cage key: hanging with the tech's coat — pocket also holds his
`lunchticket` (flavor tap) → (14) open hatch, climb in, ship yourself out as freight →
solve. Wall clock pressure: at "6:00am" (a real 25-min scene timer) the tech's alarm
audibly pre-rings at 20 min — pure atmosphere, nothing fails (rule 4).
**Clues:** every verification failure is a READOUT on the bay plate (ID / WEIGHT / CHARGE
/ PAPERWORK checklist with red/green pips — the puzzle's own progress bar, diegetic);
service card, poster, refurb tag all persist.
**Decoys:** docking yourself on Bay 2 still errors on the consent prompt (kept, still
funny, still safe).
**Recovery:** barcode re-peelable off vacuum if second thoughts (before solve); ballast
retrievable; every readout re-checks live.
**Dumb-bot adds:** dock vacuum at each missing-requirement stage (assert each red pip
message); self-dock ×3; exit turnstile before and after barcode-give.

## S10 — THE BLACKOUT ROAD (3 → 8 steps)
The lamp discovery stays sacred; the road becomes a resource route.
**Chain:** (1) discover lamp (kept, untelegraphed) → (2) lamp now has a battery arc that
DRAINS (HUD glyph fills/empties, ~90s of light) — dark = slow walk + no interact prompts
(never harmful, just blind) → (3) recharge points: the porch man's solar `porchoutlet`
(he grumbles but allows it — his one soft note) and the substation trickle `substation`
mid-route; a bus-stop `roadmap` shows the road + both bolt icons (rule 2 with the world
itself) → (4) the downed line's `cutoff` (kept) has NO HANDLE: a hex socket, empty →
(5) the stalled utility `truck` up the side street holds the `crankhandle` — locked;
(6) the truck keys are in the porch man's `mailbox` — its flag is UP (delivered mail; he
said "stay put," he never said his mail was his) — one gentle theft, narrator wrestles
with it → (7) crank → cutoff → line drops dead, barrier opens → (8) KEEP the crank
(first scene that rewards item retention): the harbor `bridgewinch` south needs the same
hex crank — wind the bridge down, cross → solve.
**Clues:** drain arc is visible from first light; bolt icons; the cutoff's empty socket
matches the crank silhouette; winch has the identical socket (rule 6 echo, same scene).
**Decoys:** hammering the cutoff bare-handed gets sparks + a dry line.
**Recovery:** battery can always limp to a recharge point (drain floor leaves a 10%
"ember" glow); crank teleports back to last surface if dropped in the dark.
**Dumb-bot adds:** full drain mid-road then recover; cutoff without crank ×5; cross
attempt with bridge up.

## S11 — THE LIGHTHOUSE (8 → ~35 steps) — THE MASTER PUZZLE
**No instruction-giver. No stated task beyond the HUD's single word: "Climb."** The only
scene with zero VOICE lines; the narrator thins out as you rise (original plan's intent,
now earned across a long silence). Structure: a brass pictogram plaque at the entry —
**LIGHT = FIRE + GLASS + TURN** — is the whole brief. Six chambers, each a distilled echo
of one lesson, each internally 4-7 steps, hint pools per chamber (§3.2, ×2.5 timers).
The shelf artifacts (kept, all six) are now IN the chambers they echo.

- **C0 — The Door (~5 steps, Party echo: leave the marked area).** The door bar is
  swollen shut. The beached dinghy down the shingle holds a `boathook` — chained; the
  chain `pin` drifts loose in a tide pool (visible glint); pin out → hook → pry `doorbar`
  → enter. The beach's play-bounds visibly extend past where the "path" ends — the game's
  first lesson, restated wordlessly.
- **C1 — The Breaker Room (~6 steps, Showroom echo: power has a source).** Five corroded
  breakers (`bk_1..5`, dial entities ON/OFF): contacts must each be hold-CLEANED first
  (clean verb's last hurrah); the correct ON/OFF pattern is scratched behind the door in
  the same pictogram language as the entry plaque (rule 2: also stitched on the keeper's
  sampler upstairs — found later, replayers smile). Wrong pattern: a distant fuse pops,
  resets one switch (rule 4).
- **C2 — The Logbook Gate (~4 steps, Office echo).** The stair gate is the keeper's
  mail-discipline: his last letter sits unsent. Find `letter2` in the desk, `stamp2` in
  the tea tin (tin rattles when passed), stamp it, `chute2` — the gate's counterweight is
  literally the mail bag; sending the letter drops it. (The letter's two readable lines
  are Ash's — unsigned. Say nothing.)
- **C3 — The Lens Loft (~7 steps, Museum echo: ordered assembly + the mislabeled thing).**
  The Fresnel lens is dismantled: `prism_1..3` in straw crates, install per the housing's
  etched order — but prism_2 is CRACKED (visible web). The entry chandelier downstairs
  holds one "decorative" pendant of identical cut (the mislabeled exhibit, again) —
  fetch `pendant` (one-carry trip through C1-C2, the tower becomes one connected space),
  install all three in etched order; wrong slot = harmless refraction flare + reset slot.
- **C4 — The Gear Deck (~7 steps, Scrapyard/Repair echo).** Rotation is jammed: a
  scrapped gear is wedged in the ring. The spare `gear` hangs at the base of the exterior
  `hoist` — two-lever positioning (crane echo, `hoistlat`/`hoistlift`) to raise it to the
  deck window; pry the jammed gear with the boathook (item retention echo — C0's tool,
  three chambers later); `greasetin` behind the ballast stack (weight echo — move two
  `ballast` blocks to reach it); grease ring, seat gear.
- **C5 — The Igniter (~5 steps, Blackout echo: you are the light).** Power hums, lens
  turns, but the igniter is dead — its cradle is chassis-shaped, its contact pads match
  the ones on YOUR back (readable diagram etched on the cradle: a Series-C silhouette).
  Recharge your lamp at the deck's trickle outlet (drain arc from S10 still lives),
  climb into the cradle, and fire your headlamp through the lens: **you are the missing
  part.** The beam catches. (If `memory.gaveBarcode`: the cradle's readout says UNKNOWN
  DEVICE — and lights anyway. One line: "The lighthouse did not care what he was called.")
- **The Lamp Room.** As the first beam sweeps, the narration goes SPATIAL mid-sentence
  (reveal mechanism unchanged) — Ash is in the corner chair, watching: *"I lit it every
  night for thirty years. Tonight I wanted to watch somebody else decide to."* Speck
  choice unchanged. Credits ride the beam. Post-credits chalk shot unchanged.

**Recovery:** every chamber is independently resettable; carried tools teleport to their
chamber's threshold if lost; no chamber can consume another chamber's key item.
**Bots:** `solve` = full ~35-tap/goto/pump script (this is also the game's best
regression test); `dumb` per chamber (wrong breaker patterns, cracked prism installed,
hoist mis-drops, cradle entry with dead lamp); `solveAfterDumb` runs the full tower after
all of it.

# 5. NARRATOR & HINT CONTENT BUDGET

- New/rewritten lines: ~40 REACT (decoy responses — every decoy speaks, rule 3), ~25
  STORY step-beats (chain `advance` moments), ~110 HINT (per-step pools ×3 tiers — write
  tier-1 as pure reframes, tier-3 as near-explicit, per the original writing rules), ~10
  S11 thinning-silence beats. Total ≈ +185 lines onto the existing 123 in
  `narrator_script.json`; same 404-tolerant VO pipeline, subtitles first.
- Writing rule addition for hints in long chains: a hint NEVER references a step the
  player hasn't opened yet (no "you'll need the crank later") — pools are strictly
  current-step.

# 6. EXECUTION ORDER (each slice ships with green bots)

1. **Engine (§3):** chain helper + per-step hint pools + dial/patroller + memory plumbing
   + `assertStep`. Retrofit S1 as the proof (it's the smallest redesign) — both bots green.
2. S2, S3 (early band) — validate the ×1 hint timers feel right by self-playtest.
3. S5, S6, S7 (mid band, ×1.5 timers).
4. S8, S9, S10 (late band, ×2 timers; S9 sets `memory.gaveBarcode`, S10 reacts).
5. **S11 master puzzle** — build chamber-by-chamber, each chamber's bots green before the
   next; the full-tower solve bot last.
6. Content pass: all new narrator lines + hint pools written and keyed; VO batch later.
7. **Playtest protocol** (original plan §10, updated gates): per scene, median solve time
   inside the §1 band; zero testers hard-stuck >1.5× band-max on Normal hints; the "oh!"
   test per scene AND per S11 chamber; S11 total 45-75 min with ≤4 tier-3 hints consumed.
   If a scene runs LONG, cut a step rather than fatten a hint — the chains above are
   designed so their last-added steps (S1's camera window, S8's kiosk decoy, S9's lunch
   ticket) are removable without breaking the spine.
- House rules: VERSION + CHANGELOG bumps, git commits per slice, never push without
  permission, all tuning in config.js (`HINT_SCALE`, timer windows, drain rates).
