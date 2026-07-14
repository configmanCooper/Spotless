import './shim.js';
import * as THREE from 'three';
import { Narrator } from '../js/narrator.js';
import { mat } from '../js/engine/props.js';
import { createApi } from '../js/scenes/kit.js';

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) pass++;
  else { fail++; console.log('  ✗ ' + name); }
}

const ui = { showSub() {}, hideSub() {}, hideSubSoon() {} };
const audio = { playVO() {}, stopVO() {} };
const script = {
  a: { text: 'A', category: 'STORY' },
  b: { text: 'B', category: 'STORY' },
  c: { text: 'C', category: 'STORY' },
};
const narrator = new Narrator({ ui, audio, script });
narrator.say('a');
narrator.say('b');
narrator.say('c');
check('equal-priority STORY lines remain FIFO', narrator.queue.map(x => x.id).join(',') === 'a,b,c');

const matte = mat(0x445566, { rough: 0.5, metal: 0 });
const metal = mat(0x445566, { rough: 0.5, metal: 1 });
const dim = mat(0x334455, { emissive: 0x112233, emissiveIntensity: 0.2 });
const bright = mat(0x334455, { emissive: 0x112233, emissiveIntensity: 1.4 });
const matteAgain = mat(0x445566, { rough: 0.5, metal: 0 });
check('material cache distinguishes metalness', matte !== metal && matte.metalness === 0 && metal.metalness === 1);
check('material cache distinguishes emissive intensity', dim !== bright && dim.emissiveIntensity === 0.2 && bright.emissiveIntensity === 1.4);
check('identical material options still share', matte === matteAgain);

const cancelled = new Narrator({ ui, audio, script });
cancelled.setHeard(['a']);
cancelled.saySequence(['a', 'b']);
cancelled.reset();
await new Promise(resolve => setTimeout(resolve, 350));
check('reset cancels deferred sequence continuation', cancelled.queue.length === 0 && cancelled.cur === null);

function makeApi() {
  const hints = { total: 0, progress() {}, setPool() {}, markSolved() {} };
  const core = {
    world: { dust: new THREE.Object3D() }, nav: { addBox() {}, removeBox() {}, setBounds() {} },
    interact: { add: (x) => x }, narrator, hints, audio: {}, ui: {},
    getCamera: () => null,
  };
  return { api: createApi(core, new THREE.Group(), () => {}), hints };
}
{
  const { api } = makeApi();
  let duplicate = false, unknown = false, cycle = false;
  try { api.chain(['a', 'a']); } catch { duplicate = true; }
  try { api.chain([{ name: 'a', after: ['missing'] }]); } catch { unknown = true; }
  try { api.chain([{ name: 'a', after: ['b'] }, { name: 'b', after: ['a'] }]); } catch { cycle = true; }
  check('chain validation rejects duplicate, unknown, and cyclic definitions', duplicate && unknown && cycle);
}
{
  const { api, hints } = makeApi();
  const ch = api.chain([{ name: 'a' }, { name: 'b', after: ['a'] }]);
  hints.total = 4; ch.advance('a');
  hints.total = 10; ch.advance('b');
  check('chain telemetry records per-step availability time', api._telemetry.stepTimes.a === 4 && api._telemetry.stepTimes.b === 6);
}
{
  const { api } = makeApi();
  const ch = api.chain([{ name: 'a' }, { name: 'b', after: ['a'] }]);
  const result = ch.restore(['a', 'removed_in_new_version']);
  check('checkpoint restore tolerates stale step names', ch.done('a') && result.ignored.includes('removed_in_new_version'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
