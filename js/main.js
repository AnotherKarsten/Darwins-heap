// Darwin's Heap – Steuerung der Benutzeroberfläche

import { assemble } from './engine/assembler.js';
import { Arena } from './engine/arena.js';
import { OP_NAMES, OP_INFO, disassemble } from './engine/isa.js';
import { randomSeed } from './engine/rng.js';
import { BOTS, BOT_BY_ID, LEVEL_LABELS, STARTER_CODE } from './engine/warriors.js';
import { ArenaRenderer, PLAYER_COLORS } from './ui/renderer.js';
import { drawLines } from './ui/charts.js';
import { CodeEditor } from './ui/editor.js';
import { LESSONS } from './ui/lessons.js';
import { manualHtml } from './ui/manual.js';
import * as store from './ui/storage.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => Math.round(n).toLocaleString('de-DE');

const SPEEDS = [0.5, 1, 2, 4, 8, 15, 30, 60, 120, 250, 500, 1000, 2500, 5000, 10000, 30000, Infinity];
const MAX_SLOTS = 4;
const DEFAULT_SETTINGS = { coreSize: 4000, maxCycles: 0, maxProcesses: 1000, seedMode: 'random', seed: 4711, grid: true, heads: true };

let uidCounter = 1;
const newSlot = (props) => ({ uid: uidCounter++, kind: 'custom', botId: 'zwerg', name: 'Mein Programm', code: STARTER_CODE, ...props });

class App {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS, ...store.load('settings', {}) };
    this.slots = this.restoreSlots();
    this.progress = store.load('progress', {});
    this.speedIndex = store.load('speed', 7);
    this.arena = null;
    this.running = false;
    this.dirty = true;
    this.lesson = null;
    this.lastFrame = 0;
    this.acc = 0;
    this.lastUi = 0;
    this.lastCharts = 0;
    this.measured = 0;
    this.asmCache = new Map();
    this.follow = -1;

    this.renderer = new ArenaRenderer($('#arena-canvas'));
    this.renderer.showGrid = this.settings.grid;
    this.renderer.showHeads = this.settings.heads;

    this.bindControls();
    this.bindCanvas();
    this.bindDialogs();
    this.bindKeyboard();
    this.setupEditor();
    this.renderSlots();
    this.setSpeed(this.speedIndex);
    $('#manual-body').innerHTML = manualHtml();

    new ResizeObserver(() => { this.renderer.resize(); this.renderer.render(); }).observe($('#canvas-wrap'));
    this.rebuild();
    requestAnimationFrame((t) => this.frame(t));

    const shared = store.readShared();
    if (shared) this.importShared(shared);
    else if (!store.load('welcomed', false)) $('#welcome-dialog').showModal();
  }

  // ---------------------------------------------------------------- Slots
  restoreSlots() {
    const saved = store.load('slots', null);
    if (Array.isArray(saved) && saved.length) {
      return saved.slice(0, MAX_SLOTS).map((s) => newSlot({ kind: s.kind, botId: BOT_BY_ID[s.botId] ? s.botId : 'zwerg', name: s.name, code: s.code ?? STARTER_CODE }));
    }
    return [newSlot({}), newSlot({ kind: 'bot', botId: 'zwerg' })];
  }

  saveSlots() {
    store.save('slots', this.slots.map(({ kind, botId, name, code }) => ({ kind, botId, name, code })));
  }

  slotCode(slot) { return slot.kind === 'bot' ? BOT_BY_ID[slot.botId].code : slot.code; }

  slotAsm(slot) {
    const code = this.slotCode(slot);
    const key = `${this.settings.coreSize}|${this.settings.maxProcesses}|${code}`;
    let r = this.asmCache.get(key);
    if (!r) {
      r = assemble(code, { coreSize: this.settings.coreSize, maxProcesses: this.settings.maxProcesses });
      if (this.asmCache.size > 200) this.asmCache.clear();
      this.asmCache.set(key, r);
    }
    return r;
  }

  slotName(slot) {
    if (slot.kind === 'bot') return BOT_BY_ID[slot.botId].name;
    return slot.name || this.slotAsm(slot).name || 'Programm';
  }

  renderSlots() {
    const host = $('#slots');
    host.innerHTML = '';
    this.slots.forEach((slot, i) => {
      const asm = this.slotAsm(slot);
      const bot = slot.kind === 'bot' ? BOT_BY_ID[slot.botId] : null;
      const el = document.createElement('div');
      el.className = 'slot' + (asm.ok ? '' : ' error');
      el.style.setProperty('--c', PLAYER_COLORS[i]);
      const options = [`<option value="custom" ${slot.kind === 'custom' ? 'selected' : ''}>✍️ Eigener Code</option>`]
        .concat(BOTS.map((b) => `<option value="bot:${b.id}" ${bot && bot.id === b.id ? 'selected' : ''}>🤖 ${esc(b.name)} (${LEVEL_LABELS[b.level]})</option>`))
        .join('');
      el.innerHTML = `
        <div class="slot-top">
          <span class="color-dot" style="--c:${PLAYER_COLORS[i]}"></span>
          <span class="slot-name" title="${esc(this.slotName(slot))}">${esc(this.slotName(slot))}</span>
          <button class="btn small ghost" data-act="edit" title="Code ansehen und bearbeiten">✎</button>
          <button class="btn small ghost" data-act="remove" title="Entfernen" ${this.slots.length <= 1 ? 'disabled' : ''}>✕</button>
        </div>
        <select data-act="kind" aria-label="Programm wählen">${options}</select>
        <div class="slot-meta">
          ${asm.ok ? `<span class="badge">${asm.length} Befehl${asm.length === 1 ? '' : 'e'}</span>` : `<span class="badge err">${asm.errors.length} Fehler</span>`}
          ${bot ? `<span class="badge lvl${bot.level}">${LEVEL_LABELS[bot.level]}</span>` : ''}
          ${this.lesson && i === 0 ? '<span class="badge">Lektion</span>' : ''}
        </div>
        <div class="strategy">${esc(bot ? bot.blurb : (asm.strategy || 'Klick auf ✎, um den Code zu schreiben.'))}</div>`;
      el.querySelector('[data-act=edit]').onclick = () => this.openEditor(i);
      el.querySelector('[data-act=remove]').onclick = () => this.removeSlot(i);
      el.querySelector('[data-act=kind]').onchange = (e) => {
        const v = e.target.value;
        if (v === 'custom') { slot.kind = 'custom'; }
        else { slot.kind = 'bot'; slot.botId = v.slice(4); }
        this.slotsChanged();
      };
      host.appendChild(el);
    });
    $('#add-slot').hidden = this.slots.length >= MAX_SLOTS;
    $('#slot-count').textContent = `${this.slots.length} / ${MAX_SLOTS}`;
  }

  addSlot() {
    if (this.slots.length >= MAX_SLOTS) return;
    const used = new Set(this.slots.filter((s) => s.kind === 'bot').map((s) => s.botId));
    const bot = ['wuerfler', 'spaeher', 'mitose', 'zwerg', 'wichtel'].find((b) => !used.has(b)) || 'zwerg';
    this.slots.push(newSlot({ kind: 'bot', botId: bot }));
    this.slotsChanged();
  }

  removeSlot(i) {
    if (this.slots.length <= 1) return;
    this.slots.splice(i, 1);
    if (i === 0) this.exitLesson(false);
    this.slotsChanged();
  }

  slotsChanged() {
    this.saveSlots();
    this.renderSlots();
    this.rebuild();
  }

  applyPreset(name) {
    this.exitLesson(false);
    const mine = this.slots.find((s) => s.kind === 'custom') || newSlot({});
    if (name === 'solo') this.slots = [mine, newSlot({ kind: 'bot', botId: 'zwerg' })];
    if (name === 'royale') this.slots = [mine, newSlot({ kind: 'bot', botId: 'zwerg' }), newSlot({ kind: 'bot', botId: 'wuerfler' }), newSlot({ kind: 'bot', botId: 'spaeher' })];
    if (name === 'bots') this.slots = ['zwerg', 'wuerfler', 'spaeher', 'mitose'].map((b) => newSlot({ kind: 'bot', botId: b }));
    this.slotsChanged();
    this.toast(name === 'bots' ? 'Vier Bots bereit – drücke ▶' : 'Aufstellung geladen – drücke ▶');
  }

  // ---------------------------------------------------------------- Partie
  rebuild({ newSeed = true } = {}) {
    this.pause();
    const errors = [];
    const warriors = this.slots.map((slot, i) => {
      const asm = this.slotAsm(slot);
      if (!asm.ok) errors.push(`${this.slotName(slot)}: Zeile ${asm.errors[0].line} – ${asm.errors[0].msg}`);
      return { name: this.slotName(slot), color: PLAYER_COLORS[i], program: asm, meta: { author: asm.author, strategy: asm.strategy } };
    });
    if (errors.length) {
      this.arena = null;
      this.renderer.arena = null;
      this.renderer.render();
      this.setOverlay('Programm mit Fehlern', errors[0], false);
      this.renderPlayerCards();
      return false;
    }
    let seed = this.settings.seed;
    if (this.settings.seedMode === 'random') seed = newSeed || !this.currentSeed ? randomSeed() : this.currentSeed;
    this.currentSeed = seed;
    const lessonSettings = this.lesson ? (LESSONS.find((l) => l.id === this.lesson).settings || {}) : {};
    try {
      this.arena = new Arena({
        coreSize: this.settings.coreSize,
        maxCycles: lessonSettings.maxCycles ?? this.settings.maxCycles,
        maxProcesses: this.settings.maxProcesses,
        seed,
      });
      this.arena.load(warriors);
    } catch (e) {
      this.arena = null;
      this.setOverlay('Das passt nicht', e.message, false);
      return false;
    }
    this.arena.on((ev) => this.onArenaEvent(ev));
    this.renderer.setArena(this.arena);
    this.dirty = false;
    this.resultShown = false;
    $('#event-log').innerHTML = '';
    this.logEvent(0, `Partie geladen · ${warriors.length} Programm${warriors.length === 1 ? '' : 'e'} · Seed ${seed}`);
    $('#cycle-max').textContent = fmt(this.arena.maxCycles);
    $('#seed-label').textContent = `Seed ${seed}`;
    $('#lens-addr').max = this.arena.size - 1;
    const follow = $('#lens-follow');
    follow.innerHTML = '<option value="-1">–</option>' + this.arena.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    this.follow = -1;
    this.renderer.selected = -1;
    this.setOverlay('Bereit zum Kampf', warriors.length === 1 ? 'Solo-Lauf: beobachte dein Programm' : `${warriors.map((w) => w.name).join(' · ')}`, true);
    this.renderPlayerCards();
    this.updateUi(true);
    if (this.lesson) this.updateGoalBanner();
    this.renderer.render();
    return true;
  }

  setOverlay(title, sub, playable) {
    const ov = $('#stage-overlay');
    ov.classList.remove('hide');
    $('.overlay-title', ov).textContent = title;
    $('#overlay-sub').textContent = sub;
    $('#overlay-play').hidden = !playable;
  }

  hideOverlay() { $('#stage-overlay').classList.add('hide'); }

  play() {
    if (this.dirty || !this.arena) { if (!this.rebuild()) return; }
    if (this.arena.finished) { if (!this.rebuild()) return; }
    this.running = true;
    this.hideOverlay();
    $('#btn-play').textContent = '❚❚';
    this.lastFrame = performance.now();
    this.acc = 0;
  }

  pause() {
    this.running = false;
    $('#btn-play').textContent = '▶';
  }

  toggle() { if (this.running) this.pause(); else this.play(); }

  stepOnce(single) {
    if (this.dirty || !this.arena) { if (!this.rebuild()) return; }
    if (this.arena.finished) return;
    this.pause();
    this.hideOverlay();
    if (single) this.arena.tick(); else this.arena.step();
    this.updateUi(true);
    this.renderer.render();
  }

  setSpeed(i) {
    this.speedIndex = Math.max(0, Math.min(SPEEDS.length - 1, i));
    $('#speed').value = this.speedIndex;
    const s = SPEEDS[this.speedIndex];
    $('#speed-label').textContent = s === Infinity ? 'Maximum' : `${s < 1 ? s : fmt(s)} Zyklen/s`;
    store.save('speed', this.speedIndex);
  }

  frame(t) {
    const dt = Math.min(0.1, (t - this.lastFrame) / 1000);
    this.lastFrame = t;
    const a = this.arena;
    if (this.running && a && !a.finished) {
      const speed = SPEEDS[this.speedIndex];
      const budget = 12; // ms Rechenzeit pro Bild
      const start = performance.now();
      const c0 = a.cycle;
      if (speed === Infinity) {
        while (!a.finished && performance.now() - start < budget) a.run(200);
      } else {
        this.acc += speed * dt;
        const todo = Math.floor(this.acc);
        this.acc -= todo;
        let done = 0;
        while (done < todo && !a.finished) {
          const chunk = Math.min(200, todo - done);
          a.run(chunk);
          done += chunk;
          if (performance.now() - start > budget) { this.acc = 0; break; }
        }
      }
      const rate = (a.cycle - c0) / Math.max(dt, 1e-3);
      this.measured = this.measured * 0.9 + rate * 0.1;
      // Frische Schreibvorgänge sollen ~0,6 s nachleuchten
      this.renderer.decay = Math.max(3, Math.min(20000, (speed === Infinity ? this.measured : speed) * 0.6));
      if (a.finished) this.onFinished();
    }
    if (a) {
      if (this.follow >= 0) {
        const p = a.players[this.follow];
        if (p && p.alive && p.queue.count) this.renderer.selected = p.queue.pc[p.queue.head];
      }
      this.renderer.render(t);
      if (t - this.lastUi > 120) { this.updateUi(t - this.lastCharts > 400); this.lastUi = t; }
    }
    requestAnimationFrame((tt) => this.frame(tt));
  }

  onArenaEvent(ev) {
    const a = this.arena;
    if (ev.type === 'eliminated') {
      const p = a.players[ev.player];
      const by = ev.by >= 0 && ev.by !== ev.player ? ` – getroffen von ${a.players[ev.by].name}` : ev.by === ev.player ? ' – Eigentor' : '';
      this.logEvent(ev.cycle, `<b style="color:${p.color}">${esc(p.name)}</b> ist ausgeschieden${esc(by)}`);
    } else if (ev.type === 'proclimit') {
      const p = a.players[ev.player];
      this.logEvent(ev.cycle, `<b style="color:${p.color}">${esc(p.name)}</b> erreicht das Prozesslimit (${fmt(a.maxProcesses)})`);
    } else if (ev.type === 'finish') {
      const text = ev.winner != null ? `🏆 <b style="color:${a.players[ev.winner].color}">${esc(a.players[ev.winner].name)}</b> gewinnt!`
        : ev.reason === 'timeout' ? '⏱ Zyklenlimit erreicht – Unentschieden' : 'Partie beendet';
      this.logEvent(ev.cycle, text);
    }
  }

  logEvent(cycle, html) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="cyc">${fmt(cycle)}</span><span>${html}</span>`;
    const log = $('#event-log');
    log.prepend(li);
    while (log.children.length > 60) log.lastChild.remove();
  }

  onFinished() {
    this.pause();
    this.updateUi(true);
    if (this.resultShown) return;
    this.resultShown = true;
    const lessonOutcome = this.lesson ? this.evaluateLesson() : null;
    setTimeout(() => this.showResult(lessonOutcome), 350);
  }

  // ---------------------------------------------------------------- Anzeige
  renderPlayerCards() {
    const host = $('#player-cards');
    if (!this.arena) { host.innerHTML = '<p class="muted small">Behebe die Fehler im Programm, um zu starten.</p>'; return; }
    host.innerHTML = this.arena.players.map((p) => `
      <div class="pcard" data-p="${p.id}" style="--c:${p.color}">
        <div class="pname"><span class="color-dot"></span>${esc(p.name)}</div>
        <div class="pstats">
          <div>Prozesse<b data-k="procs">1</b></div>
          <div>Speicher<b data-k="cells">0%</b></div>
          <div>Treffer<b data-k="kills">0</b></div>
        </div>
        <div class="bar"><div data-k="bar"></div></div>
      </div>`).join('');
  }

  updateUi(charts) {
    const a = this.arena;
    if (!a) return;
    $('#cycle-now').textContent = fmt(a.cycle);
    $('#cycle-bar').style.width = `${(a.cycle / a.maxCycles) * 100}%`;
    for (const p of a.players) {
      const card = $(`.pcard[data-p="${p.id}"]`);
      if (!card) continue;
      card.classList.toggle('dead', !p.alive);
      card.classList.toggle('winner', a.finished && a.result.winner === p.id);
      $('[data-k=procs]', card).textContent = p.alive ? fmt(p.queue.count) : `† ${fmt(p.deathCycle)}`;
      $('[data-k=cells]', card).textContent = `${((p.cells / a.size) * 100).toFixed(1)}%`;
      $('[data-k=kills]', card).textContent = fmt(p.kills.reduce((s, v) => s + v, 0));
      $('[data-k=bar]', card).style.width = `${Math.min(100, (p.cells / a.size) * 100 * 2)}%`;
    }
    if (charts) {
      this.lastCharts = performance.now();
      const colors = a.players.map((p) => p.color);
      drawLines($('#chart-procs'), a.history, 'procs', colors);
      drawLines($('#chart-cells'), a.history, 'cells', colors, { percentOf: a.size });
      if (!$('[data-body=analysis]').hidden) this.renderAnalysis();
    }
    if (!$('[data-body=lens]').hidden) this.renderLens();
  }

  renderLens() {
    const a = this.arena;
    if (!a) return;
    let center = this.renderer.selected;
    if (center < 0) center = a.players[0] && a.players[0].queue.count ? a.players[0].queue.pc[a.players[0].queue.head] : 0;
    const input = $('#lens-addr');
    if (document.activeElement !== input) input.value = center;
    const heads = new Map();
    for (const p of a.players) if (p.alive) p.queue.forEach((pc) => heads.set(pc, (heads.get(pc) || 0) + 1), 2000);
    const rows = [];
    for (let d = -10; d <= 12; d++) {
      const addr = (center + d + a.size) % a.size;
      const c = a.cell(addr);
      const owner = c.owner >= 0 ? a.players[c.owner] : null;
      const name = OP_NAMES[c.op];
      const ins = disassemble(c.op, c.am, c.av, c.bm, c.bv, a.size);
      const fresh = a.cycle - c.lastWrite < 3 && a.cycle > 0;
      const h = heads.get(addr);
      rows.push(`<li data-addr="${addr}" class="${d === 0 ? 'sel' : ''}${fresh ? ' fresh' : ''}">
        <span class="own" style="background:${owner ? owner.color : '#1a2130'}"></span>
        <span class="adr">${addr}</span>
        <span class="pc">${h ? (h > 1 ? h : '▶') : ''}</span>
        <span><span class="op-${OP_INFO[name].group}">${name}</span>${esc(ins.slice(name.length))}</span></li>`);
    }
    $('#lens-list').innerHTML = rows.join('');
    const c = a.cell(center);
    const owner = c.owner >= 0 ? a.players[c.owner].name : 'niemand';
    $('#lens-info').innerHTML = `Zelle <b>${center}</b> · gehört <b>${esc(owner)}</b> · ${c.writes}× beschrieben · ${c.execs}× ausgeführt`;
  }

  renderAnalysis() {
    const a = this.arena;
    if (!a) return;
    const blocks = a.players.map((p) => {
      const max = Math.max(1, ...p.opCounts);
      const hist = OP_NAMES.map((name, i) => p.opCounts[i] ? `<span>${name}</span><div class="hbar" style="width:${(p.opCounts[i] / max) * 100}%"></div><span class="muted">${fmt(p.opCounts[i])}</span>` : '').join('');
      return `<div class="analysis-block" style="--c:${p.color}">
        <div class="pname" style="display:flex;gap:7px;align-items:center;font-weight:600;margin-bottom:6px"><span class="color-dot" style="--c:${p.color}"></span>${esc(p.name)}</div>
        <div class="kv">
          <span>Ausgeführte Befehle</span><b>${fmt(p.executed)}</b>
          <span>Höchstzahl Prozesse</span><b>${fmt(p.maxProcs)}</b>
          <span>Geteilt (SPL)</span><b>${fmt(p.spawns)}</b>
          <span>Gestorbene Prozesse</span><b>${fmt(p.deaths)}</b>
          <span>Eigentore</span><b>${fmt(p.selfKills)}</b>
          <span>Verschlafene Züge</span><b>${fmt(p.waits)}</b>
          <span>Schreibzugriffe</span><b>${fmt(p.writes)}</b>
        </div>
        <div class="chart-title">Befehlsmix</div>
        <div class="hist">${hist || '<span class="muted">noch nichts</span>'}</div>
      </div>`;
    });
    const head = a.players.map((p) => `<th style="color:${p.color}" title="${esc(p.name)}">${esc(p.name.slice(0, 6))}</th>`).join('');
    const matrix = a.players.length > 1 ? `<div class="chart-title">Wer hat wen getroffen? (Zeile → Spalte)</div>
      <table class="matrix"><tr><th></th>${head}</tr>${a.players.map((p) => `<tr><td style="color:${p.color}">${esc(p.name)}</td>${a.players.map((q) => `<td>${p.id === q.id ? p.selfKills || '·' : p.kills[q.id] || '·'}</td>`).join('')}</tr>`).join('')}</table>` : '';
    $('#analysis').innerHTML = matrix + blocks.join('');
  }

  showResult(lessonOutcome) {
    const a = this.arena;
    const r = a.result;
    const ranked = [...a.players].sort((x, y) => (y.alive - x.alive) || ((y.deathCycle ?? Infinity) - (x.deathCycle ?? Infinity)) || (y.cells - x.cells));
    const winner = r.winner != null ? a.players[r.winner] : null;
    const solo = a.players.length === 1;
    let hero;
    if (solo) hero = `<div class="trophy">${a.players[0].alive ? '🧬' : '💀'}</div><h2>${a.players[0].alive ? 'Überlebt!' : 'Ausgestorben'}</h2><div class="muted">${fmt(r.cycles)} Zyklen</div>`;
    else if (winner) hero = `<div class="trophy">🏆</div><h2 style="color:${winner.color}">${esc(winner.name)} gewinnt</h2><div class="muted">nach ${fmt(r.cycles)} Zyklen · Last Process Standing</div>`;
    else hero = `<div class="trophy">🤝</div><h2>Unentschieden</h2><div class="muted">${r.reason === 'timeout' ? `Zyklenlimit von ${fmt(a.maxCycles)} erreicht` : 'Niemand hat überlebt'}</div>`;
    let lessonHtml = '';
    if (lessonOutcome) {
      lessonHtml = lessonOutcome.success
        ? `<div class="goal-banner success" style="margin-top:12px"><span class="goal-icon">✅</span><div class="goal-text"><b>Lektion geschafft!</b><span>${esc(lessonOutcome.lesson.goal.text)}</span></div>${lessonOutcome.next ? '<button class="btn small primary" id="result-next">Nächste Lektion →</button>' : ''}</div>`
        : `<div class="goal-banner fail" style="margin-top:12px"><span class="goal-icon">🔁</span><div class="goal-text"><b>Noch nicht ganz.</b><span>Versuch es nochmal – neue Startpositionen können viel ändern. Oder passe den Code an.</span></div></div>`;
    }
    $('#result-body').innerHTML = `<div class="result-hero">${hero}</div>${lessonHtml}
      <ol class="ranking">${ranked.map((p, i) => `<li><span class="place">${i + 1}.</span><span class="color-dot" style="--c:${p.color}"></span>
      <span>${esc(p.name)}</span><span class="muted small">${p.alive ? `${fmt(p.queue.count)} Proz. · ${((p.cells / a.size) * 100).toFixed(1)}%` : `† Zyklus ${fmt(p.deathCycle)}`}</span></li>`).join('')}</ol>`;
    const next = $('#result-next');
    if (next) next.onclick = () => { $('#result-dialog').close(); this.openTutorial(lessonOutcome.next.id); };
    $('#result-dialog').showModal();
  }

  // ---------------------------------------------------------------- Canvas
  bindCanvas() {
    const canvas = $('#arena-canvas');
    const tip = $('#tooltip');
    canvas.addEventListener('mousemove', (e) => {
      const i = this.renderer.cellAt(e.clientX, e.clientY);
      this.renderer.hover = i;
      if (i < 0 || !this.arena) { tip.hidden = true; return; }
      const a = this.arena;
      const c = a.cell(i);
      const owner = c.owner >= 0 ? a.players[c.owner] : null;
      const procs = a.processesAt(i);
      const ago = c.lastWrite > -1e8 ? a.cycle - c.lastWrite : null;
      tip.innerHTML = `<div class="ins">#${i} · <span class="op-${OP_INFO[OP_NAMES[c.op]].group}">${esc(disassemble(c.op, c.am, c.av, c.bm, c.bv, a.size))}</span></div>
        <div class="muted">${owner ? `Besitz: <b style="color:${owner.color}">${esc(owner.name)}</b>` : 'leer'}${ago != null ? ` · geschrieben vor ${fmt(ago)} Zyklen` : ''}</div>
        <div class="muted">${c.writes}× beschrieben · ${c.execs}× ausgeführt${procs ? ` · <b style="color:#fff">${procs} Prozess${procs > 1 ? 'e' : ''} hier</b>` : ''}</div>`;
      tip.hidden = false;
      const wrap = $('#canvas-wrap').getBoundingClientRect();
      let x = e.clientX - wrap.left + 14, y = e.clientY - wrap.top + 14;
      if (x + 300 > wrap.width) x = e.clientX - wrap.left - 300;
      if (y + 80 > wrap.height) y = e.clientY - wrap.top - 80;
      tip.style.left = `${Math.max(4, x)}px`;
      tip.style.top = `${Math.max(4, y)}px`;
      if (!this.running) this.renderer.render();
    });
    canvas.addEventListener('mouseleave', () => { this.renderer.hover = -1; tip.hidden = true; if (!this.running) this.renderer.render(); });
    canvas.addEventListener('click', (e) => {
      const i = this.renderer.cellAt(e.clientX, e.clientY);
      if (i < 0) return;
      this.renderer.selected = i;
      this.follow = -1;
      $('#lens-follow').value = '-1';
      this.showTab('lens');
      this.renderLens();
      if (!this.running) this.renderer.render();
    });
  }

  showTab(name) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-body').forEach((b) => { b.hidden = b.dataset.body !== name; });
    if (name === 'analysis') this.renderAnalysis();
    if (name === 'lens') this.renderLens();
    if (name === 'live') this.updateUi(true);
  }

  // ---------------------------------------------------------------- Steuerung
  bindControls() {
    $('#btn-play').onclick = () => this.toggle();
    $('#overlay-play').onclick = () => this.play();
    $('#btn-step').onclick = (e) => this.stepOnce(e.shiftKey);
    $('#btn-reset').onclick = () => this.rebuild();
    $('#speed').oninput = (e) => this.setSpeed(+e.target.value);
    $('#add-slot').onclick = () => this.addSlot();
    $$('[data-preset]').forEach((b) => { b.onclick = () => this.applyPreset(b.dataset.preset); });
    $$('.seg-btn').forEach((b) => { b.onclick = () => this.setView(b.dataset.view); });
    $$('.tab').forEach((t) => { t.onclick = () => this.showTab(t.dataset.tab); });
    $('#lens-addr').onchange = (e) => {
      if (!this.arena) return;
      this.renderer.selected = ((+e.target.value % this.arena.size) + this.arena.size) % this.arena.size;
      this.follow = -1; $('#lens-follow').value = '-1';
      this.renderLens(); this.renderer.render();
    };
    $('#lens-follow').onchange = (e) => { this.follow = +e.target.value; };
    $('#lens-list').onclick = (e) => {
      const li = e.target.closest('li[data-addr]');
      if (!li) return;
      this.renderer.selected = +li.dataset.addr;
      this.follow = -1; $('#lens-follow').value = '-1';
      this.renderLens(); this.renderer.render();
    };
    $('#btn-tutorial').onclick = () => this.openTutorial();
    $('#btn-manual').onclick = () => $('#manual-dialog').showModal();
    $('#btn-tournament').onclick = () => this.openTournament();
    $('#btn-settings').onclick = () => this.openSettings();
    $('#btn-share').onclick = () => this.share();
    $('#goal-close').onclick = () => this.exitLesson(true);
    $('#goal-lesson').onclick = () => this.openTutorial(this.lesson);
    $('#result-again').onclick = () => { $('#result-dialog').close(); this.rebuild(); this.play(); };
  }

  setView(view) {
    this.renderer.view = view;
    $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    this.renderer.render();
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('dialog[open]')) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === ' ') { e.preventDefault(); this.toggle(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.stepOnce(e.shiftKey); }
      else if (e.key === 'r' || e.key === 'R') this.rebuild();
      else if (e.key === '+' || e.key === '=') this.setSpeed(this.speedIndex + 1);
      else if (e.key === '-') this.setSpeed(this.speedIndex - 1);
      else if (e.key === '1') this.setView('owner');
      else if (e.key === '2') this.setView('writes');
      else if (e.key === '3') this.setView('execs');
      else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); this.openEditor(0); }
    });
  }

  bindDialogs() {
    $$('dialog [data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });
    $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d && d.id !== 'editor-dialog') d.close(); }));
    $$('[data-welcome]').forEach((b) => {
      b.onclick = () => {
        store.save('welcomed', true);
        $('#welcome-dialog').close();
        const w = b.dataset.welcome;
        if (w === 'tutorial') this.openTutorial('l1');
        if (w === 'demo') { this.applyPreset('bots'); this.setSpeed(10); this.play(); this.toast('Viel Spaß! Fahr mit der Maus über die Zellen oder klick sie an.'); }
        if (w === 'solo') { this.applyPreset('solo'); this.openEditor(0); }
      };
    });
    $('#welcome-dialog').addEventListener('close', () => store.save('welcomed', true));
  }

  // ---------------------------------------------------------------- Editor
  setupEditor() {
    this.editor = new CodeEditor($('#code-editor'), { onChange: () => this.checkEditor() });
    const tpl = $('#editor-template');
    tpl.innerHTML = '<option value="">Vorlage laden …</option>' + BOTS.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('') + '<option value="__starter">Startvorlage</option>';
    tpl.onchange = () => {
      const v = tpl.value;
      tpl.value = '';
      if (!v) return;
      const code = v === '__starter' ? STARTER_CODE : BOT_BY_ID[v].code;
      if (this.editor.value.trim() && !confirm('Aktuellen Code durch die Vorlage ersetzen?')) return;
      this.editor.value = code;
      this.checkEditor();
    };
    $('#editor-ref').innerHTML = OP_NAMES.map((n) => `<button type="button" class="ref-item" data-ex="${esc(OP_INFO[n].example)}" title="${esc(OP_INFO[n].desc)}"><b class="op-${OP_INFO[n].group}">${n}</b><span>${esc(OP_INFO[n].short)}</span></button>`).join('');
    $('#editor-ref').onclick = (e) => { const b = e.target.closest('.ref-item'); if (b) this.editor.insertLine(b.dataset.ex); };
    $('#editor-errors').onclick = (e) => { const li = e.target.closest('li[data-line]'); if (li) this.editor.gotoLine(+li.dataset.line); };
    $('#editor-cancel').onclick = () => $('#editor-dialog').close();
    $('#editor-apply').onclick = () => this.applyEditor();
    $('#editor-dialog').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.applyEditor(); } });
    $('#editor-form').addEventListener('submit', (e) => e.preventDefault());
    $('#editor-open').onclick = () => $('#editor-file').click();
    $('#editor-file').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      this.editor.value = await f.text();
      this.checkEditor();
      e.target.value = '';
    };
    $('#editor-save').onclick = () => {
      const name = ($('#editor-name').value || 'programm').replace(/[^\wäöüÄÖÜß-]+/g, '_');
      store.downloadText(`${name}.heap`, this.editor.value);
    };
  }

  openEditor(i) {
    const slot = this.slots[i];
    if (!slot) return;
    this.pause();
    this.editingSlot = i;
    const fromBot = slot.kind === 'bot';
    $('#editor-dot').style.setProperty('--c', PLAYER_COLORS[i]);
    $('#editor-name').value = fromBot ? `${BOT_BY_ID[slot.botId].name} (Kopie)` : this.slotName(slot);
    this.editor.value = this.slotCode(slot);
    this.checkEditor();
    $('#editor-dialog').showModal();
    if (fromBot) this.toast('Du bearbeitest eine Kopie des Bots. Mit „Übernehmen“ wird daraus dein eigener Code.');
    setTimeout(() => this.editor.focus(), 50);
  }

  checkEditor() {
    const r = assemble(this.editor.value, { coreSize: this.settings.coreSize, maxProcesses: this.settings.maxProcesses });
    const marks = new Map();
    r.warnings.forEach((w) => marks.set(w.line, 'warn'));
    r.errors.forEach((e) => marks.set(e.line, 'err'));
    this.editor.setMarks(marks);
    const status = $('#editor-status');
    status.classList.toggle('bad', !r.ok);
    status.innerHTML = r.ok ? `✓ Übersetzt: <b>${r.length}</b> Befehl${r.length === 1 ? '' : 'e'}, Start in Zeile ${r.instructions[r.org] ? r.instructions[r.org].line : 1}` : `✗ ${r.errors.length} Fehler`;
    $('#editor-errors').innerHTML = [...r.errors.map((e) => ({ ...e, cls: 'err' })), ...r.warnings.map((w) => ({ ...w, cls: 'warn' }))]
      .map((e) => `<li class="${e.cls}" data-line="${e.line}">Zeile ${e.line}: ${esc(e.msg)}</li>`).join('');
    if (r.name && document.activeElement !== $('#editor-name')) {
      const cur = $('#editor-name').value;
      if (!cur || cur.endsWith('(Kopie)') || cur === 'Mein Programm') $('#editor-name').value = r.name;
    }
    return r;
  }

  applyEditor() {
    const slot = this.slots[this.editingSlot];
    if (!slot) return;
    slot.kind = 'custom';
    slot.code = this.editor.value;
    slot.name = $('#editor-name').value.trim() || this.checkEditor().name || 'Mein Programm';
    $('#editor-dialog').close();
    this.slotsChanged();
    const r = this.slotAsm(slot);
    this.toast(r.ok ? `„${slot.name}“ ist bereit.` : 'Gespeichert – aber der Code enthält noch Fehler.', !r.ok);
  }

  // ---------------------------------------------------------------- Lernpfad
  openTutorial(id) {
    this.pause();
    const current = id || this.lesson || LESSONS.find((l) => !this.progress[l.id])?.id || LESSONS[0].id;
    this.renderLessonList(current);
    this.renderLesson(current);
    const d = $('#tutorial-dialog');
    if (!d.open) d.showModal();
  }

  renderLessonList(current) {
    $('#lesson-list').innerHTML = LESSONS.map((l, i) => `<li class="${l.id === current ? 'active' : ''} ${this.progress[l.id] ? 'done' : ''}">
      <button data-lesson="${l.id}"><span class="num">${this.progress[l.id] ? '✓' : i + 1}</span><span>${esc(l.title)}<small>${esc(l.subtitle)}</small></span></button></li>`).join('');
    $$('#lesson-list [data-lesson]').forEach((b) => { b.onclick = () => { this.renderLessonList(b.dataset.lesson); this.renderLesson(b.dataset.lesson); }; });
  }

  renderLesson(id) {
    const l = LESSONS.find((x) => x.id === id);
    const idx = LESSONS.indexOf(l);
    const opp = l.opponents.length ? l.opponents.map((o) => `<b>${esc(BOT_BY_ID[o].name)}</b>`).join(', ') : '<i>niemanden – du bist allein</i>';
    $('#lesson-body').innerHTML = `
      <div class="muted small">Lektion ${idx + 1} von ${LESSONS.length}</div>
      <h3>${esc(l.title)}</h3>
      <div class="muted">${esc(l.subtitle)}</div>
      ${l.html}
      <div class="lesson-goal"><span class="goal-icon">🎯</span><div class="vs"><b>${esc(l.goal.text)}</b><div class="muted small">Gegner: ${opp}</div></div>
        <button class="btn primary" id="lesson-start">Lektion starten ▶</button></div>`;
    $('#lesson-start').onclick = () => this.startLesson(id);
  }

  startLesson(id) {
    const l = LESSONS.find((x) => x.id === id);
    this.lesson = id;
    const saved = store.load(`lesson-code:${id}`, null);
    this.slots = [newSlot({ kind: 'custom', name: assemble(l.code).name || 'Ich', code: saved ?? l.code }),
      ...l.opponents.map((b) => newSlot({ kind: 'bot', botId: b }))];
    $('#tutorial-dialog').close();
    this.saveSlots();
    this.renderSlots();
    if (l.speed != null) this.setSpeed(l.speed);
    this.rebuild();
    this.updateGoalBanner();
    this.toast('Tipp: Mit ✎ kannst du den Lektions-Code verändern.');
  }

  updateGoalBanner(state) {
    const b = $('#goal-banner');
    const l = this.lesson && LESSONS.find((x) => x.id === this.lesson);
    if (!l) { b.hidden = true; return; }
    b.hidden = false;
    b.classList.toggle('success', state === 'success');
    b.classList.toggle('fail', state === 'fail');
    $('#goal-title').textContent = `Lektion ${LESSONS.indexOf(l) + 1}: ${l.title}`;
    $('#goal-desc').textContent = state === 'success' ? `Geschafft! ${l.goal.text}` : state === 'fail' ? `Nicht geschafft: ${l.goal.text} Drück R für einen neuen Versuch.` : `Ziel: ${l.goal.text}`;
    this.renderer.resize();
  }

  evaluateLesson() {
    const l = LESSONS.find((x) => x.id === this.lesson);
    const r = this.arena.result;
    const success = l.goal.type === 'win' ? r.winner === 0 : r.survivors.includes(0);
    if (this.slots[0] && this.slots[0].kind === 'custom') store.save(`lesson-code:${l.id}`, this.slots[0].code);
    if (success) { this.progress[l.id] = true; store.save('progress', this.progress); }
    this.updateGoalBanner(success ? 'success' : 'fail');
    const next = LESSONS[LESSONS.indexOf(l) + 1];
    return { success, lesson: l, next };
  }

  exitLesson(rebuild) {
    if (!this.lesson) return;
    this.lesson = null;
    this.updateGoalBanner();
    this.renderSlots();
    if (rebuild) this.rebuild();
  }

  // ---------------------------------------------------------------- Turnier
  openTournament() {
    this.pause();
    $('#tour-result').innerHTML = this.slots.length < 2 ? '<p class="muted">Für ein Turnier brauchst du mindestens zwei Programme.</p>' : '';
    $('#tour-bar').style.width = '0';
    $('#tour-start').disabled = this.slots.length < 2;
    $('#tour-start').onclick = () => this.runTournament();
    $('#tournament-dialog').showModal();
    $('#tournament-dialog').addEventListener('close', () => { this.tourCancel = true; }, { once: true });
  }

  runTournament() {
    const programs = this.slots.map((s, i) => ({ name: this.slotName(s), color: PLAYER_COLORS[i], program: this.slotAsm(s) }));
    const bad = programs.find((p) => !p.program.ok);
    if (bad) { $('#tour-result').innerHTML = `<p class="muted">„${esc(bad.name)}“ enthält Fehler.</p>`; return; }
    const rounds = +$('#tour-rounds').value;
    const mode = $('#tour-mode').value;
    const matches = [];
    if (mode === 'ffa') for (let r = 0; r < rounds; r++) matches.push(programs.map((_, i) => i));
    else for (let i = 0; i < programs.length; i++) for (let j = i + 1; j < programs.length; j++) for (let r = 0; r < rounds; r++) matches.push([i, j]);
    const stats = programs.map(() => ({ w: 0, d: 0, l: 0, pts: 0, games: 0, cycles: 0 }));
    let k = 0;
    this.tourCancel = false;
    $('#tour-start').disabled = true;
    const btn = $('#tour-start');
    const step = () => {
      const t0 = performance.now();
      while (k < matches.length && performance.now() - t0 < 30) {
        const ids = matches[k];
        const arena = new Arena({ coreSize: this.settings.coreSize, maxCycles: this.settings.maxCycles, maxProcesses: this.settings.maxProcesses, seed: randomSeed() });
        arena.load(ids.map((i) => programs[i]));
        const res = arena.runToEnd();
        ids.forEach((pid, local) => {
          const st = stats[pid];
          st.games++;
          if (res.winner === local) { st.w++; st.pts += 3; }
          else if (res.winner == null && res.survivors.includes(local)) { st.d++; st.pts += 1; }
          else st.l++;
        });
        k++;
      }
      $('#tour-bar').style.width = `${(k / matches.length) * 100}%`;
      this.renderTournament(programs, stats, k, matches.length);
      if (k < matches.length && !this.tourCancel) setTimeout(step, 0);
      else btn.disabled = false;
    };
    step();
  }

  renderTournament(programs, stats, done, total) {
    const rows = programs.map((p, i) => ({ p, s: stats[i] })).sort((a, b) => b.s.pts - a.s.pts);
    $('#tour-result').innerHTML = `<p class="muted small">${done} von ${total} Partien gespielt</p>
      <table class="tour"><tr><th>Programm</th><th>Siege</th><th>Unentsch.</th><th>Niederl.</th><th>Punkte</th><th>Siegquote</th></tr>
      ${rows.map(({ p, s }) => {
        const pct = s.games ? (s.w / s.games) * 100 : 0;
        return `<tr style="--c:${p.color}"><td><span class="color-dot" style="--c:${p.color};display:inline-block;vertical-align:middle;margin-right:6px"></span>${esc(p.name)}</td>
        <td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td><b>${s.pts}</b></td><td><span class="winbar" style="width:${pct * 0.8}px"></span>${pct.toFixed(0)}%</td></tr>`;
      }).join('')}</table>`;
  }

  // ---------------------------------------------------------------- Einstellungen & Teilen
  openSettings() {
    this.pause();
    const s = this.settings;
    $('#set-core').value = s.coreSize;
    $('#set-cycles').value = s.maxCycles;
    $('#set-procs').value = s.maxProcesses;
    $('#set-seed-mode').value = s.seedMode;
    $('#set-seed').value = s.seed;
    $('#set-grid').checked = s.grid;
    $('#set-heads').checked = s.heads;
    const sync = () => { $('#set-seed-wrap').hidden = $('#set-seed-mode').value !== 'fixed'; };
    $('#set-seed-mode').onchange = sync;
    sync();
    $('#settings-apply').onclick = (e) => {
      e.preventDefault();
      Object.assign(this.settings, {
        coreSize: +$('#set-core').value,
        maxCycles: +$('#set-cycles').value,
        maxProcesses: +$('#set-procs').value,
        seedMode: $('#set-seed-mode').value,
        seed: Math.max(1, Math.min(4294967295, +$('#set-seed').value || 1)),
        grid: $('#set-grid').checked,
        heads: $('#set-heads').checked,
      });
      store.save('settings', this.settings);
      this.renderer.showGrid = this.settings.grid;
      this.renderer.showHeads = this.settings.heads;
      this.renderer.layoutKey = '';
      $('#settings-dialog').close();
      this.renderSlots();
      this.rebuild();
    };
    $('#settings-dialog').showModal();
  }

  async share() {
    const url = store.shareUrl(this.slots);
    try {
      await navigator.clipboard.writeText(url);
      this.toast('Link kopiert! Wer ihn öffnet, bekommt genau diese Programme.');
    } catch {
      prompt('Diesen Link kopieren und teilen:', url);
    }
  }

  importShared(list) {
    this.slots = list.map((s) => (s.b && BOT_BY_ID[s.b] ? newSlot({ kind: 'bot', botId: s.b }) : newSlot({ kind: 'custom', name: String(s.n || 'Geteilt').slice(0, 32), code: String(s.c || '') })));
    if (!this.slots.length) this.slots = [newSlot({})];
    history.replaceState(null, '', location.pathname + location.search);
    this.slotsChanged();
    this.toast(`${this.slots.length} geteilte Programme geladen.`);
  }

  toast(msg, bad = false) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('bad', bad);
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }
}

function boot() { if (!window.app) window.app = new App(); }
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
else boot();
