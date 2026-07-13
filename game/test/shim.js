// test/shim.js — minimal browser-global shims so scenes + core modules can be
// imported and exercised headlessly in Node (no WebGL). Loaded first by run.js.
class Ctx2D {
  constructor() {}
  clearRect() {} fillRect() {} fillText() {} strokeText() {} beginPath() {} arc() {} fill() {}
  stroke() {} moveTo() {} lineTo() {} save() {} restore() {} translate() {}
  rotate() {} scale() {} measureText() { return { width: 10 }; }
  set fillStyle(_) {} get fillStyle() { return '#000'; }
  set strokeStyle(_) {} get strokeStyle() { return '#000'; }
  set font(_) {} get font() { return '10px sans'; }
  set textAlign(_) {} set textBaseline(_) {} set lineWidth(_) {}
}
function makeCanvas() {
  return { width: 1, height: 1, getContext: () => new Ctx2D(), style: {} };
}
class ElStub {
  constructor(tag) { this.tag = tag; this.style = {}; this.children = []; this.dataset = {}; this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } }; }
  appendChild(c) { this.children.push(c); return c; }
  querySelector() { return new ElStub('div'); }
  querySelectorAll() { return []; }
  addEventListener() {} removeEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
  set innerHTML(_) {} get innerHTML() { return ''; }
  set textContent(_) {} get textContent() { return ''; }
  set onclick(_) {}
}

const doc = {
  createElement: (tag) => (tag === 'canvas' ? makeCanvas() : new ElStub(tag)),
  getElementById: () => new ElStub('div'),
  body: new ElStub('body'),
  addEventListener() {},
};

class AudioStub { constructor() { this.volume = 1; this.currentTime = 0; } play() { return Promise.resolve(); } pause() {} addEventListener(_, cb) { /* mark missing to keep VO 404-tolerant path */ } }

const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k),
};

const win = {
  innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
  addEventListener() {}, removeEventListener() {},
  AudioContext: function () { return { state: 'running', currentTime: 0, sampleRate: 44100, resume() {}, createOscillator() { return { type: '', frequency: { value: 0 }, connect() { return {}; }, start() {}, stop() {} }; }, createGain() { return { gain: { value: 0, exponentialRampToValueAtTime() {}, setValueAtTime() {} }, connect() { return {}; } }; }, createBuffer() { return { getChannelData: () => new Float32Array(10) }; }, createBufferSource() { return { buffer: null, loop: false, connect() { return {}; }, start() {} }; }, createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() { return {}; } }; }, destination: {} }; },
  Audio: AudioStub,
  requestAnimationFrame: (cb) => setTimeout(() => cb(performance.now()), 16),
  location: { search: '' },
};

globalThis.window = win;
globalThis.document = doc;
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true }); } catch { /* navigator read-only, leave it */ }
globalThis.localStorage = localStorageStub;
globalThis.Audio = AudioStub;
globalThis.AudioContext = win.AudioContext;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.location = win.location;
globalThis.performance = globalThis.performance || { now: () => Date.now() };
if (typeof structuredClone === 'undefined') globalThis.structuredClone = (o) => JSON.parse(JSON.stringify(o));
