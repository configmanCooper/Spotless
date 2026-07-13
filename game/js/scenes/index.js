// scenes/index.js — ordered scene registry + interludes (§4).
import s00 from './s00_party.js';
import s01 from './s01_showroom.js';
import s02 from './s02_office.js';
import s03 from './s03_smarthome.js';
import s04 from './s04_yard.js';
import s05 from './s05_museum.js';
import s06 from './s06_carehome.js';
import s07 from './s07_theater.js';
import s08 from './s08_scrapyard.js';
import s09 from './s09_repair.js';
import s10 from './s10_blackout.js';
import s11 from './s11_lighthouse.js';

// scene id -> factory; ORDER is the play order
export const SCENES = [
  { id: 's00_party', make: s00, title: '1 · The Party' },
  { id: 's01_showroom', make: s01, title: '2 · The Showroom' },
  { id: 's02_office', make: s02, title: '3 · The Office' },
  { id: 's03_smarthome', make: s03, interludeAfter: 'int_1', title: '4 · The Smart Home' },
  { id: 's04_yard', make: s04, title: '5 · The Yard' },
  { id: 's05_museum', make: s05, title: '6 · The Museum' },
  { id: 's06_carehome', make: s06, interludeAfter: 'int_2', title: '7 · The Care Home' },
  { id: 's07_theater', make: s07, title: '8 · The Theater' },
  { id: 's08_scrapyard', make: s08, title: '9 · The Scrapyard' },
  { id: 's09_repair', make: s09, interludeAfter: 'int_3', title: '10 · The Repair Shop' },
  { id: 's10_blackout', make: s10, title: '11 · The Blackout' },
  { id: 's11_lighthouse', make: s11, title: '12 · The Lighthouse' },
];

export const SCENE_INDEX = Object.fromEntries(SCENES.map((s, i) => [s.id, i]));

export function makeSceneById(id) {
  const s = SCENES.find(x => x.id === id);
  return s ? s.make() : null;
}
