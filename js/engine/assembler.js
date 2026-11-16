// Darwin's Heap – Assembler für Heapcode
//
// Syntax je Zeile:   [label[:]] BEFEHL [A-Operand [, B-Operand]]   ; Kommentar
// Direktiven:        name EQU ausdruck   |   ORG label   |   END [label]
// Meta-Kommentare:   ;name …   ;author …   ;strategy …
// Ausdrücke:         Zahlen, Labels, + - * / % und Klammern, Konstanten CORESIZE, MAXPROCESSES, MAXCYCLES, MAXLENGTH

import { OP, OP_INFO, OP_ALIASES, MODE, MODE_CHARS, normalize } from './isa.js';

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DIRECTIVES = new Set(['EQU', 'ORG', 'END']);

function opName(word) {
  const up = word.toUpperCase();
  if (up in OP) return up;
  if (up in OP_ALIASES) return OP_ALIASES[up];
  return null;
}

class AsmError extends Error {}

// ---------- Ausdrucksauswertung ----------
function tokenizeExpr(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < text.length && /[0-9]/.test(text[j])) j++;
      tokens.push({ t: 'num', v: parseInt(text.slice(i, j), 10) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < text.length && /[A-Za-z0-9_]/.test(text[j])) j++;
      tokens.push({ t: 'id', v: text.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/%()'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    throw new AsmError(`Unerwartetes Zeichen „${c}“ im Ausdruck`);
  }
  return tokens;
}

function evaluate(text, resolve) {
  const tk = tokenizeExpr(text);
  if (tk.length === 0) throw new AsmError('Leerer Ausdruck');
  let pos = 0;
  const peek = () => tk[pos];
  const take = () => tk[pos++];
  function primary() {
    const t = take();
    if (!t) throw new AsmError('Ausdruck endet unerwartet');
    if (t.t === 'num') return t.v;
    if (t.t === 'id') return resolve(t.v);
    if (t.t === 'op' && t.v === '(') {
      const v = expr();
      const close = take();
      if (!close || close.v !== ')') throw new AsmError('Schließende Klammer fehlt');
      return v;
    }
    throw new AsmError(`Unerwartetes „${t.v}“ im Ausdruck`);
  }
  function unary() {
    const t = peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) { take(); const v = unary(); return t.v === '-' ? -v : v; }
    return primary();
  }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || !'*/%'.includes(t.v)) return v;
      take();
      const r = unary();
      if ((t.v === '/' || t.v === '%') && r === 0) throw new AsmError('Division durch 0');
      v = t.v === '*' ? v * r : t.v === '/' ? Math.trunc(v / r) : v % r;
    }
  }
  function expr() {
    let v = term();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || (t.v !== '+' && t.v !== '-')) return v;
      take();
      const r = term();
      v = t.v === '+' ? v + r : v - r;
    }
  }
  const v = expr();
  if (pos < tk.length) throw new AsmError(`Überzähliges „${tk[pos].v}“ im Ausdruck`);
  return v;
}

function splitOperands(text) {
  const parts = [];
  let depth = 0, cur = '';
  for (const c of text) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '' || parts.length > 0) parts.push(cur.trim());
  return parts;
}

function parseOperand(text) {
  if (text === '') throw new AsmError('Leerer Operand');
  const idx = MODE_CHARS.indexOf(text[0]);
  if (idx >= 0) return { mode: idx, expr: text.slice(1).trim() || '0' };
  return { mode: MODE.DIR, expr: text };
}

/**
 * Übersetzt Quelltext in Befehle.
 * @returns {{ok:boolean, errors:{line:number,msg:string}[], warnings:{line:number,msg:string}[],
 *   instructions:{op,am,av,bm,bv,line}[], org:number, name:string, author:string, strategy:string}}
 */
export function assemble(source, options = {}) {
  const coreSize = options.coreSize ?? 4000;
  const maxLength = options.maxLength ?? 100;
  const constants = {
    CORESIZE: coreSize,
    MAXLENGTH: maxLength,
    MAXPROCESSES: options.maxProcesses ?? 1000,
    MAXCYCLES: options.maxCycles ?? coreSize * 20,
  };

  const errors = [];
  const warnings = [];
  const meta = { name: '', author: '', strategy: '' };
  const labels = new Map();       // name(upper) -> index
  const equs = new Map();         // name(upper) -> {expr, line}
  const pending = [];             // {op, operands, line, index}
  let pendingLabels = [];
  let orgExpr = null;

  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');

  // ---------- Durchgang 1: Zeilen zerlegen, Labels sammeln ----------
  for (let ln = 0; ln < lines.length; ln++) {
    const lineNo = ln + 1;
    let raw = lines[ln];
    const semi = raw.indexOf(';');
    if (semi >= 0) {
      const comment = raw.slice(semi + 1);
      const m = /^\s*(name|author|strategy)\b\s*:?\s*(.*)$/i.exec(comment);
      if (m && raw.slice(0, semi).trim() === '') {
        const key = m[1].toLowerCase();
        const val = m[2].trim();
        meta[key] = key === 'strategy' && meta.strategy ? `${meta.strategy} ${val}` : val;
      }
      raw = raw.slice(0, semi);
    }
    const text = raw.trim();
    if (!text) continue;

    try {
      const words = text.split(/\s+/);
      let w = 0;
      const lineLabels = [];
      // Labels vor dem Befehl einsammeln
      while (w < words.length) {
        const word = words[w].replace(/:$/, '');
        const up = word.toUpperCase();
        if (opName(word) || DIRECTIVES.has(up)) break;
        // "name EQU ausdruck"
        if (w + 1 < words.length && words[w + 1].toUpperCase() === 'EQU') break;
        if (w > 0) {
          // Nach einem Label muss ein Befehl folgen
          const culprit = IDENT_RE.test(word) ? words[w] : words[w - 1];
          throw new AsmError(`Unbekannter Befehl „${culprit.replace(/:$/, '')}“`);
        }
        if (!IDENT_RE.test(word)) throw new AsmError(`Unbekannter Befehl „${words[w]}“`);
        lineLabels.push(word);
        w++;
      }
      if (w >= words.length) { pendingLabels.push(...lineLabels.map((l) => ({ l, lineNo }))); continue; }

      // EQU
      if (w + 1 < words.length && words[w + 1].toUpperCase() === 'EQU') {
        const name = words[w];
        if (!IDENT_RE.test(name)) throw new AsmError(`Ungültiger Name „${name}“ für EQU`);
        const expr = words.slice(w + 2).join(' ');
        if (!expr) throw new AsmError('EQU braucht einen Wert');
        const up = name.toUpperCase();
        if (equs.has(up) || labels.has(up) || up in constants) throw new AsmError(`„${name}“ ist schon definiert`);
        equs.set(up, { expr, line: lineNo });
        continue;
      }

      const head = words[w].toUpperCase();
      const rest = words.slice(w + 1).join(' ').trim();

      for (const l of [...pendingLabels, ...lineLabels.map((x) => ({ l: x, lineNo }))]) {
        const up = l.l.toUpperCase();
        if (labels.has(up) || equs.has(up) || up in constants) {
          errors.push({ line: l.lineNo, msg: `Label „${l.l}“ ist doppelt vergeben` });
        } else labels.set(up, pending.length);
      }
      pendingLabels = [];

      if (head === 'ORG') { orgExpr = { expr: rest || '0', line: lineNo }; continue; }
      if (head === 'END') { if (rest) orgExpr = { expr: rest, line: lineNo }; break; }

      const op = opName(head);
      const operands = rest ? splitOperands(rest) : [];
      pending.push({ op, operands, line: lineNo });
    } catch (e) {
      if (e instanceof AsmError) errors.push({ line: lineNo, msg: e.message });
      else throw e;
    }
  }
  // Labels am Dateiende zeigen hinter den letzten Befehl
  for (const l of pendingLabels) {
    const up = l.l.toUpperCase();
    if (!labels.has(up)) labels.set(up, pending.length);
  }

  // ---------- Durchgang 2: Operanden auswerten ----------
  const makeResolver = (index) => {
    const stack = new Set();
    const resolve = (name) => {
      const up = name.toUpperCase();
      if (labels.has(up)) return labels.get(up) - index;
      if (up in constants) return constants[up];
      if (equs.has(up)) {
        if (stack.has(up)) throw new AsmError(`EQU „${name}“ verweist auf sich selbst`);
        stack.add(up);
        const v = evaluate(equs.get(up).expr, resolve);
        stack.delete(up);
        return v;
      }
      throw new AsmError(`Unbekanntes Label „${name}“`);
    };
    return resolve;
  };

  const instructions = [];
  pending.forEach((p, index) => {
    try {
      const info = OP_INFO[p.op];
      const n = p.operands.length;
      if (n < info.min) throw new AsmError(`${p.op} braucht ${info.min === 2 ? 'zwei Operanden' : 'einen Operanden'}`);
      if (n > info.max) throw new AsmError(`${p.op} hat zu viele Operanden`);
      let a = { mode: MODE.IMM, expr: '0' };
      let b = { mode: MODE.IMM, expr: '0' };
      if (p.op === 'DAT' && n === 1) b = parseOperand(p.operands[0]);
      else {
        if (n >= 1) a = parseOperand(p.operands[0]);
        if (n >= 2) b = parseOperand(p.operands[1]);
      }
      const resolve = makeResolver(index);
      const av = normalize(evaluate(a.expr, resolve), coreSize);
      const bv = normalize(evaluate(b.expr, resolve), coreSize);
      instructions.push({ op: OP[p.op], am: a.mode, av, bm: b.mode, bv, line: p.line });
      if ((p.op === 'JMP' || p.op === 'SPL') && a.mode === MODE.IMM) {
        warnings.push({ line: p.line, msg: `${p.op} mit # springt auf den eigenen Befehl – gemeint war vermutlich eine Adresse ohne #` });
      }
    } catch (e) {
      if (e instanceof AsmError) errors.push({ line: p.line, msg: e.message });
      else throw e;
    }
  });

  let org = 0;
  if (orgExpr) {
    try { org = normalize(evaluate(orgExpr.expr, makeResolver(0)), Math.max(1, instructions.length)); }
    catch (e) { if (e instanceof AsmError) errors.push({ line: orgExpr.line, msg: e.message }); else throw e; }
  } else if (labels.has('START')) {
    org = labels.get('START');
  }

  if (pending.length === 0 && errors.length === 0) errors.push({ line: 1, msg: 'Das Programm enthält keinen Befehl' });
  if (instructions.length > maxLength) errors.push({ line: instructions[maxLength].line, msg: `Zu lang: höchstens ${maxLength} Befehle erlaubt` });
  if (org >= instructions.length && instructions.length > 0) org = 0;

  errors.sort((x, y) => x.line - y.line);
  return { ok: errors.length === 0, errors, warnings, instructions, org, length: instructions.length, ...meta };
}
