// Built-in programs: opponents for single player and templates for learning.
// Every bot exists in English and German; only names and comments differ, the code is identical.

export const BOTS = [
  {
    id: 'ente',
    level: 1,
    en: {
      name: 'Sitting Duck',
      blurb: 'Spins in a tiny loop and never fights back. The perfect first target.',
      code: `;name Sitting Duck
;author Darwin's Heap
;strategy An endless loop over four cells. Does not defend itself.
loop    NOP
        NOP
        NOP
        JMP loop
`,
    },
    de: {
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
  },
  {
    id: 'wichtel',
    level: 1,
    en: {
      name: 'Imp',
      blurb: 'The smallest program in the world: copies itself one cell ahead and follows its copy.',
      code: `;name Imp
;author Darwin's Heap
;strategy Keeps copying itself one cell forward and then runs into
;strategy its own copy. Hard to hit, but never attacks.
        MOV 0, 1
`,
    },
    de: {
      name: 'Wichtel',
      blurb: 'Das kleinste Programm der Welt: kopiert sich eine Zelle weiter und läuft hinterher.',
      code: `;name Wichtel
;author Darwin's Heap
;strategy Kopiert sich ständig eine Zelle nach vorn und läuft
;strategy dann in die eigene Kopie. Schwer zu treffen, greift aber nie an.
        MOV 0, 1
`,
    },
  },
  {
    id: 'zwerg',
    level: 2,
    en: {
      name: 'Dwarf',
      blurb: 'The classic: drops a DAT bomb into every fourth cell.',
      code: `;name Dwarf
;author Darwin's Heap
;strategy Drops DAT bombs at a fixed distance. Because the distance
;strategy divides the memory size evenly, it never hits itself.
start   ADD #4, bomb      ; move the target 4 cells further
        MOV bomb, @bomb   ; copy the bomb to where bomb points
        JMP start         ; and again
bomb    DAT #0, #0
`,
    },
    de: {
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
  },
  {
    id: 'wuerfler',
    level: 2,
    en: {
      name: 'Dicer',
      blurb: 'Bombs random places – unpredictable, but never itself.',
      code: `;name Dicer
;author Darwin's Heap
;strategy Rolls a target outside its own code and drops a bomb there.
ptr     DAT #0, #0
start   RND #CORESIZE-6, ptr   ; random 0 … CORESIZE-7
        ADD #6, ptr            ; skip our own 6 cells
        MOV bomb, @ptr
        JMP start
bomb    DAT #0, #0
`,
    },
    de: {
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
  },
  {
    id: 'spaeher',
    level: 2,
    en: {
      name: 'Scout',
      blurb: 'Searches memory for anything that is not empty and bombs it on purpose.',
      code: `;name Scout
;author Darwin's Heap
;strategy Probes memory in steps of 3. If a cell looks different from
;strategy empty memory, it drops two bombs there.
step    EQU 3
count   EQU (CORESIZE-13)/step
ptr     DAT #0, #0
cnt     DAT #0, #0
bomb    DAT #0, #0            ; looks exactly like empty memory
start   MOV #12, ptr          ; begin right behind our own code
        MOV #count, cnt
scan    ADD #step, ptr
        DJN look, cnt         ; lap finished? start over
        JMP start
look    SNE bomb, @ptr        ; not empty? then skip the next line
        JMP scan              ; empty – keep searching
        MOV bomb, @ptr        ; hit! drop a bomb …
        MOV bomb, <ptr        ; … and one right before it
        JMP scan
`,
    },
    de: {
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
  },
  {
    id: 'mitose',
    level: 3,
    en: {
      name: 'Mitosis',
      blurb: 'Copies itself to new places again and again and starts the copies. Grows exponentially.',
      code: `;name Mitosis
;author Darwin's Heap
;strategy A replicator: copies itself, starts the copy with SPL
;strategy and moves the next target. Every copy does the same.
dist    DAT #0, #1601        ; distance to the next copy
src     DAT #0, #0
dst     DAT #0, #0
cnt     DAT #0, #0
lnch    DAT #0, #0
start   MOV #0-1, src        ; source = first line (dist)
        MOV dist, dst        ; target = dist + distance
        SUB #2, dst          ; (relative to dst)
        MOV #last-dist+1, cnt
copy    MOV >src, >dst       ; copy line by line
        DJN copy, cnt
        MOV dist, lnch       ; compute the copy's start address
        ADD #start-lnch, lnch
        SPL @lnch            ; bring the copy to life
        ADD #937, dist       ; somewhere else next time
last    JMP start
`,
    },
    de: {
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
  },
];

export const BOT_BY_ID = Object.fromEntries(BOTS.map((b) => [b.id, b]));

/** Text of a bot in the given language (falls back to English). */
export function botText(bot, lang) {
  return bot[lang] || bot.en;
}

export const STARTER_CODE = {
  en: `;name My Program
;author Me
;strategy A dwarf with a different distance – change it and experiment!

start   ADD #8, bomb      ; bomb distance
        MOV bomb, @bomb   ; drop the bomb
        JMP start
bomb    DAT #0, #0
`,
  de: `;name Mein Programm
;author Ich
;strategy Ein Zwerg mit anderem Abstand – verändere ihn und probiere aus!

start   ADD #8, bomb      ; Abstand der Bomben
        MOV bomb, @bomb   ; Bombe werfen
        JMP start
bomb    DAT #0, #0
`,
};
