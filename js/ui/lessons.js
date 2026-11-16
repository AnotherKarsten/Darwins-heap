// The tutorial: short lessons that build on each other, in English and German.
// goal.type: 'survive' – your program is still alive at the end
//            'win'     – your program is the only one left

const SCOUT_CODE = (name) => `;name ${name}
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
`;

const MITOSIS_CODE = (name) => `;name ${name}
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
`;

const SLEEPER_CODE = (name, strategy = '') => `;name ${name}${strategy ? `\n;strategy ${strategy}` : ''}
start   SPL boot
dwarf   ADD #4, bomb
        MOV bomb, @bomb
        JMP dwarf
bomb    DAT #0, #0
boot    WAIT #300
        MOV 0, 1
`;

export const LESSONS = [
  {
    id: 'l1',
    opponents: [],
    goal: { type: 'survive' },
    settings: { maxCycles: 1000 },
    speed: 6,
    en: {
      title: 'Life in memory',
      subtitle: 'Memory, cells and the smallest instruction',
      goal: 'Survive 1000 cycles.',
      html: `
<p>The arena is a <b>ring-shaped memory</b> of numbered cells. After the last cell comes the first one again.
Every cell holds exactly <b>one instruction</b>. Your program is loaded somewhere into it, and a <b>process</b> executes it instruction by instruction.</p>
<p>All addresses are <b>relative</b>: <code>0</code> is the cell of the current instruction, <code>1</code> the next one, <code>-1</code> the previous one.</p>
<p>The smallest program that can survive is called the <b>Imp</b>:</p>
<pre>MOV 0, 1</pre>
<p>“Copy me (0) into the next cell (1).” Then the process executes the next cell – which is the fresh copy. So the Imp crawls through memory forever.</p>
<p class="tip">Start the lesson and watch the trail. Feel free to slow down the speed and click a cell to inspect it in the <b>Lens</b>.</p>`,
      code: `;name My Imp
;strategy Keeps copying itself one cell forward.
        MOV 0, 1
`,
    },
    de: {
      title: 'Leben im Speicher',
      subtitle: 'Speicher, Zellen und der kleinste Befehl',
      goal: 'Überlebe 1000 Zyklen.',
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
    },
  },
  {
    id: 'l2',
    opponents: ['ente'],
    goal: { type: 'win' },
    speed: 9,
    en: {
      title: 'The first bomb',
      subtitle: 'DAT, loops and indirect addresses',
      goal: 'Defeat the Sitting Duck.',
      html: `
<p>If a process runs into a <code>DAT</code> instruction, <b>it dies</b>. Whoever copies DAT cells into the opponent's code wins.</p>
<p>The <b>Dwarf</b> does exactly that:</p>
<pre>start   ADD #4, bomb      ; bomb.B += 4
        MOV bomb, @bomb   ; copy the bomb to bomb + bomb.B
        JMP start
bomb    DAT #0, #0</pre>
<ul>
<li><code>#4</code> is a <b>number</b>, not an address.</li>
<li><code>bomb</code> is a <b>label</b> – the assembler works out the distance.</li>
<li><code>@bomb</code> means “go to bomb, read its B field and jump that much further” – a <b>pointer</b>.</li>
</ul>
<p>Because 4 divides the memory size evenly, the Dwarf never hits itself. The Duck is four cells long – sooner or later it gets hit.</p>`,
      code: `;name My Dwarf
start   ADD #4, bomb
        MOV bomb, @bomb
        JMP start
bomb    DAT #0, #0
`,
    },
    de: {
      title: 'Die erste Bombe',
      subtitle: 'DAT, Schleifen und indirekte Adressen',
      goal: 'Besiege die Sitzende Ente.',
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
    },
  },
  {
    id: 'l3',
    opponents: ['ente'],
    goal: { type: 'win' },
    speed: 10,
    en: {
      title: 'Eyes open: scanning',
      subtitle: 'Compare, skip, hit on purpose',
      goal: 'Find and defeat the Sitting Duck.',
      html: `
<p>Bombing blindly costs time. A <b>scanner</b> first checks whether something is there.</p>
<p><code>SNE a, b</code> compares two cells and <b>skips the next instruction</b> if they differ.
Because empty memory consists of <code>DAT #0, #0</code>, the Scout compares every cell with its own (empty) bomb.</p>
<p><code>DJN</code> counts along: “decrement and jump while not 0”. That way the Scout knows when it has gone once around – before it finds itself.</p>
<p><code>&lt;ptr</code> decrements the pointer <i>before</i> using it – so the second bomb lands right in front of the first.</p>
<p class="tip">Change <code>step</code>. What happens with 5 or 7? The Duck is four cells long …</p>`,
      code: SCOUT_CODE('My Scout'),
    },
    de: {
      title: 'Augen auf: Scannen',
      subtitle: 'Vergleichen, überspringen, gezielt treffen',
      goal: 'Finde und besiege die Sitzende Ente.',
      html: `
<p>Blind bombardieren kostet Zeit. Ein <b>Scanner</b> schaut erst nach, ob an einer Stelle etwas steht.</p>
<p><code>SNE a, b</code> vergleicht zwei Zellen und <b>überspringt den nächsten Befehl</b>, wenn sie verschieden sind.
Weil leerer Speicher aus <code>DAT #0, #0</code> besteht, vergleicht der Späher jede Zelle mit seiner eigenen (leeren) Bombe.</p>
<p><code>DJN</code> zählt dabei mit: „verringere und springe, solange nicht 0“. So weiß der Späher, wann er einmal rund ist, bevor er sich selbst findet.</p>
<p><code>&lt;ptr</code> verringert den Zeiger <i>vor</i> der Benutzung – so landet die zweite Bombe direkt vor der ersten.</p>
<p class="tip">Ändere <code>step</code>. Was passiert bei 5 oder 7? Die Ente ist vier Zellen lang …</p>`,
      code: SCOUT_CODE('Mein Späher'),
    },
  },
  {
    id: 'l4',
    opponents: ['zwerg'],
    goal: { type: 'survive' },
    speed: 11,
    en: {
      title: 'Reproduction',
      subtitle: 'SPL – from one, make many',
      goal: 'Survive against the Dwarf.',
      html: `
<p><code>SPL target</code> <b>splits</b> the process: it carries on as usual, and in addition a new process starts at <code>target</code>.
All processes of a program take turns. The program lives as long as <b>any</b> of its processes lives.</p>
<p><b>Mitosis</b> copies itself line by line with <code>MOV &gt;src, &gt;dst</code>. The <code>&gt;</code> increases the pointer by 1 <i>after</i> each copy.
Then it brings the copy to life with <code>SPL</code> and picks a new target. Every copy does the same – exponential growth!</p>
<p class="tip">Watch the curves in the <b>Live</b> tab: the processes explode until the limit is reached.</p>`,
      code: MITOSIS_CODE('My Mitosis'),
    },
    de: {
      title: 'Fortpflanzung',
      subtitle: 'SPL – aus eins mach viele',
      goal: 'Überlebe gegen den Zwerg.',
      html: `
<p><code>SPL ziel</code> <b>teilt</b> den Prozess: Er macht normal weiter und zusätzlich startet ein neuer Prozess bei <code>ziel</code>.
Alle Prozesse eines Programms wechseln sich ab. Das Programm lebt, solange <b>irgendein</b> Prozess lebt.</p>
<p>Die <b>Mitose</b> kopiert sich Zeile für Zeile mit <code>MOV &gt;src, &gt;dst</code>. Das <code>&gt;</code> erhöht den Zeiger <i>nach</i> jeder Kopie um 1.
Dann erweckt sie die Kopie mit <code>SPL</code> zum Leben und sucht sich ein neues Ziel. Jede Kopie tut dasselbe – exponentielles Wachstum!</p>
<p class="tip">Schau im Tab <b>Live</b> auf die Kurven: Die Prozesse explodieren, bis das Limit erreicht ist.</p>`,
      code: MITOSIS_CODE('Meine Mitose'),
    },
  },
  {
    id: 'l5',
    opponents: ['wuerfler'],
    goal: { type: 'survive' },
    speed: 11,
    en: {
      title: 'Timing with WAIT',
      subtitle: 'Several processes, one plan',
      goal: 'Survive against the Dicer.',
      html: `
<p><code>WAIT #n</code> lets a process sleep for <b>n of its own turns</b>. That sounds like a waste of time – but with several processes it becomes a tactic.</p>
<p>The <b>Sleeper</b> splits into two parts: a Dwarf that bombs, and an Imp as a lifeboat.
The Imp waits first, so the Dwarf gets the full computing time at the start. If the Dwarf dies, the Imp crawls on – often turning a defeat into a draw.</p>
<p class="tip">Try different waiting times. The <b>Analysis</b> tab shows how many turns were slept.</p>`,
      code: SLEEPER_CODE('My Sleeper'),
    },
    de: {
      title: 'Timing mit WAIT',
      subtitle: 'Mehrere Prozesse, ein Plan',
      goal: 'Überlebe gegen den Würfler.',
      html: `
<p><code>WAIT #n</code> lässt einen Prozess <b>n eigene Züge</b> schlafen. Das klingt nach Zeitverschwendung – aber mit mehreren Prozessen wird es zur Taktik.</p>
<p>Der <b>Schläfer</b> teilt sich in zwei Teile: einen Zwerg, der bombardiert, und einen Wichtel als Rettungsboot.
Der Wichtel wartet erst ab, damit der Zwerg anfangs die volle Rechenzeit bekommt. Stirbt der Zwerg, kriecht der Wichtel weiter – aus einer Niederlage wird so oft ein Unentschieden.</p>
<p class="tip">Probiere verschiedene Wartezeiten. In der <b>Analyse</b> siehst du, wie viele Züge verschlafen wurden.</p>`,
      code: SLEEPER_CODE('Mein Schläfer'),
    },
  },
  {
    id: 'l6',
    opponents: ['zwerg', 'wuerfler', 'spaeher'],
    goal: { type: 'survive' },
    speed: 12,
    en: {
      title: 'Battle royale',
      subtitle: 'Four programs – only one remains',
      goal: 'Survive until the end – or win!',
      html: `
<p>Now it gets serious: your program faces <b>three bots</b> at once. Every cycle gives each program one instruction – no matter how many processes it has.</p>
<p>Combine what you have learned: bombing, scanning, reproducing, waiting. There is no perfect program – every strategy has a counter. That is exactly what makes it fun.</p>
<p class="tip">In the <b>Tournament</b> (top right) you can test your program for a hundred rounds to separate luck from skill.</p>`,
      code: SLEEPER_CODE('My Fighter', 'Start here – or load a template in the editor.'),
    },
    de: {
      title: 'Battle Royale',
      subtitle: 'Vier Programme – nur eins bleibt übrig',
      goal: 'Überlebe bis zum Schluss – oder gewinne!',
      html: `
<p>Jetzt wird es ernst: Dein Programm tritt gegen <b>drei Bots</b> gleichzeitig an. Jeder Zyklus gibt jedem Programm einen Befehl – egal wie viele Prozesse es hat.</p>
<p>Kombiniere, was du gelernt hast: Bomben, Scannen, Vermehren, Warten. Es gibt kein perfektes Programm – jede Strategie hat einen Konter. Genau das macht den Reiz aus.</p>
<p class="tip">Im <b>Turnier</b> (oben rechts) kannst du dein Programm hundert Runden lang testen, um Glück von Können zu trennen.</p>`,
      code: SLEEPER_CODE('Mein Kämpfer', 'Starte hier – oder lade im Editor eine Vorlage.'),
    },
  },
];

/** Text of a lesson in the given language (falls back to English). */
export function lessonText(lesson, lang) {
  return lesson[lang] || lesson.en;
}
