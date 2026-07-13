// world.js — the Dust actor: movement, facing, cleaning, one-item carry, lamp,
// chest-screen text, trash meter. Consumes input + interact registry; stays
// decoupled from scene content (§9 scene contract).
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { robot } from './engine/props.js';

export class World {
  constructor({ scene, nav, interact, ui, narrator, audio }) {
    this.scene = scene; this.nav = nav; this.interact = interact;
    this.ui = ui; this.narrator = narrator; this.audio = audio;

    const r = robot({ body: 0xece3d2 });
    this.dust = r.group;
    this.rig = r;
    this.dust.position.set(0, 0, 4);
    this.facing = 0;
    scene.add(this.dust);

    this.carry = null;         // { entity, mesh } currently held (one item)
    this.cleaning = null;      // entity being cleaned
    this.cleanT = 0;
    this.lampOn = false;
    this.lampKnown = false;    // becomes true in S10
    this.lampBattery = 1;      // drains only when scene sets lampDrains
    this.lampDrains = false;
    this.canEmptyTrash = false;   // set true by scenes with a dumpster
    this.trash = 0;            // 0..1
    this.screenText = 'CLEANING…';
    this._bob = 0;

    this.enabled = true;       // disabled during cutscenes
    this.onInteractResult = null; // optional scene callback
  }

  setScreen(text, color) {
    this.screenText = text;
    this.rig.screen.draw(text, color ? { fg: color } : {});
    if (color) this.rig.rig ? null : null;
  }
  get pos() { return this.dust.position; }

  setLampKnown(v) { this.lampKnown = v; }
  resetLamp() { this.lampBattery = 1; this.lampDrains = false; }
  toggleLamp() {
    if (!this.lampKnown) return false;
    if (!this.lampOn && this.lampDrains && this.lampBattery <= CONFIG.LAMP.EMBER + 0.001) return false; // too dead to light
    this.lampOn = !this.lampOn;
    this.rig.lampLight.intensity = this.lampOn ? 5 * Math.max(0.2, this.lampBattery) : 0;
    this.audio?.sfx(this.lampOn ? 'lamp_on' : 'lamp_off');
    return true;
  }
  // recharge while standing at an outlet (scene calls this each frame)
  rechargeLamp(dt) {
    this.lampBattery = THREE.MathUtils.clamp(this.lampBattery + dt / CONFIG.LAMP.RECHARGE, 0, 1);
    if (this.lampOn) this.rig.lampLight.intensity = 5 * Math.max(0.2, this.lampBattery);
  }
  _updateLamp(dt) {
    if (!this.lampDrains) return;
    if (this.lampOn) {
      this.lampBattery -= dt / CONFIG.LAMP.DRAIN;
      if (this.lampBattery <= CONFIG.LAMP.EMBER) { this.lampBattery = CONFIG.LAMP.EMBER; this.lampOn = false; this.rig.lampLight.intensity = 0; }
      else this.rig.lampLight.intensity = 5 * Math.max(0.2, this.lampBattery);
    }
  }

  // pick up an entity's mesh (one item only; auto-drops any current item)
  pickUp(entity) {
    if (this.carry) this.drop();
    const mesh = entity.carryMesh || entity.mesh;
    if (!mesh) return false;
    const origParent = mesh.parent;               // remember where it lived (scene group)
    mesh.parent && mesh.parent.remove(mesh);
    this.rig.carryAnchor.add(mesh);
    mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0);
    this.carry = { entity, mesh, origParent };
    entity.carried = true;
    this.audio?.sfx('pick');
    this.ui.toast('Picked up: ' + this._itemName(entity) + '  ·  Q to drop', 2200);
    return true;
  }
  _itemName(entity) {
    const p = entity.prompt;
    const s = typeof p === 'function' ? '' : (p || entity.id);
    return String(s).replace(/^(take|lift|the)\s+/i, '').replace(/\s*\(.*\)$/, '') || entity.id;
  }
  drop() {
    if (!this.carry) return;
    const { entity, mesh, origParent } = this.carry;
    const wp = new THREE.Vector3();
    mesh.getWorldPosition(wp);
    this.rig.carryAnchor.remove(mesh);
    (origParent || this.scene).add(mesh);         // back into the scene group, not root
    mesh.position.copy(wp); mesh.position.y = entity.dropY ?? 0.2;
    entity.carried = false;
    this.carry = null;
    this.audio?.sfx('place');
  }
  // Q key: drop whatever we're holding
  dropCarried() {
    if (!this.carry) return false;
    this.drop();
    return true;
  }
  // place carried item into a target (consumes it from world)
  consumeCarry() {
    if (!this.carry) return null;
    const { entity, mesh } = this.carry;
    this.rig.carryAnchor.remove(mesh);
    this.carry = null;
    return entity;
  }

  addTrash(a) { this.trash = THREE.MathUtils.clamp(this.trash + a, 0, 1); this.ui.setTrash(this.trash); }
  emptyTrash() { this.trash = 0; this.ui.setTrash(0); this.audio?.sfx('dump'); }

  // ---- per-frame ----
  update(dt, input, api) {
    this._updateLamp(dt);
    if (!this.enabled) { this._animate(dt, false); return; }
    const p = this.dust.position;

    // movement: WASD/stick direct OR click-to-move target
    let mx = input.axisX, mz = input.axisZ;
    let moving = false;
    if (mx || mz) {
      input.clickTarget = null;
      const len = Math.hypot(mx, mz) || 1;
      mx /= len; mz /= len; moving = true;
    } else if (input.clickTarget) {
      const dx = input.clickTarget.x - p.x, dz = input.clickTarget.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > CONFIG.ARRIVE_EPS) { mx = dx / d; mz = dz / d; moving = true; }
      else input.clickTarget = null;
    }

    if (moving && !this.cleaning) {
      // in a draining-lamp scene, walking in the dark is slow (blind), never harmful
      const darkPenalty = (this.lampDrains && !this.lampOn) ? 0.55 : 1;
      const sp = CONFIG.DUST_SPEED * darkPenalty * dt;
      this.nav.move(p, mx * sp, mz * sp, CONFIG.DUST_RADIUS);
      this.facing = Math.atan2(mx, mz);
    }
    this.dust.rotation.y = this.facing;

    // interaction handling
    const near = this.interact.nearest(p);
    this._near = near;

    // cleaning (hold) — but a full trash bag must be emptied first (only in scenes
    // with a dumpster; elsewhere the meter is cosmetic and never gates cleaning)
    const trashFull = this.canEmptyTrash && this.trash >= 0.999;
    if (near && near.clean && trashFull) {
      if (this.cleaning) { this.cleaning = null; this.cleanT = 0; this.ui.setCleanRing(0); }
      if (!this._warnedFull || performance.now() - this._warnedFull > 4000) {
        this._warnedFull = performance.now();
        this.narrator?.say('trash_full', { category: 'REACT' });
      }
      this.ui.setPrompt('Trash full — empty it at the dumpster', 'tap');
      if (input.consumeInteractTap()) this._tapInteract(near, api);
      this._animate(dt, moving);
      return;
    }
    if (near && near.clean && (input.interactHeld || input.cleanHeld)) {
      if (this.cleaning !== near) { this.cleaning = near; this.cleanT = 0; }
      this.cleanT += dt;
      const dur = near.cleanTime ?? CONFIG.CLEAN_TIME;
      this.ui.setCleanRing(this.cleanT / dur, near.pos || near.mesh.position, api.camera);
      if (this.cleanT >= dur) {
        this.cleanT = 0; this.cleaning = null;
        this.ui.setCleanRing(0);
        this._doClean(near, api);
      }
    } else {
      if (this.cleaning) { this.cleaning = null; this.cleanT = 0; this.ui.setCleanRing(0); }
    }

    // tap interact (use/talk/pick/place)
    if (input.consumeInteractTap()) this._tapInteract(near, api);

    // prompt
    this.ui.setPrompt(near && !near.clean ? this.interact.promptFor(near, api)
      : (near && near.clean ? (near.prompt || 'Hold to clean') : null),
      near && near.clean ? 'hold' : 'tap');

    this._animate(dt, moving);
  }

  _doClean(entity, api) {
    this.addTrash(entity.trashAmount ?? 0.08);
    this.audio?.sfx('clean');
    if (entity.onClean) entity.onClean(api, entity);
    if (entity.removeOnClean !== false) {
      entity.mesh && entity.mesh.parent && entity.mesh.parent.remove(entity.mesh);
      this.interact.remove(entity);
    }
  }

  _tapInteract(entity, api) {
    if (!entity) return;
    // place carried item if this is a drop target
    if (this.carry && entity.acceptCarry) {
      const item = this.carry.entity;
      const mesh = this.carry.mesh;
      if (entity.acceptCarry(item, api)) {
        // target consumes it
        this.rig.carryAnchor.remove(mesh);
        this.scene.remove(mesh);
        this.carry = null;
        this.audio?.sfx('place');
        return;
      }
    }
    // pick up (auto-swaps: pickUp() drops whatever we're already holding)
    if (entity.pickable && (!this.carry || this.carry.entity !== entity)) {
      this.pickUp(entity); if (entity.onPick) entity.onPick(api, entity); return;
    }
    if (entity.onUse) entity.onUse(api, entity);
  }

  _animate(dt, moving) {
    // gentle servo bob while moving
    this._bob += dt * (moving ? 10 : 3);
    this.dust.position.y = moving ? Math.abs(Math.sin(this._bob)) * 0.03 : 0;
  }
}
