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
const stubUI = () => ({ showSub(){},hideSub(){},hideSubSoon(){},tick(){},setTask(){},setTrash(){},setBattery(){},setBatteryArc(){},setLampGlyph(){},setPrompt(){},setCleanRing(){},toast(){},fade(){},setSelfPrompt(){},setTaskDone(){} });
const stubAudio = () => ({ sfx(){},playVO(){return null;},stopVO(){},setRoomTone(){},resume(){},enabled:true });

function build(id) {
  const threeScene = new THREE.Scene();
  const nav = new Nav(); const interact = new InteractRegistry();
  const ui = stubUI(); const audio = stubAudio();
  const narrator = new Narrator({ ui, audio, script });
  const settings = { hints: 'normal', subs: true };
  const hints = new Hints({ narrator, settings });
  const world = new World({ scene: threeScene, nav, interact, ui, narrator, audio });
  const group = new THREE.Group(); threeScene.add(group);
  const core = { world, nav, interact, narrator, hints, audio, ui, settings, getCamera: () => null,
    setAnchors(){}, setAmbient(){}, onCredits(){}, setSpatialSource(){}, setExposureScale(){}, cameraBeat(){}, examine(){}, checkpoint(){},
    memory: { get: () => undefined, set: () => {} } };
  const api = createApi(core, group, () => {});
  const scene = makeSceneById(id);
  scene.build(api);
  return { scene, api, world, nav, interact, group };
}

const R = CONFIG.DUST_RADIUS;
function blockedR(nav, x, z, r) {
  for (const o of nav.obstacles) if (x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ) return true;
  if (nav.bounds) { if (x < nav.bounds.minX + r || x > nav.bounds.maxX - r || z < nav.bounds.minZ + r || z > nav.bounds.maxZ - r) return true; }
  return false;
}
function reachSetR(nav, start, step, box, r) {
  const key = (x, z) => `${Math.round(x/step)},${Math.round(z/step)}`;
  const seen = new Map(); const q = [];
  let s = null;
  for (let rr = 0; rr <= 2 && !s; rr += step) {
    for (let ang = 0; ang < Math.PI*2; ang += 0.5) {
      const x = start.x + Math.cos(ang)*rr, z = start.z + Math.sin(ang)*rr;
      if (!blockedR(nav, x, z, r)) { s = { x, z }; break; }
    }
    if (rr === 0 && !blockedR(nav, start.x, start.z, r)) s = { x: start.x, z: start.z };
  }
  if (!s) return { seen, startFree: false };
  q.push([s.x, s.z]); seen.set(key(s.x, s.z), [s.x, s.z]);
  const dirs = [[step,0],[-step,0],[0,step],[0,-step]];
  let head = 0;
  while (head < q.length) {
    const [x, z] = q[head++];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      if (nx < box.minX || nx > box.maxX || nz < box.minZ || nz > box.maxZ) continue;
      const k = key(nx, nz);
      if (seen.has(k)) continue;
      if (blockedR(nav, nx, nz, r)) continue;
      seen.set(k, [nx, nz]); q.push([nx, nz]);
    }
  }
  return { seen, startFree: true };
}
function minDistToReach(seen, pos) {
  let best = Infinity;
  for (const [, [x, z]] of seen) { const d = Math.hypot(x - pos.x, z - pos.z); if (d < best) best = d; }
  return best;
}

const MARGIN = 0.14;   // a comfortable-clearance pass: corridors must fit R+MARGIN
let totalProblems = 0, totalTight = 0;
for (const S of SCENES) {
  const h = build(S.id);
  if (S.id === 's01_showroom') {
    const b = h.nav.bounds || { minX: -12, maxX: 12, minZ: -14, maxZ: 12 };
    const closed = reachSetR(h.nav, h.world.dust.position.clone(), 0.2, b, R);
    for (const id of ['breaker', 'dispenser']) {
      const e = h.interact.entities.find(x => x.id === id);
      const pos = e.pos || e.mesh.position;
      const reach = e.reach ?? CONFIG.INTERACT_REACH;
      if (minDistToReach(closed.seen, pos) <= reach + R) {
        console.log(`\n✗ ${S.id}: '${id}' reachable before staff door opens`);
        totalProblems++;
      }
    }
  }
  h.group.traverse(o => { if (o.userData && o.userData.open && o.userData.navBox) { h.nav.removeBox(o.userData.navBox); } });
  const b = h.nav.bounds || { minX: -12, maxX: 12, minZ: -14, maxZ: 12 };
  const box = { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
  const start = h.world.dust.position.clone();
  const pass = reachSetR(h.nav, start, 0.2, box, R);
  const tightPass = reachSetR(h.nav, start, 0.2, box, R + MARGIN);
  const problems = [], tight = [];
  if (!pass.startFree) problems.push(`START (${start.x.toFixed(1)},${start.z.toFixed(1)}) is inside an obstacle`);
  for (const e of h.interact.entities) {
    const pos = e.pos || (e.mesh && e.mesh.position); if (!pos) continue;
    const reach = (e.clean ? (e.reachClean ?? CONFIG.CLEAN_REACH) : (e.reach ?? CONFIG.INTERACT_REACH));
    const d = minDistToReach(pass.seen, pos);
    if (d > reach + R) problems.push(`'${e.id}' at (${pos.x.toFixed(1)},${pos.z.toFixed(1)}) unreachable: nearest free=${d.toFixed(2)} > reach=${reach}`);
    else { const dt = minDistToReach(tightPass.seen, pos); if (dt > reach + R) tight.push(`'${e.id}' at (${pos.x.toFixed(1)},${pos.z.toFixed(1)}) only reachable through a tight (<${(MARGIN*2).toFixed(2)}) squeeze`); }
  }
  if (S.id === 's00_party') {
    let rExit = false, rExitTight = false;
    for (const [, [, z]] of pass.seen) if (z < CONFIG.PARTY.EXIT_Z) rExit = true;
    for (const [, [, z]] of tightPass.seen) if (z < CONFIG.PARTY.EXIT_Z) rExitTight = true;
    if (!rExit) problems.push(`EXIT unreachable (need z < ${CONFIG.PARTY.EXIT_Z})`);
    else if (!rExitTight) tight.push(`EXIT only reachable through a tight squeeze`);
  }
  totalProblems += problems.length; totalTight += tight.length;
  if (problems.length || tight.length) {
    console.log(`\n${problems.length ? '✗' : '⚠'} ${S.id}:`);
    for (const p of problems) console.log('   ✗ ' + p);
    for (const p of tight) console.log('   ⚠ ' + p);
  } else console.log(`✓ ${S.id}`);
}
console.log(`\n${totalProblems === 0 ? 'NAV OK' : totalProblems + ' NAV PROBLEM(S)'}${totalTight ? ' — ' + totalTight + ' tight-corridor warning(s)' : ''}`);
process.exit(totalProblems ? 1 : 0);
