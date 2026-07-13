// scenes/s11_lighthouse.js — THE LIGHTHOUSE (finale master puzzle). No instruction-
// giver; a brass plaque reads LIGHT = FIRE + GLASS + TURN. Six chambers, each a
// distilled echo of an earlier scene, gate the climb: C0 the swollen Door (Party),
// C1 the Breaker Room (Showroom), C2 the Logbook Gate (Office), C3 the Lens Loft
// (Museum), C4 the Gear Deck (Scrapyard/Repair), C5 the Igniter (Blackout — you are
// the missing part). Then the spatial reveal: it was Ash all along (§S11).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's11_lighthouse', name: 'The Lighthouse', palette: 'lighthouse', roomTone: 'silent',
    statedTask: 'LIGHT = FIRE + GLASS + TURN',
    hints: {
      c0_pin: ['s11_c0_pin_1', 's11_c0_pin_2'], c0_unchain: ['s11_c0_unchain_1'], c0_hook: ['s11_c0_hook_1'], c0_door: ['s11_c0_door_1'],
      c1_clean: ['s11_c1_clean_1', 's11_c1_clean_2'], c1_power: ['s11_c1_power_1', 's11_c1_power_2'],
      c2_letter: ['s11_c2_letter_1'], c2_stamp: ['s11_c2_stamp_1'], c2_send: ['s11_c2_send_1'],
      c3_pendant: ['s11_c3_pendant_1', 's11_c3_pendant_2'], c3_p1: ['s11_c3_p1_1'], c3_p2: ['s11_c3_p2_1'], c3_p3: ['s11_c3_p3_1'],
      c4_hoist: ['s11_c4_hoist_1', 's11_c4_hoist_2'], c4_pry: ['s11_c4_pry_1'], c4_ballast: ['s11_c4_ballast_1'], c4_grease: ['s11_c4_grease_1'], c4_gear: ['s11_c4_gear_1'],
      c5_recharge: ['s11_c5_recharge_1', 's11_c5_recharge_2'], c5_lampon: ['s11_c5_lampon_1'], c5_cradle: ['s11_c5_cradle_1', 's11_c5_cradle_2'],
    },

    build(api) {
      this._phase = 'climb';
      api.floor(24, 0x14161f);
      api.bounds(-6, 6, -6, 46);
      api.setAmbient(0.5);
      api.world.lampDrains = true; api.world.lampBattery = 1; api.world.setLampKnown(true); api.ui.setLampGlyph('known');

      // brass plaque at the entry
      api.prop(P.labelPlaque('LIGHT =\nFIRE + GLASS + TURN', 1.6, 0.7, { bg: '#3a2f14', fg: '#ffd777' }), 0, 1.4, -4.5);

      // chamber dividing doors
      const doors = {};
      const mkDoor = (z) => api.door(0, z, 6, 0.4, 0x232634, 2.4);
      doors.c1 = mkDoor(8); doors.c2 = mkDoor(14); doors.c3 = mkDoor(20); doors.c4 = mkDoor(26); doors.c5 = mkDoor(32); doors.lamp = mkDoor(38);

      // ---------- C0: THE DOOR (Party echo) ----------
      const pinMesh = P.box(0.08, 0.08, 0.2, 0xc9c0a4, { metal: 0.4 }); api.prop(pinMesh, -3, 0.2, 2);
      const dinghy = P.box(1.6, 0.5, 0.8, 0x5a4a3a); api.prop(dinghy, 3, 0.3, 2); api.nav.addBox(3, 2, 1.6, 0.8);
      const hookMesh = P.items.boathook(0x8a8a8a); hookMesh.visible = false; api.prop(hookMesh, 3, 0.6, 2);
      const doorbar = P.box(0.3, 1.6, 0.3, 0x4a3a2a); api.prop(doorbar, 0, 0.9, 6.6);

      // ---------- C1: BREAKER ROOM (Showroom echo) ----------
      const contacts = P.mess('crumb', 0x5a7a5a); contacts.scale.setScalar(2); api.prop(contacts, -3, 0.9, 11); this._c1stage = 0;
      // No pattern written down: three old sconces above the breakers show the state
      // each wants — the outer two glow, the middle is dead. Read the room. (Echoed
      // upstairs on the keeper's sampler for replayers.)
      api.prop(P.labelPlaque('MAINS', 0.6, 0.22, { bg: '#232634', fg: '#8ab0ff' }), 3, 2.0, 8.3);
      const sconceLit = [true, false, true];
      for (let i = 0; i < 3; i++) {
        const sconce = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), sconceLit[i]
          ? new THREE.MeshStandardMaterial({ color: 0xffe6a0, emissive: 0xffcf5f, emissiveIntensity: 1.1 })
          : new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0x000000 }));
        api.prop(sconce, -3 + i * 0.6, 1.9, 11.7);
        const cup = P.box(0.14, 0.06, 0.1, 0x4a4636); api.prop(cup, -3 + i * 0.6, 1.78, 11.72);
      }
      const powerLever = P.items.lever(0x33323a, 0x8a8a4a); api.prop(powerLever, 3, 0.7, 11);

      // ---------- C2: LOGBOOK GATE (Office echo) ----------
      const letter2 = P.items.paper(0xf4e8c0); api.prop(letter2, -3, 0.9, 16);
      const teatin = P.items.tin(0x8a6a4a); teatin.scale.setScalar(1.6); api.prop(teatin, 3, 0.5, 16); api.nav.addBox(3, 16, 0.3, 0.3);
      const chute2 = P.box(0.6, 1.2, 0.4, 0x4a4636); api.prop(chute2, 4, 1.0, 17);

      // ---------- C3: LENS LOFT (Museum echo) ----------
      const chandelier = P.box(0.5, 0.3, 0.5, 0x6a6a5a); api.prop(chandelier, 0, 2.4, -2); // back at entry
      const pendantMesh = P.items.crystalPendant(0xbfe0ff); pendantMesh.visible = false; api.prop(pendantMesh, 0, 1.9, -2);
      const prism1 = P.items.prism(0xbfe0ff); api.prop(prism1, -3, 0.9, 22);
      const prism3 = P.items.prism(0xbfe0ff); api.prop(prism3, -2, 0.9, 22);
      const prismCracked = P.items.prism(0x8a9aaa, true); api.prop(prismCracked, -1, 0.9, 22); // decoy: cracked
      const lensHousing = P.box(1, 1.2, 0.4, 0x33323a, { emissive: 0x0a0a12 }); api.prop(lensHousing, 3, 0.9, 23); api.nav.addBox(3, 23, 1, 0.4);
      api.prop(P.labelPlaque('LENS ORDER 1·2·3', 1, 0.3, { bg: '#33323a', fg: '#cde' }), 3, 1.7, 23);

      // ---------- C4: GEAR DECK (Scrapyard/Repair echo) ----------
      const hoistLatD = { x: -3, z: 28 }, hoistLiftD = { x: -1.5, z: 28 };
      const gearRing = P.box(1.2, 1.2, 0.3, 0x4a4a52, { emissive: 0x0a0a12 }); api.prop(gearRing, 3, 0.9, 29); api.nav.addBox(3, 29, 1.2, 0.3);
      const jammed = P.box(0.4, 0.4, 0.3, 0x6a3a3a); api.prop(jammed, 3, 1.3, 28.85);
      const ballastA = P.box(0.4, 0.4, 0.4, 0x6a6a6a); api.prop(ballastA, -3, 0.7, 30);
      const ballastB = P.box(0.4, 0.4, 0.4, 0x6a6a6a); api.prop(ballastB, -2.5, 0.7, 30);
      const greaseMesh = P.box(0.24, 0.24, 0.24, 0x3a4a2a); greaseMesh.visible = false; api.prop(greaseMesh, -3, 0.7, 30.5);
      const spareGear = P.items.gear(0x8a8a5a); spareGear.visible = false; api.prop(spareGear, -3, 1.5, 28);

      // ---------- C5: IGNITER (Blackout echo) ----------
      const trickle = P.box(0.4, 0.4, 0.2, 0x2a3050, { emissive: 0x1a2a5a }); api.prop(trickle, -3, 0.6, 34);
      const cradle = P.box(0.8, 1.4, 0.6, 0x33323a, { emissive: 0x0a0a12 }); api.prop(cradle, 3, 0.9, 35); api.nav.addBox(3, 35, 0.8, 0.6);
      api.prop(P.labelPlaque('IGNITER CRADLE\n[Series-C]', 0.9, 0.4, { bg: '#33323a', fg: '#cde' }), 3, 1.8, 35);

      // ---------- Lamp room: Ash + lens/beam ----------
      const ash = P.robot({ body: 0xece3d2, patched: true }); this._ash = ash.group; api.prop(this._ash, 0, 0, 42); this._ash.rotation.y = Math.PI;
      this._ashPos = new THREE.Vector3(0, 1.4, 42);
      this._lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 14), new THREE.MeshStandardMaterial({ color: 0x2a2a30, emissive: 0x000000 }));
      api.prop(this._lampMesh, 0, 2.6, 44);
      this._beam = new THREE.SpotLight(0xffd777, 0, 70, Math.PI / 8, 0.4); this._beam.position.set(0, 3, 44);
      const bt = new THREE.Object3D(); bt.position.set(0, 0, 0); api.group.add(this._beam); api.group.add(bt); this._beam.target = bt;

      // ===================== CHAIN =====================
      const ch = api.chain([
        { name: 'c0_pin', clue: pinMesh },
        { name: 'c0_unchain', after: ['c0_pin'], clue: dinghy, onAdvance: () => { hookMesh.visible = true; } },
        { name: 'c0_hook', after: ['c0_unchain'], clue: hookMesh },
        { name: 'c0_door', after: ['c0_hook'], clue: doorbar, beat: 's11_c0_done', onAdvance: () => { doorbar.visible = false; doors.c1.userData.open(); } },
        { name: 'c1_clean', after: ['c0_door'], clue: contacts },
        { name: 'c1_power', after: ['c1_clean'], clue: powerLever, beat: 's11_c1_done', onAdvance: () => doors.c2.userData.open() },
        { name: 'c2_letter', after: ['c1_power'], clue: letter2 },
        { name: 'c2_stamp', after: ['c2_letter'], clue: teatin },
        { name: 'c2_send', after: ['c2_stamp'], clue: chute2, beat: 's11_c2_done', onAdvance: () => doors.c3.userData.open() },
        { name: 'c3_pendant', after: ['c2_send'], clue: chandelier, onAdvance: () => { pendantMesh.visible = true; } },
        { name: 'c3_p1', after: ['c3_pendant'], clue: prism1 },
        { name: 'c3_p2', after: ['c3_p1'], clue: pendantMesh },
        { name: 'c3_p3', after: ['c3_p2'], clue: prism3, beat: 's11_c3_done', onAdvance: () => doors.c4.userData.open() },
        { name: 'c4_hoist', after: ['c3_p3'], clue: gearRing, onAdvance: () => { spareGear.visible = true; } },
        { name: 'c4_pry', after: ['c4_hoist'], clue: jammed, onAdvance: () => { jammed.visible = false; } },
        { name: 'c4_ballast', after: ['c4_pry'], clue: ballastA, onAdvance: () => { greaseMesh.visible = true; } },
        { name: 'c4_grease', after: ['c4_ballast'], clue: greaseMesh },
        { name: 'c4_gear', after: ['c4_grease'], clue: spareGear, beat: 's11_c4_done', onAdvance: () => doors.c5.userData.open() },
        { name: 'c5_recharge', after: ['c4_gear'], clue: trickle },
        { name: 'c5_lampon', after: ['c5_recharge'], clue: null },
        { name: 'c5_cradle', after: ['c5_lampon'], clue: cradle, onAdvance: (a) => this._ignite(a, doors) },
      ]);
      this._ch = ch;

      // ---- C0 interactions ----
      this._pinEnt = api.use({ id: 'c0_pin', mesh: pinMesh, pos: pinMesh.position, reach: 1.6, pickable: true, dropY: 0.2, prompt: 'take the chain pin from the tide pool',
        available: () => ch.ready('c0_pin') || (ch.done('c0_pin') && !ch.done('c0_unchain')), onPick: () => { if (ch.ready('c0_pin')) ch.advance('c0_pin'); } });
      api.use({ id: 'c0_dinghy', mesh: dinghy, pos: new THREE.Vector3(3, 0.4, 2), reach: 1.9, prompt: 'free the boathook (needs the pin)',
        available: () => ch.ready('c0_unchain'), acceptCarry: (item, a) => { if (item.id !== 'c0_pin') return false; a.audio.sfx('unlock'); ch.advance('c0_unchain'); return true; } });
      this._hookEnt = api.use({ id: 'c0_hook', mesh: hookMesh, pos: hookMesh.position, reach: 1.7, pickable: true, dropY: 0.6, prompt: 'take the boathook (keep it!)',
        available: () => ch.done('c0_unchain') && !ch.allDone(), onPick: () => { if (ch.ready('c0_hook')) ch.advance('c0_hook'); } });
      api.use({ id: 'c0_door', mesh: doorbar, pos: new THREE.Vector3(0, 0.9, 6.4), reach: 2, prompt: 'pry the door bar with the hook',
        available: () => ch.ready('c0_door'), onUse: (a) => { if (a.world.carry && a.world.carry.entity.id === 'c0_hook') ch.advance('c0_door'); else { a.audio.sfx('error'); a.narrator.say('s11_needhook', { category: 'REACT' }); } } });

      // ---- C1 ----
      api.clean({ id: 'c1_contacts', mesh: contacts, pos: contacts.position, reach: 1.7, cleanTime: 1.1, trashAmount: 0.02, removeOnClean: false,
        available: () => ch.ready('c1_clean') && this._c1stage < 2, onClean: () => { this._c1stage++; if (this._c1stage >= 2) { contacts.visible = false; ch.advance('c1_clean'); } } });
      const bk = [];
      for (let i = 0; i < 3; i++) { bk.push(api.dial({ id: 'c1_bk' + i, label: 'Breaker ' + (i + 1), pos: { x: -3 + i * 0.6, z: 11.6, y: 0.9 }, positions: ['OFF', 'ON'], available: () => ch.ready('c1_power') })); }
      this._bk = bk;
      api.use({ id: 'c1_power', mesh: powerLever, pos: new THREE.Vector3(3, 1.0, 11), reach: 1.8, prompt: 'throw the main breaker',
        available: () => ch.ready('c1_power'),
        onUse: (a) => { if (bk[0].value === 'ON' && bk[1].value === 'OFF' && bk[2].value === 'ON') ch.advance('c1_power'); else { a.audio.sfx('error'); a.narrator.say('s11_wrongpattern', { category: 'REACT' }); bk[1].set(0); } } });

      // ---- C2 ----
      this._letterEnt = api.use({ id: 'c2_letter', mesh: letter2, pos: letter2.position, reach: 1.6, pickable: false, stamped: false, dropY: 0.9,
        prompt: () => this._letterEnt.stamped ? 'take the keeper\'s letter' : 'the keeper\'s unsent letter',
        available: () => ch.ready('c2_letter') || ch.done('c2_letter'),
        onUse: (a) => { if (ch.ready('c2_letter')) ch.advance('c2_letter'); },
        acceptCarry: (item, a) => { if (item.id !== 'c2_stamp' || !ch.ready('c2_stamp')) return false; this._letterEnt.stamped = true; this._letterEnt.pickable = true; a.audio.sfx('place'); ch.advance('c2_stamp'); return true; } });
      api.use({ id: 'c2_teatin', mesh: teatin, pos: new THREE.Vector3(3, 0.6, 16), reach: 1.7, prompt: 'the rattling tea tin',
        available: () => ch.ready('c2_stamp') && !this._gaveStamp2,
        onUse: (a) => { this._gaveStamp2 = true; const s = P.box(0.16, 0.03, 0.12, 0xc94a4a); a.prop(s, 3, 0.85, 16); a.use({ id: 'c2_stamp', mesh: s, pos: s.position, reach: 1.5, pickable: true, dropY: 0.85, prompt: 'the stamp' }); a.audio.sfx('pick'); } });
      api.use({ id: 'c2_chute', mesh: chute2, pos: new THREE.Vector3(4, 1.0, 17), reach: 1.8, prompt: 'post the keeper\'s letter',
        available: () => ch.ready('c2_send'), acceptCarry: (item, a) => { if (item.id !== 'c2_letter' || !this._letterEnt.stamped) return false; a.audio.sfx('unlock'); ch.advance('c2_send'); return true; } });

      // ---- C3 ----
      api.use({ id: 'c3_chandelier', mesh: chandelier, pos: new THREE.Vector3(0, 2.4, -2), reach: 2.4, prompt: 'take the pendant of the same cut',
        available: () => ch.ready('c3_pendant'), onUse: (a) => { a.world.pickUp(this._pendantEnt); ch.advance('c3_pendant'); } });
      this._pendantEnt = api.use({ id: 'c3_pendant', mesh: pendantMesh, pos: pendantMesh.position, reach: 1.6, pickable: true, dropY: 1.0, prompt: 'the crystal pendant', available: () => ch.done('c3_pendant') && !ch.done('c3_p2') });
      api.use({ id: 'c3_prism1', mesh: prism1, pos: prism1.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'prism (slot 1)', available: () => ch.ready('c3_p1') || (ch.done('c3_p1') && !ch.done('c3_p3')) });
      api.use({ id: 'c3_prism3', mesh: prism3, pos: prism3.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'prism (slot 3)', available: () => ch.ready('c3_p3') || (ch.done('c3_p3')) });
      api.use({ id: 'c3_cracked', mesh: prismCracked, pos: prismCracked.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'a cracked prism', available: () => !api.solved });
      api.use({ id: 'c3_housing', mesh: lensHousing, pos: new THREE.Vector3(3, 0.9, 23), reach: 1.9,
        prompt: () => ch.ready('c3_p1') ? 'seat prism 1' : ch.ready('c3_p2') ? 'seat the middle piece' : 'seat prism 3',
        available: () => ch.ready('c3_p1') || ch.ready('c3_p2') || ch.ready('c3_p3'),
        acceptCarry: (item, a) => {
          if (item.id === 'c3_prism1' && ch.ready('c3_p1')) { a.audio.sfx('place'); ch.advance('c3_p1'); return true; }
          if (item.id === 'c3_pendant' && ch.ready('c3_p2')) { a.audio.sfx('place'); ch.advance('c3_p2'); return true; }
          if (item.id === 'c3_prism3' && ch.ready('c3_p3')) { a.audio.sfx('place'); ch.advance('c3_p3'); return true; }
          a.audio.sfx('error'); a.narrator.say('s11_wrongprism', { category: 'REACT' }); return false;
        } });

      // ---- C4 ----
      const hlat = api.dial({ id: 'c4_hoistlat', label: 'Swing', pos: { x: hoistLatD.x, z: hoistLatD.z, y: 0.9 }, positions: ['A', 'B', 'C'], available: () => ch.ready('c4_hoist') });
      const hlift = api.dial({ id: 'c4_hoistlift', label: 'Lift', pos: { x: hoistLiftD.x, z: hoistLiftD.z, y: 0.9 }, positions: ['LO', 'MID', 'HI'], available: () => ch.ready('c4_hoist') });
      this._hlat = hlat; this._hlift = hlift;
      api.use({ id: 'c4_raise', mesh: gearRing, pos: new THREE.Vector3(3, 0.9, 29), reach: 2, prompt: 'raise the spare gear to the window',
        available: () => ch.ready('c4_hoist'), onUse: (a) => { if (hlat.value === 'C' && hlift.value === 'HI') { a.audio.sfx('unlock'); ch.advance('c4_hoist'); } else a.narrator.line('The hoist swung wide of the window.', { id: 's11_hoistmiss', category: 'REACT' }); } });
      api.use({ id: 'c4_pry', mesh: jammed, pos: new THREE.Vector3(3, 1.3, 28.85), reach: 1.9, prompt: 'pry the jammed gear (needs the hook)',
        available: () => ch.ready('c4_pry'), onUse: (a) => { if (a.world.carry && a.world.carry.entity.id === 'c0_hook') ch.advance('c4_pry'); else { a.audio.sfx('error'); a.narrator.say('s11_needhook', { category: 'REACT' }); } } });
      let ballastMoved = 0;
      const ballastUse = (mesh, id) => api.use({ id, mesh, pos: mesh.position, reach: 1.6, pickable: true, dropY: 0.7, prompt: 'shift a ballast block', available: () => ch.ready('c4_ballast'), onPick: () => { ballastMoved++; if (ballastMoved >= 2 && ch.ready('c4_ballast')) ch.advance('c4_ballast'); } });
      ballastUse(ballastA, 'c4_ballastA'); ballastUse(ballastB, 'c4_ballastB');
      this._greaseEnt = api.use({ id: 'c4_grease', mesh: greaseMesh, pos: greaseMesh.position, reach: 1.6, pickable: true, dropY: 0.7, prompt: 'the grease tin', available: () => ch.done('c4_ballast') && !ch.done('c4_grease') });
      this._spareGearEnt = api.use({ id: 'c4_gear', mesh: spareGear, pos: spareGear.position, reach: 1.7, pickable: true, dropY: 1.0, prompt: 'the spare gear', available: () => ch.done('c4_hoist') && !ch.done('c4_gear') });
      api.use({ id: 'c4_ring', mesh: gearRing, pos: new THREE.Vector3(3, 0.9, 29.2), reach: 2,
        prompt: () => ch.ready('c4_grease') ? 'grease the ring' : 'seat the spare gear',
        available: () => ch.ready('c4_grease') || ch.ready('c4_gear'),
        acceptCarry: (item, a) => {
          if (item.id === 'c4_grease' && ch.ready('c4_grease')) { a.audio.sfx('place'); ch.advance('c4_grease'); return true; }
          if (item.id === 'c4_gear' && ch.ready('c4_gear')) { a.audio.sfx('place'); ch.advance('c4_gear'); return true; }
          return false;
        } });

      // ---- C5 ----
      api.use({ id: 'c5_trickle', mesh: trickle, pos: new THREE.Vector3(-3, 0.6, 34), reach: 1.9, prompt: 'charge your lamp',
        available: () => ch.ready('c5_recharge'), onUse: (a) => { a.world.lampBattery = 1; a.ui.setBatteryArc(1); a.audio.sfx('lamp_on'); ch.advance('c5_recharge'); } });
      api.use({ id: 'c5_cradle', mesh: cradle, pos: new THREE.Vector3(3, 0.9, 35), reach: 1.9, prompt: 'climb into the igniter cradle',
        available: () => ch.ready('c5_cradle'),
        onUse: (a) => { if (!a.world.lampOn) { a.audio.sfx('error'); a.narrator.say('s11_c5_lampon_1', { category: 'HINT' }); return; } ch.advance('c5_cradle'); } });

      api.world.dust.position.set(0, 0, -3);
      api.setAnchors([
        { cx: 0, cz: 4, dist: 15, minX: -6, maxX: 6, minZ: -6, maxZ: 12 },
        { cx: 0, cz: 20, dist: 15, minX: -6, maxX: 6, minZ: 12, maxZ: 30 },
        { cx: 0, cz: 40, dist: 14, minX: -6, maxX: 6, minZ: 30, maxZ: 46 },
      ]);
      api.narrator.say('s11_intro', { category: 'STORY' });
      api.narrator.say('s11_plaque', { category: 'STORY' });
    },

    update(dt, api) {
      if (this._phase !== 'climb') return;
      // c5_lampon advances when the player turns the lamp on in C5
      if (this._ch.ready('c5_lampon') && api.world.lampOn) this._ch.advance('c5_lampon');
    },

    _ignite(api, doors) {
      // the beam catches — you are the missing part; then the spatial reveal
      this._phase = 'reveal';
      this._lampMesh.material.emissive.setHex(0xffd777); this._lampMesh.material.emissiveIntensity = 2; this._beam.intensity = 8;
      doors.lamp.userData.open();
      api.narrator.mode = 'spatial';
      if (api.memory.get('gaveBarcode')) api.narrator.say('s11_barcode_beat', { category: 'STORY', spatial: true });
      api.narrator.say('s11_c5_cradle_beat', { category: 'STORY', spatial: true });
      this._ash.rotation.y = 0;
      api.narrator.say('s11_reveal', { category: 'STORY', spatial: true });
      api.narrator.say('s11_a1', { category: 'STORY', spatial: true });
      api.narrator.say('s11_a2', { category: 'STORY', spatial: true });
      api.narrator.say('s11_a3', { category: 'STORY', spatial: true, onDone: () => this._offerSpeck(api) });
    },

    _offerSpeck(api) {
      if (this._phase === 'choice' || this._phase === 'end') return;
      this._phase = 'choice';
      api.prop(P.box(1.2, 0.7, 0.8, 0x3a3d4c), 0, 0.35, 41);
      const speck = P.mess('crumb', 0xcfc7b4); api.prop(speck, 0, 0.75, 41);
      api.toast('One speck of dust. The old CLEAN prompt, one last time.');
      let decided = false;
      const end = (clean) => { if (decided) return; decided = true; api.narrator.say(clean ? 's11_clean' : 's11_leave', { category: 'STORY', spatial: true, onDone: () => this._lightTheLamp(api) }); };
      api.clean({ id: 'speck', mesh: speck, pos: speck.position, trashAmount: 0, cleanTime: 1.0, onClean: () => end(true) });
      this._walkAwayCheck = () => { if (!decided && api.world.dust.position.distanceTo(new THREE.Vector3(0, 0, 41)) > 6) end(false); };
    },

    _lightTheLamp(api) {
      if (this._phase === 'end') return; this._phase = 'end';
      api.narrator.say('s11_beam', { category: 'STORY', spatial: true, onDone: () => { api.solve(); api.credits(); } });
    },

    lateUpdate(dt, api) { if (this._phase === 'choice' && this._walkAwayCheck) this._walkAwayCheck(); },
  };
}
