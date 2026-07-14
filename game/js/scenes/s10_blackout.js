// scenes/s10_blackout.js — THE BLACKOUT ROAD (8-step chain). The lamp discovery
// stays sacred; the road becomes a resource route. Press L (untelegraphed) → your
// lamp drains, so top it up at a charge point → take the truck keys from the porch
// man's mailbox → unlock the utility truck → take the hex crank → crank the cutoff
// to kill the downed line → KEEP the crank and wind down the harbor bridge → cross
// to the lighthouse (§S10). Dark = slow, never harmful.
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's10_blackout', name: 'The Blackout Road', palette: 'blackout', roomTone: 'blackout',
    statedTask: 'Get through the dark.',
    hints: {
      lamp: ['s10_lamp_1', 's10_lamp_2', 's10_lamp_3'],
      recharge: ['s10_recharge_1', 's10_recharge_2', 's10_recharge_3'],
      mailkey: ['s10_mailkey_1', 's10_mailkey_2', 's10_mailkey_3'],
      truckunlock: ['s10_truckunlock_1', 's10_truckunlock_2', 's10_truckunlock_3'],
      crank: ['s10_crank_1', 's10_crank_2', 's10_crank_3'],
      cutoff: ['s10_cutoff_1', 's10_cutoff_2', 's10_cutoff_3'],
      bridge: ['s10_bridge_1', 's10_bridge_2', 's10_bridge_3'],
      cross: ['s10_cross_1', 's10_cross_2', 's10_cross_3'],
    },

    build(api) {
      this._lampLit = false;
      const roadBase = P.box(16.4, 0.12, 48.4, 0x030409, { rough: 1, edges: false }); api.prop(roadBase, 0, -0.07, -17);
      const roadFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 48), P.mat(0x0c0d14, { rough: 1 }));
      roadFloor.rotation.x = -Math.PI / 2; api.prop(roadFloor, 0, 0, -17);
      api.bounds(-7, 7, -40, 6);
      api.setAmbient(0.22);
      api.world.lampDrains = true; api.world.lampBattery = 1;
      api.world.lampDrainScale = api.assist ? 1.5 : 1;
      api.world.darkMoveScale = api.assist ? 0.75 : 0.55;

      // roadside houses — varied silhouettes (pitched roofs, heights, the odd lit
      // window) so the dark reads as a street with landmarks, not a tunnel of boxes
      for (let i = 0; i < 9; i++) {
        const z = 2 - i * 4;
        for (const side of [-1, 1]) {
          const h = 2.2 + ((i * 7 + (side > 0 ? 3 : 0)) % 3) * 0.9;
          api.prop(P.box(3, h, 3, 0x14141c), side * 5.5, h / 2, z);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.2, 4), P.mat(0x0f0f16, { edges: false }));
          roof.rotation.y = Math.PI / 4; P.addEdges(roof); api.prop(roof, side * 5.5, h + 0.55, z);
          if ((i + (side > 0 ? 1 : 0)) % 3 === 0) {
            const win = P.box(0.5, 0.6, 0.06, 0x1a1a22, { emissive: 0x7a5f2a, emissiveIntensity: 0.6, edges: false });
            api.prop(win, side * (5.5 - 1.52), h * 0.55, z);
          }
        }
      }
      // the lighthouse itself, a pale silhouette on the far shore — the destination
      const lhTower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 6, 12), P.mat(0x1a1c26, { edges: false }));
      P.addEdges(lhTower); api.prop(lhTower, 0, 3, -38);
      const lhCap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 12), P.mat(0x14161f, { edges: false })); api.prop(lhCap, 0, 6.6, -38);
      const lhGlow = P.glowSprite(0xffe3a8); lhGlow.position.set(0, 5.7, -38); lhGlow.material.opacity = 0.35; lhGlow.scale.setScalar(1.6); api.group.add(lhGlow); this._lhGlow = lhGlow;
      const man = P.human(0x3a3a4a); api.prop(man, 4, 0, 3);
      api.npcIdle(man, { phase: 2.8, sway: 0.018 });
      api.narrator.say('s10_intro', { category: 'STORY' });
      api.narrator.say('porchman_1', { category: 'VOICE' });

      // road map (shows both charge points) — a wayfinding sign on a post at the stop
      api.postSign('ROAD MAP\n⚡ porch   ⚡ substation', -4, 3.5, 1.4, 0.44, { bg: '#12141f', fg: '#8fb0ff', signY: 1.5 });

      // recharge points
      const porchOutlet = P.box(0.4, 0.4, 0.2, 0x2a3050, { emissive: 0x1a2a5a }); api.prop(porchOutlet, 3, 0.6, 4.4);
      const substation = P.box(0.8, 1.2, 0.6, 0x2a3050, { emissive: 0x1a2a5a }); api.prop(substation, -5, 0.7, -8); api.nav.addBox(-5, -8, 0.8, 0.6);

      // downed line barrier (full width)
      this._barrier = api.door(0, -14, 14, 0.5, 0x2a1a0a, 0.7);
      const spark = P.glowSprite(0x8fb0ff); spark.position.set(0, 0.6, -14); spark.material.opacity = 0.6; api.group.add(spark); this._spark = spark;

      // cutoff (hex socket, needs crank)
      const cutoff = P.items.cutoffBox(0x3a4256, 0xd94040); api.prop(cutoff, -4.6, 0.55, -12);
      api.prop(P.labelPlaque('UTILITY CUTOFF\n(hex socket)', 0.9, 0.4, { bg: '#3a4256', fg: '#ffd777' }), -4.6, 1.5, -11.7);

      // porch man's mailbox (flag up) → truck keys
      const mailbox = P.items.mailbox(0x6a5a4a); api.prop(mailbox, 5, 1.0, 2.5);

      // stalled utility truck (up a side lane) → crank
      const truck = P.box(1.6, 1.2, 3, 0x3a3a44); api.prop(truck, -5.5, 0.6, -3); api.nav.addBox(-5.5, -3, 1.6, 3);
      api.mountSign(truck, 'UTILITY', 0.6, 0.16, [0, 0.15, 1.52], { bg: '#3a3a44', fg: '#cde' });

      // harbor bridge (up) + winch (same hex socket) at the far south
      this._bridge = api.door(0, -30, 10, 0.5, 0x2a2a3a, 1.2);
      const winch = P.items.cutoffBox(0x3a4256, 0xffd777); api.prop(winch, 3, 0.5, -28);
      api.prop(P.labelPlaque('BRIDGE WINCH\n(hex socket)', 0.9, 0.4, { bg: '#3a4256', fg: '#ffd777' }), 3, 1.3, -27.7);

      const ch = api.chain([
        { name: 'lamp', clue: null, beat: 's10_light' },
        { name: 'recharge', after: ['lamp'], clue: porchOutlet },
        { name: 'mailkey', clue: mailbox, beat: 's10_step_mailkey' },
        { name: 'truckunlock', after: ['mailkey'], clue: truck },
        { name: 'crank', after: ['truckunlock'], clue: truck, beat: 's10_step_crank' },
        { name: 'cutoff', after: ['crank', 'lamp'], clue: cutoff, onAdvance: (a) => {
          this._barrier.userData.open(); this._spark.material.opacity = 0;
          a.narrator.saySequence([
            { id: 's10_cut', opts: { category: 'STORY' } },
            { id: 'porchman_2', opts: { category: 'VOICE' } },
          ]);
        } },
        { name: 'bridge', after: ['cutoff'], clue: winch, beat: 's10_step_bridge', onAdvance: () => { this._bridge.userData.open(); } },
        { name: 'cross', after: ['bridge'], clue: null },
      ]);
      this._ch = ch;

      // recharge points
      const rechargeUse = (mesh, x, y, z) => api.use({ id: 'recharge_' + x, mesh, pos: new THREE.Vector3(x, y, z), reach: 2, prompt: 'charge your lamp here',
        available: () => ch.ready('recharge') || (ch.done('recharge')),
        onUse: (a) => { a.world.lampBattery = 1; a.world.rechargeLamp(0); a.audio.sfx('lamp_on'); a.ui.setBatteryArc(1); if (ch.ready('recharge')) ch.advance('recharge'); } });
      rechargeUse(porchOutlet, 3, 0.6, 4.4);
      rechargeUse(substation, -5, 0.7, -8);

      // mailbox → keys
      api.use({ id: 'mailbox', mesh: mailbox, pos: new THREE.Vector3(5, 0.7, 2.5), reach: 1.8, prompt: 'take the keys from the mailbox',
        available: () => ch.ready('mailkey'),
        onUse: (a) => { a.world.pickUp(this._keysEnt); ch.advance('mailkey'); } });
      const keys = P.items.key(0xc9a94a); keys.scale.setScalar(0.8); api.prop(keys, 5, 1.1, 2.5);
      this._keysEnt = api.use({ id: 'keys', mesh: keys, pos: keys.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the truck keys', available: () => ch.done('mailkey') && !ch.done('truckunlock') });

      // truck: unlock with keys → crank
      api.use({ id: 'truck', mesh: truck, pos: new THREE.Vector3(-5.5, 0.9, -3), reach: 2.2,
        prompt: () => ch.done('truckunlock') ? 'take the crank' : 'unlock the truck',
        available: () => ch.ready('truckunlock') || ch.ready('crank'),
        acceptCarry: (item, a) => { if (item.id === 'keys' && ch.ready('truckunlock')) { a.audio.sfx('unlock'); ch.advance('truckunlock'); return true; } return false; },
        onUse: (a) => { if (ch.ready('crank')) { a.world.pickUp(this._crankEnt); ch.advance('crank'); } } });
      const crank = P.items.crank(0xc9a94a); api.prop(crank, -5.5, 0.9, -3);
      this._crankEnt = api.use({ id: 'crank', mesh: crank, pos: crank.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the hex crank', available: () => ch.done('crank') && !ch.done('cross') });

      // cutoff — crank turns it (crank NOT consumed; you keep it)
      api.use({ id: 'cutoff', mesh: cutoff, pos: new THREE.Vector3(-4.6, 0.7, -12), reach: 2,
        prompt: () => 'crank the cutoff',
        available: () => ch.ready('cutoff'),
        onUse: (a) => {
          if (a.world.carry && a.world.carry.entity.id === 'crank') { a.audio.sfx('unlock'); a.resetWrong('s10_crank'); ch.advance('cutoff'); }
          else { a.audio.sfx('error'); a.narrator.say('s10_barehand', { category: 'REACT' }); a.wrongTry('s10_crank', 's10_crank_nudge', { after: 2 }); }
        } });

      // bridge winch — same crank, kept
      api.use({ id: 'winch', mesh: winch, pos: new THREE.Vector3(3, 0.6, -28), reach: 2,
        prompt: 'wind the bridge down',
        available: () => ch.ready('bridge'),
        onUse: (a) => {
          if (a.world.carry && a.world.carry.entity.id === 'crank') { a.audio.sfx('unlock'); a.resetWrong('s10_crank'); ch.advance('bridge'); }
          else { a.audio.sfx('error'); a.narrator.say('s10_barehand', { category: 'REACT' }); a.wrongTry('s10_crank', 's10_crank_nudge', { after: 2 }); }
        } });

      api.world.setLampKnown(true);
      api.ui.setLampGlyph('known');
      api.world.dust.position.set(0, 0, 4);
      api.setAnchors([{ cx: 0, cz: -6, dist: 15, minX: -7, maxX: 7, minZ: -40, maxZ: 6 }]);
    },

    update(dt, api) {
      if (api.solved) return;
      api.world.lampDrainScale = api.assist ? 1.5 : 1;
      api.world.darkMoveScale = api.assist ? 0.75 : 0.55;
      // the distant lighthouse beacon breathes faintly (ambient landmark)
      if (this._lhGlow && !api.world.reducedMotion) { this._t = (this._t || 0) + dt; this._lhGlow.material.opacity = 0.3 + Math.sin(this._t * 1.5) * 0.1; }
      if (api.world.lampOn && !this._lampLit) { this._lampLit = true; api.ui.setLampGlyph('on'); this._ch.advance('lamp'); }
      if (this._ch.ready('cross') && api.world.dust.position.z < -33) { api.narrator.say('s10_walk', { category: 'STORY' }); api.toast('The harbor. The lighthouse door stands open.'); this._ch.advance('cross'); api.solve(); }
    },
  };
}
