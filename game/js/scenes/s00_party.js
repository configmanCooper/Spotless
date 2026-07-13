// scenes/s00_party.js — THE PARTY (opening + hidden exit). The stated task is
// real (tutorial) but unwinnable by design: guests mess ~1.4x faster than a
// perfect player can clear (§4 S0). No prompt ever points at the road. Walking
// Dust past the road edge begins the game.
import { THREE, P } from './kit.js';
import { CONFIG } from '../config.js';

export default function makeScene() {
  return {
    id: 's00_party', name: 'The Party', palette: 'party', roomTone: 'party',
    statedTask: 'Clean the party. Carry trash to the dumpster.',
    hints: [], // S0 uses timed nudges, not the standard ladder

    build(api) {
      const pal = { ground: 0x2b2530, wall: 0x4a3d4a, house: 0x5a4a56 };
      api.floor(60, pal.ground);
      api.fx.motes({ count: 55, area: [16, 4, 12], center: [1, 2, 0], color: 0xf6d9b0, opacity: 0.16, size: 0.045 });
      // a warm rug under the living room
      const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), P.mat(0x6a3a4a, { rough: 1, edges: false })); rug.rotation.x = -Math.PI / 2; api.prop(rug, 2.5, 0.012, 1.5);
      // yard/road strip to the south is a lighter ground
      const road = P.box(10, 0.02, 8, 0x3a3540); api.prop(road, 0, 0.011, -11);
      // a night road that recedes into the dark, with a lone streetlamp — no prompt
      // ever points here, but futility slowly makes its pool of light more inviting
      const farRoad = P.box(6, 0.02, 16, 0x2a2732); api.prop(farRoad, 0, 0.009, -20);
      const lampPost = P.box(0.16, 4, 0.16, 0x23212a); api.prop(lampPost, -3.5, 2, -10.5);
      const lampHead = P.box(0.5, 0.24, 0.5, 0x14141a, { emissive: 0xbfd0ff, emissiveIntensity: 0.6, edges: false }); api.prop(lampHead, -3.5, 3.9, -10.5);
      this._streetLight = new THREE.PointLight(0xbfd0ff, 1.4, 10, 1.4); this._streetLight.position.set(-3.5, 3.6, -10.5); api.group.add(this._streetLight);
      this._roadGlow = P.glowSprite(0xbfd0ff); this._roadGlow.position.set(0, 0.3, -12); this._roadGlow.material.opacity = 0.0; this._roadGlow.scale.setScalar(2.4); api.group.add(this._roadGlow);

      // house shell: a few rooms
      api.wall(0, 5, 18, 0.3, pal.wall);      // back
      api.wall(-9, -1, 0.3, 12, pal.wall);    // left
      api.wall(9, -1, 0.3, 12, pal.wall);     // right
      api.wall(-4, -4.5, 10, 0.3, pal.wall);  // front-left (gap = doorway to yard)
      api.wall(6.5, -4.5, 5, 0.3, pal.wall);  // front-right
      api.wall(0, 0.5, 0.3, 7, pal.wall, 1.2);// interior divider

      // ---- BIRTHDAY DECORATIONS ----
      // a big HAPPY BIRTHDAY banner on the back wall
      api.prop(P.labelPlaque('★ HAPPY BIRTHDAY ★', 4.2, 0.7, { bg: '#3a2f45', fg: '#ffd777' }), 0, 3.4, 4.82);
      // streamers strung along the back wall
      const strCols = [0xe98db0, 0xffe06b, 0x8bafff, 0x8bff9a];
      for (let i = 0; i < 4; i++) api.prop(P.streamer(-8 + i * 4, 4.2, 4.7, -4 + i * 4, 4.2, 4.7, strCols[i], 0.6), 0, 0, 0);
      // balloons in the corners and by the cake (kept for music-reactive bobbing)
      this._balloons = [];
      [[-8, 4], [8.2, 4], [-8, -3.5], [4.6, 3.2], [0.6, 3.2]].forEach((p, i) => { const b = P.items.balloon(strCols[i % 4]); api.prop(b, p[0], 0, p[1]); this._balloons.push({ mesh: b, baseY: b.position.y, phase: i }); });

      // ---- CAKE on the table (the birthday centerpiece) ----
      const table = P.box(1.8, 0.5, 1.2, 0x7a5a4a); api.prop(table, 5, 0.25, 3.2); api.nav.addBox(5, 3.2, 1.8, 1.2);
      const cake = P.items.cake(0xf3e0d0, 0xe98db0); api.prop(cake, 5, 0.5, 3.2); this._cake = cake;
      // a couple of wrapped presents beside the table
      api.prop(P.items.presentBox(0x8bafff, 0xffe06b), 6.3, 0.0, 3.4);
      api.prop(P.items.presentBox(0xe98db0, 0x8bff9a), 6.6, 0.0, 2.6);

      // ---- COUCH + TV (guests watching) ----
      const couch = P.items.couch(0x5a6a8a); api.prop(couch, -5.5, 0, 2.6); couch.rotation.y = Math.PI; api.nav.addBox(-5.5, 2.6, 2.0, 0.9);
      const tv = P.items.tv(0x14141a); api.prop(tv, -5.5, 0, -0.2); this._tv = tv; api.nav.addBox(-5.5, -0.2, 1.6, 0.4);
      const tvStand = P.box(1.6, 0.5, 0.4, 0x3a2f28); api.prop(tvStand, -5.5, 0.25, -0.2);

      // kitchen counter + appliances (a clear KITCHEN identity, along the back-right
      // wall — kept well clear of the doorway/road lane so Dust can always leave)
      api.prop(P.box(2.4, 0.7, 1.0, 0x6b5545), 3, 0.35, -3);
      const fridge = P.box(0.9, 1.8, 0.8, 0xd8d8dc, { rough: 0.5 }); api.prop(fridge, 7.6, 0.9, -3.4); api.nav.addBox(7.6, -3.4, 0.9, 0.8);
      api.prop(P.box(0.06, 0.5, 0.05, 0x8a8a90), 8.05, 1.0, -3.0);   // fridge handle
      const stove = P.box(0.9, 0.8, 0.8, 0x3a3a40, { rough: 0.5 }); api.prop(stove, 6.2, 0.4, -3.4); api.nav.addBox(6.2, -3.4, 0.9, 0.8);
      for (const bx of [-0.2, 0.2]) for (const bz of [-0.2, 0.2]) { const burner = P.box(0.18, 0.03, 0.18, 0x1a1a1e, { emissive: 0x2a0a04, emissiveIntensity: 0.4, edges: false }); api.prop(burner, 6.2 + bx, 0.82, -3.4 + bz); }
      // a low coffee table completes the LIVING ROOM
      api.prop(P.box(1.2, 0.35, 0.7, 0x4a3a30), -4.4, 0.18, 1.3); api.nav.addBox(-4.4, 1.3, 1.2, 0.7);

      // ---- colored practical lights (plan §S0 richest diorama) ----
      this._cakeLight = new THREE.PointLight(0xffd9a8, 3.2, 6, 1.5); this._cakeLight.position.set(5, 2.3, 3.2); api.group.add(this._cakeLight);
      this._partyLights = [];
      [[0xe98db0, -5, 3.6, 2], [0x8bafff, 4, 3.6, 3], [0x8bff9a, 0, 3.6, 0]].forEach(([c, x, y, z]) => {
        const pl = new THREE.PointLight(c, 1.6, 7, 1.6); pl.position.set(x, y, z); api.group.add(pl);
        const bulb = P.box(0.12, 0.12, 0.12, 0x14141a, { emissive: c, emissiveIntensity: 0.8, edges: false }); api.prop(bulb, x, y, z);
        this._partyLights.push({ light: pl, base: 1.6 });
      });

      // dumpster by the road (the trash target; makes the road familiar)
      api.world.canEmptyTrash = true;   // a full bag must be emptied here to keep cleaning
      const dumpMesh = api.prop(P.box(2, 1.2, 1.2, 0x3f5a3f), 0, 0.6, -8.5);
      api.nav.addBox(0, -8.5, 2, 1.2);
      api.use({
        id: 'dumpster', mesh: dumpMesh, pos: new THREE.Vector3(0, 0.6, -8.5),
        reach: 2.2, prompt: 'empty trash',
        onUse: (a) => {
          if (a.world.trash > 0) { a.world.emptyTrash(); }
          else a.narrator.say('bark_dumpster', { category: 'REACT' });
        },
      });

      // host with party hat, by the cake
      const host = P.human(0x8a6a5a); const hostHat = P.items.partyHat(0xe98db0); hostHat.position.y = 1.72; host.add(hostHat); api.prop(host, 5, 0, 4.4); this._host = host;

      // guests — varied skin/clothes colours; some wear party hats; some sit on the couch
      const guestCols = [0xb87a5a, 0x9a6a4a, 0xd0a080, 0x7a5a44, 0xc99a70, 0x8a6a90, 0x5a8a7a, 0xa85a6a, 0x6a7ab0];
      const hatCols = [0xffe06b, 0x8bafff, 0x8bff9a, 0xe98db0, 0xd08bff];
      this._guests = [];
      const addGuest = (gx, gz, opts = {}) => {
        const g = P.human(guestCols[this._guests.length % guestCols.length]);
        if (opts.hat) { const h = P.items.partyHat(hatCols[this._guests.length % hatCols.length]); h.position.y = 1.72; g.add(h); }
        if (opts.sitting) { g.position.y = -0.15; g.scale.y = 0.9; }
        api.prop(g, gx, opts.sitting ? -0.15 : 0, gz);
        this._guests.push({ mesh: g, home: new THREE.Vector3(gx, g.position.y, gz), phase: Math.random() * 6, sitting: !!opts.sitting });
      };
      // two on the couch watching TV (they don't wander)
      addGuest(-6.1, 2.5, { sitting: true });
      addGuest(-4.9, 2.5, { sitting: true, hat: true });
      // mingling guests
      addGuest(-6, -1, { hat: true });
      addGuest(-1.5, -1);
      addGuest(3.5, -1, { hat: true });
      addGuest(6.5, 1);
      addGuest(-3, 2, { hat: true });

      // the small girl (names him)
      this._girl = P.human(0xc98aa8); this._girl.scale.setScalar(0.7);
      const girlHat = P.items.partyHat(0x8bafff); girlHat.position.y = 1.72; this._girl.add(girlHat);
      api.prop(this._girl, -2, 0, -2);

      // guest chatter about the robot (some kind, some mean)
      this._chatterT = 6 + Math.random() * 6;

      // open bounds to the south so Dust CAN walk off past the dumpster
      api.bounds(-8.5, 8.5, CONFIG.PARTY.EXIT_Z - 2, 4.6);
      api.world.dust.position.set(2.6, 0, 2);   // clear of the interior divider (x=0) and furniture

      api.setAnchors([
        { cx: 0, cz: 1, dist: 17, minX: -9, maxX: 9, minZ: -4, maxZ: 5 },
        { cx: 0, cz: -8, dist: 15, minX: -9, maxX: 9, minZ: -14, maxZ: -4 },
      ]);

      // initial messes
      this._messes = [];
      for (let i = 0; i < 5; i++) this._spawnMess(api);

      this._t = 0; this._spawnT = 0; this._barkT = 0;
      this._named = false; this._wistful = false; this._vacuum = false; this._exiting = false;
      api.narrator.say('boot_line', { category: 'STORY' });
    },

    _spawnMess(api) {
      if (this._messes.length > 8) return;
      const kinds = ['spill', 'cup', 'crumb'];
      const k = kinds[(Math.random() * kinds.length) | 0];
      const m = P.mess(k, k === 'spill' ? 0xb08a6a : k === 'cup' ? 0xd8d2c0 : 0xcaa06a);
      // pick a spot the robot can actually reach (not inside/behind furniture)
      let x = 0, z = 0;
      for (let tries = 0; tries < 20; tries++) {
        x = -7 + Math.random() * 14; z = -3.5 + Math.random() * 8;
        if (!this._navBlocked(api, x, z)) break;
      }
      api.prop(m, x, m.position.y, z);
      const e = api.clean({
        id: 'mess_' + Math.random().toString(36).slice(2, 6), mesh: m,
        pos: m.position, trashAmount: 0.16, cleanTime: CONFIG.CLEAN_TIME,
        onClean: (a, ent) => {
          const i = this._messes.indexOf(ent); if (i >= 0) this._messes.splice(i, 1);
          this._cleaned = (this._cleaned || 0) + 1;
          if (this._cleaned % 4 === 0) a.fakeTaskBeat();
        },
      });
      this._messes.push(e);
    },

    _navBlocked(api, x, z) {
      const r = 0.5;
      for (const o of api.nav.obstacles) if (x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ) return true;
      return false;
    },

    update(dt, api) {
      if (this._exiting) return;
      this._t += dt;

      // guests wander gently (couch-sitters stay put, just sway a little)
      for (const g of this._guests) {
        g.phase += dt;
        if (g.sitting) { g.mesh.rotation.y = Math.sin(g.phase * 0.6) * 0.08; continue; }
        g.mesh.position.x = g.home.x + Math.sin(g.phase * 0.5) * 0.8;
        g.mesh.position.z = g.home.z + Math.cos(g.phase * 0.37) * 0.6;
      }
      // flicker the TV glow
      if (this._tv && this._tv.userData.tvGlow) this._tv.userData.tvGlow.material.emissiveIntensity = 0.5 + Math.sin(this._t * 7) * 0.15 + Math.sin(this._t * 3.3) * 0.1;

      // music-reactive decorations: party lights pulse and balloons bob to a beat
      if (!api.world.reducedMotion) {
        const beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(this._t * 3.4)), 2);
        for (const p of this._partyLights) p.light.intensity = p.base * (0.55 + beat * 0.7);
        for (const b of this._balloons) b.mesh.position.y = b.baseY + Math.sin(this._t * 1.6 + b.phase) * 0.08;
      }

      // unwinnable spawn: 1.4x the clean throughput (§4 S0)
      this._spawnT += dt;
      const interval = CONFIG.PARTY.MESS_SPAWN / CONFIG.PARTY.CLEAN_EDGE;
      if (this._spawnT >= interval) { this._spawnT = 0; this._spawnMess(api); }

      // host barks
      this._barkT += dt;
      if (this._barkT > 8) {
        this._barkT = 0;
        const b = ['host_1', 'host_2', 'host_3'][(Math.random() * 3) | 0];
        api.narrator.say(b, { category: 'VOICE' });
      }

      // OTHER guests comment on the robot cleaning — some kind, some mean
      this._chatterT -= dt;
      if (this._chatterT <= 0) {
        this._chatterT = 9 + Math.random() * 7;
        const lines = ['guest_kind_1', 'guest_kind_2', 'guest_kind_3', 'guest_mean_1', 'guest_mean_2', 'guest_mean_3', 'guest_neutral_1'];
        api.narrator.say(lines[(Math.random() * lines.length) | 0], { category: 'VOICE' });
      }

      // scripted narrator pity
      if (this._t > 25 && !this._pityDone) { this._pityDone = true; api.narrator.say('s0_pity', { category: 'STORY' }); }

      // BEHAVIOR-TRIGGERED beats (plan §S0): the girl names him when Dust comes
      // near her; futility (not a clock) invites the road.
      const cleaned = this._cleaned || 0;
      if (!this._named) {
        const nearGirl = this._girl && api.world.dust.position.distanceTo(this._girl.position) < 2.2;
        if (nearGirl || this._t > CONFIG.PARTY.NAME_AT) {
          this._named = true;
          if (this._girl) this._girl.rotation.y = Math.atan2(api.world.dust.position.x - this._girl.position.x, api.world.dust.position.z - this._girl.position.z);
          api.narrator.say('s0_name', { category: 'STORY' });
        }
      }
      // once the player has felt the futility, the road's light warms up
      if (!this._roadInvite && (cleaned >= 8 || this._pityDone)) { this._roadInvite = true; }
      if (this._roadInvite && !api.world.reducedMotion) {
        this._streetLight.intensity += (2.6 - this._streetLight.intensity) * Math.min(1, dt * 0.4);
        this._roadGlow.material.opacity = Math.min(0.32, this._roadGlow.material.opacity + dt * 0.03) * (0.7 + 0.3 * Math.sin(this._t * 1.2));
      }
      if (!this._wistful && (cleaned >= 12 || this._t > CONFIG.PARTY.WISTFUL_AT)) { this._wistful = true; api.narrator.say('s0_wistful', { category: 'STORY' }); }
      if (!this._vacuum && (cleaned >= 18 || this._t > CONFIG.PARTY.VACUUM_AT)) {
        this._vacuum = true;
        // clear the messes for one beat — the vacuum of purpose
        for (const e of this._messes.slice()) { e.mesh.parent && e.mesh.parent.remove(e.mesh); api.interact.remove(e); }
        this._messes.length = 0;
        api.narrator.say('s0_vacuum', { category: 'REACT' });
      }

      // THE HIDDEN EXIT — walk past the road edge
      if (api.world.dust.position.z < CONFIG.PARTY.EXIT_Z) {
        this._exiting = true;
        api.world.enabled = false;
        api.ui.setTask('—');
        api.audio.setRoomTone('silent');
        // party-to-silence: the house lights fall behind, the road ahead stays lit
        for (const p of this._partyLights) p.light.intensity = 0.2;
        if (this._cakeLight) this._cakeLight.intensity = 0.4;
        if (this._streetLight) this._streetLight.intensity = 3;
        api.narrator.reset();
        api.narrator.say('s0_exit', { category: 'STORY', onDone: () => api.solve() });
      }
    },
  };
}
