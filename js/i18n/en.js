// English texts
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default {
  ui: {
    'doc.title': "Darwin's Heap – Last Process Standing",

    // header
    'nav.tutorial': '🎓 Tutorial', 'nav.tutorial.title': 'Learn step by step',
    'nav.manual': '📖 Manual', 'nav.manual.title': 'Every instruction explained',
    'nav.tournament': '🏆 Tournament', 'nav.tournament.title': 'Play many rounds automatically',
    'nav.share': '🔗 Share', 'nav.share.title': 'Copy a link that contains all programs',
    'nav.settings': 'Settings',
    'nav.lang': 'Language',

    // programs panel
    'panel.programs': 'Programs',
    'slots.add': '＋ Add program',
    'quick.title': 'Quick start',
    'quick.solo': 'Me vs. bot', 'quick.royale': '4-way battle royale', 'quick.bots': 'Watch bots only',
    'slot.custom': '✍️ Custom code',
    'slot.bot': ({ name, level }) => `🤖 ${name} (${level})`,
    'slot.edit': 'View and edit the code', 'slot.remove': 'Remove', 'slot.choose': 'Choose program',
    'slot.instr': ({ n }) => plural(n, 'instruction', 'instructions'),
    'slot.errors': ({ n }) => plural(n, 'error', 'errors'),
    'slot.lesson': 'Lesson',
    'slot.hint': 'Click ✎ to write the code.',
    'level.1': 'easy', 'level.2': 'medium', 'level.3': 'hard',
    'name.default': 'My Program', 'name.fallback': 'Program', 'name.me': 'Me', 'name.shared': 'Shared',

    // stage
    'aria.arena': 'Memory arena', 'aria.programs': 'Programs', 'aria.stats': 'Statistics', 'aria.stage': 'Arena',
    'goal.lesson': 'Lesson', 'goal.close': 'Leave lesson',
    'goal.title': ({ i, title }) => `Lesson ${i}: ${title}`,
    'goal.goal': ({ goal }) => `Goal: ${goal}`,
    'goal.success': ({ goal }) => `Done! ${goal}`,
    'goal.fail': ({ goal }) => `Not yet: ${goal} Press R to try again.`,
    'overlay.ready': 'Ready to fight', 'overlay.hint': 'Press ▶ or the space bar', 'overlay.start': '▶ Start',
    'overlay.solo': 'Solo run: watch your program',
    'overlay.errors': 'Program has errors', 'overlay.noFit': 'That does not fit',
    'err.coreTooSmall': 'Memory is too small for these programs.',
    'err.line': ({ name, line, msg }) => `${name}: line ${line} – ${msg}`,
    'ctrl.reset': 'Restart with new positions (R)', 'ctrl.play': 'Start/pause (space)',
    'ctrl.step': 'Advance one cycle (→). With Shift: a single instruction',
    'ctrl.speed': 'Speed', 'ctrl.view': 'View',
    'speed.max': 'Maximum', 'speed.unit': ({ v }) => `${v} cycles/s`,
    'view.owner': 'Ownership', 'view.owner.title': 'Who owns which cell? (1)',
    'view.writes': 'Write heat', 'view.writes.title': 'How often was a cell written? (2)',
    'view.execs': 'Execution', 'view.execs.title': 'How often was a cell executed? (3)',
    'cycle': 'Cycle', 'seed': ({ seed }) => `Seed ${seed}`,

    // right panel
    'tab.live': 'Live', 'tab.lens': 'Lens', 'tab.analysis': 'Analysis',
    'chart.procs': 'Processes', 'chart.cells': 'Memory share', 'chart.empty': 'Data appears once the match is running',
    'events': 'Events',
    'cards.empty': 'Fix the errors in the program to start.',
    'cards.procs': 'Processes', 'cards.memory': 'Memory', 'cards.kills': 'Hits',
    'lens.addr': 'Address', 'lens.follow': 'Follow',
    'lens.tip': 'Tip: click the arena to pick a cell. “Follow” pins the lens to the next process of a program.',
    'lens.info': ({ addr, owner, w, e }) => `Cell <b>${addr}</b> · owned by <b>${owner}</b> · written ${w}× · executed ${e}×`,
    'lens.nobody': 'nobody',
    'an.matrix': 'Who hit whom? (row → column)',
    'an.executed': 'Instructions executed', 'an.maxProcs': 'Peak processes', 'an.spawns': 'Splits (SPL)',
    'an.deaths': 'Processes died', 'an.selfKills': 'Own goals', 'an.waits': 'Turns slept', 'an.writes': 'Writes',
    'an.mix': 'Instruction mix', 'an.nothing': 'nothing yet',

    // events
    'log.loaded': ({ n, seed }) => `Match loaded · ${plural(n, 'program', 'programs')} · seed ${seed}`,
    'log.eliminated': ({ name }) => `${name} is out`,
    'log.hitBy': ({ by }) => ` – hit by ${by}`,
    'log.ownGoal': ' – own goal',
    'log.procLimit': ({ name, n }) => `${name} reached the process limit (${n})`,
    'log.win': ({ name }) => `🏆 ${name} wins!`,
    'log.timeout': '⏱ Cycle limit reached – draw',
    'log.over': 'Match over',

    // tooltip
    'tip.owner': ({ name }) => `Owner: ${name}`, 'tip.empty': 'empty',
    'tip.ago': ({ n }) => ` · written ${n} cycles ago`,
    'tip.counts': ({ w, e }) => `written ${w}× · executed ${e}×`,
    'tip.procs': ({ n }) => `${plural(n, 'process', 'processes')} here`,

    // result
    'res.survived': 'Survived!', 'res.extinct': 'Extinct', 'res.cycles': ({ n }) => `${n} cycles`,
    'res.wins': ({ name }) => `${name} wins`,
    'res.winSub': ({ n }) => `after ${n} cycles · Last Process Standing`,
    'res.draw': 'Draw', 'res.drawTimeout': ({ n }) => `Cycle limit of ${n} reached`, 'res.drawNone': 'Nobody survived',
    'res.lessonDone': 'Lesson complete!', 'res.next': 'Next lesson →',
    'res.lessonFail': 'Not quite yet.',
    'res.lessonFailText': 'Try again – new start positions can change a lot. Or tweak the code.',
    'res.alive': ({ p, m }) => `${p} proc. · ${m}%`, 'res.dead': ({ n }) => `† cycle ${n}`,
    'res.view': 'View arena', 'res.again': '⟲ Rematch (new positions)',

    // editor
    'ed.name': 'Program name', 'ed.template': 'Load template …', 'ed.starter': 'Starter template',
    'ed.open': 'Open file', 'ed.save': 'Save as file',
    'ed.instructions': 'Instructions', 'ed.clickInsert': '(click to insert)',
    'ed.foot': 'Tab indents · Ctrl+Enter applies · Esc cancels',
    'ed.cancel': 'Cancel', 'ed.apply': 'Apply',
    'ed.confirmReplace': 'Replace the current code with the template?',
    'ed.copy': '(copy)',
    'ed.botCopy': 'You are editing a copy of the bot. “Apply” turns it into your own code.',
    'ed.ok': ({ n, line }) => `✓ Assembled: <b>${n}</b> instruction${n === 1 ? '' : 's'}, starts at line ${line}`,
    'ed.bad': ({ n }) => `✗ ${plural(n, 'error', 'errors')}`,
    'ed.errLine': ({ line, msg }) => `Line ${line}: ${msg}`,
    'ed.ready': ({ name }) => `“${name}” is ready.`,
    'ed.savedErr': 'Saved – but the code still contains errors.',
    'ed.file': 'program',

    // tutorial
    'tut.title': '🎓 Tutorial',
    'tut.of': ({ i, n }) => `Lesson ${i} of ${n}`,
    'tut.opponents': ({ list }) => `Opponents: ${list}`,
    'tut.alone': 'nobody – you are alone',
    'tut.basics': 'Basics – for absolute beginners', 'tut.battles': 'Battle lessons',
    'tut.basicsHint': 'Never programmed in assembly? Start here – everything is explained step by step. Already familiar with it? Skip ahead.',
    'tut.next': 'Next →', 'tut.back': '← Back', 'tut.skip': 'Skip the basics', 'tut.toLessons': 'On to the battle lessons →',
    'tut.chapterOf': ({ i, n }) => `Basics ${i} of ${n}`,
    'tut.start': 'Start lesson ▶',
    'tut.tip': 'Tip: use ✎ to change the lesson code.',

    // manual
    'man.title': '📖 Manual: Heapcode',

    // tournament
    'tour.title': '🏆 Tournament',
    'tour.intro': 'A single fight depends heavily on the start positions. A tournament plays many rounds with random positions – that shows which program is really stronger. Win = 3 points, draw = 1 point.',
    'tour.mode': 'Mode', 'tour.ffa': 'Free-for-all', 'tour.pairs': 'Round robin (1 vs 1)',
    'tour.rounds': 'Rounds', 'tour.start': 'Start',
    'tour.needTwo': 'A tournament needs at least two programs.',
    'tour.hasErrors': ({ name }) => `“${name}” contains errors.`,
    'tour.played': ({ d, n }) => `${d} of ${n} matches played`,
    'tour.program': 'Program', 'tour.wins': 'Wins', 'tour.draws': 'Draws', 'tour.losses': 'Losses',
    'tour.points': 'Points', 'tour.rate': 'Win rate',

    // settings
    'set.title': '⚙️ Settings',
    'set.core': 'Memory size',
    'set.core2000': '2000 cells – fast & tight', 'set.core4000': '4000 cells – default', 'set.core8000': '8000 cells – classic (Core War)',
    'set.cycles': 'Cycle limit (then a draw)', 'set.cyclesAuto': 'automatic (20 × memory size)',
    'set.procs': 'Max processes per program',
    'set.seedMode': 'Start positions', 'set.random': 'Random every match', 'set.fixed': 'Fixed seed (reproducible)',
    'set.seed': 'Seed', 'set.grid': 'Show cell grid', 'set.heads': 'Highlight processes',
    'set.cancel': 'Cancel', 'set.apply': 'Apply',

    // welcome
    'wel.title': "Welcome to Darwin's <span class=\"accent\">Heap</span>",
    'wel.p1': 'Here, <b>programs</b> fight each other – inside a simulated memory where they copy themselves, multiply and overwrite one another. <b>The last program standing wins.</b>',
    'wel.p2': 'You write the programs in <i>Heapcode</i>, a tiny language with 15 instructions.',
    'wel.tutorial': 'Tutorial', 'wel.tutorialText': 'Gentle basics to click through, then six lessons up to a battle royale',
    'wel.demo': 'Watch', 'wel.demoText': 'Four bots fight – just have a look',
    'wel.solo': 'Jump right in', 'wel.soloText': 'Your program against a bot',

    // toasts
    'toast.bots': 'Four bots ready – press ▶',
    'toast.preset': 'Lineup loaded – press ▶',
    'toast.demo': 'Enjoy! Hover over the cells or click them.',
    'toast.copied': 'Link copied! Whoever opens it gets exactly these programs.',
    'toast.prompt': 'Copy and share this link:',
    'toast.imported': ({ n }) => `${plural(n, 'shared program', 'shared programs')} loaded.`,
  },

  ops: {
    DAT: { title: 'Data – poison', short: 'Whoever executes DAT dies.', desc: 'Only stores numbers. A process that runs into a DAT cell is terminated. That makes DAT cells the classic “bomb”.' },
    MOV: { title: 'Copy', short: 'Copies A to B.', desc: 'Copies the whole cell A to address B. If A is immediate (#), only the number is written into the B field of the target.' },
    ADD: { title: 'Add', short: 'B = B + A', desc: 'With #A, A is added to the B field of the target. Otherwise both fields of A are added to both fields of B.' },
    SUB: { title: 'Subtract', short: 'B = B − A', desc: 'Like ADD, but subtracts.' },
    JMP: { title: 'Jump', short: 'Continue at A.', desc: 'The process continues at address A.' },
    JMZ: { title: 'Jump if zero', short: 'Jumps to A if the B value = 0.', desc: 'Checks the B field of cell B. If it is 0, execution continues at A, otherwise with the next instruction.' },
    JMN: { title: 'Jump if not zero', short: 'Jumps to A if the B value ≠ 0.', desc: 'The counterpart of JMZ.' },
    DJN: { title: 'Decrement & jump', short: 'B − 1, jumps to A if ≠ 0.', desc: 'Decreases the B field of B by 1 and jumps to A as long as the result is not 0. The typical counting loop.' },
    SEQ: { title: 'Skip if equal', short: 'Skips the next instruction if A = B.', desc: 'Compares two whole cells (or, with #A, the number A with the B field of B). If they are equal, the next instruction is skipped. Can also be written as CMP.' },
    SNE: { title: 'Skip if not equal', short: 'Skips the next instruction if A ≠ B.', desc: 'The counterpart of SEQ – perfect for searching memory for enemies.' },
    SLT: { title: 'Skip if less', short: 'Skips if A < B.', desc: 'Compares the A value (#A or the B field of A) with the B field of B.' },
    SPL: { title: 'Split – reproduction', short: 'Starts a new process at A.', desc: 'The current process continues as usual, and a new process is created at address A. All processes of a program take turns. The program survives as long as any of its processes lives.' },
    NOP: { title: 'No operation', short: 'Waits one turn.', desc: 'Does nothing and moves on to the next instruction.' },
    WAIT: { title: 'Wait', short: 'Sleeps for A of its own turns.', desc: 'The process sleeps for A of its own turns (at most 1000). Useful to synchronise several processes or to trigger a trap with a delay.' },
    RND: { title: 'Roll the dice', short: 'Writes a random number to B.', desc: 'Writes a random number 0 … A−1 into the B field of B. With #0 the range covers the whole memory. The randomness is reproducible per match (seed).' },
  },

  modes: [
    { name: 'Immediate', desc: 'The value itself, not an address. As a target, # refers to the instruction itself.' },
    { name: 'Direct (default)', desc: 'Relative address: $3 means the cell three places further. The $ may be omitted.' },
    { name: 'Indirect', desc: 'Go to the cell, read its B field and jump that far again from there.' },
    { name: 'Indirect, −1 before', desc: 'Like @, but the B field of the intermediate cell is decreased by 1 first.' },
    { name: 'Indirect, +1 after', desc: 'Like @, but the B field of the intermediate cell is increased by 1 afterwards. Ideal for copying in loops.' },
  ],
};
