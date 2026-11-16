// Der Lernpfad: kurze, aufeinander aufbauende Lektionen.
// goal.type: 'survive' – dein Programm lebt am Ende noch
//            'win'     – dein Programm ist als einziges übrig

export const LESSONS = [
  {
    id: 'l1',
    title: 'Leben im Speicher',
    subtitle: 'Speicher, Zellen und der kleinste Befehl',
    html: `
<p>Die Arena ist ein <b>ringförmiger Speicher</b> aus nummerierten Zellen. Hinter der letzten Zelle kommt wieder die erste.
In jeder Zelle steht genau <b>ein Befehl</b>. Dein Programm wird irgendwo hineingeladen und ein <b>Prozess</b> führt es Befehl für Befehl aus.</p>
<p>Alle Adressen sind <b>relativ</b>: <code>0</code> ist die Zelle des aktuellen Befehls, <code>1</code> die nächste, <code>-1</code> die vorige.</p>
<p>Das kleinste lebensfähige Programm heißt <b>Wichtel</b>:</p>
<pre>MOV 0, 1</pre>
<p>„Kopiere mich (0) in die nächste Zelle (1).“ Danach führt der Prozess die nächste Zelle aus – also die frische Kopie. Der Wichtel kriecht so ewig durch den Speicher.</p>
<p class="tip">Starte die Lektion und beobachte die Spur. Stell die Geschwindigkeit ruhig langsamer und klick auf eine Zelle, um sie in der <b>Lupe</b> anzusehen.</p>`,
    code: `;name Mein Wichtel
;strategy Kopiert sich immer eine Zelle weiter.
        MOV 0, 1
`,
    opponents: [],
    goal: { type: 'survive', text: 'Überlebe 1000 Zyklen.' },
    settings: { maxCycles: 1000 },
    speed: 6,
  },
  {
    id: 'l2',
    title: 'Die erste Bombe',
    subtitle: 'DAT, Schleifen und indirekte Adressen',
    html: `
<p>Läuft ein Prozess auf einen <code>DAT</code>-Befehl, <b>stirbt er</b>. Wer DAT-Zellen in den Code des Gegners kopiert, gewinnt.</p>
<p>Der <b>Zwerg</b> macht genau das:</p>
<pre>start   ADD #4, bomb      ; bomb.B += 4
        MOV bomb, @bomb   ; Bombe nach bomb + bomb.B kopieren
        JMP start
bomb    DAT #0, #0</pre>
<ul>
<li><code>#4</code> ist eine <b>Zahl</b>, keine Adresse.</li>
<li><code>bomb</code> ist ein <b>Label</b> – der Assembler rechnet den Abstand aus.</li>
<li><code>@bomb</code> heißt: „gehe zu bomb, lies dort das B-Feld und springe so weit weiter“ – ein <b>Zeiger</b>.</li>
</ul>
<p>Weil 4 die Speichergröße glatt teilt, trifft der Zwerg sich selbst nie. Die Ente ist vier Zellen lang – irgendwann erwischt es sie.</p>`,
    code: `;name Mein Zwerg
start   ADD #4, bomb
        MOV bomb, @bomb
        JMP start
bomb    DAT #0, #0
`,
    opponents: ['ente'],
    goal: { type: 'win', text: 'Besiege die Sitzende Ente.' },
    speed: 9,
  },
  {
    id: 'l3',
    title: 'Augen auf: Scannen',
    subtitle: 'Vergleichen, überspringen, gezielt treffen',
    html: `
<p>Blind bombardieren kostet Zeit. Ein <b>Scanner</b> schaut erst nach, ob an einer Stelle etwas steht.</p>
<p><code>SNE a, b</code> vergleicht zwei Zellen und <b>überspringt den nächsten Befehl</b>, wenn sie verschieden sind.
Weil leerer Speicher aus <code>DAT #0, #0</code> besteht, vergleicht der Späher jede Zelle mit seiner eigenen (leeren) Bombe.</p>
<p><code>DJN</code> zählt dabei mit: „verringere und springe, solange nicht 0“. So weiß der Späher, wann er einmal rund ist, bevor er sich selbst findet.</p>
<p><code>&lt;ptr</code> verringert den Zeiger <i>vor</i> der Benutzung – so landet die zweite Bombe direkt vor der ersten.</p>
<p class="tip">Ändere <code>step</code>. Was passiert bei 5 oder 7? Die Ente ist vier Zellen lang …</p>`,
    code: `;name Mein Späher
step    EQU 3
count   EQU (CORESIZE-13)/step
ptr     DAT #0, #0
cnt     DAT #0, #0
bomb    DAT #0, #0
start   MOV #12, ptr
        MOV #count, cnt
scan    ADD #step, ptr
        DJN look, cnt
        JMP start
look    SNE bomb, @ptr
        JMP scan
        MOV bomb, @ptr
        MOV bomb, <ptr
        JMP scan
`,
    opponents: ['ente'],
    goal: { type: 'win', text: 'Finde und besiege die Sitzende Ente.' },
    speed: 10,
  },
  {
    id: 'l4',
    title: 'Fortpflanzung',
    subtitle: 'SPL – aus eins mach viele',
    html: `
<p><code>SPL ziel</code> <b>teilt</b> den Prozess: Er macht normal weiter und zusätzlich startet ein neuer Prozess bei <code>ziel</code>.
Alle Prozesse eines Programms wechseln sich ab. Das Programm lebt, solange <b>irgendein</b> Prozess lebt.</p>
<p>Die <b>Mitose</b> kopiert sich Zeile für Zeile mit <code>MOV &gt;src, &gt;dst</code>. Das <code>&gt;</code> erhöht den Zeiger <i>nach</i> jeder Kopie um 1.
Dann erweckt sie die Kopie mit <code>SPL</code> zum Leben und sucht sich ein neues Ziel. Jede Kopie tut dasselbe – exponentielles Wachstum!</p>
<p class="tip">Schau im Tab <b>Live</b> auf die Kurven: Die Prozesse explodieren, bis das Limit erreicht ist.</p>`,
    code: `;name Meine Mitose
dist    DAT #0, #1601
src     DAT #0, #0
dst     DAT #0, #0
cnt     DAT #0, #0
lnch    DAT #0, #0
start   MOV #0-1, src
        MOV dist, dst
        SUB #2, dst
        MOV #last-dist+1, cnt
copy    MOV >src, >dst
        DJN copy, cnt
        MOV dist, lnch
        ADD #start-lnch, lnch
        SPL @lnch
        ADD #937, dist
last    JMP start
`,
    opponents: ['zwerg'],
    goal: { type: 'survive', text: 'Überlebe gegen den Zwerg.' },
    speed: 11,
  },
  {
    id: 'l5',
    title: 'Timing mit WAIT',
    subtitle: 'Mehrere Prozesse, ein Plan',
    html: `
<p><code>WAIT #n</code> lässt einen Prozess <b>n eigene Züge</b> schlafen. Das klingt nach Zeitverschwendung – aber mit mehreren Prozessen wird es zur Taktik.</p>
<p>Der <b>Schläfer</b> teilt sich in zwei Teile: einen Zwerg, der bombardiert, und einen Wichtel als Rettungsboot.
Der Wichtel wartet erst ab, damit der Zwerg anfangs die volle Rechenzeit bekommt. Stirbt der Zwerg, kriecht der Wichtel weiter – aus einer Niederlage wird so oft ein Unentschieden.</p>
<p class="tip">Probiere verschiedene Wartezeiten. In der <b>Analyse</b> siehst du, wie viele Züge verschlafen wurden.</p>`,
    code: `;name Mein Schläfer
start   SPL boot
dwarf   ADD #4, bomb
        MOV bomb, @bomb
        JMP dwarf
bomb    DAT #0, #0
boot    WAIT #300
        MOV 0, 1
`,
    opponents: ['wuerfler'],
    goal: { type: 'survive', text: 'Überlebe gegen den Würfler.' },
    speed: 11,
  },
  {
    id: 'l6',
    title: 'Battle Royale',
    subtitle: 'Vier Programme – nur eins bleibt übrig',
    html: `
<p>Jetzt wird es ernst: Dein Programm tritt gegen <b>drei Bots</b> gleichzeitig an. Jeder Zyklus gibt jedem Programm einen Befehl – egal wie viele Prozesse es hat.</p>
<p>Kombiniere, was du gelernt hast: Bomben, Scannen, Vermehren, Warten. Es gibt kein perfektes Programm – jede Strategie hat einen Konter. Genau das macht den Reiz aus.</p>
<p class="tip">Im <b>Turnier</b> (oben rechts) kannst du dein Programm hundert Runden lang testen, um Glück von Können zu trennen.</p>`,
    code: `;name Mein Kämpfer
;strategy Starte hier – oder lade im Editor eine Vorlage.
start   SPL boot
dwarf   ADD #4, bomb
        MOV bomb, @bomb
        JMP dwarf
bomb    DAT #0, #0
boot    WAIT #300
        MOV 0, 1
`,
    opponents: ['zwerg', 'wuerfler', 'spaeher'],
    goal: { type: 'survive', text: 'Überlebe bis zum Schluss – oder gewinne!' },
    speed: 12,
  },
];
