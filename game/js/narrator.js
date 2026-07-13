// narrator.js — the product (§5). A priority-interrupt queue with clause-boundary
// swaps. Categories: STORY (never skipped), REACT (skippable barks), HINT
// (suppressed while STORY plays / player progressing — enforced by hints.js),
// IDLE. Subtitle-first; VO is fire-and-forget and 404-tolerant (audio.js).
import { CONFIG } from './config.js';

export const PRIO = { STORY: 100, VOICE: 90, REACT: 50, HINT: 30, IDLE: 10 };

export class Narrator {
  constructor({ ui, audio, script }) {
    this.ui = ui; this.audio = audio;
    this.script = script || {};
    this.heard = new Set();
    this.cooldowns = new Map();   // id -> time remaining
    this.queue = [];
    this.cur = null;
    this.onLine = null;           // optional hook(id)
    this.mode = 'narrator';       // 'narrator' | 'spatial' (S11 reveal)
  }

  setHeard(arr) { this.heard = new Set(arr || []); }
  getHeard() { return [...this.heard]; }
  isSpeaking() { return !!this.cur; }
  currentPriority() { return this.cur ? this.cur.priority : -1; }

  // say(id, {priority, category, once, cooldown, interrupts, speaker, text, spatial})
  say(id, opts = {}) {
    const line = this.script[id] || {};
    const category = opts.category || line.category || 'REACT';
    const priority = opts.priority ?? PRIO[category] ?? PRIO.REACT;
    const once = opts.once ?? line.once ?? false;
    // If a line is skipped (already heard / on cooldown / empty), we must STILL
    // fire onDone — otherwise progression-critical callbacks (scene advance,
    // finale beats) would soft-lock on replay when the line is suppressed.
    if (once && this.heard.has(id)) { if (opts.onDone) setTimeout(opts.onDone, 300); return false; }
    if ((this.cooldowns.get(id) || 0) > 0) { if (opts.onDone) setTimeout(opts.onDone, 200); return false; }

    const text = opts.text ?? line.text ?? '';
    if (!text) { if (opts.onDone) setTimeout(opts.onDone, 100); return false; }
    const speaker = opts.speaker || line.speaker || (category === 'VOICE' ? 'voice' : 'narrator');
    const clauses = text.split('|').map(s => s.trim()).filter(Boolean);
    const item = {
      id, text, clauses, category, priority, once,
      cooldown: opts.cooldown ?? line.cooldown ?? CONFIG.NARR.REACT_COOLDOWN,
      speaker, spatial: opts.spatial || line.spatial || this.mode === 'spatial',
      interrupts: opts.interrupts ?? (priority >= PRIO.REACT),
      onDone: opts.onDone,
    };

    // interrupt policy: only interrupt lower-priority, non-STORY current lines,
    // and only at the next clause boundary (handled in update()).
    if (this.cur && item.priority > this.cur.priority && this.cur.category !== 'STORY' && item.interrupts) {
      this.cur.interruptPending = item;
      return true;
    }
    // STORY lines jump the queue ahead of REACT/HINT/IDLE
    if (item.category === 'STORY') this.queue.unshift(item);
    else this.queue.push(item);
    this.queue.sort((a, b) => b.priority - a.priority);
    return true;
  }

  // convenience: an ad-hoc line not in the script
  line(text, opts = {}) {
    const id = opts.id || ('_ad_' + Math.random().toString(36).slice(2, 8));
    this.script[id] = { text, category: opts.category || 'REACT' };
    return this.say(id, opts);
  }

  clearBarks() { this.queue = this.queue.filter(q => q.category === 'STORY'); }

  update(dt) {
    for (const [k, v] of this.cooldowns) { const n = v - dt; if (n <= 0) this.cooldowns.delete(k); else this.cooldowns.set(k, n); }

    if (!this.cur) { this._next(); return; }
    const c = this.cur;
    c.t -= dt;
    if (c.t <= 0) {
      c.idx++;
      // clause boundary — honor a pending interrupt here
      if (c.interruptPending) {
        const nxt = c.interruptPending;
        // STORY that got interrupted replays from start (§5)
        if (c.category === 'STORY') { c.idx = 0; this.queue.push(c); }
        this._finishCur(false);
        this.queue.unshift(nxt);
        this.queue.sort((a, b) => b.priority - a.priority);
        this._next();
        return;
      }
      if (c.idx >= c.clauses.length) { this._finishCur(true); this._next(); return; }
      this._speakClause();
    }
  }

  _next() {
    if (this.cur || !this.queue.length) return;
    this.cur = this.queue.shift();
    this.cur.idx = 0;
    this._speakClause(true);
  }

  _speakClause(first = false) {
    const c = this.cur;
    const clause = c.clauses[c.idx];
    const dwell = Math.max(CONFIG.NARR.MIN_DWELL, clause.length / CONFIG.NARR.CHARS_PER_SEC);
    c.t = dwell;
    // subtitle shows the FULL line (2-line cap handled by UI); update highlight elsewhere
    const cls = c.spatial ? 'spatial' : c.speaker;
    this.ui.showSub(c.text.replace(/\s*\|\s*/g, '   '), cls, c.speaker);
    if (first) {
      this.audio?.playVO(c.id, { spatial: c.spatial });
      if (c.once) this.heard.add(c.id);
      this.cooldowns.set(c.id, c.cooldown || 0);
      this.onLine && this.onLine(c.id);
    }
  }

  _finishCur(natural) {
    const c = this.cur;
    this.cur = null;
    if (natural) { this.ui.hideSubSoon(); if (c.onDone) c.onDone(); }
    else this.audio?.stopVO(c.id);
  }

  // hard reset between scenes (keeps heard set)
  reset() { this.queue.length = 0; if (this.cur) this.audio?.stopVO(this.cur.id); this.cur = null; this.ui.hideSub(); }
}
