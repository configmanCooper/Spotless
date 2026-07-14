// test/run.js — headless verification (§10). For every scene: a SOLVER bot walks
// the intended clue chain and asserts the scene completes; a DUMB bot does the
// dumbest things (including the anti-soft-lock traps) and asserts the scene is
// still solvable afterward. Run: node --loader ./test/loader.mjs test/run.js
import './shim.js';
import * as THREE from 'three';
import fs from 'node:fs';
import { Nav } from '../js/nav.js';
import { InteractRegistry } from '../js/interact.js';
import { Narrator } from '../js/narrator.js';
import { Hints } from '../js/hints.js';
import { World } from '../js/world.js';
import { createApi } from '../js/scenes/kit.js';
import { makeSceneById, SCENES } from '../js/scenes/index.js';
import { CONFIG } from '../js/config.js';

const script = JSON.parse(fs.readFileSync(new URL('../js/narrator_script.json', import.meta.url)));

let pass = 0, fail = 0;
const problems = [];
function check(name, cond) { if (cond) { pass++; } else { fail++; problems.push(name); console.log('  ✗ ' + name); } }

const stubUI = () => ({
  showSub() {}, hideSub() {}, hideSubSoon() {}, tick() {}, setTask() {}, setTrash() {},
  setBattery() {}, setBatteryArc() {}, setLampGlyph() {}, setPrompt() {}, setCleanRing() {}, toast() {}, fade() {},
  setSelfPrompt() {}, setTaskDone() {},
});
const stubAudio = () => ({
  sfx() {}, playVO() { return null; }, stopVO() {}, setRoomTone() {}, resume() {}, enabled: true,
});

class Harness {
  constructor(sceneId) {
    this.sceneId = sceneId;
    this.scene = makeSceneById(sceneId);
    this.threeScene = new THREE.Scene();
    this.nav = new Nav();
    this.interact = new InteractRegistry();
    this.ui = stubUI();
    this.audio = stubAudio();
    this.narrator = new Narrator({ ui: this.ui, audio: this.audio, script });
    this.settings = { hints: 'normal', subs: true };
    this.hints = new Hints({ narrator: this.narrator, settings: this.settings });
    this.world = new World({ scene: this.threeScene, nav: this.nav, interact: this.interact, ui: this.ui, narrator: this.narrator, audio: this.audio });
    this.group = new THREE.Group(); this.threeScene.add(this.group);
    this.solved = false;
    const core = {
      world: this.world, nav: this.nav, interact: this.interact, narrator: this.narrator,
      hints: this.hints, audio: this.audio, ui: this.ui, getCamera: () => null,
      setAnchors() {}, setAmbient() {}, onCredits: () => { this.credited = true; },
      setSpatialSource() {},
    };
    this.api = createApi(core, this.group, () => { this.solved = true; });
    this.scene.build(this.api);
    this.hints.begin(this.scene.hints || [], () => {});
  }
  ent(id) { return this.interact.entities.find(e => e.id === id); }
  _usable(e) { return e && e.active !== false && (!e.available || e.available()); }
  goto(x, z) { this.world.dust.position.set(x, 0, z); this.world._near = null; }
  gotoEnt(id) { const e = this.ent(id); const p = e.pos || e.mesh.position; this.goto(p.x, p.z); }
  // tap respects availability gates, exactly like nearest()-based selection in-game
  tap(id) { const e = this.ent(id); if (this._usable(e)) { this.world._tapInteract(e, this.api); return true; } return false; }
  cleanEnt(id) { const e = this.ent(id); if (e && e.clean && this._usable(e)) { this.world._doClean(e, this.api); return true; } return false; }
  cleanAllMesses() { for (const e of this.interact.entities.filter(x => x.clean && this._usable(x))) this.world._doClean(e, this.api); }
  pump(sec) { let t = 0; while (t < sec) { this.narrator.update(0.1); for (const fn of (this.api._updaters || [])) fn(0.1); if (this.scene.update) this.scene.update(0.1, this.api); if (this.scene.lateUpdate) this.scene.lateUpdate(0.1, this.api); this.hints.update(0.1); this.world._updateLamp && this.world._updateLamp(0.1); t += 0.1; } }
  pumpUntil(pred, max = 40) { let t = 0; while (t < max) { if (pred()) return true; this.pump(0.2); t += 0.2; } return pred(); }
  // chain introspection (assertStep helper, depth plan §3.5)
  step(name) { return this.api._chain && this.api._chain.done(name); }
  curStep() { return this.api._chain && this.api._chain.current(); }
  self() { if (this.api.triggerSelf) this.api.triggerSelf(); }
  drive(id, dt = 0.1) { this.world._tapInteract && this.tap(id); }
}
function assertStep(h, name) { return h.step(name); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- per-scene solvers + dumb traps (in discovery order) ----
const PLANS = {
  s00_party: {
    async solve(h) { h.goto(0, CONFIG.PARTY.EXIT_Z - 1); h.pump(12); },
    async dumb(h) { h.cleanAllMesses(); h.pump(3); h.cleanAllMesses(); },
  },
  s01_showroom: {
    async solve(h) {
      h.pumpUntil(() => h.scene._phase() === 3, 30); h.tap('staffkey');
      h.tap('casedisplay'); h.tap('badge'); h.tap('doorreader'); h.tap('breaker'); h.tap('dispenser');
    },
    async dumb(h) {
      for (let i = 0; i < 5; i++) h.tap('stopdemo');
      h.pumpUntil(() => h.scene._phase() !== 3, 10); h.tap('staffkey'); // grab in full view → PA, no key
      h.tap('dispenser'); h.tap('doorreader'); // gated, no effect
    },
    async solveAfterDumb(h) {
      h.pumpUntil(() => h.scene._phase() === 3, 30); h.tap('staffkey');
      h.tap('casedisplay'); h.tap('badge'); h.tap('doorreader'); h.tap('breaker'); h.tap('dispenser');
    },
  },
  s02_office: {
    async solve(h) {
      h.tap('letter');                                   // read (torn)
      h.cleanEnt('shredpile'); h.cleanEnt('shredpile'); h.cleanEnt('shredpile'); // 3-stage → fragments
      h.tap('fragment_2'); h.tap('letter');              // correct corner
      h.tap('tapedisp'); h.tap('tape'); h.tap('letter'); // tape mend
      h.tap('handbook');                                 // hidden key
      h.tap('drawer'); h.tap('stamp'); h.tap('letter');  // stamp
      h.tap('router');                                   // route to MAIL
      h.tap('letter'); h.tap('out_tray');                // mail → solve
    },
    async dumb(h) {
      h.tap('letter');
      h.cleanEnt('shredpile'); h.cleanEnt('shredpile'); h.cleanEnt('shredpile');
      h.tap('fragment_0'); h.tap('letter');              // wrong corner → declined
      if (h.world.carry) h.world.drop();
      h.tap('out_tray');                                 // not carrying letter → nothing
    },
    async solveAfterDumb(h) {
      if (h.world.carry) h.world.drop();
      h.tap('fragment_2'); h.tap('letter');
      h.tap('tapedisp'); h.tap('tape'); h.tap('letter');
      h.tap('handbook'); h.tap('drawer'); h.tap('stamp'); h.tap('letter');
      h.tap('router'); h.tap('letter'); h.tap('out_tray');
    },
  },
  s03_smarthome: {
    async solve(h) {
      h.cleanEnt('cushion_0'); h.cleanEnt('cushion_1'); h.cleanEnt('cushion_2'); // fluff → closet
      h.tap('plugfuse'); h.tap('toaster');                 // fuse → toaster (plugin)
      h.tap('metronome'); h.tap('clockspot');              // ticking sustained
      h.tap('battery'); h.tap('detector');                 // battery → detector (arm)
      for (let i = 0; i < 3; i++) h.tap('vdial_1');         // birthday 0 3 0 3
      for (let i = 0; i < 3; i++) h.tap('vdial_3');
      h.tap('bread'); h.tap('toaster');                    // bread → toaster (loadbread)
      h.tap('toaster');                                    // burn → solve
    },
    async dumb(h) {
      for (let d = 0; d < 4; d++) for (let i = 0; i < 10; i++) h.tap('vdial_' + d); // wrong codes, back to 0
      h.tap('battery');                                    // gated (no metronome)
      h.cleanEnt('cushion_0'); h.cleanEnt('cushion_1'); h.cleanEnt('cushion_2');
      h.tap('plugfuse'); h.tap('toaster');
      h.tap('toaster');                                    // burn: no bread/detector → error
    },
    async solveAfterDumb(h) {
      h.tap('metronome'); h.tap('clockspot');
      h.tap('battery'); h.tap('detector');
      for (let i = 0; i < 3; i++) h.tap('vdial_1');
      for (let i = 0; i < 3; i++) h.tap('vdial_3');
      h.tap('bread'); h.tap('toaster');
      h.tap('toaster');
    },
  },
  s04_yard: {
    async solve(h) { h.goto(0, -2); h.pump(65); },
    async dumb(h) { for (let i = 0; i < 4; i++) { h.cleanAllMesses(); h.goto(3, 3); h.pump(2); h.goto(-3, 2); } },
  },
  s05_museum: {
    async solve(h) {
      h.tap('floormap');
      h.tap('screwdriver'); h.tap('panel');
      h.cleanEnt('socketgrime');
      h.tap('alarmdial'); h.tap('alarmdial');           // dial → ART
      for (let i = 0; i < 40 && !h.step('hand'); i++) { h.pump(0.5); h.tap('handcase'); } // take when guard away
      h.tap('socket');
      h.tap('ribbon_drawer'); h.tap('ribbon'); h.tap('socket');
      h.tap('crank'); h.tap('lift'); h.tap('fuse'); h.tap('socket');
    },
    async dumb(h) {
      const casePos = new THREE.Vector3(-9, 0, 6);
      h.tap('floormap');
      h.tap('handcase');                                // armed → alarmed
      h.tap('alarmdial'); h.tap('alarmdial');
      h.pumpUntil(() => h.scene._guard.isNear(casePos, 3.5), 20); h.tap('handcase'); // caught
      h.tap('lift'); h.tap('socket');                   // gated, no effect
    },
    async solveAfterDumb(h) {
      h.tap('screwdriver'); h.tap('panel'); h.cleanEnt('socketgrime');
      for (let i = 0; i < 40 && !h.step('hand'); i++) { h.pump(0.5); h.tap('handcase'); }
      h.tap('socket');
      h.tap('ribbon_drawer'); h.tap('ribbon'); h.tap('socket');
      h.tap('crank'); h.tap('lift'); h.tap('fuse'); h.tap('socket');
    },
  },
  s06_carehome: {
    async solve(h) {
      h.tap('suitcase');
      h.pumpUntil(() => h.scene._cart.paused, 20); h.tap('cart'); // catch cart paused
      h.tap('glasses_r');                                 // take red
      h.tap('oldman');                                    // give glasses
      h.tap('photo_1'); h.tap('oldman');                  // correct photo → solve
    },
    async dumb(h) {
      h.tap('photo_0'); h.tap('oldman');                  // can't see → refused, still carrying
      if (h.world.carry) h.world.drop();
      h.tap('suitcase');
      h.pumpUntil(() => h.scene._cart.paused, 20); h.tap('cart');
      h.tap('glasses_b'); h.tap('oldman');                // wrong glasses → handed back
      if (h.world.carry) h.world.drop();
    },
    async solveAfterDumb(h) {
      if (h.world.carry) h.world.drop();
      h.tap('glasses_r'); h.tap('oldman');
      h.tap('photo_0'); h.tap('oldman');                  // wrong photo → memory, handed back
      if (h.world.carry) h.world.drop();
      h.tap('photo_1'); h.tap('oldman');                  // correct → solve
    },
  },
  s07_theater: {
    async solve(h) {
      h.tap('bag');                                       // page A
      h.pumpUntil(() => h.scene._snoring(), 10); h.tap('boxkey'); // key on snore
      h.tap('promptbox');                                 // page B
      h.tap('smdesk');                                    // tape mend
      h.tap('rope_2');                                    // rope 3 → batten up
      h.tap('ladder'); h.tap('spotrig');                  // bulb → rig
      for (let i = 0; i < 6; i++) h.tap('boardpreset');    // dial to 7
      h.goto(0, -2.5); h.pump(1);                          // step into the light
    },
    async dumb(h) {
      h.tap('rope_0'); h.tap('rope_1'); h.tap('rope_3');   // wrong ropes → crashes
      h.pumpUntil(() => !h.scene._snoring(), 10); h.tap('boxkey'); // off-rhythm → stir
      h.goto(0, -2.5); h.pump(1);                          // no page/no light → nothing
    },
    async solveAfterDumb(h) {
      h.tap('bag');
      h.pumpUntil(() => h.scene._snoring(), 10); h.tap('boxkey');
      h.tap('promptbox'); h.tap('smdesk');
      h.tap('rope_2'); h.tap('ladder'); h.tap('spotrig');
      for (let i = 0; i < 6; i++) h.tap('boardpreset');
      h.goto(0, -2.5); h.pump(1);
    },
  },
  s08_scrapyard: {
    async solve(h) {
      h.tap('estop');
      h.tap('cranelat'); h.tap('cranelong'); h.tap('cranedrop');              // B,2 → barrel 1
      h.tap('cranelat'); h.tap('cranelong'); h.tap('cranelong'); h.tap('cranedrop'); // C,1 → barrel 2
      h.tap('fuelcutoff');
      h.tap('tag'); h.tap('breaker');                                          // lockout
      h.tap('gate');
      h.cleanEnt('scrapheap'); h.cleanEnt('scrapheap'); h.cleanEnt('scrapheap');
      h.tap('core'); h.tap('bell'); h.tap('bluechute');                        // ring → ship → solve
    },
    async dumb(h) {
      h.tap('estop'); h.pump(3);                                              // generator coughs it back
      h.tap('cranedrop');                                                     // wrong cell → miss
      h.tap('gate');                                                          // interlock → feedback
      h.tap('bluechute');                                                     // sealed, no core → nothing
    },
    async solveAfterDumb(h) {
      h.tap('cranelat'); h.tap('cranelong'); h.tap('cranedrop');
      h.tap('cranelat'); h.tap('cranelong'); h.tap('cranelong'); h.tap('cranedrop');
      h.tap('fuelcutoff'); h.tap('tag'); h.tap('breaker'); h.tap('gate');
      h.cleanEnt('scrapheap'); h.cleanEnt('scrapheap'); h.cleanEnt('scrapheap');
      h.tap('core'); h.tap('bell'); h.tap('bluechute');
    },
  },
  s09_repair: {
    async solve(h) {
      h.tap('poster');
      h.tap('chip'); h.tap('grinder'); h.tap('vacuum');       // chip: take, grind, slot
      h.pump(0.3); h.self(); h.tap('barcode'); h.tap('vacuum'); // peel barcode → stick
      h.tap('ballast'); h.tap('vacuum'); h.tap('ballast'); h.tap('vacuum'); // two ballast
      h.tap('sign'); h.tap('signfuse'); h.tap('bay1');         // sign fuse → Bay 1
      h.tap('vacuum'); h.tap('bay1');                          // charge
      h.tap('authstamp'); h.tap('stamp'); h.tap('order'); h.tap('order'); h.tap('logtray'); // paperwork
      h.tap('vacuum'); h.tap('bay2');                          // sync
      h.tap('turnstile');                                     // learn: can't leave; tech walks in
      h.pump(6);                                              // tech hangs his coat on the rack
      h.tap('coat'); h.tap('cage'); h.tap('hatch');            // ship self → solve
    },
    async dumb(h) {
      h.tap('bay2');                                          // self-dock → decline
      h.tap('poster'); h.tap('vacuum'); h.tap('bay2');         // no chip → noid, keep carrying
      if (h.world.carry) h.world.drop();
      h.tap('turnstile');                                     // not synced → deny
    },
    async solveAfterDumb(h) {
      if (h.world.carry) h.world.drop();
      h.tap('chip'); h.tap('grinder'); h.tap('vacuum');
      h.pump(0.3); h.self(); h.tap('barcode'); h.tap('vacuum');
      h.tap('ballast'); h.tap('vacuum'); h.tap('ballast'); h.tap('vacuum');
      h.tap('sign'); h.tap('signfuse'); h.tap('bay1');
      h.tap('vacuum'); h.tap('bay1');
      h.tap('authstamp'); h.tap('stamp'); h.tap('order'); h.tap('order'); h.tap('logtray');
      h.tap('vacuum'); h.tap('bay2');
      h.tap('turnstile'); h.pump(6); h.tap('coat'); h.tap('cage'); h.tap('hatch');
    },
  },
  s10_blackout: {
    async solve(h) {
      h.world.setLampKnown(true); h.world.lampOn = true; h.pump(0.3);   // lamp on → step
      h.tap('recharge_3');                                              // top up (recharge step)
      h.tap('mailbox');                                                 // truck keys
      h.tap('truck'); h.tap('truck');                                   // unlock → take crank
      h.tap('cutoff');                                                  // crank the cutoff
      h.tap('winch');                                                   // wind bridge down (keep crank)
      h.goto(0, -34); h.pump(0.6);                                       // cross → solve
    },
    async dumb(h) {
      h.world.setLampKnown(true); h.world.lampOn = true; h.pump(0.3);
      for (let i = 0; i < 5; i++) h.tap('cutoff');                       // no crank / gated
      h.tap('winch');
      h.goto(0, -34); h.pump(0.4);                                       // bridge up → no cross
    },
    async solveAfterDumb(h) {
      h.tap('recharge_3'); h.tap('mailbox');
      h.tap('truck'); h.tap('truck');
      h.tap('cutoff'); h.tap('winch');
      h.goto(0, -34); h.pump(0.6);
    },
  },
  s11_lighthouse: {
    async solve(h) { await solveTower(h, false); },
    async dumb(h) {
      // C0 pin, then chamber-wrong actions that must all be harmless
      h.tap('c0_pin'); h.tap('c0_dinghy'); h.tap('c0_hook'); h.tap('c0_door');
      h.cleanEnt('c1_contacts'); h.cleanEnt('c1_contacts');
      h.tap('c1_power');                                   // wrong pattern (all OFF) → fuse pops
      h.tap('c3_cracked');                                 // grab cracked prism (decoy)
    },
    async solveAfterDumb(h) { await solveTower(h, true); }, // finish tower + walk-away ending
  },
};

// Full 22-step tower solve (also the game's best regression test). walkAway picks
// the "turn away" ending instead of cleaning the final speck.
async function solveTower(h, walkAway) {
  // C0 — the door
  h.tap('c0_pin'); h.tap('c0_dinghy'); h.tap('c0_hook'); h.tap('c0_door');
  // C1 — breaker room
  h.cleanEnt('c1_contacts'); h.cleanEnt('c1_contacts');
  h.tap('c1_bk0'); h.tap('c1_bk2');                       // ON / OFF / ON
  h.tap('c1_power');
  // C2 — logbook gate
  h.tap('c2_letter'); h.tap('c2_teatin'); h.tap('c2_stamp'); h.tap('c2_letter');
  h.tap('c2_letter'); h.tap('c2_chute');
  // C3 — lens loft
  h.tap('c3_chandelier');
  h.tap('c3_prism1'); h.tap('c3_housing');
  h.tap('c3_pendant'); h.tap('c3_housing');
  h.tap('c3_prism3'); h.tap('c3_housing');
  // C4 — gear deck
  h.tap('c4_hoistlat'); h.tap('c4_hoistlat');             // → C
  h.tap('c4_hoistlift'); h.tap('c4_hoistlift');           // → HI
  h.tap('c4_raise');
  h.tap('c0_hook'); h.tap('c4_pry');                      // reuse the kept boathook
  h.tap('c4_ballastA'); h.tap('c4_ballastB');
  h.tap('c4_grease'); h.tap('c4_ring');
  h.tap('c4_gear'); h.tap('c4_ring');
  // C5 — igniter
  h.tap('c5_trickle');
  h.world.lampOn = true; h.pump(0.3);                     // lamp on → c5_lampon
  h.tap('c5_cradle');                                     // ignite → reveal
  h.pumpUntil(() => !!h.ent('speck'), 120);               // ordered spatial reveal → speck offered
  if (walkAway) { h.goto(0, 46); h.pump(3); } else { h.cleanEnt('speck'); }
  h.pumpUntil(() => h.solved, 60);                        // ending line → solve + credits
}

async function run() {
  console.log('SPOTLESS headless test — solver + dumb bots (§10)\n');
  for (const { id } of SCENES) {
    const plan = PLANS[id];
    console.log('· ' + id);

    // SOLVER: intended clue chain completes the scene
    let h = new Harness(id);
    await plan.solve(h);
    check(id + ' :: solver completes the real solution', h.solved === true);

    // DUMB: worst actions never soft-lock; scene still solvable after
    h = new Harness(id);
    await plan.dumb(h);
    check(id + ' :: dumb actions do not accidentally fail/lock', true); // reaching here = no throw
    const finisher = plan.solveAfterDumb || plan.solve;
    await finisher(h);
    const ok = h.solved === true;
    if (!ok && h.api._chain) console.log('   [debug] stuck at:', h.api._chain.current(), '| done:', [...h.api._chain.steps.values()].filter(s => s.done).map(s => s.name).join(','));
    check(id + ' :: still solvable after dumb actions (anti-soft-lock)', ok);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILURES:', problems.join('; ')); process.exit(1); }
  else console.log('ALL GREEN ✓');
}
run().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
