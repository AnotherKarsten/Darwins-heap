// Das Handbuch wird aus den Befehlsdefinitionen erzeugt – so bleibt es immer aktuell.

import { OP_NAMES, OP_INFO, MODE_INFO } from '../engine/isa.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function manualHtml() {
  const ops = OP_NAMES.map((name) => {
    const i = OP_INFO[name];
    return `<tr><td class="op-${i.group}">${name}</td><td><b>${i.title}</b><br>${esc(i.desc)}</td><td><code>${esc(i.example)}</code></td></tr>`;
  }).join('');
  const modes = MODE_INFO.map((m) => `<tr><td>${esc(m.char)}</td><td><b>${m.name}</b><br>${esc(m.desc)}</td></tr>`).join('');
  return `
<p><b>Heapcode</b> ist eine winzige Assemblersprache, angelehnt an das Programmierspiel <i>Core War</i> (1984) und seinen Urahn <i>Darwin</i> (1961).
Jede Zeile ist ein Befehl, der genau eine Speicherzelle belegt.</p>
<div class="manual-grid">
<div>
<h3>Aufbau einer Zeile</h3>
<pre>label   BEFEHL  A, B     ; Kommentar</pre>
<ul>
<li><b>Label</b> (optional) gibt der Zeile einen Namen. Wer es benutzt, bekommt den <b>Abstand</b> dorthin.</li>
<li><b>A</b> ist die Quelle, <b>B</b> das Ziel. Vor jedem Operanden kann eine <b>Adressierungsart</b> stehen.</li>
<li>Alles hinter <code>;</code> ist Kommentar. <code>;name</code>, <code>;author</code> und <code>;strategy</code> werden angezeigt.</li>
</ul>
<h3>Spielregeln</h3>
<ul>
<li>Der Speicher ist ein <b>Ring</b>: Adressen laufen am Ende wieder vorne weiter.</li>
<li>Leerer Speicher besteht aus <code>DAT #0, #0</code>.</li>
<li>Pro Zyklus führt jedes Programm <b>genau einen</b> Befehl aus – reihum, abwechselnd über alle seine Prozesse.</li>
<li>Ein Prozess, der <code>DAT</code> ausführt, stirbt. Ein Programm ohne Prozesse scheidet aus.</li>
<li>Wer zuletzt übrig ist, gewinnt. Nach dem Zyklenlimit endet die Partie unentschieden.</li>
<li>Startpositionen sind zufällig, aber mit Mindestabstand. Kein Programm weiß, wo der Gegner liegt.</li>
</ul>
</div>
<div>
<h3>Adressierungsarten</h3>
<table>${modes}</table>
<h3>Ausdrücke &amp; Direktiven</h3>
<ul>
<li>Rechnen mit <code>+ - * / %</code> und Klammern: <code>#(CORESIZE-10)/2</code></li>
<li>Konstanten: <code>CORESIZE</code>, <code>MAXPROCESSES</code>, <code>MAXCYCLES</code>, <code>MAXLENGTH</code></li>
<li><code>abstand EQU 42</code> definiert einen Namen für einen Wert.</li>
<li><code>ORG start</code> legt fest, wo der erste Prozess beginnt. Ohne ORG gilt das Label <code>start</code>, sonst die erste Zeile.</li>
<li>Groß-/Kleinschreibung ist egal. Höchstens 100 Befehle je Programm.</li>
</ul>
</div>
</div>
<h3>Befehle</h3>
<table><thead><tr><th>Befehl</th><th>Bedeutung</th><th>Beispiel</th></tr></thead><tbody>${ops}</tbody></table>
<h3>Strategien – Schere, Stein, Papier</h3>
<ul>
<li><b>Bomber</b> (Stein, z. B. Zwerg) werfen blind Bomben. Klein und schnell.</li>
<li><b>Scanner</b> (Schere, z. B. Späher) suchen erst und schlagen gezielt zu. Stark gegen große, langsame Gegner.</li>
<li><b>Replikatoren</b> (Papier, z. B. Mitose) vermehren sich schneller, als man sie vernichten kann.</li>
<li><b>Wichtel</b> sind fast nicht zu treffen, gewinnen aber selten – gut als Rettungsboot.</li>
</ul>
<h3>Tastenkürzel</h3>
<p><kbd>Leertaste</kbd> Start/Pause · <kbd>→</kbd> ein Zyklus · <kbd>Umschalt</kbd>+<kbd>→</kbd> ein Befehl · <kbd>R</kbd> neu starten · <kbd>+</kbd>/<kbd>−</kbd> Tempo · <kbd>1</kbd>–<kbd>3</kbd> Ansicht · <kbd>E</kbd> erstes Programm bearbeiten</p>`;
}
