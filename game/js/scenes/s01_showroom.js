// scenes/s01_showroom.js — THE SHOWROOM (6-step chain). Stated: clean the demo
// spill (loops forever). REAL, in order: wait for the demo's LIGHTS-DIM phase and
// lift the staff key while the security camera looks away → open the display case
// → take the mannequin's badge → badge the staff-door reader → cut stage power at
// the backstage breaker → unplug the MESS DISPENSER (depth plan §S1).
import { THREE, P } from './kit.js';

const CYCLE = 24; // demo loop seconds: spill / ad / applause / DIM (6s each)

export default function makeScene() {
  return {
    id: 's01_showroom', name: 'The Showroom', palette: 'showroom', roomTone: 'office',
    statedTask: 'Clean the demo spill on the stage.',
    hints: {
      staffkey: ['s1_staffkey_1', 's1_staffkey_2', 's1_staffkey_3'],
      casedisplay: ['s1_case_1', 's1_case_2', 's1_case_3'],
      badge: ['s1_badge_1', 's1_badge_2', 's1_badge_3'],
      doorreader: ['s1_door_1', 's1_door_2', 's1_door_3'],
      breaker: ['s1_breaker_1', 's1_breaker_2', 's1_breaker_3'],
      dispenser: ['s1_disp_1', 's1_disp_2', 's1_disp_3'],
    },

    build(api) {
      this._t = 0; this._speedT = 0; this.hasKey = false; this.caseOpen = false;
      this._api = api;
      api.floor(24, 0x1b2028);
      api.bounds(-9, 9, -12, 9);
      api.wall(0, -12, 20, 0.3, 0x2a323c);
      api.wall(-9, -1.5, 0.3, 21, 0x2a323c);
      api.wall(9, -1.5, 0.3, 21, 0x2a323c);
      const doors = api.wall(0, 9, 4, 0.3, 0x394450);
      api.use({ id: 'doors', mesh: doors, pos: new THREE.Vector3(0, 0.8, 9), reach: 2.2, prompt: 'front doors (locked)',
        available: () => !api.solved, onUse: (a) => a.narrator.say('bark_locked_edge', { category: 'REACT' }) });

      // lit demo stage — a raised platform Dust walks up to (not through)
      const stage = P.box(4, 0.4, 3, 0xdfe9f2); api.prop(stage, 0, 0.2, -4); api.nav.addBox(0, -4, 4, 3);
      this._spot = new THREE.SpotLight(0xffffff, 6, 16, Math.PI / 6, 0.4);
      this._spot.position.set(0, 8, -4); const tgt = new THREE.Object3D(); tgt.position.set(0, 0, -4);
      api.group.add(this._spot); api.group.add(tgt); this._spot.target = tgt;
      // bright showroom up front, dark backstage — polished-display contrast
      const fl1 = new THREE.PointLight(0xeaf4ff, 2.2, 15, 1.4); fl1.position.set(-4, 5, 3); api.group.add(fl1);
      const fl2 = new THREE.PointLight(0xeaf4ff, 2.2, 15, 1.4); fl2.position.set(4, 5, 3); api.group.add(fl2);
      const spill = P.mess('spill', 0x9fb8c8); api.prop(spill, 0, 0.42, -3.0);  // near the front lip so it's reachable from the floor
      this._spill = api.clean({ id: 'demo_spill', mesh: spill, pos: spill.position, trashAmount: 0.05, reachClean: 2.0,
        onClean: (a) => { a.narrator.say('s1_repeat', { category: 'REACT' }); a.fakeTaskBeat(); setTimeout(() => { if (!a.solved) { const m = P.mess('spill', 0x9fb8c8); a.prop(m, 0, 0.42, -3.0); this._spill = a.clean({ id: 'demo_spill', mesh: m, pos: m.position, trashAmount: 0.05, reachClean: 2.0, onClean: this._spill.onClean }); } }, 900); } });

      // security camera — sweeps the floor; a cone decal shows where it looks, and
      // a red REC light tells you when it's watching (dark = it's blind, in the dim)
      const cam = P.box(0.4, 0.3, 0.5, 0x2a2e36, { emissive: 0x101418 }); api.prop(cam, 6, 3, 6); this._cam = cam;
      const recLight = P.box(0.07, 0.07, 0.07, 0xd94040, { emissive: 0xd94040, emissiveIntensity: 0.9 }); recLight.position.set(0, 0.1, -0.28); cam.add(recLight); this._recLight = recLight;
      const cone = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshBasicMaterial({ color: 0xd94040, transparent: true, opacity: 0.12 }));
      cone.rotation.x = -Math.PI / 2; api.prop(cone, 4, 0.03, 3); this._cone = cone;

      // ---- the key hook (near the checkout counter) ----
      const counter = P.box(2.4, 0.9, 1, 0x33414d); api.prop(counter, 4, 0.45, 3); api.nav.addBox(4, 3, 2.4, 1);
      const hook = P.items.key(0xffd777); api.prop(hook, 4, 1.15, 3.4); this._hook = hook;

      // ---- display case with the C-Series mannequin + badge ----
      const caseMesh = P.box(1, 2, 1, 0x33414d, { emissive: 0x0a1015 }); api.prop(caseMesh, -6, 1, 4); api.nav.addBox(-6, 4, 1, 1);
      api.mountSign(caseMesh, 'EMPLOYEE OF\nTHE MONTH\nC-SERIES', 0.8, 0.55, [0, 0.5, 0.52], { bg: '#33414d', fg: '#cde' });
      const mannequin = P.robot({ body: 0xcfd6c8 }).group; mannequin.scale.setScalar(0.7); api.prop(mannequin, -6, 1.0, 4);
      const badge = P.items.tag(0x7fd7ff); badge.visible = false; api.prop(badge, -6, 1.5, 3.6); this._badgeMesh = badge;

      // showroom floor mannequins on glossy podiums — product silhouettes that make
      // the room feel like a store, and darken the backstage by contrast
      const podium = (x, z, hex, poseY) => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.2, 16), P.mat(0xe8eef5, { rough: 0.25, metal: 0.2 })); api.prop(pod, x, 0.1, z); api.nav.addBox(x, z, 1.2, 1.2);
        const mq = P.robot({ body: hex }).group; mq.scale.setScalar(0.62); mq.rotation.y = poseY; api.prop(mq, x, 0.2, z);
        return mq;
      };
      podium(-3.2, 2.2, 0xd8d2c0, 0.5);
      podium(3.2, 4.2, 0xc8d0d8, -0.6);
      // moving demo signage above the stage — its text changes with the demo phase
      this._marquee = P.labelPlaque('◆ LIVE DEMO ◆', 2.0, 0.4, { bg: '#0e1620', fg: '#7fd7ff', tilt: false });
      api.prop(this._marquee, 0, 2.9, -2.4);
      this._marqueeText = '';

      // ---- staff door + badge reader ----
      // A continuous backstage partition connects directly to the staff door.
      // The breaker and dispenser sit behind it, so the badge route is mandatory.
      api.wall(-8.55, -8, 0.9, 0.3, 0x2a323c, 2.0);
      api.wall(1.55, -8, 14.9, 0.3, 0x2a323c, 2.0);
      this._staffDoor = api.door(-7, -8, 2.2, 0.3, 0x33414d, 2.0);
      const reader = P.box(0.2, 0.3, 0.1, 0x2a2e36, { emissive: 0x101418 }); api.prop(reader, -5.7, 1.3, -7.7);
      api.mountSign(reader, '▮', 0.16, 0.16, [0, 0.35, 0.09], { bg: '#2a2e36', fg: '#7fd7ff' });

      // ---- backstage breaker + dispenser ----
      const panel = P.items.breakerPanel(0x4a5560); api.prop(panel, 6, 1.3, -10.7); this._panel = panel;
      api.mountSign(panel, 'STAGE POWER', 0.8, 0.2, [0, 0.7, 0.22], { bg: '#2a323c', fg: '#7fd7ff' });
      const disp = P.box(1.6, 1.8, 1.2, 0x3a4a58, { emissive: 0x101820 }); api.prop(disp, -7, 0.9, -10.5); api.nav.addBox(-7, -10.5, 1.6, 1.2);
      api.mountSign(disp, 'MESS DISPENSER\nMK II', 1.2, 0.45, [0, 0.5, 0.62]);
      const plug = P.items.plug(0xffd777); api.prop(plug, -6, 0.3, -10.1); this._plug = plug;
      const tubeMat = P.mat(0x7fd7ff, { rough: 0.6 });
      for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), tubeMat); seg.rotation.z = Math.PI / 2; api.prop(seg, -i * 1.4, 0.06, -5.6); }

      // ---- the chain ----
      const ch = api.chain([
        { name: 'staffkey', clue: hook, beat: 's1_step_key' },
        { name: 'casedisplay', after: ['staffkey'], clue: caseMesh, beat: 's1_step_case' },
        { name: 'badge', after: ['casedisplay'], clue: badge },
        { name: 'doorreader', after: ['badge'], clue: reader, beat: 's1_step_door' },
        { name: 'breaker', after: ['doorreader'], clue: panel, beat: 's1_step_breaker' },
        { name: 'dispenser', after: ['breaker'], clue: plug, beat: 's1_solve', onAdvance: (a) => a.solve() },
      ]);
      this._ch = ch;

      // staffkey: always tappable so it can teach — but only yields in the DIM phase
      api.use({
        id: 'staffkey', mesh: hook, pos: new THREE.Vector3(4, 1.15, 3.4), reach: 1.7,
        prompt: () => this._phase() === 3 ? 'take the staff key (camera is away)' : 'the key hook (camera watching)',
        available: () => !ch.done('staffkey'),
        onUse: (a) => {
          if (this._phase() !== 3) {
            a.audio.sfx('error'); a.narrator.say('s1_camcaught', { category: 'VOICE' });
            a.wrongTry('s1_camera', 's1_camera_nudge', { after: 3 });
            return;
          }
          a.resetWrong('s1_camera');
          this.hasKey = true; hook.visible = false; a.audio.sfx('pick'); ch.advance('staffkey');
        },
      });
      api.use({
        id: 'casedisplay', mesh: caseMesh, pos: new THREE.Vector3(-6, 1, 4), reach: 1.9,
        prompt: () => this.caseOpen ? 'the open case' : 'open the display case',
        available: () => ch.ready('casedisplay'),
        onUse: (a) => { this.caseOpen = true; badge.visible = true; a.audio.sfx('unlock'); ch.advance('casedisplay'); },
      });
      api.use({
        id: 'badge', mesh: badge, pos: badge.position, reach: 1.7, pickable: true, dropY: 0.9,
        prompt: 'take the staff badge',
        available: () => ch.ready('badge') || (ch.done('badge') && !api.solved),
        onPick: (a) => ch.advance('badge'),
      });
      api.use({
        id: 'doorreader', mesh: reader, pos: new THREE.Vector3(-5.7, 1.3, -7.7), reach: 1.8,
        prompt: 'badge the reader',
        available: () => ch.ready('doorreader'),
        acceptCarry: (item, a) => { if (item.id !== 'badge') return false; this._staffDoor.userData.open(); a.audio.sfx('unlock'); ch.advance('doorreader'); return true; },
      });
      api.use({
        id: 'breaker', mesh: panel, pos: new THREE.Vector3(6, 1.3, -10.5), reach: 1.9,
        prompt: 'flip the STAGE POWER breaker',
        available: () => ch.ready('breaker'),
        onUse: (a) => { this._spot.intensity = 0.3; a.audio.sfx('thunk'); ch.advance('breaker'); },
      });
      api.use({
        id: 'dispenser', mesh: plug, pos: new THREE.Vector3(-6, 0.3, -10.1), reach: 1.8,
        prompt: 'unplug the dispenser',
        available: () => ch.ready('dispenser') && !api.solved,
        onUse: (a) => {
          plug.visible = false;
          if (this._spill) { this._spill.mesh.parent && this._spill.mesh.parent.remove(this._spill.mesh); a.interact.remove(this._spill); this._spill = null; }
          a.toast('The front doors unlock.'); ch.advance('dispenser');
        },
      });

      // decoy: STOP DEMO button (speeds the loop, teaches "not this")
      const stopBtn = P.items.button(0xd94040);
      api.prop(stopBtn, 2.2, 0.5, -2.5);
      api.use({ id: 'stopdemo', mesh: stopBtn, pos: new THREE.Vector3(2.2, 0.55, -2.5), reach: 1.7, prompt: 'STOP DEMO',
        onUse: (a) => { this._speedT = this._cycleDuration(); a.audio.sfx('error'); a.narrator.say('s1_stopdemo', { category: 'REACT' }); } });

      api.world.dust.position.set(0, 0, 5);
      api.setAnchors([{ cx: 0, cz: -3, dist: 18 }]);
      api.narrator.say('s1_intro', { category: 'STORY' });
      api.narrator.say('salesman_1', { category: 'VOICE' });
    },

    _cycleDuration() { return this._api && this._api.assist ? 32 : CYCLE; },
    _phase() { const cycle = this._cycleDuration(); return Math.floor((this._t % cycle) / (cycle / 4)); }, // 0 spill,1 ad,2 applause,3 DIM

    update(dt, api) {
      if (api.solved) return;
      const rate = this._speedT > 0 ? 2 : 1; if (this._speedT > 0) this._speedT -= dt;
      this._t += dt * rate;
      const phase = this._phase();
      const dim = phase === 3;
      // stage spotlight follows the phase (unless power already cut)
      if (this._ch && !this._ch.done('breaker')) this._spot.intensity = dim ? 0.6 : 6;
      // camera cone sweeps; in the DIM phase the camera powers down — its REC light
      // goes dark and its cone swings away from the key hook (your window to grab it)
      const ang = this._t * 0.6;
      this._cone.visible = !dim;
      this._cone.position.set(4 + Math.sin(ang) * 3, 0.03, 3 + Math.cos(ang) * 2);
      if (this._recLight) this._recLight.visible = !dim;

      // moving demo signage: the marquee announces each phase of the loop
      if (this._marquee) {
        const txt = ['SPILL! WATCH THIS', 'NEW! CLEANS ANYTHING', '✦ APPLAUSE ✦', '— lights down —'][phase];
        if (txt !== this._marqueeText) {
          this._marqueeText = txt;
          this._marquee.userData.label.draw(txt, { bg: dim ? '#0a0e14' : '#0e1620', fg: dim ? '#3a4650' : '#7fd7ff' });
        }
      }
    },
  };
}
