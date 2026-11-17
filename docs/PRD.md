# PROJECT ENIGMA — Product Requirements Document (PRD)
**Subtitle:** The Codebreaker Chronicles  
**Version:** 1.0 · 10 November 2026  
**Project:** CSET302 Automata Theory and Computability — Turing Machine Simulator  
**Target:** Local desktop browser, built and run by Codex on the student's own machine  
**Priority:** A small, polished, demonstrably correct assignment — not a full-length game

---

## 0. Instructions to Codex (read first)

Build this complete project in the current local workspace. Do not stop after scaffolding or produce only sample snippets: create the real application files, implement the features, run available checks, and fix errors. The application must work entirely locally without a backend or API key.

**Workflow:**
1. Inspect the current folder before writing. If it contains an existing React project, integrate rather than overwrite unrelated work. Otherwise initialize a Vite + React JavaScript project.
2. Implement the MVP in the order in §11, prioritizing the actual Turing machine engine and testability over extra visual polish.
3. Use the supplied reference image (`reference/approved-dark-ui.png`) as a visual target, **not** as a flat screenshot background: implement real, clickable React components and text. You may use its composition and colors as guidance. Do not simply display the whole reference as the interface.
4. If character/background images are not available as separately licensed assets, use carefully styled CSS gradients, silhouettes, and an attractive placeholder; do not make the application depend on generative-image APIs or external hotlinked images. Keep image replacement easy via files in `public/images/`.
5. Verify by executing the project's tests and build. Report what was completed, tests/build results, and how to launch the app. If a command cannot run, explain the limitation rather than claiming success.
6. Keep features scoped to this PRD. No authentication, accounts, database, network calls, complex cipher-breaking engine, multiplayer, or large game architecture.

**Definition of success:** `npm install` then `npm run dev` starts a usable, visually polished application; `npm test` checks core TM rules; `npm run build` succeeds; a student can perform a live interactive TM demonstration from start to finish.

---

## 1. Product vision

Project Enigma is a dark, cinematic, minimalist educational experience set in a fictionalized 1940 Bletchley Park codebreaking room. A respectful, clearly dramatized representation of **Alan Turing** leads the student through a very short visual-novel introduction to Enigma and computation. The player then enters a **real, generic Turing machine simulator**, where they configure rules, type tape input, observe each computation step, and see an accept/reject/halt result.

**Critical theory boundary:** Enigma was a rotor cipher machine; the wartime Bombe and a formal Turing machine are not the same device. Do not depict Enigma or the Bombe as the Turing machine simulator. The historical story provides context; the lab uses formal TM state/tape/transition semantics. The “crib consistency” exercise is a *simplified classroom analogy*, not an authentic reconstruction of Bombe codebreaking.

**Audience:** CSET302 instructor and students evaluating an Automata Theory simulator, plus first-time visitors who enjoy interactive historical mystery stories.

**Single-sentence pitch:** Solve a wartime mystery through a short visual novel, then prove how computation works in an editable Turing machine lab.

---

## 2. Course rubric and scope constraints

Based on the attached CSET302 Consolidated Plan (2026):
- Listed topic: **Turing Machine Simulator**, with interactive tape, read/write, head movement, states, and acceptance/rejection (source p. 3).
- Minimum workflow: **User Input → Algorithm → Step-by-Step Processing / Visualization → Result → Validation** (p. 3–4).
- Dynamic input and correct algorithms; visualization of intermediate computation; suitable test cases (p. 3–4).
- M1 review calls for problem definition, theory, existing tools/feasibility, architecture/wireframes, pseudocode, and a manually validated example (p. 4).
- M2 evaluation (23–27 November 2026) emphasizes working simulator, multiple test cases, source code, technical documentation, live demonstration, and individual understanding (p. 4).

**Implementation goal:** The simulator functionality must stand on its own if the instructor skips the story. Add a direct “Turing Machine Laboratory” option from Home.

**Out of scope:** Real Enigma decryption, historically accurate Bombe wiring/search, branching novel narrative, save slots, login/cloud storage, 3D graphics, sound design, and generating illustrations in-app.

---

## 3. User experience: exactly four screens

### 3.1 Home (`/` or app view `home`)
- Prominent title: **PROJECT ENIGMA**, small subtitle: **THE CODEBREAKER CHRONICLES**.
- Dark 1940s codebreaking control-room atmosphere, Alan Turing character area on the left, subdued industrial equipment and warm lamp, generous negative space.
- Primary button: **BEGIN INVESTIGATION** → Story.
- Secondary: **TURING MACHINE LABORATORY** → Lab directly.
- Optional small **ABOUT / CASE FILE** control → simple overlay with premise/instructions, not a new full screen.
- Avoid decorative controls that do nothing; all visible buttons must work.

### 3.2 Story (`story`)
- Four short scenes, linear (no complex branching).
- Character portrait or placeholder; lower translucent dialogue panel; speaker label; Next/Back/Skip buttons; story progress indicator.
- Display the following editable text in `src/data/dialogue.js` (exact wording can be slightly polished but preserve the theory distinction):
  1. **The Intercept** — Alan Turing: “We've intercepted a message. Your task is to uncover the pattern.”
  2. **The Enigma** — “Enigma rearranges letters using moving rotors. Small settings can change an entire message.”
  3. **The Idea of Computation** — “A Turing machine is a theoretical model: it reads a symbol, writes a symbol, changes state, and moves its tape head.”
  4. **Your Turn** — “The Bombe is not a Turing machine. But in our laboratory, you can explore a machine's rules yourself.” → **ENTER LABORATORY**.
- Gentle transitions (~200–350 ms) and optional typewriter effect; clicking Next should instantly finish text if mid-animation, then advance on next click. Include Skip for demos.
- Narrative is explicitly a fictionalized educational presentation, not a historical verbatim quote.

### 3.3 Laboratory (`lab`) — core product
Desktop-first three-region layout:
- **Top toolbar:** project name, Back/Home, preset selector, Reset, short Help.
- **Main center:** horizontal TM tape cells with indices and a visually marked active head; current state; transition being executed; speed setting; controls Step / Run / Pause / Reset.
- **Side or lower pane:** editable machine definition: alphabet, blank symbol, states, start/accept/reject states, transition table; editable input tape field; Load / Apply Definition button; validation errors near fields.
- **State diagram:** simple SVG circular nodes with directed edges. Highlight the current state and last transition. For many transitions, a compact list-based fallback is acceptable; labels must remain readable.
- **Execution trace:** numbered table with step number, state before, symbol read, symbol written, move (L/R/S), state after, head position. Scroll latest row into view where feasible.
- **Keyboard and responsiveness:** controls usable via keyboard, clear focus states, readable down to tablet width; small screens may stack panes.

Required behavior:
- Enter an arbitrary input string drawn from the selected machine's tape alphabet, excluding the blank symbol.
- Edit/add/delete transitions and states through a practical form/table (a JSON editor *alone* is insufficient). Display an optional JSON view only if easy.
- Reject invalid or duplicate transition keys `(state, readSymbol)` with clear errors. Validate target state, symbols, start state, halting state sets and blank symbol.
- Step forward exactly one TM transition; animate read/write/head move.
- Run automatically on a timer; Pause cancels further steps; Reset restores initial tape/head/state and clears trace.
- Clear status: **Ready**, **Running**, **Paused**, **Accepted**, **Rejected**, **Halted (no transition)**, **Step limit reached**, or **Error**.
- Accept/reject states halt and cannot be stepped further unless reset; missing transition is **Halted (no transition)**, not falsely accepted/rejected.
- Limit automatic execution to 1,000 steps by default (configurable in code) to prevent non-halting machines freezing the UI.
- Include a friendly Empty Input case and safe render of blank cells beyond input boundaries.

### 3.4 Results (`results`)
- Accessible after a halt/accept/reject or step-limit event, or rendered as a results section in Lab if navigation is simpler. Treat as the fourth logical screen either way.
- Show final status, initial input, final nonblank tape content with head context, number of transitions, final state, and trace table.
- **BACK TO LAB** preserves the current machine definition; **RESET & RETRY** resets it for the same input.
- Do not mislabel a missing transition or step-limit as rejection.

---

## 4. Visual design contract

The chosen design is the **final dark minimalist mockup featuring Alan Turing**, saved as `reference/approved-dark-ui.png` in the bundled handoff.

- **Palette:** nearly black/navy `#080F13`, charcoal `#101B20`, subtle blue-grey `#253238`, antique cream `#D9CABA`, muted red `#703034`, brass `#A48158`.
- **Look:** mature, restrained, cinematic; strong negative space, soft fog, dim silhouettes, occasional practical warm lamp, faint film grain.
- **Typography:** elegant serif for display headings, legible mono/typewriter for dialogue/ciphertext and TM trace, plain sans-serif for utility forms.
- **UI treatment:** thin borders, transparent charcoal dialogue panels, subtle muted-red active state, no bright gradients/glossy mobile-style cards.
- **Layout:** 16:9 desktop composition inspired by approved UI; main navigation on the right, character presence on the left, low dialogue panel; Lab favors legibility and simulator clarity over decorative story layout.
- **Motion:** restrained fades/slides; tape-head movement highlights; respect `prefers-reduced-motion`.
- **Accessibility:** high contrast for functional text, visible focus indicators, buttons with text labels, no meaning conveyed only by color.

**Important:** The reference file is a flattened design study. Rebuild controls and text as live HTML/CSS; separate images or stylized CSS backgrounds may be used as decorative layers. Do not present a static screenshot as a functional interface.

---

## 5. Formal Turing machine model and semantics

Implement a deterministic, single-tape Turing machine:

`M = (Q, Σ, Γ, δ, q0, qAccept, qReject)`

- `Q`: finite set of states.
- `Σ`: input alphabet (must not include blank).
- `Γ`: tape alphabet (contains `Σ` and blank).
- `δ`: partial mapping from `(state, readSymbol)` to `(nextState, writeSymbol, direction)`.
- `q0`: start state.
- `qAccept` and `qReject`: distinct halting states, also distinct from start for supplied presets.
- Directions: `L`, `R`, `S` (stay).
- Tape is conceptually infinite in both directions; implement as `Map<integer, symbol>` where missing cells mean blank. Maintain integer head position, initially 0.
- Initial tape is the characters of the input at cells 0..n−1; all others blank.
- Each step: check halt status → read symbol at head → find transition → write symbol → move head → set next state → append trace → check halting state.
- A missing transition is a terminal `halted-no-rule` outcome; it is not equivalent to entering `qReject`.
- Never call Enigma rotor substitutions a formal TM state transition unless intentionally modeling an abstract computational process.

### Example definition shape

```js
{
  id: "binary-ends-1",
  name: "Binary string ends in 1",
  states: ["q0", "qAccept", "qReject"],
  inputAlphabet: ["0", "1"],
  tapeAlphabet: ["0", "1", "_"],
  blank: "_",
  startState: "q0",
  acceptState: "qAccept",
  rejectState: "qReject",
  transitions: [
    { from: "q0", read: "0", write: "0", move: "R", to: "q0" },
    { from: "q0", read: "1", write: "1", move: "R", to: "q0" },
    { from: "q0", read: "_", write: "_", move: "S", to: "qReject" }
  ]
}
```

**NOTE:** The above *shape* is illustrative; the supplied `binary-ends-1` preset must correctly track the last symbol through states, so replace the illustrative `transitions` with the complete correct state graph. Never copy an incorrect example unchanged.

### Presets (both required)

**Preset A — Binary string ends in `1`:** Accept binary strings with a final `1`; reject empty strings and strings ending in `0`. Create correct complete deterministic rules. Suggested states `qStart`, `qLast0`, `qLast1`, `qAccept`, `qReject`. Sample verdicts: `101` accept, `100` reject, `1` accept, empty reject. This is the primary live demo.

**Preset B — Enigma-inspired crib alignment check:** Input symbols `D` (plaintext and ciphertext differ at that position), `S` (they match). Scan right across `D`; on any `S` enter reject; on blank enter accept. Sample verdicts: `DDDDD` accept, `DDSDD` reject, empty accept. Explain in the UI that this checks only a necessary consistency constraint and **does not decrypt Enigma**.

The student can load a preset, alter a transition, enter their own input, and step/run the resulting TM. Changes should update the execution behavior immediately after Apply/Reset.

---

## 6. Component and module plan

```text
project-enigma/
├── reference/
│   └── approved-dark-ui.png
├── public/
│   └── images/                   # Optional independently usable art assets
├── src/
│   ├── components/
│   │   ├── Home.jsx
│   │   ├── Story.jsx
│   │   ├── Laboratory.jsx
│   │   ├── Results.jsx
│   │   ├── TapeView.jsx
│   │   ├── TransitionEditor.jsx
│   │   └── StateDiagram.jsx
│   ├── data/
│   │   ├── dialogue.js
│   │   └── presets.js
│   ├── engine/
│   │   ├── turingMachine.js
│   │   └── turingMachine.test.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── README.md
├── package.json
└── vite.config.js
```

Use a minimal dependency stack:
- React + Vite (JavaScript, no TypeScript requirement)
- Plain CSS
- `motion` for optional scene/dialogue animation, only if useful; prefer CSS when simpler
- Vitest for deterministic unit tests
- Inline SVG for state diagram (no need for a graph library)

Use view state instead of introducing routing dependency unless routing is already present. Keep engine logic pure and decoupled from React UI. Use React state/refs to orchestrate execution timers and ensure Pause/Reset/unmount always clean them up.

---

## 7. Functional requirements and acceptance criteria

| ID | Requirement | Acceptance check |
|---|---|---|
| F01 | Functional Home navigation | Both Begin Investigation and Laboratory navigate correctly |
| F02 | Short story | Four scenes, Next/Back/Skip and Enter Lab work |
| F03 | User tape input | Valid input loads; invalid characters produce actionable error |
| F04 | Editable machine | User can add/edit/delete transitions and apply a valid machine |
| F05 | TM correctness | Each Step performs exactly one read/write/move/state transition |
| F06 | Animated tape | Head position and symbol changes are visible, including negative indices |
| F07 | Run/Pause/Reset | Run progresses; Pause stops; Reset restores initial configuration |
| F08 | Outcomes | Accept, reject, no-rule halt, and step-limit are distinct |
| F09 | State diagram | Graph shows states/transitions and current state highlight |
| F10 | Trace and results | Show each step and final outcome with tape and step count |
| F11 | Presets | Both named presets run their listed test cases correctly |
| F12 | Local deployment | `npm install`, `npm run dev`, `npm test`, `npm run build` succeed |
| F13 | Demo usability | Lab is directly accessible without playing Story |
| F14 | Responsive/readable UI | Desktop 1440×900 and smaller laptop widths are usable |

---

## 8. Required tests

Test the **pure engine** with Vitest, at minimum:
1. `101` accepts and `100` rejects for the binary preset.
2. Empty binary input rejects; input `1` accepts.
3. `DDDDD` accepts; `DDSDD` rejects; empty crib input accepts.
4. Stepping writes a changed tape symbol correctly.
5. Left movement can reach head `-1` and read blank.
6. `S` keeps the head in place.
7. Missing transition results in `halted-no-rule`, not rejection.
8. Repeated transition `(from, read)` is rejected during validation.
9. Invalid input symbol or target state is rejected before running.
10. A looping definition reaches the maximum step limit in automatic run without freezing.
11. Reset restores the initial input, step count, head and state.
12. Halting machines do not execute extra steps after accept/reject.

Add a short manual test checklist to README for opening Story, skipping to Lab, editing a rule, watching the state graph and reviewing results.

---

## 9. UX copy and error messages

- Invalid tape: “Input contains ‘X’, which is not in the input alphabet.”
- Duplicate transition: “Two rules are defined for the same state and read symbol.”
- Missing transition: “Machine halted: no transition is defined for this state and symbol.”
- Step limit: “Execution paused at the safety limit. This machine may not halt.”
- Crib preset note: “This checks an Enigma alignment constraint; it does not reveal the rotor settings.”
- Story footer: “Historical setting dramatized for educational purposes.”

---

## 10. Deliverables

**Application:** Working local React project with all source files and optional art assets.  
**Documentation:** `README.md` including project overview, setup commands, TM formal definition, both example machines, how to edit/run, known limitations, test commands, demo script, and citation to the university CSET302 plan.  
**Testing:** `npm test` suite and a short manual testing table showing expected vs actual results.  
**Student presentation support:** Brief architecture diagram (Mermaid acceptable) and pseudocode in README that the student can explain during viva.

Do **not** make claims that the project genuinely deciphers wartime messages or historically reproduces the Bombe.

---

## 11. Execution order for Codex

**Phase 1 — Skeleton + working engine**
- Initialize Vite/React, create file layout, define model types in JSDoc or comments.
- Implement pure Turing machine functions: validate definition, initialize configuration, execute one step, run with limit, and reset.
- Build correct presets and core engine tests.

**Phase 2 — Usable laboratory**
- Input field, preset selector, tape view, current state, Step/Run/Pause/Reset.
- Editable transition table, validation feedback, state diagram, trace table, results view.

**Phase 3 — Visual novel + styling**
- Dark minimalist Home matching approved reference image.
- Four-scene story with Alan Turing, short dialogue, simple transitions.
- Apply consistent styling to lab without compromising form readability.

**Phase 4 — Verification + docs**
- Run tests and production build; fix issues.
- Write README, user manual and short live demo script.
- Summarize exactly which requirements were met and any remaining limitations.

**Do not ask broad planning questions:** Use the choices in this PRD and proceed. Only ask if a truly blocking missing local dependency or file prevents implementation.

---

## 12. Local setup commands

Prerequisite: a current Node.js LTS release compatible with the installed Vite version.

```bash
npm install
npm run dev
npm test
npm run build
```

When starting from an empty folder, Codex should set up the project automatically. The user will open the localhost address printed by Vite in a desktop browser.

---

## 13. Short suggested demo script (2–3 minutes)

1. Home: show dark Project Enigma design and direct Lab access.
2. Story: advance the first dialogue, then Skip to Laboratory.
3. Load “Binary string ends in 1”; enter `101`; Step through transitions, show moving head and active state; Run to **Accepted**.
4. Reset and test `100`; demonstrate **Rejected**.
5. Load “Enigma-inspired crib alignment check”; enter `DDSDD`, demonstrate why it rejects, then `DDDDD` to accept.
6. Edit one transition, validate/apply, run again; show step history and final result.
7. Explain that the novel/Enigma frame is narrative; the actual computational model is a formal deterministic Turing machine.

**Final priority:** Academic correctness and a functioning simulator first; visual fidelity and atmosphere second; extra features last.
