// scenes/s05_museum.js — THE MUSEUM (11-step chain). Wake the unplaqued Series-C.
// Read the floor map (the "hand" in the ART wing is exhibit #7) → set the alarm
// dial to disarm the art wing → take the hand while the guard's loop is away →
// unscrew the sleeper's panel (reveals the etched order HAND→RIBBON→FUSE) → clean
// the socket → ribbon from drawer 12 (its crate reads ITEM 12) → crank from the
// PLEASE-TOUCH exhibit → fuse from the mezzanine lift → install in order (§S5).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's05_museum', name: 'The Museum', palette: 'museum', roomTone: 'room',
    statedTask: 'Dust all twelve exhibits. Touch nothing.',
    hints: {
      floormap: ['s5_floormap_1', 's5_floormap_2', 's5_floormap_3'],
      alarm: ['s5_alarm_1', 's5_alarm_2', 's5_alarm_3'],
      hand: ['s5_hand_1', 's5_hand_2', 's5_hand_3'],
      panel: ['s5_panel_1', 's5_panel_2', 's5_panel_3'],
      socket: ['s5_socket_1', 's5_socket_2', 's5_socket_3'],
      ribbon: ['s5_ribbon_1', 's5_ribbon_2', 's5_ribbon_3'],
      crank: ['s5_crank_1', 's5_crank_2', 's5_crank_3'],
      fuse: ['s5_fuse_1', 's5_fuse_2', 's5_fuse_3'],
      inst_hand: ['s5_inst_hand_1', 's5_inst_hand_2', 's5_inst_hand_3'],
      inst_ribbon: ['s5_inst_ribbon_1', 's5_inst_ribbon_2', 's5_inst_ribbon_3'],
      inst_fuse: ['s5_inst_fuse_1', 's5_inst_fuse_2', 's5_inst_fuse_3'],
    },

    build(api) {
      this.artDisarmed = false; this.panelOpen = false; this.lift = false;
      api.floor(40, 0x1a1d2b);
      api.bounds(-11, 11, -9, 9);
      api.fx.motes({ count: 70, area: [20, 5, 16], center: [0, 2.4, -1], color: 0x9fb0d0, opacity: 0.22, size: 0.05 });
      api.wall(0, -9, 24, 0.3, 0x252838); api.wall(-11, 0, 0.3, 18, 0x252838); api.wall(11, 0, 0.3, 18, 0x252838);
      const exit = api.wall(10, 5, 0.3, 3, 0x2a3040);
      api.use({ id: 'fireexit', mesh: exit, pos: new THREE.Vector3(10, 0.8, 5), reach: 2, prompt: 'fire exit (sealed)',
        available: () => !api.solved, onUse: (a) => a.narrator.say('bark_locked_edge', { category: 'REACT' }) });

      // 11 plaqued exhibits (busywork) — each a DISTINCT silhouette under its own
      // little picture-light, so the hall reads as a gallery, not a grid of boxes
      const exGeo = (i) => {
        switch (i % 8) {
          case 0: return new THREE.SphereGeometry(0.26, 14, 10);
          case 1: return new THREE.ConeGeometry(0.26, 0.6, 6);
          case 2: return new THREE.TorusGeometry(0.22, 0.09, 8, 16);
          case 3: return new THREE.CylinderGeometry(0.12, 0.26, 0.6, 10);
          case 4: return new THREE.IcosahedronGeometry(0.28, 0);
          case 5: return new THREE.OctahedronGeometry(0.3, 0);
          case 6: return new THREE.BoxGeometry(0.4, 0.5, 0.4);
          default: return new THREE.DodecahedronGeometry(0.27, 0);
        }
      };
      const exHues = [0xc7d3f0, 0xd0c0a8, 0xb8c8d8, 0xd8c8b0, 0xc0d0c0, 0xd0b8c8, 0xc8c8d0, 0xd8d0b8];
      for (let i = 0; i < 11; i++) {
        const x = -8 + (i % 6) * 2.4, z = -6 + Math.floor(i / 6) * 3;
        api.prop(P.items.plinth(0x3a3d4c), x, 0.45, z);
        const item = new THREE.Mesh(exGeo(i), P.mat(exHues[i % exHues.length], { metal: 0.25, rough: 0.6 }));
        P.addEdges(item); item.userData.isProp = true;
        api.prop(item, x, 1.2, z);
        // small emissive picture-light fixture above each piece (cheap "spotlight")
        const fixture = P.box(0.22, 0.08, 0.14, 0x14141a, { emissive: 0xdfe6f5, emissiveIntensity: 0.7, edges: false });
        api.prop(fixture, x, 2.15, z - 0.15);
        api.prop(P.labelPlaque('EXHIBIT ' + (i + 1), 0.6, 0.2), x, 0.5, z + 0.4);
        api.clean({ id: 'dust_' + i, mesh: item, pos: item.position, trashAmount: 0.01, removeOnClean: false, fake: true });
      }
      // a tally board makes the count discrepancy legible: you can dust ELEVEN, but
      // the placard says twelve — the twelfth is asleep, not on a plinth (plan §S5)
      this._countBoard = P.labelPlaque('DUSTED\n0 / 12', 1.0, 0.5, { bg: '#20242f', fg: '#8ab0ff' });
      api.prop(this._countBoard, -8, 2.3, -8.82);
      this._countText = '';

      // sleeper on a corner plinth — the hero silhouette, under its own real spotlight.
      // Its plinth is numbered 12 but bears no name-plaque: the missing exhibit.
      api.prop(P.items.plinth(0x3a3d4c), 9, 0.45, -6);
      const sleeper = P.robot({ body: 0x9aa0b0 }).group; sleeper.scale.setScalar(0.85); api.prop(sleeper, 9, 1.0, -6);
      api.spot(9, 4.2, -5.2, 9, -6, { color: 0xdce4f5, intensity: 7, dist: 9, angle: Math.PI / 8 });
      api.prop(P.labelPlaque('12', 0.34, 0.24, { bg: '#3a3d4c', fg: '#8ab0ff' }), 9, 0.5, -5.55);
      api.prop(P.labelPlaque('— no plaque —', 0.7, 0.16, { bg: '#20242f', fg: '#5a6478' }), 9, 1.72, -6.42);
      const panelMesh = P.box(0.34, 0.34, 0.06, 0x6a7080, { metal: 0.4 }); api.prop(panelMesh, 9, 1.5, -6.4);
      // three install slots (hidden until panel open)
      const socketMesh = P.box(0.5, 0.14, 0.1, 0x151820, { emissive: 0x223040 }); socketMesh.visible = false; api.prop(socketMesh, 9, 1.5, -6.42);
      // three socket indicator lamps that light as HAND / RIBBON / FUSE seat
      // (plan §2 state feedback: empty sockets visibly fill)
      this._socketLamps = [];
      for (let i = 0; i < 3; i++) {
        const s = P.box(0.1, 0.1, 0.05, 0x1a2028, { emissive: 0x112028, emissiveIntensity: 0.6, edges: false });
        s.visible = false; api.prop(s, 8.76 + i * 0.24, 1.5, -6.35);
        this._socketLamps.push(s);
      }
      const grime = P.mess('crumb', 0x5a6a4a); grime.visible = false; grime.position.set(9, 1.5, -6.36); api.group.add(grime);

      // ART wing: the manipulator hand in an alarmed case
      const artCase = P.box(0.9, 1.4, 0.9, 0x2a3550, { emissive: 0x0a1020 }); api.prop(artCase, -9, 0.9, 6); api.nav.addBox(-9, 6, 0.9, 0.9);
      const handMesh = P.box(0.3, 0.3, 0.15, 0xb0b6c0, { metal: 0.4 }); api.prop(handMesh, -9, 1.4, 6);
      api.prop(P.labelPlaque('#7 EARLY\nMANIPULATOR\nartist unknown', 0.9, 0.6, { bg: '#2a3550', fg: '#cde' }), -9, 1.9, 5.55);
      const caseLight = P.box(0.1, 0.1, 0.05, 0xd94040, { emissive: 0x3a0808 }); api.prop(caseLight, -9, 1.7, 6.45); this._caseLight = caseLight;

      // guard desk + alarm dial, guard patroller with a sweeping flashlight so the
      // timing reads by MOVEMENT + LIGHT + SOUND, not the case colour alone (plan §S5)
      const desk = P.box(1.4, 0.9, 0.8, 0x3a3d4c); api.prop(desk, 0, 0.45, 7); api.nav.addBox(0, 7, 1.4, 0.8);
      this._guard = api.patroller({ color: 0x4a5a6a, waypoints: [{ x: -8, z: 4 }, { x: 0, z: 6 }, { x: 8, z: 4 }, { x: 0, z: 6 }], speed: 2.2, dwell: 2 });
      this._guardCone = new THREE.Mesh(new THREE.CircleGeometry(2.0, 20), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false }));
      this._guardCone.rotation.x = -Math.PI / 2; this._guardCone.position.y = 0.04; api.group.add(this._guardCone);
      this._guardLamp = P.box(0.1, 0.1, 0.14, 0x1a1a1e, { emissive: 0xffe6a0, emissiveIntensity: 0.9, edges: false }); this._guard.mesh.add(this._guardLamp); this._guardLamp.position.set(0, 1.0, 0.3);

      // loading dock + archive shelving make the back-of-house legible (plan §S5)
      const dock = P.box(3, 2.4, 0.3, 0x2a2d38); api.prop(dock, -6, 1.2, -8.85);
      for (let i = 0; i < 6; i++) api.prop(P.box(2.6, 0.12, 0.2, 0x3a3d48), -6, 0.4 + i * 0.36, -8.6);   // roller-door slats
      api.mountSign(dock, 'LOADING', 0.9, 0.24, [0, 0.7, 0.18], { bg: '#2a2d38', fg: '#cde' });
      for (const ax of [6.5, 8.2]) { const shelf = P.box(1.0, 2.2, 0.5, 0x33343e); api.prop(shelf, ax, 1.1, 8.4); for (let s = 0; s < 3; s++) api.prop(P.box(0.8, 0.4, 0.35, [0x5a4a34, 0x4a5060, 0x6a5a44][s]), ax, 0.5 + s * 0.7, 8.4); }
      api.prop(P.labelPlaque('ARCHIVE', 0.9, 0.2, { bg: '#33343e', fg: '#cde' }), 7.3, 2.4, 8.15);

      // closet: screwdriver + floor map
      const closet = P.box(1.4, 2, 1.4, 0x2f3240); api.prop(closet, -10, 1, 7); api.nav.addBox(-10, 7, 1.4, 1.4);
      api.prop(P.labelPlaque('MAINTENANCE', 1.2, 0.24, { bg: '#3a4050', fg: '#cdd' }), -10, 1.9, 6.25);
      const driver = P.items.screwdriver(0xc94a4a, 0xb8b8be); api.prop(driver, -9.3, 0.35, 7);
      const floormap = P.labelPlaque('FLOOR MAP\n#7 → ART WING', 1, 0.5, { bg: '#2a3040', fg: '#8ab0ff' }); api.prop(floormap, -10, 1.4, 7.65);

      // archive drawers + crate (ITEM 12) + ribbon in drawer 12
      const crate = P.box(1.2, 1, 1, 0x5a4a34); api.prop(crate, 8, 0.5, 6); api.nav.addBox(8, 6, 1.2, 1);
      api.prop(P.labelPlaque('ITEM 12', 0.7, 0.24, { bg: '#5a4a34', fg: '#e8dcc0' }), 8, 1.1, 5.5);
      const drawers = P.box(2, 1.4, 0.6, 0x3a3d4c); api.prop(drawers, 4, 0.7, 7); api.nav.addBox(4, 7, 2, 0.6);
      api.prop(P.labelPlaque('ARCHIVE 10 11 12 13', 1.6, 0.24, { bg: '#3a3d4c', fg: '#cde' }), 4, 1.4, 6.7);
      const ribbonMesh = P.items.ribbon(0xc98ad0); ribbonMesh.visible = false; api.prop(ribbonMesh, 4.6, 0.9, 6.7);

      // PLEASE TOUCH kids exhibit → crank; freight lift → fuse on mezzanine
      const kids = P.box(1, 0.6, 1, 0x6a8a5a); api.prop(kids, -6, 0.3, 8); api.nav.addBox(-6, 8, 1, 1);
      api.prop(P.labelPlaque('PLEASE TOUCH!', 0.9, 0.24, { bg: '#6a8a5a', fg: '#fff' }), -6, 0.9, 8);
      const crankMesh = P.items.crank(0xc9a94a); api.prop(crankMesh, -6, 0.7, 8);
      const lift = P.box(1.4, 0.2, 1.4, 0x4a4a52); api.prop(lift, 8, 0.1, -7); api.nav.addBox(8, -7, 1.4, 1.4);
      api.prop(P.labelPlaque('FREIGHT LIFT', 1, 0.24, { bg: '#4a4a52', fg: '#cde' }), 8, 1.2, -7.7);
      const fuseMesh = P.items.fuse(0xffd777); fuseMesh.visible = false; api.prop(fuseMesh, 8, 1.6, -7);

      const ch = api.chain([
        { name: 'floormap', clue: floormap, beat: 's5_step_floormap' },
        { name: 'alarm', after: ['floormap'], clue: desk, onAdvance: () => { this.artDisarmed = true; caseLight.material.color.setHex(0x3fbf6a); } },
        { name: 'hand', after: ['alarm'], clue: handMesh },
        { name: 'panel', after: ['floormap'], clue: panelMesh, beat: 's5_step_panel', onAdvance: () => { this.panelOpen = true; panelMesh.visible = false; socketMesh.visible = true; grime.visible = true; } },
        { name: 'socket', after: ['panel'], clue: grime },
        { name: 'ribbon', after: ['floormap'], clue: drawers, onAdvance: () => { ribbonMesh.visible = true; } },
        { name: 'crank', clue: crankMesh, beat: 's5_step_crank' },
        { name: 'fuse', after: ['crank'], clue: lift, onAdvance: () => { fuseMesh.visible = true; } },
        { name: 'inst_hand', after: ['hand', 'socket'], clue: socketMesh },
        { name: 'inst_ribbon', after: ['inst_hand', 'ribbon'], clue: socketMesh },
        { name: 'inst_fuse', after: ['inst_ribbon', 'fuse'], clue: socketMesh,
          onAdvance: (a) => { a.narrator.say('s5_fragment', { category: 'VOICE' }); a.narrator.say('s5_wake', { category: 'STORY' }); a.toast('The fire exit is now ajar.'); a.solve(); } },
      ]);
      this._ch = ch;

      api.use({ id: 'floormap', mesh: floormap, pos: new THREE.Vector3(-10, 1.4, 7.4), reach: 1.9, prompt: 'read the floor map',
        available: () => ch.ready('floormap'), onUse: () => ch.advance('floormap') });

      api.use({ id: 'screwdriver', mesh: driver, pos: driver.position, reach: 1.8, pickable: true, dropY: 0.3, prompt: 'take the screwdriver' });

      api.dial({ id: 'alarmdial', pos: { x: 0.3, z: 7.4, y: 0.9 }, positions: ['WING A', 'WING B', 'ART'],
        available: () => ch.ready('alarm') && !this.artDisarmed,
        onSet: (v, idx, a) => { if (v === 'ART' && ch.ready('alarm')) ch.advance('alarm'); } });

      api.use({
        id: 'handcase', mesh: artCase, pos: new THREE.Vector3(-9, 1.2, 6), reach: 1.9,
        prompt: 'open the case and take the hand',
        available: () => ch.ready('hand'),
        onUse: (a) => {
          if (!this.artDisarmed) { a.audio.sfx('error'); a.narrator.say('s5_alarmed', { category: 'REACT' }); return; }
          const catchR = a.assist ? 2.6 : 4;   // Assist widens the guard window (plan §2)
          if (this._guard.isNear(new THREE.Vector3(-9, 0, 6), catchR)) { a.audio.sfx('error'); a.narrator.say('s5_guardcaught', { category: 'VOICE' }); return; }
          a.world.pickUp(this._handEnt); ch.advance('hand');
        },
      });
      this._handEnt = api.use({ id: 'hand', mesh: handMesh, pos: handMesh.position, reach: 1.6, pickable: true, dropY: 1.4,
        prompt: 'the manipulator hand', available: () => ch.done('hand') && !ch.done('inst_hand') });

      api.use({
        id: 'panel', mesh: panelMesh, pos: new THREE.Vector3(9, 1.5, -6.35), reach: 1.9, prompt: 'unscrew the back panel',
        available: () => ch.ready('panel'),
        acceptCarry: (item, a) => { if (item.id !== 'screwdriver') return false; a.audio.sfx('unlock'); ch.advance('panel'); return true; },
        onUse: (a) => a.narrator.say('s5_panellocked', { category: 'REACT' }),
      });

      api.clean({ id: 'socketgrime', mesh: grime, pos: grime.position, reach: 1.7, cleanTime: 1.4, trashAmount: 0.01,
        available: () => ch.ready('socket'), onClean: () => ch.advance('socket') });

      api.use({ id: 'ribbon_drawer', mesh: drawers, pos: new THREE.Vector3(4, 0.9, 6.9), reach: 1.9, prompt: 'open drawer 12',
        available: () => ch.ready('ribbon'), onUse: () => ch.advance('ribbon') });
      api.use({ id: 'ribbon', mesh: ribbonMesh, pos: ribbonMesh.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'take the memory ribbon',
        available: () => (ch.done('ribbon') && !ch.done('inst_ribbon')) });

      api.use({ id: 'crank', mesh: crankMesh, pos: crankMesh.position, reach: 1.7, pickable: true, dropY: 0.7, prompt: 'take the crank (PLEASE TOUCH)',
        onPick: (a) => { if (ch.ready('crank')) ch.advance('crank'); } });
      api.use({ id: 'lift', mesh: lift, pos: new THREE.Vector3(8, 0.3, -7), reach: 2, prompt: 'crank the freight lift',
        available: () => ch.ready('fuse'),
        acceptCarry: (item, a) => { if (item.id !== 'crank') return false; a.audio.sfx('unlock'); ch.advance('fuse'); return true; } });
      api.use({ id: 'fuse', mesh: fuseMesh, pos: fuseMesh.position, reach: 1.7, pickable: true, dropY: 1.6, prompt: 'take the fuse',
        available: () => (ch.done('fuse') && !ch.done('inst_fuse')) });

      // the three ordered install slots (one entity, order enforced by chain.after)
      api.use({
        id: 'socket', mesh: socketMesh, pos: new THREE.Vector3(9, 1.5, -6.42), reach: 1.9,
        prompt: () => ch.ready('inst_hand') ? 'install the hand' : ch.ready('inst_ribbon') ? 'install the ribbon' : ch.ready('inst_fuse') ? 'install the fuse' : 'the sockets',
        available: () => this.panelOpen && !api.solved,
        acceptCarry: (item, a) => {
          if (item.id === 'hand' && ch.ready('inst_hand')) { a.audio.sfx('place'); ch.advance('inst_hand'); return true; }
          if (item.id === 'ribbon' && ch.ready('inst_ribbon')) { a.audio.sfx('place'); ch.advance('inst_ribbon'); return true; }
          if (item.id === 'fuse' && ch.ready('inst_fuse')) { a.audio.sfx('place'); ch.advance('inst_fuse'); return true; }
          a.audio.sfx('error'); a.narrator.say('s5_wrongorder', { category: 'REACT' }); return false;
        },
      });

      api.world.dust.position.set(0, 0, 3);
      api.setAnchors([{ cx: 0, cz: -1, dist: 20 }]);
      api.narrator.say('s5_intro', { category: 'STORY' });
      api.narrator.say('curator_1', { category: 'VOICE' });
    },

    update(dt, api) {
      if (this._socketLamps) {
        const done = [this._ch.done('inst_hand'), this._ch.done('inst_ribbon'), this._ch.done('inst_fuse')];
        this._socketLamps.forEach((s, i) => {
          s.visible = this.panelOpen;
          if (done[i] && !s.userData.on) {
            s.userData.on = true;
            s.material = P.mat(0x3fbf6a, { emissive: 0x1a6a34, emissiveIntensity: 1.2, edges: false });
            api.audio.sfx('place');
          }
        });
      }
      // live tally: dusting can only ever reach 11/12 — the discrepancy is visible
      if (this._countBoard) {
        const dusted = (api._fakeTotal || 11) - (api._fakeRemaining ?? (api._fakeTotal || 11));
        const txt = 'DUSTED\n' + dusted + ' / 12';
        if (txt !== this._countText) { this._countText = txt; this._countBoard.userData.label.draw(txt, { bg: '#20242f', fg: dusted >= 11 ? '#ffcf5f' : '#8ab0ff' }); }
      }
      // the guard's flashlight sweeps the floor ahead of him; a soft tick warns you
      // when his beam nears the art case (timing by movement + light + sound)
      if (this._guard && this._guardCone) {
        const gp = this._guard.mesh.position;
        this._guardCone.position.x = gp.x + Math.sin(this._guard.mesh.rotation.y) * 1.6;
        this._guardCone.position.z = gp.z + Math.cos(this._guard.mesh.rotation.y) * 1.6;
        if (this._ch && this._ch.ready('hand') && this._guard.isNear(new THREE.Vector3(-9, 0, 6), 5)) {
          this._tick = (this._tick || 0) + dt;
          if (this._tick > 0.6) { this._tick = 0; api.audio.sfx('thunk'); }
        }
      }
    },
  };
}