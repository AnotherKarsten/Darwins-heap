// "Basics": a very gentle introduction for people who have never seen assembly.
// Every chapter has a short text and a tiny memory (32 cells) that can be executed
// one instruction at a time, with a plain-language explanation of every step.

// The interactive mini memory lives in basics-sim.js.

export { MiniSim } from './basics-sim.js';

const COUNTER = { en: 'start   ADD #1, counter\n        JMP start\ncounter DAT #0, #0', de: 'start   ADD #1, zaehler\n        JMP start\nzaehler DAT #0, #0' };

// ------------------------------------------------------------------ chapters
export const BASICS = [
  {
    id: 'b1',
    demo: { programs: [{ start: 4, code: COUNTER }], noSteps: true, hidePc: true, select: 4 },
    en: {
      title: 'Memory is a row of boxes',
      subtitle: 'What the colourful grid actually shows',
      html: `
<p>Imagine the computer's memory as a <b>long row of numbered boxes</b>. Each box is called a <b>cell</b>, and its number is its <b>address</b>.
In the real game there are 4000 cells, here there are only 32 so you can see everything.</p>
<p>The row has no end: after cell 31 comes cell 0 again. The memory is a <b>ring</b>. In the grid it is simply wrapped into lines, like text in a book.</p>
<p>Each cell contains exactly <b>one instruction</b>. Your program is simply a few instructions written into <b>neighbouring cells</b> – below it occupies cells 4, 5 and 6 (blue).
All other cells are empty: they contain <code>DAT #0, #0</code>, which means “nothing”.</p>
<p class="tip">Nothing happens yet – just look. The next chapter explains what exactly is inside one cell.</p>`,
    },
    de: {
      title: 'Speicher ist eine Reihe Kästchen',
      subtitle: 'Was das bunte Raster eigentlich zeigt',
      html: `
<p>Stell dir den Speicher des Computers als <b>lange Reihe nummerierter Kästchen</b> vor. Jedes Kästchen heißt <b>Zelle</b>, seine Nummer ist seine <b>Adresse</b>.
Im echten Spiel gibt es 4000 Zellen, hier nur 32, damit du alles sehen kannst.</p>
<p>Die Reihe hat kein Ende: Nach Zelle 31 kommt wieder Zelle 0. Der Speicher ist ein <b>Ring</b>. Im Raster ist er nur in Zeilen umgebrochen, wie Text in einem Buch.</p>
<p>In jeder Zelle steht genau <b>ein Befehl</b>. Dein Programm sind einfach ein paar Befehle in <b>benachbarten Zellen</b> – unten belegt es die Zellen 4, 5 und 6 (blau).
Alle anderen Zellen sind leer: In ihnen steht <code>DAT #0, #0</code>, das heißt „nichts“.</p>
<p class="tip">Noch passiert nichts – schau einfach hin. Im nächsten Kapitel schauen wir in eine einzelne Zelle hinein.</p>`,
    },
  },
  {
    id: 'bcell',
    demo: { programs: [{ start: 4, code: COUNTER }], noSteps: true, hidePc: true, select: 4 },
    en: {
      title: 'Inside a cell: A field and B field',
      subtitle: 'Every instruction has exactly three parts',
      html: `
<p>Every cell contains three things – in the grid you see them as three parts of each box:</p>
<div class="anatomy">
  <div class="anat-op"><b>ADD</b><small>the instruction:<br>what to do</small></div>
  <div class="anat-a"><b>#1</b><small><span class="fa">A field</span><br>usually: what? / from where?</small></div>
  <div class="anat-b"><b>$2</b><small><span class="fb">B field</span><br>usually: where to?</small></div>
</div>
<p>The two fields are always shown in the same colours: <span class="fa">A field</span> and <span class="fb">B field</span>. Each field holds a <b>number</b>, and a small sign in front says how to read the number:</p>
<ul>
<li><code>#</code> – the number <b>itself</b>. <code>#1</code> simply means “one”.</li>
<li><code>$</code> – an <b>address</b>, counted from this cell. <code>$2</code> means “the cell 2 places further”. From cell 4 that is cell 4 + 2 = <b>6</b>. <code>$-1</code> means “1 place back”.</li>
</ul>
<p><b>Rule of thumb:</b> numbers that an instruction calculates with are always stored in the <span class="fb">B field</span> of a cell. Even the empty <code>DAT #0, #0</code> has an <span class="fa">A field</span> (0) and a <span class="fb">B field</span> (0).</p>
<p class="tip"><b>Click on any cell</b> in the grid. Below it, the cell is explained field by field – and the cells its fields point to are marked with <span class="fa">A→</span> and <span class="fb">B→</span>.</p>`,
    },
    de: {
      title: 'Blick in eine Zelle: A-Feld und B-Feld',
      subtitle: 'Jeder Befehl hat genau drei Teile',
      html: `
<p>In jeder Zelle stehen drei Dinge – im Raster siehst du sie als drei Teile jedes Kästchens:</p>
<div class="anatomy">
  <div class="anat-op"><b>ADD</b><small>der Befehl:<br>was tun?</small></div>
  <div class="anat-a"><b>#1</b><small><span class="fa">A-Feld</span><br>meistens: was? / woher?</small></div>
  <div class="anat-b"><b>$2</b><small><span class="fb">B-Feld</span><br>meistens: wohin?</small></div>
</div>
<p>Die beiden Felder haben überall dieselben Farben: <span class="fa">A-Feld</span> und <span class="fb">B-Feld</span>. Jedes Feld enthält eine <b>Zahl</b>, und ein kleines Zeichen davor sagt, wie die Zahl gemeint ist:</p>
<ul>
<li><code>#</code> – die Zahl <b>selbst</b>. <code>#1</code> heißt einfach „eins“.</li>
<li><code>$</code> – eine <b>Adresse</b>, gezählt ab dieser Zelle. <code>$2</code> heißt „die Zelle 2 Plätze weiter“. Von Zelle 4 aus ist das Zelle 4 + 2 = <b>6</b>. <code>$-1</code> heißt „1 Platz zurück“.</li>
</ul>
<p><b>Faustregel:</b> Zahlen, mit denen ein Befehl rechnet, stehen immer im <span class="fb">B-Feld</span> einer Zelle. Auch das leere <code>DAT #0, #0</code> hat ein <span class="fa">A-Feld</span> (0) und ein <span class="fb">B-Feld</span> (0).</p>
<p class="tip"><b>Klick auf irgendeine Zelle</b> im Raster. Darunter wird sie Feld für Feld erklärt – und die Zellen, auf die ihre Felder zeigen, werden mit <span class="fa">A→</span> und <span class="fb">B→</span> markiert.</p>`,
    },
  },
  {
    id: 'bpc',
    demo: { programs: [{ start: 4, code: COUNTER }] },
    en: {
      title: 'Where it starts: the program counter',
      subtitle: 'Which instruction runs – and which one next?',
      html: `
<p>A program does nothing by itself. Something has to <b>execute</b> it: a <b>process</b>. A process only remembers <b>one number</b>:
the address of the cell it executes next. That number is called the <b>program counter</b>, or <b>PC</b> for short. In the grid it is the <b>▶ badge</b> with a coloured frame.</p>
<p><b>Where does it start?</b></p>
<ol>
<li>At the beginning of a match the game copies your program to a <b>random place</b> in memory. (Here it is always cell 4, so the examples stay the same.)</li>
<li>The PC is set to the line with the label <code>start</code>. If there is no such label, it starts at the <b>first line</b>.</li>
</ol>
<p><b>What happens in each step?</b></p>
<ol>
<li>The instruction in the cell at the PC is <b>executed</b>.</li>
<li>Then the PC <b>moves on</b>: normally by 1, to the next cell. A jump such as <code>JMP start</code> sets the PC to another cell instead.</li>
</ol>
<p>So the program below runs <i>start → JMP → start → JMP …</i> forever. That is a <b>loop</b>.</p>
<p class="tip">Press <b>Step</b> and read the explanation line by line. Above the explanation you always see the current <b>PC</b>.</p>`,
    },
    de: {
      title: 'Wo es losgeht: der Programmzähler',
      subtitle: 'Welcher Befehl läuft – und welcher als Nächstes?',
      html: `
<p>Ein Programm tut von allein nichts. Etwas muss es <b>ausführen</b>: ein <b>Prozess</b>. Ein Prozess merkt sich nur <b>eine einzige Zahl</b>:
die Adresse der Zelle, die er als Nächstes ausführt. Diese Zahl heißt <b>Programmzähler</b>, kurz <b>PC</b> (engl. <i>program counter</i>). Im Raster ist das das <b>▶-Abzeichen</b> mit farbigem Rahmen.</p>
<p><b>Wo fängt es an?</b></p>
<ol>
<li>Zu Beginn einer Partie kopiert das Spiel dein Programm an eine <b>zufällige Stelle</b> im Speicher. (Hier ist es immer Zelle 4, damit die Beispiele gleich bleiben.)</li>
<li>Der PC wird auf die Zeile mit dem Label <code>start</code> gesetzt. Gibt es kein solches Label, beginnt er bei der <b>ersten Zeile</b>.</li>
</ol>
<p><b>Was passiert bei jedem Schritt?</b></p>
<ol>
<li>Der Befehl in der Zelle, auf die der PC zeigt, wird <b>ausgeführt</b>.</li>
<li>Dann <b>rückt der PC weiter</b>: normalerweise um 1, auf die nächste Zelle. Ein Sprung wie <code>JMP start</code> setzt den PC stattdessen auf eine andere Zelle.</li>
</ol>
<p>Das Programm unten läuft darum für immer <i>start → JMP → start → JMP …</i> Das ist eine <b>Schleife</b>.</p>
<p class="tip">Drück auf <b>Schritt</b> und lies die Erklärung Zeile für Zeile. Über der Erklärung siehst du immer den aktuellen <b>PC</b>.</p>`,
    },
  },
  {
    id: 'bcount',
    demo: { programs: [{ start: 4, code: COUNTER }], select: 6 },
    en: {
      title: 'The counter, step by step',
      subtitle: 'ADD #1, counter – taken apart completely',
      html: `
<p>Let's take the first line apart completely: <code>ADD #1, counter</code>.</p>
<ol>
<li><b>ADD</b> means: add something.</li>
<li><span class="fa">A field</span> <code>#1</code>: because of the <code>#</code> this is simply <b>the number 1</b> – that is what gets added.</li>
<li><span class="fb">B field</span> <code>counter</code>: no <code>#</code>, so it is an <b>address</b>. <i>counter</i> is the label of cell 6. Seen from cell 4 that is 2 places further,
so the game stores <code>$2</code> (that is why the grid shows <code>$2</code> instead of the name). 4 + 2 = <b>cell 6</b>.</li>
<li>ADD adds the 1 to the <span class="fb">B field</span> <b>of cell 6</b>. Before: <code>DAT #0, #0</code>. After: <code>DAT #0, #1</code>. Next time <code>#2</code>, then <code>#3</code> …</li>
</ol>
<p>So the “counter” is nothing but the <span class="fb">B field</span> of cell 6. The <code>DAT</code> there is never executed – the PC never gets there, because <code>JMP</code> sends it back to start first. The cell is only used to <b>store a number</b>.</p>
<p class="tip">Cell 6 is already selected below, so you can watch its <span class="fb">B field</span> while you press <b>Step</b>. A changed field lights up white.</p>`,
    },
    de: {
      title: 'Der Zähler Schritt für Schritt',
      subtitle: 'ADD #1, zaehler – ganz auseinandergenommen',
      html: `
<p>Nehmen wir die erste Zeile ganz auseinander: <code>ADD #1, zaehler</code>.</p>
<ol>
<li><b>ADD</b> heißt: etwas dazuzählen.</li>
<li><span class="fa">A-Feld</span> <code>#1</code>: Wegen des <code>#</code> ist das einfach <b>die Zahl 1</b> – das wird dazugezählt.</li>
<li><span class="fb">B-Feld</span> <code>zaehler</code>: kein <code>#</code>, also eine <b>Adresse</b>. <i>zaehler</i> ist das Label von Zelle 6. Von Zelle 4 aus gesehen liegt sie 2 Plätze weiter,
darum speichert das Spiel <code>$2</code> (deshalb steht im Raster <code>$2</code> statt des Namens). 4 + 2 = <b>Zelle 6</b>.</li>
<li>ADD zählt die 1 zum <span class="fb">B-Feld</span> <b>von Zelle 6</b> dazu. Vorher: <code>DAT #0, #0</code>. Nachher: <code>DAT #0, #1</code>. Beim nächsten Mal <code>#2</code>, dann <code>#3</code> …</li>
</ol>
<p>Der „Zähler“ ist also nichts anderes als das <span class="fb">B-Feld</span> von Zelle 6. Das <code>DAT</code> dort wird nie ausgeführt – der PC kommt nie dorthin, weil <code>JMP</code> ihn vorher zurück zu start schickt. Die Zelle dient nur dazu, <b>eine Zahl aufzubewahren</b>.</p>
<p class="tip">Zelle 6 ist unten schon ausgewählt, so siehst du ihr <span class="fb">B-Feld</span>, während du auf <b>Schritt</b> drückst. Ein geändertes Feld leuchtet weiß auf.</p>`,
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
<p class="tip">Step through and watch the <span class="fb">B fields</span> of box_a and box_b. Notice: data and code live in the <b>same memory</b>. A program could even overwrite its own instructions – or those of others!</p>`,
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
<p class="tip">Geh Schritt für Schritt durch und beobachte die <span class="fb">B-Felder</span> von kiste_a und kiste_b. Merke: Daten und Code liegen im <b>selben Speicher</b>. Ein Programm könnte sogar seine eigenen Befehle überschreiben – oder die anderer!</p>`,
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

