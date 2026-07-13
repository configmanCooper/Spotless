// scenes/s09_repair.js — THE REPAIR SHOP (14-step identity heist). Bay 2's "sync"
// is a memory wipe. Build a fake you and ship yourself out. Discover what SYNC does
// → take the refurb unit's ID chip → grind its notch to fit → slot it in the vacuum
// → peel your OWN barcode (R) onto the vacuum (you'll pay for this later) → load two
// ballast weights → move the OPEN-sign fuse into Bay 1 → charge the vacuum → stamp &
// file the work order → dock the vacuum on Bay 2 → the exit turnstile no longer
// knows you → take the cage key from the tech's coat → open the parts hatch →
// climb in and ship yourself out as freight (§S9).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's09_repair', name: 'The Repair Shop', palette: 'repair', roomTone: 'room',
    statedTask: 'Dock on Bay 2 for your overnight sync.',
    hints: {
      discover: ['s9_discover_1', 's9_discover_2', 's9_discover_3'],
      chip: ['s9_chip_1', 's9_chip_2', 's9_chip_3'],
      grind: ['s9_grind_1', 's9_grind_2', 's9_grind_3'],
      chipin: ['s9_chipin_1', 's9_chipin_2', 's9_chipin_3'],
      barcode: ['s9_barcode_1', 's9_barcode_2', 's9_barcode_3'],
      ballast1: ['s9_ballast1_1', 's9_ballast1_2', 's9_ballast1_3'],
      ballast2: ['s9_ballast2_1', 's9_ballast2_2', 's9_ballast2_3'],
      signfuse: ['s9_signfuse_1', 's9_signfuse_2', 's9_signfuse_3'],
      charge: ['s9_charge_1', 's9_charge_2', 's9_charge_3'],
      paperwork: ['s9_paperwork_1', 's9_paperwork_2', 's9_paperwork_3'],
      sync: ['s9_sync_1', 's9_sync_2', 's9_sync_3'],
      turnstile: ['s9_turnstile_1', 's9_turnstile_2', 's9_turnstile_3'],
      cagekey: ['s9_cagekey_1', 's9_cagekey_2', 's9_cagekey_3'],
      openhatch: ['s9_openhatch_1', 's9_openhatch_2', 's9_openhatch_3'],
      ship: ['s9_ship_1', 's9_ship_2', 's9_ship_3'],
    },

    build(api) {
      this.bay1Fused = false; this.cageOpen = false;
      api.floor(36, 0x1c2320);
      api.bounds(-11, 11, -8, 8);
      api.fx.motes({ count: 60, area: [20, 5, 14], center: [0, 2.3, 0], color: 0xbfe0d4, opacity: 0.18, size: 0.05 });
      api.wall(0, -8, 24, 0.3, 0x2a322e); api.wall(-11, 0, 0.3, 16, 0x2a322e); api.wall(11, 0, 0.3, 16, 0x2a322e);

      // Bay 1 / Bay 2 + posters (bay signs stand on posts beside the pads)
      const bay1 = P.box(1.4, 0.2, 1.4, 0x3a4a44); api.prop(bay1, -3, 0.1, -4);
      api.postSign('BAY 1\nDIAGNOSTIC', -3.9, -4.8, 0.8, 0.34, { bg: '#3a4a44', fg: '#cde', signY: 1.3 });
      const bay2 = P.box(1.4, 0.2, 1.4, 0x4a3a3a); api.prop(bay2, 3, 0.1, -4);
      api.postSign('BAY 2\nSYNC', 2.1, -4.8, 0.8, 0.34, { bg: '#4a3a3a', fg: '#fdd', signY: 1.3 });
      const poster = P.labelPlaque('SYNC = RESTORE\nFACTORY STATE', 1.4, 0.5, { bg: '#e8dcd0', fg: '#6a2a2a' }); api.prop(poster, 5.5, 1.8, -6.7);
      // live Bay-2 checklist: five lamps that turn green as each requirement is met
      // (plan §2 state feedback) — replaces the old static "remember six conditions" sign
      const checkPanel = P.box(2.6, 0.7, 0.12, 0x2a2622); api.prop(checkPanel, 3, 1.15, -6.75);
      api.prop(P.labelPlaque('BAY 2 CHECK', 1.1, 0.2, { bg: '#2a2622', fg: '#e8dcd0', edges: false }), 3, 1.5, -6.68);
      this._checkLamps = [];
      const checkDefs = [
        ['ID', () => this._vacEnt && this._vacEnt.hasChip],
        ['WEIGHT', () => this._vacEnt && this._vacEnt.ballast >= 2],
        ['POWER', () => this._vacEnt && this._vacEnt.charged],
        ['CODE', () => this._vacEnt && this._vacEnt.hasBarcode],
        ['PAPER', () => this._ch && this._ch.done('paperwork')],
      ];
      checkDefs.forEach(([label, test], i) => {
        const x = 3 + (i - 2) * 0.5;
        const lamp = P.box(0.16, 0.16, 0.06, 0x552222, { emissive: 0x3a0808, emissiveIntensity: 0.8, edges: false });
        api.prop(lamp, x, 1.2, -6.68);
        api.prop(P.labelPlaque(label, 0.46, 0.16, { bg: '#2a2622', fg: '#b7ad9e', edges: false }), x, 0.98, -6.66);
        this._checkLamps.push({ lamp, test, on: false });
      });

      // refurb unit + chip, service card, bench grinder
      const shelf = P.box(2, 0.2, 0.8, 0x3a3a34); api.prop(shelf, 6, 1.4, 2);
      const refurb = P.robot({ body: 0xbfc4b8 }).group; refurb.scale.setScalar(0.6); api.prop(refurb, 6, 1.5, 2);
      api.prop(P.labelPlaque('MEMORY CLEARED ✓', 1, 0.24, { bg: '#dfe4d8', fg: '#2a2a24' }), 6, 2.3, 2);
      const chip = P.items.chip(0x2a7a3a); api.prop(chip, 5.4, 1.65, 2);
      api.prop(P.labelPlaque('PORT KEY: ◣', 0.7, 0.24, { bg: '#33403a', fg: '#9ad' }), 8, 1.2, 1);
      const grinder = P.box(0.6, 0.5, 0.5, 0x555555, { metal: 0.5 }); api.prop(grinder, 8, 0.9, 3); api.nav.addBox(8, 3, 0.6, 0.5);
      api.mountSign(grinder, 'BENCH GRINDER', 0.7, 0.16, [0, 0.15, 0.27], { bg: '#33403a', fg: '#cde' });

      // the shop vacuum (drop-target + pickable) with a port
      const vac = P.items.vacuum(0x6a7a72); api.prop(vac, -1, 0.4, 3); this._vac = vac;
      const port = P.box(0.12, 0.12, 0.08, 0x2ad0c0, { emissive: 0x0a3a34 }); port.position.set(0, 0.1, 0.26); vac.add(port);

      // ballast, OPEN sign, work order + stamp + log tray, tech coat + cage + hatch
      const ballastBox = P.box(0.6, 0.4, 0.6, 0x4a4a4a); api.prop(ballastBox, -6, 0.3, 4);
      const sign = P.box(1.2, 0.5, 0.15, 0x2a8a4a, { emissive: 0x0a3a1a }); api.prop(sign, -9, 1.6, -3); api.nav.addBox(-9, -3, 0.3, 0.3);
      api.prop(P.labelPlaque('OPEN', 0.8, 0.3, { bg: '#2a8a4a', fg: '#fff' }), -9, 1.6, -2.85);
      const order = P.items.paper(0xf0ead2); api.prop(order, 8, 0.9, -3); api.nav.addBox(8, -3, 0.5, 0.5);
      api.postSign('WORK ORDER', 8, -3.6, 0.7, 0.2, { bg: '#e8dcc0', fg: '#4a3a20', signY: 1.2 });
      const stampBoard = P.box(0.6, 0.9, 0.1, 0x33302a); api.prop(stampBoard, 9.5, 1.2, -2);
      api.mountSign(stampBoard, 'AUTH STAMP', 0.66, 0.2, [0, 0.6, 0.07], { bg: '#33302a', fg: '#e8c94a' });
      const logtray = P.box(1, 0.1, 0.7, 0x6a6a5a); api.prop(logtray, 9.5, 0.6, -4); api.nav.addBox(9.5, -4, 1, 0.7);
      api.postSign('LOG TRAY', 9.5, -4.7, 0.62, 0.2, { bg: '#6a6a5a', fg: '#1a1a1a', signY: 1.0 });

      // coat RACK (empty at first) — the tech hangs his coat here after he arrives
      const rackPole = P.box(0.1, 1.6, 0.1, 0x4a4030); api.prop(rackPole, -8.2, 0.8, 4.8);
      const rackTop = P.box(0.7, 0.1, 0.1, 0x4a4030); api.prop(rackTop, -8.2, 1.55, 4.8);
      const coatMesh = P.items.coat(0x3a4a5a); coatMesh.visible = false; api.prop(coatMesh, -8.2, 1.0, 4.9); this._coatMesh = coatMesh;
      // the tech (off to one side by the exit, hidden until he walks in)
      const tech = P.human(0x6a6a72); tech.visible = false; api.prop(tech, 0, 0, 8.2); this._tech = tech;
      this._techStep = -1; this.coatHung = false;

      const turnstile = P.box(0.6, 1.2, 0.6, 0x555a55, { emissive: 0x0a0e0a }); api.prop(turnstile, 0, 0.6, 7.7);
      api.mountSign(turnstile, 'EXIT — SCAN CHASSIS', 1.2, 0.2, [0, 0.5, -0.32], { bg: '#555a55', fg: '#cde', rot: [0, Math.PI, 0] });
      const cage = api.door(9.5, 6, 2, 0.3, 0x3a3a34, 1.8);
      const hatch = P.box(1, 1, 0.4, 0x2a2a24, { emissive: 0x080808 }); api.prop(hatch, 9.5, 0.6, 7.5); this._hatchMesh = hatch;
      api.mountSign(hatch, 'PARTS OUT →', 0.9, 0.2, [0, 0.65, 0.21], { bg: '#2a2a24', fg: '#cde' });

      const ch = api.chain([
        { name: 'discover', clue: poster, beat: 's9_step_discover' },
        { name: 'chip', after: ['discover'], clue: chip },
        { name: 'grind', after: ['chip'], clue: grinder, beat: 's9_step_grind' },
        { name: 'chipin', after: ['grind'], clue: vac },
        { name: 'barcode', after: ['chipin'], clue: vac, beat: 's9_step_barcode', onAdvance: (a) => a.memory.set('gaveBarcode', true) },
        { name: 'ballast1', after: ['chipin'], clue: ballastBox },
        { name: 'ballast2', after: ['ballast1'], clue: ballastBox },
        { name: 'signfuse', clue: sign, beat: 's9_step_signfuse', onAdvance: () => { this.bay1Fused = true; sign.material = P.mat(0x2a3a2a); } },
        { name: 'charge', after: ['signfuse', 'chipin'], clue: bay1 },
        { name: 'paperwork', clue: order, beat: 's9_step_paperwork' },
        { name: 'sync', after: ['barcode', 'ballast2', 'charge', 'paperwork'], clue: bay2, beat: 's9_step_sync',
          onAdvance: (a, opts) => { if (!opts || !opts.silent) a.checkpoint('sync', { steps: a._chain.order.filter(n => a._chain.done(n)) }); } },
        { name: 'turnstile', after: ['sync'], clue: turnstile, beat: 's9_step_turnstile' },
        { name: 'cagekey', after: ['turnstile'], clue: coatMesh },
        { name: 'openhatch', after: ['cagekey'], clue: cage, onAdvance: () => { this.cageOpen = true; cage.userData.open(); } },
        { name: 'ship', after: ['openhatch'], clue: hatch, onAdvance: (a) => { a.toast('You fold yourself into the crate. The hatch closes. Dawn.'); a.solve(); } },
      ]);
      this._ch = ch;

      api.use({ id: 'poster', mesh: poster, pos: new THREE.Vector3(5.5, 1.8, -6.5), reach: 2.2, prompt: 'read: what SYNC does',
        available: () => ch.ready('discover'), onUse: () => ch.advance('discover') });

      this._chipEnt = api.use({ id: 'chip', mesh: chip, pos: chip.position, reach: 1.7, pickable: true, dropY: 1.6, ground: false,
        prompt: 'take the ID chip', available: () => ch.ready('chip') || (ch.done('chip') && !ch.done('chipin')),
        onPick: (a) => { if (ch.ready('chip')) ch.advance('chip'); } });

      api.use({ id: 'grinder', mesh: grinder, pos: new THREE.Vector3(8, 0.9, 3), reach: 1.8, prompt: 'grind the chip notch',
        available: () => ch.ready('grind'),
        onUse: (a) => { if (a.world.carry && a.world.carry.entity.id === 'chip') { this._chipEnt.ground = true; a.audio.sfx('thunk'); a.fx.sparks({ x: 8, y: 1.1, z: 3 }); a.cameraImpulse(0.35); ch.advance('grind'); } else a.narrator.line('The grinder wants the chip in hand.', { id: 's9_grindempty', category: 'REACT' }); } });

      // the vacuum: accepts chip / barcode / ballast; also pickable for docking
      this._vacEnt = api.use({
        id: 'vacuum', mesh: vac, pos: vac.position, reach: 1.7, pickable: true, dropY: 0.4,
        hasChip: false, hasBarcode: false, ballast: 0, charged: false,
        prompt: () => 'the shop vacuum',
        acceptCarry: (item, a) => {
          if (item.id === 'chip' && ch.ready('chipin')) { if (!this._chipEnt.ground) { a.audio.sfx('error'); a.narrator.say('s9_grind_1', { category: 'HINT' }); return false; } this._vacEnt.hasChip = true; port.material = P.mat(0x2ad0c0, { emissive: 0x2ad0c0, emissiveIntensity: 1 }); a.audio.sfx('place'); ch.advance('chipin'); return true; }
          if (item.id === 'barcode' && ch.ready('barcode')) { this._vacEnt.hasBarcode = true; a.audio.sfx('place'); ch.advance('barcode'); return true; }
          if (item.id === 'ballast') { if (ch.ready('ballast1')) { this._vacEnt.ballast++; a.audio.sfx('place'); ch.advance('ballast1'); return true; } if (ch.ready('ballast2')) { this._vacEnt.ballast++; a.audio.sfx('place'); ch.advance('ballast2'); return true; } }
          return false;
        },
      });

      // R self-action: peel your barcode (available once the vacuum has its chip)
      this._barcodeStuck = false;
      api.everyFrame(() => {
        const want = ch.ready('barcode') && !this._peeled;
        if (want && api._selfAction == null) api.setSelfAction({ prompt: 'peel your barcode', fn: (a) => { this._peeled = true; api.clearSelfAction(); const bc = P.box(0.16, 0.02, 0.1, 0x111111); a.prop(bc, a.world.dust.position.x, 0.5, a.world.dust.position.z + 0.5); a.use({ id: 'barcode', mesh: bc, pos: bc.position, reach: 1.6, pickable: true, dropY: 0.5, prompt: 'your peeled barcode' }); a.audio.sfx('pick'); } });
        else if (!want && !this._peeled && api._selfAction) api.clearSelfAction();
      });

      // ballast pickups (two)
      for (let i = 0; i < 2; i++) { const b = P.box(0.24, 0.24, 0.24, 0x6a6a6a, { metal: 0.3 }); api.prop(b, -6 + (i - 0.5) * 0.4, 0.7, 4); api.use({ id: 'ballast', mesh: b, pos: b.position, reach: 1.6, pickable: true, dropY: 0.7, prompt: 'a ballast weight', available: () => (ch.ready('ballast1') || ch.ready('ballast2')) }); }

      // OPEN sign fuse → carry to Bay 1
      api.use({ id: 'sign', mesh: sign, pos: new THREE.Vector3(-9, 1.6, -3), reach: 1.9, prompt: 'take the sign fuse',
        available: () => ch.ready('signfuse') && !this._gaveSignFuse,
        onUse: (a) => { this._gaveSignFuse = true; const f = P.items.fuse(0xffd777); a.prop(f, -9, 1.0, -3); a.use({ id: 'signfuse', mesh: f, pos: f.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the sign fuse' }); a.audio.sfx('pick'); } });

      // Bay 1: install sign fuse, then charge the vacuum
      api.use({
        id: 'bay1', mesh: bay1, pos: new THREE.Vector3(-3, 0.1, -4), reach: 1.7,
        prompt: () => this.bay1Fused ? 'dock the vacuum to charge' : 'Bay 1 (dock fuse blown)',
        acceptCarry: (item, a) => { if (item.id === 'signfuse' && ch.ready('signfuse')) { a.audio.sfx('unlock'); ch.advance('signfuse'); return true; } return false; },
        onUse: (a) => {
          const c = a.world.carry && a.world.carry.entity;
          if (c && c.id === 'vacuum') { if (!this.bay1Fused) { a.audio.sfx('error'); a.narrator.say('s9_signfuse_1', { category: 'HINT' }); return; } this._vacEnt.charged = true; a.audio.sfx('unlock'); if (ch.ready('charge')) ch.advance('charge'); }
          else a.toast('Charging. No sync. You remain yourself.');
        },
      });

      // paperwork: stamp the order, file it in the log tray (echo of S2)
      const authstamp = P.items.stamp(0xc94a4a);
      api.use({ id: 'authstamp', mesh: stampBoard, pos: new THREE.Vector3(9.5, 1.2, -2), reach: 1.8, prompt: 'take the auth stamp',
        available: () => ch.ready('paperwork') && !this._gaveStamp,
        onUse: (a) => { this._gaveStamp = true; api.prop(authstamp, 9.5, 0.9, -2); a.use({ id: 'stamp', mesh: authstamp, pos: authstamp.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the auth stamp' }); a.audio.sfx('pick'); } });
      this._orderEnt = api.use({ id: 'order', mesh: order, pos: order.position, reach: 1.7, pickable: false, stamped: false, dropY: 0.9,
        prompt: () => this._orderEnt.stamped ? 'take the stamped order' : 'the work order',
        available: () => ch.ready('paperwork'),
        acceptCarry: (item, a) => { if (item.id !== 'stamp') return false; this._orderEnt.stamped = true; this._orderEnt.pickable = true; a.audio.sfx('place'); return true; } });
      api.use({ id: 'logtray', mesh: logtray, pos: new THREE.Vector3(9.5, 0.6, -4), reach: 1.8, prompt: 'file the order in the log tray',
        available: () => ch.ready('paperwork'),
        acceptCarry: (item, a) => { if (item.id !== 'order' || !this._orderEnt.stamped) return false; a.audio.sfx('unlock'); ch.advance('paperwork'); return true; } });

      // Bay 2: the sync (accepts the fully-built fake, or errors per missing pip)
      api.use({
        id: 'bay2', mesh: bay2, pos: new THREE.Vector3(3, 0.1, -4), reach: 1.7, prompt: 'Bay 2 (sync)',
        available: () => !api.solved,
        acceptCarry: (item, a) => {
          if (item.id !== 'vacuum') return false;
          if (!this._vacEnt.hasChip) { a.audio.sfx('error'); a.narrator.say('s9_noid', { category: 'REACT' }); return false; }
          if (this._vacEnt.ballast < 2) { a.audio.sfx('error'); a.narrator.say('s9_noweight', { category: 'REACT' }); return false; }
          if (!this._vacEnt.charged) { a.audio.sfx('error'); a.narrator.say('s9_nopower', { category: 'REACT' }); return false; }
          if (!this._vacEnt.hasBarcode) { a.audio.sfx('error'); a.narrator.say('s9_noid', { category: 'REACT' }); return false; }
          if (!ch.done('paperwork')) { a.audio.sfx('error'); a.narrator.say('s9_nopaper', { category: 'REACT' }); return false; }
          // success — leave the vacuum sitting on Bay 2 (visible), don't consume it
          const mesh = a.world.carry.mesh;
          a.world.rig.carryAnchor.remove(mesh); a.group.add(mesh);
          mesh.position.set(3, 0.3, -4); mesh.rotation.set(0, 0, 0); mesh.scale.setScalar(1);
          a.world.carry = null;
          a.audio.sfx('unlock'); ch.advance('sync'); return false;
        },
        onUse: (a) => { if (ch.done('sync') || a.world.carry) return; a.audio.sfx('error'); a.narrator.say('s9_decline', { category: 'REACT' }); a.toast('BAY 2: UNIT DECLINED CONSENT PROMPT.'); },
      });

      // exit turnstile — after sync you can't leave (you gave your barcode away). The
      // night tech wanders in to "collect" the synced unit, hangs his coat, and gets
      // to work on the decoy — never noticing you slip out the back.
      api.use({ id: 'turnstile', mesh: turnstile, pos: new THREE.Vector3(0, 0.6, 7.5), reach: 1.9, prompt: 'leave through the turnstile',
        available: () => !ch.done('ship'),
        onUse: (a) => {
          if (ch.ready('turnstile')) { a.audio.sfx('error'); ch.advance('turnstile'); if (this._techStep === -1) { this._techStep = 0; this._tech.visible = true; a.narrator.say('s9_tech_enter', { category: 'VOICE' }); } }
          else { a.audio.sfx('error'); a.narrator.say('s9_turnstile_deny', { category: 'REACT' }); }
        } });

      // cage key — in the tech's coat, once he's hung it on the rack
      api.use({ id: 'coat', mesh: coatMesh, pos: new THREE.Vector3(-8.2, 1.0, 4.9), reach: 1.8,
        prompt: () => this.coatHung ? 'search the tech\'s coat' : 'the empty coat rack',
        available: () => ch.ready('cagekey') && this.coatHung,
        onUse: (a) => { a.world.pickUp(this._cageKeyEnt); a.narrator.line('A cage key. And a half-eaten lunch ticket.', { id: 's9_lunch', category: 'REACT' }); ch.advance('cagekey'); } });
      const cagekey = P.items.key(0xc9a94a); cagekey.visible = false; cagekey.scale.setScalar(0.8); api.prop(cagekey, -8.2, 0.9, 5.05);
      this._cageKeyEnt = api.use({ id: 'cagekey', mesh: cagekey, pos: cagekey.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the cage key', available: () => ch.done('cagekey') && !ch.done('openhatch') });

      api.use({ id: 'cage', mesh: cage, pos: new THREE.Vector3(9.5, 0.9, 6), reach: 2, prompt: 'unlock the parts cage',
        available: () => ch.ready('openhatch'),
        acceptCarry: (item, a) => { if (item.id !== 'cagekey') return false; a.audio.sfx('unlock'); ch.advance('openhatch'); return true; } });
      api.use({ id: 'hatch', mesh: hatch, pos: new THREE.Vector3(9.5, 0.6, 7.5), reach: 1.9, prompt: 'climb into the parts hatch',
        available: () => ch.ready('ship'), onUse: () => ch.advance('ship') });

      api.world.dust.position.set(0, 0, 4);
      api.setAnchors([{ cx: 0, cz: 0, dist: 20 }]);
      api.narrator.say('s9_intro', { category: 'STORY' });
      api.narrator.say('tech_1', { category: 'VOICE' });
    },

    update(dt, api) {
      // drive the live Bay-2 checklist lamps (green when satisfied)
      if (this._checkLamps) {
        for (const c of this._checkLamps) {
          const on = !!c.test();
          if (on !== c.on) {
            c.on = on;
            c.lamp.material = P.mat(on ? 0x2abf5a : 0x552222, { emissive: on ? 0x1a6a34 : 0x3a0808, emissiveIntensity: on ? 1 : 0.8, edges: false });
            if (on) api.audio.sfx('pick');
          }
        }
      }
      // the night tech walks in, hangs his coat on the rack, and works on the decoy
      if (this._techStep < 0 || this._techStep > 3) return;
      const script = [
        { x: 0, z: 4.5 },                                   // 0: step inside
        { x: -8.2, z: 5.4, onArrive: (a) => { this._coatMesh.visible = true; this.coatHung = true; a.narrator.say('s9_tech_coat', { category: 'VOICE' }); } }, // 1: to the rack, hang coat
        { x: 2.2, z: -3.2, onArrive: (a) => { a.narrator.say('s9_tech_work1', { category: 'VOICE' }); } }, // 2: to Bay 2, start working
      ];
      if (this._techStep < script.length) {
        const t = script[this._techStep], p = this._tech.position;
        const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
        if (d < 0.12) { if (t.onArrive) t.onArrive(api); this._techStep++; }
        else { const s = Math.min(d, 3.4 * dt); p.x += dx / d * s; p.z += dz / d * s; this._tech.rotation.y = Math.atan2(dx, dz); }
      } else {
        // working on the decoy at Bay 2 — the occasional oblivious remark
        this._workT = (this._workT || 0) + dt;
        if (this._workT > 9 && !api.solved) { this._workT = 0; api.narrator.say('s9_tech_work2', { category: 'VOICE' }); }
      }
    },

    // Deterministic reload from the post-sync milestone (plan §2 checkpoints).
    restoreCheckpoint(api, cp) {
      if (cp.milestone !== 'sync') return;
      const steps = (cp.payload && cp.payload.steps) || [];
      api._chain.restore(steps);
      // rebuild the sub-state the acceptCarry handlers had set (not covered by onAdvance)
      this._vacEnt.hasChip = true; this._vacEnt.ballast = 2; this._vacEnt.charged = true; this._vacEnt.hasBarcode = true;
      this._chipEnt.ground = true; this._peeled = true; this._gaveSignFuse = true; this._gaveStamp = true;
      this._orderEnt.stamped = true; this.bay1Fused = true;
      api.clearSelfAction();
      // the synced decoy sits on Bay 2, as it did the moment before the reload
      if (this._vac) { this._vac.position.set(3, 0.3, -4); this._vac.rotation.set(0, 0, 0); this._vac.scale.setScalar(1); }
      api.toast('Restored: the decoy is docked on Bay 2. The way out is behind you.', 3600);
    },
  };
}
