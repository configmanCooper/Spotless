// engine/renderer.js — three.js renderer, scene root, lighting rig.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x08070d, 1);
    this.renderer.shadowMap.enabled = false;
    // Color management: filmic tone mapping + sRGB output so warm rooms glow and
    // highlights (screens, lamps) roll off instead of clipping (plan §3 rendering).
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this._baseExposure = 1.15;    // per-scene exposure target
    this._exposureGoal = 1.15;    // eased toward for blackout / reveals

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x141019, 22, 46);

    this.camera = new THREE.PerspectiveCamera(CONFIG.CAM_FOV, 1, 0.1, 200);

    // lighting: soft hemisphere + one key + fill (flat, warm, low-poly look §8).
    // Intensities are re-authored per scene via setPalette(pal.rig).
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x2a2530, 0.9);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 0.85);
    this.key.position.set(6, 14, 8);
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0x8899bb, 0.3);
    this.fill.position.set(-8, 6, -6);
    this.scene.add(this.fill);

    // base rig intensities (a scene rig can override these; setAmbient scales them)
    this._rig = { hemi: 0.9, key: 0.85, fill: 0.3 };

    // ambient/darkness controller for blackout scenes
    this.ambientLevel = 1;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setPalette(pal) {
    if (!pal) return;
    this.scene.fog.color.setHex(pal.fog);
    this.renderer.setClearColor(pal.fog, 1);
    this.hemi.groundColor.setHex(pal.ground);
    // per-scene light rig + fog distance + exposure (plan §3: per-scene light rigs)
    const rig = pal.rig || {};
    this._rig = { hemi: rig.hemi ?? 0.9, key: rig.key ?? 0.85, fill: rig.fill ?? 0.3 };
    this.hemi.color.setHex(rig.sky ?? 0xffffff);
    this.key.color.setHex(rig.keyColor ?? 0xffffff);
    this.fill.color.setHex(rig.fillColor ?? 0x8899bb);
    if (rig.keyPos) this.key.position.set(rig.keyPos[0], rig.keyPos[1], rig.keyPos[2]);
    else this.key.position.set(6, 14, 8);
    if (rig.fog) this.scene.fog.near = rig.fog[0], this.scene.fog.far = rig.fog[1];
    else this.scene.fog.near = 22, this.scene.fog.far = 46;
    this._baseExposure = rig.exposure ?? 1.15;
    this._exposureGoal = this._baseExposure;
    this.renderer.toneMappingExposure = this._baseExposure;
    this.setAmbient(this.ambientLevel);
  }

  // 0..1 — dims all lights for blackout (S10)
  setAmbient(level) {
    this.ambientLevel = level;
    const r = this._rig;
    this.hemi.intensity = r.hemi * level;
    this.key.intensity = r.key * level;
    this.fill.intensity = r.fill * level;
  }

  // Smoothly push exposure toward a multiple of the scene's base (reveals/blackout).
  setExposureScale(scale) { this._exposureGoal = this._baseExposure * scale; }
  tickExposure(dt) {
    const cur = this.renderer.toneMappingExposure;
    const k = 1 - Math.exp(-dt * 2.5);
    this.renderer.toneMappingExposure = cur + (this._exposureGoal - cur) * k;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.DPR_CAP);
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
