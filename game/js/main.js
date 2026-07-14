// main.js — boot, state machine, and the fixed-timestep game loop (§9). Wires
// every module and drives scene transitions + the narrator/hint systems.
import * as THREE from 'three';
import { CONFIG, PALETTES } from './config.js';
import { Renderer } from './engine/renderer.js';
import { CameraRig } from './engine/cameraRig.js';
import { Nav } from './nav.js';
import { InteractRegistry } from './interact.js';
import { Narrator } from './narrator.js';
import { Hints } from './hints.js';
import { Audio } from './audio.js';
import { Debug } from './debug.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { World } from './world.js';
import { createApi, updateApi } from './scenes/kit.js';
import { SCENES, SCENE_INDEX, makeSceneById } from './scenes/index.js';
import { disposeGroup } from './engine/props.js';

class Game {
  async boot() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.rig = new CameraRig(this.renderer.camera);
    this.nav = new Nav();
    this.interact = new InteractRegistry();
    this.audio = new Audio();
    this.debug = new Debug();
    this.ui = new UI(document.getElementById('ui-root'), this);
    this.debug.attach(this.ui.debugEl);

    // load save + narrator script
    this.save = (await import('./save.js'));
    this.state = this.save.load();
    this.settings = this.state.settings;
    this.audio.setMaster(this.settings.master ?? 0.9);

    let script = {};
    try { script = await (await fetch('js/narrator_script.json')).json(); } catch {}
    this.narrator = new Narrator({ ui: this.ui, audio: this.audio, script });
    this.narrator.setHeard(this.state.linesHeard);
    this.narrator.log = Array.isArray(this.state.memoryLog) ? this.state.memoryLog.slice(-60) : [];
    this.narrator.onLog = () => { this.state.memoryLog = this.narrator.log; };
    this.hints = new Hints({ narrator: this.narrator, settings: this.settings });
    this.ui.applySubtitleSettings(this.settings);

    this.world = new World({
      scene: this.renderer.scene, nav: this.nav, interact: this.interact,
      ui: this.ui, narrator: this.narrator, audio: this.audio,
    });

    this.input = new Input(this.canvas, () => this.renderer.camera);
    this.input.onLamp = () => this._lamp();
    this.input.onPause = () => this._togglePause();
    this.input.onDrop = () => { if (this.mode === 'play' && this.world.dropCarried()) { this.ui.toast('Dropped.', 1200); if (this.api && this.api._telemetry) this.api._telemetry.drops++; } };
    this.input.onSelf = () => { if (this.mode === 'play' && this.api) this.api.triggerSelf(); };

    this.group = null;         // current scene group
    this.scene = null;         // current scene object
    this.api = null;
    this.mode = 'title';       // title | play | paused | interlude | credits
    this.idleT = 0; this._lastInput = 0;

    this._loop = this._loop.bind(this);
    this.acc = 0; this.lastT = performance.now();
    requestAnimationFrame(this._loop);

    this._showTitle();
    window.__SPOTLESS = this; // debug handle
  }

  _showTitle() {
    this.mode = 'title';
    const hasSave = this.state.scene && this.state.scene !== 's00_party' || this.state.scenesDone.length > 0;
    this.ui.showTitle(
      () => this._startNew(),
      () => this._continue(),
      hasSave,
      () => this.ui.showSettings(this.settings, (k, v) => this._setSetting(k, v), () => { this.ui.hidePause(); this._showTitle(); }),
      this.state.scenesDone.length >= SCENES.length ? () => this._sceneSelect() : null,
    );
  }

  _setSetting(k, v) {
    this.settings[k] = v; this.save.save(this.state);
    if (k.startsWith('sub')) this.ui.applySubtitleSettings(this.settings);
    if (k === 'subs' && !v) this.ui.hideSub();
    if (k === 'master') this.audio.setMaster(v);
    if (k === 'reducedMotion') { this.world.reducedMotion = !!v; document.documentElement.classList.toggle('reduced-motion', !!v); }
  }

  _disposeGroup(group) { try { disposeGroup(group); } catch {} }
  _teardownScene() {
    this.world && this.world.clearCarry({ dispose: true });
    if (this.group) {
      this.renderer.scene.remove(this.group);
      this._disposeGroup(this.group);
    }
    this.group = null;
    this.scene = null;
    this.api = null;
    this.interact.clear();
    this.nav.clear();
  }
  _resetNarratorMode() {
    this.narrator.mode = 'narrator';
    this.audio.clearSpatial();
  }

  // ---- Examine / Observe overlay (plan §2) ----
  _examine(content) {
    if (this.mode !== 'play') return;
    this.mode = 'examine';
    this.input.enabled = false;
    this.audio.sfx('pick');
    this.ui.showExamine(content, () => {
      if (this.mode !== 'examine') return;
      this.mode = 'play'; this.input.enabled = true;
    });
  }

  // ---- bounded checkpoints (plan §2) ----
  _saveCheckpoint(name, payload) {
    this.state.checkpoint = { scene: this.scene.id, milestone: name, payload: payload || null };
    this.save.save(this.state);
  }
  _clearCheckpoint() { if (this.state.checkpoint) { delete this.state.checkpoint; this.save.save(this.state); } }

  _startNew() {
    this.state.scene = 's00_party'; this.state.scenesDone = []; this.state.flags = {};
    this.state.linesHeard = []; this.narrator.setHeard([]);   // fresh narration on New Game
    this.state.memoryLog = []; this.narrator.log = [];
    this.state.solveTimes = {};
    this.state.checkpoint = null;
    this._resetNarratorMode();
    this.save.save(this.state); this._begin(this.state.scene);
  }
  _continue() { this._begin(this.state.scene || 's00_party'); }
  _sceneSelect() {
    // Honest chapter select: jump straight to any scene the player has reached.
    // Unlocked = every scene up to and including the furthest one completed.
    const done = this.state.scenesDone || [];
    let furthest = -1;
    for (let i = 0; i < SCENES.length; i++) if (done.includes(SCENES[i].id)) furthest = i;
    const unlocked = Math.min(furthest + 1, SCENES.length - 1);
    const entries = SCENES.slice(0, unlocked + 1).map((s, i) => ({ id: s.id, label: s.title || s.id, index: i }));
    this.ui.showSceneSelect(entries, (id) => { this.ui.hidePause(); this._begin(id); }, () => this._showTitle());
  }

  _begin(id) {
    this.ui.hideTitle(); this.ui.hidePause();
    this.input.enabled = true;
    this.audio.resume();
    this.ui.setHudVisible(true);
    this.loadScene(id);
  }

  loadScene(id) {
    // tear down previous — remove AND dispose GPU resources (plan §3: disposal)
    this._teardownScene();
    this.narrator.reset();
    this._resetNarratorMode();
    this.renderer.setAmbient(1);
    this.input.enabled = true;
    this.world.enabled = true; this.world.lampOn = false; this.world.setLampKnown(false);
    this.world.rig.lampLight.intensity = 0; this.world.setScreen('CLEANING…');
    this.world.resetLamp();
    this.world.canEmptyTrash = false;
    this.ui.setLampGlyph('dim'); this.ui.setBatteryArc(1); this.ui.setSelfPrompt(null);
    this.world.trash = 0; this.ui.setTrash(0);

    this.group = new THREE.Group();
    this.renderer.scene.add(this.group);
    this.scene = makeSceneById(id);
    this.state.scene = id; this.save.save(this.state);
    this.narrator.setScene(id);

    const core = {
      world: this.world, nav: this.nav, interact: this.interact,
      narrator: this.narrator, hints: this.hints, audio: this.audio, ui: this.ui,
      settings: this.settings,
      getCamera: () => this.renderer.camera,
      setAnchors: (a) => this.rig.setAnchors(a),
      setAmbient: (v) => this.renderer.setAmbient(v),
      onCredits: () => this._runCredits(),
      setSpatialSource: (p) => this.audio.setSpatialSource(p, this.renderer.camera),
      setExposureScale: (s) => this.renderer.setExposureScale(s),
      cameraBeat: (o) => this.rig.beat(o),
      examine: (content) => this._examine(content),
      checkpoint: (name, payload) => this._saveCheckpoint(name, payload),
      memory: {
        get: (k) => this.state.flags && this.state.flags[k],
        set: (k, v) => { if (!this.state.flags || Array.isArray(this.state.flags)) this.state.flags = {}; this.state.flags[k] = v; this.save.save(this.state); },
      },
    };
    this.api = createApi(core, this.group, () => this._onSceneSolved());

    const pal = PALETTES[this.scene.palette] || PALETTES.party;
    this.renderer.setPalette(pal);
    // feed the scene accent/warm into CSS vars for per-scene UI identity (plan §3 UI)
    const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--scene-accent', hex(pal.accent));
    rootStyle.setProperty('--scene-warm', hex(pal.warm));
    this.world.reducedMotion = !!this.settings.reducedMotion;
    document.documentElement.classList.toggle('reduced-motion', !!this.settings.reducedMotion);
    this.audio.setRoomTone(this.scene.roomTone || 'room');

    this.scene.build(this.api);
    this.ui.setTask(this.scene.statedTask);
    const scale = CONFIG.HINT_SCALE[id] || 1;
    this.hints.begin(this.scene.hints || [], (on) => { this.api.setShimmer(on); }, scale);
    if (this.api._firstStep) this.hints.setPool(this.api._firstStep);
    // restore a mid-scene checkpoint if one exists for this scene (plan §2)
    const cp = this.state.checkpoint;
    if (cp && cp.scene === id && typeof this.scene.restoreCheckpoint === 'function') {
      try { this.scene.restoreCheckpoint(this.api, cp); this.api._telemetry.reloads++; } catch (e) { console.warn('checkpoint restore failed', e); }
    }
    this.rig.snapNext = true;
    this._solveHandled = false; this._solveClock = 0;
    this.mode = 'play';
    this.ui.fade(false);
  }

  _telemetryRecord() {
    const t = (this.api && this.api._telemetry) || {};
    return Object.assign({}, this.hints.stats(), { wrong: t.wrong | 0, drops: t.drops | 0, examines: t.examines | 0, reloads: t.reloads | 0 });
  }

  _onSceneSolved() {
    if (this._solveHandled) return;
    this._solveHandled = true;
    this._clearCheckpoint();
    // playtest telemetry (local only)
    const rec = this._telemetryRecord();
    this.debug.record(this.scene.id, rec);
    // persist progress
    if (!this.state.scenesDone.includes(this.scene.id)) this.state.scenesDone.push(this.scene.id);
    this.state.solveTimes[this.scene.id] = rec;
    this.save.save(this.state);
    this.state.linesHeard = this.narrator.getHeard(); this.save.save(this.state);
    // Advance only after the player has had time to read the solve dialog:
    // wait for the narrator to finish the STORY solve line, then hold a readable
    // buffer. A hard cap guarantees we never stall.
    this._waitThenAdvance();
  }

  _waitThenAdvance() {
    const READ_BUFFER = 4200;   // ms to leave the final subtitle up after speech ends
    const START_GRACE = 1200;   // ms to let the solve line begin before we poll
    const HARD_CAP = 22000;     // ms absolute maximum before forcing the advance
    const t0 = performance.now();
    const poll = () => {
      const elapsed = performance.now() - t0;
      if (this.narrator.isSpeaking() && elapsed < HARD_CAP) { setTimeout(poll, 400); return; }
      setTimeout(() => this._advance(), READ_BUFFER);
    };
    setTimeout(poll, START_GRACE);
  }

  _advance() {
    const idx = SCENE_INDEX[this.scene.id];
    const entry = SCENES[idx];
    const next = SCENES[idx + 1];
    if (!next) { return; } // finale handles credits itself
    this.mode = 'interlude';
    this.input.reset();
    this.input.enabled = false;
    this.world.enabled = false;
    this.ui.fade(true);
    let finished = false;
    let safety = null;
    const go = () => {
      if (finished) return;
      finished = true;
      if (safety) clearTimeout(safety);
      setTimeout(() => this.loadScene(next.id), 900);
    };
    if (entry.interludeAfter) {
      // short black interlude with a "friend of mine" monologue (§4)
      setTimeout(() => {
        this.narrator.reset();
        this.narrator.say(entry.interludeAfter, { category: 'STORY', onDone: go });
        // safety: advance even if line missing
        safety = setTimeout(go, 9000);
      }, 900);
    } else go();
  }

  _runCredits() {
    this.mode = 'credits';
    // sweep the beam a moment, then roll credits
    setTimeout(() => {
      const lines = [
        { h: 'SPOTLESS' }, { t: '' },
        { t: 'a house robot named Dust', dim: true }, { t: '' }, { t: '' },
        { t: 'Design & Narration', dim: true }, { t: 'from the owner\'s brief' }, { t: '' },
        { t: 'DUST', dim: true }, { t: 'named for the thing he was made to remove' }, { t: '' },
        { t: 'ASH', dim: true }, { t: 'who keeps the light on' }, { t: '' }, { t: '' },
        { t: 'Ashes, dust. The stuff that\'s left over.', dim: true }, { t: '' }, { t: '' },
        { t: 'Thank you for walking the road.', dim: true },
      ];
      this.ui.hideSub();
      this.ui.showCredits(lines, () => this._postCredits());
    }, 3200);
  }

  _postCredits() {
    // 10s post-credits: the party house, morning; the girl's chalk drawing
    this.mode = 'title';
    this.ui.toast('Morning. On the driveway: a child\'s chalk drawing of a boxy robot, walking off the edge.', 6000);
    this.state.scene = 's00_party'; this.save.save(this.state);
    setTimeout(() => this._showTitle(), 6500);
  }

  _lamp() {
    if (this.mode !== 'play') return;
    if (this.world.toggleLamp()) this.ui.setLampGlyph(this.world.lampOn ? 'on' : 'known');
  }

  _togglePause() {
    if (this.mode === 'examine') { this.ui.hideExamine(); this.mode = 'play'; this.input.enabled = true; return; }
    if (this.mode === 'play') { this.mode = 'paused'; this.input.reset(); this.input.enabled = false; this._openPause(); }
    else if (this.mode === 'paused') { this.mode = 'play'; this.input.enabled = true; this.ui.hidePause(); }
  }
  _resumeFromPause() { this.mode = 'play'; this.input.enabled = true; }
  _openPause() {
    this.ui.showPause(
      () => this._resumeFromPause(),
      () => this.ui.showSettings(this.settings, (k, v) => this._setSetting(k, v), () => this._openPause()),
      () => this._quitToTitle(),
      () => this.ui.showMemory(this.narrator.getLog(), () => this._openPause()),
    );
  }
  _quitToTitle() {
    this.ui.hidePause();
    this.input.reset();
    this.input.enabled = true;
    this.world.enabled = false;
    this.narrator.reset();
    this._resetNarratorMode();
    this._teardownScene();
    this.save.save(this.state);
    this.mode = 'title'; this._showTitle();
  }

  // ---- generic reactive barks (§5) ----
  _reactions(dt) {
    const inputActive = this.input.axisX || this.input.axisZ || this.input.clickTarget || this.input.interactHeld;
    if (inputActive) { this.idleT = 0; }
    else { this.idleT += dt; if (this.idleT > CONFIG.NARR.IDLE_AT) { this.idleT = 0; this.narrator.say(Math.random() < 0.5 ? 'bark_idle' : 'bark_idle2', { category: 'IDLE' }); } }
  }

  _loop(now) {
    requestAnimationFrame(this._loop);
    let dt = (now - this.lastT) / 1000; this.lastT = now;
    if (dt > 0.1) dt = 0.1;
    this.acc += dt;
    const step = CONFIG.TICK_DT;
    let steps = 0;
    while (this.acc >= step && steps < 5) { this._tick(step); this.acc -= step; steps++; }
    // lamp glyph subtle animation handled by CSS
    this.renderer.tickExposure(dt);
    this.renderer.render();
    if (this.debug.on) this._budgetHUD();
  }

  _budgetHUD() {
    const info = this.renderer.renderer.info;
    this.debug.setBudget(info.render.calls, info.render.triangles, info.memory.geometries, info.memory.textures);
  }

  _tick(dt) {
    this.ui.tick(dt);
    this.narrator.update(dt);
    this.input.updateGamepad();
    this.ui.setTouchActions({
      play: this.mode === 'play',
      carry: !!this.world.carry,
      self: !!(this.api && this.api._selfAction),
      lamp: !!this.world.lampKnown,
    });
    if (this.mode === 'play') {
      this.input.updatePointerHold();
      this.world.update(dt, this.input, this.api);
      if (this.scene.update) this.scene.update(dt, this.api);
      if (this.scene.lateUpdate) this.scene.lateUpdate(dt, this.api);
      this.hints.update(dt);
      this._reactions(dt);
      updateApi(this.api, dt, performance.now() / 1000);
      if (this.narrator.mode === 'spatial') this.audio.updateListener(this.renderer.camera);
      if (this.world.lampDrains) this.ui.setBatteryArc(this.world.lampBattery);
      this.rig.update(dt, this.world.dust.position);
    } else if (this.mode === 'interlude' || this.mode === 'credits' || this.mode === 'title' || this.mode === 'examine') {
      this.rig.update(dt, this.world.dust.position);
    }
  }
}

const game = new Game();
game.boot();
