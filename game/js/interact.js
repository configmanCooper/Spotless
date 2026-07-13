// interact.js — the verb registry (§7). Every interactive thing is an entity:
//   { id, pos:Vector3, reach, getVerb(), getPrompt(), onUse(api), clean?:{...} }
// The registry finds the nearest in-reach entity and drives prompts + actions.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export class InteractRegistry {
  constructor() { this.entities = []; }
  clear() { this.entities.length = 0; }

  // add({ id, pos, reach, verb, prompt, onUse, clean, mesh, active }) → entity
  add(def) {
    const e = Object.assign({
      reach: CONFIG.INTERACT_REACH, active: true, _tmp: new THREE.Vector3(),
    }, def);
    if (!e.pos && e.mesh) e.pos = e.mesh.position;
    this.entities.push(e);
    return e;
  }
  remove(e) {
    const i = this.entities.indexOf(e);
    if (i >= 0) this.entities.splice(i, 1);
  }

  // nearest active entity within its reach of Dust
  nearest(dustPos) {
    let best = null, bestD = Infinity;
    for (const e of this.entities) {
      if (!e.active) continue;
      if (e.available && !e.available()) continue;
      const p = e.pos || (e.mesh && e.mesh.position);
      if (!p) continue;
      const d = (p.x - dustPos.x) ** 2 + (p.z - dustPos.z) ** 2;
      const reach = (e.clean ? (e.reachClean ?? CONFIG.CLEAN_REACH) : e.reach);
      if (d <= reach * reach && d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  promptFor(e, api) {
    if (!e) return null;
    if (typeof e.prompt === 'function') return e.prompt(api);
    if (e.clean) return e.prompt || 'Hold to clean';
    return e.prompt || 'Interact';
  }
}
