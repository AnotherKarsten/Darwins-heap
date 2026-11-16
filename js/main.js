// Darwin's Heap – user interface controller

import { assemble } from './engine/assembler.js';
import { Arena } from './engine/arena.js';
import { OP_NAMES, OP_INFO, disassemble } from './engine/isa.js';
import { randomSeed } from './engine/rng.js';
import { BOTS, BOT_BY_ID, STARTER_CODE, botText } from './engine/warriors.js';
import { ArenaRenderer, PLAYER_COLORS } from './ui/renderer.js';
import { drawLines } from './ui/charts.js';
import { CodeEditor } from './ui/editor.js';
import { LESSONS, lessonText } from './ui/lessons.js';
import { BASICS, MiniSim } from './ui/basics.js';
import { manualHtml } from './ui/manual.js';
import * as store from './ui/storage.js';
import { t, dict, setLang, getLang, detectLang, applyDom, locale } from './i18n/index.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => Math.round(n).toLocaleString(locale());
const colored = (p) => `<b style="color:${p.color}">${esc(p.name)}</b>`;

const SPEEDS = [0.5, 1, 2, 4, 8, 15, 30, 60, 120, 250, 500, 1000, 2500, 5000, 10000, 30000, Infinity];
const MAX_SLOTS = 4;
const DEFAULT_SETTINGS = { coreSize: 4000, maxCycles: 0, maxProcesses: 1000, seedMode: 'random', seed: 4711, grid: true, heads: true };
const isBasic = (id) => BASICS.some((b) => b.id === id);
const textOf = (item, lang) => item[lang] || item.en;

let uidCounter = 1;
const newSlot = (props) => ({ uid: uidCounter++, kind: 'custom', botId: 'zwerg', name: '', code: STARTER_CODE[getLang()], ...props });

class App {
  constructor() {
    setLang(detectLang(store.load('lang', null)));
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
    this.applyLanguage();

    new ResizeObserver(() => { this.renderer.resize(); this.renderer.render(); }).observe($('#canvas-wrap'));
    this.rebuild();
    requestAnimationFrame((tt) => this.frame(tt));

    const shared = store.readShared();
    if (shared) this.importShared(shared);
    else if (!store.load('welcomed', false)) $('#welcome-dialog').showModal();
  }

  // ---------------------------------------------------------------- language
  /** Re-renders every text in the current language. */
  applyLanguage() {
    applyDom();
    $$('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang()));
    $('#manual-body').innerHTML = manualHtml();
    this.renderEditorChrome();
    this.renderSlots();
    this.setSpeed(this.speedIndex);
    if (this.arena && (this.running || this.arena.cycle > 0)) {
      // a match is in progress: keep it, just rename the programs and refresh all panels
      this.slots.forEach((slot, i) => { if (this.arena.players[i]) this.arena.players[i].name = this.slotName(slot); });
      this.renderPlayerCards();
      this.fillFollowSelect();
      $('#seed-label').textContent = t('seed', { seed: this.currentSeed });
      $('#cycle-max').textContent = fmt(this.arena.maxCycles);
      this.updateUi(true);
      this.renderer.render();
    } else if (this.arena || this.slots.some((s) => !this.slotAsm(s).ok)) {
      this.rebuild({ newSeed: false });
    }
    if (this.lesson) this.updateGoalBanner(this.goalState);
    if ($('#tutorial-dialog').open) { this.renderLessonList(this.shownLesson); this.renderLesson(this.shownLesson); }
  }

  switchLanguage(code) {
    const old = getLang();
    if (code === old) return;
    // Untouched templates follow the language; anything the player wrote stays as it is.
    for (const slot of this.slots) {
      if (slot.kind !== 'custom') continue;
      let swapped = null;
      if (slot.code === STARTER_CODE[old]) swapped = STARTER_CODE[code];
      for (const l of LESSONS) if (l[old] && slot.code === l[old].code && l[code]) swapped = l[code].code;
      if (swapped != null) {
        const oldName = assemble(slot.code).name;
        slot.code = swapped;
        if (!slot.name || slot.name === oldName) slot.name = '';
      }
    }
    setLang(code);
    store.save('lang', code);
    this.saveSlots();
    this.applyLanguage();
  }

  // ---------------------------------------------------------------- slots
  restoreSlots() {
    const saved = store.load('slots', null);
    if (Array.isArray(saved) && saved.length) {
      return saved.slice(0, MAX_SLOTS).map((s) => newSlot({ kind: s.kind, botId: BOT_BY_ID[s.botId] ? s.botId : 'zwerg', name: s.name || '', code: s.code ?? STARTER_CODE[getLang()] }));
    }
    return [newSlot({}), newSlot({ kind: 'bot', botId: 'zwerg' })];
  }

  saveSlots() {
    store.save('slots', this.slots.map(({ kind, botId, name, code }) => ({ kind, botId, name, code })));
  }

  slotCode(slot) { return slot.kind === 'bot' ? botText(BOT_BY_ID[slot.botId], getLang()).code : slot.code; }

  slotAsm(slot) {
    const code = this.slotCode(slot);
    const key = `${getLang()}|${this.settings.coreSize}|${this.settings.maxProcesses}|${code}`;
    let r = this.asmCache.get(key);
    if (!r) {
      r = assemble(code, { coreSize: this.settings.coreSize, maxProcesses: this.settings.maxProcesses, lang: getLang() });
      if (this.asmCache.size > 200) this.asmCache.clear();
      this.asmCache.set(key, r);
    }
    return r;
  }

  slotName(slot) {
    if (slot.kind === 'bot') return botText(BOT_BY_ID[slot.botId], getLang()).name;
    return slot.name || this.slotAsm(slot).name || t('name.fallback');
  }

  renderSlots() {
    const host = $('#slots');
    host.innerHTML = '';
    const lang = getLang();
    this.slots.forEach((slot, i) => {
      const asm = this.slotAsm(slot);
      const bot = slot.kind === 'bot' ? BOT_BY_ID[slot.botId] : null;
      const el = document.createElement('div');
      el.className = 'slot' + (asm.ok ? '' : ' error');
      el.style.setProperty('--c', PLAYER_COLORS[i]);
      const options = [`<option value="custom" ${slot.kind === 'custom' ? 'selected' : ''}>${esc(t('slot.custom'))}</option>`]
        .concat(BOTS.map((b) => `<option value="bot:${b.id}" ${bot && bot.id === b.id ? 'selected' : ''}>${esc(t('slot.bot', { name: botText(b, lang).name, level: t(`level.${b.level}`) }))}</option>`))
        .join('');
      const name = this.slotName(slot);
      el.innerHTML = `
        <div class="slot-top">
          <span class="color-dot" style="--c:${PLAYER_COLORS[i]}"></span>
          <span class="slot-name" title="${esc(name)}">${esc(name)}</span>
          <button class="btn small ghost" data-act="edit" title="${esc(t('slot.edit'))}" aria-label="${esc(t('slot.edit'))}">✎</button>
          <button class="btn small ghost" data-act="remove" title="${esc(t('slot.remove'))}" aria-label="${esc(t('slot.remove'))}" ${this.slots.length <= 1 ? 'disabled' : ''}>✕</button>
        </div>
        <select data-act="kind" aria-label="${esc(t('slot.choose'))}">${options}</select>
        <div class="slot-meta">
          ${asm.ok ? `<span class="badge">${esc(t('slot.instr', { n: asm.length }))}</span>` : `<span class="badge err">${esc(t('slot.errors', { n: asm.errors.length }))}</span>`}
          ${bot ? `<span class="badge lvl${bot.level}">${esc(t(`level.${bot.level}`))}</span>` : ''}
          ${this.lesson && i === 0 ? `<span class="badge">${esc(t('slot.lesson'))}</span>` : ''}
        </div>
        <div class="strategy">${esc(bot ? botText(bot, lang).blurb : (asm.strategy || t('slot.hint')))}</div>`;
      el.querySelector('[data-act=edit]').onclick = () => this.openEditor(i);
      el.querySelector('[data-act=remove]').onclick = () => this.removeSlot(i);
      el.querySelector('[data-act=kind]').onchange = (e) => {
        const v = e.target.value;
        if (v === 'custom') slot.kind = 'custom';
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

  applyPreset(name, quiet = false) {
    this.exitLesson(false);
    const mine = this.slots.find((s) => s.kind === 'custom') || newSlot({});
    if (name === 'solo') this.slots = [mine, newSlot({ kind: 'bot', botId: 'zwerg' })];
    if (name === 'royale') this.slots = [mine, newSlot({ kind: 'bot', botId: 'zwerg' }), newSlot({ kind: 'bot', botId: 'wuerfler' }), newSlot({ kind: 'bot', botId: 'spaeher' })];
    if (name === 'bots') this.slots = ['zwerg', 'wuerfler', 'spaeher', 'mitose'].map((b) => newSlot({ kind: 'bot', botId: b }));
    this.slotsChanged();
    if (!quiet) this.toast(t(name === 'bots' ? 'toast.bots' : 'toast.preset'));
  }

  // ---------------------------------------------------------------- match
  rebuild({ newSeed = true } = {}) {
    this.pause();
    const errors = [];
    const warriors = this.slots.map((slot, i) => {
      const asm = this.slotAsm(slot);
      if (!asm.ok) errors.push(t('err.line', { name: this.slotName(slot), line: asm.errors[0].line, msg: asm.errors[0].msg }));
      return { name: this.slotName(slot), color: PLAYER_COLORS[i], program: asm, meta: { author: asm.author, strategy: asm.strategy } };
    });
    if (errors.length) {
      this.arena = null;
      this.renderer.arena = null;
      this.renderer.render();
      this.setOverlay(t('overlay.errors'), errors[0], false);
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
      this.setOverlay(t('overlay.noFit'), e.code === 'CORE_TOO_SMALL' ? t('err.coreTooSmall') : e.message, false);
      return false;
    }
    this.arena.on((ev) => this.onArenaEvent(ev));
    this.renderer.setArena(this.arena);
    this.dirty = false;
    this.resultShown = false;
    this.goalState = null;
    $('#event-log').innerHTML = '';
    this.logEvent(0, esc(t('log.loaded', { n: warriors.length, seed })));
    $('#cycle-max').textContent = fmt(this.arena.maxCycles);
    $('#seed-label').textContent = t('seed', { seed });
    $('#lens-addr').max = this.arena.size - 1;
    this.follow = -1;
    this.fillFollowSelect();
    this.renderer.selected = -1;
    this.setOverlay(t('overlay.ready'), this.overlaySub(), true);
    this.renderPlayerCards();
    this.updateUi(true);
    if (this.lesson) this.updateGoalBanner();
    this.renderer.render();
    return true;
  }

  overlaySub() {
    const ps = this.arena ? this.arena.players : [];
    return ps.length === 1 ? t('overlay.solo') : ps.map((p) => p.name).join(' · ');
  }

  fillFollowSelect() {
    const follow = $('#lens-follow');
    follow.innerHTML = '<option value="-1">–</option>' + this.arena.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    follow.value = String(this.follow);
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
    const v = s < 1 ? s.toLocaleString(locale()) : fmt(s);
    $('#speed-label').textContent = s === Infinity ? t('speed.max') : t('speed.unit', { v });
    store.save('speed', this.speedIndex);
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const a = this.arena;
    if (this.running && a && !a.finished) {
      const speed = SPEEDS[this.speedIndex];
      const budget = 12; // ms of computing time per frame
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
      // fresh writes should glow for about 0.6 s
      this.renderer.decay = Math.max(3, Math.min(20000, (speed === Infinity ? this.measured : speed) * 0.6));
      if (a.finished) this.onFinished();
    }
    if (a) {
      if (this.follow >= 0) {
        const p = a.players[this.follow];
        if (p && p.alive && p.queue.count) this.renderer.selected = p.queue.pc[p.queue.head];
      }
      this.renderer.render(now);
      if (now - this.lastUi > 120) { this.updateUi(now - this.lastCharts > 400); this.lastUi = now; }
    }
    requestAnimationFrame((tt) => this.frame(tt));
  }

  onArenaEvent(ev) {
    const a = this.arena;
    if (ev.type === 'eliminated') {
      const p = a.players[ev.player];
      const by = ev.by >= 0 && ev.by !== ev.player ? esc(t('log.hitBy', { by: a.players[ev.by].name })) : ev.by === ev.player ? esc(t('log.ownGoal')) : '';
      this.logEvent(ev.cycle, t('log.eliminated', { name: colored(p) }) + by);
    } else if (ev.type === 'proclimit') {
      this.logEvent(ev.cycle, t('log.procLimit', { name: colored(a.players[ev.player]), n: fmt(a.maxProcesses) }));
    } else if (ev.type === 'finish') {
      const text = ev.winner != null ? t('log.win', { name: colored(a.players[ev.winner]) })
        : esc(ev.reason === 'timeout' ? t('log.timeout') : t('log.over'));
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

  // ---------------------------------------------------------------- panels
  renderPlayerCards() {
    const host = $('#player-cards');
    if (!this.arena) { host.innerHTML = `<p class="muted small">${esc(t('cards.empty'))}</p>`; return; }
    host.innerHTML = this.arena.players.map((p) => `
      <div class="pcard" data-p="${p.id}" style="--c:${p.color}">
        <div class="pname"><span class="color-dot"></span>${esc(p.name)}</div>
        <div class="pstats">
          <div>${esc(t('cards.procs'))}<b data-k="procs">1</b></div>
          <div>${esc(t('cards.memory'))}<b data-k="cells">0%</b></div>
          <div>${esc(t('cards.kills'))}<b data-k="kills">0</b></div>
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
      const emptyText = t('chart.empty');
      drawLines($('#chart-procs'), a.history, 'procs', colors, { emptyText });
      drawLines($('#chart-cells'), a.history, 'cells', colors, { percentOf: a.size, emptyText });
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
    const owner = c.owner >= 0 ? a.players[c.owner].name : t('lens.nobody');
    $('#lens-info').innerHTML = t('lens.info', { addr: center, owner: esc(owner), w: fmt(c.writes), e: fmt(c.execs) });
  }

  renderAnalysis() {
    const a = this.arena;
    if (!a) return;
    const blocks = a.players.map((p) => {
      const max = Math.max(1, ...p.opCounts);
      const hist = OP_NAMES.map((name, i) => (p.opCounts[i] ? `<span>${name}</span><div class="hbar" style="width:${(p.opCounts[i] / max) * 100}%"></div><span class="muted">${fmt(p.opCounts[i])}</span>` : '')).join('');
      const kv = [['an.executed', p.executed], ['an.maxProcs', p.maxProcs], ['an.spawns', p.spawns], ['an.deaths', p.deaths],
        ['an.selfKills', p.selfKills], ['an.waits', p.waits], ['an.writes', p.writes]]
        .map(([k, v]) => `<span>${esc(t(k))}</span><b>${fmt(v)}</b>`).join('');
      return `<div class="analysis-block" style="--c:${p.color}">
        <div class="pname" style="display:flex;gap:7px;align-items:center;font-weight:600;margin-bottom:6px"><span class="color-dot" style="--c:${p.color}"></span>${esc(p.name)}</div>
        <div class="kv">${kv}</div>
        <div class="chart-title">${esc(t('an.mix'))}</div>
        <div class="hist">${hist || `<span class="muted">${esc(t('an.nothing'))}</span>`}</div>
      </div>`;
    });
    const head = a.players.map((p) => `<th style="color:${p.color}" title="${esc(p.name)}">${esc(p.name.slice(0, 6))}</th>`).join('');
    const matrix = a.players.length > 1 ? `<div class="chart-title">${esc(t('an.matrix'))}</div>
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
    if (solo) {
      const alive = a.players[0].alive;
      hero = `<div class="trophy">${alive ? '🧬' : '💀'}</div><h2>${esc(t(alive ? 'res.survived' : 'res.extinct'))}</h2><div class="muted">${esc(t('res.cycles', { n: fmt(r.cycles) }))}</div>`;
    } else if (winner) {
      hero = `<div class="trophy">🏆</div><h2 style="color:${winner.color}">${esc(t('res.wins', { name: winner.name }))}</h2><div class="muted">${esc(t('res.winSub', { n: fmt(r.cycles) }))}</div>`;
    } else {
      hero = `<div class="trophy">🤝</div><h2>${esc(t('res.draw'))}</h2><div class="muted">${esc(r.reason === 'timeout' ? t('res.drawTimeout', { n: fmt(a.maxCycles) }) : t('res.drawNone'))}</div>`;
    }
    let lessonHtml = '';
    if (lessonOutcome) {
      const goal = lessonText(lessonOutcome.lesson, getLang()).goal;
      lessonHtml = lessonOutcome.success
        ? `<div class="goal-banner success" style="margin-top:12px"><span class="goal-icon">✅</span><div class="goal-text"><b>${esc(t('res.lessonDone'))}</b><span>${esc(goal)}</span></div>${lessonOutcome.next ? `<button class="btn small primary" id="result-next">${esc(t('res.next'))}</button>` : ''}</div>`
        : `<div class="goal-banner fail" style="margin-top:12px"><span class="goal-icon">🔁</span><div class="goal-text"><b>${esc(t('res.lessonFail'))}</b><span>${esc(t('res.lessonFailText'))}</span></div></div>`;
    }
    $('#result-body').innerHTML = `<div class="result-hero">${hero}</div>${lessonHtml}
      <ol class="ranking">${ranked.map((p, i) => `<li><span class="place">${i + 1}.</span><span class="color-dot" style="--c:${p.color}"></span>
      <span>${esc(p.name)}</span><span class="muted small">${esc(p.alive ? t('res.alive', { p: fmt(p.queue.count), m: ((p.cells / a.size) * 100).toFixed(1) }) : t('res.dead', { n: fmt(p.deathCycle) }))}</span></li>`).join('')}</ol>`;
    const next = $('#result-next');
    if (next) next.onclick = () => { $('#result-dialog').close(); this.openTutorial(lessonOutcome.next.id); };
    $('#result-dialog').showModal();
  }

  // ---------------------------------------------------------------- canvas
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
        <div class="muted">${owner ? t('tip.owner', { name: colored(owner) }) : esc(t('tip.empty'))}${ago != null ? esc(t('tip.ago', { n: fmt(ago) })) : ''}</div>
        <div class="muted">${esc(t('tip.counts', { w: fmt(c.writes), e: fmt(c.execs) }))}${procs ? ` · <b style="color:#fff">${esc(t('tip.procs', { n: procs }))}</b>` : ''}</div>`;
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
    $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab-body').forEach((b) => { b.hidden = b.dataset.body !== name; });
    if (name === 'analysis') this.renderAnalysis();
    if (name === 'lens') this.renderLens();
    if (name === 'live') this.updateUi(true);
  }

  // ---------------------------------------------------------------- controls
  bindControls() {
    $('#btn-play').onclick = () => this.toggle();
    $('#overlay-play').onclick = () => this.play();
    $('#btn-step').onclick = (e) => this.stepOnce(e.shiftKey);
    $('#btn-reset').onclick = () => this.rebuild();
    $('#speed').oninput = (e) => this.setSpeed(+e.target.value);
    $('#add-slot').onclick = () => this.addSlot();
    $$('[data-preset]').forEach((b) => { b.onclick = () => this.applyPreset(b.dataset.preset); });
    $$('.seg-btn').forEach((b) => { b.onclick = () => this.setView(b.dataset.view); });
    $$('.tab').forEach((b) => { b.onclick = () => this.showTab(b.dataset.tab); });
    $$('.lang-btn').forEach((b) => { b.onclick = () => this.switchLanguage(b.dataset.lang); });
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
        if (w === 'tutorial') this.openTutorial(BASICS[0].id);
        if (w === 'demo') { this.applyPreset('bots', true); this.setSpeed(10); this.play(); this.toast(t('toast.demo')); }
        if (w === 'solo') { this.applyPreset('solo', true); this.openEditor(0); }
      };
    });
    $('#welcome-dialog').addEventListener('close', () => store.save('welcomed', true));
    $('#tutorial-dialog').addEventListener('close', () => { if (this.miniSim) { this.miniSim.destroy(); this.miniSim = null; } });
    // big dialogs can be maximised; the choice is remembered per dialog
    const maxed = store.load('maximized', {});
    $$('[data-max]').forEach((b) => {
      const d = b.closest('dialog');
      d.classList.toggle('maximized', !!maxed[d.id]);
      b.onclick = () => {
        const on = d.classList.toggle('maximized');
        maxed[d.id] = on;
        store.save('maximized', maxed);
      };
    });
  }

  // ---------------------------------------------------------------- editor
  setupEditor() {
    this.editor = new CodeEditor($('#code-editor'), { onChange: () => this.checkEditor() });
    const tpl = $('#editor-template');
    tpl.onchange = () => {
      const v = tpl.value;
      tpl.value = '';
      if (!v) return;
      const code = v === '__starter' ? STARTER_CODE[getLang()] : botText(BOT_BY_ID[v], getLang()).code;
      if (this.editor.value.trim() && !confirm(t('ed.confirmReplace'))) return;
      this.editor.value = code;
      this.checkEditor();
    };
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
      const name = ($('#editor-name').value || t('ed.file')).replace(/[^\wäöüÄÖÜß-]+/g, '_');
      store.downloadText(`${name}.heap`, this.editor.value);
    };
  }

  /** Language-dependent parts of the editor: template list and instruction reference. */
  renderEditorChrome() {
    const lang = getLang();
    $('#editor-template').innerHTML = `<option value="">${esc(t('ed.template'))}</option>`
      + BOTS.map((b) => `<option value="${b.id}">${esc(botText(b, lang).name)}</option>`).join('')
      + `<option value="__starter">${esc(t('ed.starter'))}</option>`;
    const ops = dict().ops;
    $('#editor-ref').innerHTML = OP_NAMES.map((n) => `<button type="button" class="ref-item" data-ex="${esc(OP_INFO[n].example)}" title="${esc(ops[n].desc)}"><b class="op-${OP_INFO[n].group}">${n}</b><span>${esc(ops[n].short)}</span></button>`).join('');
    if ($('#editor-dialog').open) this.checkEditor();
  }

  openEditor(i) {
    const slot = this.slots[i];
    if (!slot) return;
    this.pause();
    this.editingSlot = i;
    const fromBot = slot.kind === 'bot';
    this.editorAutoName = true;
    $('#editor-dot').style.setProperty('--c', PLAYER_COLORS[i]);
    $('#editor-name').value = fromBot ? `${this.slotName(slot)} ${t('ed.copy')}` : this.slotName(slot);
    $('#editor-name').oninput = () => { this.editorAutoName = false; };
    this.editor.value = this.slotCode(slot);
    if (!fromBot) this.checkEditor(); else { this.editorAutoName = false; this.checkEditor(); }
    $('#editor-dialog').showModal();
    if (fromBot) this.toast(t('ed.botCopy'));
    setTimeout(() => this.editor.focus(), 50);
  }

  checkEditor() {
    const r = assemble(this.editor.value, { coreSize: this.settings.coreSize, maxProcesses: this.settings.maxProcesses, lang: getLang() });
    const marks = new Map();
    r.warnings.forEach((w) => marks.set(w.line, 'warn'));
    r.errors.forEach((e) => marks.set(e.line, 'err'));
    this.editor.setMarks(marks);
    const status = $('#editor-status');
    status.classList.toggle('bad', !r.ok);
    status.innerHTML = r.ok ? t('ed.ok', { n: r.length, line: r.instructions[r.org] ? r.instructions[r.org].line : 1 }) : esc(t('ed.bad', { n: r.errors.length }));
    $('#editor-errors').innerHTML = [...r.errors.map((e) => ({ ...e, cls: 'err' })), ...r.warnings.map((w) => ({ ...w, cls: 'warn' }))]
      .map((e) => `<li class="${e.cls}" data-line="${e.line}">${esc(t('ed.errLine', { line: e.line, msg: e.msg }))}</li>`).join('');
    // the ;name line in the code updates the title until the player types a name themselves
    if (r.name && this.editorAutoName) $('#editor-name').value = r.name;
    return r;
  }

  applyEditor() {
    const slot = this.slots[this.editingSlot];
    if (!slot) return;
    slot.kind = 'custom';
    slot.code = this.editor.value;
    const typed = $('#editor-name').value.trim();
    const asmName = this.checkEditor().name;
    slot.name = typed && typed !== asmName ? typed : '';
    $('#editor-dialog').close();
    this.slotsChanged();
    const r = this.slotAsm(slot);
    this.toast(r.ok ? t('ed.ready', { name: this.slotName(slot) }) : t('ed.savedErr'), !r.ok);
  }

  // ---------------------------------------------------------------- tutorial
  openTutorial(id) {
    this.pause();
    const all = [...BASICS, ...LESSONS];
    const current = id || this.lesson || all.find((l) => !this.progress[l.id])?.id || BASICS[0].id;
    this.renderLessonList(current);
    this.renderLesson(current);
    const d = $('#tutorial-dialog');
    if (!d.open) d.showModal();
  }

  renderLessonList(current) {
    const lang = getLang();
    const item = (l, num) => {
      const x = textOf(l, lang);
      return `<li class="${l.id === current ? 'active' : ''} ${this.progress[l.id] ? 'done' : ''}">
      <button data-lesson="${l.id}"><span class="num">${this.progress[l.id] ? '✓' : num}</span><span>${esc(x.title)}<small>${esc(x.subtitle)}</small></span></button></li>`;
    };
    $('#lesson-list').innerHTML = `<li class="lesson-group">${esc(t('tut.basics'))}</li>`
      + BASICS.map((b, i) => item(b, String.fromCharCode(65 + i))).join('')
      + `<li class="lesson-group">${esc(t('tut.battles'))}</li>`
      + LESSONS.map((l, i) => item(l, i + 1)).join('');
    $$('#lesson-list [data-lesson]').forEach((b) => { b.onclick = () => { this.renderLessonList(b.dataset.lesson); this.renderLesson(b.dataset.lesson); }; });
  }

  renderLesson(id) {
    this.shownLesson = id;
    if (this.miniSim) { this.miniSim.destroy(); this.miniSim = null; }
    if (isBasic(id)) { this.renderBasic(id); return; }
    const lang = getLang();
    const l = LESSONS.find((x) => x.id === id);
    const x = lessonText(l, lang);
    const idx = LESSONS.indexOf(l);
    const opp = l.opponents.length ? l.opponents.map((o) => `<b>${esc(botText(BOT_BY_ID[o], lang).name)}</b>`).join(', ') : `<i>${esc(t('tut.alone'))}</i>`;
    $('#lesson-body').innerHTML = `
      <div class="muted small">${esc(t('tut.of', { i: idx + 1, n: LESSONS.length }))}</div>
      <h3>${esc(x.title)}</h3>
      <div class="muted">${esc(x.subtitle)}</div>
      ${x.html}
      <div class="lesson-goal"><span class="goal-icon">🎯</span><div class="vs"><b>${esc(x.goal)}</b><div class="muted small">${t('tut.opponents', { list: opp })}</div></div>
        <button class="btn primary" id="lesson-start">${esc(t('tut.start'))}</button></div>`;
    $('#lesson-start').onclick = () => this.startLesson(id);
    $('#lesson-body').scrollTop = 0;
  }

  renderBasic(id) {
    const lang = getLang();
    const idx = BASICS.findIndex((b) => b.id === id);
    const b = BASICS[idx];
    const x = textOf(b, lang);
    const last = idx === BASICS.length - 1;
    $('#lesson-body').innerHTML = `
      ${idx === 0 ? `<p class="basics-hint">${esc(t('tut.basicsHint'))}</p>` : ''}
      <div class="muted small">${esc(t('tut.chapterOf', { i: idx + 1, n: BASICS.length }))}</div>
      <h3>${esc(x.title)}</h3>
      <div class="muted">${esc(x.subtitle)}</div>
      ${x.html}
      <div id="mini-host"></div>
      <div class="basics-nav">
        <button class="btn ghost" id="basic-back" ${idx === 0 ? 'disabled' : ''}>${esc(t('tut.back'))}</button>
        <button class="btn ghost" id="basic-skip">${esc(t('tut.skip'))}</button>
        <button class="btn primary" id="basic-next">${esc(t(last ? 'tut.toLessons' : 'tut.next'))}</button>
      </div>`;
    this.miniSim = new MiniSim($('#mini-host'), b.demo, lang);
    const go = (target) => { this.renderLessonList(target); this.renderLesson(target); };
    $('#basic-back').onclick = () => go(BASICS[idx - 1].id);
    $('#basic-skip').onclick = () => go(LESSONS[0].id);
    $('#basic-next').onclick = () => {
      this.progress[id] = true;
      store.save('progress', this.progress);
      go(last ? LESSONS[0].id : BASICS[idx + 1].id);
    };
    $('#lesson-body').scrollTop = 0;
  }

  startLesson(id) {
    const l = LESSONS.find((x) => x.id === id);
    const x = lessonText(l, getLang());
    this.lesson = id;
    const saved = store.load(`lesson-code:${id}`, null);
    this.slots = [newSlot({ kind: 'custom', name: '', code: saved ?? x.code }),
      ...l.opponents.map((b) => newSlot({ kind: 'bot', botId: b }))];
    $('#tutorial-dialog').close();
    this.saveSlots();
    this.renderSlots();
    if (l.speed != null) this.setSpeed(l.speed);
    this.rebuild();
    this.updateGoalBanner();
    this.toast(t('tut.tip'));
  }

  updateGoalBanner(state) {
    const b = $('#goal-banner');
    const l = this.lesson && LESSONS.find((x) => x.id === this.lesson);
    if (!l) { b.hidden = true; return; }
    const x = lessonText(l, getLang());
    this.goalState = state;
    b.hidden = false;
    b.classList.toggle('success', state === 'success');
    b.classList.toggle('fail', state === 'fail');
    $('#goal-title').textContent = t('goal.title', { i: LESSONS.indexOf(l) + 1, title: x.title });
    $('#goal-desc').textContent = t(state === 'success' ? 'goal.success' : state === 'fail' ? 'goal.fail' : 'goal.goal', { goal: x.goal });
    this.renderer.resize();
  }

  evaluateLesson() {
    const l = LESSONS.find((x) => x.id === this.lesson);
    const r = this.arena.result;
    const success = l.goal.type === 'win' ? r.winner === 0 : r.survivors.includes(0);
    if (this.slots[0] && this.slots[0].kind === 'custom') {
      const isTemplate = ['en', 'de'].some((lang) => l[lang] && l[lang].code === this.slots[0].code);
      // only remember code the player actually changed
      if (!isTemplate) store.save(`lesson-code:${l.id}`, this.slots[0].code);
    }
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

  // ---------------------------------------------------------------- tournament
  openTournament() {
    this.pause();
    $('#tour-result').innerHTML = this.slots.length < 2 ? `<p class="muted">${esc(t('tour.needTwo'))}</p>` : '';
    $('#tour-bar').style.width = '0';
    $('#tour-start').disabled = this.slots.length < 2;
    $('#tour-start').onclick = () => this.runTournament();
    $('#tournament-dialog').showModal();
    $('#tournament-dialog').addEventListener('close', () => { this.tourCancel = true; }, { once: true });
  }

  runTournament() {
    const programs = this.slots.map((s, i) => ({ name: this.slotName(s), color: PLAYER_COLORS[i], program: this.slotAsm(s) }));
    const bad = programs.find((p) => !p.program.ok);
    if (bad) { $('#tour-result').innerHTML = `<p class="muted">${esc(t('tour.hasErrors', { name: bad.name }))}</p>`; return; }
    const rounds = +$('#tour-rounds').value;
    const mode = $('#tour-mode').value;
    const matches = [];
    if (mode === 'ffa') for (let r = 0; r < rounds; r++) matches.push(programs.map((_, i) => i));
    else for (let i = 0; i < programs.length; i++) for (let j = i + 1; j < programs.length; j++) for (let r = 0; r < rounds; r++) matches.push([i, j]);
    const stats = programs.map(() => ({ w: 0, d: 0, l: 0, pts: 0, games: 0 }));
    let k = 0;
    this.tourCancel = false;
    const btn = $('#tour-start');
    btn.disabled = true;
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
    const th = ['tour.program', 'tour.wins', 'tour.draws', 'tour.losses', 'tour.points', 'tour.rate'].map((k) => `<th>${esc(t(k))}</th>`).join('');
    $('#tour-result').innerHTML = `<p class="muted small">${esc(t('tour.played', { d: done, n: total }))}</p>
      <table class="tour"><tr>${th}</tr>
      ${rows.map(({ p, s }) => {
        const pct = s.games ? (s.w / s.games) * 100 : 0;
        return `<tr style="--c:${p.color}"><td><span class="color-dot" style="--c:${p.color};display:inline-block;vertical-align:middle;margin-right:6px"></span>${esc(p.name)}</td>
        <td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td><b>${s.pts}</b></td><td><span class="winbar" style="width:${pct * 0.8}px"></span>${pct.toFixed(0)}%</td></tr>`;
      }).join('')}</table>`;
  }

  // ---------------------------------------------------------------- settings & sharing
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
    const url = store.shareUrl(this.slots.map((s) => ({ ...s, name: this.slotName(s) })));
    try {
      await navigator.clipboard.writeText(url);
      this.toast(t('toast.copied'));
    } catch {
      prompt(t('toast.prompt'), url);
    }
  }

  importShared(list) {
    this.slots = list.map((s) => (s.b && BOT_BY_ID[s.b] ? newSlot({ kind: 'bot', botId: s.b }) : newSlot({ kind: 'custom', name: String(s.n || t('name.shared')).slice(0, 32), code: String(s.c || '') })));
    if (!this.slots.length) this.slots = [newSlot({})];
    history.replaceState(null, '', location.pathname + location.search);
    this.slotsChanged();
    this.toast(t('toast.imported', { n: this.slots.length }));
  }

  toast(msg, bad = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('bad', bad);
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
}

function boot() { if (!window.app) window.app = new App(); }
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
else boot();
