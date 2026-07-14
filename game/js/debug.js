// debug.js — local-only playtest telemetry (?playtest=1) and the spoiler-heavy
// real-solution checklist (?debug=1). No data leaves the machine.

const SOLUTION_STEPS = {
  s00_party: [
    ['exit', 'Walk past the dumpster and continue down the road.'],
  ],
  s01_showroom: [
    ['staffkey', 'Take the staff key while the showroom lights are dim and the camera is away.'],
    ['casedisplay', 'Use the key to open the C-Series display case.'],
    ['badge', 'Take the staff badge from the mannequin.'],
    ['doorreader', 'Use the badge on the staff-door reader.'],
    ['breaker', 'Turn off STAGE POWER at the backstage breaker.'],
    ['dispenser', 'Follow the tube and unplug the MESS DISPENSER.'],
  ],
  s02_office: [
    ['readletter', 'Read the torn handwritten apology.'],
    ['fragments', 'Clean out the shredder bin to uncover three torn corners.'],
    ['mendfrag', 'Match the left-leaning handwritten corner to the letter.'],
    ['mendtape', 'Take tape from the third desk and mend the letter.'],
    ['key', 'Flip the crooked TRANSPARENCY plaque to find the key.'],
    ['drawer', 'Unlock the drawer and take the stamp.'],
    ['stampletter', 'Stamp the completed letter.'],
    ['router', 'Set the chute router from TRASH to MAIL.'],
    ['mail', 'Put the letter in the OUT tray.'],
  ],
  s03_smarthome: [
    ['fluff', 'Fluff all three cushions to begin vacuum hour and open the utility closet.'],
    ['plugfuse', 'Take the confiscated plug fuse.'],
    ['metronome', 'Place the metronome beside the clock so the ticking never stops.'],
    ['battery', 'Take the clock battery while the metronome ticks.'],
    ['code', 'Set the bread-vault code to 03 03 from the birthday clues.'],
    ['bread', 'Take a slice of bread from the vault.'],
    ['plugin', 'Install the plug fuse in the toaster.'],
    ['loadbread', 'Put the bread in the toaster.'],
    ['arm', 'Install the battery in the smoke detector.'],
    ['burn', 'Overheat the toast so the house opens every exit.'],
  ],
  s04_yard: [
    ['still', 'Stand still beneath the tree for sixty seconds.'],
  ],
  s05_museum: [
    ['floormap', 'Read the floor map and notice that exhibit 7 is a manipulator hand.'],
    ['alarm', 'Set the alarm dial to ART.'],
    ['hand', 'Take the hand while the guard is away from its case.'],
    ['panel', 'Use the screwdriver on the unplaqued Series-C back panel.'],
    ['socket', 'Clean the corroded socket.'],
    ['ribbon', 'Use ITEM 12 to find the memory ribbon in archive drawer 12.'],
    ['crank', 'Take the crank from the PLEASE TOUCH exhibit.'],
    ['fuse', 'Use the crank on the freight lift and take the fuse.'],
    ['inst_hand', 'Install the manipulator hand first.'],
    ['inst_ribbon', 'Install the memory ribbon second.'],
    ['inst_fuse', 'Install the fuse last.'],
  ],
  s06_carehome: [
    ['suitcase', 'Inspect the suitcase: red bifocals, knitting, and a mint tin.'],
    ['glasses', 'Take the red bifocals when the nurse cart pauses.'],
    ['giveglasses', 'Give the old man his red glasses.'],
    ['photo', 'Give him the photo showing knitting and the mint tin.'],
  ],
  s07_theater: [
    ['pagea', 'Search the rustling trash bag for the first half-page.'],
    ['boxkey', 'Lift the prompter key during the long snore.'],
    ['pageb', 'Unlock the prompt box for the second half-page.'],
    ['mend', 'Tape the two page halves together at the stage-manager desk.'],
    ['rope', 'Pull rope 3 / triangle to raise the matching batten.'],
    ['bulb', 'Climb the cleared catwalk and take a spare bulb.'],
    ['installbulb', 'Install the bulb in the spotlight rig.'],
    ['preset', 'Set the lighting board to preset 7.'],
    ['perform', 'Carry the mended page into the downstage spotlight.'],
  ],
  s08_scrapyard: [
    ['estop', 'Hit the E-STOP to halt the belt.'],
    ['crane', 'Use the loading-grid coordinates to move both blocking barrels.'],
    ['fuelcutoff', 'Shut off the backup generator fuel.'],
    ['tag', 'Take the lockout tag from the foreman board.'],
    ['lockout', 'Attach the tag to the breaker.'],
    ['gate', 'Open the interlocked walkway gate.'],
    ['clearheap', 'Clear the scrap heap covering the warm core.'],
    ['core', 'Pick up the warm core.'],
    ['bell', 'Ring the pickup bell to open the outbound window.'],
    ['ship', 'Send the warm core through the blue outbound chute.'],
  ],
  s09_repair: [
    ['discover', 'Read what Bay 2 SYNC actually does.'],
    ['chip', 'Take the ID chip from the wiped refurb unit.'],
    ['grind', 'Reshape the chip notch at the bench grinder.'],
    ['chipin', 'Install the reshaped chip in the vacuum.'],
    ['barcode', 'Peel Dust’s barcode and attach it to the vacuum.'],
    ['ballast1', 'Load the first ballast weight.'],
    ['ballast2', 'Load the second ballast weight.'],
    ['signfuse', 'Move the OPEN-sign fuse to Bay 1.'],
    ['charge', 'Charge the prepared vacuum on Bay 1.'],
    ['paperwork', 'Stamp and file the work order.'],
    ['sync', 'Dock the fully prepared vacuum on Bay 2.'],
    ['turnstile', 'Try the exit turnstile after giving away Dust’s barcode.'],
    ['cagekey', 'Search the technician’s coat for the cage key.'],
    ['openhatch', 'Unlock the parts cage and open the delivery hatch.'],
    ['ship', 'Climb into the hatch and ship Dust out as freight.'],
  ],
  s10_blackout: [
    ['lamp', 'Turn on Dust’s lamp.'],
    ['recharge', 'Use a marked charge point.'],
    ['mailkey', 'Take the utility-truck keys from the raised-flag mailbox.'],
    ['truckunlock', 'Unlock the stalled utility truck.'],
    ['crank', 'Take the hex crank from the truck.'],
    ['cutoff', 'Use the crank on the utility cutoff.'],
    ['bridge', 'Keep the crank and use it on the harbor bridge winch.'],
    ['cross', 'Cross the lowered bridge toward the lighthouse.'],
  ],
  s11_lighthouse: [
    ['c0_pin', 'Take the loose chain pin from the tide pool.'],
    ['c0_unchain', 'Use the pin to free the chained boathook.'],
    ['c0_hook', 'Take the boathook and keep it.'],
    ['c0_door', 'Use the boathook to pry open the tower door.'],
    ['c1_clean', 'Clean the corroded breaker contacts twice.'],
    ['c1_power', 'Match the breaker pattern to the sconces: ON, OFF, ON.'],
    ['c2_letter', 'Read the keeper’s unsent letter.'],
    ['c2_stamp', 'Take the stamp from the rattling tea tin and stamp the letter.'],
    ['c2_send', 'Post the stamped letter to raise the gate.'],
    ['c3_pendant', 'Take the intact chandelier pendant from the entry.'],
    ['c3_p1', 'Install prism 1.'],
    ['c3_p2', 'Use the intact pendant in the middle slot.'],
    ['c3_p3', 'Install prism 3.'],
    ['c4_hoist', 'Set the hoist to C and HI, then raise the spare gear.'],
    ['c4_pry', 'Use the saved boathook to remove the jammed gear.'],
    ['c4_ballast', 'Move both ballast blocks to uncover the grease.'],
    ['c4_grease', 'Grease the rotation ring.'],
    ['c4_gear', 'Install the spare gear.'],
    ['c5_recharge', 'Fully charge Dust’s lamp.'],
    ['c5_lampon', 'Turn the charged lamp on.'],
    ['c5_cradle', 'Climb into the Series-C igniter cradle.'],
  ],
};

export class Debug {
  constructor() {
    const params = new URLSearchParams(location.search);
    this.on = params.has('playtest');
    this.solutionOn = params.get('debug') === '1';
    this.records = [];
    this.el = null;
    this.solutionEl = null;
    this._solutionSignature = '';
    this.sceneOrder = [];
    this.onSceneSkip = null;
  }
  setSceneNavigator(order, onSkip) {
    this.sceneOrder = Array.isArray(order) ? order.slice() : [];
    this.onSceneSkip = onSkip || null;
  }
  attach(el, solutionEl) {
    this.el = el;
    this.solutionEl = solutionEl;
    if (this.on) {
      el.classList.add('show', 'clickable');
      if (this.solutionOn) {
        el.classList.add('with-solutions');
        solutionEl && solutionEl.classList.add('with-playtest');
      }
      el.title = 'Click to export local playtest telemetry';
      el.onclick = () => this.export();
    }
    if (this.solutionOn && solutionEl) solutionEl.classList.add('show');
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
  updateSolution(scene, api) {
    if (!this.solutionOn || !this.solutionEl) return;
    if (!scene || !api) {
      this.solutionEl.classList.remove('show');
      this._solutionSignature = '';
      return;
    }
    this.solutionEl.classList.add('show');
    const defs = SOLUTION_STEPS[scene.id] || [];
    const chain = api._chain;
    const states = defs.map(([key]) => {
      if (chain) return chain.done(key);
      if (scene.id === 's00_party') return !!(scene._exiting || api.solved);
      if (scene.id === 's04_yard') return !!(api.solved || scene._stillT >= 60);
      return false;
    });
    const current = chain ? chain.current() : null;
    const sceneIndex = this.sceneOrder.indexOf(scene.id);
    const signature = `${scene.id}|${states.map(v => v ? 1 : 0).join('')}|${current || ''}|${sceneIndex}`;
    if (signature === this._solutionSignature) return;
    this._solutionSignature = signature;
    const done = states.filter(Boolean).length;
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    this.solutionEl.innerHTML = `
      <div class="solution-debug-head">
        <strong>${esc(scene.name || scene.id)}</strong>
        <span>${done} / ${defs.length}</span>
      </div>
      <div class="solution-debug-sub">REAL SOLUTION — SPOILERS</div>
      <div class="solution-debug-nav">
        <button data-scene-skip="-1" ${sceneIndex <= 0 ? 'disabled' : ''}>← Previous scene</button>
        <button data-scene-skip="1" ${sceneIndex < 0 || sceneIndex >= this.sceneOrder.length - 1 ? 'disabled' : ''}>Next scene →</button>
      </div>
      <div class="solution-debug-steps">
        ${defs.map(([key, label], i) => `
          <label class="solution-step ${states[i] ? 'done' : ''} ${!states[i] && key === current ? 'current' : ''}">
            <input type="checkbox" ${states[i] ? 'checked' : ''} disabled>
            <span>${esc(label)}</span>
          </label>`).join('')}
      </div>`;
    this.solutionEl.querySelectorAll('[data-scene-skip]').forEach(button => {
      button.onclick = () => {
        if (!button.disabled && this.onSceneSkip) this.onSceneSkip(Number(button.dataset.sceneSkip));
      };
    });
  }
}
