# visual-course-c — Designed to Embed

Interactive visual course for Embedded C & Electronics (**Designed to Embed**), built with zero-dependency browser ES Modules (`<script type="module" src="src/main.js">`) and 4 boundary CSV datasets (`./datasets/`).

[![Live on Vercel](https://img.shields.io/badge/Vercel-Live%20Production-000000?logo=vercel)](https://visual-course-c.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-visual--course--c-181717?logo=github)](https://github.com/huongmh14/visual-course-c)

## Live Links & Repositories

| Resource | Link |
| --- | --- |
| Live Production App (Vercel) | https://visual-course-c.vercel.app |
| Vercel Project Alias | https://visual-course-c-52hzs-projects-569b0696.vercel.app |
| GitHub Repository | https://github.com/huongmh14/visual-course-c |
| Companion C Labs | https://github.com/huongmh14/Embedded-C |

---

## Features

- **Bilingual Curriculum (`VI` / `EN`)**: 20 ready bilingual lessons (`00`–`19`) covering the full Phase A Embedded C track (12 lessons from Lesson `00` to `MISRA C`) and Basic Electronics track (8 lessons from `LDO/Buck & DMM` to `UART/I2C/SPI/CAN & Datasheet`), plus 11 planned STM32/RTOS roadmap topics (`20`–`30`).
- **Animated Isometric SVG Engine**: 34 registered SVG scenes (`flow`, 10 `memory` scenes, 5 `onboarding` scenes, 8 `bitwise` scenes, 5 `c-embedded` scenes, and 5 `electronics` scenes) with animated data packets and step-by-step hardware/memory state transitions.
- **Linked Hands-On Labs**: Every lesson links directly to its graded exercises, WSL C17 self-checks, and 4-stage Board Bring-Up Lab in [Embedded-C](https://github.com/huongmh14/Embedded-C).
- **Open-Ended Project Reflection**: Interactive open-ended questions (`#open-q-box`) with `localStorage` auto-save and Markdown export.
- **Self-Check Quizzes & Boundary Data**: Per-lesson check questions (`#quiz-box`), curated course resources, and 4 CSV boundary datasets (`adc.csv`, `debounce.csv`, `fsm.csv`, `pwm.csv`).
- **Fast Navigation & Theming**: Full bilingual search index (`SearchIndex`), Light/Dark theme switcher, and full keyboard control.

### Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `←` / `→` | Previous / Next step |
| `Space` | Play / Pause step animation |
| `R` | Replay current step animation |
| `F` | Toggle fullscreen stage view |
| `Ctrl+K` | Open quick lesson & concept search |
| `Esc` | Close active modal / overlay |

---

## Project Architecture

Pure vanilla ES Modules with zero bundler or runtime dependencies:

```text
visual-course-c/
├── index.html                   # 3-column app shell & topbar controls
├── styles.css                   # Root stylesheet importing src/styles/*
├── check.cjs                    # Automated verification script (lessons, scenes, i18n, CSV)
├── datasets/                    # Boundary CSV datasets
│   ├── adc.csv
│   ├── debounce.csv
│   ├── fsm.csv
│   └── pwm.csv
└── src/
    ├── main.js                  # Composition root (state, shortcuts, UI & animator wiring)
    ├── core/
    │   ├── store.js             # Reactive app state & localStorage persistence
    │   ├── search-index.js      # Bilingual VI/EN lesson & concept search index
    │   └── formatters.js        # Text, snippet, and export formatting helpers
    ├── content/
    │   ├── index.js             # Merged bilingual curriculum export
    │   ├── lesson-intro.js      # Lesson 00 (intro-how-to-learn) content
    │   ├── lesson-bitwise.js    # Lesson 04 (b02-bitwise) content
    │   ├── lessons-c-phase-a.js # Extended Embedded C Phase A lessons
    │   ├── lessons-electronics-ext.js # Extended Basic Electronics lessons
    │   ├── curriculum-base.js   # Core VI lesson definitions
    │   ├── curriculum-review.js # Roadmap & review metadata (ready 00–19, planned 20–30)
    │   ├── resources.js         # External references, GitHub labs & dataset links
    │   └── i18n/                # English localization modules
    │       ├── index.js
    │       ├── en-c.js
    │       ├── en-electronics.js
    │       ├── en-memory.js
    │       └── en-phase-a-ext.js
    ├── engine/
    │   ├── index.js             # Scene registration entrypoint
    │   ├── scene-registry.js    # Scene lookup (`hasScene` / renderer registry)
    │   ├── animator.js          # Step playback & packet animation controller
    │   ├── svg-primitives.js    # Reusable isometric SVG helpers
    │   └── scenes/
    │       ├── flow.js          # Signal/code execution flow scene
    │       ├── memory.js        # 10 memory layout & pointer/bit scenes
    │       ├── onboarding.js    # 5 Lesson 00 onboarding scenes
    │       ├── bitwise.js       # 8 bitwise & CMSIS register scenes
    │       ├── c-embedded.js    # 5 C promotion, timer, build, FSM & ringbuf scenes
    │       └── electronics.js   # 5 power, MOSFET, op-amp/RC, bus & datasheet scenes
    ├── ui/
    │   ├── sidebar.js           # Lesson navigation & progress sidebar
    │   ├── stage.js             # Interactive SVG diagram viewport & step controls
    │   ├── narrative.js         # Lesson prose, open-ended questions, and quizzes
    │   ├── search-modal.js      # Ctrl+K bilingual search modal
    │   └── toast.js             # Non-blocking status notifications
    └── styles/
        ├── tokens.css           # Design tokens & Light/Dark theme variables
        ├── layout.css           # 3-column shell & responsive layout
        ├── stage.css            # SVG stage, controls, and fullscreen styling
        ├── narrative.css        # Typography, open-question cards, and quiz UI
        └── overlays.css         # Search modal & toast styling
```

---

## Authoring Content & Scenes

1. **Add or update lesson content**: Edit [`src/content/lesson-intro.js`](./src/content/lesson-intro.js) or [`src/content/curriculum-base.js`](./src/content/curriculum-base.js) and mirror English translations under [`src/content/i18n/`](./src/content/i18n/index.js).
2. **Add custom SVG diagrams**: Implement a scene renderer under [`src/engine/scenes/`](./src/engine/scenes/memory.js) using helpers from [`src/engine/svg-primitives.js`](./src/engine/svg-primitives.js), then register it in [`src/engine/index.js`](./src/engine/index.js).
3. **Validate before committing**: Always run `node check.cjs` to verify bilingual lesson parity, resource coverage, registered SVG scenes, search indexing, and all 4 CSV datasets.

---

## Local Development & Verification

```bash
# 1. Verify all 20 bilingual lessons, registered SVG scenes, SearchIndex, and 4 CSV datasets
node check.cjs

# 2. Serve locally via any static HTTP server (ES Modules require HTTP, not file://)
python -m http.server 8765
```

Then open `http://localhost:8765` in your browser.

---

## Deployment

Production is hosted statically on **Vercel** (`visual-course-c`) and connected directly to `huongmh14/visual-course-c` (`main`), so pushing to `main` triggers an automatic production rebuild at [https://visual-course-c.vercel.app](https://visual-course-c.vercel.app).

### Planned Backend

- **Supabase**: Planned integration for automated exercise grading and learner submission persistence.
