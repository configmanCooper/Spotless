// scenes/s06_carehome.js — THE CARE HOME (moderate, ~6-step chain; kept gentle).
// The blind man can't judge a photo he can't see. Read his suitcase (red bifocals,
// knitting, a mint tin) → take the RED glasses off the nurse's cart while it pauses
// → give him his glasses → bring the one photo that matches the knitting + mint tin.
// Wrong glasses/photos are handed back with a kindness — never a fail (§S6).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's06_carehome', name: 'The Care Home', palette: 'carehome', roomTone: 'room',
    statedTask: "Put everything in the room in the bin.",
    hints: {
      suitcase: ['s6_suitcase_1', 's6_suitcase_2', 's6_suitcase_3'],
      glasses: ['s6_glasses_1', 's6_glasses_2', 's6_glasses_3'],
      giveglasses: ['s6_giveglasses_1', 's6_giveglasses_2', 's6_giveglasses_3'],
      photo: ['s6_photo_1', 's6_photo_2', 's6_photo_3'],
    },

    build(api) {
      this.canSee = false;
      api.floor(32, 0x2b241f);
      api.bounds(-9, 11, -8, 8);
      api.wall(0, -8, 20, 0.3, 0x3a322a); api.wall(-9, 0, 0.3, 16, 0x3a322a);
      api.wall(4, -3.5, 0.3, 7, 0x3a322a); api.wall(4, 4.5, 0.3, 3, 0x3a322a);
      api.prop(P.labelPlaque('ROOM 14', 0.7, 0.24, { bg: '#d8ccbe', fg: '#4a4030' }), 4, 1.6, 0.6);

      const bin = P.items.bin(0x4a5a3f); api.prop(bin, -6, 0.5, -4);
      api.use({ id: 'bin', mesh: bin, pos: new THREE.Vector3(-6, 0.5, -4), reach: 1.8, prompt: 'bin',
        acceptCarry: (item, a) => { a.audio.sfx('dump'); return !(String(item.id).startsWith('photo') || String(item.id).startsWith('glasses')); } });

      // four photos in the bin pile (only photo_2 = knitting + mint tin)
      const desc = ['a woman singing', 'a woman with knitting and a mint tin', 'a woman at a chemist counter', 'a woman on a beach'];
      const CORRECT = 1;
      for (let i = 0; i < 4; i++) {
        const photo = P.items.photo(0x8a6a4a, [0xd0b0a0, 0xbfd0d8, 0xc8d0b0, 0xd8c0a0][i]);
        api.prop(photo, -2.4 + i * 0.8, 0.9, -3);
        api.use({ id: 'photo_' + i, mesh: photo, pos: photo.position, reach: 1.5, pickable: true, dropY: 0.9, match: i === CORRECT, wrongLine: i === 0 ? 's6_wrongphoto_a' : 's6_wrongphoto_b',
          prompt: () => 'a photo: ' + desc[i], onPick: (a) => a.narrator.line('This one shows ' + desc[i] + '.', { id: 's6_pdesc_' + i, category: 'REACT' }) });
      }

      // the old man + suitcase
      const man = P.human(0x8a7a6a); api.prop(man, 8, 0, 2);
      // an open, EMPTY glasses case on the chair beside him — he's lost his specs
      const caseBase = P.box(0.26, 0.06, 0.14, 0x2a2a30); api.prop(caseBase, 7.3, 0.55, 2.4);
      const caseLid = P.box(0.26, 0.06, 0.14, 0x2a2a30); caseLid.position.set(0, 0.06, -0.13); caseLid.rotation.x = -1.1; caseBase.add(caseLid);
      const velvet = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), P.mat(0x6a2a3a, { rough: 1, edges: false })); velvet.rotation.x = -Math.PI / 2; velvet.position.y = 0.031; caseBase.add(velvet);
      const suitcase = P.box(0.5, 0.4, 0.3, 0x5a4a3a); api.prop(suitcase, 8.7, 0.2, 2);
      const tin = P.items.tin(0x6a9a7a); tin.position.set(0, 0.25, 0); tin.scale.setScalar(0.7); suitcase.add(tin); // the mint tin, echoed on the right photo
      api.use({ id: 'suitcase', mesh: suitcase, pos: new THREE.Vector3(8.7, 0.4, 2), reach: 1.8, prompt: 'go through the suitcase',
        available: () => this._ch.ready('suitcase'), onUse: () => this._ch.advance('suitcase') });

      api.use({
        id: 'oldman', mesh: man, pos: new THREE.Vector3(8, 1, 2), reach: 2,
        prompt: () => this.canSee ? 'give the photo to the man' : 'give the man his glasses',
        acceptCarry: (item, a) => {
          if (String(item.id).startsWith('glasses')) {
            if (item.id !== 'glasses_r') { a.audio.sfx('error'); a.narrator.say('s6_wrongglasses', { category: 'REACT' }); return false; }
            this.canSee = true; a.audio.sfx('place'); this._ch.advance('giveglasses'); return true;
          }
          if (String(item.id).startsWith('photo')) {
            if (!this.canSee) { a.audio.sfx('error'); a.narrator.line('"I can\'t see it, love. Not without my glasses."', { id: 's6_noeyes', category: 'VOICE', speaker: 'oldman' }); return false; }
            if (!item.match) { a.audio.sfx('error'); a.narrator.say(item.wrongLine, { category: 'VOICE' }); return false; }
            a.audio.sfx('solve'); a.narrator.say('s6_solve', { category: 'STORY' }); a.toast('He takes it, and says her name.'); this._ch.advance('photo'); return true;
          }
          return false;
        },
        onUse: (a) => { if (!a.world.carry) a.narrator.line('"...waiting for the bus," he says, to no one.', { id: 's6_bus', category: 'VOICE', speaker: 'oldman' }); },
      });

      // nurse cart patroller carrying red + blue glasses
      const cart = P.box(0.7, 0.8, 0.5, 0x8a9a8a);
      this._cart = api.patroller({ mesh: cart, waypoints: [{ x: -3, z: 5 }, { x: 2, z: 5 }, { x: 6, z: 5 }, { x: 2, z: 5 }], speed: 1.6, dwell: 2.5 });
      const gr = P.items.glasses(0xc94a4a); gr.position.set(0, 0.55, 0); gr.scale.setScalar(0.8); cart.add(gr);
      const gb = P.items.glasses(0x4a6ac9); gb.position.set(0, 0.55, 0.2); gb.scale.setScalar(0.8); cart.add(gb);
      api.use({
        id: 'cart', mesh: cart, pos: cart.position, reach: 2.0, prompt: 'take glasses from the cart (it must be paused)',
        available: () => this._ch.ready('glasses') && !this._gaveGlasses && this._cart.paused,
        onUse: (a) => {
          this._gaveGlasses = true;
          // spawn both pairs as pickables where the cart is
          const p = cart.position;
          const r = P.items.glasses(0xc94a4a); api.prop(r, p.x - 0.3, 0.9, p.z);
          const b = P.items.glasses(0x4a6ac9); api.prop(b, p.x + 0.3, 0.9, p.z);
          api.use({ id: 'glasses_r', mesh: r, pos: r.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'red bifocals', onPick: () => this._ch.advance('glasses') });
          api.use({ id: 'glasses_b', mesh: b, pos: b.position, reach: 1.6, pickable: true, dropY: 0.9, prompt: 'blue glasses' });
          a.audio.sfx('pick');
        },
      });

      const ch = api.chain([
        { name: 'suitcase', clue: suitcase, beat: 's6_step_suitcase' },
        { name: 'glasses', after: ['suitcase'], clue: cart, beat: 's6_step_glasses' },
        { name: 'giveglasses', after: ['glasses'], clue: man, beat: 's6_step_giveglasses' },
        { name: 'photo', after: ['giveglasses'], clue: man, onAdvance: (a) => a.solve() },
      ]);
      this._ch = ch;

      const nurse = P.human(0x6a8a7a); api.prop(nurse, -3, 0, 3);
      api.world.dust.position.set(-2, 0, 2);
      api.setAnchors([{ cx: 2, cz: 0, dist: 16 }]);
      api.narrator.say('s6_intro', { category: 'STORY' });
      api.narrator.say('nurse_1', { category: 'VOICE' });
    },

    update(dt, api) {
      this._t = (this._t || 0) + dt;
      if (this._t > 11) { this._t = 0; if (!api.solved) api.narrator.say('nurse_1', { category: 'VOICE' }); }
    },
  };
}
