// scenes/s08_scrapyard.js — THE SCRAPYARD (multi-step chain). Truly shut the line
// down, then ship the survivor out. E-stop the belt (a backup generator fights you)
// → aim the yard crane over the painted grid to clear the barrels → kill the fuel
// cutoff → take the lockout tag (its key was in the crane cab) → lock out the
// breaker → open the interlocked walkway gate → dig the warm core out of the heap →
// lift it → ring for a pickup truck → ship it out the blue chute in the window (§S8).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's08_scrapyard', name: 'The Scrapyard', palette: 'scrapyard', roomTone: 'room',
    statedTask: 'Metals left. Plastics right. Cores in the red bin.',
    hints: {
      estop: ['s8_estop_1', 's8_estop_2', 's8_estop_3'],
      crane: ['s8_crane_1', 's8_crane_2', 's8_crane_3'],
      fuelcutoff: ['s8_fuelcutoff_1', 's8_fuelcutoff_2', 's8_fuelcutoff_3'],
      tag: ['s8_tag_1', 's8_tag_2', 's8_tag_3'],
      lockout: ['s8_lockout_1', 's8_lockout_2', 's8_lockout_3'],
      gate: ['s8_gate_1', 's8_gate_2', 's8_gate_3'],
      clearheap: ['s8_clearheap_1', 's8_clearheap_2', 's8_clearheap_3'],
      core: ['s8_core_1', 's8_core_2', 's8_core_3'],
      bell: ['s8_bell_1', 's8_bell_2', 's8_bell_3'],
      ship: ['s8_ship_1', 's8_ship_2', 's8_ship_3'],
    },

    build(api) {
      this.beltStopped = false; this.genDead = false; this.hasTag = false; this.lockedOut = false;
      this._shipWindow = 0; this._restartT = 0; this._heapStage = 0;
      // barrels on grid cells [row,col]; crane must drop on each
      this._barrels = [{ r: 1, c: 1, mesh: null }, { r: 2, c: 0, mesh: null }];
      api.floor(40, 0x241d16);
      api.bounds(-11, 11, -9, 9);
      api.wall(0, -9, 24, 0.3, 0x33291c);

      const belt = P.box(16, 0.3, 1.6, 0x3a3128); api.prop(belt, 0, 0.6, -3);
      // rollers + drifting scrap so the line visibly runs (until E-stop / lockout)
      this._rollers = [];
      for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 8), P.mat(0x22201c, { metal: 0.4 })); r.rotation.x = Math.PI / 2; api.prop(r, -7 + i * 1.8, 0.78, -3); this._rollers.push(r); }
      this._scrap = [];
      for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24 + Math.random() * 0.1, 0), P.mat(0x6a6a6a)); api.prop(s, -7 + i * 2.3, 0.95, -3.2 + Math.random() * 0.4); this._scrap.push(s); }
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), P.mat(0xffa64b, { emissive: 0x5a2a08 }));
      api.prop(core, -2, 0.9, -3); this._coreMesh = core; this._pulse = 0;
      const heap = P.mess('crumb', 0x6a5a4a); heap.scale.setScalar(2.5); api.prop(heap, -2, 0.95, -3); this._heap = heap;
      api.prop(P.labelPlaque('CORE STATUS:\nLIT = DO NOT CRUSH', 1.6, 0.6, { bg: '#c9b98a', fg: '#3a2a10' }), -6, 2.4, -3.9);

      // E-STOP
      const estop = P.items.button(0xd94040);
      api.prop(estop, 7, 1.2, -5.4); api.nav.addBox(7, -5.4, 0.6, 0.6);
      api.prop(P.labelPlaque('E-STOP', 0.6, 0.22, { bg: '#c9433f', fg: '#fff' }), 7, 1.7, -5.4);

      // generator + barrels + fuel cutoff (walled by barrels)
      const gen = P.box(1.6, 1.2, 1, 0x4a4a3a, { emissive: 0x120c04 }); api.prop(gen, -8, 0.6, 6); api.nav.addBox(-8, 6, 1.6, 1);
      api.prop(P.labelPlaque('GENERATOR', 0.9, 0.2, { bg: '#4a4a3a', fg: '#e8dcc0' }), -8, 1.4, 6);
      const cutoff = P.items.cutoffBox(0x8a3a3a, 0xd94040); api.prop(cutoff, -6.6, 0.55, 6);
      // barrels sit on a painted grid — row letters down one side, column numbers along
      // the other, so you can read each barrel's cell straight off the floor
      const gridOX = -6.6, gridOZ = 6, cell = 0.7;
      const floorTile = (txt, x, z) => { const t = P.labelPlaque(txt, 0.34, 0.34, { bg: '#2a2318', fg: '#ffc46a' }); t.rotation.x = -Math.PI / 2; t.userData._noTilt = true; api.prop(t, x, 0.03, z); };
      // faint grid squares
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0x4a3f2a, transparent: true, opacity: 0.25 })); sq.rotation.x = -Math.PI / 2; api.prop(sq, gridOX + c * cell, 0.02, gridOZ + r * cell - 1); }
      ['A', 'B', 'C'].forEach((L, r) => floorTile(L, gridOX - 0.65, gridOZ + r * cell - 1));
      ['1', '2', '3'].forEach((N, c) => floorTile(N, gridOX + c * cell, gridOZ - 1 - 0.65));
      this._barrels.forEach((b, i) => { const m = P.items.barrel(0x8a6a3a); api.prop(m, gridOX + b.c * cell, 0.35, gridOZ + b.r * cell - 1); b.mesh = m; });
      api.prop(P.labelPlaque('LOADING GRID', 1.0, 0.3, { bg: '#241d16', fg: '#ffa64b' }), -6.6, 2.2, 4.6);

      // crane cab: two dials + drop; board key hangs here
      const cab = P.box(1.2, 1.4, 1.2, 0x5a5040); api.prop(cab, 6, 0.7, 6); api.nav.addBox(6, 6, 1.2, 1.2);
      api.prop(P.labelPlaque('CRANE CAB', 0.9, 0.2, { bg: '#5a5040', fg: '#e8dcc0' }), 6, 1.6, 6);

      // foreman board (tag) + LOTO poster + breaker
      const board = P.box(1, 1.2, 0.2, 0x3a352a); api.prop(board, 9, 0.9, -6); api.nav.addBox(9, -6, 1, 0.3);
      api.prop(P.labelPlaque('LOCKOUT/TAGOUT\nTAG THE BREAKER', 1.1, 0.5, { bg: '#c9433f', fg: '#fff' }), 9, 1.8, -6);
      const breaker = P.box(0.6, 1, 0.3, 0x4a5560, { emissive: 0x0a1015 }); api.prop(breaker, 9, 0.6, -4); api.nav.addBox(9, -4, 0.6, 0.3);

      // walkway gate + heap dig + core + bell + chutes
      const gate = api.door(3, 4, 2.5, 0.3, 0x2a3a5a, 1.8);
      const redBin = P.items.bin(0xc9433f, false); api.prop(redBin, -6, 0.7, 3); api.nav.addBox(-6, 3, 1.4, 1.4); redBin.scale.set(1.6, 1.6, 1.6);
      const blueChute = P.box(1.4, 1.4, 1.4, 0x4a7ac9, { emissive: 0x10203a }); api.prop(blueChute, 6, 0.7, 3); api.nav.addBox(6, 3, 1.4, 1.4);
      api.prop(P.labelPlaque('OUTBOUND\nEMPTY', 1.2, 0.4, { bg: '#4a7ac9', fg: '#fff' }), 6, 1.7, 3);
      const bell = P.items.bell(0xc9a94a); api.prop(bell, 9, 1.0, 3); api.nav.addBox(9, 3, 0.5, 0.5);
      api.prop(P.labelPlaque('RING FOR\nPICKUP', 0.8, 0.4, { bg: '#3a3128', fg: '#ffd' }), 9, 1.6, 3);

      const ch = api.chain([
        { name: 'estop', clue: estop, beat: 's8_step_estop', onAdvance: () => { this.beltStopped = true; this._restartT = 20; } },
        { name: 'crane', after: ['estop'], clue: cab, beat: 's8_step_crane' },
        { name: 'fuelcutoff', after: ['crane'], clue: cutoff, beat: 's8_step_fuelcutoff', onAdvance: () => { this.genDead = true; this._restartT = -1; } },
        { name: 'tag', after: ['crane'], clue: board },
        { name: 'lockout', after: ['tag', 'fuelcutoff'], clue: breaker, beat: 's8_step_lockout', onAdvance: () => { this.lockedOut = true; } },
        { name: 'gate', after: ['lockout'], clue: gate },
        { name: 'clearheap', after: ['gate'], clue: heap },
        { name: 'core', after: ['clearheap'], clue: core },
        { name: 'bell', after: ['core'], clue: bell, beat: 's8_step_bell', onAdvance: () => { this._shipWindow = 60; } },
        { name: 'ship', after: ['bell'], clue: blueChute },
      ]);
      this._ch = ch;

      api.use({ id: 'estop', mesh: estop, pos: new THREE.Vector3(7, 1.2, -5.4), reach: 1.9,
        prompt: () => this.beltStopped ? 'belt halted' : 'hit the E-STOP',
        available: () => ch.ready('estop'), onUse: () => ch.advance('estop') });

      // crane dials + drop
      const dlat = api.dial({ id: 'cranelat', label: 'Row', pos: { x: 5.4, z: 6, y: 0.9 }, positions: ['A', 'B', 'C'], available: () => ch.ready('crane') });
      const dlong = api.dial({ id: 'cranelong', label: 'Col', pos: { x: 6.6, z: 6, y: 0.9 }, positions: ['1', '2', '3'], available: () => ch.ready('crane') });
      this._dlat = dlat; this._dlong = dlong;
      api.use({ id: 'cranedrop', mesh: cab, pos: new THREE.Vector3(6, 0.9, 6), reach: 1.9, prompt: 'drop the crane magnet',
        available: () => ch.ready('crane'),
        onUse: (a) => {
          const r = dlat.index, c = dlong.index;
          const hit = this._barrels.find(b => !b.cleared && b.r === r && b.c === c);
          if (hit) { hit.cleared = true; hit.mesh.visible = false; a.audio.sfx('thunk'); if (this._barrels.every(b => b.cleared)) ch.advance('crane'); }
          else a.narrator.line('The magnet clanged on empty concrete.', { id: 's8_cranemiss', category: 'REACT' });
        } });

      api.use({ id: 'fuelcutoff', mesh: cutoff, pos: new THREE.Vector3(-6.6, 0.5, 6), reach: 1.8, prompt: 'shut the fuel cutoff',
        available: () => ch.ready('fuelcutoff'), onUse: () => ch.advance('fuelcutoff') });

      const tag = P.items.tag(0xd94040); tag.scale.setScalar(0.7);
      api.use({ id: 'tag', mesh: board, pos: new THREE.Vector3(9, 0.9, -6), reach: 1.8, prompt: 'take the lockout tag (key from the crane cab)',
        available: () => ch.ready('tag'),
        onUse: (a) => { this.hasTag = true; a.world.pickUp(this._tagEnt); ch.advance('tag'); } });
      this._tagEnt = api.use({ id: 'tagitem', mesh: tag, pos: tag.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'the lockout tag', available: () => ch.done('tag') && !ch.done('lockout') });
      api.prop(tag, 9, 0.9, -6.15);

      api.use({ id: 'breaker', mesh: breaker, pos: new THREE.Vector3(9, 0.6, -4), reach: 1.8, prompt: 'tag out the breaker',
        available: () => ch.ready('lockout'),
        acceptCarry: (item, a) => { if (item.id !== 'tagitem') return false; a.audio.sfx('unlock'); ch.advance('lockout'); return true; } });

      api.use({ id: 'gate', mesh: gate, pos: new THREE.Vector3(3, 0.9, 4), reach: 1.9, prompt: 'open the walkway gate',
        available: () => !ch.done('gate'),
        onUse: (a) => { if (!ch.ready('gate')) { a.audio.sfx('error'); a.narrator.say('s8_interlock2', { category: 'REACT' }); return; } gate.userData.open(); a.audio.sfx('unlock'); ch.advance('gate'); } });

      api.clean({ id: 'scrapheap', mesh: heap, pos: heap.position, reach: 1.7, cleanTime: 1.1, trashAmount: 0.02, removeOnClean: false,
        available: () => ch.ready('clearheap') && this._heapStage < 3,
        onClean: () => { this._heapStage++; if (this._heapStage >= 3) { heap.visible = false; ch.advance('clearheap'); } } });

      this._coreEnt = api.use({ id: 'core', mesh: core, pos: core.position, reach: 1.7, pickable: true, dropY: 0.9, prompt: 'lift the warm core',
        available: () => (ch.ready('core')) || (ch.done('core') && !ch.done('ship')),
        onPick: (a) => { if (ch.ready('core')) ch.advance('core'); } });

      api.use({ id: 'bell', mesh: bell, pos: new THREE.Vector3(9, 1.0, 3), reach: 1.8, prompt: 'ring for pickup',
        available: () => ch.ready('bell') || (ch.done('bell') && this._shipWindow <= 0 && !ch.done('ship')),
        onUse: (a) => { this._shipWindow = 60; if (ch.ready('bell')) ch.advance('bell'); else a.narrator.say('s8_step_bell', { category: 'REACT' }); a.audio.sfx('unlock'); } });

      api.use({ id: 'redbin', mesh: redBin, pos: new THREE.Vector3(-6, 0.7, 3), reach: 2, prompt: 'RED BIN (compacts)',
        acceptCarry: (item, a) => { a.audio.sfx('dump'); if (item.id === 'core') { setTimeout(() => { this._coreMesh.position.set(-2, 0.9, -3); a.group.add(this._coreMesh); this._coreEnt.carried = false; if (!a.interact.entities.includes(this._coreEnt)) a.interact.add(this._coreEnt); }, 700); a.narrator.line('The belt brought it round again.', { id: 's8_recover', category: 'REACT' }); } return true; } });

      api.use({ id: 'bluechute', mesh: blueChute, pos: new THREE.Vector3(6, 0.7, 3), reach: 2,
        prompt: () => this._shipWindow > 0 ? 'ship the core out' : 'OUTBOUND (sealed)',
        acceptCarry: (item, a) => {
          if (item.id !== 'core') { a.narrator.line('This chute is for things worth keeping.', { id: 's8_wrong', category: 'REACT' }); return false; }
          if (this._shipWindow <= 0) { a.audio.sfx('error'); a.narrator.say('s8_windowclosed', { category: 'REACT' }); return false; }
          a.audio.sfx('unlock'); a.narrator.say('s8_solve', { category: 'STORY' }); a.toast('Klaxons. The gate opens.'); ch.advance('ship'); a.solve(); return true;
        } });

      api.world.dust.position.set(0, 0, 5);
      api.setAnchors([{ cx: 0, cz: -1, dist: 20 }]);
      api.narrator.say('s8_intro', { category: 'STORY' });
      api.narrator.say('pa_1', { category: 'VOICE' });
    },

    update(dt, api) {
      if (api.solved) return;
      this._pulse += dt * 3;
      if (this._coreMesh && !this._coreEnt.carried && this._heap.visible) this._coreMesh.material.emissiveIntensity = 0.3 + (Math.sin(this._pulse) * 0.5 + 0.5) * 0.9;

      // the belt visibly runs until it's E-stopped (and stays stopped once locked out)
      const running = !this.beltStopped && !this.lockedOut;
      if (running) {
        for (const r of this._rollers) r.rotation.y += dt * 6;
        for (const s of this._scrap) { s.position.x += dt * 1.4; s.rotation.x += dt * 3; if (s.position.x > 8.2) s.position.x = -8; }
      }

      // backup generator keeps coughing the belt back to life until it's killed —
      // atmosphere/pressure only (the real fix is fuelcutoff → lockout). Never reverts progress.
      if (this.beltStopped && !this.genDead) {
        this._restartT -= dt;
        if (this._restartT <= 0) { this._restartT = 20; this.beltStopped = false; api.narrator.say('s8_restart', { category: 'VOICE' }); }
      }
      if (this._shipWindow > 0) this._shipWindow -= dt;
    },
  };
}
