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
    this._pushT = 0; this._pushAmt = 0; this._pushHold = 0;   // recognition push
    this._impulse = 0;                                        // machinery shake
  }

  // authored beats (plan §3): a brief closer framing, or a small shake
  push(amount = 1.4, hold = 1.6) { this._pushAmt = amount; this._pushHold = hold; this._pushT = 0; }
  impulse(strength = 0.5) { this._impulse = Math.max(this._impulse, strength); }
  beat(o) { if (!o) return; if (o.push != null) this.push(o.push, o.hold ?? 1.6); if (o.impulse != null) this.impulse(o.impulse); }

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
    let dist = anc.dist || this.dist;

    // recognition push: ease the framing closer for a beat, then back out
    if (this._pushHold > 0 || this._pushT < 1) {
      this._pushT += dt / Math.max(0.3, (this._pushHold || 1) + 0.8);
      const env = Math.sin(Math.min(1, this._pushT) * Math.PI);   // 0→1→0
      dist -= (anc.dist || this.dist) * 0.16 * this._pushAmt * env;
      if (this._pushT >= 1) { this._pushHold = 0; this._pushAmt = 0; }
    }

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
    // machinery impulse: a small decaying positional shake
    let sx = 0, sy = 0;
    if (this._impulse > 0.001) {
      sx = (Math.random() - 0.5) * this._impulse * 0.5;
      sy = (Math.random() - 0.5) * this._impulse * 0.5;
      this._impulse *= Math.max(0, 1 - dt * 6);
    }
    this._pos.set(this._cur.x + sx, up + sy, this._cur.z + back);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._cur.x, 0.6, this._cur.z);
    this.snapNext = false;
  }
}
