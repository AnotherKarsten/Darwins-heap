import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble } from '../js/engine/assembler.js';
import { Arena } from '../js/engine/arena.js';
import { BOTS, STARTER_CODE } from '../js/engine/warriors.js';
import { OP, MODE, disassemble } from '../js/engine/isa.js';
import { LESSONS } from '../js/ui/lessons.js';
import { BASICS } from '../js/ui/basics.js';

const prog = (code, opts) => {
  const r = assemble(code, opts);
  assert.ok(r.ok, JSON.stringify(r.errors));
  return r;
};

test('all bots, templates, lessons and basics assemble in both languages', () => {
  for (const lang of ['en', 'de']) {
    for (const b of BOTS) for (const size of [2000, 4000, 8000]) prog(b[lang].code, { coreSize: size, lang });
    prog(STARTER_CODE[lang], { lang });
    for (const l of LESSONS) prog(l[lang].code, { lang });
    for (const c of BASICS) for (const p of c.demo.programs) prog(p.code[lang], { coreSize: 32, lang });
  }
});

test('both languages produce identical bot code', () => {
  for (const b of BOTS) {
    const en = prog(b.en.code).instructions.map(({ line, ...x }) => x);
    const de = prog(b.de.code).instructions.map(({ line, ...x }) => x);
    assert.deepEqual(en, de, b.id);
  }
});

test('assembler errors are translated', () => {
  assert.match(assemble('FOO 1', { lang: 'en' }).errors[0].msg, /Unknown instruction/);
  assert.match(assemble('FOO 1', { lang: 'de' }).errors[0].msg, /Unbekannter Befehl/);
});

test('i18n dictionaries have the same keys', async () => {
  const en = (await import('../js/i18n/en.js')).default;
  const de = (await import('../js/i18n/de.js')).default;
  assert.deepEqual(Object.keys(en.ui).sort(), Object.keys(de.ui).sort());
  assert.deepEqual(Object.keys(en.ops).sort(), Object.keys(de.ops).sort());
  assert.equal(en.modes.length, de.modes.length);
});

test('labels are relative, EQU and expressions work', () => {
  const r = prog(`
step  EQU 2*(3+1)
start ADD #step, bomb
      MOV bomb, @bomb
      JMP start
bomb  DAT #0, #0`);
  assert.equal(r.length, 4);
  assert.equal(r.instructions[0].av, 8);
  assert.equal(r.instructions[0].bv, 3);
  assert.equal(r.instructions[1].bm, MODE.IND);
  assert.equal(r.instructions[2].av, 4000 - 2);
  assert.equal(r.org, 0);
});

test('ORG and start define the entry point', () => {
  assert.equal(prog('ORG b\na DAT #1\nb JMP a').org, 1);
  assert.equal(prog('x DAT #1\nstart JMP x').org, 1);
});

test('errors are reported with line numbers', () => {
  const r = assemble('MOV 0, 1\nFOO 1, 2\nJMP nirgends\nMOV 1');
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors.map((e) => e.line), [2, 3, 4]);
});

test('CMP is an alias for SEQ, case does not matter', () => {
  const r = prog('loop cmp 1, 2\n jmp LOOP');
  assert.equal(r.instructions[0].op, OP.SEQ);
});

test('the imp crawls through memory', () => {
  const a = new Arena({ seed: 3, coreSize: 2000 });
  const [start] = a.load([{ name: 'w', program: prog('MOV 0, 1') }]);
  a.run(10);
  assert.equal(a.players[0].alive, true);
  assert.equal(a.op[(start + 10) % 2000], OP.MOV);
  assert.equal(a.players[0].cells, 11);
});

test('DAT kills, the dwarf beats the duck', () => {
  const zwerg = BOTS.find((b) => b.id === 'zwerg').en;
  const ente = BOTS.find((b) => b.id === 'ente').en;
  for (let seed = 1; seed <= 10; seed++) {
    const a = new Arena({ seed });
    a.load([{ name: 'z', program: prog(zwerg.code) }, { name: 'e', program: prog(ente.code) }]);
    const r = a.runToEnd();
    assert.equal(r.winner, 0);
    assert.equal(a.players[0].kills[1], 1);
  }
});

test('SPL creates processes up to the limit', () => {
  const a = new Arena({ seed: 1, maxProcesses: 16 });
  a.load([{ name: 's', program: prog('loop SPL loop\n JMP loop') }]);
  a.run(200);
  assert.equal(a.players[0].queue.count, 16);
  assert.ok(a.players[0].splFails > 0);
});

test('WAIT puts a process to sleep', () => {
  const a = new Arena({ seed: 1 });
  a.load([{ name: 'w', program: prog('WAIT #5\nDAT #0, #0') }]);
  a.run(6);
  assert.equal(a.players[0].alive, true);
  a.run(2);
  assert.equal(a.players[0].alive, false);
});

test('RND is reproducible with the same seed', () => {
  const run = () => {
    const a = new Arena({ seed: 42 });
    a.load([{ name: 'r', program: prog(BOTS.find((b) => b.id === 'wuerfler').en.code) }]);
    a.run(500);
    return Array.from(a.owner).join(',');
  };
  assert.equal(run(), run());
});

test('post-increment copies line by line (mitosis multiplies)', () => {
  const a = new Arena({ seed: 9 });
  a.load([{ name: 'm', program: prog(BOTS.find((b) => b.id === 'mitose').en.code) }]);
  a.run(2000);
  assert.ok(a.players[0].queue.count > 4);
  assert.ok(a.players[0].cells > 16 * 4);
});

test('a match ends at the cycle limit at the latest', () => {
  const a = new Arena({ seed: 1, coreSize: 2000, maxCycles: 500 });
  a.load([{ name: 'a', program: prog('MOV 0, 1') }, { name: 'b', program: prog('MOV 0, 1') }]);
  const r = a.runToEnd();
  assert.equal(r.reason, 'timeout');
  assert.equal(r.winner, null);
  assert.equal(r.cycles, 500);
});

test('disassembler shows negative offsets', () => {
  assert.equal(disassemble(OP.JMP, MODE.DIR, 3998, MODE.IMM, 0, 4000), 'JMP $-2');
  assert.equal(disassemble(OP.MOV, MODE.IMM, 4, MODE.IND, 2, 4000), 'MOV #4, @2');
});

test('basics demos run on the 32-cell mini memory', () => {
  for (const c of BASICS) {
    const progs = c.demo.programs.map((p) => prog(p.code.en, { coreSize: 32 }));
    const a = new Arena({ coreSize: 32, minDistance: 0, maxCycles: 5000, seed: 7 });
    a.load(progs.map((program, i) => ({ name: `p${i}`, program })), c.demo.programs.map((p) => p.start));
    a.run(200);
  }
  // the final basics chapter must actually show a win
  const b7 = BASICS[BASICS.length - 1];
  const a = new Arena({ coreSize: 32, minDistance: 0, maxCycles: 5000, seed: 7 });
  a.load(b7.demo.programs.map((p, i) => ({ name: `p${i}`, program: prog(p.code.en, { coreSize: 32 }) })), b7.demo.programs.map((p) => p.start));
  assert.equal(a.runToEnd().winner, 0);
});
