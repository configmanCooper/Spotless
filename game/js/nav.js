// nav.js — movement helpers. Circle (Dust) vs axis-aligned box obstacles with
// slide response, plus arena bounds clamping. Simple + deterministic (§9).
import * as THREE from 'three';

export class Nav {
  constructor() {
    this.obstacles = [];   // [{minX,maxX,minZ,maxZ}]
    this.bounds = null;    // {minX,maxX,minZ,maxZ} or null (open)
  }
  clear() { this.obstacles.length = 0; this.bounds = null; }
  setBounds(b) { this.bounds = b; }
  addBox(cx, cz, w, d) {
    const b = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
    this.obstacles.push(b);
    return b;
  }
  removeBox(b) { const i = this.obstacles.indexOf(b); if (i >= 0) this.obstacles.splice(i, 1); }

  // Move a circle by delta, resolving against obstacles axis-by-axis (slide).
  move(pos, dx, dz, r) {
    let nx = pos.x + dx, nz = pos.z + dz;
    // resolve X then Z independently for smooth wall-sliding
    nx = this._resolveAxis(nx, pos.z, r, 'x', pos.x);
    nz = this._resolveAxis(nz, nx, r, 'z', pos.z);
    if (this.bounds) {
      nx = THREE.MathUtils.clamp(nx, this.bounds.minX + r, this.bounds.maxX - r);
      nz = THREE.MathUtils.clamp(nz, this.bounds.minZ + r, this.bounds.maxZ - r);
    }
    pos.x = nx; pos.z = nz;
  }

  _resolveAxis(v, other, r, axis, prev) {
    for (const o of this.obstacles) {
      if (axis === 'x') {
        if (other + r > o.minZ && other - r < o.maxZ) {
          if (v + r > o.minX && v - r < o.maxX) {
            // pick nearer side based on previous position
            v = (prev <= o.minX) ? o.minX - r : (prev >= o.maxX ? o.maxX + r : v);
          }
        }
      } else {
        if (other + r > o.minX && other - r < o.maxX) {
          if (v + r > o.minZ && v - r < o.maxZ) {
            v = (prev <= o.minZ) ? o.minZ - r : (prev >= o.maxZ ? o.maxZ + r : v);
          }
        }
      }
    }
    return v;
  }
}
