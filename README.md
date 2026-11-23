# visual-course-c

Interactive visual course for Embedded C & Electronics (**Designed to Embed**), built with zero-dependency ES Modules (`src/`) and 4 boundary CSV datasets (`datasets/`).

## Features
- 12 bilingual lessons (`00`–`11`, Vietnamese & English) + 11 planned roadmap topics (`12`–`22`)
- Isometric hardware/memory SVG diagrams with animated data packets (`src/engine/`)
- Open-ended project questions with `localStorage` auto-save & Markdown export (`Bài 00`)
- Self-check quizzes, keyboard shortcuts (`←`/`→`, `Space`, `R`, `F`, `Ctrl+K`), Light/Dark theme

## Local Run & Verification
```bash
# Verify bilingual lessons, registered SVG scenes, search index, and CSV datasets
node check.cjs

# Serve locally
python -m http.server 8765
```
