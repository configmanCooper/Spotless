// scenes/s04_yard.js — THE YARD IN THE WIND (breather). Stated: bag the leaves.
// REAL: do nothing — stand still under the tree for ~60s (§4 S4). The game
// teaching that its own verbs are optional.
import { THREE, P } from './kit.js';

const STILL_TARGET = 60;

export default function makeScene() {
  return {
    id: 's04_yard', name: 'The Yard', palette: 'yard', roomTone: 'wind',
    statedTask: 'Bag the leaves before the storm.',
    hints: ['s4_h1', 's4_h2', 's4_h3'],

    build(api) {
      api.floor(40, 0x28301f);
      api.bounds(-8, 8, -8, 8);
      // the tree
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 3, 8), P.mat(0x5a4632));
      api.prop(trunk, 0, 1.5, -2); api.nav.addBox(0, -2, 0.8, 0.8);
      const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), P.mat(0x6a7a3a));
      api.prop(canopy, 0, 4, -2);
      // porch + neighbor
      const porch = P.box(3, 0.4, 2, 0x6a5a44); api.prop(porch, 6, 0.2, 4);
      const neighbor = P.human(0x7a6a5a); api.prop(neighbor, 6, 0.4, 4);

      // falling leaves (futile to bag — respawn faster than cleared)
      this._leaves = [];
      this._spawnLeaf = (a) => {
        if (this._leaves.length > 12) return;
        const l = P.mess('leaf', 0xd08a3a);
        const x = -4 + Math.random() * 8, z = -5 + Math.random() * 6;
        a.prop(l, x, 0.14, z);
        const e = a.clean({
          id: 'leaf_' + Math.random().toString(36).slice(2, 6), mesh: l, pos: l.position,
          trashAmount: 0.02, onClean: (aa, ent) => { const i = this._leaves.indexOf(ent); if (i >= 0) this._leaves.splice(i, 1); aa.fakeTaskBeat(); },
        });
        this._leaves.push(e);
      };
      for (let i = 0; i < 8; i++) this._spawnLeaf(api);
      this._spawnT = 0; this._barkT = 0;
      this._stillT = 0; this._last = new THREE.Vector3();
      this._last.copy(api.world.dust.position);

      api.world.dust.position.set(0, 0, 3);
      api.setAnchors([{ cx: 0, cz: 0, dist: 15 }]);
      api.narrator.say('s4_intro', { category: 'STORY' });
      api.narrator.say('neighbor_1', { category: 'VOICE' });
    },

    update(dt, api) {
      if (api.solved) return;
      // wind keeps shedding leaves
      this._spawnT += dt;
      if (this._spawnT > 1.4) { this._spawnT = 0; this._spawnLeaf(api); }
      this._barkT += dt;
      // Silence the neighbor once the player commits to stillness (plan §1 silence).
      if (this._barkT > 12 && this._stillT < 2 && !this._still1) { this._barkT = 0; api.narrator.say('neighbor_1', { category: 'VOICE' }); }

      const p = api.world.dust.position;
      const moved = p.distanceTo(this._last); this._last.copy(p);
      const nearTree = Math.hypot(p.x - 0, p.z - (-2)) < 3.2;

      if (nearTree && moved < 0.02) {
        this._stillT += dt;
        if (this._stillT > 3 && !this._still1) { this._still1 = true; api.narrator.say('s4_still', { category: 'STORY' }); }
        if (this._stillT > 10 && !this._still15) { this._still15 = true; api.hints.progress(); api.narrator.say('s4_ontrack', { category: 'STORY' }); }
        if (this._stillT > STILL_TARGET) {
          api.hints.progress();
          api.narrator.say('s4_still2', { category: 'STORY' });
          api.toast('The wind eases. It is time to walk on.');
          api.solve();
        }
      } else {
        this._stillT = Math.max(0, this._stillT - dt * 2);
      }
    },
  };
}
