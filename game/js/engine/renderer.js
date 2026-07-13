// engine/renderer.js — three.js renderer, scene root, lighting rig.
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x08070d, 1);
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x141019, 22, 46);

    this.camera = new THREE.PerspectiveCamera(CONFIG.CAM_FOV, 1, 0.1, 200);

    // lighting: soft hemisphere + one key + fill (flat, warm, low-poly look §8)
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x2a2530, 0.9);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 0.85);
    this.key.position.set(6, 14, 8);
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0x8899bb, 0.3);
    this.fill.position.set(-8, 6, -6);
    this.scene.add(this.fill);

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
  }

  // 0..1 — dims all lights for blackout (S10)
  setAmbient(level) {
    this.ambientLevel = level;
    this.hemi.intensity = 0.9 * level;
    this.key.intensity = 0.85 * level;
    this.fill.intensity = 0.3 * level;
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
