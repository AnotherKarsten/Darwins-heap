// A lean code editor: textarea over a syntax-highlighted layer, plus line numbers.

import { OP_NAMES, OP_ALIASES, OP_INFO } from '../engine/isa.js';

const OPS = new Set([...OP_NAMES, ...Object.keys(OP_ALIASES)]);
const DIRS = new Set(['EQU', 'ORG', 'END']);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightLine(line) {
  const semi = line.indexOf(';');
  const code = semi >= 0 ? line.slice(0, semi) : line;
  const comment = semi >= 0 ? line.slice(semi) : '';
  let out = '';
  const re = /([A-Za-z_][A-Za-z0-9_]*:?)|(\d+)|([#$@<>])|(\s+)|(.)/g;
  let m;
  let first = true;
  while ((m = re.exec(code))) {
    if (m[1]) {
      const word = m[1].replace(/:$/, '');
      const up = word.toUpperCase();
      if (OPS.has(up)) {
        const grp = OP_INFO[OP_ALIASES[up] || up].group;
        out += `<span class="op-${grp}">${esc(m[1])}</span>`;
      } else if (DIRS.has(up)) out += `<span class="tok-dir">${esc(m[1])}</span>`;
      else if (first && /^\S/.test(line)) out += `<span class="tok-label">${esc(m[1])}</span>`;
      else out += esc(m[1]);
      first = false;
    } else if (m[2]) { out += `<span class="tok-num">${m[2]}</span>`; first = false; }
    else if (m[3]) { out += `<span class="tok-mode">${esc(m[3])}</span>`; first = false; }
    else out += esc(m[0]);
  }
  if (comment) {
    const meta = /^;\s*(name|author|strategy)\b/i.test(comment);
    out += `<span class="${meta ? 'tok-meta' : 'tok-com'}">${esc(comment)}</span>`;
  }
  return out;
}

export class CodeEditor {
  constructor(host, { onChange } = {}) {
    this.onChange = onChange;
    host.innerHTML = '<div class="gutter"></div><div class="area"><pre aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Source code"></textarea></div>';
    this.gutter = host.querySelector('.gutter');
    this.pre = host.querySelector('pre');
    this.ta = host.querySelector('textarea');
    this.marks = new Map();
    this.ta.addEventListener('input', () => this.refresh(true));
    this.ta.addEventListener('scroll', () => this.syncScroll());
    this.ta.addEventListener('keydown', (e) => this.onKey(e));
  }

  get value() { return this.ta.value; }
  set value(v) { this.ta.value = v; this.refresh(false); this.ta.scrollTop = 0; }

  focus() { this.ta.focus(); }

  onKey(e) {
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      this.insert(e.shiftKey ? '' : '\t');
    }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      // keep the indentation of the current line
      const { selectionStart: s, value } = this.ta;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const indent = /^[ \t]*/.exec(value.slice(lineStart, s))[0];
      const label = /^[A-Za-z_]\w*[ \t]+/.exec(value.slice(lineStart, s));
      if (indent || label) {
        e.preventDefault();
        this.insert('\n' + (indent || (label ? '\t' : '')));
      }
    }
  }

  insert(text) {
    const ta = this.ta;
    ta.focus();
    const ok = document.execCommand && document.execCommand('insertText', false, text);
    if (!ok) {
      const { selectionStart: s, selectionEnd: e, value } = ta;
      ta.value = value.slice(0, s) + text + value.slice(e);
      ta.selectionStart = ta.selectionEnd = s + text.length;
      this.refresh(true);
    }
  }

  insertLine(text) {
    const ta = this.ta;
    const { selectionStart: s, value } = ta;
    const lineEnd = value.indexOf('\n', s);
    const pos = lineEnd < 0 ? value.length : lineEnd;
    ta.selectionStart = ta.selectionEnd = pos;
    this.insert((value.length && value[pos - 1] !== '\n' ? '\n' : '') + '\t' + text);
  }

  gotoLine(line) {
    const lines = this.ta.value.split('\n');
    let pos = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) pos += lines[i].length + 1;
    this.ta.focus();
    this.ta.selectionStart = pos;
    this.ta.selectionEnd = pos + (lines[line - 1] || '').length;
    const lh = 21;
    this.ta.scrollTop = Math.max(0, (line - 4) * lh);
  }

  /** marks: Map(line -> 'err'|'warn') */
  setMarks(marks) {
    this.marks = marks;
    this.renderGutter();
  }

  refresh(fire) {
    const lines = this.ta.value.split('\n');
    this.pre.innerHTML = lines.map(highlightLine).join('\n') + '\n';
    this.lineCount = lines.length;
    this.renderGutter();
    this.syncScroll();
    if (fire && this.onChange) this.onChange(this.ta.value);
  }

  renderGutter() {
    let html = '';
    for (let i = 1; i <= (this.lineCount || 1); i++) {
      const m = this.marks.get(i);
      html += `<div${m ? ` class="${m}"` : ''}>${i}</div>`;
    }
    this.gutter.innerHTML = html;
  }

  syncScroll() {
    this.pre.scrollTop = this.ta.scrollTop;
    this.pre.scrollLeft = this.ta.scrollLeft;
    this.gutter.scrollTop = this.ta.scrollTop;
  }
}
