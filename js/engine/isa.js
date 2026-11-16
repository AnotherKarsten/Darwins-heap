// Darwin's Heap – Befehlssatz der Sprache "Heapcode"
// Eine bewusst kleine, an Redcode angelehnte Assemblersprache.

export const OP = Object.freeze({
  DAT: 0, MOV: 1, ADD: 2, SUB: 3, JMP: 4, JMZ: 5, JMN: 6, DJN: 7,
  SEQ: 8, SNE: 9, SLT: 10, SPL: 11, NOP: 12, WAIT: 13, RND: 14,
});

export const OP_NAMES = Object.keys(OP);

/** Alternative Schreibweisen, die der Assembler akzeptiert. */
export const OP_ALIASES = Object.freeze({ CMP: 'SEQ' });

export const MODE = Object.freeze({ IMM: 0, DIR: 1, IND: 2, DEC: 3, INC: 4 });
export const MODE_CHARS = ['#', '$', '@', '<', '>'];

export const MODE_INFO = [
  { char: '#', name: 'Unmittelbar', desc: 'Der Wert selbst, keine Adresse. Als Ziel bezeichnet # den eigenen Befehl.' },
  { char: '$', name: 'Direkt (Standard)', desc: 'Relative Adresse: $3 meint die Zelle drei Plätze weiter. Das $ darf entfallen.' },
  { char: '@', name: 'Indirekt', desc: 'Gehe zur Zelle, lies deren B-Feld und springe von dort noch einmal so weit.' },
  { char: '<', name: 'Indirekt, vorher −1', desc: 'Wie @, aber das B-Feld der Zwischenzelle wird vorher um 1 verringert.' },
  { char: '>', name: 'Indirekt, danach +1', desc: 'Wie @, aber das B-Feld der Zwischenzelle wird danach um 1 erhöht. Ideal zum Kopieren in Schleifen.' },
];

/**
 * min/max: Anzahl Operanden. needsB: B-Operand ist Pflicht.
 * group dient der Einfärbung im Editor und in der Lupe.
 */
export const OP_INFO = {
  DAT: { min: 0, max: 2, group: 'data', title: 'Daten – Gift', short: 'Wer DAT ausführt, stirbt.',
    desc: 'Speichert nur Zahlen. Ein Prozess, der auf eine DAT-Zelle läuft, wird beendet. Darum sind DAT-Zellen die klassische "Bombe".',
    example: 'DAT #0, #0' },
  MOV: { min: 2, max: 2, group: 'move', title: 'Kopieren', short: 'Kopiert A nach B.',
    desc: 'Kopiert die ganze Zelle A an die Adresse B. Ist A unmittelbar (#), wird nur die Zahl in das B-Feld des Ziels geschrieben.',
    example: 'MOV 0, 1' },
  ADD: { min: 2, max: 2, group: 'math', title: 'Addieren', short: 'B = B + A',
    desc: 'Mit #A wird A zum B-Feld des Ziels addiert. Sonst werden beide Felder von A zu beiden Feldern von B addiert.',
    example: 'ADD #4, ziel' },
  SUB: { min: 2, max: 2, group: 'math', title: 'Subtrahieren', short: 'B = B − A',
    desc: 'Wie ADD, nur wird abgezogen.', example: 'SUB #1, zaehler' },
  JMP: { min: 1, max: 2, group: 'jump', title: 'Springen', short: 'Weiter bei A.',
    desc: 'Der Prozess macht an Adresse A weiter.', example: 'JMP schleife' },
  JMZ: { min: 2, max: 2, group: 'jump', title: 'Springe, wenn Null', short: 'Springt nach A, wenn B-Wert = 0.',
    desc: 'Prüft das B-Feld der Zelle B. Ist es 0, geht es bei A weiter, sonst mit dem nächsten Befehl.',
    example: 'JMZ suche, @zeiger' },
  JMN: { min: 2, max: 2, group: 'jump', title: 'Springe, wenn nicht Null', short: 'Springt nach A, wenn B-Wert ≠ 0.',
    desc: 'Das Gegenstück zu JMZ.', example: 'JMN weiter, zaehler' },
  DJN: { min: 2, max: 2, group: 'jump', title: 'Verringern & Springen', short: 'B − 1, springt nach A, wenn ≠ 0.',
    desc: 'Verringert das B-Feld von B um 1 und springt nach A, solange das Ergebnis nicht 0 ist. Die typische Zählschleife.',
    example: 'DJN kopiere, zaehler' },
  SEQ: { min: 2, max: 2, group: 'test', title: 'Überspringe, wenn gleich', short: 'Überspringt den nächsten Befehl, wenn A = B.',
    desc: 'Vergleicht zwei ganze Zellen (oder mit #A die Zahl A mit dem B-Feld von B). Bei Gleichheit wird der nächste Befehl übersprungen. Auch als CMP schreibbar.',
    example: 'SEQ leer, @zeiger' },
  SNE: { min: 2, max: 2, group: 'test', title: 'Überspringe, wenn ungleich', short: 'Überspringt den nächsten Befehl, wenn A ≠ B.',
    desc: 'Das Gegenstück zu SEQ – perfekt, um im Speicher nach Gegnern zu suchen.', example: 'SNE leer, @zeiger' },
  SLT: { min: 2, max: 2, group: 'test', title: 'Überspringe, wenn kleiner', short: 'Überspringt, wenn A < B.',
    desc: 'Vergleicht den A-Wert (#A oder B-Feld von A) mit dem B-Feld von B.', example: 'SLT #10, zeiger' },
  SPL: { min: 1, max: 2, group: 'spawn', title: 'Teilen – Fortpflanzung', short: 'Startet einen neuen Prozess bei A.',
    desc: 'Der aktuelle Prozess macht normal weiter, zusätzlich entsteht ein neuer Prozess an Adresse A. Alle Prozesse eines Programms wechseln sich ab. Das Programm überlebt, solange irgendein Prozess lebt.',
    example: 'SPL kopie' },
  NOP: { min: 0, max: 2, group: 'misc', title: 'Nichts tun', short: 'Wartet einen Zug.',
    desc: 'Tut nichts und geht zum nächsten Befehl.', example: 'NOP' },
  WAIT: { min: 1, max: 2, group: 'spawn', title: 'Warten', short: 'Schläft A eigene Züge lang.',
    desc: 'Der Prozess schläft für A seiner eigenen Züge (höchstens 1000). Nützlich, um mehrere Prozesse zu synchronisieren oder eine Falle zeitversetzt auszulösen.',
    example: 'WAIT #20' },
  RND: { min: 2, max: 2, group: 'math', title: 'Würfeln', short: 'Schreibt eine Zufallszahl nach B.',
    desc: 'Schreibt eine Zufallszahl 0 … A−1 in das B-Feld von B. Mit #0 reicht der Bereich über den ganzen Speicher. Der Zufall ist pro Partie reproduzierbar (Seed).',
    example: 'RND #100, ziel' },
};

export const OP_GROUP_COLORS = {
  data: '#ff5d73', move: '#5ad1ff', math: '#ffd166', jump: '#b693ff',
  test: '#7ee0a1', spawn: '#ff9f5a', misc: '#8a93a6',
};

export function normalize(v, n) {
  const r = v % n;
  return r < 0 ? r + n : r;
}

/** Zeigt Werte jenseits der Hälfte als negative Abstände (lesbarer). */
export function signed(v, n) {
  return v > n / 2 ? v - n : v;
}

export function formatOperand(mode, value, n) {
  const ch = mode === MODE.DIR ? '$' : MODE_CHARS[mode];
  return ch + signed(value, n);
}

export function disassemble(op, am, av, bm, bv, n) {
  const name = OP_NAMES[op];
  if (op === OP.NOP && av === 0 && bv === 0 && am === MODE.IMM && bm === MODE.IMM) return 'NOP';
  const oneOperand = op === OP.JMP || op === OP.SPL || op === OP.WAIT;
  if (oneOperand && bm === MODE.IMM && bv === 0) return `${name} ${formatOperand(am, av, n)}`;
  return `${name} ${formatOperand(am, av, n)}, ${formatOperand(bm, bv, n)}`;
}
