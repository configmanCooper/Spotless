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
    this._queuedPointerInteract = false;
    this._virtualInteract = false;
    this._gamepadInteract = false;
    this._gamepadAxisX = 0; this._gamepadAxisZ = 0;
    this._gamepadButtons = [];
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
    addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
  }

  _key(e, down) {
    const code = e.code || '';
    const key = (e.key || '').toLowerCase();
    if (!this.enabled && down && code !== 'Escape' && key !== 'escape') return;
    const id = code || key;
    if (down) this.keys.add(id); else this.keys.delete(id);
    const initial = down && !e.repeat;
    if (initial && (code === 'KeyL' || key === CONFIG.LAMP_KEY) && this.onLamp) this.onLamp();
    if (initial && (code === 'Escape' || key === 'escape') && this.onPause) this.onPause();
    if (initial && (code === 'KeyQ' || code === 'KeyG' || key === 'q' || key === 'g') && this.onDrop) this.onDrop();
    if (initial && (code === 'KeyR' || key === 'r') && this.onSelf) this.onSelf();
    if (code === 'KeyE' || code === 'Space' || code === 'KeyF' || key === 'e' || key === ' ' || key === 'f') {
      this._keyboardInteract = down;
      this._syncInteractHeld();
      if (initial) this._interactTap = true;
    }
    this._recompute();
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)
      || ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
  }

  _recompute() {
    const k = this.keys;
    let x = 0, z = 0;
    if (k.has('KeyA') || k.has('a') || k.has('ArrowLeft') || k.has('arrowleft')) x -= 1;
    if (k.has('KeyD') || k.has('d') || k.has('ArrowRight') || k.has('arrowright')) x += 1;
    if (k.has('KeyW') || k.has('w') || k.has('ArrowUp') || k.has('arrowup')) z -= 1;
    if (k.has('KeyS') || k.has('s') || k.has('ArrowDown') || k.has('arrowdown')) z += 1;
    this._keyAxisX = x; this._keyAxisZ = z;
    this._applyAxes();
  }
  _applyAxes() {
    const keyboardActive = !!(this._keyAxisX || this._keyAxisZ);
    let x = keyboardActive ? this._keyAxisX : (this._gamepadAxisX || 0);
    let z = keyboardActive ? this._keyAxisZ : (this._gamepadAxisZ || 0);
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    this.axisX = x; this.axisZ = z;
  }
  _syncInteractHeld() {
    const held = !!(this._keyboardInteract || this._virtualInteract || this._gamepadInteract);
    this.interactHeld = held; this.cleanHeld = held;
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
      if (quick) this._queuedPointerInteract = true;
    }
    // hold-to-clean via pointer: treat sustained press near target as clean
    this._downXY = null;
  }

  // held clean while pointer is down and not moving (for touch cleaning)
  updatePointerHold() {
    const holding = !!this._downXY && !this._pointerMoved;
    this._pointerInteract = holding;
    const held = !!(this._keyboardInteract || this._virtualInteract || this._gamepadInteract || this._pointerInteract);
    this.interactHeld = held; this.cleanHeld = held;
  }

  consumeInteractTap() { const v = this._interactTap; this._interactTap = false; return v; }
  consumeArrivalInteract() {
    if (!this._queuedPointerInteract || this.clickTarget) return false;
    this._queuedPointerInteract = false;
    return true;
  }
  cancelQueuedInteract() { this._queuedPointerInteract = false; }
  setVirtualInteract(down) {
    this._virtualInteract = !!down;
    this._syncInteractHeld();
    if (down) this._interactTap = true;
  }
  updateGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && [...pads].find(Boolean);
    if (!pad) {
      this._gamepadAxisX = 0; this._gamepadAxisZ = 0; this._gamepadInteract = false;
      this._gamepadButtons.length = 0; this._applyAxes(); this._syncInteractHeld(); return;
    }
    const dead = 0.2;
    const axis = (v) => Math.abs(v || 0) >= dead ? v : 0;
    this._gamepadAxisX = axis(pad.axes[0]);
    this._gamepadAxisZ = axis(pad.axes[1]);
    this._applyAxes();
    const pressed = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const edge = (i) => pressed(i) && !this._gamepadButtons[i];
    this._gamepadInteract = pressed(0);
    if (edge(0)) this._interactTap = true;
    if (edge(1) && this.onDrop) this.onDrop();
    if (edge(2) && this.onSelf) this.onSelf();
    if (edge(3) && this.onLamp) this.onLamp();
    if (edge(9) && this.onPause) this.onPause();
    for (let i = 0; i < 16; i++) this._gamepadButtons[i] = pressed(i);
    this._syncInteractHeld();
  }
  reset() {
    this.keys.clear();
    this._keyAxisX = this._keyAxisZ = 0;
    this._gamepadAxisX = this._gamepadAxisZ = 0;
    this._keyboardInteract = this._virtualInteract = this._gamepadInteract = this._pointerInteract = false;
    this._downXY = null;
    this.clickTarget = null;
    this._queuedPointerInteract = false;
    this._interactTap = false;
    this._gamepadButtons.length = 0;
    this._applyAxes();
    this._syncInteractHeld();
  }
}
