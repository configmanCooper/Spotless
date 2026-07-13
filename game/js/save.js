// save.js — localStorage, versioned with a migration table (§7).
const KEY = 'spotless.save.v1';

const DEFAULT = {
  v: 1,
  scene: 's00_party',
  flags: {},
  linesHeard: [],
  memoryLog: [],         // rolling STORY/VOICE transcript (plan §1 memory panel)
  checkpoint: null,      // { scene, milestone, payload } — bounded mid-scene checkpoint (plan §2)
  solveTimes: {},        // sceneId -> {solveTime, hints}
  scenesDone: [],
  settings: { hints: 'normal', subs: true, master: 0.9, assist: false, reducedMotion: false,
    subSize: 'normal', subSpeed: 'normal', subOpacity: 'normal', subContrast: false },
};

const MIGRATIONS = {
  // 0: (s) => { ...; s.v = 1; return s; }
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    let s = JSON.parse(raw);
    while (s.v < DEFAULT.v && MIGRATIONS[s.v]) s = MIGRATIONS[s.v](s);
    return Object.assign(structuredClone(DEFAULT), s,
      { settings: Object.assign({}, DEFAULT.settings, s.settings) });
  } catch { return structuredClone(DEFAULT); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function wipe() { try { localStorage.removeItem(KEY); } catch {} }
