# SPOTLESS — Cold Playtest Protocol

Use this protocol for players who have not read a design document, watched a
solution, or seen another person play.

## Setup

1. Start with a fresh save.
2. Open `http://localhost:8131/?playtest=1`.
3. Use the player's preferred input: keyboard, mouse, touch, or gamepad.
4. Do not explain that the stated assignment is wrong.
5. Do not explain the hint modes beyond their Settings descriptions.
6. Do not intervene unless the game is demonstrably broken.

The playtest panel is local-only. Clicking it exports
`spotless-playtest.json`; no data leaves the machine automatically.

## Record for every scene

- Total solve time.
- Time spent on each chain step.
- Hint tiers consumed per step.
- Examine interactions.
- Wrong attempts, grouped by mechanism.
- Manual and automatic item drops.
- Checkpoint reloads.
- The player's spoken theory of what the scene wants.
- The first moment the player questions the stated task.
- Any moment that produces laughter, surprise, discomfort, or silence.
- Any object the player believes is interactive but is not.
- Any prompt, sign, subtitle, or visual clue they cannot read.

## Target ranges

| Scene band | Target |
|---|---:|
| S0 Party | Exit found naturally within 10–25 minutes |
| S1–S3 | 10–22 minutes each |
| S4 Yard | 4–10 minutes |
| S5–S7 | 12–25 minutes each |
| S8–S10 | 18–40 minutes each |
| S11 Lighthouse | 40–75 minutes total |

Targets are guidance, not reasons to add filler. If a scene is short but
produces a strong insight, leave it short.

## Failure gates

Redesign or fix a scene when:

- A player is hard-stuck beyond 1.5 times its target maximum with Normal hints.
- A mandatory answer is found mainly by brute force.
- Two or more players mistake silence for a broken interaction.
- A timing puzzle remains inaccessible with Assist enabled.
- A required touch/gamepad action has no visible control.
- A player loses more than one meaningful chamber or sequence after reloading.
- A STORY line is obscured, reversed, repeated incorrectly, or impossible to
  reread in Memory.
- A player completes the assigned busywork but receives no meaningful response.
- No tester reacts to the real solution.

## Scene-specific questions

- **S0:** Did the player understand cleaning before questioning it? What drew
  their eye toward the road?
- **S1:** Did they understand the camera window without waiting only for hints?
- **S2:** Could they compare handwriting without guessing?
- **S3:** Did routine obedience feel clever rather than tedious?
- **S4:** Did the environment confirm stillness without an explicit command?
- **S5:** Were count, patrol, and installation order independently legible?
- **S6:** Did observation carry the scene without becoming busywork?
- **S7:** Could colorblind players identify the correct rope by number and mark?
- **S8:** Did the fake sorting loop strengthen the rescue contradiction?
- **S9:** Did the live checklist reduce memory burden without solving the heist?
- **S10:** Did darkness feel navigable with and without Assist?
- **S11:** Did the player-controlled reveal feel intimate rather than stalled?
  Did both final choices feel acknowledged and equally valid?

## Release requirement

Before release, complete at least:

- Five cold full-game playthroughs, or
- Three full-game playthroughs plus five focused tests for S0, S9, S10, and
  S11.

Keep exported JSON and written observations outside the repository unless the
player has explicitly agreed to share them.
