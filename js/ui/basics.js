// "Basics": a very gentle introduction for people who have never seen assembly.
// Every chapter has a short text and a tiny memory (32 cells) that can be executed
// one instruction at a time, with a plain-language explanation of every step.

import { assemble } from '../engine/assembler.js';
import { Arena } from '../engine/arena.js';
import { OP, OP_NAMES, OP_INFO, MODE, disassemble } from '../engine/isa.js';
import { PLAYER_COLORS } from './renderer.js';

const MINI = 32;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ------------------------------------------------------------------ chapters
export const BASICS = [
  {
    id: 'b1',
    demo: { programs: [{ start: 4, code: { en: 'start   ADD #1, counter\n        JMP start\ncounter DAT #0, #0', de: 'start   ADD #1, zaehler\n        JMP start\nzaehler DAT #0, #0' } }] },
    en: {
      title: 'Memory is a row of boxes',
      subtitle: 'What the colourful grid actually shows',
      html: `
<p>Imagine the computer's memory as a <b>long row of numbered boxes</b>. Each box is called a <b>cell</b>, and its number is its <b>address</b>.
In the real game there are 4000 cells, here there are only 32 so you can see everything.</p>
<p>Each cell contains exactly <b>one instruction</b>. An instruction always has three parts:</p>
<pre>ADD   #1,    counter
 │     │       │
 │     │       └─ B field: usually the target ("where to?")
 │     └───────── A field: usually the source ("what?")
 └─────────────── the instruction name ("what to do?")</pre>
<p><b>Your program is simply a few instructions written into neighbouring cells.</b> Below, the program occupies cells 4, 5 and 6 (blue).
All other cells are empty – they contain <code>DAT #0, #0</code>, which means “nothing”.</p>
<p>The row has no end: after cell 31 comes cell 0 again. The memory is a <b>ring</b>. In the grid it is simply wrapped into lines, like text in a book.</p>
<p class="tip">Nothing happens yet – just look. The small name above a cell (<i>start</i>, <i>counter</i>) is a <b>label</b>: a name you gave to that cell.</p>`,
    },
    de: {
      title: 'Speicher ist eine Reihe Kästchen',
      subtitle: 'Was das bunte Raster eigentlich zeigt',
      html: `
<p>Stell dir den Speicher des Computers als <b>lange Reihe nummerierter Kästchen</b> vor. Jedes Kästchen heißt <b>Zelle</b>, seine Nummer ist seine <b>Adresse</b>.
Im echten Spiel gibt es 4000 Zellen, hier nur 32, damit du alles sehen kannst.</p>
<p>In jeder Zelle steht genau <b>ein Befehl</b>. Ein Befehl hat immer drei Teile:</p>
<pre>ADD   #1,    zaehler
 │     │       │
 │     │       └─ B-Feld: meistens das Ziel („wohin?“)
 │     └───────── A-Feld: meistens die Quelle („was?“)
 └─────────────── der Befehlsname („was tun?“)</pre>
<p><b>Dein Programm sind einfach ein paar Befehle, die in benachbarte Zellen geschrieben werden.</b> Unten belegt das Programm die Zellen 4, 5 und 6 (blau).
Alle anderen Zellen sind leer – in ihnen steht <code>DAT #0, #0</code>, das heißt „nichts“.</p>
<p>Die Reihe hat kein Ende: Nach Zelle 31 kommt wieder Zelle 0. Der Speicher ist ein <b>Ring</b>. Im Raster ist er nur in Zeilen umgebrochen, wie Text in einem Buch.</p>
<p class="tip">Noch passiert nichts – schau einfach hin. Der kleine Name über einer Zelle (<i>start</i>, <i>zaehler</i>) ist ein <b>Label</b>: ein Name, den du der Zelle gegeben hast.</p>`,
    },
  },
  {
    id: 'b2',
    demo: { programs: [{ start: 4, code: { en: 'start   ADD #1, counter\n        JMP start\ncounter DAT #0, #0', de: 'start   ADD #1, zaehler\n        JMP start\nzaehler DAT #0, #0' } }] },
    en: {
      title: 'The process: a finger that points',
      subtitle: 'Which instruction runs next?',
      html: `
<p>A program does nothing by itself. Something has to <b>execute</b> it. That something is called a <b>process</b>.
Think of it as a <b>finger</b> pointing at one cell. In the grid it is the <b>▶ arrow</b>.</p>
<p>With every step the process does two things:</p>
<ol>
<li>It <b>executes the instruction</b> in the cell it points at.</li>
<li>It <b>moves on</b> – normally to the <b>next cell</b> (address + 1).</li>
</ol>
<p>Some instructions change where the finger goes next. <code>JMP start</code> means “<b>jump</b>: continue at the cell called start”.
That is how a <b>loop</b> is made: the program below runs <i>start → JMP → start → JMP …</i> forever.</p>
<p class="tip">Press <b>Step</b> a few times and read the explanation. Watch the ▶ arrow jump back and forth – and the number in the <i>counter</i> cell grow.</p>`,
    },
    de: {
      title: 'Der Prozess: ein Finger, der zeigt',
      subtitle: 'Welcher Befehl ist als Nächstes dran?',
      html: `
<p>Ein Programm tut von allein nichts. Etwas muss es <b>ausführen</b>. Dieses Etwas heißt <b>Prozess</b>.
Stell ihn dir als <b>Finger</b> vor, der auf eine Zelle zeigt. Im Raster ist das der <b>▶-Pfeil</b>.</p>
<p>Bei jedem Schritt macht der Prozess zwei Dinge:</p>
<ol>
<li>Er <b>führt den Befehl aus</b>, auf den er zeigt.</li>
<li>Er <b>rückt weiter</b> – normalerweise auf die <b>nächste Zelle</b> (Adresse + 1).</li>
</ol>
<p>Manche Befehle ändern, wohin der Finger als Nächstes geht. <code>JMP start</code> heißt „<b>springe</b>: mach bei der Zelle namens start weiter“.
So entsteht eine <b>Schleife</b>: Das Programm unten läuft für immer <i>start → JMP → start → JMP …</i></p>
<p class="tip">Drück ein paar Mal auf <b>Schritt</b> und lies die Erklärung. Beobachte, wie der ▶-Pfeil hin und her springt – und die Zahl in der Zelle <i>zaehler</i> wächst.</p>`,
    },
  },
  {
    id: 'b3',
    demo: { programs: [{ start: 2, code: {
      en: 'start   MOV #7, box_a      ; write 7 into box_a\n        MOV box_a, box_b   ; copy box_a to box_b\n        ADD #1, box_b      ; box_b + 1\n        JMP start\nbox_a   DAT #0, #0\nbox_b   DAT #0, #0',
      de: 'start   MOV #7, kiste_a       ; 7 in kiste_a schreiben\n        MOV kiste_a, kiste_b  ; kiste_a nach kiste_b kopieren\n        ADD #1, kiste_b       ; kiste_b + 1\n        JMP start\nkiste_a DAT #0, #0\nkiste_b DAT #0, #0',
    } }] },
    en: {
      title: 'Variables are boxes too',
      subtitle: 'Where numbers are stored – and what # means',
      html: `
<p>Other programming languages have <b>variables</b> with names. Here there are none – <b>there are only cells</b>.
If you want to remember a number, you reserve a cell for it, usually with <code>DAT</code>, and give it a label. The number is stored in that cell's <b>B field</b>.</p>
<p>Below, <i>box_a</i> and <i>box_b</i> are such “variables”. Three small rules:</p>
<ul>
<li><code>#7</code> – with <b>#</b> it is simply <b>the number 7</b>.</li>
<li><code>box_a</code> – without # it is <b>a cell</b> (an address).</li>
<li><code>MOV #7, box_a</code> writes 7 into the B field of box_a. <code>MOV box_a, box_b</code> copies the <b>whole cell</b>.</li>
</ul>
<p><b>Important:</b> all addresses are <b>relative</b> – counted from the current cell. The label is converted into a distance.
That is why the grid shows <code>MOV #7, $4</code> instead of <code>MOV #7, box_a</code>: box_a is 4 cells further. <code>$4</code> means “4 cells ahead”, <code>$-3</code> “3 cells back”.</p>
<p class="tip">Step through and watch the numbers in box_a and box_b. Notice: data and code live in the <b>same memory</b>. A program could even overwrite its own instructions – or those of others!</p>`,
    },
    de: {
      title: 'Variablen sind auch nur Kästchen',
      subtitle: 'Wo Zahlen gespeichert werden – und was # bedeutet',
      html: `
<p>Andere Programmiersprachen haben <b>Variablen</b> mit Namen. Hier gibt es keine – <b>es gibt nur Zellen</b>.
Willst du dir eine Zahl merken, reservierst du dafür eine Zelle, meist mit <code>DAT</code>, und gibst ihr ein Label. Die Zahl steht dann im <b>B-Feld</b> dieser Zelle.</p>
<p>Unten sind <i>kiste_a</i> und <i>kiste_b</i> solche „Variablen“. Drei kleine Regeln:</p>
<ul>
<li><code>#7</code> – mit <b>#</b> ist es einfach <b>die Zahl 7</b>.</li>
<li><code>kiste_a</code> – ohne # ist es <b>eine Zelle</b> (eine Adresse).</li>
<li><code>MOV #7, kiste_a</code> schreibt 7 in das B-Feld von kiste_a. <code>MOV kiste_a, kiste_b</code> kopiert die <b>ganze Zelle</b>.</li>
</ul>
<p><b>Wichtig:</b> Alle Adressen sind <b>relativ</b> – gezählt ab der aktuellen Zelle. Das Label wird in einen Abstand umgerechnet.
Darum zeigt das Raster <code>MOV #7, $4</code> statt <code>MOV #7, kiste_a</code>: kiste_a liegt 4 Zellen weiter. <code>$4</code> heißt „4 Zellen vorwärts“, <code>$-3</code> „3 Zellen zurück“.</p>
<p class="tip">Geh Schritt für Schritt durch und beobachte die Zahlen in kiste_a und kiste_b. Merke: Daten und Code liegen im <b>selben Speicher</b>. Ein Programm könnte sogar seine eigenen Befehle überschreiben – oder die anderer!</p>`,
    },
  },
  {
    id: 'b4',
    demo: { programs: [{ start: 2, code: { en: 'start   ADD #4, bomb\n        MOV bomb, @bomb\n        JMP start\nbomb    DAT #0, #0', de: 'start   ADD #4, bomb\n        MOV bomb, @bomb\n        JMP start\nbomb    DAT #0, #0' } }] },
    en: {
      title: 'Pointers: @ means “where it points”',
      subtitle: 'Using a number as an address',
      html: `
<p>Sometimes you don't want to write into a fixed cell, but into a cell that <b>changes</b> – for example a little further each time.
For that, a cell can act as a <b>pointer</b>: its B field says “count this many cells further from me”.</p>
<p>The <b>@</b> sign follows the pointer:</p>
<ul>
<li><code>bomb</code> = the cell <i>bomb</i> itself.</li>
<li><code>@bomb</code> = go to <i>bomb</i>, read its B field (say 8), and go <b>8 more cells</b> from there.</li>
</ul>
<p>This program is the famous <b>Dwarf</b>. Every round it adds 4 to the pointer and copies the <code>DAT</code> cell (the “bomb”) to wherever the pointer points.
That way it scatters bombs over the memory, every 4 cells. Why bombs? You will see in a moment.</p>
<p class="tip">Use <b>Auto</b> and watch red DAT bombs appear in every fourth cell.</p>`,
    },
    de: {
      title: 'Zeiger: @ heißt „dorthin, wohin es zeigt“',
      subtitle: 'Eine Zahl als Adresse benutzen',
      html: `
<p>Manchmal willst du nicht in eine feste Zelle schreiben, sondern in eine, die sich <b>ändert</b> – zum Beispiel jedes Mal ein Stück weiter.
Dafür kann eine Zelle als <b>Zeiger</b> dienen: Ihr B-Feld sagt „zähle von mir aus so viele Zellen weiter“.</p>
<p>Das <b>@</b>-Zeichen folgt dem Zeiger:</p>
<ul>
<li><code>bomb</code> = die Zelle <i>bomb</i> selbst.</li>
<li><code>@bomb</code> = geh zu <i>bomb</i>, lies ihr B-Feld (sagen wir 8) und geh von dort <b>noch 8 Zellen weiter</b>.</li>
</ul>
<p>Dieses Programm ist der berühmte <b>Zwerg</b>. In jeder Runde erhöht er den Zeiger um 4 und kopiert die <code>DAT</code>-Zelle (die „Bombe“) dorthin, wohin der Zeiger zeigt.
So verteilt er Bomben über den Speicher, alle 4 Zellen eine. Warum Bomben? Das siehst du gleich.</p>
<p class="tip">Nimm <b>Auto</b> und beobachte, wie in jeder vierten Zelle eine rote DAT-Bombe erscheint.</p>`,
    },
  },
  {
    id: 'b5',
    demo: { programs: [
      { start: 2, code: { en: 'start   ADD #1, counter\n        JMP start\ncounter DAT #0, #0', de: 'start   ADD #1, zaehler\n        JMP start\nzaehler DAT #0, #0' } },
      { start: 18, code: { en: '        MOV 0, 1', de: '        MOV 0, 1' } },
    ] },
    en: {
      title: 'Several programs: whose turn is it?',
      subtitle: 'Fair alternation in the same memory',
      html: `
<p>In a match, <b>several programs share the same memory</b>. Each is loaded at a random place and has its own colour.
Nobody knows where the others are.</p>
<p>They take turns, strictly fairly: <b>blue executes one instruction, then pink executes one, then blue again …</b>
One round in which every program had its turn is called a <b>cycle</b>.</p>
<p>The pink program is the <b>Imp</b>: <code>MOV 0, 1</code> copies its own cell (0 = “me”) into the next one (1). Then its finger moves on – right onto the fresh copy.
So it crawls through memory and paints everything pink. If it crawls over the blue program, it overwrites it!</p>
<p class="tip">Step through and watch the explanation: it always says whose turn it is next.</p>`,
    },
    de: {
      title: 'Mehrere Programme: Wer ist dran?',
      subtitle: 'Faires Abwechseln im selben Speicher',
      html: `
<p>In einer Partie <b>teilen sich mehrere Programme denselben Speicher</b>. Jedes wird an eine zufällige Stelle geladen und hat seine eigene Farbe.
Keins weiß, wo die anderen sind.</p>
<p>Sie wechseln sich ab, streng fair: <b>Blau führt einen Befehl aus, dann Pink einen, dann wieder Blau …</b>
Eine Runde, in der jedes Programm einmal dran war, heißt <b>Zyklus</b>.</p>
<p>Das pinke Programm ist der <b>Wichtel</b>: <code>MOV 0, 1</code> kopiert die eigene Zelle (0 = „ich“) in die nächste (1). Dann rückt sein Finger weiter – genau auf die frische Kopie.
So kriecht er durch den Speicher und färbt alles pink. Kriecht er über das blaue Programm, überschreibt er es!</p>
<p class="tip">Geh Schritt für Schritt durch und beobachte die Erklärung: Sie sagt immer, wer als Nächstes dran ist.</p>`,
    },
  },
  {
    id: 'b6',
    demo: { programs: [{ start: 3, code: {
      en: 'start   SPL other     ; split: a 2nd process starts at "other"\nloop    ADD #1, a\n        JMP loop\nother   ADD #1, b\n        JMP other\na       DAT #0, #0\nb       DAT #0, #0',
      de: 'start   SPL zweiter   ; teilen: 2. Prozess startet bei "zweiter"\nloop    ADD #1, a\n        JMP loop\nzweiter ADD #1, b\n        JMP zweiter\na       DAT #0, #0\nb       DAT #0, #0',
    } }] },
    en: {
      title: 'Reproduction: one becomes two',
      subtitle: 'SPL and the queue of processes',
      html: `
<p>A program can have <b>several fingers</b> – several processes. The instruction <code>SPL</code> (“split”) creates a new one:
the old process simply continues, and a <b>new process</b> starts at the given address.</p>
<p>All processes of a program wait in a <b>queue</b>. When it is the program's turn, only the <b>front</b> process executes one instruction and then goes to the back of the queue.
So more processes do <b>not</b> make a program faster – they take turns. But they make it <b>harder to kill</b>: the program lives as long as any of its processes lives.</p>
<p>Below the grid you can see the queue: the first entry is the next one.</p>
<p class="tip">Step through: after SPL there are two ▶ arrows, which take turns. One counts <i>a</i> up, the other <i>b</i>.</p>`,
    },
    de: {
      title: 'Fortpflanzung: aus eins mach zwei',
      subtitle: 'SPL und die Warteschlange der Prozesse',
      html: `
<p>Ein Programm kann <b>mehrere Finger</b> haben – mehrere Prozesse. Der Befehl <code>SPL</code> („split“, teilen) erzeugt einen neuen:
Der alte Prozess macht einfach weiter, und zusätzlich startet ein <b>neuer Prozess</b> an der angegebenen Adresse.</p>
<p>Alle Prozesse eines Programms stehen in einer <b>Warteschlange</b>. Ist das Programm dran, führt nur der <b>vorderste</b> Prozess einen Befehl aus und stellt sich dann hinten an.
Mehr Prozesse machen ein Programm also <b>nicht</b> schneller – sie wechseln sich ab. Aber sie machen es <b>schwerer zu besiegen</b>: Das Programm lebt, solange irgendein Prozess lebt.</p>
<p>Unter dem Raster siehst du die Warteschlange: Der erste Eintrag ist als Nächstes dran.</p>
<p class="tip">Geh Schritt für Schritt: Nach SPL gibt es zwei ▶-Pfeile, die sich abwechseln. Einer zählt <i>a</i> hoch, der andere <i>b</i>.</p>`,
    },
  },
  {
    id: 'b7',
    demo: { programs: [
      { start: 1, code: { en: 'start   ADD #4, bomb\n        MOV bomb, @bomb\n        JMP start\nbomb    DAT #0, #0', de: 'start   ADD #4, bomb\n        MOV bomb, @bomb\n        JMP start\nbomb    DAT #0, #0' } },
      { start: 18, code: { en: 'loop    NOP\n        NOP\n        NOP\n        JMP loop', de: 'loop    NOP\n        NOP\n        NOP\n        JMP loop' } },
    ] },
    en: {
      title: 'Dying and winning',
      subtitle: 'Why DAT is a bomb',
      html: `
<p><code>DAT</code> is not a real instruction – it only holds data. If a process lands on a DAT cell and tries to execute it, <b>the process dies</b>.</p>
<p>That is the whole trick of the game: <b>copy DAT cells into the code of your opponents</b>. When their finger runs into it, it is gone.
If a program has <b>no process left</b>, it is out. <b>The last program standing wins.</b>
If nobody has won after a fixed number of cycles, the match is a draw.</p>
<p>Below, the blue <b>Dwarf</b> bombs every fourth cell. The pink <b>Sitting Duck</b> just runs in a circle over four cells – sooner or later one of them gets a bomb.</p>
<p class="tip">Press <b>Auto</b> and watch. Then you know everything you need – on to the real lessons!</p>`,
    },
    de: {
      title: 'Sterben und Gewinnen',
      subtitle: 'Warum DAT eine Bombe ist',
      html: `
<p><code>DAT</code> ist kein echter Befehl – er enthält nur Daten. Landet ein Prozess auf einer DAT-Zelle und will sie ausführen, <b>stirbt der Prozess</b>.</p>
<p>Das ist der ganze Trick des Spiels: <b>Kopiere DAT-Zellen in den Code deiner Gegner.</b> Läuft ihr Finger hinein, ist er weg.
Hat ein Programm <b>keinen Prozess mehr</b>, scheidet es aus. <b>Das letzte übrige Programm gewinnt.</b>
Hat nach einer festen Zahl von Zyklen niemand gewonnen, endet die Partie unentschieden.</p>
<p>Unten bombardiert der blaue <b>Zwerg</b> jede vierte Zelle. Die pinke <b>Sitzende Ente</b> läuft nur im Kreis über vier Zellen – früher oder später bekommt eine davon eine Bombe ab.</p>
<p class="tip">Drück <b>Auto</b> und schau zu. Dann weißt du alles Nötige – weiter zu den echten Lektionen!</p>`,
    },
  },
];

// ------------------------------------------------------------------ step explanations
const TX = {
  en: {
    turn: (who, pc, ins) => `${who}'s turn. Its process points at cell <b>${pc}</b> and executes <code>${ins}</code>.`,
    sleeping: (n) => `But the process is still asleep (${n} more turn${n === 1 ? '' : 's'}) and does nothing.`,
    movImm: (v, b) => `Writes the number <b>${v}</b> into the B field of cell ${b}.`,
    mov: (a, b) => `Copies the whole content of cell ${a} into cell ${b}.`,
    addImm: (v, b, r, sub) => `${sub ? 'Subtracts' : 'Adds'} <b>${v}</b> ${sub ? 'from' : 'to'} the B field of cell ${b}. It now holds <b>${r}</b>.`,
    add: (a, b, sub) => `${sub ? 'Subtracts' : 'Adds'} both fields of cell ${a} ${sub ? 'from' : 'to'} cell ${b}.`,
    jmp: (a) => `Jump! The process continues at cell ${a}.`,
    jmz: (b, v, yes, a) => `Checks the B field of cell ${b}: it is <b>${v}</b>. ${yes ? `That is 0 → jump to cell ${a}.` : 'That is not 0 → no jump.'}`,
    jmn: (b, v, yes, a) => `Checks the B field of cell ${b}: it is <b>${v}</b>. ${yes ? `That is not 0 → jump to cell ${a}.` : 'That is 0 → no jump.'}`,
    djn: (b, v, yes, a) => `Decreases the B field of cell ${b} by 1 – now <b>${v}</b>. ${yes ? `Not 0 → jump to cell ${a}.` : '0 → no jump, the loop ends.'}`,
    cmp: (a, b, eq, skip) => `Compares cell ${a} with cell ${b}: <b>${eq ? 'equal' : 'different'}</b>. ${skip ? 'So the next instruction is skipped.' : 'Nothing is skipped.'}`,
    slt: (x, y, skip) => `Is ${x} smaller than ${y}? <b>${skip ? 'Yes' : 'No'}</b>. ${skip ? 'So the next instruction is skipped.' : 'Nothing is skipped.'}`,
    spl: (a, n) => `Splits: besides the current process, a <b>new process</b> starts at cell ${a}. The program now has <b>${n}</b> processes.`,
    splFull: () => 'Wants to split, but the process limit is reached.',
    dat: () => '<b>DAT cannot be executed – the process dies!</b>',
    out: (who) => ` ${who} has no processes left and is <b>out</b>.`,
    nop: () => 'Does nothing.',
    wait: (n) => `Goes to sleep for <b>${n}</b> of its own turns.`,
    rnd: (v, b) => `Rolls the dice: <b>${v}</b>, written into the B field of cell ${b}.`,
    next: (c) => `This process executes cell <b>${c}</b> next.`,
    nextTurn: (who) => `Next it's ${who}'s turn.`,
    winner: (who) => `🏆 ${who} is the last one standing and <b>wins</b>!`,
    queue: 'Queue',
    start: 'Press <b>Step</b> to execute the first instruction.',
    step: 'Step', auto: 'Auto', stop: 'Stop', reset: 'Reset',
  },
  de: {
    turn: (who, pc, ins) => `${who} ist dran. Sein Prozess zeigt auf Zelle <b>${pc}</b> und führt <code>${ins}</code> aus.`,
    sleeping: (n) => `Der Prozess schläft aber noch (${n} Zug${n === 1 ? '' : 'e'}) und tut nichts.`,
    movImm: (v, b) => `Schreibt die Zahl <b>${v}</b> in das B-Feld von Zelle ${b}.`,
    mov: (a, b) => `Kopiert den ganzen Inhalt von Zelle ${a} in Zelle ${b}.`,
    addImm: (v, b, r, sub) => `${sub ? 'Zieht' : 'Addiert'} <b>${v}</b> ${sub ? 'vom' : 'zum'} B-Feld von Zelle ${b}${sub ? ' ab' : ''}. Dort steht jetzt <b>${r}</b>.`,
    add: (a, b, sub) => `${sub ? 'Zieht' : 'Addiert'} beide Felder von Zelle ${a} ${sub ? 'von' : 'zu'} Zelle ${b}${sub ? ' ab' : ''}.`,
    jmp: (a) => `Sprung! Der Prozess macht bei Zelle ${a} weiter.`,
    jmz: (b, v, yes, a) => `Prüft das B-Feld von Zelle ${b}: Es ist <b>${v}</b>. ${yes ? `Das ist 0 → Sprung zu Zelle ${a}.` : 'Das ist nicht 0 → kein Sprung.'}`,
    jmn: (b, v, yes, a) => `Prüft das B-Feld von Zelle ${b}: Es ist <b>${v}</b>. ${yes ? `Das ist nicht 0 → Sprung zu Zelle ${a}.` : 'Das ist 0 → kein Sprung.'}`,
    djn: (b, v, yes, a) => `Verringert das B-Feld von Zelle ${b} um 1 – jetzt <b>${v}</b>. ${yes ? `Nicht 0 → Sprung zu Zelle ${a}.` : '0 → kein Sprung, die Schleife endet.'}`,
    cmp: (a, b, eq, skip) => `Vergleicht Zelle ${a} mit Zelle ${b}: <b>${eq ? 'gleich' : 'verschieden'}</b>. ${skip ? 'Darum wird der nächste Befehl übersprungen.' : 'Es wird nichts übersprungen.'}`,
    slt: (x, y, skip) => `Ist ${x} kleiner als ${y}? <b>${skip ? 'Ja' : 'Nein'}</b>. ${skip ? 'Darum wird der nächste Befehl übersprungen.' : 'Es wird nichts übersprungen.'}`,
    spl: (a, n) => `Teilt sich: Neben dem bisherigen Prozess startet ein <b>neuer Prozess</b> bei Zelle ${a}. Das Programm hat jetzt <b>${n}</b> Prozesse.`,
    splFull: () => 'Will sich teilen, aber das Prozesslimit ist erreicht.',
    dat: () => '<b>DAT kann man nicht ausführen – der Prozess stirbt!</b>',
    out: (who) => ` ${who} hat keinen Prozess mehr und <b>scheidet aus</b>.`,
    nop: () => 'Tut nichts.',
    wait: (n) => `Legt sich für <b>${n}</b> eigene Züge schlafen.`,
    rnd: (v, b) => `Würfelt: <b>${v}</b>, geschrieben in das B-Feld von Zelle ${b}.`,
    next: (c) => `Als Nächstes führt dieser Prozess Zelle <b>${c}</b> aus.`,
    nextTurn: (who) => `Danach ist ${who} dran.`,
    winner: (who) => `🏆 ${who} ist als Einziges übrig und <b>gewinnt</b>!`,
    queue: 'Warteschlange',
    start: 'Drück auf <b>Schritt</b>, um den ersten Befehl auszuführen.',
    step: 'Schritt', auto: 'Auto', stop: 'Stopp', reset: 'Neu',
  },
};

// ------------------------------------------------------------------ mini simulator
export class MiniSim {
  /**
   * @param {HTMLElement} host
   * @param {object} demo  chapter demo definition
   * @param {string} lang
   */
  constructor(host, demo, lang) {
    this.host = host;
    this.demo = demo;
    this.lang = lang;
    this.T = TX[lang] || TX.en;
    this.timer = null;
    host.innerHTML = `
      <div class="mini">
        <div class="mini-grid"></div>
        <div class="mini-queue"></div>
        <div class="mini-explain"></div>
        <div class="row mini-ctrl">
          <button class="btn small" data-mini="reset">⟲ ${this.T.reset}</button>
          <button class="btn small primary" data-mini="step">⏭ ${this.T.step}</button>
          <button class="btn small" data-mini="auto">▶ ${this.T.auto}</button>
        </div>
      </div>`;
    this.grid = host.querySelector('.mini-grid');
    this.queueEl = host.querySelector('.mini-queue');
    this.explainEl = host.querySelector('.mini-explain');
    host.querySelector('[data-mini=reset]').onclick = () => this.reset();
    host.querySelector('[data-mini=step]').onclick = () => { this.stopAuto(); this.step(); };
    this.autoBtn = host.querySelector('[data-mini=auto]');
    this.autoBtn.onclick = () => (this.timer ? this.stopAuto() : this.startAuto());
    this.reset();
  }

  reset() {
    this.stopAuto();
    const progs = this.demo.programs.map((p) => assemble(p.code[this.lang] || p.code.en, { coreSize: MINI }));
    this.labels = new Map();
    this.arena = new Arena({ coreSize: MINI, minDistance: 0, maxCycles: 5000, seed: 7 });
    const names = this.demo.programs.length > 1 ? (this.lang === 'de' ? ['Blau', 'Pink'] : ['Blue', 'Pink']) : [this.lang === 'de' ? 'Blau' : 'Blue'];
    this.arena.load(progs.map((program, i) => ({ name: names[i], color: PLAYER_COLORS[i === 1 ? 1 : 0], program })), this.demo.programs.map((p) => p.start));
    progs.forEach((pr, i) => pr.labelAt.forEach((ls, k) => { if (ls.length) this.labels.set((this.demo.programs[i].start + k) % MINI, ls.join(', ')); }));
    this.lastTouched = new Set();
    this.lastPc = -1;
    this.explainEl.innerHTML = this.T.start;
    this.render();
  }

  startAuto() {
    this.timer = setInterval(() => { if (!this.step()) this.stopAuto(); }, 650);
    this.autoBtn.textContent = `❚❚ ${this.T.stop}`;
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.autoBtn) this.autoBtn.textContent = `▶ ${this.T.auto}`;
  }

  destroy() { this.stopAuto(); }

  who(p) { return `<b style="color:${p.color}">${esc(p.name)}</b>`; }

  /** Executes one instruction and explains it. Returns false when the match is over. */
  step() {
    const a = this.arena;
    if (a.finished) return false;
    const T = this.T;
    const n = a.size;
    const p = a.players[a.turn];
    const q = p.queue;
    const pc = q.pc[q.head];
    const sleep = q.sleep[q.head];
    const op = a.op[pc], am = a.am[pc], av = a.av[pc], bm = a.bm[pc], bv = a.bv[pc];
    const ins = disassemble(op, am, av, bm, bv, n);
    // where the operands point (computed before execution, without side effects)
    const peek = (mode, val) => {
      if (mode === MODE.IMM) return pc;
      const t = (pc + val) % n;
      if (mode === MODE.DIR) return t;
      if (mode === MODE.DEC) return (t + a.bv[t] - 1 + n) % n;
      return (t + a.bv[t]) % n;
    };
    const aAddr = peek(am, av);
    const bAddr = peek(bm, bv);
    const before = { aCell: a.cell(aAddr), bCell: a.cell(bAddr), count: q.count };
    const snapshot = Array.from(a.writeCount);

    a.tick();

    this.lastTouched = new Set();
    for (let i = 0; i < n; i++) if (a.writeCount[i] !== snapshot[i]) this.lastTouched.add(i);
    this.lastPc = pc;
    const lbl = (x) => (this.labels.has(x) ? ` <i>(${esc(this.labels.get(x))})</i>` : '');
    const A = `${aAddr}${lbl(aAddr)}`, B = `${bAddr}${lbl(bAddr)}`;
    const parts = [T.turn(this.who(p), pc, esc(ins))];
    let died = false;
    if (sleep > 0) parts.push(T.sleeping(sleep));
    else {
      const bAfter = a.bv[bAddr];
      switch (op) {
        case OP.DAT: parts.push(T.dat()); died = true; if (!p.alive) parts.push(T.out(this.who(p))); break;
        case OP.MOV: parts.push(am === MODE.IMM ? T.movImm(av, B) : T.mov(A, B)); break;
        case OP.ADD: case OP.SUB: parts.push(am === MODE.IMM ? T.addImm(av, B, bAfter, op === OP.SUB) : T.add(A, B, op === OP.SUB)); break;
        case OP.JMP: parts.push(T.jmp(A)); break;
        case OP.JMZ: parts.push(T.jmz(B, before.bCell.bv, before.bCell.bv === 0, A)); break;
        case OP.JMN: parts.push(T.jmn(B, before.bCell.bv, before.bCell.bv !== 0, A)); break;
        case OP.DJN: parts.push(T.djn(B, bAfter, bAfter !== 0, A)); break;
        case OP.SEQ: case OP.SNE: {
          const x = before.aCell, y = before.bCell;
          const eq = am === MODE.IMM ? av === y.bv : x.op === y.op && x.am === y.am && x.av === y.av && x.bm === y.bm && x.bv === y.bv;
          parts.push(T.cmp(A, B, eq, op === OP.SEQ ? eq : !eq));
          break;
        }
        case OP.SLT: {
          const x = am === MODE.IMM ? av : before.aCell.bv;
          parts.push(T.slt(x, before.bCell.bv, x < before.bCell.bv));
          break;
        }
        case OP.SPL: parts.push(q.count > before.count ? T.spl(A, q.count) : T.splFull()); break;
        case OP.NOP: parts.push(T.nop()); break;
        case OP.WAIT: parts.push(T.wait(am === MODE.IMM ? av : before.aCell.bv)); break;
        case OP.RND: parts.push(T.rnd(bAfter, B)); break;
        default: break;
      }
    }
    if (!died && q.count) {
      const contIdx = op === OP.SPL && sleep === 0 && q.count > before.count ? q.count - 2 : q.count - 1;
      parts.push(T.next(q.pc[(q.head + contIdx) % q.cap]));
    }
    if (a.finished && a.result.winner != null) parts.push(T.winner(this.who(a.players[a.result.winner])));
    else if (a.players.length > 1 && !a.finished) parts.push(T.nextTurn(this.who(a.players[a.turn])));
    this.explainEl.innerHTML = parts.join(' ');
    this.render();
    return !a.finished;
  }

  render() {
    const a = this.arena;
    const n = a.size;
    const heads = new Map();
    a.players.forEach((p) => { if (p.alive) p.queue.forEach((pc, s, k) => { if (!heads.has(pc)) heads.set(pc, { p, first: k === 0 && a.turn === p.id }); }); });
    let html = '';
    for (let i = 0; i < n; i++) {
      const owner = a.owner[i];
      const col = owner >= 0 ? a.players[owner].color : '';
      const op = a.op[i];
      const name = OP_NAMES[op];
      const text = disassemble(op, a.am[i], a.av[i], a.bm[i], a.bv[i], n);
      const h = heads.get(i);
      const cls = ['mini-cell'];
      if (owner >= 0) cls.push('owned');
      if (op === OP.DAT && owner >= 0) cls.push('dat');
      if (this.lastTouched.has(i)) cls.push('touched');
      if (i === this.lastPc) cls.push('ran');
      if (h) cls.push('has-pc');
      if (h && h.first) cls.push('pc-next');
      const style = [col ? `--c:${col}` : '', h ? `--pcc:${h.p.color}` : ''].filter(Boolean).join(';');
      html += `<div class="${cls.join(' ')}" style="${style}">
        <div class="mini-top"><span class="mini-adr">${i}</span>${this.labels.has(i) ? `<span class="mini-lbl">${esc(this.labels.get(i))}</span>` : ''}</div>
        <div class="mini-ins"><span class="op-${OP_INFO[name].group}">${name}</span>${esc(text.slice(name.length))}</div>
        ${h ? `<span class="mini-pc">▶</span>` : ''}
      </div>`;
    }
    this.grid.innerHTML = html;
    this.queueEl.innerHTML = a.players.map((p) => {
      const items = [];
      p.queue.forEach((pc) => items.push(pc));
      return `<span class="mini-q"><b style="color:${p.color}">${esc(p.name)}</b> · ${this.T.queue}: ${p.alive ? items.map((x, k) => `<span class="${k === 0 ? 'q-first' : ''}">${x}</span>`).join(' → ') : '☠'}</span>`;
    }).join('');
  }
}
