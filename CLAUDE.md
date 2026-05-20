# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # Run ESLint on all .js/.jsx files
```

There is no test runner configured.

## Architecture

This is a single-page React 19 + Vite 8 app — a UiPath Studio certification study tool with topic cards, collapsible content sections, and interactive multiple-choice quizzes.

**Everything lives in one file: `src/App.jsx`.**

- `topics` — large array literal at the top of the file. Each entry has `id`, `icon`, `title`, `subtitle`, `color` (hex accent color), `sections[]` (study content with optional `code` string), and `quiz[]` (questions with `options`, `answer` index, `trap`, and `explanation`).
- `QuizSection` — stateful component that renders one topic's quiz questions. Tracks `answers` and `submitted` state per question index. Shows trap/explanation feedback after submission.
- `UiPathCourse` (default export) — root component. Manages `active` topic, `openSections` (collapsible accordion state keyed by `"${topicId}-${sectionIndex}"`), `activeTab` (`"content"` | `"quiz"`), `sidebarOpen` (boolean), and `isMobile` (boolean, breakpoint 768px). A `useEffect` syncs `isMobile`/`sidebarOpen` on window resize. Switching topics resets openSections and activeTab; on mobile it also auto-closes the sidebar.

**Styling:** 100% inline `style` props — no CSS classes, no Tailwind, no CSS-in-JS library. `src/App.css` and `src/index.css` exist but are vestigial; all real styling is inline. The color theme is dark navy (`#0A0E1A` background) with per-topic accent colors. Section content (`section.content`) is rendered via `dangerouslySetInnerHTML` and contains HTML markup (bold, ul/li tags).

**Code block rendering:** Lines in `section.code` starting with `//` or `'` render gray (`#475569`), lines starting with `->` render green (`#86EFAC`), all other lines render blue (`#7DD3FC`). Use these conventions when authoring code examples.

**Section open state:** Sections default to open. The accordion uses `openSections[key] !== false` — only explicitly closed sections are tracked in state.

**No routing, no external state, no API calls.** To add a new topic, append an object to the `topics` array following the existing shape. Design specs and implementation plans live in `docs/superpowers/`.
