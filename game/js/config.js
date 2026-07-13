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

// per-scene accent palettes (§8)
export const PALETTES = {
  party:      { accent: 0xe98db0, warm: 0xf6c78a, ground: 0x2b2530, fog: 0x141019 },
  showroom:   { accent: 0x7fd7ff, warm: 0xdfe9f2, ground: 0x1b2028, fog: 0x0e1218 },
  office:     { accent: 0xbcd08a, warm: 0xd8cf9e, ground: 0x232019, fog: 0x14120c },
  smarthome:  { accent: 0xffe08a, warm: 0xf3ead2, ground: 0x2a2620, fog: 0x171410 },
  yard:       { accent: 0xf0a35a, warm: 0xd8b06a, ground: 0x28301f, fog: 0x11160c },
  museum:     { accent: 0x8ab0ff, warm: 0xc7d3f0, ground: 0x1a1d2b, fog: 0x0c0e17 },
  carehome:   { accent: 0xe8b7a0, warm: 0xe6d3c0, ground: 0x2b241f, fog: 0x161009 },
  theater:    { accent: 0xd9435b, warm: 0xf0c98a, ground: 0x171015, fog: 0x0a060a },
  scrapyard:  { accent: 0xffa64b, warm: 0xd9843e, ground: 0x241d16, fog: 0x120d08 },
  repair:     { accent: 0x9ad1c0, warm: 0xc7d6cf, ground: 0x1c2320, fog: 0x0d1210 },
  blackout:   { accent: 0x5b6bff, warm: 0x9aa6ff, ground: 0x0c0d14, fog: 0x05060a },
  lighthouse: { accent: 0xffd777, warm: 0xb9d4ea, ground: 0x14161f, fog: 0x080a10 },
};
