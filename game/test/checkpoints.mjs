// Standalone checkpoint verification: advance a scene's chain to a milestone,
// capture the checkpoint payload, rebuild the scene fresh, restore, and assert
// the chain state + carried tools are reconstructed so the scene stays solvable.
import './shim.js';
import * as THREE from 'three';
import fs from 'node:fs';
import { Nav } from '../js/nav.js';
import { InteractRegistry } from '../js/interact.js';
import { Narrator } from '../js/narrator.js';
import { Hints } from '../js/hints.js';
import { World } from '../js/world.js';
import { createApi } from '../js/scenes/kit.js';
import { makeSceneById } from '../js/scenes/index.js';

const script = JSON.parse(fs.readFileSync(new URL('../js/narrator_script.json', import.meta.url)));
const stubUI = () => ({ showSub(){},hideSub(){},hideSubSoon(){},tick(){},setTask(){},setTrash(){},setBattery(){},setBatteryArc(){},setLampGlyph(){},setPrompt(){},setCleanRing(){},toast(){},fade(){},setSelfPrompt(){},setTaskDone(){} });
const stubAudio = () => ({ sfx(){},playVO(){return null;},stopVO(){},setRoomTone(){},resume(){},enabled:true });

let pass = 0, fail = 0;
function check(name, cond) { if (cond) pass++; else { fail++; console.log('  ✗ ' + name); } }

function build(id, capture) {
  const threeScene = new THREE.Scene();
  const nav = new Nav(); const interact = new InteractRegistry();
  const ui = stubUI(); const audio = stubAudio();
  const narrator = new Narrator({ ui, audio, script });
  const settings = { hints: 'normal', subs: true };
  const hints = new Hints({ narrator, settings });
  const world = new World({ scene: threeScene, nav, interact, ui, narrator, audio });
  const group = new THREE.Group(); threeScene.add(group);
  const flags = {};
  const core = {
    world, nav, interact, narrator, hints, audio, ui, settings, getCamera: () => null,
    setAnchors(){}, setAmbient(){}, onCredits(){}, setSpatialSource(){}, setExposureScale(){},
    examine(){}, checkpoint: (name, payload) => { if (capture) capture.cp = { scene: id, milestone: name, payload }; },
    memory: { get: (k) => flags[k], set: (k, v) => { flags[k] = v; } },
  };
  const api = createApi(core, group, () => { world._solved = true; });
  const scene = makeSceneById(id);
  scene.build(api);
  hints.begin(scene.hints || [], () => {});
  return { scene, api, world, hints };
}

// advance a chain in dependency order up to and including `target`
function advanceTo(api, target) {
  const ch = api._chain; let guard = 0;
  while (guard++ < 200) {
    if (ch.done(target)) break;
    const cur = ch.current(); if (!cur) break;
    ch.advance(cur);
    if (cur === target) break;
  }
}

// ---- S9: post-sync checkpoint ----
{
  const cap = {};
  const a = build('s09_repair', cap);
  advanceTo(a.api, 'sync');
  check('s9 chain reached sync', a.api._chain.done('sync'));
  check('s9 checkpoint captured at sync', cap.cp && cap.cp.milestone === 'sync');
  const b = build('s09_repair', null);
  b.scene.restoreCheckpoint(b.api, cap.cp);
  check('s9 restore: sync done', b.api._chain.done('sync'));
  check('s9 restore: turnstile reachable', b.api._chain.ready('turnstile'));
  check('s9 restore: turnstile not yet done', !b.api._chain.done('turnstile'));
  // continue solving from restore to completion
  advanceTo(b.api, 'ship');
  check('s9 restore: scene still completable', b.api._chain.done('ship'));
}

// ---- S11: per-chamber checkpoint (chamber 3 complete) ----
{
  const cap = {};
  const a = build('s11_lighthouse', cap);
  advanceTo(a.api, 'c3_p3');
  check('s11 chain reached c3_p3', a.api._chain.done('c3_p3'));
  check('s11 checkpoint captured at c3', cap.cp && cap.cp.milestone === 'c3');
  const b = build('s11_lighthouse', null);
  b.scene.restoreCheckpoint(b.api, cap.cp);
  check('s11 restore: c3_p3 done', b.api._chain.done('c3_p3'));
  check('s11 restore: c4_hoist reachable', b.api._chain.ready('c4_hoist'));
  check('s11 restore: boathook back in hand', b.world.carry && b.world.carry.entity.id === 'c0_hook');
  // continue: c4_pry needs the hook in carry — advance and confirm it clears
  advanceTo(b.api, 'c4_pry');
  check('s11 restore: c4_pry clears with restored hook', b.api._chain.done('c4_pry'));
}

// ---- S8: permanent-lockout checkpoint ----
{
  const cap = {};
  const a = build('s08_scrapyard', cap);
  advanceTo(a.api, 'lockout');
  check('s8 chain reached lockout', a.api._chain.done('lockout'));
  check('s8 checkpoint captured at lockout', cap.cp && cap.cp.milestone === 'lockout');
  const b = build('s08_scrapyard', null);
  b.scene.restoreCheckpoint(b.api, cap.cp);
  check('s8 restore: lockout done', b.api._chain.done('lockout'));
  check('s8 restore: gate reachable', b.api._chain.ready('gate'));
  check('s8 restore: belt locked out', b.scene.lockedOut === true);
  advanceTo(b.api, 'ship');
  check('s8 restore: scene still completable', b.api._chain.done('ship'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
