// input.js — keyboard + pointer. WASD / arrows for direct move, click/tap-to-move
// (ground raycast), E or click to interact, L for lamp (§7). All three input
// styles coexist and are tested equally.
import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Input {
  constructor(canvas, getCamera) {
    this.canvas = canvas;
    this.getCamera = getCamera;
    this.keys = new Set();
    this.axisX = 0; this.axisZ = 0;
    this.interactHeld = false;
    this.cleanHeld = false;
    this.clickTarget = null;        // {x,z} ground point
    this._interactTap = false;
    this._ray = new THREE.Raycaster();
    this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._ndc = new THREE.Vector2();
    this._hit = new THREE.Vector3();
    this.onLamp = null;
    this.onPause = null;
    this.onDrop = null;
    this.onSelf = null;
    this._pointerDownAt = 0;
    this._pointerMoved = false;
    this.enabled = true;

    addEventListener('keydown', (e) => this._key(e, true));
    addEventListener('keyup', (e) => this._key(e, false));
    canvas.addEventListener('pointerdown', (e) => this._down(e));
    canvas.addEventListener('pointermove', (e) => this._pmove(e));
    canvas.addEventListener('pointerup', (e) => this._up(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _key(e, down) {
    const k = e.key.toLowerCase();
    if (down) this.keys.add(k); else this.keys.delete(k);
    if (down && k === CONFIG.LAMP_KEY && this.onLamp) this.onLamp();
    if (down && k === 'escape' && this.onPause) this.onPause();
    if (down && (k === 'q' || k === 'g') && this.onDrop) this.onDrop();
    if (down && k === 'r' && this.onSelf) this.onSelf();
    if ((k === 'e' || k === ' ' || k === 'f')) {
      this.interactHeld = down;
      this.cleanHeld = down;
      if (down) this._interactTap = true;
    }
    this._recompute();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  }

  _recompute() {
    const k = this.keys;
    let x = 0, z = 0;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) z -= 1;
    if (k.has('s') || k.has('arrowdown')) z += 1;
    this.axisX = x; this.axisZ = z;
  }

  _groundPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const cam = this.getCamera();
    this._ray.setFromCamera(this._ndc, cam);
    if (this._ray.ray.intersectPlane(this._plane, this._hit)) return { x: this._hit.x, z: this._hit.z };
    return null;
  }

  _down(e) {
    if (!this.enabled) return;
    this._pointerDownAt = performance.now();
    this._pointerMoved = false;
    this._downXY = { x: e.clientX, y: e.clientY };
  }
  _pmove(e) {
    if (!this._downXY) return;
    if (Math.hypot(e.clientX - this._downXY.x, e.clientY - this._downXY.y) > 6) this._pointerMoved = true;
    if (this._pointerMoved) { const g = this._groundPoint(e); if (g) this.clickTarget = g; }
  }
  _up(e) {
    if (!this.enabled) { this._downXY = null; return; }
    const g = this._groundPoint(e);
    const quick = performance.now() - this._pointerDownAt < 250 && !this._pointerMoved;
    if (g) {
      this.clickTarget = g;
      if (quick) this._interactTap = true;  // tap = walk there + try interact
    }
    // hold-to-clean via pointer: treat sustained press near target as clean
    this._downXY = null;
  }

  // held clean while pointer is down and not moving (for touch cleaning)
  updatePointerHold() {
    const holding = !!this._downXY && !this._pointerMoved;
    // pointer hold only cleans; keyboard handles the rest
    if (holding) { this.interactHeld = true; this.cleanHeld = true; }
    else if (!this.keys.has('e') && !this.keys.has(' ') && !this.keys.has('f')) {
      this.interactHeld = false; this.cleanHeld = false;
    }
  }

  consumeInteractTap() { const v = this._interactTap; this._interactTap = false; return v; }
}
