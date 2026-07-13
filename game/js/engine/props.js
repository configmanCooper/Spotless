// engine/props.js — shared low-poly prop kit (§8). Flat-shaded warm boxes,
// capsule humans, the robot chassis (Dust/Ash), and a canvas-text helper used
// for the cyan chest screen and world labels.
import * as THREE from 'three';

const _mats = new Map();
export function mat(hex, opts = {}) {
  const key = hex + '|' + (opts.rough ?? 1) + '|' + (opts.emissive ?? 0) + '|' + (opts.flat ? 1 : 0);
  if (_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshStandardMaterial({
    color: hex, roughness: opts.rough ?? 0.92, metalness: opts.metal ?? 0.0,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    flatShading: opts.flat ?? true,
  });
  _mats.set(key, m);
  return m;
}

const _edgeMat = new THREE.LineBasicMaterial({ color: 0x111119, transparent: true, opacity: 0.28 });
// Crisp low-poly linework: a thin dark outline that makes silhouettes read clearly.
export function addEdges(mesh, opts = {}) {
  if (!mesh.geometry) return mesh;
  try {
    const eg = new THREE.EdgesGeometry(mesh.geometry, opts.thresh ?? 24);
    const line = new THREE.LineSegments(eg, opts.mat || _edgeMat);
    line.userData.isEdge = true; line.raycast = () => {};
    mesh.add(line);
  } catch {}
  return mesh;
}

export function box(w, h, d, hex, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex, opts));
  m.userData.isProp = true;
  if (opts.edges !== false) addEdges(m);
  return m;
}

// small helpers for composing stylized items
function pm(geo, hex, opts = {}) { const m = new THREE.Mesh(geo, mat(hex, opts)); if (opts.edges !== false) addEdges(m); return m; }
function grp(...children) { const g = new THREE.Group(); for (const c of children) if (c) g.add(c); return g; }
const T = THREE;

export function ground(size, hex) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(hex, { rough: 1 }));
  g.rotation.x = -Math.PI / 2;
  g.position.y = 0;
  return g;
}

export function wall(len, height, hex, opts = {}) {
  return box(len, height, 0.3, hex, opts);
}

// A simple stylized person: rounded torso, head, little arms and a base so the
// silhouette reads clearly as a human (§8: big silhouettes, no faces).
export function human(hex = 0x6a6f86, hatHex = null) {
  const g = new THREE.Group();
  const body = pm(new THREE.CapsuleGeometry(0.32, 0.68, 4, 10), hex, { rough: 0.85 });
  body.position.y = 0.74; g.add(body);
  const head = pm(new THREE.SphereGeometry(0.22, 12, 10), hex, { rough: 0.75, edges: false });
  head.position.y = 1.42; g.add(head);
  for (const sx of [-1, 1]) { const arm = pm(new THREE.CapsuleGeometry(0.08, 0.4, 3, 6), hex, { rough: 0.85, edges: false }); arm.position.set(sx * 0.36, 0.82, 0); arm.rotation.z = sx * 0.18; g.add(arm); }
  const base = pm(new THREE.CylinderGeometry(0.28, 0.34, 0.12, 12), hex, { rough: 0.9, edges: false }); base.position.y = 0.06; g.add(base);
  if (hatHex != null) {
    const hat = pm(new THREE.ConeGeometry(0.26, 0.32, 12), hatHex); hat.position.y = 1.7; g.add(hat);
    const brim = pm(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 12), hatHex, { edges: false }); brim.position.y = 1.55; g.add(brim);
  }
  g.userData.human = true;
  return g;
}

// Canvas text texture (labels, chest screen). Returns { texture, draw(text) }.
export function makeTextTexture(w = 256, h = 128, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  function draw(text, o = {}) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = o.bg ?? opts.bg ?? '#08272b';
    ctx.fillRect(0, 0, w, h);
    const lines = String(text).split('\n');
    ctx.fillStyle = o.fg ?? opts.fg ?? '#38e0e6';
    // bold, sized to fill the plate and shrink to fit the longest line
    let size = Math.floor(h / (lines.length + 0.5) * 0.82);
    const font = (n) => (o.font ?? opts.font ?? `bold ${n}px "Segoe UI", Arial, sans-serif`);
    ctx.font = font(size);
    let longest = 0; for (const ln of lines) longest = Math.max(longest, ctx.measureText(ln).width);
    const maxW = w * 0.92;
    if (longest > maxW) { size = Math.max(10, Math.floor(size * maxW / longest)); ctx.font = font(size); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.09); ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    const lh = h / (lines.length + 0.4);
    lines.forEach((ln, i) => { const y = lh * (i + 0.7); ctx.strokeText(ln, w / 2, y); ctx.fillText(ln, w / 2, y); });
    tex.needsUpdate = true;
  }
  draw(opts.text ?? '');
  return { texture: tex, draw, canvas: cv };
}

// The robot chassis. Matte cream body + cyan chest screen (the ONE cyan, §8).
// Returns { group, screen:{draw}, setScreenColor() } — Ash reuses it in S11.
export function robot(opts = {}) {
  const g = new THREE.Group();
  const bodyHex = opts.body ?? 0xece3d2;
  const patched = opts.patched ?? false;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), mat(bodyHex, { rough: 0.7 }));
  torso.position.y = 0.85;
  g.add(torso);

  if (patched) {
    // mismatched panels (§1: chassis patched with mismatched panels)
    const p1 = box(0.36, 0.34, 0.02, 0x9a8f7c); p1.position.set(-0.14, 0.98, 0.26); g.add(p1);
    const p2 = box(0.3, 0.28, 0.02, 0x7c8a86); p2.position.set(0.16, 0.72, 0.26); g.add(p2);
  }

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.4), mat(bodyHex, { rough: 0.6 }));
  head.position.y = 1.42;
  g.add(head);
  // eye visor
  const visor = box(0.34, 0.1, 0.02, 0x22262e, { emissive: 0x2b3038 });
  visor.position.set(0, 1.44, 0.2);
  g.add(visor);

  // chest screen
  const screen = makeTextTexture(256, 160, { bg: '#062a2e', fg: '#38e0e6', text: 'CLEANING…' });
  const scrMat = new THREE.MeshStandardMaterial({ map: screen.texture, emissive: 0x0a2e33, emissiveIntensity: 0.9, roughness: 0.5 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), scrMat);
  scr.position.set(0, 0.95, 0.262);
  g.add(scr);

  // wheels/base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.28, 12), mat(0xd7cdb8, { rough: 0.8 }));
  base.position.y = 0.16;
  g.add(base);

  // arms (simple, so we can gesture in S5/museum)
  const armL = box(0.12, 0.5, 0.12, bodyHex); armL.position.set(-0.44, 0.86, 0); g.add(armL);
  const armR = box(0.12, 0.5, 0.12, bodyHex); armR.position.set(0.44, 0.86, 0); g.add(armR);

  // carried-item anchor (in front of hands)
  const carryAnchor = new THREE.Object3D();
  carryAnchor.position.set(0, 0.9, 0.55);
  g.add(carryAnchor);

  // headlamp cone (hidden until lamp on)
  const lampLight = new THREE.SpotLight(0xffe08a, 0, 14, Math.PI / 5, 0.5, 1);
  lampLight.position.set(0, 1.4, 0.2);
  const lampTarget = new THREE.Object3D();
  lampTarget.position.set(0, 0.2, 4);
  g.add(lampLight); g.add(lampTarget);
  lampLight.target = lampTarget;

  g.userData.robot = { screen, scrMat, armL, armR, carryAnchor, lampLight, head };
  return { group: g, screen, arms: { l: armL, r: armR }, carryAnchor, lampLight, head };
}

// A world-space label plaque (used for exhibit plaques, bay signs, charts).
// Rendered large and bold; tilted slightly up so it faces the lowered camera.
export function labelPlaque(text, w = 1.1, h = 0.5, o = {}) {
  const scale = o.scale ?? 1.35;              // bigger in-world by default
  const t = makeTextTexture(512, 256, {
    bg: o.bg ?? '#efe7d4', fg: o.fg ?? '#211d18',
    font: o.font, text,                        // font auto-sizes/bolds in makeTextTexture
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * scale, h * scale),
    new THREE.MeshStandardMaterial({ map: t.texture, roughness: 0.85, emissive: 0x1a160f, emissiveMap: t.texture, emissiveIntensity: 0.25 }));
  if (o.tilt !== false) m.rotation.x = -0.32;  // lean toward the camera for readability
  m.userData.label = t;
  return m;
}

// A generic "mess" blob (spill/cup/crumb/leaf) — small, on the floor.
export function mess(kind = 'spill', hex = 0xb08a6a) {
  if (kind === 'spill') {
    // an irregular flat puddle (a couple of overlapping flattened blobs)
    const g = new THREE.Group();
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.035, 14), mat(hex, { rough: 0.35, metal: 0.1 }));
    const lobe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 10), mat(hex, { rough: 0.35, metal: 0.1 }));
    lobe.position.set(0.28, -0.002, 0.1); const lobe2 = lobe.clone(); lobe2.position.set(-0.22, -0.002, -0.16); lobe2.scale.setScalar(0.8);
    g.add(main); g.add(lobe); g.add(lobe2); g.position.y = 0.02; g.userData.messKind = 'spill'; return g;
  }
  if (kind === 'cup') {
    const g = new THREE.Group();
    const body = pm(new THREE.CylinderGeometry(0.1, 0.075, 0.2, 12), hex, { rough: 0.5 });
    const rim = pm(new THREE.TorusGeometry(0.1, 0.015, 6, 14), 0xffffff, { rough: 0.4 }); rim.rotation.x = Math.PI / 2; rim.position.y = 0.1;
    g.add(body); g.add(rim); g.position.y = 0.14; g.userData.messKind = 'cup'; return g;
  }
  if (kind === 'leaf') {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.16); shape.quadraticCurveTo(0.14, 0, 0, 0.18); shape.quadraticCurveTo(-0.14, 0, 0, -0.16);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: false });
    const m = pm(geo, hex, { rough: 0.8 }); m.rotation.x = -Math.PI / 2 + 0.3; m.rotation.z = Math.random() * Math.PI; m.position.y = 0.06; m.userData.messKind = 'leaf'; return m;
  }
  // crumb: a little cluster of specks
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) { const s = pm(new THREE.DodecahedronGeometry(0.05 + Math.random() * 0.04), hex, { rough: 1, edges: false }); s.position.set((Math.random() - 0.5) * 0.24, Math.random() * 0.05, (Math.random() - 0.5) * 0.24); g.add(s); }
  g.position.y = 0.06; g.userData.messKind = 'crumb'; return g;
}

// ============================================================================
// STYLIZED ITEM LIBRARY — recognizable low-poly props built from primitives.
// Each is sized so it reads clearly at the game's camera distance.
// ============================================================================
export const items = {
  paper(hex = 0xf4e8c0, lines = 0x8a8470) {
    const g = grp(pm(new T.BoxGeometry(0.34, 0.02, 0.26), hex, { rough: 0.9 }));
    for (let i = 0; i < 3; i++) { const l = new T.Mesh(new T.BoxGeometry(0.22, 0.001, 0.012), mat(lines)); l.position.set(0, 0.012, -0.06 + i * 0.06); g.add(l); }
    return g;
  },
  envelope(hex = 0xefe7d0) {
    const g = grp(pm(new T.BoxGeometry(0.36, 0.02, 0.24), hex, { rough: 0.9 }));
    const flap = new T.Mesh(new T.ConeGeometry(0.13, 0.02, 4), mat(0xe0d6b8)); flap.rotation.y = Math.PI / 4; flap.scale.set(1.4, 1, 0.9); flap.position.y = 0.012; g.add(flap);
    return g;
  },
  stamp(hex = 0xc94a4a) {
    const g = grp(pm(new T.BoxGeometry(0.16, 0.02, 0.13), 0xffffff, { rough: 0.8 }));
    const ink = new T.Mesh(new T.BoxGeometry(0.11, 0.005, 0.09), mat(hex, { emissive: hex, emissiveIntensity: 0.2 })); ink.position.y = 0.013; g.add(ink);
    return g;
  },
  key(hex = 0xd9b94a) {
    const bow = pm(new T.TorusGeometry(0.06, 0.02, 6, 12), hex, { metal: 0.5, rough: 0.4 });
    const shaft = pm(new T.CylinderGeometry(0.018, 0.018, 0.22, 8), hex, { metal: 0.5, rough: 0.4 }); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.14;
    const tooth = pm(new T.BoxGeometry(0.04, 0.02, 0.06), hex, { metal: 0.5 }); tooth.position.set(0.23, -0.03, 0);
    return grp(bow, shaft, tooth);
  },
  fuse(hex = 0xffd777) {
    const glass = pm(new T.CylinderGeometry(0.055, 0.055, 0.16, 12), hex, { emissive: hex, emissiveIntensity: 0.25, rough: 0.3 }); glass.rotation.z = Math.PI / 2;
    const c1 = pm(new T.CylinderGeometry(0.06, 0.06, 0.04, 12), 0x9a9a9a, { metal: 0.6 }); c1.rotation.z = Math.PI / 2; c1.position.x = 0.09;
    const c2 = c1.clone(); c2.position.x = -0.09;
    return grp(glass, c1, c2);
  },
  battery(hex = 0x3fae4a) {
    const body = pm(new T.BoxGeometry(0.16, 0.3, 0.16), hex, { rough: 0.6 });
    const t1 = pm(new T.CylinderGeometry(0.03, 0.03, 0.04, 8), 0xb0b0b0, { metal: 0.6 }); t1.position.set(-0.04, 0.16, 0);
    const t2 = pm(new T.BoxGeometry(0.05, 0.04, 0.05), 0xb0b0b0, { metal: 0.6 }); t2.position.set(0.04, 0.16, 0);
    const g = grp(body, t1, t2); g.userData.tall = true; return g;
  },
  bread(hex = 0xe4c98a) {
    // a slice: square base with an arched top
    const base = pm(new T.BoxGeometry(0.3, 0.18, 0.06), hex, { rough: 0.9 });
    const crown = pm(new T.CylinderGeometry(0.15, 0.15, 0.06, 12, 1, false, 0, Math.PI), hex, { rough: 0.9 }); crown.rotation.x = Math.PI / 2; crown.position.y = 0.09;
    const crust = pm(new T.BoxGeometry(0.31, 0.05, 0.065), 0xb98a4a, { rough: 0.9 }); crust.position.y = -0.075;
    return grp(base, crown, crust);
  },
  toaster(hex = 0x9aa2ac) {
    const body = pm(new T.BoxGeometry(0.5, 0.36, 0.36), hex, { metal: 0.5, rough: 0.35 });
    const slot = new T.Mesh(new T.BoxGeometry(0.34, 0.04, 0.1), mat(0x1a1a1e)); slot.position.y = 0.19; body.add(slot);
    const lever = pm(new T.BoxGeometry(0.05, 0.12, 0.05), 0x33363c); lever.position.set(0.28, 0.05, 0);
    const dial = pm(new T.CylinderGeometry(0.05, 0.05, 0.03, 10), 0x22242a); dial.rotation.x = Math.PI / 2; dial.position.set(-0.2, -0.05, 0.19);
    return grp(body, lever, dial);
  },
  screwdriver(handleHex = 0xc94a4a, shaftHex = 0xb8b8be) {
    const handle = pm(new T.CylinderGeometry(0.05, 0.06, 0.2, 10), handleHex, { rough: 0.5 });
    const shaft = pm(new T.CylinderGeometry(0.018, 0.018, 0.26, 8), shaftHex, { metal: 0.6 }); shaft.position.y = -0.22;
    const tip = pm(new T.BoxGeometry(0.02, 0.05, 0.04), shaftHex, { metal: 0.6 }); tip.position.y = -0.36;
    const g = grp(handle, shaft, tip); g.rotation.z = Math.PI / 2; return g;
  },
  crank(hex = 0xc9a94a) {
    const bar = pm(new T.CylinderGeometry(0.03, 0.03, 0.34, 6), hex, { metal: 0.6 }); bar.rotation.z = Math.PI / 2;
    const arm = pm(new T.CylinderGeometry(0.03, 0.03, 0.16, 6), hex, { metal: 0.6 }); arm.position.set(0.17, -0.08, 0);
    const hexHead = pm(new T.CylinderGeometry(0.05, 0.05, 0.05, 6), 0x8a8a8a, { metal: 0.7 }); hexHead.rotation.z = Math.PI / 2; hexHead.position.x = -0.17;
    return grp(bar, arm, hexHead);
  },
  chip(hex = 0x2a7a3a) {
    const board = pm(new T.BoxGeometry(0.16, 0.03, 0.12), hex, { rough: 0.5 });
    const gold = pm(new T.BoxGeometry(0.06, 0.032, 0.1), 0xe8c94a, { metal: 0.7 }); gold.position.x = 0.04;
    return grp(board, gold);
  },
  glasses(hex = 0x222228) {
    const l1 = pm(new T.TorusGeometry(0.06, 0.012, 6, 14), hex, { rough: 0.4 }); l1.rotation.x = Math.PI / 2; l1.position.x = -0.07;
    const l2 = l1.clone(); l2.position.x = 0.07;
    const bridge = pm(new T.BoxGeometry(0.05, 0.012, 0.012), hex); bridge.position.y = 0.0;
    return grp(l1, l2, bridge);
  },
  photo(frameHex = 0x8a6a4a, imgHex = 0xbfd0d8) {
    const frame = pm(new T.BoxGeometry(0.44, 0.02, 0.36), frameHex, { rough: 0.7 });
    const img = new T.Mesh(new T.PlaneGeometry(0.34, 0.26), mat(imgHex, { rough: 0.5, emissive: imgHex, emissiveIntensity: 0.08 })); img.rotation.x = -Math.PI / 2; img.position.y = 0.012;
    return grp(frame, img);
  },
  lever(baseHex = 0x33323a, handleHex = 0x8a8a4a) {
    const base = pm(new T.BoxGeometry(0.24, 0.16, 0.24), baseHex, { metal: 0.4 });
    const arm = pm(new T.CylinderGeometry(0.03, 0.03, 0.5, 8), handleHex, { metal: 0.5 }); arm.position.y = 0.32; arm.rotation.z = -0.4;
    const knob = pm(new T.SphereGeometry(0.06, 10, 8), 0xc94a4a); knob.position.set(0.19, 0.55, 0);
    return grp(base, arm, knob);
  },
  button(hex = 0xd94040) {
    const base = pm(new T.CylinderGeometry(0.16, 0.18, 0.1, 16), 0x33363c, { rough: 0.6 });
    const dome = pm(new T.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hex, { emissive: hex, emissiveIntensity: 0.2 }); dome.position.y = 0.05;
    return grp(base, dome);
  },
  bell(hex = 0xc9a94a) {
    const dome = pm(new T.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hex, { metal: 0.6, rough: 0.3 });
    const rim = pm(new T.CylinderGeometry(0.16, 0.16, 0.03, 14), hex, { metal: 0.6 });
    const top = pm(new T.SphereGeometry(0.04, 8, 6), hex, { metal: 0.6 }); top.position.y = 0.17;
    return grp(dome, rim, top);
  },
  bin(hex = 0x4a5a3f, open = true) {
    const g = grp(pm(new T.CylinderGeometry(0.34, 0.28, 0.8, 14, 1, true), hex, { rough: 0.7 }));
    const bottom = pm(new T.CylinderGeometry(0.28, 0.28, 0.03, 14), hex); bottom.position.y = -0.38; g.add(bottom);
    if (!open) { const lid = pm(new T.CylinderGeometry(0.36, 0.36, 0.05, 14), hex); lid.position.y = 0.42; g.add(lid); }
    return g;
  },
  barrel(hex = 0x8a6a3a) {
    const body = pm(new T.CylinderGeometry(0.28, 0.28, 0.7, 16), hex, { rough: 0.6, metal: 0.2 });
    const r1 = pm(new T.TorusGeometry(0.29, 0.02, 6, 18), 0x5a4a2a); r1.rotation.x = Math.PI / 2; r1.position.y = 0.2;
    const r2 = r1.clone(); r2.position.y = -0.2;
    return grp(body, r1, r2);
  },
  gear(hex = 0x8a8a5a, teeth = 10) {
    const g = grp(pm(new T.CylinderGeometry(0.22, 0.22, 0.12, 18), hex, { metal: 0.5, rough: 0.4 }));
    const hole = pm(new T.CylinderGeometry(0.07, 0.07, 0.14, 12), 0x2a2a2a); g.add(hole);
    for (let i = 0; i < teeth; i++) { const t = new T.Mesh(new T.BoxGeometry(0.08, 0.13, 0.08), mat(hex, { metal: 0.5 })); const a = (i / teeth) * Math.PI * 2; t.position.set(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26); t.rotation.y = -a; g.add(t); }
    g.rotation.x = Math.PI / 2; return g;
  },
  prism(hex = 0xbfe0ff, cracked = false) {
    const m = pm(new T.OctahedronGeometry(0.16), cracked ? 0x8a9aaa : hex, { rough: cracked ? 0.7 : 0.15, metal: 0.1, emissive: cracked ? 0x000000 : hex, emissiveIntensity: cracked ? 0 : 0.12 });
    m.scale.y = 1.4; return m;
  },
  cushion(hex = 0xcaa88a) {
    const m = pm(new T.BoxGeometry(0.5, 0.22, 0.5), hex, { rough: 0.95 }); m.scale.set(1, 1, 1);
    // puffed corners
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = pm(new T.SphereGeometry(0.08, 8, 6), hex, { rough: 0.95, edges: false }); c.position.set(sx * 0.22, 0, sz * 0.22); m.add(c); }
    return m;
  },
  lightbulb(hex = 0xf0e0a0) {
    const glass = pm(new T.SphereGeometry(0.12, 12, 10), hex, { emissive: hex, emissiveIntensity: 0.35, rough: 0.2 });
    const base = pm(new T.CylinderGeometry(0.06, 0.07, 0.1, 10), 0x9a9a9a, { metal: 0.6 }); base.position.y = -0.14;
    return grp(glass, base);
  },
  plug(hex = 0xffd777) {
    const body = pm(new T.BoxGeometry(0.16, 0.14, 0.1), hex, { rough: 0.5 });
    const p1 = pm(new T.BoxGeometry(0.02, 0.02, 0.1), 0xb0b0b0, { metal: 0.7 }); p1.position.set(-0.04, 0, 0.1);
    const p2 = p1.clone(); p2.position.x = 0.04;
    return grp(body, p1, p2);
  },
  mailbox(hex = 0x6a5a4a, flag = 0xd94040) {
    const post = pm(new T.CylinderGeometry(0.05, 0.05, 0.7, 8), 0x4a3a2a); post.position.y = -0.35;
    const bodyG = new T.Group();
    const shell = pm(new T.CylinderGeometry(0.18, 0.18, 0.45, 12, 1, true, -Math.PI / 2, Math.PI), hex, { metal: 0.3 }); shell.rotation.z = Math.PI / 2;
    const back = pm(new T.BoxGeometry(0.02, 0.36, 0.45), hex); back.position.set(-0.22, 0, 0);
    const flagM = pm(new T.BoxGeometry(0.02, 0.14, 0.1), flag); flagM.position.set(0.18, 0.12, 0.18); flagM.userData.flag = true;
    bodyG.add(shell); bodyG.add(back); bodyG.add(flagM);
    return grp(post, bodyG);
  },
  toolHook() { return pm(new T.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), 0xd9b94a, { metal: 0.5 }); },
  knob(hex = 0x4a5560) {
    const g = grp(pm(new T.CylinderGeometry(0.12, 0.14, 0.1, 14), hex, { metal: 0.3 }));
    const mark = pm(new T.BoxGeometry(0.02, 0.06, 0.11), 0xffffff); mark.position.y = 0.03; g.add(mark);
    g.rotation.x = Math.PI / 2; return g;
  },
  tag(hex = 0xd94040) {
    const body = pm(new T.BoxGeometry(0.2, 0.3, 0.02), hex, { rough: 0.7 });
    const hole = pm(new T.TorusGeometry(0.025, 0.008, 6, 10), 0xffffff); hole.position.y = 0.12; hole.rotation.x = Math.PI / 2;
    return grp(body, hole);
  },
  crystalPendant(hex = 0xbfe0ff) { const m = pm(new T.OctahedronGeometry(0.11), hex, { rough: 0.15, emissive: hex, emissiveIntensity: 0.15 }); m.scale.y = 1.5; return m; },
  boathook(hex = 0x8a8a8a) {
    const pole = pm(new T.CylinderGeometry(0.03, 0.03, 0.8, 8), 0x6a5a3a); pole.rotation.z = Math.PI / 2;
    const hook = pm(new T.TorusGeometry(0.08, 0.02, 6, 10, Math.PI * 1.3), hex, { metal: 0.6 }); hook.position.x = 0.4; hook.rotation.z = -0.6;
    return grp(pole, hook);
  },
  ribbon(hex = 0xc98ad0) {
    const spool = pm(new T.CylinderGeometry(0.05, 0.05, 0.16, 12), 0x8a8a8a, { metal: 0.4 }); spool.rotation.z = Math.PI / 2;
    const tape = pm(new T.CylinderGeometry(0.11, 0.11, 0.1, 14), hex, { rough: 0.5, emissive: hex, emissiveIntensity: 0.1 }); tape.rotation.z = Math.PI / 2;
    return grp(tape, spool);
  },
  tape(hex = 0xdfe4d8) {
    const roll = pm(new T.TorusGeometry(0.1, 0.05, 8, 16), hex, { rough: 0.4 }); roll.rotation.x = Math.PI / 2;
    return roll;
  },
  tin(hex = 0x6a9a7a) {
    const body = pm(new T.CylinderGeometry(0.14, 0.14, 0.14, 14), hex, { metal: 0.4, rough: 0.4 });
    const lid = pm(new T.CylinderGeometry(0.145, 0.145, 0.03, 14), hex, { metal: 0.4 }); lid.position.y = 0.08;
    return grp(body, lid);
  },
  metronome(hex = 0x8a5a3a) {
    const body = pm(new T.CylinderGeometry(0.06, 0.18, 0.4, 4), hex, { rough: 0.6 }); body.rotation.y = Math.PI / 4;
    const arm = pm(new T.BoxGeometry(0.02, 0.34, 0.02), 0xd9b94a); arm.position.y = 0.2; arm.rotation.z = 0.25;
    return grp(body, arm);
  },
  clock(hex = 0x6a5a44) {
    const body = pm(new T.BoxGeometry(0.5, 0.6, 0.16), hex, { rough: 0.6 });
    const face = new T.Mesh(new T.CircleGeometry(0.18, 20), mat(0xf0ece0)); face.position.z = 0.085; body.add(face);
    const h = new T.Mesh(new T.BoxGeometry(0.015, 0.12, 0.005), mat(0x222)); h.position.set(0, 0.05, 0.09); body.add(h);
    return body;
  },
  coat(hex = 0x3a4a5a) {
    const body = pm(new T.CylinderGeometry(0.16, 0.24, 0.9, 10), hex, { rough: 0.85 });
    const shoulders = pm(new T.BoxGeometry(0.5, 0.14, 0.2), hex, { rough: 0.85 }); shoulders.position.y = 0.42;
    return grp(body, shoulders);
  },
  trashBag(hex = 0x2a2a2e) {
    const body = pm(new T.SphereGeometry(0.34, 12, 10), hex, { rough: 0.6 }); body.scale.set(1, 1.2, 1); body.position.y = 0.34;
    const tie = pm(new T.ConeGeometry(0.12, 0.16, 8), hex, { rough: 0.6 }); tie.position.y = 0.72;
    return grp(body, tie);
  },
  plinth(hex = 0x3a3d4c) {
    const g = grp(pm(new T.BoxGeometry(0.8, 0.9, 0.8), hex, { rough: 0.8 }));
    const top = pm(new T.BoxGeometry(0.9, 0.08, 0.9), hex, { rough: 0.7 }); top.position.y = 0.48; g.add(top);
    return g;
  },
  cutoffBox(hex = 0x3a4256, accent = 0xffd777) {
    const body = pm(new T.BoxGeometry(0.5, 0.7, 0.35), hex, { metal: 0.3 });
    const socket = pm(new T.CylinderGeometry(0.06, 0.06, 0.06, 6), 0x1a1a1a); socket.rotation.x = Math.PI / 2; socket.position.z = 0.18;
    const light = pm(new T.SphereGeometry(0.04, 8, 6), accent, { emissive: accent, emissiveIntensity: 0.5 }); light.position.set(0.15, 0.25, 0.18);
    return grp(body, socket, light);
  },
  breakerPanel(hex = 0x4a5560) {
    const body = pm(new T.BoxGeometry(0.7, 1.0, 0.22), hex, { metal: 0.3 });
    for (let i = 0; i < 3; i++) { const sw = pm(new T.BoxGeometry(0.12, 0.14, 0.06), 0x22242a); sw.position.set(-0.18 + i * 0.18, 0.1, 0.12); body.add(sw); }
    return body;
  },
  vacuum(hex = 0x6a7a72) {
    const body = pm(new T.CylinderGeometry(0.26, 0.3, 0.5, 14), hex, { metal: 0.3, rough: 0.4 });
    const lid = pm(new T.CylinderGeometry(0.22, 0.26, 0.14, 14), 0x3a4a44, { metal: 0.4 }); lid.position.y = 0.3;
    const hoseA = pm(new T.TorusGeometry(0.12, 0.03, 6, 12, Math.PI), 0x33363c); hoseA.position.set(0.24, 0.2, 0); hoseA.rotation.z = -0.5;
    const wheel = pm(new T.CylinderGeometry(0.06, 0.06, 0.05, 10), 0x22242a); wheel.rotation.x = Math.PI / 2; wheel.position.set(0.18, -0.22, 0);
    const wheel2 = wheel.clone(); wheel2.position.x = -0.18;
    return grp(body, lid, hoseA, wheel, wheel2);
  },
  core(hex = 0x6a6a6a, warm = false) {
    const m = pm(new T.IcosahedronGeometry(0.28, 0), hex, warm ? { emissive: 0x5a2a08, rough: 0.4 } : { rough: 0.6, metal: 0.2 });
    return m;
  },
  cake(tierHex = 0xf3e0d0, icingHex = 0xe98db0) {
    const g = new T.Group();
    const plate = pm(new T.CylinderGeometry(0.55, 0.55, 0.05, 20), 0xdfe4ea, { rough: 0.3 }); g.add(plate);
    const t1 = pm(new T.CylinderGeometry(0.42, 0.44, 0.28, 20), tierHex, { rough: 0.85 }); t1.position.y = 0.16; g.add(t1);
    const t2 = pm(new T.CylinderGeometry(0.3, 0.32, 0.24, 20), tierHex, { rough: 0.85 }); t2.position.y = 0.4; g.add(t2);
    // icing drips (a ring of little beads) + top border
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const d = pm(new T.SphereGeometry(0.04, 6, 5), icingHex, { rough: 0.6, edges: false }); d.position.set(Math.cos(a) * 0.42, 0.29, Math.sin(a) * 0.42); g.add(d); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const d = pm(new T.SphereGeometry(0.035, 6, 5), icingHex, { rough: 0.6, edges: false }); d.position.set(Math.cos(a) * 0.3, 0.52, Math.sin(a) * 0.3); g.add(d); }
    // candles with flames
    const candleCols = [0xff6b6b, 0x6bafff, 0xffe06b, 0x8bff8b, 0xd08bff];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const cx = Math.cos(a) * 0.14, cz = Math.sin(a) * 0.14;
      const wax = pm(new T.CylinderGeometry(0.02, 0.02, 0.16, 6), candleCols[i], { edges: false }); wax.position.set(cx, 0.6, cz); g.add(wax);
      const flame = pm(new T.ConeGeometry(0.03, 0.08, 6), 0xffcf5f, { emissive: 0xffb020, emissiveIntensity: 0.9, edges: false }); flame.position.set(cx, 0.72, cz); g.add(flame); }
    return g;
  },
  couch(hex = 0x5a6a8a) {
    const g = new T.Group();
    const seat = pm(new T.BoxGeometry(2.0, 0.35, 0.9), hex, { rough: 0.95 }); seat.position.y = 0.35; g.add(seat);
    const back = pm(new T.BoxGeometry(2.0, 0.6, 0.25), hex, { rough: 0.95 }); back.position.set(0, 0.6, -0.34); g.add(back);
    for (const sx of [-1, 1]) { const arm = pm(new T.BoxGeometry(0.25, 0.5, 0.9), hex, { rough: 0.95 }); arm.position.set(sx * 0.88, 0.45, 0); g.add(arm); }
    for (const sx of [-0.5, 0.5]) { const cush = pm(new T.BoxGeometry(0.85, 0.16, 0.7), lighten(hex, 0.12), { rough: 0.95, edges: false }); cush.position.set(sx, 0.56, 0.03); g.add(cush); }
    return g;
  },
  tv(hex = 0x14141a) {
    const g = new T.Group();
    const screen = pm(new T.BoxGeometry(1.4, 0.85, 0.12), hex, { rough: 0.3 }); screen.position.y = 0.9; g.add(screen);
    const glow = new T.Mesh(new T.PlaneGeometry(1.28, 0.72), new T.MeshStandardMaterial({ color: 0x8fb8e0, emissive: 0x6fa0d8, emissiveIntensity: 0.7, roughness: 0.4 })); glow.position.set(0, 0.9, 0.07); g.add(glow); g.userData.tvGlow = glow;
    const stand = pm(new T.BoxGeometry(1.6, 0.3, 0.4), 0x3a2f28, { rough: 0.7 }); stand.position.y = 0.15; g.add(stand);
    return g;
  },
  balloon(hex = 0xe98db0) {
    const g = new T.Group();
    const b = pm(new T.SphereGeometry(0.22, 12, 10), hex, { rough: 0.4, edges: false }); b.scale.y = 1.2; b.position.y = 1.6; g.add(b);
    const knot = pm(new T.ConeGeometry(0.05, 0.08, 6), hex, { edges: false }); knot.position.y = 1.36; knot.rotation.x = Math.PI; g.add(knot);
    const str = pm(new T.CylinderGeometry(0.004, 0.004, 1.3, 4), 0xcccccc, { edges: false }); str.position.y = 0.7; g.add(str);
    return g;
  },
  presentBox(boxHex = 0x8bafff, ribbonHex = 0xffe06b) {
    const g = new T.Group();
    const b = pm(new T.BoxGeometry(0.4, 0.35, 0.4), boxHex, { rough: 0.8 }); b.position.y = 0.175; g.add(b);
    const r1 = pm(new T.BoxGeometry(0.06, 0.37, 0.42), ribbonHex, { rough: 0.6, edges: false }); r1.position.y = 0.175; g.add(r1);
    const r2 = pm(new T.BoxGeometry(0.42, 0.37, 0.06), ribbonHex, { rough: 0.6, edges: false }); r2.position.y = 0.175; g.add(r2);
    const bow = pm(new T.SphereGeometry(0.07, 8, 6), ribbonHex, { rough: 0.6, edges: false }); bow.position.y = 0.37; g.add(bow);
    return g;
  },
  partyHat(hex = 0xe98db0) {
    const g = new T.Group();
    const cone = pm(new T.ConeGeometry(0.16, 0.34, 12), hex, { rough: 0.6, edges: false }); g.add(cone);
    const pom = pm(new T.SphereGeometry(0.05, 8, 6), 0xffffff, { edges: false }); pom.position.y = 0.19; g.add(pom);
    // polka dots
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const d = pm(new T.SphereGeometry(0.022, 6, 5), 0xffffff, { edges: false }); d.position.set(Math.cos(a) * 0.11, -0.02, Math.sin(a) * 0.11); g.add(d); }
    return g;
  },
};

// small utility to lighten a hex color
function lighten(hex, amt) {
  const c = new T.Color(hex); c.r = Math.min(1, c.r + amt); c.g = Math.min(1, c.g + amt); c.b = Math.min(1, c.b + amt); return c.getHex();
}

// A hanging streamer: a zig-zag ribbon strung between two points on a wall.
export function streamer(x1, y1, z1, x2, y2, z2, hex = 0xffe06b, sag = 0.5) {
  const g = new THREE.Group();
  const segs = 10;
  const prev = new THREE.Vector3(x1, y1, z1);
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t;
    const y = y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * sag;
    const cur = new THREE.Vector3(x, y, z);
    const mid = prev.clone().add(cur).multiplyScalar(0.5);
    const len = prev.distanceTo(cur);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, len), new THREE.MeshStandardMaterial({ color: (i % 2 ? hex : lighten(hex, 0.15)), roughness: 0.6, flatShading: true }));
    seg.position.copy(mid); seg.lookAt(cur);
    g.add(seg); prev.copy(cur);
  }
  return g;
}

// Simple glow marker used for shimmer (mercy hint, §6) and warm-core pulse.
export function glowSprite(color = 0xffe08a) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0 })
  );
  m.userData.glow = true;
  return m;
}
