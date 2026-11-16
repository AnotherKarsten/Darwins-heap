// The manual is generated from the instruction definitions, so it always stays up to date.

import { OP_NAMES, OP_INFO, MODE_CHARS } from '../engine/isa.js';
import { dict, getLang } from '../i18n/index.js';
import { constantValues, CONST_INFO } from './context-help.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TEXT = {
  en: {
    intro: `<p><b>Heapcode</b> is a tiny assembly language, inspired by the programming game <i>Core War</i> (1984) and its ancestor <i>Darwin</i> (1961).
Every line is one instruction that occupies exactly one memory cell.</p>`,
    toc: ['Anatomy of a line', 'Comments', 'Labels', 'Constants', 'Variables', 'Addressing modes', 'Instructions', 'Rules', 'Strategies'],
    commentsTitle: 'Comments',
    comments: `<p>Everything after <code>;</code> is a comment – a note for humans that the game ignores. It can fill a whole line or follow an instruction.</p>
<pre>; this program bombs every 4th cell
start   ADD #4, bomb    ; move the target</pre>
<p>Three special comments at the top are shown in the game: <code>;name</code>, <code>;author</code> and <code>;strategy</code> (can span several lines).</p>`,
    labelsTitle: 'Labels',
    labels: `<p>A word at the very <b>start of a line</b> (no spaces before it) is a <b>label</b>: a name for that cell. Wherever you use the name in an operand, the assembler inserts the <b>distance</b> from the current cell to the labelled cell.</p>
<pre>loop    ADD #1, value   ; "value" becomes $2 (two cells further)
        JMP loop        ; "loop"  becomes $-1 (one cell back)
value   DAT #0, #0</pre>
<p>Labels may contain letters, digits and <code>_</code> and must not start with a digit. A colon after the label is allowed (<code>loop:</code>). The label <code>start</code> marks where the first process begins.</p>`,
    constTitle: 'Constants',
    constIntro: `<p>A <b>constant</b> is a name for a fixed number. It is replaced by its value before the match starts, occupies <b>no cell</b> and never changes.</p>
<p><b>Built-in constants</b> (current values with your settings):</p>`,
    constOwn: `<p><b>Your own constants</b> are defined with <code>EQU</code>:</p>
<pre>step    EQU 7
gap     EQU CORESIZE/4 + step
start   ADD #step, bomb</pre>
<p>Constants can be combined with <code>+ - * / %</code> and parentheses. Division rounds towards zero.</p>`,
    constCols: ['Name', 'Value', 'Meaning'],
    varsTitle: 'Variables',
    vars: `<p>Heapcode has <b>no separate variable command</b>. A variable is simply a <b>cell with a label</b>, usually a <code>DAT</code>. The number is kept in its <b>B field</b>; most instructions read and write the B field.</p>
<pre>counter DAT #0, #0      ; variable "counter", starts at 0
start   ADD #1, counter ; counter = counter + 1
        MOV #9, counter ; counter = 9</pre>
<table class="cmp-table"><tr><th></th><th>Constant (EQU)</th><th>Variable (DAT cell)</th></tr>
<tr><td>occupies a cell</td><td>no</td><td>yes</td></tr>
<tr><td>can change at runtime</td><td>no</td><td>yes</td></tr>
<tr><td>can be overwritten by an opponent</td><td>no</td><td>yes</td></tr>
<tr><td>use as a number</td><td><code>#step</code></td><td><code>counter</code> (address of the cell)</td></tr></table>`,
    modesExample: 'Example (in cell 10; ptr is cell 12 with B field 5)',
    modeExamples: ['<code>#7</code> → the number 7', '<code>$2</code> → cell 12', '<code>@ptr</code> → 12 + 5 = cell 17', '<code>&lt;ptr</code> → ptr becomes 4 → cell 16', '<code>&gt;ptr</code> → cell 17, then ptr becomes 6'],
    lineTitle: 'Anatomy of a line',
    lineCode: 'label   OPCODE  A, B     ; comment',
    line: `<li>The <b>label</b> (optional) gives the line a name. Whoever uses it gets the <b>distance</b> to it.</li>
<li><b>A</b> is the source, <b>B</b> the target. Each operand may be preceded by an <b>addressing mode</b>.</li>
<li>Everything after <code>;</code> is a comment. <code>;name</code>, <code>;author</code> and <code>;strategy</code> are displayed in the game.</li>`,
    rulesTitle: 'Rules',
    rules: `<li>Memory is a <b>ring</b>: addresses wrap around at the end.</li>
<li>Empty memory consists of <code>DAT #0, #0</code>.</li>
<li>Each cycle, every program executes <b>exactly one</b> instruction – taking turns across all of its processes.</li>
<li>A process that executes <code>DAT</code> dies. A program without processes is out.</li>
<li>The last one standing wins. After the cycle limit the match ends in a draw.</li>
<li>Start positions are random but keep a minimum distance. No program knows where its opponent is.</li>`,
    modesTitle: 'Addressing modes',
    exprTitle: 'Expressions &amp; directives',
    expr: `<li>Arithmetic with <code>+ - * / %</code> and parentheses: <code>#(CORESIZE-10)/2</code></li>
<li>Constants: <code>CORESIZE</code>, <code>MAXPROCESSES</code>, <code>MAXCYCLES</code>, <code>MAXLENGTH</code></li>
<li><code>distance EQU 42</code> defines a name for a value.</li>
<li><code>ORG start</code> sets where the first process begins. Without ORG the label <code>start</code> is used, otherwise the first line.</li>
<li>Upper/lower case does not matter. At most 100 instructions per program.</li>`,
    opsTitle: 'Instructions', colOp: 'Instruction', colMeaning: 'Meaning', colExample: 'Example',
    stratTitle: 'Strategies – rock, paper, scissors',
    strat: `<li><b>Bombers</b> (rock, e.g. Dwarf) drop bombs blindly. Small and fast.</li>
<li><b>Scanners</b> (scissors, e.g. Scout) search first and strike on purpose. Strong against large, slow opponents.</li>
<li><b>Replicators</b> (paper, e.g. Mitosis) multiply faster than they can be destroyed.</li>
<li><b>Imps</b> are almost impossible to hit but rarely win – good as a lifeboat.</li>`,
    keysTitle: 'Keyboard shortcuts',
    keys: '<kbd>Space</kbd> start/pause · <kbd>→</kbd> one cycle · <kbd>Shift</kbd>+<kbd>→</kbd> one instruction · <kbd>R</kbd> restart · <kbd>+</kbd>/<kbd>−</kbd> speed · <kbd>1</kbd>–<kbd>3</kbd> view · <kbd>E</kbd> edit the first program',
  },
  de: {
    intro: `<p><b>Heapcode</b> ist eine winzige Assemblersprache, angelehnt an das Programmierspiel <i>Core War</i> (1984) und seinen Urahn <i>Darwin</i> (1961).
Jede Zeile ist ein Befehl, der genau eine Speicherzelle belegt.</p>`,
    toc: ['Aufbau einer Zeile', 'Kommentare', 'Labels', 'Konstanten', 'Variablen', 'Adressierungsarten', 'Befehle', 'Spielregeln', 'Strategien'],
    commentsTitle: 'Kommentare',
    comments: `<p>Alles hinter <code>;</code> ist ein Kommentar – eine Notiz für Menschen, die das Spiel ignoriert. Er kann eine ganze Zeile füllen oder hinter einem Befehl stehen.</p>
<pre>; dieses Programm bombardiert jede 4. Zelle
start   ADD #4, bomb    ; Ziel weiterschieben</pre>
<p>Drei besondere Kommentare am Anfang zeigt das Spiel an: <code>;name</code>, <code>;author</code> und <code>;strategy</code> (darf über mehrere Zeilen gehen).</p>`,
    labelsTitle: 'Labels',
    labels: `<p>Ein Wort ganz am <b>Zeilenanfang</b> (ohne Leerzeichen davor) ist ein <b>Label</b>: ein Name für diese Zelle. Wo du den Namen in einem Operanden benutzt, setzt der Assembler den <b>Abstand</b> von der aktuellen Zelle bis zur benannten Zelle ein.</p>
<pre>loop    ADD #1, wert    ; "wert" wird zu $2 (zwei Zellen weiter)
        JMP loop        ; "loop" wird zu $-1 (eine Zelle zurück)
wert    DAT #0, #0</pre>
<p>Labels bestehen aus Buchstaben, Ziffern und <code>_</code> und dürfen nicht mit einer Ziffer beginnen (keine Umlaute). Ein Doppelpunkt dahinter ist erlaubt (<code>loop:</code>). Das Label <code>start</code> markiert, wo der erste Prozess beginnt.</p>`,
    constTitle: 'Konstanten',
    constIntro: `<p>Eine <b>Konstante</b> ist ein Name für eine feste Zahl. Sie wird vor dem Start der Partie durch ihren Wert ersetzt, belegt <b>keine Zelle</b> und ändert sich nie.</p>
<p><b>Eingebaute Konstanten</b> (aktuelle Werte mit deinen Einstellungen):</p>`,
    constOwn: `<p><b>Eigene Konstanten</b> definierst du mit <code>EQU</code>:</p>
<pre>schritt EQU 7
abstand EQU CORESIZE/4 + schritt
start   ADD #schritt, bomb</pre>
<p>Konstanten lassen sich mit <code>+ - * / %</code> und Klammern verrechnen. Bei der Division wird in Richtung 0 gerundet.</p>`,
    constCols: ['Name', 'Wert', 'Bedeutung'],
    varsTitle: 'Variablen',
    vars: `<p>Heapcode hat <b>keinen eigenen Variablen-Befehl</b>. Eine Variable ist einfach eine <b>Zelle mit Label</b>, meistens ein <code>DAT</code>. Die Zahl steht in ihrem <b>B-Feld</b>; die meisten Befehle lesen und schreiben das B-Feld.</p>
<pre>zaehler DAT #0, #0      ; Variable "zaehler", Startwert 0
start   ADD #1, zaehler ; zaehler = zaehler + 1
        MOV #9, zaehler ; zaehler = 9</pre>
<table class="cmp-table"><tr><th></th><th>Konstante (EQU)</th><th>Variable (DAT-Zelle)</th></tr>
<tr><td>belegt eine Zelle</td><td>nein</td><td>ja</td></tr>
<tr><td>kann sich während des Laufs ändern</td><td>nein</td><td>ja</td></tr>
<tr><td>kann vom Gegner überschrieben werden</td><td>nein</td><td>ja</td></tr>
<tr><td>als Zahl benutzen</td><td><code>#schritt</code></td><td><code>zaehler</code> (Adresse der Zelle)</td></tr></table>`,
    modesExample: 'Beispiel (in Zelle 10; zeiger ist Zelle 12 mit B-Feld 5)',
    modeExamples: ['<code>#7</code> → die Zahl 7', '<code>$2</code> → Zelle 12', '<code>@zeiger</code> → 12 + 5 = Zelle 17', '<code>&lt;zeiger</code> → zeiger wird 4 → Zelle 16', '<code>&gt;zeiger</code> → Zelle 17, danach wird zeiger 6'],
    lineTitle: 'Aufbau einer Zeile',
    lineCode: 'label   BEFEHL  A, B     ; Kommentar',
    line: `<li><b>Label</b> (optional) gibt der Zeile einen Namen. Wer es benutzt, bekommt den <b>Abstand</b> dorthin.</li>
<li><b>A</b> ist die Quelle, <b>B</b> das Ziel. Vor jedem Operanden kann eine <b>Adressierungsart</b> stehen.</li>
<li>Alles hinter <code>;</code> ist Kommentar. <code>;name</code>, <code>;author</code> und <code>;strategy</code> werden angezeigt.</li>`,
    rulesTitle: 'Spielregeln',
    rules: `<li>Der Speicher ist ein <b>Ring</b>: Adressen laufen am Ende wieder vorne weiter.</li>
<li>Leerer Speicher besteht aus <code>DAT #0, #0</code>.</li>
<li>Pro Zyklus führt jedes Programm <b>genau einen</b> Befehl aus – reihum, abwechselnd über alle seine Prozesse.</li>
<li>Ein Prozess, der <code>DAT</code> ausführt, stirbt. Ein Programm ohne Prozesse scheidet aus.</li>
<li>Wer zuletzt übrig ist, gewinnt. Nach dem Zyklenlimit endet die Partie unentschieden.</li>
<li>Startpositionen sind zufällig, aber mit Mindestabstand. Kein Programm weiß, wo der Gegner liegt.</li>`,
    modesTitle: 'Adressierungsarten',
    exprTitle: 'Ausdrücke &amp; Direktiven',
    expr: `<li>Rechnen mit <code>+ - * / %</code> und Klammern: <code>#(CORESIZE-10)/2</code></li>
<li>Konstanten: <code>CORESIZE</code>, <code>MAXPROCESSES</code>, <code>MAXCYCLES</code>, <code>MAXLENGTH</code></li>
<li><code>abstand EQU 42</code> definiert einen Namen für einen Wert.</li>
<li><code>ORG start</code> legt fest, wo der erste Prozess beginnt. Ohne ORG gilt das Label <code>start</code>, sonst die erste Zeile.</li>
<li>Groß-/Kleinschreibung ist egal. Höchstens 100 Befehle je Programm.</li>`,
    opsTitle: 'Befehle', colOp: 'Befehl', colMeaning: 'Bedeutung', colExample: 'Beispiel',
    stratTitle: 'Strategien – Schere, Stein, Papier',
    strat: `<li><b>Bomber</b> (Stein, z. B. Zwerg) werfen blind Bomben. Klein und schnell.</li>
<li><b>Scanner</b> (Schere, z. B. Späher) suchen erst und schlagen gezielt zu. Stark gegen große, langsame Gegner.</li>
<li><b>Replikatoren</b> (Papier, z. B. Mitose) vermehren sich schneller, als man sie vernichten kann.</li>
<li><b>Wichtel</b> sind fast nicht zu treffen, gewinnen aber selten – gut als Rettungsboot.</li>`,
    keysTitle: 'Tastenkürzel',
    keys: '<kbd>Leertaste</kbd> Start/Pause · <kbd>→</kbd> ein Zyklus · <kbd>Umschalt</kbd>+<kbd>→</kbd> ein Befehl · <kbd>R</kbd> neu starten · <kbd>+</kbd>/<kbd>−</kbd> Tempo · <kbd>1</kbd>–<kbd>3</kbd> Ansicht · <kbd>E</kbd> erstes Programm bearbeiten',
  },
};

export function manualHtml(settings = { coreSize: 4000, maxProcesses: 1000, maxCycles: 0 }) {
  const lang = getLang();
  const T = TEXT[lang] || TEXT.en;
  const d = dict();
  const ops = OP_NAMES.map((name) => {
    const i = OP_INFO[name];
    const x = d.ops[name];
    return `<tr><td class="op-${i.group}">${name}</td><td><b>${esc(x.title)}</b><br>${esc(x.desc)}</td><td><code>${esc(i.example)}</code></td></tr>`;
  }).join('');
  const modes = d.modes.map((m, k) => `<tr><td><code>${esc(MODE_CHARS[k])}</code></td><td><b>${esc(m.name)}</b><br>${esc(m.desc)}</td><td>${T.modeExamples[k]}</td></tr>`).join('');
  const values = constantValues(settings);
  const info = CONST_INFO[lang] || CONST_INFO.en;
  const consts = Object.keys(values).map((k) => `<tr><td><code>${k}</code></td><td><b>${values[k]}</b></td><td>${esc(info[k])}</td></tr>`).join('');
  const ids = ['m-line', 'm-comments', 'm-labels', 'm-const', 'm-vars', 'm-modes', 'm-ops', 'm-rules', 'm-strat'];
  const toc = T.toc.map((x, k) => `<a href="#${ids[k]}">${x}</a>`).join(' · ');
  return `${T.intro}
<nav class="manual-toc">${toc}</nav>
<h3 id="m-line">${T.lineTitle}</h3>
<pre>${T.lineCode}</pre>
<ul>${T.line}</ul>
<h3 id="m-comments">${T.commentsTitle}</h3>
${T.comments}
<h3 id="m-labels">${T.labelsTitle}</h3>
${T.labels}
<h3 id="m-const">${T.constTitle}</h3>
${T.constIntro}
<table><thead><tr>${T.constCols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${consts}</tbody></table>
${T.constOwn}
<h3 id="m-vars">${T.varsTitle}</h3>
${T.vars}
<h3 id="m-modes">${T.modesTitle}</h3>
<table><thead><tr><th></th><th></th><th>${T.modesExample}</th></tr></thead><tbody>${modes}</tbody></table>
<h3>${T.exprTitle}</h3>
<ul>${T.expr}</ul>
<h3 id="m-ops">${T.opsTitle}</h3>
<table><thead><tr><th>${T.colOp}</th><th>${T.colMeaning}</th><th>${T.colExample}</th></tr></thead><tbody>${ops}</tbody></table>
<h3 id="m-rules">${T.rulesTitle}</h3>
<ul>${T.rules}</ul>
<h3 id="m-strat">${T.stratTitle}</h3>
<ul>${T.strat}</ul>
<h3>${T.keysTitle}</h3>
<p>${T.keys}</p>`;
}
