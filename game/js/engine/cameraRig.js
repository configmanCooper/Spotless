// engine/cameraRig.js — fixed overhead rig at ~55° tilt with per-room framing
// anchors (§7). The camera never free-rotates; it slides between authored anchors
// as Dust crosses thresholds, and gently follows within an anchor's bounds.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.tilt = THREE.MathUtils.degToRad(CONFIG.CAM_TILT_DEG);
    this.dist = CONFIG.CAM_DIST;
    this.target = new THREE.Vector3(0, 0, 0);   // look-at point (follows Dust, clamped)
    this._cur = new THREE.Vector3(0, 0, 0);
    this.anchors = [];                          // [{cx,cz,dist,minX,maxX,minZ,maxZ}]
    this.active = null;
    this._pos = new THREE.Vector3();
    this.snapNext = true;
  }

  setAnchors(anchors) {
    this.anchors = anchors && anchors.length ? anchors : [{ cx: 0, cz: 0, dist: this.dist }];
    this.active = this.anchors[0];
    this.snapNext = true;
  }

  // pick the framing volume containing Dust (fallback: nearest center)
  _pickAnchor(p) {
    let best = null, bestD = Infinity;
    for (const a of this.anchors) {
      if (a.minX != null && p.x >= a.minX && p.x <= a.maxX && p.z >= a.minZ && p.z <= a.maxZ) return a;
      const d = (a.cx - p.x) ** 2 + (a.cz - p.z) ** 2;
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  update(dt, dustPos) {
    const a = this._pickAnchor(dustPos);
    if (a) this.active = a;
    const anc = this.active || { cx: 0, cz: 0, dist: this.dist };
    const dist = anc.dist || this.dist;

    // desired look-at: bias toward Dust but clamp within the anchor's soft bounds
    let tx = dustPos.x, tz = dustPos.z;
    if (anc.minX != null) {
      const mx = (anc.maxX - anc.minX) * 0.28, mz = (anc.maxZ - anc.minZ) * 0.28;
      tx = THREE.MathUtils.clamp(tx, anc.cx - mx, anc.cx + mx);
      tz = THREE.MathUtils.clamp(tz, anc.cz - mz, anc.cz + mz);
    } else { tx = anc.cx * 0.4 + dustPos.x * 0.6; tz = anc.cz * 0.4 + dustPos.z * 0.6; }
    this.target.set(tx, 0, tz);

    const k = this.snapNext ? 1 : Math.min(1, dt * CONFIG.CAM_LERP);
    this._cur.lerp(this.target, k);

    // place camera behind/above at fixed tilt (looking down toward -Z world)
    const back = Math.cos(this.tilt) * dist;
    const up = Math.sin(this.tilt) * dist;
    this._pos.set(this._cur.x, up, this._cur.z + back);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._cur.x, 0.6, this._cur.z);
    this.snapNext = false;
  }
}
