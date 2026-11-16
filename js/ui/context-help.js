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

// ------------------------------------------------------------------ operand roles
// What an operand means for a specific instruction and field – for # (number) and for an address.
const ROLE = {
  en: {
    unused: (op) => `${op} does not use this field.`,
    DAT: {
      A: { imm: (x) => `DAT is never executed – the field just stores the number ${x}.`, addr: (w, x) => `DAT is never executed – the field just stores ${x}; the sign only matters if the cell is copied and used elsewhere.` },
      B: { imm: (x) => `stores the number ${x}. For a variable, this is where its value lives.`, addr: (w, x) => `stores ${x}. For a variable, use <code>#</code> – the sign matters only if the cell is used elsewhere.` },
    },
    MOV: {
      A: { imm: (x) => `MOV writes the number ${x} into the <span class="fb">B field</span> of the target (B).`, addr: (w) => `MOV copies ${w} completely – instruction and both fields – to the target (B).` },
      B: { imm: () => 'the target is the MOV instruction itself (with # there is no address) – usually a mistake.', addr: (w) => `MOV writes into ${w}.` },
    },
    ADD: {
      A: { imm: (x) => `ADD adds ${x} to the <span class="fb">B field</span> of the target (B).`, addr: (w) => `ADD adds both fields of ${w} to both fields of the target (B).` },
      B: { imm: () => 'the target is the ADD instruction itself – its own B field is changed.', addr: (w) => `ADD changes ${w}: the value is added there.` },
    },
    SUB: {
      A: { imm: (x) => `SUB subtracts ${x} from the <span class="fb">B field</span> of the target (B).`, addr: (w) => `SUB subtracts both fields of ${w} from both fields of the target (B).` },
      B: { imm: () => 'the target is the SUB instruction itself – its own B field is changed.', addr: (w) => `SUB changes ${w}: the value is subtracted there.` },
    },
    JMP: {
      A: { imm: () => 'JMP jumps onto itself (with # there is no address) – the process gets stuck. You probably meant a target without #.', addr: (w) => `JMP jumps to ${w}: the process continues there.` },
    },
    JMZ: {
      A: { imm: () => 'the jump target is the instruction itself – usually a mistake.', addr: (w) => `if the check is 0, the process jumps to ${w}.` },
      B: { imm: (x) => `the number ${x} itself is checked – so the result is always the same.`, addr: (w) => `the <span class="fb">B field</span> of ${w} is checked: is it 0?` },
    },
    JMN: {
      A: { imm: () => 'the jump target is the instruction itself – usually a mistake.', addr: (w) => `if the check is not 0, the process jumps to ${w}.` },
      B: { imm: (x) => `the number ${x} itself is checked – so the result is always the same.`, addr: (w) => `the <span class="fb">B field</span> of ${w} is checked: is it not 0?` },
    },
    DJN: {
      A: { imm: () => 'the jump target is the instruction itself – usually a mistake.', addr: (w) => `as long as the counter is not 0 yet, the process jumps to ${w}.` },
      B: { imm: (x) => `the counter lives in the DJN instruction itself: its own B field (${x}) is reduced by 1 each time.`, addr: (w) => `the <span class="fb">B field</span> of ${w} is the counter: it is reduced by 1 and checked.` },
    },
    SEQ: {
      A: { imm: (x) => `the number ${x} is compared with the <span class="fb">B field</span> of cell B.`, addr: (w) => `${w} is compared completely (instruction and both fields) with cell B.` },
      B: { imm: () => 'the comparison is made with the instruction itself.', addr: (w) => `${w} is the cell that is compared.` },
    },
    SLT: {
      A: { imm: (x) => `the number ${x} is compared: if it is smaller than the <span class="fb">B field</span> of B, the next instruction is skipped.`, addr: (w) => `the <span class="fb">B field</span> of ${w} is compared with the B field of B.` },
      B: { imm: (x) => `the comparison is made with the number ${x}.`, addr: (w) => `the <span class="fb">B field</span> of ${w} is the number to compare with.` },
    },
    SPL: {
      A: { imm: () => 'the new process starts on the SPL instruction itself – usually a mistake.', addr: (w) => `the new process starts at ${w}.` },
    },
    WAIT: {
      A: { imm: (x, n) => (n !== null && (n < 0 || n > 1000) ? 'a negative or very large number counts as the maximum: the process sleeps 1000 of its own turns.' : `the process sleeps exactly ${x} of its own turns.`), addr: (w) => `WAIT reads the <span class="fb">B field</span> of ${w} and sleeps that many of its own turns. If it is 0 (e.g. an empty cell), it does not sleep at all; a negative number gives the maximum of 1000.` },
    },
    RND: {
      A: { imm: (x) => `a random number from 0 to ${x}−1 (with #0: across the whole memory).`, addr: (w) => `the upper limit is taken from the <span class="fb">B field</span> of ${w}.` },
      B: { imm: () => 'the random number lands in the RND instruction\'s own B field.', addr: (w) => `the random number is written into the <span class="fb">B field</span> of ${w}.` },
    },
    field: (f, op) => `${f === 'A' ? '<span class="fa">A field</span>' : '<span class="fb">B field</span>'} of ${op}`,
    isImm: (x) => `with <code>#</code> = the number ${x} itself.`,
    isAddr: (w) => `without <code>#</code> = an address: ${w}.`,
    isInd: (m, w) => `with <code>${esc(m)}</code> = a pointer: ${w}.`,
    altAddr: (t, r) => `Without <code>#</code> (<code>${t}</code>) it would be an address instead – then: ${r}`,
    altImm: (t, r) => `With <code>#</code> in front (<code>${t}</code>) it would be the number itself – then: ${r}`,
    here: 'this cell itself',
    ahead: (n) => `the cell ${n} place${n === 1 ? '' : 's'} further`,
    back: (n) => `the cell ${n} place${n === 1 ? '' : 's'} back`,
    named: (x) => `the cell <i>${x}</i>`,
    exprAhead: (x) => `the cell <code>${x}</code> places further`,
    pointer: (w, note) => `the cell that ${w} points to with its B field${note}`,
    dec: ' (that B field is reduced by 1 first)',
    inc: ' (afterwards that B field is increased by 1)',
  },
  de: {
    unused: (op) => `${op} benutzt dieses Feld nicht.`,
    DAT: {
      A: { imm: (x) => `DAT wird nie ausgeführt – das Feld speichert nur die Zahl ${x}.`, addr: (w, x) => `DAT wird nie ausgeführt – das Feld speichert nur ${x}; das Zeichen spielt erst eine Rolle, wenn die Zelle woanders hinkopiert und benutzt wird.` },
      B: { imm: (x) => `speichert die Zahl ${x}. Bei einer Variablen steht hier ihr Wert.`, addr: (w, x) => `speichert ${x}. Für eine Variable nimm <code>#</code> – das Zeichen spielt nur eine Rolle, wenn die Zelle woanders benutzt wird.` },
    },
    MOV: {
      A: { imm: (x) => `MOV schreibt die Zahl ${x} in das <span class="fb">B-Feld</span> des Ziels (B).`, addr: (w) => `MOV kopiert ${w} komplett – Befehl und beide Felder – zum Ziel (B).` },
      B: { imm: () => 'Ziel ist der MOV-Befehl selbst (mit # gibt es keine Adresse) – meist ein Versehen.', addr: (w) => `MOV schreibt in ${w}.` },
    },
    ADD: {
      A: { imm: (x) => `ADD zählt ${x} zum <span class="fb">B-Feld</span> des Ziels (B) dazu.`, addr: (w) => `ADD zählt beide Felder von ${w} zu beiden Feldern des Ziels (B) dazu.` },
      B: { imm: () => 'Ziel ist der ADD-Befehl selbst – sein eigenes B-Feld wird verändert.', addr: (w) => `ADD verändert ${w}: Dort wird dazugezählt.` },
    },
    SUB: {
      A: { imm: (x) => `SUB zieht ${x} vom <span class="fb">B-Feld</span> des Ziels (B) ab.`, addr: (w) => `SUB zieht beide Felder von ${w} von beiden Feldern des Ziels (B) ab.` },
      B: { imm: () => 'Ziel ist der SUB-Befehl selbst – sein eigenes B-Feld wird verändert.', addr: (w) => `SUB verändert ${w}: Dort wird abgezogen.` },
    },
    JMP: {
      A: { imm: () => 'JMP springt auf sich selbst (mit # gibt es keine Adresse) – der Prozess bleibt hängen. Gemeint ist meist ein Ziel ohne #.', addr: (w) => `JMP springt nach ${w}: Dort macht der Prozess weiter.` },
    },
    JMZ: {
      A: { imm: () => 'Sprungziel ist der Befehl selbst – meist ein Versehen.', addr: (w) => `Ist die Prüfung 0, springt der Prozess nach ${w}.` },
      B: { imm: (x) => `geprüft wird die Zahl ${x} selbst – das Ergebnis ist also immer gleich.`, addr: (w) => `geprüft wird das <span class="fb">B-Feld</span> von ${w}: Ist es 0?` },
    },
    JMN: {
      A: { imm: () => 'Sprungziel ist der Befehl selbst – meist ein Versehen.', addr: (w) => `Ist die Prüfung nicht 0, springt der Prozess nach ${w}.` },
      B: { imm: (x) => `geprüft wird die Zahl ${x} selbst – das Ergebnis ist also immer gleich.`, addr: (w) => `geprüft wird das <span class="fb">B-Feld</span> von ${w}: Ist es nicht 0?` },
    },
    DJN: {
      A: { imm: () => 'Sprungziel ist der Befehl selbst – meist ein Versehen.', addr: (w) => `Solange der Zähler noch nicht 0 ist, springt der Prozess nach ${w}.` },
      B: { imm: (x) => `der Zähler steckt im DJN-Befehl selbst: Sein eigenes B-Feld (${x}) wird jedes Mal um 1 verringert.`, addr: (w) => `das <span class="fb">B-Feld</span> von ${w} ist der Zähler: Es wird um 1 verringert und geprüft.` },
    },
    SEQ: {
      A: { imm: (x) => `die Zahl ${x} wird mit dem <span class="fb">B-Feld</span> der Zelle B verglichen.`, addr: (w) => `${w} wird komplett (Befehl und beide Felder) mit der Zelle B verglichen.` },
      B: { imm: () => 'verglichen wird mit dem Befehl selbst.', addr: (w) => `${w} ist die Zelle, mit der verglichen wird.` },
    },
    SLT: {
      A: { imm: (x) => `die Zahl ${x} wird verglichen: Ist sie kleiner als das <span class="fb">B-Feld</span> von B, wird der nächste Befehl übersprungen.`, addr: (w) => `das <span class="fb">B-Feld</span> von ${w} wird mit dem B-Feld von B verglichen.` },
      B: { imm: (x) => `verglichen wird mit der Zahl ${x}.`, addr: (w) => `das <span class="fb">B-Feld</span> von ${w} ist die Vergleichszahl.` },
    },
    SPL: {
      A: { imm: () => 'der neue Prozess startet auf dem SPL-Befehl selbst – meist ein Versehen.', addr: (w) => `der neue Prozess startet bei ${w}.` },
    },
    WAIT: {
      A: { imm: (x, n) => (n !== null && (n < 0 || n > 1000) ? 'eine negative oder sehr große Zahl gilt als Maximum: Der Prozess schläft 1000 eigene Züge.' : `der Prozess schläft genau ${x} eigene Züge.`), addr: (w) => `WAIT liest das <span class="fb">B-Feld</span> von ${w} und schläft so viele eigene Züge. Steht dort 0 (z. B. bei einer leeren Zelle), wird gar nicht geschlafen; eine negative Zahl ergibt das Maximum von 1000.` },
    },
    RND: {
      A: { imm: (x) => `eine Zufallszahl von 0 bis ${x}−1 (bei #0: über den ganzen Speicher).`, addr: (w) => `die Obergrenze wird aus dem <span class="fb">B-Feld</span> von ${w} gelesen.` },
      B: { imm: () => 'die Zufallszahl landet im eigenen B-Feld des RND-Befehls.', addr: (w) => `die Zufallszahl wird in das <span class="fb">B-Feld</span> von ${w} geschrieben.` },
    },
    field: (f, op) => `${f === 'A' ? '<span class="fa">A-Feld</span>' : '<span class="fb">B-Feld</span>'} von ${op}`,
    isImm: (x) => `mit <code>#</code> = die Zahl ${x} selbst.`,
    isAddr: (w) => `ohne <code>#</code> = eine Adresse: ${w}.`,
    isInd: (m, w) => `mit <code>${esc(m)}</code> = ein Zeiger: ${w}.`,
    altAddr: (t, r) => `Ohne <code>#</code> (<code>${t}</code>) wäre es stattdessen eine Adresse – dann: ${r}`,
    altImm: (t, r) => `Mit <code>#</code> davor (<code>${t}</code>) wäre es die Zahl selbst – dann: ${r}`,
    here: 'Zelle +0 (dieser Befehl selbst)',
    ahead: (n) => `Zelle +${n} (${n} ${n === 1 ? 'Platz' : 'Plätze'} weiter)`,
    back: (n) => `Zelle −${n} (${n} ${n === 1 ? 'Platz' : 'Plätze'} zurück)`,
    named: (x) => `Zelle <i>${x}</i>`,
    exprAhead: (x) => `Zelle <code>+${x}</code>`,
    pointer: (w, note, text) => `Zelle <code>${text}</code> – also dort, wohin das B-Feld von ${w} zeigt${note}`,
    dec: ' (dieses B-Feld wird vorher um 1 verringert)',
    inc: ' (dieses B-Feld wird danach um 1 erhöht)',
  },
};
ROLE.en.CMP = ROLE.en.SEQ; ROLE.en.SNE = ROLE.en.SEQ;
ROLE.de.SNE = ROLE.de.SEQ;

/** Finds the operand of an instruction line that contains the cursor. */
function operandAt(line, col) {
  const code = line.split(';')[0];
  const re = /[A-Za-z_]\w*/g;
  let m;
  let op = null;
  let opEnd = -1;
  while ((m = re.exec(code))) {
    if (/^EQU$/i.test(m[0])) return null;
    const o = opName(m[0]);
    if (o) { op = o; opEnd = m.index + m[0].length; break; }
  }
  if (!op || col <= opEnd) return null;
  const parts = [];
  let depth = 0;
  let start = opEnd;
  for (let i = opEnd; i <= code.length; i++) {
    const c = code[i];
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (i === code.length || (c === ',' && depth === 0)) { parts.push([start, i]); start = i + 1; }
  }
  const ops = parts.map(([s, e]) => {
    while (s < e && /\s/.test(code[s])) s++;
    while (e > s && /\s/.test(code[e - 1])) e--;
    const text = code.slice(s, e);
    const explicit = MODES.includes(text[0]);
    return { s, e, text, mode: explicit ? text[0] : '$', expr: explicit ? text.slice(1).trim() : text };
  }).filter((o) => o.text);
  const idx = ops.findIndex((o) => col >= o.s && col <= o.e);
  if (idx < 0) return null;
  const field = op === 'DAT' && ops.length === 1 ? 'B' : idx === 0 ? 'A' : 'B';
  return { op, field, ...ops[idx] };
}

/** Explains one operand in the context of its instruction, including the # / no-# alternative. */
function operandHelp(o, lang, labels) {
  const R = ROLE[lang] || ROLE.en;
  const roles = R[o.op] && R[o.op][o.field];
  const head = `<p class="ch-operand"><b>${R.field(o.field, o.op)}</b>: <code>${esc(o.text)}</code></p>`;
  if (!roles) return `${head}<p>${R.unused(o.op)}</p>`;
  const x = /^-?\d+$/.test(o.expr) ? `<b>${o.expr}</b>` : `<code>${esc(o.expr)}</code>`;
  const n = /^-?\d+$/.test(o.expr) ? parseInt(o.expr, 10) : null;
  let direct;
  if (n !== null) direct = n === 0 ? R.here : n > 0 ? R.ahead(n) : R.back(-n);
  else if (/^[A-Za-z_]\w*$/.test(o.expr) && labels.has(o.expr.toUpperCase())) direct = R.named(esc(o.expr));
  else direct = R.exprAhead(esc(o.expr));
  if (o.mode === '#') {
    return `${head}<p>${R.isImm(x)}</p><p>→ ${roles.imm(x, n)}</p><p class="ch-alt">${R.altAddr(esc(o.expr), roles.addr(direct, x))}</p>`;
  }
  if (o.mode === '$') {
    return `${head}<p>${R.isAddr(direct)}</p><p>→ ${roles.addr(direct, x)}</p><p class="ch-alt">${R.altImm(`#${esc(o.expr)}`, roles.imm(x, n))}</p>`;
  }
  const ptr = R.pointer(direct, o.mode === '<' ? R.dec : o.mode === '>' ? R.inc : '', esc(o.text));
  return `${head}<p>${R.isInd(o.mode, ptr)}</p><p>→ ${roles.addr(ptr, x)}</p>`;
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
  const { labels, equs } = scan(code);
  const operand = operandAt(line, col);
  const opLine = operand ? `<div class="ch-opbox">${operandHelp(operand, lang, labels)}</div>` : '';
  if (!word) {
    const ch = MODES.includes(line[col]) ? line[col] : MODES.includes(line[col - 1]) ? line[col - 1] : null;
    if (ch) return box(`${T.mode} <code>${esc(ch)}</code>`, `<p>${T.modes[MODE_CHARS.indexOf(ch)]}</p>${opLine}`);
    if (operand) return box(`<code>${esc(operand.text)}</code>`, opLine);
    return `<div class="ch-body muted">${T.empty}</div>`;
  }

  // addressing mode in front of the operand, if any
  let k = s - 1;
  while (k >= 0 && /[\s()+\-*/%]/.test(line[k]) && !MODES.includes(line[k])) k--;
  const modeChar = k >= 0 && MODES.includes(line[k]) ? line[k] : null;
  const modeLine = operand ? opLine : modeChar ? `<p class="ch-mode">${T.mode} <code>${esc(modeChar)}</code>: ${T.modes[MODE_CHARS.indexOf(modeChar)]}</p>` : '';

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
    if (operand) return box(`${T.number} <code>${esc(operand.expr)}</code>`, opLine);
    return box(`${T.number} <code>${word}</code>`, `<p>${modeChar === '#' ? T.numberImm : T.numberAddr}</p>`);
  }

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
