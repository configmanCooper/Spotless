// scenes/s02_office.js — THE OFFICE (9-step chain). Stated: shred the IN tray.
// REAL: make the never-sent apology WHOLE and mail it. Chain: read the torn letter
// → sift the shredder bin for its missing corners → tape the matching corner on →
// flip the "transparency" plaque for the hidden drawer key → take the stamp →
// stamp the letter → flip the chute router from TRASH to MAIL → OUT tray (§S2).
import { THREE, P } from './kit.js';

export default function makeScene() {
  return {
    id: 's02_office', name: 'The Office', palette: 'office', roomTone: 'office',
    statedTask: 'Shred everything in the IN tray before morning.',
    hints: {
      readletter: ['s2_read_1', 's2_read_2', 's2_read_3'],
      fragments: ['s2_frag_1', 's2_frag_2', 's2_frag_3'],
      mendfrag: ['s2_mendfrag_1', 's2_mendfrag_2', 's2_mendfrag_3'],
      mendtape: ['s2_tape_1', 's2_tape_2', 's2_tape_3'],
      key: ['s2_key_1', 's2_key_2', 's2_key_3'],
      drawer: ['s2_drawer_1', 's2_drawer_2', 's2_drawer_3'],
      stampletter: ['s2_stamp_1', 's2_stamp_2', 's2_stamp_3'],
      router: ['s2_router_1', 's2_router_2', 's2_router_3'],
      mail: ['s2_mail_1', 's2_mail_2', 's2_mail_3'],
    },

    build(api) {
      this.hasKey = false; this.routerMail = false; this._carbon = false; this._shredStage = 0;
      api.floor(22, 0x232019);
      api.bounds(-9, 9, -8, 8);
      api.wall(0, -8, 20, 0.3, 0x33301f); api.wall(-9, 0, 0.3, 16, 0x33301f);
      api.wall(9, 0, 0.3, 16, 0x33301f); api.wall(0, 8, 20, 0.3, 0x33301f);

      const desk = P.box(4, 0.9, 2, 0x5a4a30); api.prop(desk, 0, 0.45, -3.5); api.nav.addBox(0, -3.5, 4, 2);
      const inTray = P.box(1, 0.1, 0.7, 0x8a7a4a); api.prop(inTray, -1.2, 0.95, -3.2);
      api.mountSign(inTray, 'IN', 0.32, 0.2, [0, 0.14, 0.36], {});
      // several IN-tray memos you can actually pick up and shred — a hollow little
      // busywork loop the assignment wants, before you reject it (plan §S2)
      this._shredCount = 0;
      for (let i = 0; i < 4; i++) {
        const m = P.box(0.7, 0.02, 0.5, [0xe8e0c8, 0xe0d6b8, 0xece4cc, 0xdcd0b0][i]); api.prop(m, -1.2, 1.02 + i * 0.03, -3.2);
        api.use({ id: 'memo_' + i, mesh: m, pos: new THREE.Vector3(-1.2, 1.02 + i * 0.03, -3.2), reach: 1.6, pickable: true, dropY: 1.0,
          prompt: 'take an IN-tray memo', memoIndex: i });
      }

      // warm task light over the desk, focused on the handwritten letter
      const deskLamp = new THREE.PointLight(0xffdca0, 2.6, 6, 1.6); deskLamp.position.set(0, 2.2, -3); api.group.add(deskLamp);
      api.prop(P.box(0.3, 0.1, 0.3, 0x1a1712, { emissive: 0xffdca0, emissiveIntensity: 0.4, edges: false }), 0, 2.35, -3);

      // the letter (stationary target; torn corner)
      const letter = P.items.paper(0xf4e8c0); api.prop(letter, 0, 1.0, -3.0);
      const torn = P.box(0.1, 0.031, 0.1, 0x232019, { edges: false }); torn.position.set(0.12, 0.012, 0.07); letter.add(torn); // the missing corner (dark gap)
      this._letter = letter;

      // OUT tray + chute
      const outTray = P.box(1, 0.1, 0.7, 0x6a6a5a, { rough: 1 }); api.prop(outTray, 1.6, 0.95, -3.2);
      api.mountSign(outTray, 'OUT', 0.32, 0.2, [0, 0.14, 0.36], { bg: '#c9c0a4' });
      const chute = P.box(0.6, 1.4, 0.4, 0x4a4636); api.prop(chute, 3.4, 1.2, -4);

      // shredder + its output bin (clean-target, 3 stages)
      const shred = P.box(0.9, 1, 0.7, 0x2a2a24, { emissive: 0x120600 }); api.prop(shred, -4, 0.5, -3); api.nav.addBox(-4, -3, 0.9, 0.7);
      api.mountSign(shred, 'SHREDDER', 0.72, 0.2, [0, 0.35, 0.37], { bg: '#c9433f', fg: '#fff' });
      const pile = P.mess('crumb', 0xd8cc9e); pile.scale.setScalar(2.2); api.prop(pile, -4, 0.2, -2.2); this._pile = pile;

      // tape dispenser (desk 3)
      const disp2 = P.box(0.5, 0.3, 0.4, 0x4a5560, { emissive: 0x0a1015 }); api.prop(disp2, 5, 0.9, 2); api.nav.addBox(5, 2, 0.5, 0.4);
      api.mountSign(disp2, 'TAPE', 0.34, 0.16, [0, 0.05, 0.22], { bg: '#4a5560', fg: '#cde' });

      // handbook plaque hiding the drawer key
      const handbook = P.labelPlaque('WE BELIEVE IN\nTRANSPARENCY', 1.2, 0.5, { bg: '#d8cdae', fg: '#4a4030' });
      handbook.rotation.z = 0.08; api.prop(handbook, -6, 1.6, -7.7);

      const drawer = P.box(1.2, 0.5, 0.4, 0x4a3d26); api.prop(drawer, 0, 0.4, -2.6);
      const drawerLight = P.box(0.1, 0.1, 0.04, 0xd94040, { emissive: 0x3a0808 }); api.prop(drawerLight, 0.55, 0.4, -2.4); this._drawerLight = drawerLight;

      // chute router lever (copy room)
      const router = P.items.lever(0x5a5030, 0x8a8a4a); api.prop(router, 7, 0.7, -6); api.nav.addBox(7, -6, 0.4, 0.4);
      api.mountSign(router, 'CHUTE:\nMAIL / TRASH', 0.8, 0.34, [0, 0.9, 0], { bg: '#33301f', fg: '#e8e0c8' });

      // ---- office density: fluorescent strips, copier glow, cubicles, chairs ----
      for (const fx of [-4.5, 0, 4.5]) { const strip = P.box(3, 0.1, 0.5, 0x14140e, { emissive: 0xdfe8c8, emissiveIntensity: 0.7, edges: false }); api.prop(strip, fx, 3.4, -1); }
      const flo = new THREE.PointLight(0xeef2d8, 1.1, 18, 1.5); flo.position.set(0, 3.2, -1); api.group.add(flo);
      // a copier with a cycling scan glow
      const copier = P.box(1.2, 1.3, 1, 0x6a6a62); api.prop(copier, -7, 0.65, 3); api.nav.addBox(-7, 3, 1.2, 1);
      this._copierGlow = P.box(1.0, 0.05, 0.8, 0x14141a, { emissive: 0x3fa0c0, emissiveIntensity: 0.6, edges: false }); api.prop(this._copierGlow, -7, 1.33, 3);
      api.mountSign(copier, 'COPIER', 0.7, 0.18, [0, 0.1, 0.52], { bg: '#3a3a34', fg: '#cde' });
      // cubicle partitions + monitors (background dressing)
      for (const [cx, cz] of [[-7, -4], [7, 3], [7, 6]]) {
        api.prop(P.box(2.2, 1.3, 0.12, 0x6a6450), cx, 0.65, cz);
        api.prop(P.box(0.12, 1.3, 1.6, 0x6a6450), cx + (cx > 0 ? -1 : 1), 0.65, cz - 0.8);
        const mon = P.box(0.5, 0.4, 0.08, 0x1a1a1e, { emissive: 0x14343a, emissiveIntensity: 0.5, edges: false }); api.prop(mon, cx, 1.05, cz - 0.55);
        const chair = P.box(0.5, 0.9, 0.5, 0x2a2a30); api.prop(chair, cx, 0.45, cz - 1.4);
      }
      // paper trail scattered across the floor (flavor clutter)
      for (let i = 0; i < 8; i++) { const p = P.box(0.3, 0.01, 0.22, 0xd8d0b4, { edges: false }); p.rotation.y = Math.random() * 3; api.prop(p, -8 + Math.random() * 16, 0.02, -6 + Math.random() * 12); }

      const ch = api.chain([
        { name: 'readletter', clue: letter, beat: 's2_step_read' },
        { name: 'fragments', after: ['readletter'], clue: pile, beat: 's2_step_frag' },
        { name: 'mendfrag', after: ['fragments'], clue: letter, beat: 's2_step_mendfrag' },
        { name: 'mendtape', after: ['mendfrag'], clue: disp2, beat: 's2_step_tape' },
        { name: 'key', after: ['readletter'], clue: handbook, beat: 's2_step_key' },
        { name: 'drawer', after: ['key'], clue: drawer },
        { name: 'stampletter', after: ['drawer', 'mendtape'], clue: letter },
        { name: 'router', after: ['readletter'], clue: router, beat: 's2_step_router' },
        { name: 'mail', after: ['stampletter', 'router'], clue: outTray, onAdvance: (a) => { a.audio.sfx('unlock'); a.narrator.say('s2_solve', { category: 'STORY' }); a.toast('Whoosh — the letter is on its way.'); a.solve(); } },
      ]);
      this._ch = ch;

      // letter: read, then accept corner / tape / stamp; finally mailable
      const letterEnt = api.use({
        id: 'letter', mesh: letter, pos: letter.position, reach: 1.6, dropY: 1.0, pickable: false,
        prompt: () => letter.userData.ready ? 'take the finished letter' : (ch.done('readletter') ? 'examine the handwriting' : 'the handwritten letter'),
        onUse: (a) => {
          if (ch.ready('readletter')) { a.narrator.line('The hand loops hard to the left — unmistakable.', { id: 's2_hand', category: 'REACT' }); ch.advance('readletter'); }
          else if (ch.done('readletter') && !letter.userData.ready && !a.world.carry) {
            a.openExamine({ title: 'The unsent apology', accent: '#bcd08a', lines: [
              'The letter is whole but for one corner, torn clean away.',
              'The hand loops hard to the left — pressed deep, angry once, then softened.',
              'Whatever came out of the shredder in this same hand belongs here.',
              'The other corners are in other hands. They are not part of this.',
            ] });
          }
        },
        acceptCarry: (item, a) => {
          if (item.id === 'fragment_2' && ch.ready('mendfrag')) { torn.material = P.mat(0xf4e8c0); a.audio.sfx('place'); ch.advance('mendfrag'); return true; }
          if (String(item.id).startsWith('fragment')) { a.audio.sfx('error'); a.narrator.say('s2_wrongfrag', { category: 'REACT' }); return false; }
          if (item.id === 'tape' && ch.ready('mendtape')) { letter.userData.mended = true; a.audio.sfx('place'); ch.advance('mendtape'); return true; }
          if (item.id === 'stamp' && ch.ready('stampletter')) { letter.userData.stamped = true; letter.userData.ready = true; letterEnt.pickable = true; const s = P.box(0.1, 0.02, 0.08, 0xc94a4a); s.position.set(0.1, 0.02, -0.08); letter.add(s); a.audio.sfx('place'); ch.advance('stampletter'); return true; }
          return false;
        },
      });

      // shredder bin: 3-stage hold-clean → spawns three corners
      this._pileEnt = api.clean({
        id: 'shredpile', mesh: pile, pos: pile.position, reach: 1.7, cleanTime: 1.1, trashAmount: 0.02, removeOnClean: false,
        available: () => ch.ready('fragments') && this._shredStage < 3,
        onClean: (a) => {
          this._shredStage++;
          if (this._shredStage >= 3) {
            pile.visible = false; a.interact.remove(this._pileEnt);
            const hands = ['a blocky print', 'a tidy cursive', 'a hard left-leaning scrawl'];
            for (let i = 0; i < 3; i++) {
              const f = P.box(0.12, 0.02, 0.1, 0xf0ead2); api.prop(f, -4 + (i - 1) * 0.4, 0.5, -1.4);
              api.use({ id: 'fragment_' + i, mesh: f, pos: f.position, reach: 1.5, pickable: true, dropY: 0.5, hand: hands[i],
                prompt: () => 'corner: ' + hands[i], onPick: (aa) => aa.narrator.line('This corner is ' + hands[i] + '.', { id: 'frag_read_' + i, category: 'REACT' }) });
            }
            ch.advance('fragments');
          }
        },
      });

      // shredder as a trap (carbon recovery)
      api.use({
        id: 'shredder', mesh: shred, pos: new THREE.Vector3(-4, 0.5, -3), reach: 1.8, prompt: 'shred',
        acceptCarry: (item, a) => {
          a.audio.sfx('dump');
          if (String(item.id).startsWith('memo_')) {
            // the assignment, performed: shred a memo, get a hollow corporate line
            const lines = ['s2_memo_1', 's2_memo_2', 's2_memo_3', 's2_memo_4'];
            a.narrator.say(lines[Math.min(this._shredCount, lines.length - 1)], { category: 'VOICE' });
            this._shredCount++;
            item.mesh && item.mesh.parent && item.mesh.parent.remove(item.mesh); a.interact.remove(item);
            return true;
          }
          if (item.id === 'letter' && !this._carbon) {
            this._carbon = true;
            const carbon = P.box(0.36, 0.03, 0.26, 0xf0ead2); const cs = P.box(0.1, 0.02, 0.08, 0xc94a4a); cs.position.set(0.1, 0.02, -0.08); carbon.add(cs);
            api.prop(carbon, 1.6, 0.86, -2.6);
            api.use({ id: 'carbon', mesh: carbon, pos: carbon.position, reach: 1.5, pickable: true, dropY: 0.86, prompt: 'take the carbon copy (whole, stamped)' });
            a.narrator.say('s2_carbon', { category: 'REACT' });
          }
          return true;
        },
      });

      // tape dispenser
      api.use({
        id: 'tapedisp', mesh: disp2, pos: new THREE.Vector3(5, 0.9, 2), reach: 1.7, prompt: 'take a strip of tape',
        available: () => ch.ready('mendtape') && !this._gaveTape,
        onUse: (a) => { this._gaveTape = true; const t = P.items.tape(0xdfe4d8); api.prop(t, 5, 1.05, 2.2); api.use({ id: 'tape', mesh: t, pos: t.position, reach: 1.5, pickable: true, dropY: 1.0, prompt: 'the tape' }); a.audio.sfx('pick'); },
      });

      // handbook plaque → key
      api.use({
        id: 'handbook', mesh: handbook, pos: new THREE.Vector3(-6, 1.6, -7.5), reach: 2,
        prompt: () => this.hasKey ? 'the crooked plaque' : 'flip the handbook plaque',
        available: () => ch.ready('key'),
        onUse: (a) => { this.hasKey = true; a.audio.sfx('pick'); ch.advance('key'); },
      });

      // drawer → stamp
      api.use({
        id: 'drawer', mesh: drawer, pos: new THREE.Vector3(0, 0.4, -2.6), reach: 1.8,
        prompt: () => this.hasKey ? 'unlock the drawer' : 'drawer (locked)',
        available: () => ch.ready('drawer'),
        onUse: (a) => {
          drawerLight.material.color.setHex(0x3fbf6a); a.audio.sfx('unlock');
          const stamp = P.items.stamp(0xc94a4a); api.prop(stamp, 0.4, 0.55, -2.4);
          api.use({ id: 'stamp', mesh: stamp, pos: stamp.position, reach: 1.5, pickable: true, dropY: 0.9, prompt: 'take the stamp' });
          ch.advance('drawer');
        },
      });

      // chute router
      api.use({
        id: 'router', mesh: router, pos: new THREE.Vector3(7, 1.0, -6), reach: 1.8,
        prompt: () => this.routerMail ? 'chute: MAIL' : 'set the chute router to MAIL',
        available: () => ch.ready('router'),
        onUse: (a) => { this.routerMail = true; a.audio.sfx('unlock'); ch.advance('router'); },
      });

      // OUT tray (final)
      api.use({
        id: 'out_tray', mesh: outTray, pos: new THREE.Vector3(1.6, 0.95, -3.2), reach: 1.8, prompt: 'place the letter in the OUT tray',
        acceptCarry: (item, a) => {
          if (item.id === 'carbon') { a.audio.sfx('unlock'); a.narrator.say('s2_solve', { category: 'STORY' }); a.toast('Whoosh — on its way.'); a.solve(); return true; }
          if (item.id !== 'letter') return false;
          if (!(letter.userData.ready)) { a.audio.sfx('error'); a.narrator.say('s2_unstamped', { category: 'REACT' }); a.toast('The chute spits it back: not finished.'); return false; }
          if (!this.routerMail) { a.audio.sfx('error'); a.narrator.say('s2_router_2', { category: 'HINT' }); a.toast('It went to the shredder. Check the router.'); return false; }
          ch.advance('mail'); return true;
        },
      });

      // reclamation crumb
      const notice = P.box(0.34, 0.02, 0.24, 0xe0d6b0); api.prop(notice, -1.2, 1.12, -3.2);
      api.use({ id: 'notice', mesh: notice, pos: notice.position, reach: 1.5, pickable: true, dropY: 1.0, prompt: 'read: UNIT RECLAMATION NOTICE', onPick: (a) => a.narrator.say('s2_reclaim', { category: 'STORY' }) });

      api.world.dust.position.set(0, 0, 2);
      api.setAnchors([{ cx: 0, cz: -2, dist: 16 }]);
      api.narrator.say('s2_intro', { category: 'STORY' });
      api.narrator.line('Shred everything in the IN tray before morning.', { id: 'boss_vm', category: 'VOICE', speaker: 'boss' });
    },

    update(dt, api) {
      if (this._copierGlow && !api.world.reducedMotion) {
        this._ct = (this._ct || 0) + dt;
        this._copierGlow.material.emissiveIntensity = 0.4 + 0.4 * Math.pow(Math.max(0, Math.sin(this._ct * 1.6)), 3);
      }
    },
  };
}
