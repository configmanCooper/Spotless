// debug.js — local-only playtest telemetry (§6). Enabled with ?playtest=1.
// Shows per-scene solve times + hints consumed. No network, ever.
export class Debug {
  constructor() {
    this.on = new URLSearchParams(location.search).has('playtest');
    this.records = [];
    this.el = null;
  }
  attach(el) {
    this.el = el;
    if (this.on) {
      el.classList.add('show', 'clickable');
      el.title = 'Click to export local playtest telemetry';
      el.onclick = () => this.export();
    }
  }
  record(sceneId, stats) {
    this.records.push({ scene: sceneId, ...stats });
    this.render();
  }
  set(text) { if (this.el && this.on) this.el.textContent = text; }
  setBudget(calls, tris, geos, texs) {
    this._budget = `draws:${calls}  tris:${(tris / 1000).toFixed(1)}k  geo:${geos}  tex:${texs}`;
    this.render();
  }
  export() {
    const blob = new Blob([JSON.stringify(this.records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'spotless-playtest.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  render() {
    if (!this.el || !this.on) return;
    const lines = ['— PLAYTEST (local only) —'];
    if (this._budget) lines.push(this._budget);
    for (const r of this.records) {
      lines.push(`${r.scene.padEnd(15)} ${(r.solveTime | 0)}s h:${r.hints} wr:${r.wrong ?? 0} dr:${r.drops ?? 0} ex:${r.examines ?? 0} rl:${r.reloads ?? 0}`);
    }
    this.el.textContent = lines.join('\n');
  }
}
