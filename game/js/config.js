// config.js — all tuning in one place (§7, §9 house convention).
export const CONFIG = {
  version: 1,

  // fixed-timestep sim
  TICK_HZ: 60,
  get TICK_DT() { return 1 / this.TICK_HZ; },

  // Dust movement — deliberately 15% slower than "ideal" (§7).
  DUST_SPEED: 3.4,          // world units / sec
  DUST_RADIUS: 0.42,
  ARRIVE_EPS: 0.12,

  // camera fixed overhead rig (lower, more readable angle)
  CAM_TILT_DEG: 46,
  CAM_DIST: 15,
  CAM_LERP: 3.2,            // per-second approach toward target framing
  CAM_FOV: 42,

  // cleaning
  CLEAN_TIME: 1.15,         // seconds hold to clear one mess
  CLEAN_REACH: 1.5,
  INTERACT_REACH: 1.7,

  // party (S0) — unwinnable by design (§4 S0)
  PARTY: {
    MESS_SPAWN: 2.2,       // seconds between guest messes at steady state
    CLEAN_EDGE: 1.4,       // guests mess 1.4x faster than perfect cleaning
    NAME_AT: 12 * 60,      // girl names Dust
    WISTFUL_AT: 18 * 60,
    VACUUM_AT: 25 * 60,
    EXIT_Z: -13.5,         // walk past the road edge to trigger the road
  },

  // hint ladder (§6) — seconds on the solve clock (base ×1 band)
  HINTS: { T1: 4 * 60, T2: 8 * 60, T3: 12 * 60, SHIMMER: 18 * 60 },
  // per-scene timer stretch (depth plan §3.2): deeper scenes give more time per step
  HINT_SCALE: {
    s00_party: 1, s01_showroom: 1, s02_office: 1, s03_smarthome: 1, s04_yard: 1,
    s05_museum: 1.5, s06_carehome: 1.5, s07_theater: 1.5,
    s08_scrapyard: 2, s09_repair: 2, s10_blackout: 2, s11_lighthouse: 2.5,
  },

  // lamp battery drain (S10/S11): seconds of light per full charge; ember floor
  LAMP: { DRAIN: 90, EMBER: 0.1, RECHARGE: 6 },


  // narrator queue
  NARR: {
    CHARS_PER_SEC: 18,     // subtitle dwell estimate when no audio
    MIN_DWELL: 1.9,
    IDLE_AT: 90,           // idle bark pool trigger
    REACT_COOLDOWN: 6,
  },

  // battery (cosmetic) + lamp
  LAMP_KEY: 'l',

  DPR_CAP: 2,
};

// per-scene accent palettes (§8). `rig` re-authors the light for each room's mood
// (plan §3 per-scene light rigs): sky/ground hemi, key colour+angle, fill, fog
// distance and filmic exposure.
export const PALETTES = {
  party:      { accent: 0xe98db0, warm: 0xf6c78a, ground: 0x2b2530, fog: 0x141019,
                rig: { hemi: 0.85, key: 1.05, fill: 0.35, sky: 0xfff3e6, keyColor: 0xffd9a8, fillColor: 0xb48fd0, keyPos: [5, 12, 9], fog: [24, 50], exposure: 1.22 } },
  showroom:   { accent: 0x7fd7ff, warm: 0xdfe9f2, ground: 0x1b2028, fog: 0x0e1218,
                rig: { hemi: 0.55, key: 1.35, fill: 0.25, sky: 0xeaf4ff, keyColor: 0xffffff, fillColor: 0x5f7290, keyPos: [4, 15, 6], fog: [16, 40], exposure: 1.18 } },
  office:     { accent: 0xbcd08a, warm: 0xd8cf9e, ground: 0x232019, fog: 0x14120c,
                rig: { hemi: 1.0, key: 0.7, fill: 0.4, sky: 0xf1f6df, keyColor: 0xf4f7e8, fillColor: 0x9aa886, keyPos: [0, 16, 2], fog: [22, 46], exposure: 1.1 } },
  smarthome:  { accent: 0xffe08a, warm: 0xf3ead2, ground: 0x2a2620, fog: 0x171410,
                rig: { hemi: 0.6, key: 0.7, fill: 0.28, sky: 0xffe9c4, keyColor: 0xffd89a, fillColor: 0x6f6796, keyPos: [7, 12, 5], fog: [18, 44], exposure: 1.12 } },
  yard:       { accent: 0xf0a35a, warm: 0xd8b06a, ground: 0x28301f, fog: 0x11160c,
                rig: { hemi: 0.7, key: 0.6, fill: 0.4, sky: 0xb9c6cc, keyColor: 0xc9cbb8, fillColor: 0x7d8aa0, keyPos: [-6, 12, 7], fog: [16, 42], exposure: 1.08 } },
  museum:     { accent: 0x8ab0ff, warm: 0xc7d3f0, ground: 0x1a1d2b, fog: 0x0c0e17,
                rig: { hemi: 0.32, key: 0.45, fill: 0.18, sky: 0xbcccf0, keyColor: 0xcdd8f5, fillColor: 0x4a5478, keyPos: [0, 16, 4], fog: [14, 40], exposure: 1.05 } },
  carehome:   { accent: 0xe8b7a0, warm: 0xe6d3c0, ground: 0x2b241f, fog: 0x161009,
                rig: { hemi: 0.8, key: 0.8, fill: 0.35, sky: 0xffe6d2, keyColor: 0xffd7b8, fillColor: 0x9a8b7f, keyPos: [5, 12, 6], fog: [20, 46], exposure: 1.14 } },
  theater:    { accent: 0xd9435b, warm: 0xf0c98a, ground: 0x171015, fog: 0x0a060a,
                rig: { hemi: 0.28, key: 0.4, fill: 0.16, sky: 0xf0c0c8, keyColor: 0xf0b8c0, fillColor: 0x5a3a52, keyPos: [0, 15, 5], fog: [14, 40], exposure: 1.02 } },
  scrapyard:  { accent: 0xffa64b, warm: 0xd9843e, ground: 0x241d16, fog: 0x120d08,
                rig: { hemi: 0.5, key: 0.85, fill: 0.22, sky: 0xffcf9a, keyColor: 0xffb063, fillColor: 0x7a5a3a, keyPos: [-5, 13, 6], fog: [16, 42], exposure: 1.1 } },
  repair:     { accent: 0x9ad1c0, warm: 0xc7d6cf, ground: 0x1c2320, fog: 0x0d1210,
                rig: { hemi: 0.72, key: 0.78, fill: 0.3, sky: 0xdcefe8, keyColor: 0xe4f2ec, fillColor: 0x6a8880, keyPos: [4, 14, 5], fog: [18, 44], exposure: 1.1 } },
  blackout:   { accent: 0x5b6bff, warm: 0x9aa6ff, ground: 0x0c0d14, fog: 0x05060a,
                rig: { hemi: 0.18, key: 0.2, fill: 0.1, sky: 0x8a97e0, keyColor: 0x9aa6ff, fillColor: 0x3a4270, keyPos: [0, 12, 4], fog: [12, 34], exposure: 1.0 } },
  lighthouse: { accent: 0xffd777, warm: 0xb9d4ea, ground: 0x14161f, fog: 0x080a10,
                rig: { hemi: 0.4, key: 0.5, fill: 0.2, sky: 0xcfd9ea, keyColor: 0xffe3a8, fillColor: 0x4a5a78, keyPos: [3, 14, 5], fog: [16, 46], exposure: 1.08 } },
};
