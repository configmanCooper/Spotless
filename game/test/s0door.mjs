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
import { CONFIG } from '../js/config.js';

const script = JSON.parse(fs.readFileSync(new URL('../js/narrator_script.json', import.meta.url)));
const stubUI = () => ({ showSub(){},hideSub(){},hideSubSoon(){},tick(){},setTask(){},setTrash(){},setBattery(){},setBatteryArc(){},setLampGlyph(){},setPrompt(){},setCleanRing(){},toast(){},fade(){},setSelfPrompt(){},setTaskDone(){} });
const stubAudio = () => ({ sfx(){},playVO(){return null;},stopVO(){},setRoomTone(){},resume(){},enabled:true });

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
const scene = makeSceneById('s00_party');
scene.build(api);

const R = CONFIG.DUST_RADIUS;
function blocked(x, z) {
  for (const o of nav.obstacles) if (x + R > o.minX && x - R < o.maxX && z + R > o.minZ && z - R < o.maxZ) return true;
  return false;
}
// BFS from Dust's start; returns true if any reached cell satisfies pred(x,z)
function canReach(pred) {
  const step = 0.2, seen = new Set();
  const key = (x, z) => `${Math.round(x/step)},${Math.round(z/step)}`;
  const start = world.dust.position;
  const q = [[start.x, start.z]]; seen.add(key(start.x, start.z));
  const b = nav.bounds; let head = 0;
  while (head < q.length) {
    const [x, z] = q[head++];
    if (pred(x, z)) return true;
    for (const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const nx=x+dx, nz=z+dz;
      if (nx<b.minX||nx>b.maxX||nz<b.minZ||nz>b.maxZ) continue;
      const k=key(nx,nz); if (seen.has(k)) continue;
      if (blocked(nx,nz)) continue;
      seen.add(k); q.push([nx,nz]);
    }
  }
  return false;
}
const southOfDoor = (x, z) => z < -5.2;               // past the closed doorway
const atExit = (x, z) => z < CONFIG.PARTY.EXIT_Z;     // the hidden road exit

let pass = 0, fail = 0;
const check = (n, c) => { if (c) pass++; else { fail++; console.log('  ✗ ' + n); } };

check('door starts closed (nav box present)', !!scene._outDoor && !scene._outDoor.userData._open);
check('outside is UNREACHABLE before trash is full (door blocks the way)', !canReach(southOfDoor));
check('dumpster entity exists', !!interact.entities.find(e => e.id === 'dumpster'));

// fill the bin and tick the scene once
world.canEmptyTrash = true; world.trash = 1.0;
scene.update(0.1, api);
// let the narrator process its queue so the 'once' host line is marked heard
for (let i = 0; i < 40; i++) narrator.update(0.2);

check('door OPENED once trash filled', scene._outDoor.userData._open === true);
check('outside is now REACHABLE (path south open)', canReach(southOfDoor));
check('host complained about tiny bin (host_trashfull heard)', narrator.getHeard().includes('host_trashfull'));
check('the road exit is reachable after the door opens', canReach(atExit));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

