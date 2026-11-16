// The manual is generated from the instruction definitions, so it always stays up to date.

import { OP_NAMES, OP_INFO, MODE_CHARS } from '../engine/isa.js';
import { dict, getLang } from '../i18n/index.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TEXT = {
  en: {
    intro: `<p><b>Heapcode</b> is a tiny assembly language, inspired by the programming game <i>Core War</i> (1984) and its ancestor <i>Darwin</i> (1961).
Every line is one instruction that occupies exactly one memory cell.</p>`,
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

export function manualHtml() {
  const T = TEXT[getLang()] || TEXT.en;
  const d = dict();
  const ops = OP_NAMES.map((name) => {
    const i = OP_INFO[name];
    const x = d.ops[name];
    return `<tr><td class="op-${i.group}">${name}</td><td><b>${esc(x.title)}</b><br>${esc(x.desc)}</td><td><code>${esc(i.example)}</code></td></tr>`;
  }).join('');
  const modes = d.modes.map((m, k) => `<tr><td>${esc(MODE_CHARS[k])}</td><td><b>${esc(m.name)}</b><br>${esc(m.desc)}</td></tr>`).join('');
  return `${T.intro}
<div class="manual-grid">
<div>
<h3>${T.lineTitle}</h3>
<pre>${T.lineCode}</pre>
<ul>${T.line}</ul>
<h3>${T.rulesTitle}</h3>
<ul>${T.rules}</ul>
</div>
<div>
<h3>${T.modesTitle}</h3>
<table>${modes}</table>
<h3>${T.exprTitle}</h3>
<ul>${T.expr}</ul>
</div>
</div>
<h3>${T.opsTitle}</h3>
<table><thead><tr><th>${T.colOp}</th><th>${T.colMeaning}</th><th>${T.colExample}</th></tr></thead><tbody>${ops}</tbody></table>
<h3>${T.stratTitle}</h3>
<ul>${T.strat}</ul>
<h3>${T.keysTitle}</h3>
<p>${T.keys}</p>`;
}
