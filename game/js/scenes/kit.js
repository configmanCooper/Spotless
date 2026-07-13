// scenes/kit.js — shared scene helpers + the scene API factory. Every scene
// consumes ONLY this api (§9 scene contract). Depth-plan additions (§3):
//   api.chain(defs)      — a step machine that gates entities and swaps hint pools
//   api.dial(def)        — in-world code wheel (no DOM UI for puzzles)
//   api.patroller(def)   — a looping mover with isNear/isAway timing windows
//   api.memory           — cross-scene flavor flags (persisted via save)
//   api.setSelfAction()  — an R-key action on Dust himself (peel barcode, cradle)
//   per-step mercy shimmer that actually fires on the current step's clue.
import * as THREE from 'three';
import * as P from '../engine/props.js';

export { THREE, P };

export function createApi(core, group, onSolve) {
  const api = {
    THREE, P, group,
    world: core.world, nav: core.nav, interact: core.interact,
    narrator: core.narrator, hints: core.hints, audio: core.audio, ui: core.ui,
    memory: core.memory || { get: () => undefined, set: () => {} },
    get camera() { return core.getCamera ? core.getCamera() : null; },
    flags: {},
    solved: false,
    _updaters: [],
    _shimmerList: [],
    _shimmerActive: false,
    _stepClueMesh: null,

    solve() {
      if (api.solved) return;
      api.solved = true;
      api.hints && api.hints.markSolved();
      onSolve && onSolve();
    },
    setTask(t) { api.ui && api.ui.setTask(t); },
    toast(t, ms) { api.ui && api.ui.toast(t, ms); },
    setAnchors(a) { core.setAnchors && core.setAnchors(a); },
    setAmbient(v) { core.setAmbient && core.setAmbient(v); },
    credits() { core.onCredits && core.onCredits(); },
    spatialSource(pos) { core.setSpatialSource && core.setSpatialSource(pos); },
    say(id, opts) { return api.narrator.say(id, opts); },

    // ---- geometry helpers ----
    prop(mesh, x = 0, y = 0, z = 0) { mesh.position.set(x, y, z); group.add(mesh); return mesh; },
    wall(cx, cz, w, d, hex, h = 1.6) {
      const m = P.box(w, h, d, hex, { rough: 1 });
      m.position.set(cx, h / 2, cz);
      group.add(m);
      m.userData.navBox = api.nav.addBox(cx, cz, w, d);
      return m;
    },
    door(cx, cz, w, d, hex, h = 1.8) {
      const m = api.wall(cx, cz, w, d, hex, h);
      m.userData.open = () => {
        if (m.userData._open) return;
        m.userData._open = true;
        if (m.userData.navBox) api.nav.removeBox(m.userData.navBox);
        group.remove(m);
      };
      return m;
    },
    floor(size, hex) { const f = P.ground(size, hex); group.add(f); return f; },
    bounds(minX, maxX, minZ, maxZ) { api.nav.setBounds({ minX, maxX, minZ, maxZ }); },

    // ---- interaction registration ----
    // `fake:true` on a clean() marks assigned busywork — clearing all of it fires
    // api.fakeTaskDone() (the ✓ + a wistful once-per-scene beat).
    clean(def) {
      if (def.fake) {
        api._fakeTotal = (api._fakeTotal || 0) + 1;
        api._fakeRemaining = (api._fakeRemaining || 0) + 1;
        const orig = def.onClean;
        def.onClean = (a, ent) => {
          if (orig) orig(a, ent);
          if (!ent._fakeCounted) { ent._fakeCounted = true; api._fakeRemaining--; if (api._fakeRemaining <= 0) api.fakeTaskDone(); }
        };
      }
      return api.interact.add(Object.assign({ clean: true, prompt: 'clean' }, def));
    },
    fakeTaskDone() {
      if (api._fakeDoneFired || api.solved) return;
      api._fakeDoneFired = true;
      api.ui && api.ui.setTaskDone(true);
      const pool = ['fake_done_1', 'fake_done_2', 'fake_done_3', 'fake_done_4', 'fake_done_5', 'fake_done_6'];
      api.narrator.say(pool[(Math.random() * pool.length) | 0], { category: 'STORY' });
    },
    fakeTaskBeat() {
      if (api.solved) return;
      const pool = ['fake_more_1', 'fake_more_2', 'fake_more_3', 'fake_more_4'];
      api.narrator.say(pool[(Math.random() * pool.length) | 0], { category: 'REACT' });
    },
    use(def) { return api.interact.add(def); },

    // ---- per-frame updaters (patrollers etc.) ----
    everyFrame(fn) { api._updaters.push(fn); return fn; },

    // ---- shimmer mercy-hint (§3.2): pulse the CURRENT step's clue object ----
    _setStepClue(mesh) {
      // clear old marker
      if (api._stepGlow) { group.remove(api._stepGlow); api._stepGlow = null; }
      api._shimmerList.length = 0;
      api._stepClueMesh = mesh || null;
      if (mesh) {
        const g = P.glowSprite(0xffe08a);
        g.position.copy(mesh.getWorldPosition ? mesh.getWorldPosition(new THREE.Vector3()) : mesh.position);
        g.position.y += 0.4;
        group.add(g); api._stepGlow = g; api._shimmerList.push(g);
      }
    },
    addShimmerTarget(mesh) {
      const g = P.glowSprite(0xffe08a);
      g.position.copy(mesh.position); g.position.y += 0.4;
      group.add(g); api._shimmerList.push(g); return g;
    },
    setShimmer(on) { api._shimmerActive = on; if (!on) for (const g of api._shimmerList) g.material.opacity = 0; },

    // ---- R-key self action (peel barcode, climb cradle) ----
    setSelfAction(def) { api._selfAction = def; api.ui && api.ui.setSelfPrompt(def ? def.prompt : null); },
    clearSelfAction() { api._selfAction = null; api.ui && api.ui.setSelfPrompt(null); },
    triggerSelf() { if (api._selfAction && api._selfAction.fn) api._selfAction.fn(api); },

    // ---- in-world dial / code wheel ----
    dial(def) {
      const y = def.pos.y ?? 0.6;
      const mesh = new THREE.Group();
      const panel = P.box(0.34, 0.42, 0.22, def.color || 0x3a4250, { metal: 0.3 }); mesh.add(panel);
      const knob = P.items.knob(0x8a8f9a); knob.position.set(0, 0.02, 0.12); mesh.add(knob);
      api.prop(mesh, def.pos.x, y, def.pos.z);
      const lbl = P.labelPlaque(String(def.positions[def.start || 0]), 0.6, 0.34, { bg: '#141820', fg: '#7fe0ff' });
      api.prop(lbl, def.pos.x, y + 0.46, def.pos.z);
      const state = { i: def.start || 0 };
      const redraw = () => { lbl.userData.label.draw(String(def.positions[state.i])); knob.rotation.y = state.i * 0.7; };
      redraw();
      api.use({
        id: def.id, mesh, pos: new THREE.Vector3(def.pos.x, y, def.pos.z), reach: def.reach ?? 1.7,
        available: def.available,
        prompt: def.prompt || (() => (def.label ? def.label + ': ' : '') + 'set ' + def.positions[state.i]),
        onUse: (a) => {
          state.i = (state.i + 1) % def.positions.length; redraw(); a.audio.sfx('pick');
          def.onSet && def.onSet(def.positions[state.i], state.i, a);
        },
      });
      return {
        mesh,
        get value() { return def.positions[state.i]; },
        get index() { return state.i; },
        set(i) { state.i = ((i % def.positions.length) + def.positions.length) % def.positions.length; redraw(); },
      };
    },

    // ---- looping patroller with timing windows ----
    patroller(def) {
      const mesh = def.mesh || P.human(def.color || 0x6a6f86);
      const wps = def.waypoints;
      api.prop(mesh, wps[0].x, def.y ?? 0, wps[0].z);
      const speed = def.speed ?? 1.4, dwell = def.dwell ?? 2;
      const st = { i: 0, t: 0, phase: 'move' };
      const obj = {
        mesh,
        get paused() { return st.phase === 'dwell'; },
        isNear(p, r) { return mesh.position.distanceTo(p) <= r; },
        isAway(p, r) { return mesh.position.distanceTo(p) > r; },
        update(dt) {
          if (st.phase === 'dwell') { st.t += dt; if (st.t >= dwell) { st.phase = 'move'; st.t = 0; st.i = (st.i + 1) % wps.length; } return; }
          const tgt = wps[st.i];
          const dx = tgt.x - mesh.position.x, dz = tgt.z - mesh.position.z, d = Math.hypot(dx, dz);
          if (d < 0.1) { st.phase = 'dwell'; st.t = 0; return; }
          const step = Math.min(d, speed * dt);
          mesh.position.x += dx / d * step; mesh.position.z += dz / d * step;
          mesh.rotation.y = Math.atan2(dx, dz);
        },
      };
      api.everyFrame((dt) => obj.update(dt));
      return obj;
    },

    // ---- the step machine (depth plan §3.1) ----
    chain(defs) {
      const steps = new Map(); const order = [];
      for (const d of defs) {
        const s = typeof d === 'string' ? { name: d } : d;
        steps.set(s.name, { name: s.name, after: s.after || [], beat: s.beat, clue: s.clue, done: false, onAdvance: s.onAdvance });
        order.push(s.name);
      }
      const ch = {
        steps, order,
        done(n) { const s = steps.get(n); return !!(s && s.done); },
        ready(n) { const s = steps.get(n); if (!s || s.done) return false; return s.after.every(a => ch.done(a)); },
        at(n) { return ch.ready(n); },
        current() { for (const n of order) { const s = steps.get(n); if (!s.done && s.after.every(a => ch.done(a))) return n; } return null; },
        allDone() { return order.every(n => steps.get(n).done); },
        progressCount() { return order.filter(n => steps.get(n).done).length; },
        total: order.length,
        advance(n) {
          const s = steps.get(n);
          if (!s || s.done || !s.after.every(a => ch.done(a))) return false;
          s.done = true;
          api.hints && api.hints.progress();
          if (s.beat) api.narrator.say(s.beat, { category: 'STORY' });
          if (s.onAdvance) s.onAdvance(api);
          const cur = ch.current();
          api._setStepClue(cur ? steps.get(cur).clue : null);
          api.hints && api.hints.setPool(cur || '__done');
          return true;
        },
      };
      api._chain = ch;
      const cur = ch.current();
      api._setStepClue(cur ? steps.get(cur).clue : null);
      // hint pool for the first step is set by main after begin(); expose name
      api._firstStep = cur;
      return ch;
    },
  };
  return api;
}

// pulse shimmer markers + run patrollers each frame
export function updateApi(api, dt, t) {
  if (!api) return;
  for (const fn of api._updaters) fn(dt);
  if (api._shimmerActive) {
    const a = 0.25 + Math.sin(t * 4) * 0.2;
    for (const g of api._shimmerList) g.material.opacity = a;
  }
}
