// ui.js — DOM UI over the canvas (§7, §9). Subtitles (speaker-tinted, 2-line cap),
// HUD (task, battery, lamp glyph, trash meter), interaction prompt, clean ring,
// title/menu/settings screens, fade/toast, credits. Fully playable sound-off.
import * as THREE from 'three';

export class UI {
  constructor(root, game) {
    this.root = root; this.game = game;
    this._subTimer = 0;
    root.innerHTML = `
      <div id="hud">
        <div class="row"><div class="chip task"><b>TASK</b> <span id="task">—</span></div></div>
        <div class="row">
          <div class="chip"><div id="battery"><i></i></div>
            <span class="lamp-glyph" id="lampglyph" title="Lamp"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" fill="currentColor"/></svg></span></div>
          <div class="chip" id="trash"><span>TRASH</span><div id="trashbar"><i></i></div></div>
        </div>
      </div>
      <div id="prompt"><span id="promptkey" class="key">E</span><span id="prompttext"></span></div>
      <svg id="cleanring" viewBox="0 0 66 66">
        <circle cx="33" cy="33" r="28" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="5"/>
        <circle id="cleanarc" cx="33" cy="33" r="28" fill="none" stroke="#38e0e6" stroke-width="5"
          stroke-linecap="round" transform="rotate(-90 33 33)"
          stroke-dasharray="175.9" stroke-dashoffset="175.9"/>
      </svg>
      <div id="subs"><span class="who"></span><span class="txt"></span></div>
      <div id="toast"></div>
      <div id="touch-controls">
        <button id="touch-interact" aria-label="Interact">E</button>
        <button id="touch-drop" aria-label="Drop carried item">DROP</button>
        <button id="touch-self" aria-label="Self action">SELF</button>
        <button id="touch-lamp" aria-label="Toggle lamp">LAMP</button>
        <button id="touch-pause" aria-label="Pause">II</button>
      </div>
      <div id="fade"></div>
      <div id="debug"></div>
      <div id="title" class="screen"></div>
      <div id="pause" class="screen hidden"></div>
      <div id="examine" class="screen hidden"></div>
      <div id="credits"></div>
    `;
    this.$ = (id) => root.querySelector(id);
    this.subs = this.$('#subs'); this.subWho = this.subs.querySelector('.who'); this.subTxt = this.subs.querySelector('.txt');
    this.taskEl = this.$('#task');
    this.batteryFill = this.$('#battery i');
    this.lampGlyph = this.$('#lampglyph');
    this.trashFill = this.$('#trashbar i');
    this.promptEl = this.$('#prompt'); this.promptKey = this.$('#promptkey'); this.promptTxt = this.$('#prompttext');
    this.cleanring = this.$('#cleanring'); this.cleanarc = this.$('#cleanarc');
    this.toastEl = this.$('#toast'); this.fadeEl = this.$('#fade');
    this.debugEl = this.$('#debug');
    this.titleEl = this.$('#title'); this.pauseEl = this.$('#pause'); this.creditsEl = this.$('#credits');
    this.examineEl = this.$('#examine');
    this.touchEl = this.$('#touch-controls');
    this._v = new THREE.Vector3();
    this._bindTouchControls();
    this.setHudVisible(false);
  }

  setHudVisible(v) { this.$('#hud').style.display = v ? 'block' : 'none'; }

  // ---- subtitles ----
  showSub(text, cls = 'narrator', who = '') {
    if (this.game && this.game.settings && this.game.settings.subs === false) {
      this.hideSub();
      return;
    }
    // preserve accessibility (sub-*) classes; only swap the speaker class + show
    if (this._lastSubCls) this.subs.classList.remove(this._lastSubCls);
    this.subs.classList.add('show', cls);
    this._lastSubCls = cls;
    this.subWho.textContent = who === 'narrator' ? '' : (who || '').toUpperCase();
    this.subTxt.textContent = text;
    this._subTimer = 0;
  }
  hideSub() {
    this.subs.classList.remove('show');
    if (this._lastSubCls) { this.subs.classList.remove(this._lastSubCls); this._lastSubCls = null; }
  }
  hideSubSoon() { this._subTimer = 0.01; }
  tick(dt) {
    if (this._subTimer > 0) { this._subTimer += dt; if (this._subTimer > 1.1) { this.hideSub(); this._subTimer = 0; } }
  }

  // ---- HUD ----
  setTask(t) { this.taskEl.textContent = t || '—'; this.taskEl.classList.remove('done'); const p = this.taskEl.parentElement; p && p.classList.remove('taskdone'); }
  setTaskDone(done) {
    const p = this.taskEl.parentElement;
    if (done) { this.taskEl.classList.add('done'); if (p) { p.classList.add('taskdone'); if (!/^✓/.test(this.taskEl.textContent)) this.taskEl.textContent = '✓ ' + this.taskEl.textContent; } }
    else { this.taskEl.classList.remove('done'); p && p.classList.remove('taskdone'); }
  }
  setTrash(v) { this.trashFill.style.width = Math.round(v * 100) + '%'; }
  setBattery(v) { this.batteryFill.style.width = Math.round(v * 70) + '%'; }
  setBatteryArc(v) {
    this.batteryFill.style.width = Math.round(Math.max(0, Math.min(1, v)) * 100) + '%';
    this.batteryFill.style.background = v < 0.25 ? '#e0685a' : v < 0.5 ? '#e9c05a' : '#38e0e6';
  }
  setSelfPrompt(text) {
    if (!this._selfEl) {
      this._selfEl = document.createElement('div');
      this._selfEl.id = 'selfprompt';
      this._selfEl.style.cssText = 'position:absolute;left:50%;bottom:26%;transform:translateX(-50%);background:var(--panel);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 13px;font-size:14px;opacity:0;transition:opacity .15s;';
      this.root.appendChild(this._selfEl);
    }
    if (!text) { this._selfEl.style.opacity = '0'; return; }
    this._selfEl.innerHTML = `<span class="key" style="display:inline-block;min-width:20px;padding:1px 6px;margin-right:6px;border:1px solid var(--dim);border-radius:4px;font-weight:700;font-size:12px;">R</span>${text}`;
    this._selfEl.style.opacity = '1';
  }
  setLampGlyph(state) { // 'dim' | 'known' | 'on'
    this.lampGlyph.className = 'lamp-glyph' + (state === 'on' ? ' on' : state === 'known' ? ' known' : '');
  }
  _bindTouchControls() {
    const bindHold = (el) => {
      const down = (e) => { e.preventDefault(); e.stopPropagation(); this.game.input && this.game.input.setVirtualInteract(true); };
      const up = (e) => { e.preventDefault(); e.stopPropagation(); this.game.input && this.game.input.setVirtualInteract(false); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    };
    bindHold(this.$('#touch-interact'));
    this.$('#touch-drop').onclick = (e) => { e.preventDefault(); this.game.input && this.game.input.onDrop && this.game.input.onDrop(); };
    this.$('#touch-self').onclick = (e) => { e.preventDefault(); this.game.input && this.game.input.onSelf && this.game.input.onSelf(); };
    this.$('#touch-lamp').onclick = (e) => { e.preventDefault(); this.game.input && this.game.input.onLamp && this.game.input.onLamp(); };
    this.$('#touch-pause').onclick = (e) => { e.preventDefault(); this.game.input && this.game.input.onPause && this.game.input.onPause(); };
  }
  setTouchActions({ play = false, carry = false, self = false, lamp = false } = {}) {
    this.touchEl.classList.toggle('play', !!play);
    this.$('#touch-drop').classList.toggle('available', !!carry);
    this.$('#touch-self').classList.toggle('available', !!self);
    this.$('#touch-lamp').classList.toggle('available', !!lamp);
  }

  setPrompt(text, mode = 'tap') {
    if (!text) { this.promptEl.classList.remove('show'); return; }
    this.promptEl.classList.add('show');
    this.promptEl.classList.toggle('is-hold', mode === 'hold');
    this.promptEl.classList.toggle('is-tap', mode !== 'hold');
    this.promptKey.textContent = 'E';
    this.promptTxt.textContent = (mode === 'hold' ? 'Hold — ' : '') + text;
  }

  setCleanRing(progress, worldPos, camera) {
    if (!progress || !worldPos || !camera) { this.cleanring.classList.remove('show'); return; }
    this.cleanring.classList.add('show');
    this._v.copy(worldPos).project(camera);
    const x = (this._v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._v.y * 0.5 + 0.5) * window.innerHeight;
    this.cleanring.style.left = (x - 33) + 'px';
    this.cleanring.style.top = (y - 33) + 'px';
    const C = 175.9;
    this.cleanarc.style.strokeDashoffset = String(C * (1 - Math.min(1, progress)));
  }

  // ---- toast / fade ----
  toast(text, ms = 2200) {
    this.toastEl.textContent = text; this.toastEl.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }
  fade(on) { this.fadeEl.classList.toggle('show', on); }

  // ---- title / pause / settings ----
  showTitle(onNew, onContinue, hasSave, onSettings, onScenes) {
    this.setHudVisible(false);
    this.titleEl.classList.remove('hidden');
    this.titleEl.innerHTML = `
      <div class="title-word">SPOTLESS</div>
      <div class="title-sub">a house robot named Dust</div>
      <div class="menu-list">
        ${hasSave ? '<button class="btn primary" id="t-cont">Continue</button>' : ''}
        <button class="btn" id="t-new">${hasSave ? 'New Game' : 'Begin'}</button>
        <button class="btn" id="t-set">Settings</button>
        ${onScenes ? '<button class="btn" id="t-sc">Scene Select</button>' : ''}
      </div>`;
    this.$('#t-new').onclick = () => onNew();
    if (hasSave) this.$('#t-cont').onclick = () => onContinue();
    this.$('#t-set').onclick = () => onSettings();
    if (onScenes) this.$('#t-sc').onclick = () => onScenes();
  }
  hideTitle() { this.titleEl.classList.add('hidden'); }

  showSettings(settings, onChange, onBack) {
    this.pauseEl.classList.remove('hidden');
    const seg = (key, opts, cur) => `<div class="seg">${opts.map(raw => {
      const o = typeof raw === 'object' ? raw : { value: raw, label: raw };
      return `<button data-k="${key}" data-v="${o.value}" class="${String(o.value) === String(cur) ? 'sel' : ''}">${o.label}</button>`;
    }).join('')}</div>`;
    this.pauseEl.innerHTML = `
      <div class="settings">
        <h3>SETTINGS</h3>
        <div class="opt"><span>Hints</span>${seg('hints', [
          { value: 'normal', label: 'Normal' },
          { value: 'patient', label: 'Patient narrator' },
          { value: 'off', label: 'Off' },
        ], settings.hints)}</div>
        <div class="setting-note">Patient narrator gives only the first two hint tiers and never highlights the answer.</div>
        <div class="opt"><span>Assist timing</span>${seg('assist', ['on', 'off'], settings.assist ? 'on' : 'off')}</div>
        <div class="opt"><span>Subtitles</span>${seg('subs', ['on', 'off'], settings.subs ? 'on' : 'off')}</div>
        <div class="opt"><span>Master volume</span>${seg('master', [
          { value: '0', label: 'Mute' }, { value: '0.25', label: '25%' },
          { value: '0.5', label: '50%' }, { value: '0.75', label: '75%' },
          { value: '0.9', label: '90%' }, { value: '1', label: '100%' },
        ], settings.master ?? 0.9)}</div>
        <div class="opt"><span>Subtitle size</span>${seg('subSize', ['small', 'normal', 'large'], settings.subSize || 'normal')}</div>
        <div class="opt"><span>Reading speed</span>${seg('subSpeed', ['slow', 'normal', 'fast'], settings.subSpeed || 'normal')}</div>
        <div class="opt"><span>Subtitle background</span>${seg('subOpacity', ['low', 'normal', 'high'], settings.subOpacity || 'normal')}</div>
        <div class="opt"><span>High contrast</span>${seg('subContrast', ['on', 'off'], settings.subContrast ? 'on' : 'off')}</div>
        <div class="opt"><span>Reduced motion</span>${seg('reducedMotion', ['on', 'off'], settings.reducedMotion ? 'on' : 'off')}</div>
        <div class="opt"><span>Light bloom</span>${seg('bloom', ['on', 'off'], settings.bloom === true ? 'on' : 'off')}</div>
      </div>
      <button class="btn" id="s-back">Back</button>`;
    this.pauseEl.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
      const k = b.dataset.k; let v = b.dataset.v;
      if (k === 'subs') v = (v === 'on');
      if (k === 'subContrast') v = (v === 'on');
      if (k === 'assist') v = (v === 'on');
      if (k === 'reducedMotion') v = (v === 'on');
      if (k === 'bloom') v = (v === 'on');
      if (k === 'master') v = Number(v);
      onChange(k, v);
      b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
    this.$('#s-back').onclick = () => { this.pauseEl.classList.add('hidden'); onBack && onBack(); };
  }
  hidePause() { this.pauseEl.classList.add('hidden'); }

  // Chapter/scene select board (uses the pause overlay panel).
  showSceneSelect(entries, onPick, onBack) {
    this.setHudVisible(false);
    this.pauseEl.classList.remove('hidden');
    this.pauseEl.innerHTML = `
      <div class="settings scene-select">
        <h3>SCENE SELECT</h3>
        <div class="menu-list">
          ${entries.map(e => `<button class="btn" data-id="${e.id}">${e.label}</button>`).join('')}
        </div>
      </div>
      <button class="btn" id="ss-back">Back</button>`;
    this.pauseEl.querySelectorAll('.menu-list button').forEach(b =>
      b.onclick = () => { onPick(b.dataset.id); });
    this.$('#ss-back').onclick = () => { this.pauseEl.classList.add('hidden'); onBack && onBack(); };
  }

  showPause(onResume, onSettings, onTitle, onMemory) {
    this.pauseEl.classList.remove('hidden');
    this.pauseEl.innerHTML = `
      <div class="title-sub">PAUSED</div>
      <div class="menu-list">
        <button class="btn primary" id="p-res">Resume</button>
        ${onMemory ? '<button class="btn" id="p-mem">Memory</button>' : ''}
        <button class="btn" id="p-set">Settings</button>
        <button class="btn" id="p-title">Quit to Title</button>
      </div>`;
    this.$('#p-res').onclick = () => { this.hidePause(); onResume(); };
    if (onMemory) this.$('#p-mem').onclick = () => onMemory();
    this.$('#p-set').onclick = () => onSettings();
    this.$('#p-title').onclick = () => onTitle();
  }

  // Memory / transcript panel (plan §1): the last STORY + VOICE lines Dust kept.
  showMemory(entries, onBack) {
    this.pauseEl.classList.remove('hidden');
    const items = (entries && entries.length)
      ? entries.slice().reverse().map(e => {
          const speaker = e.speaker === 'narrator' || e.speaker === 'spatial' ? 'ASH' : String(e.speaker || 'VOICE').toUpperCase();
          const who = speaker === 'ASH' ? 'ash' : 'voice';
          const scene = e.scene ? `<span class="mem-scene">${this._esc(e.scene.replace(/^s\d+_/, '').replace(/_/g, ' '))}</span>` : '';
          return `<div class="mem-line ${who}"><div class="mem-meta"><span class="mem-who">${this._esc(speaker)}</span>${scene}</div><span class="mem-txt">${this._esc(e.text)}</span></div>`;
        }).join('')
      : '<div class="mem-empty">Nothing kept yet. The words come later.</div>';
    this.pauseEl.innerHTML = `
      <div class="settings memory">
        <h3>MEMORY</h3>
        <div class="mem-list">${items}</div>
      </div>
      <button class="btn" id="mem-back">Back</button>`;
    this.$('#mem-back').onclick = () => { this.pauseEl.classList.add('hidden'); onBack && onBack(); };
  }
  _esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  // Examine / Observe close-up (plan §2). Same Interact verb exits.
  showExamine(content, onExit) {
    const el = this.examineEl;
    el.classList.remove('hidden');
    const acc = content.accent || '#7fe0ff';
    const lines = (content.lines || []).map(l => `<div class="ex-line">${this._esc(l)}</div>`).join('');
    el.innerHTML = `
      <div class="examine-card" style="--acc:${acc}">
        <div class="ex-title">${this._esc(content.title || 'Examine')}</div>
        <div class="ex-body">${lines}</div>
        <div class="ex-hint">Interact to step back</div>
      </div>`;
    let done = false;
    const close = () => {
      if (done) return; done = true;
      removeEventListener('keydown', onKey, true);
      el.removeEventListener('pointerdown', onClick);
      el.classList.add('hidden');
      onExit && onExit();
    };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (['e', 'f', ' ', 'enter', 'escape'].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    };
    const onClick = () => close();
    addEventListener('keydown', onKey, true);
    el.addEventListener('pointerdown', onClick);
    this._examineClose = close;
  }
  hideExamine() { if (this._examineClose) this._examineClose(); else this.examineEl.classList.add('hidden'); }

  // Apply subtitle accessibility settings (size / speed / opacity / contrast).
  applySubtitleSettings(s) {
    if (!s) return;
    const cl = this.subs.classList;
    cl.remove('sub-sm', 'sub-lg', 'sub-op-low', 'sub-op-high', 'sub-contrast');
    if (s.subSize === 'small') cl.add('sub-sm');
    else if (s.subSize === 'large') cl.add('sub-lg');
    if (s.subOpacity === 'low') cl.add('sub-op-low');
    else if (s.subOpacity === 'high') cl.add('sub-op-high');
    if (s.subContrast) cl.add('sub-contrast');
    this.subReadMul = s.subSpeed === 'slow' ? 1.45 : (s.subSpeed === 'fast' ? 0.72 : 1);
  }

  // ---- credits (ride the beam) ----
  showCredits(lines, onEnd) {
    this.creditsEl.classList.add('show');
    this.setHudVisible(false);
    const roll = document.createElement('div');
    roll.className = 'roll';
    roll.innerHTML = lines.map(l => l.h ? `<h1>${l.h}</h1>` :
      `<div class="${l.dim ? 'dim' : ''}">${l.t || '&nbsp;'}</div>`).join('');
    this.creditsEl.innerHTML = '';
    this.creditsEl.appendChild(roll);
    const controls = document.createElement('div');
    controls.className = 'credit-controls';
    this.creditsEl.appendChild(controls);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this.creditsEl.classList.remove('show', 'static');
      onEnd && onEnd();
    };
    if (this.game.settings && this.game.settings.reducedMotion) {
      this.creditsEl.classList.add('static');
      controls.innerHTML = '<button class="btn primary" id="credits-continue">Continue</button>';
      controls.querySelector('#credits-continue').onclick = finish;
      return;
    }
    roll.style.top = window.innerHeight + 'px';
    const dur = 34000;
    let elapsed = 0, last = performance.now(), paused = false;
    controls.innerHTML = '<button class="btn" id="credits-pause">Pause</button><button class="btn" id="credits-skip">Skip</button>';
    const pauseBtn = controls.querySelector('#credits-pause');
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continue' : 'Pause'; };
    controls.querySelector('#credits-skip').onclick = finish;
    const anim = (now) => {
      if (done) return;
      if (!paused) elapsed += now - last;
      last = now;
      const k = elapsed / dur;
      roll.style.top = (window.innerHeight - k * (window.innerHeight + roll.offsetHeight + 200)) + 'px';
      if (k < 1) requestAnimationFrame(anim);
      else finish();
    };
    requestAnimationFrame(anim);
  }
}
