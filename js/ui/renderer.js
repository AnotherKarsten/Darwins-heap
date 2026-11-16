// Zeichnet die Speicher-Arena auf ein Canvas.
// Jede Zelle wird zunächst als ein Pixel in ein kleines Offscreen-Bild geschrieben
// und dann pixelgenau hochskaliert – das ist auch bei 8000 Zellen und 60 FPS flott.

import { OP } from '../engine/isa.js';

export const PLAYER_COLORS = ['#4cc9f0', '#f72585', '#ffd166', '#06d6a0'];
const BG = [14, 19, 29];
const EMPTY = [20, 26, 38];

export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function buildGradient(stops, steps = 256) {
  const lut = new Uint8ClampedArray(steps * 3);
  const cols = stops.map(hexToRgb);
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (cols.length - 1);
    const k = Math.min(cols.length - 2, Math.floor(t));
    const f = t - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = cols[k][c] + (cols[k + 1][c] - cols[k][c]) * f;
  }
  return lut;
}
const HEAT = buildGradient(['#141a26', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']);
const COOL = buildGradient(['#141a26', '#0b3b5c', '#11698e', '#19a7ce', '#7be0ff', '#effcff']);

export class ArenaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.arena = null;
    this.view = 'owner';
    this.decay = 40;           // Zyklen, über die frische Schreibvorgänge verblassen
    this.showGrid = true;
    this.showHeads = true;
    this.hover = -1;
    this.selected = -1;
    this.colors = PLAYER_COLORS.map(hexToRgb);
    this.cells = document.createElement('canvas');
    this.cellsCtx = this.cells.getContext('2d');
    this.grid = document.createElement('canvas');
    this.layoutKey = '';
    this.time = 0;
  }

  setArena(arena) {
    this.arena = arena;
    this.colors = arena.players.map((p) => hexToRgb(p.color));
    this.layoutKey = '';
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(50, Math.floor(rect.width));
    const h = Math.max(50, Math.floor(rect.height));
    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    this.computeLayout();
  }

  computeLayout() {
    const n = this.arena ? this.arena.size : 4000;
    const pad = 10;
    const W = this.w - pad * 2, H = this.h - pad * 2;
    // Größte quadratische Zellengröße finden, mit der alles hineinpasst
    let cs = Math.sqrt((W * H) / n);
    let cols, rows;
    for (; cs > 1; cs -= 0.05) {
      cols = Math.floor(W / cs);
      rows = Math.ceil(n / cols);
      if (rows * cs <= H) break;
    }
    cs = Math.max(1, cs);
    cols = Math.max(1, Math.floor(W / cs));
    rows = Math.ceil(n / cols);
    this.cs = cs;
    this.cols = cols;
    this.rows = rows;
    this.ox = Math.round((this.w - cols * cs) / 2);
    this.oy = Math.round((this.h - rows * cs) / 2);
    const key = `${n}:${cols}:${rows}:${cs}:${this.dpr}:${this.showGrid}`;
    if (key === this.layoutKey) return;
    this.layoutKey = key;
    this.cells.width = cols;
    this.cells.height = rows;
    this.image = this.cellsCtx.createImageData(cols, rows);
    this.buildGrid();
  }

  buildGrid() {
    const g = this.grid;
    const dpr = this.dpr;
    g.width = Math.ceil(this.cols * this.cs * dpr);
    g.height = Math.ceil(this.rows * this.cs * dpr);
    const ctx = g.getContext('2d');
    ctx.clearRect(0, 0, g.width, g.height);
    if (!this.showGrid || this.cs * dpr < 4) return;
    ctx.fillStyle = 'rgba(8,11,17,0.85)';
    const gap = Math.max(1, Math.round(dpr * (this.cs >= 10 ? 1.5 : 1)));
    for (let c = 0; c <= this.cols; c++) ctx.fillRect(Math.round(c * this.cs * dpr) - (c ? gap : 0), 0, gap, g.height);
    for (let r = 0; r <= this.rows; r++) ctx.fillRect(0, Math.round(r * this.cs * dpr) - (r ? gap : 0), g.width, gap);
  }

  cellAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.ox;
    const y = clientY - rect.top - this.oy;
    if (x < 0 || y < 0) return -1;
    const c = Math.floor(x / this.cs), r = Math.floor(y / this.cs);
    if (c >= this.cols || r >= this.rows) return -1;
    const i = r * this.cols + c;
    return this.arena && i < this.arena.size ? i : -1;
  }

  cellCenter(i) {
    const c = i % this.cols, r = Math.floor(i / this.cols);
    return [this.ox + (c + 0.5) * this.cs, this.oy + (r + 0.5) * this.cs];
  }

  render(now = performance.now()) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const a = this.arena;
    if (!a) return;
    this.time = now;
    this.paintCells();
    this.cellsCtx.putImageData(this.image, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const W = this.cols * this.cs, H = this.rows * this.cs;
    ctx.drawImage(this.cells, this.ox, this.oy, W, H);
    if (this.grid.width) ctx.drawImage(this.grid, this.ox, this.oy, W, H);
    if (this.showHeads) this.paintHeads();
    this.paintMarker(this.selected, '#ffd166', 2);
    this.paintMarker(this.hover, 'rgba(255,255,255,0.9)', 1.5);
  }

  paintCells() {
    const a = this.arena;
    const n = a.size;
    const data = this.image.data;
    const cycle = a.cycle;
    const decay = this.decay;
    const total = this.cols * this.rows;
    if (this.view === 'owner') {
      const colors = this.colors;
      for (let i = 0; i < total; i++) {
        const o = i * 4;
        if (i >= n) { data[o] = BG[0]; data[o + 1] = BG[1]; data[o + 2] = BG[2]; data[o + 3] = 0; continue; }
        const owner = a.owner[i];
        let r, g, b;
        if (owner < 0) { r = EMPTY[0]; g = EMPTY[1]; b = EMPTY[2]; }
        else {
          const col = colors[owner];
          const isData = a.op[i] === OP.DAT;
          const age = cycle - a.lastWrite[i];
          const fresh = age < decay ? 1 - age / decay : 0;
          let k = isData ? 0.32 : 0.7;
          k += (1 - k) * fresh;
          r = EMPTY[0] + (col[0] - EMPTY[0]) * k;
          g = EMPTY[1] + (col[1] - EMPTY[1]) * k;
          b = EMPTY[2] + (col[2] - EMPTY[2]) * k;
          if (fresh > 0) { const w = fresh * fresh * 0.55; r += (255 - r) * w; g += (255 - g) * w; b += (255 - b) * w; }
        }
        // Ausführungs-Spur
        const eage = cycle - a.lastExec[i];
        if (eage < decay) { const w = (1 - eage / decay) * 0.45; r += (255 - r) * w; g += (255 - g) * w; b += (255 - b) * w; }
        data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
      }
      return;
    }
    const counts = this.view === 'writes' ? a.writeCount : a.execCount;
    const lut = this.view === 'writes' ? HEAT : COOL;
    let max = 1;
    for (let i = 0; i < n; i++) if (counts[i] > max) max = counts[i];
    const lmax = Math.log1p(max);
    for (let i = 0; i < total; i++) {
      const o = i * 4;
      if (i >= n) { data[o + 3] = 0; continue; }
      const v = counts[i];
      const t = v === 0 ? 0 : Math.min(255, Math.round(40 + (Math.log1p(v) / lmax) * 215));
      data[o] = lut[t * 3]; data[o + 1] = lut[t * 3 + 1]; data[o + 2] = lut[t * 3 + 2]; data[o + 3] = 255;
    }
  }

  paintHeads() {
    const a = this.arena;
    const ctx = this.ctx;
    const cs = this.cs;
    const rad = Math.max(1.6, cs * 0.3);
    const pulse = 0.75 + 0.25 * Math.sin(this.time / 160);
    for (const p of a.players) {
      if (!p.alive) continue;
      const col = p.color;
      const many = p.queue.count > 80;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(1, cs * 0.12);
      if (!many) { ctx.shadowColor = col; ctx.shadowBlur = 10; }
      ctx.beginPath();
      p.queue.forEach((pc, sleep, k) => {
        const [x, y] = this.cellCenter(pc);
        const r = k === 0 ? rad * 1.25 * pulse : rad * (sleep > 0 ? 0.6 : 0.85);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }, 400);
      ctx.fill();
      if (cs >= 6) ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  paintMarker(i, color, width) {
    if (i < 0 || !this.arena || i >= this.arena.size) return;
    const c = i % this.cols, r = Math.floor(i / this.cols);
    const ctx = this.ctx;
    const cs = this.cs;
    const m = Math.max(2, cs * 0.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(this.ox + c * cs - m / 2, this.oy + r * cs - m / 2, cs + m, cs + m);
  }
}
