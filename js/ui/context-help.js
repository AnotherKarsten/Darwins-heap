// Context help for the code editor: explains whatever the cursor is on
// (instruction, addressing mode, label, variable, constant, number, comment, directive).

import { OP_NAMES, OP_INFO, OP_ALIASES, MODE_CHARS } from '../engine/isa.js';
import { dict } from '../i18n/index.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const IDENT = /[A-Za-z0-9_]/;
const MODES = ['#', '$', '@', '<', '>'];

/** Built-in constants and their current values. */
export function constantValues(settings) {
  return {
    CORESIZE: settings.coreSize,
    MAXPROCESSES: settings.maxProcesses,
    MAXCYCLES: settings.maxCycles > 0 ? settings.maxCycles : settings.coreSize * 20,
    MAXLENGTH: 100,
  };
}

export const CONST_INFO = {
  en: {
    CORESIZE: 'Number of cells in memory. Addresses wrap around after it.',
    MAXPROCESSES: 'How many processes one program may have at most. SPL does nothing beyond that.',
    MAXCYCLES: 'After this many cycles the match ends in a draw.',
    MAXLENGTH: 'How many instructions one program may have at most.',
  },
  de: {
    CORESIZE: 'Anzahl der Zellen im Speicher. Danach beginnen die Adressen wieder von vorn.',
    MAXPROCESSES: 'Wie viele Prozesse ein Programm höchstens haben darf. Darüber hinaus bewirkt SPL nichts.',
    MAXCYCLES: 'Nach so vielen Zyklen endet die Partie unentschieden.',
    MAXLENGTH: 'Wie viele Befehle ein Programm höchstens haben darf.',
  },
};

const TX = {
  en: {
    empty: 'Put the cursor on a word to see an explanation here.',
    comment: 'Comment',
    commentText: 'Everything after <code>;</code> is a note for humans and is ignored by the game.',
    meta: (k) => `Special comment <code>;${k}</code>: shown in the game as the program's ${k === 'name' ? 'name' : k === 'author' ? 'author' : 'strategy description'}.`,
    instruction: 'Instruction',
    example: 'Example',
    fields: (a, b) => `Uses: ${a ? '<span class="fa">A field</span>' : ''}${a && b ? ' and ' : ''}${b ? '<span class="fb">B field</span>' : ''}${!a && !b ? 'no field' : ''}.`,
    mode: 'Addressing mode',
    builtin: 'Built-in constant',
    value: (v) => `Current value: <b>${v}</b> (depends on the settings).`,
    constant: 'Your constant (EQU)',
    constantText: (n, e, line) => `<code>${n}</code> is replaced by <code>${e}</code> before the match starts (defined in line ${line}). It occupies no cell and never changes.`,
    variable: 'Variable',
    variableText: (n, line, ins) => `<code>${n}</code> is a cell with a label (line ${line}: <code>${ins}</code>). Its number is stored in the <span class="fb">B field</span> and can change while the program runs.`,
    label: 'Label',
    labelText: (n, line, ins) => `<code>${n}</code> is the name of the cell in line ${line}: <code>${ins}</code>. Used in an operand, it stands for the <b>distance</b> from the current cell to that cell.`,
    labelDef: 'Here the label is defined: it names the cell of this line.',
    unknown: (n) => `<code>${n}</code> is neither an instruction, a label nor a constant. Typo? Labels must be defined somewhere at the start of a line.`,
    number: 'Number',
    numberImm: 'With <code>#</code> in front, this is the number itself.',
    numberAddr: 'Without <code>#</code> this is a distance in cells, counted from the current cell (negative = backwards).',
    equ: '<code>name EQU value</code> defines a constant: from then on, the name stands for the value.',
    org: '<code>ORG label</code> sets where the first process starts. Without ORG the label <code>start</code> is used, otherwise the first line.',
    end: '<code>END</code> ends the program; everything after it is ignored.',
    modes: [
      'immediate: the number itself, not an address.',
      'direct (default): a cell, counted from the current cell.',
      'indirect: go to the cell, read its <span class="fb">B field</span> and go that far again.',
      'indirect with −1 before: like @, but the pointer\'s <span class="fb">B field</span> is reduced by 1 first.',
      'indirect with +1 after: like @, then the pointer\'s <span class="fb">B field</span> is increased by 1.',
    ],
  },
  de: {
    empty: 'Setz den Cursor auf ein Wort, um hier eine Erklärung zu sehen.',
    comment: 'Kommentar',
    commentText: 'Alles hinter <code>;</code> ist eine Notiz für Menschen und wird vom Spiel ignoriert.',
    meta: (k) => `Besonderer Kommentar <code>;${k}</code>: wird im Spiel als ${k === 'name' ? 'Name' : k === 'author' ? 'Autor' : 'Strategie-Beschreibung'} des Programms angezeigt.`,
    instruction: 'Befehl',
    example: 'Beispiel',
    fields: (a, b) => `Benutzt: ${a ? '<span class="fa">A-Feld</span>' : ''}${a && b ? ' und ' : ''}${b ? '<span class="fb">B-Feld</span>' : ''}${!a && !b ? 'kein Feld' : ''}.`,
    mode: 'Adressierungsart',
    builtin: 'Eingebaute Konstante',
    value: (v) => `Aktueller Wert: <b>${v}</b> (hängt von den Einstellungen ab).`,
    constant: 'Eigene Konstante (EQU)',
    constantText: (n, e, line) => `<code>${n}</code> wird vor dem Start der Partie durch <code>${e}</code> ersetzt (definiert in Zeile ${line}). Belegt keine Zelle und ändert sich nie.`,
    variable: 'Variable',
    variableText: (n, line, ins) => `<code>${n}</code> ist eine Zelle mit Label (Zeile ${line}: <code>${ins}</code>). Ihre Zahl steht im <span class="fb">B-Feld</span> und kann sich während des Laufs ändern.`,
    label: 'Label',
    labelText: (n, line, ins) => `<code>${n}</code> ist der Name der Zelle in Zeile ${line}: <code>${ins}</code>. In einem Operanden steht es für den <b>Abstand</b> von der aktuellen Zelle bis dorthin.`,
    labelDef: 'Hier wird das Label definiert: Es benennt die Zelle dieser Zeile.',
    unknown: (n) => `<code>${n}</code> ist weder Befehl noch Label noch Konstante. Tippfehler? Labels müssen irgendwo am Zeilenanfang definiert sein.`,
    number: 'Zahl',
    numberImm: 'Mit <code>#</code> davor ist das die Zahl selbst.',
    numberAddr: 'Ohne <code>#</code> ist das ein Abstand in Zellen, gezählt ab der aktuellen Zelle (negativ = rückwärts).',
    equ: '<code>name EQU wert</code> definiert eine Konstante: Danach steht der Name für den Wert.',
    org: '<code>ORG label</code> legt fest, wo der erste Prozess startet. Ohne ORG gilt das Label <code>start</code>, sonst die erste Zeile.',
    end: '<code>END</code> beendet das Programm; alles danach wird ignoriert.',
    modes: [
      'unmittelbar: die Zahl selbst, keine Adresse.',
      'direkt (Standard): eine Zelle, gezählt ab der aktuellen Zelle.',
      'indirekt: geh zur Zelle, lies ihr <span class="fb">B-Feld</span> und geh noch einmal so weit.',
      'indirekt mit −1 vorher: wie @, aber das <span class="fb">B-Feld</span> des Zeigers wird erst um 1 verringert.',
      'indirekt mit +1 danach: wie @, danach wird das <span class="fb">B-Feld</span> des Zeigers um 1 erhöht.',
    ],
  },
};

const USES = {
  DAT: [false, false], MOV: [true, true], ADD: [true, true], SUB: [true, true], JMP: [true, false],
  JMZ: [true, true], JMN: [true, true], DJN: [true, true], SEQ: [true, true], SNE: [true, true],
  SLT: [true, true], SPL: [true, false], NOP: [false, false], WAIT: [true, false], RND: [true, true],
};

function opName(w) {
  const up = w.toUpperCase();
  if (OP_NAMES.includes(up)) return up;
  return OP_ALIASES[up] || null;
}

/** Collects labels and EQU definitions of the source (line numbers are 1-based). */
function scan(code) {
  const labels = new Map();
  const equs = new Map();
  code.split('\n').forEach((raw, i) => {
    const text = raw.split(';')[0];
    const m = /^([A-Za-z_]\w*):?(?:\s+(.*))?$/.exec(text.trimEnd());
    if (!m || /^\s/.test(text)) return;
    const word = m[1];
    const rest = (m[2] || '').trim();
    if (/^EQU\b/i.test(rest)) { equs.set(word.toUpperCase(), { name: word, expr: rest.slice(3).trim(), line: i + 1 }); return; }
    if (opName(word) || /^(ORG|END)$/i.test(word)) return;
    labels.set(word.toUpperCase(), { name: word, line: i + 1, ins: rest, isData: /^DAT\b/i.test(rest) });
  });
  return { labels, equs };
}

/**
 * Returns HTML explaining the token at the given cursor position.
 * @param {string} code  whole source
 * @param {number} pos   cursor offset in the source
 */
export function contextHelp(code, pos, lang, settings) {
  const T = TX[lang] || TX.en;
  const lineStart = code.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = code.indexOf('\n', pos);
  if (lineEnd < 0) lineEnd = code.length;
  const line = code.slice(lineStart, lineEnd);
  const col = pos - lineStart;
  const box = (title, body) => `<div class="ch-title">${title}</div><div class="ch-body">${body}</div>`;

  const semi = line.indexOf(';');
  if (semi >= 0 && col > semi) {
    const meta = /^;\s*(name|author|strategy)\b/i.exec(line.slice(semi));
    return box(T.comment, meta && line.slice(0, semi).trim() === '' ? T.meta(meta[1].toLowerCase()) : T.commentText);
  }

  // word under (or directly before) the cursor
  let s = col, e = col;
  while (s > 0 && IDENT.test(line[s - 1])) s--;
  while (e < line.length && IDENT.test(line[e])) e++;
  const word = line.slice(s, e);
  if (!word) {
    const ch = MODES.includes(line[col]) ? line[col] : MODES.includes(line[col - 1]) ? line[col - 1] : null;
    if (ch) return box(`${T.mode} <code>${esc(ch)}</code>`, T.modes[MODE_CHARS.indexOf(ch)]);
    return `<div class="ch-body muted">${T.empty}</div>`;
  }

  // addressing mode in front of the operand, if any
  let k = s - 1;
  while (k >= 0 && /[\s()+\-*/%]/.test(line[k]) && !MODES.includes(line[k])) k--;
  const modeChar = k >= 0 && MODES.includes(line[k]) ? line[k] : null;
  const modeLine = modeChar ? `<p class="ch-mode">${T.mode} <code>${esc(modeChar)}</code>: ${T.modes[MODE_CHARS.indexOf(modeChar)]}</p>` : '';

  const op = opName(word);
  if (op) {
    const d = dict().ops[op];
    const [a, b] = USES[op];
    return box(`${T.instruction} <code class="op-${OP_INFO[op].group}">${op}</code> – ${esc(d.title)}`,
      `<p>${esc(d.desc)}</p><p>${T.fields(a, b)}</p><p class="muted">${T.example}: <code>${esc(OP_INFO[op].example)}</code></p>`);
  }
  const up = word.toUpperCase();
  if (up === 'EQU') return box('EQU', T.equ);
  if (up === 'ORG') return box('ORG', T.org);
  if (up === 'END') return box('END', T.end);

  const consts = constantValues(settings);
  if (up in consts) {
    return box(`${T.builtin} <code>${up}</code>`, `<p>${CONST_INFO[lang]?.[up] || CONST_INFO.en[up]}</p><p>${T.value(consts[up])}</p>${modeLine}`);
  }
  if (/^\d+$/.test(word)) {
    return box(`${T.number} <code>${word}</code>`, `<p>${modeChar === '#' ? T.numberImm : T.numberAddr}</p>${modeChar && modeChar !== '#' ? modeLine : ''}`);
  }

  const { labels, equs } = scan(code);
  if (equs.has(up)) {
    const q = equs.get(up);
    return box(`${T.constant} <code>${esc(q.name)}</code>`, `<p>${T.constantText(esc(q.name), esc(q.expr), q.line)}</p>${modeLine}`);
  }
  if (labels.has(up)) {
    const l = labels.get(up);
    const atDefinition = s === 0;
    const body = l.isData ? T.variableText(esc(l.name), l.line, esc(l.ins)) : T.labelText(esc(l.name), l.line, esc(l.ins));
    return box(`${l.isData ? T.variable : T.label} <code>${esc(l.name)}</code>`, `${atDefinition ? `<p>${T.labelDef}</p>` : ''}<p>${body}</p>${modeLine}`);
  }
  return box(`<code>${esc(word)}</code>`, T.unknown(esc(word)));
}
