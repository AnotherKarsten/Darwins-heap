// Darwin's Heap – instruction set of the Heapcode language.
// A deliberately small assembly language inspired by Redcode.
// Human-readable descriptions live in js/i18n (one file per language).

export const OP = Object.freeze({
  DAT: 0, MOV: 1, ADD: 2, SUB: 3, JMP: 4, JMZ: 5, JMN: 6, DJN: 7,
  SEQ: 8, SNE: 9, SLT: 10, SPL: 11, NOP: 12, WAIT: 13, RND: 14,
});

export const OP_NAMES = Object.keys(OP);

/** Alternative spellings accepted by the assembler. */
export const OP_ALIASES = Object.freeze({ CMP: 'SEQ' });

export const MODE = Object.freeze({ IMM: 0, DIR: 1, IND: 2, DEC: 3, INC: 4 });
export const MODE_CHARS = ['#', '$', '@', '<', '>'];

/**
 * min/max: number of operands. group is used for syntax colouring.
 * example: a typical line (labels are illustrative).
 */
export const OP_INFO = {
  DAT: { min: 0, max: 2, group: 'data', example: 'DAT #0, #0' },
  MOV: { min: 2, max: 2, group: 'move', example: 'MOV 0, 1' },
  ADD: { min: 2, max: 2, group: 'math', example: 'ADD #4, target' },
  SUB: { min: 2, max: 2, group: 'math', example: 'SUB #1, counter' },
  JMP: { min: 1, max: 2, group: 'jump', example: 'JMP loop' },
  JMZ: { min: 2, max: 2, group: 'jump', example: 'JMZ scan, @ptr' },
  JMN: { min: 2, max: 2, group: 'jump', example: 'JMN next, counter' },
  DJN: { min: 2, max: 2, group: 'jump', example: 'DJN copy, counter' },
  SEQ: { min: 2, max: 2, group: 'test', example: 'SEQ empty, @ptr' },
  SNE: { min: 2, max: 2, group: 'test', example: 'SNE empty, @ptr' },
  SLT: { min: 2, max: 2, group: 'test', example: 'SLT #10, ptr' },
  SPL: { min: 1, max: 2, group: 'spawn', example: 'SPL child' },
  NOP: { min: 0, max: 2, group: 'misc', example: 'NOP' },
  WAIT: { min: 1, max: 2, group: 'spawn', example: 'WAIT #20' },
  RND: { min: 2, max: 2, group: 'math', example: 'RND #100, target' },
};

export function normalize(v, n) {
  const r = v % n;
  return r < 0 ? r + n : r;
}

/** Shows values beyond the half as negative offsets (easier to read). */
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
