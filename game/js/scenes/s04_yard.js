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
      api.floor(18, 0x28301f);
      api.bounds(-8, 8, -8, 8);
      api.fx.motes({ count: 40, area: [16, 5, 16], center: [0, 3, 0], color: 0xcaa060, opacity: 0.14, size: 0.05 });
      // the tree (the canopy sways in the wind and calms as Dust stands still)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 3, 8), P.mat(0x5a4632));
      api.prop(trunk, 0, 1.5, -2); api.nav.addBox(0, -2, 0.8, 0.8);
      this._canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), P.mat(0x6a7a3a));
      api.prop(this._canopy, 0, 4, -2);
      // porch with posts + rail, and a picket fence along the yard edge (detail)
      const porch = P.box(3, 0.4, 2, 0x6a5a44); api.prop(porch, 6, 0.2, 4);
      for (const px of [4.7, 7.3]) { api.prop(P.box(0.16, 1.6, 0.16, 0x5a4a38), px, 1.0, 3.2); }
      api.prop(P.box(2.9, 0.12, 0.12, 0x5a4a38), 6, 1.7, 3.2);   // porch rail
      api.prop(P.box(1.2, 0.9, 0.1, 0x4a3d2e), 6, 0.65, 5);      // porch door
      for (let i = 0; i < 14; i++) { const picket = P.box(0.12, 0.8, 0.08, 0x7a6a52); api.prop(picket, -7 + i * 1.0, 0.4, 7.6); }
      api.prop(P.box(14, 0.1, 0.1, 0x6a5a42), 0, 0.7, 7.6);      // fence rail
      // a soft cloud shadow that drifts across the yard
      this._cloud = new THREE.Mesh(new THREE.CircleGeometry(5, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }));
      this._cloud.rotation.x = -Math.PI / 2; this._cloud.position.y = 0.02; this._cloud.renderOrder = -1; api.group.add(this._cloud);
      const neighbor = P.human(0x7a6a5a); api.prop(neighbor, 6, 0.4, 4);
      api.npcIdle(neighbor, { phase: 1.2, sway: 0.018 });

      // wind strength: full while the player fusses, easing toward calm as Dust
      // holds still — the environment itself is the confirmation (plan §S4)
      this._wind = 1;

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
      this._anchor = { cx: 0, cz: 0, dist: 15 };
      api.setAnchors([this._anchor]);
      api.narrator.say('s4_intro', { category: 'STORY' });
      api.narrator.say('neighbor_1', { category: 'VOICE' });
    },

    update(dt, api) {
      if (api.solved) return;
      this._t = (this._t || 0) + dt;
      // wind eases toward calm the longer Dust holds still; ramps back up if he fusses
      const targetWind = Math.max(0.12, 1 - this._stillT / STILL_TARGET);
      this._wind += (targetWind - this._wind) * Math.min(1, dt * 0.8);

      // wind keeps shedding leaves — but slower as the yard calms (confirmation)
      this._spawnT += dt;
      if (this._spawnT > 1.4 / Math.max(0.15, this._wind)) { this._spawnT = 0; this._spawnLeaf(api); }
      this._barkT += dt;
      // Silence the neighbor once the player commits to stillness (plan §1 silence).
      if (this._barkT > 12 && this._stillT < 2 && !this._still1) { this._barkT = 0; api.narrator.say('neighbor_1', { category: 'VOICE' }); }

      // environmental motion scales with wind: canopy sway, drifting cloud shadow
      if (!api.world.reducedMotion) {
        if (this._canopy) { this._canopy.rotation.z = Math.sin(this._t * 1.6) * 0.06 * this._wind; this._canopy.position.x = Math.sin(this._t * 1.1) * 0.15 * this._wind; }
        if (this._cloud) { this._cloud.position.x = Math.sin(this._t * 0.15) * 7; this._cloud.position.z = -2 + Math.cos(this._t * 0.12) * 4; this._cloud.material.opacity = 0.16 * this._wind; }
      }

      const p = api.world.dust.position;
      const moved = p.distanceTo(this._last); this._last.copy(p);
      const nearTree = Math.hypot(p.x - 0, p.z - (-2)) < 3.2;

      if (nearTree && moved < 0.02) {
        this._stillT += dt;
        // the camera slowly widens into a quiet frame as stillness deepens
        if (this._anchor) this._anchor.dist = Math.min(20, this._anchor.dist + dt * 0.4);
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
        if (this._anchor) this._anchor.dist = Math.max(15, this._anchor.dist - dt * 0.8);
      }
    },
  };
}
