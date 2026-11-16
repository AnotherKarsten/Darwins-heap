// Darwin's Heap – die simulierte Speicher-Arena
//
// Der Speicher ist ein Ring aus `size` Zellen. Jede Zelle enthält einen Befehl
// (Opcode, zwei Adressierungsarten, zwei Werte). Jedes Programm besitzt eine
// Warteschlange von Prozessen. Pro Zyklus führt jedes noch lebende Programm
// genau einen Befehl seines vordersten Prozesses aus – fair im Reihum-Verfahren.

import { OP, OP_NAMES, MODE, normalize } from './isa.js';
import { createRng } from './rng.js';

export const DEFAULT_SETTINGS = Object.freeze({
  coreSize: 4000,
  maxCycles: 0,          // 0 = automatisch (coreSize * 20)
  maxProcesses: 1000,
  maxLength: 100,
  minDistance: 100,
  seed: 1,
});

const NEVER = -1e9;
const MAX_WAIT = 1000;

class ProcessQueue {
  constructor(capacity) {
    this.cap = capacity;
    this.pc = new Int32Array(capacity);
    this.sleep = new Int32Array(capacity);
    this.head = 0;
    this.count = 0;
  }
  push(pc, sleep = 0) {
    const i = (this.head + this.count) % this.cap;
    this.pc[i] = pc;
    this.sleep[i] = sleep;
    this.count++;
  }
  shift() {
    const i = this.head;
    this.head = (this.head + 1) % this.cap;
    this.count--;
    return i;
  }
  /** Ruft fn(pc, sleep, position) für bis zu `limit` Prozesse auf. */
  forEach(fn, limit = Infinity) {
    const n = Math.min(this.count, limit);
    for (let k = 0; k < n; k++) {
      const i = (this.head + k) % this.cap;
      fn(this.pc[i], this.sleep[i], k);
    }
  }
}

export class Arena {
  constructor(settings = {}) {
    const s = { ...DEFAULT_SETTINGS, ...settings };
    this.settings = s;
    this.size = s.coreSize;
    this.maxCycles = s.maxCycles > 0 ? s.maxCycles : s.coreSize * 20;
    this.maxProcesses = s.maxProcesses;
    this.seed = s.seed >>> 0;
    this.rng = createRng(this.seed);
    this.placeRng = createRng(this.seed ^ 0xa5a5a5a5);

    const n = this.size;
    this.op = new Uint8Array(n);
    this.am = new Uint8Array(n);
    this.av = new Int32Array(n);
    this.bm = new Uint8Array(n);
    this.bv = new Int32Array(n);
    this.owner = new Int8Array(n).fill(-1);
    this.lastWrite = new Int32Array(n).fill(NEVER);
    this.lastExec = new Int32Array(n).fill(NEVER);
    this.execOwner = new Int8Array(n).fill(-1);
    this.writeCount = new Uint32Array(n);
    this.execCount = new Uint32Array(n);
    // Leerer Speicher = DAT #0, #0
    this.am.fill(MODE.IMM);
    this.bm.fill(MODE.IMM);

    this.players = [];
    this.cycle = 0;
    this.turn = 0;
    this.finished = false;
    this.result = null;
    this.events = [];
    this.listeners = new Set();
    this.history = { interval: 1, cycles: [], procs: [], cells: [] };
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  emit(ev) {
    ev.cycle = this.cycle;
    this.events.push(ev);
    for (const fn of this.listeners) fn(ev);
  }

  /**
   * Lädt Programme an zufällige, ausreichend weit entfernte Stellen.
   * @param {{name:string,color:string,program:{instructions:any[],org:number}}[]} warriors
   */
  load(warriors) {
    const n = this.size;
    const lengths = warriors.map((w) => w.program.instructions.length);
    const starts = this.placeWarriors(lengths);
    warriors.forEach((w, id) => {
      const start = starts[id];
      const player = {
        id, name: w.name || `Programm ${id + 1}`, color: w.color, start,
        length: lengths[id], alive: true, deathCycle: null,
        queue: new ProcessQueue(this.maxProcesses + 2),
        cells: 0, maxProcs: 1, executed: 0, spawns: 0, splFails: 0, waits: 0,
        kills: new Uint32Array(warriors.length), selfKills: 0, deaths: 0,
        opCounts: new Uint32Array(OP_NAMES.length), writes: 0,
        meta: w.meta || {},
      };
      this.players.push(player);
      w.program.instructions.forEach((ins, k) => {
        const a = (start + k) % n;
        this.op[a] = ins.op; this.am[a] = ins.am; this.av[a] = ins.av;
        this.bm[a] = ins.bm; this.bv[a] = ins.bv;
        this.setOwner(a, id);
        this.lastWrite[a] = 0;
      });
      player.queue.push((start + w.program.org) % n);
    });
    this.sample(true);
    this.emit({ type: 'start', players: this.players.map((p) => p.id) });
    return starts;
  }

  placeWarriors(lengths) {
    const n = this.size;
    const k = lengths.length;
    const gap = this.settings.minDistance;
    const total = lengths.reduce((s, l) => s + l + gap, 0);
    if (total > n) throw new Error('Der Speicher ist zu klein für diese Programme.');
    const dist = (a, b) => { const d = Math.abs(a - b) % n; return Math.min(d, n - d); };
    for (let attempt = 0; attempt < 2000; attempt++) {
      const starts = [];
      let ok = true;
      for (let i = 0; i < k && ok; i++) {
        const s = this.placeRng.int(n);
        for (let j = 0; j < i; j++) {
          // Abstand zwischen den Bereichen (Start bis Ende) prüfen
          const need = Math.max(lengths[i], lengths[j]) + gap;
          if (dist(s, starts[j]) < need) { ok = false; break; }
        }
        starts.push(s);
      }
      if (ok) return starts;
    }
    // Rückfall: gleichmäßig verteilen
    const offset = this.placeRng.int(n);
    return lengths.map((_, i) => (offset + Math.floor((i * n) / k)) % n);
  }

  setOwner(addr, id) {
    const old = this.owner[addr];
    if (old === id) return;
    if (old >= 0) this.players[old].cells--;
    if (id >= 0) this.players[id].cells++;
    this.owner[addr] = id;
  }

  markWrite(addr, id) {
    this.setOwner(addr, id);
    this.lastWrite[addr] = this.cycle;
    this.writeCount[addr]++;
    this.players[id].writes++;
  }

  get alivePlayers() { return this.players.filter((p) => p.alive); }

  /** Führt genau einen Befehl des Programms aus, das gerade am Zug ist. */
  tick() {
    if (this.finished) return;
    const players = this.players;
    const p = players[this.turn];
    if (p.alive) this.execute(p);

    // Nächstes lebendes Programm finden
    let next = this.turn;
    let wrapped = false;
    for (let k = 0; k < players.length; k++) {
      next++;
      if (next >= players.length) { next = 0; wrapped = true; }
      if (players[next].alive) break;
    }
    this.turn = next;
    if (wrapped) {
      this.cycle++;
      if (this.cycle % this.history.interval === 0) this.sample();
    }
    this.checkEnd();
  }

  /** Ein voller Zyklus: jedes lebende Programm ist einmal dran. */
  step() {
    if (this.finished) return;
    const c = this.cycle;
    let guard = this.players.length + 1;
    while (!this.finished && this.cycle === c && guard-- > 0) this.tick();
  }

  run(cycles) {
    const target = this.cycle + cycles;
    while (!this.finished && this.cycle < target) this.tick();
  }

  runToEnd() {
    while (!this.finished) this.tick();
    return this.result;
  }

  checkEnd() {
    if (this.finished) return;
    const alive = this.alivePlayers;
    const multi = this.players.length > 1;
    if ((multi && alive.length <= 1) || alive.length === 0) {
      this.finish(alive.length === 1 ? 'elimination' : 'extinction');
    } else if (this.cycle >= this.maxCycles) {
      this.finish('timeout');
    }
  }

  finish(reason) {
    this.finished = true;
    const alive = this.alivePlayers;
    const multi = this.players.length > 1;
    this.result = {
      reason,
      winner: multi && alive.length === 1 ? alive[0].id : null,
      survivors: alive.map((p) => p.id),
      cycles: this.cycle,
    };
    this.sample(true);
    this.emit({ type: 'finish', ...this.result });
  }

  sample(force = false) {
    const h = this.history;
    if (!force && h.cycles.length && h.cycles[h.cycles.length - 1] === this.cycle) return;
    h.cycles.push(this.cycle);
    h.procs.push(this.players.map((p) => p.queue.count));
    h.cells.push(this.players.map((p) => p.cells));
    if (h.cycles.length > 400) {
      const keep = (_, i) => i % 2 === 0 || i === h.cycles.length - 1;
      h.cycles = h.cycles.filter(keep);
      h.procs = h.procs.filter(keep);
      h.cells = h.cells.filter(keep);
      h.interval *= 2;
    }
  }

  resolve(mode, value, pc, id) {
    if (mode === MODE.IMM) return pc;
    const n = this.size;
    const t = (pc + value) % n;
    if (mode === MODE.DIR) return t;
    if (mode === MODE.IND) return (t + this.bv[t]) % n;
    if (mode === MODE.DEC) {
      this.bv[t] = this.bv[t] === 0 ? n - 1 : this.bv[t] - 1;
      this.markWrite(t, id);
      return (t + this.bv[t]) % n;
    }
    // MODE.INC
    const addr = (t + this.bv[t]) % n;
    this.bv[t] = this.bv[t] === n - 1 ? 0 : this.bv[t] + 1;
    this.markWrite(t, id);
    return addr;
  }

  execute(p) {
    const n = this.size;
    const q = p.queue;
    const slot = q.shift();
    const pc = q.pc[slot];
    const sleep = q.sleep[slot];
    if (sleep > 0) { q.push(pc, sleep - 1); p.waits++; return; }

    const id = p.id;
    this.lastExec[pc] = this.cycle;
    this.execOwner[pc] = id;
    this.execCount[pc]++;
    p.executed++;

    const op = this.op[pc];
    p.opCounts[op]++;
    const am = this.am[pc], bm = this.bm[pc];
    const aAddr = this.resolve(am, this.av[pc], pc, id);
    // Momentaufnahme der A-Zelle (nach eventuellen Nebenwirkungen)
    const sOp = this.op[aAddr], sAm = this.am[aAddr], sAv = this.av[aAddr], sBm = this.bm[aAddr], sBv = this.bv[aAddr];
    const bAddr = this.resolve(bm, this.bv[pc], pc, id);
    const next = (pc + 1) % n;

    switch (op) {
      case OP.DAT: {
        p.deaths++;
        const killer = this.owner[pc];
        if (killer >= 0) {
          if (killer === id) p.selfKills++;
          else this.players[killer].kills[id]++;
        }
        if (q.count === 0) this.eliminate(p, killer);
        return;
      }
      case OP.MOV:
        if (am === MODE.IMM) this.bv[bAddr] = sAv;
        else {
          this.op[bAddr] = sOp; this.am[bAddr] = sAm; this.av[bAddr] = sAv;
          this.bm[bAddr] = sBm; this.bv[bAddr] = sBv;
        }
        this.markWrite(bAddr, id);
        q.push(next);
        return;
      case OP.ADD:
      case OP.SUB: {
        const sign = op === OP.ADD ? 1 : -1;
        if (am === MODE.IMM) this.bv[bAddr] = normalize(this.bv[bAddr] + sign * sAv, n);
        else {
          this.av[bAddr] = normalize(this.av[bAddr] + sign * sAv, n);
          this.bv[bAddr] = normalize(this.bv[bAddr] + sign * sBv, n);
        }
        this.markWrite(bAddr, id);
        q.push(next);
        return;
      }
      case OP.JMP:
        q.push(aAddr);
        return;
      case OP.JMZ:
        q.push(this.bv[bAddr] === 0 ? aAddr : next);
        return;
      case OP.JMN:
        q.push(this.bv[bAddr] !== 0 ? aAddr : next);
        return;
      case OP.DJN: {
        this.bv[bAddr] = this.bv[bAddr] === 0 ? n - 1 : this.bv[bAddr] - 1;
        this.markWrite(bAddr, id);
        q.push(this.bv[bAddr] !== 0 ? aAddr : next);
        return;
      }
      case OP.SEQ:
      case OP.SNE: {
        let equal;
        if (am === MODE.IMM) equal = sAv === this.bv[bAddr];
        else {
          equal = sOp === this.op[bAddr] && sAm === this.am[bAddr] && sAv === this.av[bAddr]
            && sBm === this.bm[bAddr] && sBv === this.bv[bAddr];
        }
        const skip = op === OP.SEQ ? equal : !equal;
        q.push(skip ? (pc + 2) % n : next);
        return;
      }
      case OP.SLT: {
        const a = am === MODE.IMM ? sAv : sBv;
        q.push(a < this.bv[bAddr] ? (pc + 2) % n : next);
        return;
      }
      case OP.SPL:
        q.push(next);
        if (q.count < this.maxProcesses) {
          q.push(aAddr);
          p.spawns++;
          if (q.count > p.maxProcs) p.maxProcs = q.count;
        } else {
          if (p.splFails === 0) this.emit({ type: 'proclimit', player: id });
          p.splFails++;
        }
        return;
      case OP.NOP:
        q.push(next);
        return;
      case OP.WAIT: {
        const v = am === MODE.IMM ? sAv : sBv;
        q.push(next, Math.min(v, MAX_WAIT));
        return;
      }
      case OP.RND: {
        const range = am === MODE.IMM ? sAv : sBv;
        this.bv[bAddr] = this.rng.int(range > 0 ? range : n);
        this.markWrite(bAddr, id);
        q.push(next);
        return;
      }
      default:
        // Unbekannter Opcode verhält sich wie DAT
        if (q.count === 0) this.eliminate(p, -1);
    }
  }

  eliminate(p, killer) {
    p.alive = false;
    p.deathCycle = this.cycle;
    this.emit({ type: 'eliminated', player: p.id, by: killer });
  }

  /** Lesbare Kopie einer Zelle (für Lupe und Tooltip). */
  cell(addr) {
    const a = normalize(addr, this.size);
    return {
      addr: a, op: this.op[a], am: this.am[a], av: this.av[a], bm: this.bm[a], bv: this.bv[a],
      owner: this.owner[a], lastWrite: this.lastWrite[a], lastExec: this.lastExec[a],
      writes: this.writeCount[a], execs: this.execCount[a],
    };
  }

  /** Anzahl Prozesse je Adresse (für Tooltip/Lupe). */
  processesAt(addr) {
    let count = 0;
    for (const p of this.players) if (p.alive) p.queue.forEach((pc) => { if (pc === addr) count++; });
    return count;
  }
}
