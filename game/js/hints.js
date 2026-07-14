// hints.js — per-step hint pools (depth plan §3.2). A scene provides either the
// legacy 3-id array or a map { stepName: [t1,t2,t3] }. The active chain step swaps
// the pool (resetting the stuck-clock); tiers fire at 4/8/12 min × the scene's
// HINT_SCALE; on tier-3 timeout the CURRENT step's clue object shimmers (this
// finally makes the mercy shimmer real). Settings: normal / patient / off.
import { CONFIG } from './config.js';

export class Hints {
  constructor({ narrator, settings }) {
    this.narrator = narrator; this.settings = settings;
    this.reset();
  }
  reset() {
    this.clock = 0;
    this.total = 0;           // whole-scene wall time (telemetry; survives setPool)
    this.sinceProgress = 999;
    this.tier = 0;
    this.pools = {};          // name -> [id,id,id]
    this.active = null;       // active pool name
    this.hints = [];          // current pool's ids
    this.scale = 1;
    this.shimmerCb = null;
    this.shimmerOn = false;
    this.solved = false;
    this.consumed = 0;
    this.byStep = {};
  }
  // hintsSpec: [id,id,id]  OR  { stepName: [id,id,id], ... }
  begin(hintsSpec, shimmerCb, scale = 1) {
    this.reset();
    this.scale = scale || 1;
    this.shimmerCb = shimmerCb || null;
    if (Array.isArray(hintsSpec)) { this.pools = { __single: hintsSpec }; this.setPool('__single'); }
    else { this.pools = hintsSpec || {}; const first = Object.keys(this.pools)[0]; if (first) this.setPool(first); }
  }
  // swap to a step's pool: reset stuck-clock + tier + shimmer for the new step
  setPool(name) {
    this.active = name;
    this.hints = this.pools[name] || [];
    this.clock = 0; this.tier = 0;
    if (this.shimmerOn) { this.shimmerOn = false; this.shimmerCb && this.shimmerCb(false, name); }
    this.progress();
  }
  progress() { this.sinceProgress = 0; }
  markSolved() { this.solved = true; if (this.shimmerCb) this.shimmerCb(false, this.active); }

  update(dt) {
    if (this.solved) return;
    this.total += dt;                     // telemetry: total time in scene
    if (this.settings.hints === 'off') return;
    this.sinceProgress += dt;
    const storyPlaying = this.narrator.currentPriority() >= 100;
    if (storyPlaying || this.sinceProgress < 60) return;
    this.clock += dt;

    const H = CONFIG.HINTS, s = this.scale;
    if (this.tier < 1 && this.clock >= H.T1 * s) this._fire(0);
    else if (this.tier < 2 && this.clock >= H.T2 * s) this._fire(1);
    else if (this.tier < 3 && this.clock >= H.T3 * s && this.settings.hints === 'normal') this._fire(2);
    else if (!this.shimmerOn && this.clock >= H.SHIMMER * s && this.settings.hints === 'normal') {
      this.shimmerOn = true;
      this.shimmerCb && this.shimmerCb(true, this.active);
    }
  }
  _fire(i) {
    this.tier = i + 1;
    const id = this.hints[i];
    if (id && this.narrator.say(id, { category: 'HINT' })) {
      this.consumed++;
      const step = this.active || '__single';
      this.byStep[step] = (this.byStep[step] || 0) + 1;
    }
  }
  stats() { return { solveTime: this.total, stepTime: this.clock, hints: this.consumed, hintSteps: Object.assign({}, this.byStep) }; }
}
