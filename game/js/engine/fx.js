// engine/fx.js — lightweight reusable particle/atmosphere systems (plan §3 effects).
// One persistent per-frame updater ticks all active systems; everything lives in
// the scene group so it is disposed on scene teardown. No external assets.
import * as THREE from 'three';

const _quad = new THREE.PlaneGeometry(0.12, 0.12);
_quad.userData.shared = true;   // reused across all bursts + scenes; never dispose

export function makeFx(api) {
  const group = api.group;
  const active = [];   // { t, life, update(t,dt)->bool|void, dispose() }

  api.everyFrame((dt) => {
    for (let i = active.length - 1; i >= 0; i--) {
      const s = active[i]; s.t += dt;
      let keep = true;
      try { keep = s.update(s.t, dt) !== false; } catch { keep = false; }
      if (!keep || (s.life != null && s.t > s.life)) { try { s.dispose(); } catch {} active.splice(i, 1); }
    }
  });

  // a short-lived burst of billboarded quads flying outward from `pos`
  function burst(pos, { color = 0xdfe4d8, n = 8, spread = 0.9, life = 0.55, rise = 0.6, size = 1 } = {}) {
    if (!pos) return;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false });
    const g = new THREE.Group();
    g.position.set(pos.x, (pos.y ?? 0.4), pos.z);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(_quad, mat);
      m.scale.setScalar((0.5 + Math.random()) * size);
      const a = Math.random() * Math.PI * 2, r = Math.random();
      parts.push({ m, vx: Math.cos(a) * spread * r, vy: rise * (0.4 + Math.random()), vz: Math.sin(a) * spread * r });
      g.add(m);
    }
    group.add(g);
    active.push({
      t: 0, life,
      update: (t) => {
        const k = t / life;
        for (const p of parts) { p.m.position.set(p.vx * t, p.vy * t, p.vz * t); p.m.rotation.z += 0.2; }
        mat.opacity = 0.9 * (1 - k);
      },
      dispose: () => { group.remove(g); mat.dispose(); },
    });
  }

  const fx = {
    // cleaning dust puff
    puff(pos, color = 0xe6dcc4) { burst(pos, { color, n: 7, spread: 0.7, life: 0.5, rise: 0.5, size: 0.9 }); },
    // electrical sparks
    sparks(pos, color = 0xfff2a8) { burst(pos, { color, n: 10, spread: 1.4, life: 0.4, rise: 0.3, size: 0.6 }); },
    // rising smoke wisp
    smoke(pos, color = 0x9a9a9a) { burst(pos, { color, n: 5, spread: 0.25, life: 1.4, rise: 1.1, size: 1.4 }); },

    // a persistent, slowly drifting mote field (ambient dust in light). Returns the
    // Points object so a scene can tint or reposition it.
    motes({ count = 60, area = [10, 4, 10], center = [0, 2, 0], color = 0xffffff, opacity = 0.28, size = 0.05 } = {}) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = center[0] + (Math.random() - 0.5) * area[0];
        pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * area[1];
        pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2];
        seed[i] = Math.random() * Math.PI * 2;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true, toneMapped: false });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = 2;
      group.add(pts);
      active.push({
        t: 0, life: null,
        update: (t, dt) => {
          if (api.world && api.world.reducedMotion) return;
          const arr = geo.attributes.position.array;
          for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += Math.sin(t * 0.5 + seed[i]) * dt * 0.06;
            arr[i * 3] += Math.cos(t * 0.3 + seed[i]) * dt * 0.04;
          }
          geo.attributes.position.needsUpdate = true;
        },
        dispose: () => { group.remove(pts); geo.dispose(); mat.dispose(); },
      });
      return pts;
    },

    // a fake volumetric beam: an additive cone from `from` toward `to`
    beam(from, to, { color = 0xffe3a8, radius = 0.6, opacity = 0.18 } = {}) {
      const a = new THREE.Vector3(from.x, from.y, from.z);
      const b = new THREE.Vector3(to.x, to.y, to.z);
      const len = a.distanceTo(b);
      const geo = new THREE.CylinderGeometry(0.02, radius, len, 16, 1, true);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
      const cone = new THREE.Mesh(geo, mat);
      cone.position.copy(a.clone().add(b).multiplyScalar(0.5));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      cone.raycast = () => {};
      group.add(cone);
      return { mesh: cone, setOpacity: (o) => { mat.opacity = o; } };
    },

    // flicker a light's intensity around a base value (call each frame)
    flicker(light, base, amt = 0.18, t = 0) { if (light) light.intensity = base * (1 - amt + Math.random() * amt * 2); },
  };
  return fx;
}
