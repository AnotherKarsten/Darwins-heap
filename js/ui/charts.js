// Kleine Liniendiagramme ohne externe Bibliothek.

export function drawLines(canvas, history, key, colors, { percentOf = 0 } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(10, Math.floor(rect.width));
  const h = Math.max(10, Math.floor(rect.height));
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const rows = history[key];
  const xs = history.cycles;
  if (!rows || rows.length < 2) {
    ctx.fillStyle = '#5b6780';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Daten erscheinen, sobald die Partie läuft', 8, h / 2 + 4);
    return;
  }
  const pad = { l: 30, r: 6, t: 6, b: 14 };
  const xmax = Math.max(1, xs[xs.length - 1]);
  let ymax = 1;
  for (const r of rows) for (const v of r) if (v > ymax) ymax = v;
  if (percentOf) ymax = Math.max(1, Math.min(percentOf, ymax * 1.1));
  const X = (x) => pad.l + (x / xmax) * (w - pad.l - pad.r);
  const Y = (y) => h - pad.b - (y / ymax) * (h - pad.t - pad.b);

  // Gitter & Achsen
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#6b7891';
  ctx.font = '10px ui-monospace, monospace';
  for (let k = 0; k <= 2; k++) {
    const yv = (ymax * k) / 2;
    const y = Math.round(Y(yv)) + 0.5;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    const label = percentOf ? `${Math.round((yv / percentOf) * 100)}%` : fmt(yv);
    ctx.fillText(label, 2, y + 3);
  }
  ctx.fillText(fmt(xmax), w - pad.r - ctx.measureText(fmt(xmax)).width, h - 2);

  colors.forEach((col, p) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    rows.forEach((r, i) => {
      const x = X(xs[i]), y = Y(r[p] ?? 0);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Fläche
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = col;
    ctx.lineTo(X(xs[xs.length - 1]), Y(0));
    ctx.lineTo(X(xs[0]), Y(0));
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function fmt(v) {
  if (v >= 10000) return `${Math.round(v / 1000)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}
