// Mitgelieferte Programme: Gegner für Einzelspieler und Vorlagen zum Lernen.

export const BOTS = [
  {
    id: 'ente',
    level: 1,
    name: 'Sitzende Ente',
    blurb: 'Dreht sich in einer kleinen Schleife im Kreis und wehrt sich nicht. Das perfekte erste Ziel.',
    code: `;name Sitzende Ente
;author Darwin's Heap
;strategy Eine Endlosschleife über vier Zellen. Wehrt sich nicht.
loop    NOP
        NOP
        NOP
        JMP loop
`,
  },
  {
    id: 'wichtel',
    level: 1,
    name: 'Wichtel',
    blurb: 'Das kleinste Programm der Welt: kopiert sich eine Zelle weiter und läuft hinterher.',
    code: `;name Wichtel
;author Darwin's Heap
;strategy Kopiert sich ständig eine Zelle nach vorn und läuft
;strategy dann in die eigene Kopie. Schwer zu treffen, greift aber nie an.
        MOV 0, 1
`,
  },
  {
    id: 'zwerg',
    level: 2,
    name: 'Zwerg',
    blurb: 'Der Klassiker: wirft alle 4 Zellen eine DAT-Bombe in den Speicher.',
    code: `;name Zwerg
;author Darwin's Heap
;strategy Wirft im festen Abstand DAT-Bomben. Weil der Abstand den
;strategy Speicher genau teilt, trifft er sich nie selbst.
start   ADD #4, bomb      ; Ziel um 4 Zellen weiterschieben
        MOV bomb, @bomb   ; Bombe dorthin kopieren, wohin bomb zeigt
        JMP start         ; und wieder von vorn
bomb    DAT #0, #0
`,
  },
  {
    id: 'wuerfler',
    level: 2,
    name: 'Würfler',
    blurb: 'Bombardiert zufällige Stellen – unberechenbar, aber nie sich selbst.',
    code: `;name Würfler
;author Darwin's Heap
;strategy Würfelt ein Ziel außerhalb des eigenen Codes und wirft dort eine Bombe.
ptr     DAT #0, #0
start   RND #CORESIZE-6, ptr   ; Zufall 0 … CORESIZE-7
        ADD #6, ptr            ; eigene 6 Zellen überspringen
        MOV bomb, @ptr
        JMP start
bomb    DAT #0, #0
`,
  },
  {
    id: 'spaeher',
    level: 2,
    name: 'Späher',
    blurb: 'Sucht den Speicher nach allem ab, was nicht leer ist, und bombardiert gezielt.',
    code: `;name Späher
;author Darwin's Heap
;strategy Tastet den Speicher in 3er-Schritten ab. Sieht eine Zelle anders aus
;strategy als leerer Speicher, wirft er dort zwei Bomben hin.
step    EQU 3
count   EQU (CORESIZE-13)/step
ptr     DAT #0, #0
cnt     DAT #0, #0
bomb    DAT #0, #0            ; sieht genauso aus wie leerer Speicher
start   MOV #12, ptr          ; hinter dem eigenen Code beginnen
        MOV #count, cnt
scan    ADD #step, ptr
        DJN look, cnt         ; Runde vorbei? Dann von vorn
        JMP start
look    SNE bomb, @ptr        ; anders als leer? Dann nächste Zeile überspringen
        JMP scan              ; leer – weitersuchen
        MOV bomb, @ptr        ; Treffer! Bombe werfen …
        MOV bomb, <ptr        ; … und gleich noch eine davor
        JMP scan
`,
  },
  {
    id: 'mitose',
    level: 3,
    name: 'Mitose',
    blurb: 'Kopiert sich immer wieder an neue Stellen und startet die Kopien. Wächst exponentiell.',
    code: `;name Mitose
;author Darwin's Heap
;strategy Ein Replikator: kopiert sich selbst, startet die Kopie mit SPL
;strategy und verschiebt das nächste Ziel. Jede Kopie tut dasselbe.
dist    DAT #0, #1601        ; Abstand zur nächsten Kopie
src     DAT #0, #0
dst     DAT #0, #0
cnt     DAT #0, #0
lnch    DAT #0, #0
start   MOV #0-1, src        ; Quelle = erste Zeile (dist)
        MOV dist, dst        ; Ziel = dist + Abstand
        SUB #2, dst          ; (relativ zu dst umrechnen)
        MOV #last-dist+1, cnt
copy    MOV >src, >dst       ; Zeile für Zeile kopieren
        DJN copy, cnt
        MOV dist, lnch       ; Startadresse der Kopie berechnen
        ADD #start-lnch, lnch
        SPL @lnch            ; Kopie zum Leben erwecken
        ADD #937, dist       ; nächstes Mal woanders hin
last    JMP start
`,
  },
];

export const BOT_BY_ID = Object.fromEntries(BOTS.map((b) => [b.id, b]));

export const LEVEL_LABELS = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };

export const STARTER_CODE = `;name Mein Programm
;author Ich
;strategy Ein Zwerg mit anderem Abstand – verändere ihn und probiere aus!

start   ADD #8, bomb      ; Abstand der Bomben
        MOV bomb, @bomb   ; Bombe werfen
        JMP start
bomb    DAT #0, #0
`;
