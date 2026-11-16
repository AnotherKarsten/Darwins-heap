import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble } from '../js/engine/assembler.js';
import { Arena } from '../js/engine/arena.js';
import { BOTS, STARTER_CODE } from '../js/engine/warriors.js';
import { OP, MODE, disassemble } from '../js/engine/isa.js';
import { LESSONS } from '../js/ui/lessons.js';

const prog = (code, opts) => {
  const r = assemble(code, opts);
  assert.ok(r.ok, JSON.stringify(r.errors));
  return r;
};

test('alle Bots, Vorlagen und Lektionen lassen sich übersetzen', () => {
  for (const b of BOTS) prog(b.code);
  prog(STARTER_CODE);
  for (const l of LESSONS) prog(l.code);
  for (const size of [2000, 8000]) for (const b of BOTS) prog(b.code, { coreSize: size });
});

test('Labels sind relativ, EQU und Ausdrücke funktionieren', () => {
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

test('ORG und start legen den Einstieg fest', () => {
  assert.equal(prog('ORG b\na DAT #1\nb JMP a').org, 1);
  assert.equal(prog('x DAT #1\nstart JMP x').org, 1);
});

test('Fehler werden mit Zeilennummer gemeldet', () => {
  const r = assemble('MOV 0, 1\nFOO 1, 2\nJMP nirgends\nMOV 1');
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors.map((e) => e.line), [2, 3, 4]);
});

test('CMP ist ein Alias für SEQ, Groß-/Kleinschreibung egal', () => {
  const r = prog('loop cmp 1, 2\n jmp LOOP');
  assert.equal(r.instructions[0].op, OP.SEQ);
});

test('Der Wichtel kriecht durch den Speicher', () => {
  const a = new Arena({ seed: 3, coreSize: 2000 });
  const [start] = a.load([{ name: 'w', program: prog('MOV 0, 1') }]);
  a.run(10);
  assert.equal(a.players[0].alive, true);
  assert.equal(a.op[(start + 10) % 2000], OP.MOV);
  assert.equal(a.players[0].cells, 11);
});

test('DAT tötet, der Zwerg besiegt die Ente', () => {
  const zwerg = BOTS.find((b) => b.id === 'zwerg');
  const ente = BOTS.find((b) => b.id === 'ente');
  for (let seed = 1; seed <= 10; seed++) {
    const a = new Arena({ seed });
    a.load([{ name: 'z', program: prog(zwerg.code) }, { name: 'e', program: prog(ente.code) }]);
    const r = a.runToEnd();
    assert.equal(r.winner, 0);
    assert.equal(a.players[0].kills[1], 1);
  }
});

test('SPL erzeugt Prozesse bis zum Limit', () => {
  const a = new Arena({ seed: 1, maxProcesses: 16 });
  a.load([{ name: 's', program: prog('loop SPL loop\n JMP loop') }]);
  a.run(200);
  assert.equal(a.players[0].queue.count, 16);
  assert.ok(a.players[0].splFails > 0);
});

test('WAIT lässt einen Prozess schlafen', () => {
  const a = new Arena({ seed: 1 });
  a.load([{ name: 'w', program: prog('WAIT #5\nDAT #0, #0') }]);
  a.run(6);
  assert.equal(a.players[0].alive, true);
  a.run(2);
  assert.equal(a.players[0].alive, false);
});

test('RND ist mit gleichem Seed reproduzierbar', () => {
  const run = () => {
    const a = new Arena({ seed: 42 });
    a.load([{ name: 'r', program: prog(BOTS.find((b) => b.id === 'wuerfler').code) }]);
    a.run(500);
    return Array.from(a.owner).join(',');
  };
  assert.equal(run(), run());
});

test('Postinkrement kopiert Zeile für Zeile (Mitose vermehrt sich)', () => {
  const a = new Arena({ seed: 9 });
  a.load([{ name: 'm', program: prog(BOTS.find((b) => b.id === 'mitose').code) }]);
  a.run(2000);
  assert.ok(a.players[0].queue.count > 4);
  assert.ok(a.players[0].cells > 16 * 4);
});

test('Partie endet spätestens beim Zyklenlimit', () => {
  const a = new Arena({ seed: 1, coreSize: 2000, maxCycles: 500 });
  a.load([{ name: 'a', program: prog('MOV 0, 1') }, { name: 'b', program: prog('MOV 0, 1') }]);
  const r = a.runToEnd();
  assert.equal(r.reason, 'timeout');
  assert.equal(r.winner, null);
  assert.equal(r.cycles, 500);
});

test('Disassembler zeigt negative Abstände', () => {
  assert.equal(disassemble(OP.JMP, MODE.DIR, 3998, MODE.IMM, 0, 4000), 'JMP $-2');
  assert.equal(disassemble(OP.MOV, MODE.IMM, 4, MODE.IND, 2, 4000), 'MOV #4, @2');
});
