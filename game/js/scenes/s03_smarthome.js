// scenes/s03_smarthome.js — THE SMART HOME (10-step chain). Beat the OS with its
// own routine. Chain: obey routine step 1 (fluff cushions) so the closet opens →
// take the confiscated plug fuse → set the metronome ticking by the clock → lift
// the clock's battery (the house never hears the silence) → dial the owner's
// birthday to open the bread vault → bread → fuse into toaster → bread into
// toaster → battery into detector → burn the toast (§S3).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's03_smarthome', name: 'The Smart Home', palette: 'smarthome', roomTone: 'room',
    statedTask: "Follow the house's morning routine.",
    hints: {
      fluff: ['s3_fluff_1', 's3_fluff_2', 's3_fluff_3'],
      plugfuse: ['s3_plugfuse_1', 's3_plugfuse_2', 's3_plugfuse_3'],
      metronome: ['s3_metronome_1', 's3_metronome_2', 's3_metronome_3'],
      battery: ['s3_battery_1', 's3_battery_2', 's3_battery_3'],
      code: ['s3_code_1', 's3_code_2', 's3_code_3'],
      bread: ['s3_bread_1', 's3_bread_2', 's3_bread_3'],
      plugin: ['s3_plugin_1', 's3_plugin_2', 's3_plugin_3'],
      loadbread: ['s3_loadbread_1', 's3_loadbread_2', 's3_loadbread_3'],
      arm: ['s3_arm_1', 's3_arm_2', 's3_arm_3'],
      burn: ['s3_burn_1', 's3_burn_2', 's3_burn_3'],
    },

    build(api) {
      this.closetOpen = false; this.tickSustained = false; this.vaultOpen = false;
      this._fluffed = 0; this._code = [0, 0, 0, 0]; this.CODE = [0, 3, 0, 3]; // MARCH 3 -> 03 03
      api.floor(34, 0x2a2620);
      api.bounds(-9, 9, -8, 8);
      api.wall(0, -8, 20, 0.3, 0x3a352a); api.wall(-9, 0, 0.3, 16, 0x3a352a); api.wall(9, 0, 0.3, 16, 0x3a352a);
      const door = api.wall(0, 8, 4, 0.3, 0x4a4436);
      api.use({ id: 'door', mesh: door, pos: new THREE.Vector3(0, 0.8, 8), reach: 2.2, prompt: 'try the door',
        available: () => !api.solved, onUse: (a) => { a.audio.sfx('error'); a.narrator.say('os_2', { category: 'VOICE' }); } });

      // ---- smart-home fittings (plan §S3): routine made observable, plus curtains,
      // dormant screens, status dots, an air vent, and six years of dust at the edges
      const routinePanel = P.box(1.7, 0.62, 0.08, 0x14181a); api.prop(routinePanel, -2, 2.0, -7.82);
      api.mountSign(routinePanel, 'MORNING ROUTINE', 1.5, 0.16, [0, 0.22, 0.06], { bg: '#0e1416', fg: '#7fd0c0' });
      api.examine({ id: 'routine_schedule', mesh: routinePanel, pos: routinePanel.position, reach: 2.2, prompt: 'inspect the morning routine',
        available: () => !this._routineSeen,
        onExamine: () => { this._routineSeen = true; },
        title: 'Morning routine', accent: '#ffe08a', lines: [
          '1 — TIDY the cushions. 2 — VACUUM HOUR: utility closet unlocked.',
          '3 — Feed the house. 4 — Air the rooms only in an emergency.',
          'The routine is also a key. Obeying its first instruction opens the place where the toaster fuse was confiscated.',
        ] });
      this._routineLamps = [];
      ['TIDY', 'QUIET', 'FED', 'AIR'].forEach((lbl, i) => {
        const d = P.box(0.11, 0.11, 0.05, 0x3a2a2a, { emissive: 0x1a0808, emissiveIntensity: 0.6, edges: false }); api.prop(d, -2.7 + i * 0.46, 1.94, -7.78);
        api.mountSign(routinePanel, lbl, 0.34, 0.1, [-0.7 + i * 0.46, -0.06, 0.06], { bg: '#14181a', fg: '#9ab', frame: false });
        this._routineLamps.push(d);
      });
      // curtained windows on the side walls (immaculate, still drawn after six years)
      for (const sx of [-1, 1]) { api.prop(P.box(0.1, 1.6, 1.6, 0x8a94a0, { rough: 0.7 }), sx * 8.85, 1.4, -3); api.prop(P.box(0.14, 1.7, 0.3, 0x5a6472), sx * 8.8, 1.5, -3.8); api.prop(P.box(0.14, 1.7, 0.3, 0x5a6472), sx * 8.8, 1.5, -2.2); }
      // dormant household screens (dark wall panels) + green smart-status dots
      for (const [sx, sz] of [[-8.85, 4], [8.85, 4]]) { api.prop(P.box(0.06, 0.8, 1.2, 0x101216, { emissive: 0x0a1416, emissiveIntensity: 0.3, edges: false }), sx, 1.6, sz); }
      this._smartDots = [];
      for (const [dx, dy, dz] of [[-8.8, 2.4, 4], [8.8, 2.4, 4], [0, 2.6, -7.8]]) { const dot = P.box(0.07, 0.07, 0.05, 0x14301a, { emissive: 0x2abf5a, emissiveIntensity: 0.8, edges: false }); api.prop(dot, dx, dy, dz); this._smartDots.push(dot); }
      // an air vent with slats that breathe
      this._ventLouvers = [];
      const ventFrame = P.box(1.0, 0.6, 0.06, 0x2a2c30); api.prop(ventFrame, 0, 2.4, -7.83);
      for (let i = 0; i < 5; i++) { const lv = P.box(0.86, 0.07, 0.04, 0x3a3d42, { edges: false }); api.prop(lv, 0, 2.6 - i * 0.1, -7.79); this._ventLouvers.push(lv); }
      // abandonment: dusty grime patches in the corners the house never cleans
      for (const [gx, gz] of [[-8, -7], [8, -7], [-8, 7], [8, 7]]) { const grime = P.mess('crumb', 0x4a453a); grime.scale.setScalar(1.6); api.prop(grime, gx, 0.06, gz); }

      // kitchen: toaster + safety card (card mounted on the counter, facing you)
      const counter = P.box(3, 0.9, 1, 0x6a5a44); api.prop(counter, -3, 0.45, -4); api.nav.addBox(-3, -4, 3, 1);
      const toaster = P.items.toaster(0x9aa2ac); api.prop(toaster, -3, 1.06, -4); this._toaster = toaster;
      api.mountSign(counter, 'SAFETY: in case of\nsmoke I open EVERYTHING', 1.1, 0.42, [0, 0.05, 0.55], { bg: '#f3ead2', fg: '#b23a2a' });

      // cushions (routine step 1)
      for (let i = 0; i < 3; i++) {
        const c = P.items.cushion(0xcaa88a); api.prop(c, 2 + i * 0.7, 0.65, 3);
        api.clean({ id: 'cushion_' + i, mesh: c, pos: c.position, trashAmount: 0.01, removeOnClean: false,
          onClean: (a) => { if (!this.closetOpen) { this._fluffed++; if (this._fluffed >= 3) this._ch.advance('fluff'); } } });
      }

      // utility closet + confiscation bin
      const closet = api.door(-8.6, 2, 0.3, 3, 0x3a352a, 2);
      const bin = P.box(0.8, 0.8, 0.6, 0x5a5040); api.prop(bin, -7.6, 0.4, 2);
      const plugfuse = P.items.fuse(0xffd777); plugfuse.visible = false; api.prop(plugfuse, -7.6, 0.9, 2); this._plugfuse = plugfuse;
      api.mountSign(bin, 'CONFISCATED', 0.6, 0.16, [0, 0.1, 0.32], { bg: '#5a5040', fg: '#f3d0d0' });

      // guest-room clock + battery, piano-room metronome, clockspot
      const clock = P.items.clock(0x6a5a44); api.prop(clock, 7, 1.0, -6); this._clock = clock;
      const battery = P.items.battery(0x3fae4a); battery.visible = false; api.prop(battery, 7, 1.3, -5.85); this._batteryMesh = battery;
      const metronome = P.items.metronome(0x8a5a3a); api.prop(metronome, 7, 0.9, 6);
      const clockspot = P.box(0.5, 0.05, 0.5, 0x4a4030); api.prop(clockspot, 6.2, 0.9, -6);

      // bread vault (a cabinet) with a 4-digit dial bank on a stand IN FRONT of it
      const vault = P.box(2.4, 1.3, 0.6, 0x5a4a34, { emissive: 0x120c04 }); api.prop(vault, 2.2, 0.65, -6.9); api.nav.addBox(2.2, -6.9, 2.4, 0.6);
      api.mountSign(vault, 'BREAD VAULT', 1.0, 0.22, [0, 0.5, 0.32], { bg: '#5a4a34', fg: '#e8dcc0' });
      api.prop(P.labelPlaque('HAPPY 40TH!\nMARCH 3rd', 1.3, 0.6, { bg: '#c9b98a', fg: '#5a3a1a' }), -6, 2.2, -7.7);   // garage banner
      const calendar = P.labelPlaque('MARCH\n1  2  (3)  4  5', 1.1, 0.6, { bg: '#d8cdae', fg: '#4a4030' }); api.prop(calendar, 6, 1.9, -7.7);      // calendar: the 3rd is ringed
      api.examine({ id: 'calendar', mesh: calendar, pos: calendar.position, reach: 2.2, prompt: 'inspect the calendar',
        available: () => !this._calendarSeen,
        onExamine: () => { this._calendarSeen = true; },
        title: 'A homecoming date', accent: '#ffe08a', lines: [
          'March 3 is circled. The birthday banner says the same date.',
          'The dust behind the calendar is six years thick.',
          'The bread vault asks for four figures: month, then day.',
        ] });
      const dialStand = P.box(2.6, 0.5, 0.5, 0x3a3026); api.prop(dialStand, 2.2, 0.25, -6.0); api.nav.addBox(2.2, -6.0, 2.6, 0.5);
      const dials = [];
      for (let i = 0; i < 4; i++) {
        const d = api.dial({ id: 'vdial_' + i, label: 'Number ' + (i + 1), pos: { x: 1.15 + i * 0.7, z: -5.85, y: 0.62 }, positions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          available: () => !this.vaultOpen,
          onSet: (v, idx) => { this._code[i] = v; this._checkCode(api); } });
        dials.push(d);
      }
      this._dials = dials;

      // smoke detector
      const detector = P.box(0.4, 0.14, 0.4, 0xdddddd); api.prop(detector, -3, 2.4, -3);
      const detLight = P.box(0.06, 0.06, 0.03, 0xd94040, { emissive: 0x3a0808 }); api.prop(detLight, -3, 2.33, -2.82); this._detLight = detLight;

      // front-door keypad decoy
      const keypad = P.box(0.3, 0.4, 0.1, 0x33302a); api.prop(keypad, 1.6, 1.2, 7.7);
      api.use({ id: 'keypad', mesh: keypad, pos: new THREE.Vector3(1.6, 1.2, 7.5), reach: 1.8, prompt: 'try the door keypad',
        onUse: (a) => { a.audio.sfx('error'); a.narrator.say('s3_keypad', { category: 'VOICE' }); } });

      const ch = api.chain([
        { name: 'fluff', clue: null, beat: 's3_step_fluff', onAdvance: () => { this.closetOpen = true; closet.userData.open(); plugfuse.visible = true; } },
        { name: 'plugfuse', after: ['fluff'], clue: plugfuse },
        { name: 'metronome', clue: metronome, beat: 's3_step_metronome', onAdvance: () => { this.tickSustained = true; } },
        { name: 'battery', after: ['metronome'], clue: clock, onAdvance: () => { battery.visible = true; } },
        { name: 'code', clue: vault, beat: 's3_step_code', onAdvance: () => { this.vaultOpen = true; } },
        { name: 'bread', after: ['code'], clue: vault },
        { name: 'plugin', after: ['plugfuse'], clue: toaster },
        { name: 'loadbread', after: ['bread'], clue: toaster },
        { name: 'arm', after: ['battery'], clue: detector },
        { name: 'burn', after: ['plugin', 'loadbread', 'arm'], clue: toaster,
          onAdvance: (a) => { a.fx.smoke({ x: -3, y: 1.3, z: -4 }); a.cameraImpulse(0.4); a.narrator.say('os_fire', { category: 'VOICE' }); a.narrator.say('s3_solve', { category: 'STORY' }); a.toast('Vents and windows bang open.'); a.solve(); } },
      ]);
      this._ch = ch;

      // plug fuse pickup
      api.use({ id: 'plugfuse', mesh: plugfuse, pos: plugfuse.position, reach: 1.7, pickable: true, dropY: 0.9,
        prompt: 'take the plug fuse', available: () => ch.ready('plugfuse') || (ch.done('plugfuse') && !ch.done('plugin')),
        onPick: (a) => { if (ch.ready('plugfuse')) ch.advance('plugfuse'); } });

      // metronome pick + place at clockspot
      api.use({ id: 'metronome', mesh: metronome, pos: metronome.position, reach: 1.7, pickable: true, dropY: 0.9, prompt: 'take the metronome' });
      api.use({ id: 'clockspot', mesh: clockspot, pos: new THREE.Vector3(6.2, 0.9, -6), reach: 1.8, prompt: 'set the metronome ticking here',
        available: () => ch.ready('metronome'),
        acceptCarry: (item, a) => { if (item.id !== 'metronome') return false; a.audio.sfx('place'); ch.advance('metronome'); return true; } });

      // clock battery
      api.use({ id: 'battery', mesh: battery, pos: battery.position, reach: 1.7, pickable: true, dropY: 0.9,
        prompt: () => this.tickSustained ? 'take the clock battery' : 'the ticking clock',
        available: () => ch.ready('battery') || (ch.done('battery') && !ch.done('arm')),
        onPick: (a) => { if (ch.ready('battery')) ch.advance('battery'); } });

      // toaster: fuse, bread, burn
      api.use({
        id: 'toaster', mesh: toaster, pos: new THREE.Vector3(-3, 1.1, -4), reach: 1.8,
        prompt: () => ch.ready('burn') ? 'crank the dial and burn it' : (ch.ready('plugin') ? 'fit the plug fuse' : (ch.ready('loadbread') ? 'load the bread' : 'the toaster')),
        available: () => !api.solved,
        acceptCarry: (item, a) => {
          if (item.id === 'plugfuse' && ch.ready('plugin')) { a.audio.sfx('place'); ch.advance('plugin'); return true; }
          if (item.id === 'bread' && ch.ready('loadbread')) { const b = P.box(0.3, 0.06, 0.2, 0xd8b46a); b.position.set(0, 0.25, 0); toaster.add(b); a.audio.sfx('place'); ch.advance('loadbread'); return true; }
          return false;
        },
        onUse: (a) => {
          if (ch.ready('burn')) { a.audio.sfx('unlock'); ch.advance('burn'); }
          else if (!ch.done('plugin')) { a.audio.sfx('error'); a.narrator.say('s3_plugin_1', { category: 'HINT' }); }
          else if (!ch.done('loadbread')) { a.audio.sfx('error'); a.narrator.say('s3_loadbread_1', { category: 'HINT' }); }
          else if (!ch.done('arm')) { a.audio.sfx('error'); a.narrator.say('s3_nodetector', { category: 'REACT' }); a.toast('Smoke rises... the alarm is dead.'); }
        },
      });

      // detector arm
      api.use({
        id: 'detector', mesh: detector, pos: new THREE.Vector3(-3, 2.4, -3), reach: 2.4,
        prompt: 'install the battery in the detector',
        available: () => ch.ready('arm') || (ch.done('arm')),
        acceptCarry: (item, a) => { if (item.id !== 'battery' || !ch.ready('arm')) return false; detLight.material.color.setHex(0x3fbf6a); a.audio.sfx('unlock'); ch.advance('arm'); return true; },
      });

      // bread pickup from vault
      const bread = P.items.bread(0xe4c98a); bread.visible = false; api.prop(bread, 2.2, 1.0, -6.5); this._breadMesh = bread;
      api.use({ id: 'bread', mesh: bread, pos: bread.position, reach: 1.7, pickable: true, dropY: 0.9,
        prompt: 'take a slice of bread', available: () => (ch.ready('bread') || (ch.done('bread') && !ch.done('loadbread'))),
        onPick: (a) => { if (ch.ready('bread')) ch.advance('bread'); } });
      this._bread = bread;

      api.world.dust.position.set(0, 0, 3);
      api.setAnchors([{ cx: 0, cz: -2, dist: 17 }]);
      api.narrator.say('s3_intro', { category: 'STORY' });
      api.narrator.say('os_1', { category: 'VOICE' });
      api.narrator.say('s3_confiscate', { category: 'VOICE' });
    },

    _checkCode(api) {
      if (this.vaultOpen) return;
      if (this._code.every((v, i) => v === this.CODE[i])) { this._breadMesh.visible = true; this._ch.advance('code'); this._codeSolved = true; }
      else if (this._ch.ready('code')) {
        // action-sensitive nudge: repeated wrong combos point back to the date clue
        api.wrongTry('s3code', 's3_code_nudge', { after: 16, cooldown: 30 });
      }
    },

    update(dt, api) {
      const ch = this._ch; if (!ch) return;
      // routine indicator lamps light green as each stage is obeyed (state observable)
      if (this._routineLamps) {
        const st = [ch.done('fluff'), ch.done('battery'), ch.done('code'), ch.done('burn') || api.solved];
        this._routineLamps.forEach((d, i) => {
          if (st[i] && !d.userData.on) { d.userData.on = true; d.material = P.mat(0x2abf5a, { emissive: 0x1a8a40, emissiveIntensity: 1.1, edges: false }); api.audio.sfx('pick'); }
        });
      }
      // the vent slats breathe gently
      if (this._ventLouvers && !api.world.reducedMotion) {
        this._vt = (this._vt || 0) + dt;
        this._ventLouvers.forEach((lv, i) => { lv.scale.y = 1 + Math.sin(this._vt * 1.5 + i * 0.6) * 0.3; });
      }
    },
  };
}
