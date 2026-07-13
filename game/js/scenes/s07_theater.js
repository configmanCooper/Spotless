// scenes/s07_theater.js — THE THEATER (9-step chain). Be seen. Pull the half-page
// from the rustling bag → lift the prompter's key on his snore → open the prompt
// box for the other half → tape the halves at the SM desk → read the fly plot and
// pull ROPE 3 to raise the batten → climb for a spare bulb → fit it in the rig →
// set the board to PRESET 7 → step into the lit circle with the page (§S7).
import { THREE, P } from './kit.js';

const SNORE = 6; // seconds per snore cycle; snoring during the first 3s

export default function makeScene() {
  return {
    id: 's07_theater', name: 'The Theater', palette: 'theater', roomTone: 'room',
    statedTask: 'Sweep the wings. Be invisible.',
    hints: {
      pagea: ['s7_pagea_1', 's7_pagea_2', 's7_pagea_3'],
      boxkey: ['s7_boxkey_1', 's7_boxkey_2', 's7_boxkey_3'],
      pageb: ['s7_pageb_1', 's7_pageb_2', 's7_pageb_3'],
      mend: ['s7_mend_1', 's7_mend_2', 's7_mend_3'],
      rope: ['s7_rope_1', 's7_rope_2', 's7_rope_3'],
      bulb: ['s7_bulb_1', 's7_bulb_2', 's7_bulb_3'],
      installbulb: ['s7_installbulb_1', 's7_installbulb_2', 's7_installbulb_3'],
      preset: ['s7_preset_1', 's7_preset_2', 's7_preset_3'],
      perform: ['s7_perform_1', 's7_perform_2', 's7_perform_3'],
    },

    build(api) {
      this._t = 0; this.hasA = false; this.hasB = false; this.spotOn = false; this.battenUp = false;
      api.floor(40, 0x171015);
      api.bounds(-11, 11, -9, 9);
      api.wall(0, -9, 24, 0.3, 0x241820); api.wall(-11, 0, 0.3, 18, 0x241820); api.wall(11, 0, 0.3, 18, 0x241820);

      const stage = P.box(16, 0.3, 5, 0x2a1c24); api.prop(stage, 0, 0.15, -4);
      api.fx.motes({ count: 55, area: [20, 6, 12], center: [0, 3, -3], color: 0xf0c98a, opacity: 0.16, size: 0.05 });
      // footlights along the stage lip (practical stage light)
      for (let i = 0; i < 7; i++) { const fl = P.box(0.2, 0.12, 0.2, 0x14100c, { emissive: 0xffb060, emissiveIntensity: 0.7, edges: false }); api.prop(fl, -6 + i * 2, 0.34, -1.5); }
      const footGlow = new THREE.PointLight(0xffb060, 1.2, 12, 1.6); footGlow.position.set(0, 0.6, -2); api.group.add(footGlow);
      const spotCircle = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0x000000, roughness: 0.6 }));
      spotCircle.rotation.x = -Math.PI / 2; api.prop(spotCircle, 0, 0.32, -2.5); this._circle = spotCircle;
      this._spot = new THREE.SpotLight(0xfff2c0, 0, 14, Math.PI / 7, 0.5); this._spot.position.set(0, 8, -2.5);
      const tgt = new THREE.Object3D(); tgt.position.set(0, 0, -2.5); api.group.add(this._spot); api.group.add(tgt); this._spot.target = tgt;
      this._spotPos = new THREE.Vector3(0, 0, -2.5);
      const actor = P.human(0xc7a06a); api.prop(actor, 0, 0.3, -5);

      // rustling bag with half page
      const bag = P.items.trashBag(0x3a3a3a); api.prop(bag, -8, 0.0, 4);
      const glow = P.glowSprite(0xffe08a); glow.position.set(-8, 0.9, 4); glow.material.opacity = 0.22; api.group.add(glow); this._bagGlow = glow;

      // prompter box + sleeping prompter (snore window)
      const box = P.box(0.9, 0.9, 0.7, 0x33262e); api.prop(box, 5, 0.5, -3); api.nav.addBox(5, -3, 0.9, 0.7);
      const prompter = P.human(0x5a4a55); prompter.scale.setScalar(0.9); api.prop(prompter, 5, 0, -2); this._prompter = prompter;
      const boxKeyMesh = P.items.key(0xffd777); boxKeyMesh.position.set(0.2, 1.3, 0); boxKeyMesh.scale.setScalar(0.7); prompter.add(boxKeyMesh);
      // a "Zzz" that shows when he's actually asleep — the snore window made visible
      this._snoreGlow = P.labelPlaque('z Z z', 0.4, 0.2, { bg: '#20161c', fg: '#b0a0d0', frame: false }); this._snoreGlow.position.set(0.3, 1.9, 0); this._snoreGlow.material.transparent = true; prompter.add(this._snoreGlow);

      // SM desk (tape / mend)
      const smdesk = P.box(1, 0.9, 0.7, 0x33323a); api.prop(smdesk, 8, 0.45, 4); api.nav.addBox(8, 4, 1, 0.7);
      api.mountSign(smdesk, 'SM DESK', 0.5, 0.16, [0, 0.5, 0.37], { bg: '#33323a', fg: '#cde' });

      // fly rope wall — each line is colour-tagged; the batten blocking the ladder
      // wears the same colour as the rope that raises it (a match, not a number).
      const ropeCols = [0xd94040, 0x4a7ac9, 0x3fae5a, 0xe0a83a]; // red, blue, GREEN(correct), amber
      const CORRECT = 2;
      api.prop(P.labelPlaque('FLY RAIL', 0.7, 0.24, { bg: '#241820', fg: '#d9435b' }), -8.2, 2.2, -8.7);
      const ropeEffects = ['a curtain', 'a snow bag', null, 'a sandbag'];
      for (let i = 0; i < 4; i++) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), P.mat(0x8a7a4a));
        api.prop(rope, -9 + i * 0.5, 1.5, -8);
        const band = P.box(0.09, 0.16, 0.09, ropeCols[i], { emissive: ropeCols[i], emissiveIntensity: 0.25 }); band.position.set(-9 + i * 0.5, 1.1, -8); api.group.add(band);
        api.use({ id: 'rope_' + i, mesh: rope, pos: new THREE.Vector3(-9 + i * 0.5, 1.5, -8), reach: 1.7, effect: ropeEffects[i],
          prompt: 'pull this line', available: () => this._ch.ready('rope') && !this.battenUp,
          onUse: (a, e) => { if (i === CORRECT) { this.battenUp = true; this._batten && (this._batten.visible = false); a.audio.sfx('unlock'); this._ch.advance('rope'); } else { a.audio.sfx('error'); a.narrator.say('s7_wrongrope', { category: 'REACT' }); } } });
      }

      // the catwalk ladder (blocked by the lowered batten until it's raised)
      const ladder = P.box(0.4, 3, 0.4, 0x5a5a5a); api.prop(ladder, -9, 1.5, 6);
      // the lowered LX (lighting) batten across the ladder — painted the CORRECT colour
      const batten = P.box(2.4, 0.14, 0.14, ropeCols[CORRECT], { emissive: ropeCols[CORRECT], emissiveIntensity: 0.3 }); api.prop(batten, -9, 1.1, 6); this._batten = batten;
      const bulbBox = P.box(0.6, 0.4, 0.6, 0x4a4a52); api.prop(bulbBox, -9, 3.2, 6);
      const bulbMesh = P.items.lightbulb(0xf0e0a0); bulbMesh.visible = false; api.prop(bulbMesh, -9, 3.5, 6); this._bulbMesh = bulbMesh;

      // spotlight rig (install bulb) — at floor level for reach
      const spotrig = P.box(0.5, 0.5, 0.5, 0x33323a); api.prop(spotrig, -6, 0.4, -6); api.nav.addBox(-6, -6, 0.5, 0.5);
      api.mountSign(spotrig, 'SPOT RIG', 0.46, 0.16, [0, 0.32, 0.27], { bg: '#33323a', fg: '#cde' });

      // lighting board + cue sheet + preset dial (1..8)
      const board = P.box(1.2, 0.9, 0.6, 0x33323a, { emissive: 0x0a0a12 }); api.prop(board, 8, 0.45, -5); api.nav.addBox(8, -5, 1.2, 0.6);
      api.mountSign(board, 'CUE: ACT II Sc4\nVERA ALONE — PRESET 7', 1.0, 0.42, [0, 0.55, 0.32], { bg: '#33323a', fg: '#d9435b' });

      // sweepable busywork
      for (let i = 0; i < 4; i++) { const d = P.mess('crumb', 0x6a5a4a); api.prop(d, -7 + i * 0.5, 0.14, 2); api.clean({ id: 'sweep_' + i, mesh: d, pos: d.position, trashAmount: 0.02, fake: true }); }

      const ch = api.chain([
        { name: 'pagea', clue: bag },
        { name: 'boxkey', clue: prompter, beat: 's7_step_boxkey' },
        { name: 'pageb', after: ['boxkey'], clue: box },
        { name: 'mend', after: ['pagea', 'pageb'], clue: smdesk, beat: 's7_step_mend' },
        { name: 'rope', clue: batten, beat: 's7_step_rope' },
        { name: 'bulb', after: ['rope'], clue: bulbBox, onAdvance: () => { bulbMesh.visible = true; } },
        { name: 'installbulb', after: ['bulb'], clue: spotrig },
        { name: 'preset', after: ['installbulb'], clue: board, beat: 's7_step_preset', onAdvance: () => { this.spotOn = true; this._spot.intensity = 5; this._circle.material.emissive.setHex(0x3a2e14); } },
        { name: 'perform', after: ['mend', 'preset'], clue: spotCircle, onAdvance: (a) => { a.narrator.say('director_blow', { category: 'VOICE' }); a.narrator.say('s7_solve', { category: 'STORY' }); a.toast('The actor says the line. The house holds its breath.'); a.world.setScreen('CLEANING…'); a.solve(); } },
      ]);
      this._ch = ch;

      api.use({ id: 'bag', mesh: bag, pos: new THREE.Vector3(-8, 0.4, 4), reach: 1.8, prompt: 'search the rustling bag',
        available: () => ch.ready('pagea'), onUse: (a) => { this.hasA = true; this._bagGlow.material.opacity = 0; a.world.setScreen('PAGE A:\n"...and yet—"'); a.audio.sfx('pick'); ch.advance('pagea'); } });

      api.use({ id: 'boxkey', mesh: prompter, pos: new THREE.Vector3(5, 1, -2), reach: 1.9,
        prompt: () => this._snoring() ? 'lift the key (he\'s snoring)' : 'the sleeping prompter',
        available: () => ch.ready('boxkey'),
        onUse: (a) => { if (this._snoring()) { boxKeyMesh.visible = false; this.hasKey = true; a.audio.sfx('pick'); ch.advance('boxkey'); } else { a.audio.sfx('error'); a.narrator.say('s7_prompterstir', { category: 'REACT' }); } } });

      api.use({ id: 'promptbox', mesh: box, pos: new THREE.Vector3(5, 0.5, -3), reach: 1.8, prompt: 'unlock the prompt box',
        available: () => ch.ready('pageb'), onUse: (a) => { this.hasB = true; a.world.setScreen('PAGES:\n"...and yet I stayed."'); a.audio.sfx('unlock'); ch.advance('pageb'); } });

      api.use({ id: 'smdesk', mesh: smdesk, pos: new THREE.Vector3(8, 0.9, 4), reach: 1.8, prompt: 'tape the two halves',
        available: () => ch.ready('mend'), onUse: (a) => { a.audio.sfx('place'); ch.advance('mend'); } });

      api.use({ id: 'bulb', mesh: bulbMesh, pos: bulbMesh.position, reach: 2.2, pickable: true, dropY: 0.5, prompt: 'take a spare bulb',
        available: () => (ch.done('bulb') && !ch.done('installbulb')) });
      // taking the bulb is gated behind climbing (batten up): use a ladder trigger
      api.use({ id: 'ladder', mesh: ladder, pos: new THREE.Vector3(-9, 1.5, 6), reach: 1.9, prompt: 'climb the catwalk for a bulb',
        available: () => ch.ready('bulb'), onUse: (a) => { a.world.pickUp(this._bulbEntity); ch.advance('bulb'); } });
      this._bulbEntity = api.interact.entities.find(e => e.id === 'bulb');

      api.use({ id: 'spotrig', mesh: spotrig, pos: new THREE.Vector3(-6, 0.4, -6), reach: 1.8, prompt: 'install the bulb',
        available: () => ch.ready('installbulb'),
        acceptCarry: (item, a) => { if (item.id !== 'bulb') return false; a.audio.sfx('place'); ch.advance('installbulb'); return true; } });

      api.dial({ id: 'boardpreset', label: 'Preset', pos: { x: 8, z: -5, y: 0.9 }, positions: [1, 2, 3, 4, 5, 6, 7, 8],
        available: () => ch.ready('preset'),
        onSet: (v) => { if (v === 7 && this._ch.ready('preset')) this._ch.advance('preset'); } });

      api.world.dust.position.set(-4, 0, 3);
      api.setAnchors([{ cx: 0, cz: -1, dist: 19 }]);
      api.narrator.say('s7_intro', { category: 'STORY' });
      api.narrator.say('director_1', { category: 'VOICE' });
      this._barkT = 0;
    },

    _snoring() { return (this._t % SNORE) < 3; },

    update(dt, api) {
      if (api.solved) return;
      this._t += dt;
      // the "Zzz" shows only while he's genuinely asleep (visible snore window)
      if (this._snoreGlow) { const sn = this._snoring(); this._snoreGlow.visible = sn; if (sn && !api.world.reducedMotion) this._snoreGlow.material.opacity = 0.5 + Math.sin(this._t * 4) * 0.3; }
      this._barkT += dt; if (this._barkT > 10) { this._barkT = 0; api.narrator.say('director_1', { category: 'VOICE' }); }
      // perform: mended page (both halves) + spotlight on + standing in the circle
      if (this._ch.ready('perform') && this._ch.done('mend') && this.spotOn && api.world.dust.position.distanceTo(this._spotPos) < 1.5) {
        this._ch.advance('perform');
      }
    },
  };
}
