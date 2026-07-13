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

      // kitchen: toaster + safety card
      const counter = P.box(3, 0.9, 1, 0x6a5a44); api.prop(counter, -3, 0.45, -4); api.nav.addBox(-3, -4, 3, 1);
      const toaster = P.items.toaster(0x9aa2ac); api.prop(toaster, -3, 1.06, -4); this._toaster = toaster;
      api.prop(P.labelPlaque('SAFETY: in case of\nsmoke I open EVERYTHING', 1.3, 0.5, { bg: '#f3ead2', fg: '#b23a2a' }), -3, 1.5, -4.45);

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
      api.prop(P.labelPlaque('CONFISCATED', 0.8, 0.2, { bg: '#5a5040', fg: '#f3d' }), -7.6, 1.0, 1.6);

      // guest-room clock + battery, piano-room metronome, clockspot
      const clock = P.items.clock(0x6a5a44); api.prop(clock, 7, 1.0, -6); this._clock = clock;
      const battery = P.items.battery(0x3fae4a); battery.visible = false; api.prop(battery, 7, 1.3, -5.85); this._batteryMesh = battery;
      const metronome = P.items.metronome(0x8a5a3a); api.prop(metronome, 7, 0.9, 6);
      const clockspot = P.box(0.5, 0.05, 0.5, 0x4a4030); api.prop(clockspot, 6.2, 0.9, -6);

      // bread vault (a cabinet) with a 4-digit dial bank on a stand IN FRONT of it
      const vault = P.box(2.4, 1.3, 0.6, 0x5a4a34, { emissive: 0x120c04 }); api.prop(vault, 2.2, 0.65, -6.9); api.nav.addBox(2.2, -6.9, 2.4, 0.6);
      api.prop(P.labelPlaque('BREAD VAULT', 1.1, 0.24, { bg: '#5a4a34', fg: '#e8dcc0' }), 2.2, 1.55, -6.9);
      api.prop(P.labelPlaque('HAPPY 40TH!\nMARCH 3rd', 1.3, 0.6, { bg: '#c9b98a', fg: '#5a3a1a' }), -6, 2.2, -7.7);   // garage banner
      api.prop(P.labelPlaque('MARCH\n1  2  (3)  4  5', 1.1, 0.6, { bg: '#d8cdae', fg: '#4a4030' }), 6, 1.9, -7.7);      // calendar: the 3rd is ringed
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
          onAdvance: (a) => { a.narrator.say('os_fire', { category: 'VOICE' }); a.narrator.say('s3_solve', { category: 'STORY' }); a.toast('Vents and windows bang open.'); a.solve(); } },
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
      if (this._code.every((v, i) => v === this.CODE[i])) { this._breadMesh.visible = true; this._ch.advance('code'); }
    },

    update() {},
  };
}
