// audio.js — 404-tolerant VO + a tiny WebAudio SFX/room-tone bed. VO files land
// in audio/vo/<id>.mp3 in batches; missing files fall back to subtitle-only
// silently (§5). The S11 reveal spatializes the narrator via a PannerNode.
export class Audio {
  constructor() {
    this.ctx = null;
    this.master = 0.9;
    this.voCache = new Map();     // id -> HTMLAudioElement | null (null = known-missing)
    this.playing = new Map();
    this.roomTone = null;
    this.spatialNode = null;      // {panner, gain} for reveal
    this.enabled = true;
  }
  ensure() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
  }
  resume() { this.ensure(); this.ctx && this.ctx.state === 'suspended' && this.ctx.resume(); }
  setMaster(v) { this.master = v; }

  // --- spatialized narrator (S11 reveal): route VO through a PannerNode so the
  // voice appears to come from the old robot at the lamp, not from everywhere. ---
  setSpatialSource(pos, camera) {
    this.ensure(); if (!this.ctx) return;
    if (!this.spatialNode) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.6; panner.rolloffFactor = 0.6; panner.maxDistance = 40;
      const gain = this.ctx.createGain(); gain.gain.value = this.master;
      panner.connect(gain).connect(this.ctx.destination);
      this.spatialNode = { panner, gain };
    }
    if (pos) {
      const p = this.spatialNode.panner;
      const set = (param, v) => { if (param.setValueAtTime) param.setValueAtTime(v, this.ctx.currentTime); };
      if (p.positionX) { set(p.positionX, pos.x); set(p.positionY, pos.y); set(p.positionZ, pos.z); }
      else if (p.setPosition) p.setPosition(pos.x, pos.y, pos.z);
    }
    if (camera) this.updateListener(camera);
  }
  updateListener(camera) {
    if (!this.ctx || !this.ctx.listener || !camera) return;
    const l = this.ctx.listener;
    const p = camera.getWorldPosition(new (this._V || (this._V = camera.position.constructor))());
    const set = (param, v) => { if (param && param.setValueAtTime) param.setValueAtTime(v, this.ctx.currentTime); };
    if (l.positionX) { set(l.positionX, p.x); set(l.positionY, p.y); set(l.positionZ, p.z); }
    else if (l.setPosition) l.setPosition(p.x, p.y, p.z);
  }
  clearSpatial() { this.spatialNode = null; }

  // --- VO ---
  playVO(id, opts = {}) {
    if (!this.enabled) return null;
    if (this.voCache.get(id) === null) return null;       // known missing
    let el = this.voCache.get(id);
    if (!el) {
      el = new window.Audio(`audio/vo/${id}.mp3`);
      el.addEventListener('error', () => this.voCache.set(id, null), { once: true });
      this.voCache.set(id, el);
    }
    try {
      el.currentTime = 0; el.volume = this.master;
      if (opts.spatial && this.spatialNode) {
        // Route this element through the spatial panner (once per element).
        this.ensure();
        if (this.ctx && !el._srcNode) {
          try { el._srcNode = this.ctx.createMediaElementSource(el); el._srcNode.connect(this.spatialNode.panner); el.volume = 1; } catch {}
        }
      }
      const p = el.play();
      p && p.catch(() => {});
      this.playing.set(id, el);
    } catch {}
    return el;
  }
  stopVO(id) { const el = this.playing.get(id); if (el) { try { el.pause(); } catch {} this.playing.delete(id); } }

  // --- SFX (synthesized, no assets needed) ---
  sfx(name) {
    if (!this.enabled) return;
    this.ensure(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    const table = {
      clean: [520, 0.06, 'triangle'], pick: [660, 0.05, 'sine'], place: [440, 0.06, 'sine'],
      dump: [180, 0.12, 'sawtooth'], lamp_on: [880, 0.09, 'sine'], lamp_off: [330, 0.07, 'sine'],
      unlock: [700, 0.14, 'square'], solve: [523, 0.18, 'triangle'], thunk: [90, 0.1, 'square'],
      error: [140, 0.16, 'sawtooth'],
    };
    const [f, d, type] = table[name] || [440, 0.06, 'sine'];
    o.type = type; o.frequency.value = f;
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.18 * this.master, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + d + 0.02);
  }

  // --- room tone: a soft filtered noise bed per scene ---
  setRoomTone(kind) {
    this.ensure(); if (!this.ctx) return;
    if (this.roomTone) { try { this.roomTone.src.stop(); } catch {} this.roomTone = null; }
    if (kind === 'silent' || !this.enabled) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass';
    filt.frequency.value = kind === 'party' ? 700 : 300;
    const g = this.ctx.createGain(); g.gain.value = (kind === 'party' ? 0.05 : 0.02) * this.master;
    src.connect(filt).connect(g).connect(this.ctx.destination);
    src.start();
    this.roomTone = { src, g };
  }
}
