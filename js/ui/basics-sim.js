// Interactive mini memory (32 cells) for the basics chapters.
// Shows every cell with its A and B field, a detail panel for the selected cell
// and a line-by-line explanation of every executed instruction.

import { assemble } from '../engine/assembler.js';
import { Arena } from '../engine/arena.js';
import { OP, OP_NAMES, OP_INFO, MODE, MODE_CHARS, signed } from '../engine/isa.js';
import { PLAYER_COLORS } from './renderer.js';

const MINI = 32;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fieldText = (mode, v) => `${MODE_CHARS[mode]}${signed(v, MINI)}`;
const plusMinus = (from, off) => (off < 0 ? `${from} − ${-off}` : `${from} + ${off}`);

const TX = {
  en: {
    fa: 'A field', fb: 'B field', op: 'Instruction', cell: 'cell',
    turn: (who, pc) => `${who}'s turn. Its <b>PC = ${pc}</b>, so cell ${pc} is executed:`,
    sleeping: (n) => `The process is still asleep (${n} more turn${n === 1 ? '' : 's'}) and does nothing this time.`,
    unused: 'not used by this instruction',
    imm: (v) => `the number <b>${v}</b>`,
    dir: (calc, addr) => `address: ${calc} = <b>cell ${addr}</b>`,
    ind: (calc, t, v, addr, note) => `pointer: cell ${calc} = ${t} has <b>${v}</b> in its B field → ${t} + ${v} = <b>cell ${addr}</b>${note}`,
    decNote: ' (the B field is reduced by 1 first)',
    incNote: ' (afterwards the B field is increased by 1)',
    result: 'Result:',
    movImm: (v, b) => `writes the number <b>${v}</b> into the <span class="fb">B field</span> of cell ${b}.`,
    mov: (a, b) => `copies the whole cell ${a} (instruction and both fields) into cell ${b}.`,
    addImm: (v, b, before, after, sub) => `${sub ? 'subtracts' : 'adds'} ${v} ${sub ? 'from' : 'to'} the <span class="fb">B field</span> of cell ${b}: ${before} ${sub ? '−' : '+'} ${v} = <b>${after}</b>.`,
    add: (a, b, sub) => `${sub ? 'subtracts' : 'adds'} both fields of cell ${a} ${sub ? 'from' : 'to'} both fields of cell ${b}.`,
    jmp: (a) => `jump to cell ${a}.`,
    jmz: (b, v, yes) => `the <span class="fb">B field</span> of cell ${b} is <b>${v}</b>. ${yes ? 'That is 0 → jump.' : 'Not 0 → no jump.'}`,
    jmn: (b, v, yes) => `the <span class="fb">B field</span> of cell ${b} is <b>${v}</b>. ${yes ? 'Not 0 → jump.' : 'That is 0 → no jump.'}`,
    djn: (b, before, after, yes) => `the <span class="fb">B field</span> of cell ${b} goes from ${before} to <b>${after}</b>. ${yes ? 'Not 0 → jump.' : 'Now 0 → no jump, the loop ends.'}`,
    cmp: (a, b, eq, skip) => `cell ${a} and cell ${b} are <b>${eq ? 'equal' : 'different'}</b>. ${skip ? 'So the next instruction is skipped.' : 'Nothing is skipped.'}`,
    slt: (x, y, skip) => `is ${x} smaller than ${y}? <b>${skip ? 'Yes' : 'No'}</b>. ${skip ? 'So the next instruction is skipped.' : 'Nothing is skipped.'}`,
    spl: (a, n) => `a <b>new process</b> starts with PC = ${a}. The program now has <b>${n}</b> processes.`,
    splFull: 'the process limit is reached – no new process.',
    dat: '<b>DAT cannot be executed – the process dies!</b>',
    out: (who) => `${who} has no process left and is <b>out</b>.`,
    nop: 'nothing happens.',
    wait: (n) => `the process sleeps for <b>${n}</b> of its own turns.`,
    rnd: (v, b) => `rolls <b>${v}</b> and writes it into the <span class="fb">B field</span> of cell ${b}.`,
    newPc: (c, why) => `New PC: <b>${c}</b>${why}.`,
    whyNext: ' (simply the next cell)', whyJump: ' (jump)', whySkip: ' (one cell skipped)', whyStay: ' (stays here)',
    nextTurn: (who) => `Next it's ${who}'s turn.`,
    winner: (who) => `🏆 ${who} is the last one standing and <b>wins</b>!`,
    pc: 'Program counter (PC)', queue: (n) => `${n} processes, next first`,
    start: 'Press <b>Step</b> to execute the first instruction.',
    startNoSteps: 'Click a cell to see what is inside.',
    step: 'Step', auto: 'Auto', stop: 'Stop', reset: 'Reset', follow: 'Follow the PC',
    legendA: 'A field', legendB: 'B field', legendPc: 'process (PC)', legendTarget: 'points here',
    detTitle: (addr, label) => `Cell ${addr}${label ? ` <i>(${label})</i>` : ''}`,
    detPc: (who) => `▶ the PC of ${who} points here – this instruction runs next.`,
    detDat: 'DAT only holds data. A process that executes it dies. Here its fields are simply two stored numbers:',
    detNum: (v) => `the number <b>${v}</b>`,
    sum: {
      MOV: (a, b, imm) => (imm ? `In short: write ${a} into the B field of ${b}.` : `In short: copy ${a} to ${b}.`),
      ADD: (a, b, imm) => (imm ? `In short: add ${a} to the B field of ${b}.` : `In short: add ${a} to ${b}.`),
      SUB: (a, b, imm) => (imm ? `In short: subtract ${a} from the B field of ${b}.` : `In short: subtract ${a} from ${b}.`),
      JMP: (a) => `In short: continue at ${a}.`,
      JMZ: (a, b) => `In short: if the B field of ${b} is 0, continue at ${a}.`,
      JMN: (a, b) => `In short: if the B field of ${b} is not 0, continue at ${a}.`,
      DJN: (a, b) => `In short: reduce the B field of ${b} by 1; if it is not 0 then, continue at ${a}.`,
      SPL: (a) => `In short: start an additional process at ${a}.`,
    },
  },
  de: {
    fa: 'A-Feld', fb: 'B-Feld', op: 'Befehl', cell: 'Zelle',
    turn: (who, pc) => `${who} ist dran. Sein <b>PC = ${pc}</b>, also wird Zelle ${pc} ausgeführt:`,
    sleeping: (n) => `Der Prozess schläft noch (${n} Zug${n === 1 ? '' : 'e'}) und tut diesmal nichts.`,
    unused: 'wird von diesem Befehl nicht benutzt',
    imm: (v) => `die Zahl <b>${v}</b>`,
    dir: (calc, addr) => `Adresse: ${calc} = <b>Zelle ${addr}</b>`,
    ind: (calc, t, v, addr, note) => `Zeiger: Zelle ${calc} = ${t} hat im B-Feld <b>${v}</b> → ${t} + ${v} = <b>Zelle ${addr}</b>${note}`,
    decNote: ' (das B-Feld wird vorher um 1 verringert)',
    incNote: ' (danach wird das B-Feld um 1 erhöht)',
    result: 'Ergebnis:',
    movImm: (v, b) => `schreibt die Zahl <b>${v}</b> in das <span class="fb">B-Feld</span> von Zelle ${b}.`,
    mov: (a, b) => `kopiert die ganze Zelle ${a} (Befehl und beide Felder) in Zelle ${b}.`,
    addImm: (v, b, before, after, sub) => `${sub ? 'zieht' : 'zählt'} ${v} ${sub ? 'vom' : 'zum'} <span class="fb">B-Feld</span> von Zelle ${b} ${sub ? 'ab' : 'dazu'}: ${before} ${sub ? '−' : '+'} ${v} = <b>${after}</b>.`,
    add: (a, b, sub) => `${sub ? 'zieht' : 'zählt'} beide Felder von Zelle ${a} ${sub ? 'von' : 'zu'} beiden Feldern von Zelle ${b} ${sub ? 'ab' : 'dazu'}.`,
    jmp: (a) => `Sprung zu Zelle ${a}.`,
    jmz: (b, v, yes) => `Das <span class="fb">B-Feld</span> von Zelle ${b} ist <b>${v}</b>. ${yes ? 'Das ist 0 → Sprung.' : 'Nicht 0 → kein Sprung.'}`,
    jmn: (b, v, yes) => `Das <span class="fb">B-Feld</span> von Zelle ${b} ist <b>${v}</b>. ${yes ? 'Nicht 0 → Sprung.' : 'Das ist 0 → kein Sprung.'}`,
    djn: (b, before, after, yes) => `Das <span class="fb">B-Feld</span> von Zelle ${b} geht von ${before} auf <b>${after}</b>. ${yes ? 'Nicht 0 → Sprung.' : 'Jetzt 0 → kein Sprung, die Schleife endet.'}`,
    cmp: (a, b, eq, skip) => `Zelle ${a} und Zelle ${b} sind <b>${eq ? 'gleich' : 'verschieden'}</b>. ${skip ? 'Darum wird der nächste Befehl übersprungen.' : 'Es wird nichts übersprungen.'}`,
    slt: (x, y, skip) => `Ist ${x} kleiner als ${y}? <b>${skip ? 'Ja' : 'Nein'}</b>. ${skip ? 'Darum wird der nächste Befehl übersprungen.' : 'Es wird nichts übersprungen.'}`,
    spl: (a, n) => `Ein <b>neuer Prozess</b> startet mit PC = ${a}. Das Programm hat jetzt <b>${n}</b> Prozesse.`,
    splFull: 'Das Prozesslimit ist erreicht – kein neuer Prozess.',
    dat: '<b>DAT kann man nicht ausführen – der Prozess stirbt!</b>',
    out: (who) => `${who} hat keinen Prozess mehr und <b>scheidet aus</b>.`,
    nop: 'Es passiert nichts.',
    wait: (n) => `Der Prozess schläft <b>${n}</b> eigene Züge lang.`,
    rnd: (v, b) => `würfelt <b>${v}</b> und schreibt es in das <span class="fb">B-Feld</span> von Zelle ${b}.`,
    newPc: (c, why) => `Neuer PC: <b>${c}</b>${why}.`,
    whyNext: ' (einfach die nächste Zelle)', whyJump: ' (Sprung)', whySkip: ' (eine Zelle übersprungen)', whyStay: ' (bleibt hier)',
    nextTurn: (who) => `Danach ist ${who} dran.`,
    winner: (who) => `🏆 ${who} ist als Einziges übrig und <b>gewinnt</b>!`,
    pc: 'Programmzähler (PC)', queue: (n) => `${n} Prozesse, der vorderste ist zuerst dran`,
    start: 'Drück auf <b>Schritt</b>, um den ersten Befehl auszuführen.',
    startNoSteps: 'Klick auf eine Zelle, um zu sehen, was darin steht.',
    step: 'Schritt', auto: 'Auto', stop: 'Stopp', reset: 'Neu', follow: 'Dem PC folgen',
    legendA: 'A-Feld', legendB: 'B-Feld', legendPc: 'Prozess (PC)', legendTarget: 'zeigt hierher',
    detTitle: (addr, label) => `Zelle ${addr}${label ? ` <i>(${label})</i>` : ''}`,
    detPc: (who) => `▶ Der PC von ${who} zeigt hierher – dieser Befehl ist als Nächstes dran.`,
    detDat: 'DAT enthält nur Daten. Ein Prozess, der es ausführt, stirbt. Hier sind die Felder einfach zwei gespeicherte Zahlen:',
    detNum: (v) => `die Zahl <b>${v}</b>`,
    sum: {
      MOV: (a, b, imm) => (imm ? `Kurz: Schreibe ${a} in das B-Feld von ${b}.` : `Kurz: Kopiere ${a} nach ${b}.`),
      ADD: (a, b, imm) => (imm ? `Kurz: Zähle ${a} zum B-Feld von ${b} dazu.` : `Kurz: Zähle ${a} zu ${b} dazu.`),
      SUB: (a, b, imm) => (imm ? `Kurz: Ziehe ${a} vom B-Feld von ${b} ab.` : `Kurz: Ziehe ${a} von ${b} ab.`),
      JMP: (a) => `Kurz: Mach bei ${a} weiter.`,
      JMZ: (a, b) => `Kurz: Ist das B-Feld von ${b} gleich 0, mach bei ${a} weiter.`,
      JMN: (a, b) => `Kurz: Ist das B-Feld von ${b} nicht 0, mach bei ${a} weiter.`,
      DJN: (a, b) => `Kurz: Verringere das B-Feld von ${b} um 1; ist es dann nicht 0, mach bei ${a} weiter.`,
      SPL: (a) => `Kurz: Starte zusätzlich einen Prozess bei ${a}.`,
    },
  },
};

/** Which fields an instruction actually uses. */
const USES = {
  [OP.DAT]: [false, false], [OP.MOV]: [true, true], [OP.ADD]: [true, true], [OP.SUB]: [true, true],
  [OP.JMP]: [true, false], [OP.JMZ]: [true, true], [OP.JMN]: [true, true], [OP.DJN]: [true, true],
  [OP.SEQ]: [true, true], [OP.SNE]: [true, true], [OP.SLT]: [true, true], [OP.SPL]: [true, false],
  [OP.NOP]: [false, false], [OP.WAIT]: [true, false], [OP.RND]: [true, true],
};

export class MiniSim {
  constructor(host, demo, lang) {
    this.host = host;
    this.demo = demo;
    this.lang = lang;
    this.T = TX[lang] || TX.en;
    this.timer = null;
    const T = this.T;
    host.innerHTML = `
      <div class="mini">
        <div class="mini-grid"></div>
        <div class="mini-legend">
          <span><i class="lg lg-a"></i>${T.legendA}</span><span><i class="lg lg-b"></i>${T.legendB}</span>
          <span><i class="lg lg-pc">▶</i>${T.legendPc}</span><span><i class="lg lg-t"></i>${T.legendTarget}</span>
        </div>
        <div class="mini-detail"></div>
        <div class="mini-queue"></div>
        <div class="mini-explain"></div>
        <div class="row mini-ctrl" ${demo.noSteps ? 'hidden' : ''}>
          <button class="btn small" data-mini="reset">⟲ ${T.reset}</button>
          <button class="btn small primary" data-mini="step">⏭ ${T.step}</button>
          <button class="btn small" data-mini="auto">▶ ${T.auto}</button>
        </div>
      </div>`;
    this.grid = host.querySelector('.mini-grid');
    this.detailEl = host.querySelector('.mini-detail');
    this.queueEl = host.querySelector('.mini-queue');
    this.explainEl = host.querySelector('.mini-explain');
    host.querySelector('[data-mini=reset]').onclick = () => this.reset();
    host.querySelector('[data-mini=step]').onclick = () => { this.stopAuto(); this.step(); };
    this.autoBtn = host.querySelector('[data-mini=auto]');
    this.autoBtn.onclick = () => (this.timer ? this.stopAuto() : this.startAuto());
    this.grid.addEventListener('click', (e) => {
      const c = e.target.closest('[data-addr]');
      if (!c) return;
      this.selected = +c.dataset.addr;
      this.render();
    });
    this.detailEl.addEventListener('click', (e) => { if (e.target.closest('[data-follow]')) { this.selected = null; this.render(); } });
    this.reset();
  }

  reset() {
    this.stopAuto();
    const progs = this.demo.programs.map((p) => assemble(p.code[this.lang] || p.code.en, { coreSize: MINI }));
    this.labels = new Map();
    this.arena = new Arena({ coreSize: MINI, minDistance: 0, maxCycles: 5000, seed: 7 });
    const names = this.lang === 'de' ? ['Blau', 'Pink'] : ['Blue', 'Pink'];
    this.arena.load(progs.map((program, i) => ({ name: names[i], color: PLAYER_COLORS[i], program })), this.demo.programs.map((p) => p.start));
    progs.forEach((pr, i) => pr.labelAt.forEach((ls, k) => { if (ls.length) this.labels.set((this.demo.programs[i].start + k) % MINI, ls.join(', ')); }));
    this.changed = new Map();
    this.lastPc = -1;
    this.selected = this.demo.select ?? null;
    this.explainEl.innerHTML = this.demo.noSteps ? this.T.startNoSteps : this.T.start;
    this.render();
  }

  startAuto() {
    this.timer = setInterval(() => { if (!this.step()) this.stopAuto(); }, 800);
    this.autoBtn.textContent = `❚❚ ${this.T.stop}`;
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.autoBtn) this.autoBtn.textContent = `▶ ${this.T.auto}`;
  }

  destroy() { this.stopAuto(); }

  who(p) { return `<b style="color:${p.color}">${esc(p.name)}</b>`; }

  cellRef(addr) {
    return `${addr}${this.labels.has(addr) ? ` <i>(${esc(this.labels.get(addr))})</i>` : ''}`;
  }

  /** Where a field points and how that is calculated (without side effects). */
  resolveField(pc, mode, value) {
    const a = this.arena;
    const n = a.size;
    const off = signed(value, n);
    if (mode === MODE.IMM) return { addr: pc, text: this.T.imm(off) };
    const t = (pc + value) % n;
    if (mode === MODE.DIR) return { addr: t, text: this.T.dir(plusMinus(pc, off), this.cellRef(t)) };
    const bvT = mode === MODE.DEC ? (a.bv[t] - 1 + n) % n : a.bv[t];
    const addr = (t + bvT) % n;
    const note = mode === MODE.DEC ? this.T.decNote : mode === MODE.INC ? this.T.incNote : '';
    return { addr, ptr: t, text: this.T.ind(plusMinus(pc, off), this.cellRef(t), signed(bvT, n), this.cellRef(addr), note) };
  }

  /** Executes one instruction and explains it line by line. Returns false when the match is over. */
  step() {
    const a = this.arena;
    if (a.finished) return false;
    const T = this.T;
    const n = a.size;
    const p = a.players[a.turn];
    const q = p.queue;
    const pc = q.pc[q.head];
    const sleep = q.sleep[q.head];
    const op = a.op[pc], am = a.am[pc], av = a.av[pc], bm = a.bm[pc], bv = a.bv[pc];
    const [useA, useB] = USES[op];
    const A = this.resolveField(pc, am, av);
    const B = this.resolveField(pc, bm, bv);
    const beforeA = a.cell(A.addr), beforeB = a.cell(B.addr);
    const countBefore = q.count;
    const snap = { op: a.op.slice(), av: a.av.slice(), bv: a.bv.slice() };

    a.tick();

    // which fields changed?
    this.changed = new Map();
    for (let i = 0; i < n; i++) {
      const f = { op: a.op[i] !== snap.op[i], a: a.av[i] !== snap.av[i], b: a.bv[i] !== snap.bv[i] };
      if (f.op || f.a || f.b) this.changed.set(i, f.op ? { op: true, a: true, b: true } : f);
    }
    this.lastPc = pc;

    const lines = [`<div class="ex-head">${T.turn(this.who(p), pc)} <code class="ex-ins"><span class="op-${OP_INFO[OP_NAMES[op]].group}">${OP_NAMES[op]}</span> <span class="fa">${fieldText(am, av)}</span>, <span class="fb">${fieldText(bm, bv)}</span></code></div>`];
    const ul = [];
    let died = false;
    if (sleep > 0) ul.push(T.sleeping(sleep));
    else {
      if (op !== OP.DAT && op !== OP.NOP) {
        ul.push(`<span class="fa">${T.fa}</span> <code>${fieldText(am, av)}</code> → ${useA ? A.text : `<i>${T.unused}</i>`}`);
        ul.push(`<span class="fb">${T.fb}</span> <code>${fieldText(bm, bv)}</code> → ${useB ? B.text : `<i>${T.unused}</i>`}`);
      }
      const Ar = this.cellRef(A.addr), Br = this.cellRef(B.addr);
      let res = '';
      switch (op) {
        case OP.DAT: res = T.dat; died = true; break;
        case OP.MOV: res = am === MODE.IMM ? T.movImm(signed(av, n), Br) : T.mov(Ar, Br); break;
        case OP.ADD: case OP.SUB:
          res = am === MODE.IMM ? T.addImm(signed(av, n), Br, signed(beforeB.bv, n), signed(a.bv[B.addr], n), op === OP.SUB) : T.add(Ar, Br, op === OP.SUB);
          break;
        case OP.JMP: res = T.jmp(Ar); break;
        case OP.JMZ: res = T.jmz(Br, signed(beforeB.bv, n), beforeB.bv === 0); break;
        case OP.JMN: res = T.jmn(Br, signed(beforeB.bv, n), beforeB.bv !== 0); break;
        case OP.DJN: res = T.djn(Br, signed(beforeB.bv, n), signed(a.bv[B.addr], n), a.bv[B.addr] !== 0); break;
        case OP.SEQ: case OP.SNE: {
          const x = beforeA, y = beforeB;
          const eq = am === MODE.IMM ? av === y.bv : x.op === y.op && x.am === y.am && x.av === y.av && x.bm === y.bm && x.bv === y.bv;
          res = T.cmp(Ar, Br, eq, op === OP.SEQ ? eq : !eq);
          break;
        }
        case OP.SLT: {
          const x = am === MODE.IMM ? av : beforeA.bv;
          res = T.slt(signed(x, n), signed(beforeB.bv, n), x < beforeB.bv);
          break;
        }
        case OP.SPL: res = q.count > countBefore ? T.spl(A.addr, q.count) : T.splFull; break;
        case OP.NOP: res = T.nop; break;
        case OP.WAIT: res = T.wait(am === MODE.IMM ? av : beforeA.bv); break;
        case OP.RND: res = T.rnd(a.bv[B.addr], Br); break;
        default: break;
      }
      ul.push(`<b>${T.result}</b> ${res}`);
      if (died && !p.alive) ul.push(T.out(this.who(p)));
    }
    if (!died && q.count) {
      const contIdx = op === OP.SPL && sleep === 0 && q.count > countBefore ? q.count - 2 : q.count - 1;
      const next = q.pc[(q.head + contIdx) % q.cap];
      const why = sleep > 0 ? T.whyStay : next === (pc + 1) % n ? T.whyNext : next === (pc + 2) % n && (op === OP.SEQ || op === OP.SNE || op === OP.SLT) ? T.whySkip : T.whyJump;
      ul.push(T.newPc(this.cellRef(next), why));
    }
    if (a.finished && a.result.winner != null) ul.push(T.winner(this.who(a.players[a.result.winner])));
    else if (a.players.length > 1 && !a.finished) ul.push(T.nextTurn(this.who(a.players[a.turn])));
    this.explainEl.innerHTML = lines.join('') + `<ul class="ex-list">${ul.map((l) => `<li>${l}</li>`).join('')}</ul>`;
    this.render();
    return !a.finished;
  }

  /** The cell shown in the detail panel: pinned by a click, otherwise the next PC. */
  detailAddr() {
    if (this.selected != null) return this.selected;
    const a = this.arena;
    const p = a.players[a.turn];
    return p && p.alive && p.queue.count ? p.queue.pc[p.queue.head] : 0;
  }

  renderDetail(addr) {
    const a = this.arena;
    const T = this.T;
    const n = a.size;
    const op = a.op[addr], am = a.am[addr], av = a.av[addr], bm = a.bm[addr], bv = a.bv[addr];
    const name = OP_NAMES[op];
    const label = this.labels.get(addr);
    const heads = [];
    a.players.forEach((p) => { if (p.alive && p.queue.count && p.queue.pc[p.queue.head] === addr) heads.push(p); });
    const A = this.resolveField(addr, am, av);
    const B = this.resolveField(addr, bm, bv);
    const [useA, useB] = USES[op];
    const opInfo = this.lang === 'de' ? DE_OPS[name] : EN_OPS[name];
    let rows;
    if (op === OP.DAT) {
      rows = `<p class="det-note">${T.detDat}</p>
        <div class="det-row"><span class="fa">${T.fa}</span><code>${fieldText(am, av)}</code><span>${T.detNum(signed(av, n))}</span></div>
        <div class="det-row"><span class="fb">${T.fb}</span><code>${fieldText(bm, bv)}</code><span>${T.detNum(signed(bv, n))}</span></div>`;
    } else {
      rows = `<div class="det-row"><span class="det-op">${T.op}</span><code class="op-${OP_INFO[name].group}">${name}</code><span>${opInfo}</span></div>
        <div class="det-row"><span class="fa">${T.fa}</span><code>${fieldText(am, av)}</code><span>${useA ? A.text : `<i>${T.unused}</i>`}</span></div>
        <div class="det-row"><span class="fb">${T.fb}</span><code>${fieldText(bm, bv)}</code><span>${useB ? B.text : `<i>${T.unused}</i>`}</span></div>`;
      const sum = T.sum[name];
      if (sum) rows += `<p class="det-sum">${sum(useA && am === MODE.IMM ? signed(av, n) : `${T.cell} ${this.cellRef(A.addr)}`, `${T.cell} ${this.cellRef(B.addr)}`, am === MODE.IMM)}</p>`;
    }
    this.detailEl.innerHTML = `
      <div class="det-head"><b>${T.detTitle(addr, label && esc(label))}</b>
        ${this.selected != null && !this.demo.noSteps ? `<button class="btn small ghost" data-follow>↺ ${T.follow}</button>` : ''}</div>
      ${heads.map((p) => `<p class="det-pc">${T.detPc(this.who(p))}</p>`).join('')}
      ${rows}`;
    return { a: useA && am !== MODE.IMM ? A.addr : -1, b: useB && bm !== MODE.IMM ? B.addr : -1 };
  }

  render() {
    const a = this.arena;
    const n = a.size;
    const detail = this.detailAddr();
    const targets = this.renderDetail(detail);
    const heads = new Map();
    a.players.forEach((p) => {
      if (!p.alive) return;
      p.queue.forEach((pc, s, k) => { if (!heads.has(pc)) heads.set(pc, { p, first: k === 0 && a.turn === p.id }); });
    });
    let html = '';
    for (let i = 0; i < n; i++) {
      const owner = a.owner[i];
      const col = owner >= 0 ? a.players[owner].color : '';
      const op = a.op[i];
      const name = OP_NAMES[op];
      const h = heads.get(i);
      const ch = this.changed.get(i);
      const cls = ['mini-cell'];
      if (owner >= 0) cls.push('owned');
      if (op === OP.DAT && owner >= 0) cls.push('dat');
      if (ch) cls.push('touched');
      if (i === this.lastPc) cls.push('ran');
      if (i === detail) cls.push('selected');
      if (h) cls.push('has-pc');
      if (h && h.first) cls.push('pc-next');
      const style = [col ? `--c:${col}` : '', h ? `--pcc:${h.p.color}` : ''].filter(Boolean).join(';');
      const tags = [];
      if (i === targets.a) tags.push('<span class="tgt tgt-a">A→</span>');
      if (i === targets.b) tags.push('<span class="tgt tgt-b">B→</span>');
      html += `<div class="${cls.join(' ')}" style="${style}" data-addr="${i}">
        <div class="mini-top"><span class="mini-adr">${h ? '<span class="mini-pc">▶</span>' : ''}${i}</span>${this.labels.has(i) ? `<span class="mini-lbl">${esc(this.labels.get(i))}</span>` : ''}</div>
        <div class="mini-op op-${OP_INFO[name].group}${ch && ch.op ? ' chg' : ''}">${name}</div>
        <div class="mini-fields"><span class="fa${ch && ch.a ? ' chg' : ''}">${fieldText(a.am[i], a.av[i])}</span><span class="fb${ch && ch.b ? ' chg' : ''}">${fieldText(a.bm[i], a.bv[i])}</span></div>
        ${tags.length ? `<div class="tgts">${tags.join('')}</div>` : ''}
      </div>`;
    }
    this.grid.innerHTML = html;
    this.queueEl.innerHTML = a.players.map((p) => {
      const items = [];
      p.queue.forEach((pc) => items.push(pc));
      const pcs = p.alive ? items.map((x, k) => `<span class="${k === 0 ? 'q-first' : ''}">${x}</span>`).join(' → ') : '☠';
      return `<span class="mini-q"><b style="color:${p.color}">${esc(p.name)}</b> · ${this.T.pc}: <b>${pcs}</b>${items.length > 1 ? ` <small>(${this.T.queue(items.length)})</small>` : ''}</span>`;
    }).join('');
  }
}

const EN_OPS = {
  DAT: 'only data', MOV: 'copy', ADD: 'add', SUB: 'subtract', JMP: 'jump', JMZ: 'jump if zero', JMN: 'jump if not zero',
  DJN: 'count down and jump', SEQ: 'skip if equal', SNE: 'skip if different', SLT: 'skip if smaller', SPL: 'split: new process',
  NOP: 'do nothing', WAIT: 'wait', RND: 'roll the dice',
};
const DE_OPS = {
  DAT: 'nur Daten', MOV: 'kopieren', ADD: 'dazuzählen', SUB: 'abziehen', JMP: 'springen', JMZ: 'springen, wenn 0', JMN: 'springen, wenn nicht 0',
  DJN: 'herunterzählen und springen', SEQ: 'überspringen, wenn gleich', SNE: 'überspringen, wenn verschieden', SLT: 'überspringen, wenn kleiner', SPL: 'teilen: neuer Prozess',
  NOP: 'nichts tun', WAIT: 'warten', RND: 'würfeln',
};
