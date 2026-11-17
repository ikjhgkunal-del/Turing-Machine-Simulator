# Verification record

Executed locally on **10 November 2026 (Asia/Kolkata)**, after completing the PRD’s four implementation phases.

| Check | Actual result |
| --- | --- |
| Dependency installation | PASS — 41 packages installed; npm audit reported 0 vulnerabilities |
| `npm test` | PASS — 1 suite, 38 tests; includes all required engine cases and an exhaustive binary oracle through length 8 |
| `npm run build` | PASS — Vite production build; 31 modules transformed |
| `npm run test:browser` | PASS — 19 production-browser checks using the installed headless Chrome |
| `npm run dev` | PASS — Vite started at `http://127.0.0.1:5173/`; Home and transformed React entry module both returned HTTP 200 |
| Runtime network | PASS — no requests to external services in the browser checks |
| Browser console | PASS — no JavaScript exceptions or console errors |
| Teardown | PASS — browser and preview closed; temporary development server stopped |

Tools used: portable Node **22.23.4**, npm **10.9.9**, React/React DOM **19.3.1**, Vite **8.3.7**, Vitest **5.1.0**, Playwright **1.65.0**. Exact dependencies and integrity checksums are in `package-lock.json`. Node was downloaded from the official distribution and the archive was checked against its official SHA-256 manifest before extraction; no system PATH changes were made.

## User-flow checklist: expected versus actual

These manual-demo steps were executed through browser automation against `dist/`. Home, Story, Laboratory, Results, and mobile screenshots were also visually inspected. This is a browser verification record, not a claim of human usability testing.

| Action | Expected | Actual |
| --- | --- | --- |
| Begin investigation; Next / Back / Enter laboratory | Exactly four scenes with working navigation | PASS — all four scenes and controls verified |
| Skip story, or use Home’s direct Lab button | Enter the working lab immediately | PASS — both paths verified |
| Step on binary `101` | One transition, qLast1, head 1, one trace row | PASS — exact state/head/count/trace checked |
| Run `101`; inspect Results | Accepted in 4; preserve trace and definition on return | PASS — 4 rows, Accepted, session preserved |
| Load `100`; then empty binary input | Rejected in 4; then Rejected in 1 | PASS — both outcomes and counts covered |
| Load `10X` | Offending X explained; Run disabled | PASS — error and disabled execution checked |
| Run crib `DDSDD`, `DDDDD`, empty | Rejected / Accepted / Accepted | PASS — all three outcomes checked |
| Edit binary final-1 rule to qReject; Apply | `101` changes from acceptance to rejection | PASS — new behavior checked through actual Run |
| Add a duplicate transition; Apply | Duplicate-key error; no execution | PASS — validation message and recovery by deletion verified |
| Add/remove qNew in States | New state appears; removal restores smaller graph | PASS — fallback with 6 states and SVG with 5 checked |
| Delete the initial `1` rule; Step | Halted (no transition), 0 transitions, not Rejected | PASS — lab and Results verdict checked |
| Change crib D rule to L and blank write to D | Negative index −1, blank read, final content DD | PASS — head and final content checked |
| Run / Pause; wait; Run / Reset; navigate away | No stale scheduled transitions | PASS — counts remained fixed after each cancellation |
| Loop on blank, moving L; Run empty input | Step limit reached at 1,000; head −1,000 | PASS — real timer run reached the exact bound; Results retained limit status |
| Open Field guide; Tab repeatedly; Escape | Focus stays in dialog; Escape closes | PASS — keyboard focus containment and close checked |
| Resize to 1100×800, 768×1024, 390×844 | No page overflow; controls usable | PASS — Step/Reset worked at each size; mobile Home/Story checked too |

The binary engine tests also verify `1` accepts, symbol writes and erasure, S movement, blank reads on both sides, immutable configurations, no extra steps after accept/reject, reset, invalid definitions, initially halting machines, Unicode symbols, and acceptance exactly at the safety boundary.

## PRD acceptance coverage

| ID | Delivered evidence |
| --- | --- |
| F01 / F13 | Home buttons, story skip and direct laboratory entry tested in Chrome |
| F02 | Four data-driven scenes, working Back/Next/Skip/Enter controls |
| F03 | Input alphabet validation with near-field errors; empty input cases |
| F04 | Editable state/alphabet form and add/edit/delete transition table; real rule-edit verdict test |
| F05 | Pure single-step read/write/move/state/trace semantics, tested independently of React |
| F06 | Animated tape, indexed cells, negative head positions, reduced-motion support |
| F07 | One timeout owner; Pause/Reset/navigation cancel scheduled work; real timer checks |
| F08 | Accepted, Rejected, no-rule halt, step limit remain distinct in Lab and Results |
| F09 | SVG directed state map, current node/last edge highlight, readable rule legend and larger-machine fallback |
| F10 | Scrollable per-transition trace; final input/tape/head/state/count; preserved session on Back |
| F11 | Both complete presets pass all specified sample verdicts |
| F12 | Dependencies installed, tests passed, production build passed, dev server HTTP checked |
| F14 | Desktop 1440×900 plus laptop/tablet/phone layout verification |

## Captured artifacts

`artifacts/browser-report.json` contains all 19 passing check names. Screenshots:

- `artifacts/home-desktop.png`
- `artifacts/story-desktop.png`
- `artifacts/lab-desktop.png`
- `artifacts/results-desktop.png`
- `artifacts/home-mobile.png`
- `artifacts/story-mobile.png`
- `artifacts/lab-mobile.png`

Artifacts, dependencies, and portable tooling are ignored by Git. Re-run `npm run build` then `npm run test:browser` to regenerate browser evidence. See `README.md` for setup, theory, a manually derived computation, architecture, pseudocode, known scope limits, and the presentation script.
