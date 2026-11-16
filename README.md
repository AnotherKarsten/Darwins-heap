# Darwin's Heap

**Last Process Standing** – a browser game in which self-written programs fight each other inside a simulated memory. They copy themselves, multiply, set traps and overwrite one another. The last program standing wins.

🇩🇪 [Deutsche Fassung dieser Beschreibung](README.de.md)

![Four programs fighting in the arena](docs/screenshot.png)

The name pays tribute to **Darwin** (1961), the first game of its kind from Bell Labs, and to **Core War** (1984). A “heap” is a region of memory – and also just a pile.

The game is available in **English and German** (switch with `EN | DE` in the header; the browser language is used by default).

## Play

- **Online:** via GitHub Pages at `https://anotherkarsten.github.io/Darwins-heap/` once Pages is enabled (see [Publishing](#publishing)).
- **Locally:** clone the repository and start any static web server in its folder, e.g.

  ```bash
  python3 -m http.server 8080
  # then open http://localhost:8080
  ```

  There is no build step and there are no dependencies – plain HTML, CSS and JavaScript (ES modules). Opening `index.html` directly from disk does not work, because browsers block ES modules on `file://` URLs.

## Features

| Area | What you get |
|---|---|
| **Arena** | Ring memory with 2000, 4000 or 8000 cells, up to 4 programs at once, fair round-robin execution, process limit, cycle limit |
| **Visuals** | Every cell in its owner's colour, fresh writes light up, bombs (DAT) are dimmed, processes are pulsing dots. Three views: *ownership*, *write heat*, *execution* |
| **Speed** | 0.5 to 30,000 cycles per second or “maximum”, pause, single cycle (→) and single instruction (Shift + →) |
| **Statistics** | Live cards (processes, memory share, hits), history charts, event log |
| **Lens** | Disassembled view around any cell, process markers, a “follow” mode that sticks to a program |
| **Analysis** | Hit matrix (who hit whom), instruction mix per program, own goals, turns slept and more |
| **Editor** | Syntax highlighting, line numbers, live errors with jump-to-line, clickable instruction reference, templates, open/save `.heap` files |
| **Tutorial** | *Basics* for absolute beginners: 7 chapters with a 32-cell mini memory you can execute one instruction at a time, each step explained in plain words. Then 6 battle lessons with goals, from the first `MOV 0, 1` to a battle royale |
| **Single player** | 6 bots in three difficulty levels: Sitting Duck, Imp, Dwarf, Dicer, Scout, Mitosis |
| **Multiplayer** | Up to 4 programs on one computer. **🔗 Share** creates a link that contains all programs – so everyone can send their program to the others |
| **Tournament** | Many rounds with random start positions, free-for-all or round robin, points table |
| **Languages** | English and German, including the tutorial, manual, bots and assembler error messages |

Keyboard shortcuts: `Space` start/pause · `→` step · `R` restart · `+`/`−` speed · `1`–`3` view · `E` editor

## The language: Heapcode

A tiny assembly language with 15 instructions, inspired by Redcode. Every line occupies one memory cell, and all addresses are relative.

```
;name Dwarf
start   ADD #4, bomb      ; move the target 4 cells further
        MOV bomb, @bomb   ; copy the bomb to where bomb points
        JMP start
bomb    DAT #0, #0        ; whoever executes this dies
```

| Instruction | Effect |
|---|---|
| `DAT` | Data. Whoever executes DAT dies – the classic bomb |
| `MOV A, B` | Copies cell A to B (with `#A` only the number) |
| `ADD`, `SUB` | Arithmetic |
| `JMP`, `JMZ`, `JMN`, `DJN` | Jump – always, if zero, if not zero, counting loop |
| `SEQ`/`CMP`, `SNE`, `SLT` | Compare and skip the next instruction |
| `SPL A` | **Reproduction:** starts another process at A |
| `WAIT A` | Sleeps for A of its own turns – for timing with several processes |
| `RND A, B` | Random number (reproducible per match via the seed) |
| `NOP` | Does nothing |

Addressing modes: `#` immediate · `$` direct (default) · `@` indirect · `<` indirect with pre-decrement · `>` indirect with post-increment.
Plus labels, `EQU`, `ORG`, expressions (`+ - * / %`, parentheses) and the constant `CORESIZE`. The complete manual is built into the game (📖).

## Code structure

```
index.html            user interface
css/style.css         styling
js/engine/            game logic without DOM – also runs in Node.js
  isa.js              instruction set and disassembler
  assembler.js        Heapcode assembler
  messages.js         assembler messages (en/de)
  arena.js            simulation: memory, processes, statistics
  warriors.js         built-in bots (en/de)
  rng.js              reproducible randomness
js/i18n/              translation layer and dictionaries (en.js, de.js)
js/ui/                renderer (canvas), editor, charts, basics, lessons, manual, storage/sharing
js/main.js            UI controller
tests/                tests using Node's built-in test runner
```

The engine is separated from the DOM, so tournaments, bots and rules can be tested without a browser:

```bash
npm test
```

Adding a language means adding a dictionary in `js/i18n/` and the matching texts in `warriors.js`, `lessons.js`, `basics.js`, `manual.js` and `messages.js`.

## Publishing

Two GitHub Actions workflows are included:

- **Tests** (`ci.yml`) runs on every push and pull request.
- **Publish to GitHub Pages** (`pages.yml`) tests and publishes on every push to `main`.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. (GitHub Pages for private repositories requires a paid plan.)

## Ideas for later

- Real online multiplayer with rankings (needs a small backend)
- A “hill” mode as in Core War: a permanent tournament you can submit programs to
- Replays of a match as shareable recordings (the seed already makes every match reproducible)

## License

[MIT](LICENSE) © 2026 Karsten Leick
