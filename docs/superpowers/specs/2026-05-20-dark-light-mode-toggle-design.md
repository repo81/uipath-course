# Dark / Light Mode Toggle — Design Spec

**Date:** 2026-05-20
**Status:** Approved

---

## Overview

Add a dark/light mode toggle to the UiPath Studio certification study app. The toggle lives in the app header, uses a pill-switch (🌙 / ☀️) design, persists the preference to `localStorage`, and respects the OS `prefers-color-scheme` on first load. Theming is implemented via CSS custom properties so no new React state needs to propagate through components.

---

## Theme Palette

### Approach: CSS Custom Properties

All color tokens are defined as CSS variables on `:root` (dark defaults) with overrides under `[data-theme="light"]` on the root `<div>`. Inline styles in `App.jsx` reference tokens via `var(--token-name)`. The toggle sets or removes `data-theme="light"` on the root div via a React `ref`.

Per-topic accent colors (`#00C6FF`, `#A78BFA`, `#34D399`, etc.) and quiz feedback colors (green, red, amber) are **not tokenized** — they are vivid enough to work on both backgrounds unchanged.

### Token Table

| Token | Dark | Light (Slate Blue-Gray) |
|---|---|---|
| `--bg-root` | `#0A0E1A` | `#EDF2F8` |
| `--bg-sidebar` | `#0D1117` | `#E1EAF4` |
| `--bg-section-header` | `#0F172A` | `#DAE4F0` |
| `--bg-card` | `#0D1117` | `#EDF2F8` |
| `--bg-code` | `#060A12` | `#1E293B` |
| `--bg-option` | `#060A12` | `#F0F5FB` |
| `--border-primary` | `#1E293B` | `#B8CCE0` |
| `--border-header` | `#1E3A5F` | `#B8CCE0` |
| `--text-primary` | `#E2E8F0` | `#0F1D2E` |
| `--text-secondary` | `#94A3B8` | `#3D5A74` |
| `--text-muted` | `#475569` | `#6B89A5` |
| `--text-faint` | `#334155` | `#6B89A5` |

Note: `--bg-code` stays dark in light mode — code blocks are intentionally kept dark in both themes for readability.

---

## Toggle Component

**Placement:** Right side of the app header, after the title block.

**Visual design:** `🌙` icon — pill switch — `☀️` icon.
- Dark mode (default): pill background `#1E293B`, thumb `#60A5FA` (blue), positioned left
- Light mode: pill background `#0072FF`, thumb `#FFFFFF`, positioned right
- Pill size: 40×22px, thumb 16×16px, border-radius 11px

**Behavior:**
- Click toggles `isDark` state in `UiPathCourse`
- Writes `"dark"` or `"light"` to `localStorage` key `"uipath-theme"`
- Sets or removes `data-theme="light"` on the root `<div>` via `ref`

---

## State Initialization

On mount, theme is determined in this priority order:

1. `localStorage.getItem("uipath-theme")` — use saved value if present (`"dark"` or `"light"`)
2. `window.matchMedia("(prefers-color-scheme: light)").matches` — use OS preference if no saved value
3. Default: dark

Initialized as a `useState` value derived via a function (lazy init) so it runs once on mount and does not cause a flash.

---

## Transitions

A wildcard CSS rule adds a smooth fade on theme switch. Because styles are inline, `:root` transitions don't propagate — the rule must target all elements:

```css
*, *::before, *::after {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

The sidebar already has `transition: "width 0.25s ease"` as an inline style. Because inline `transition` overrides the CSS rule on that element, the sidebar will not animate background-color — this is acceptable since it uses `--bg-sidebar` which changes subtly.

---

## Files Changed

### `src/index.css`

- Add `:root { }` block declaring all dark-mode token defaults
- Add `[data-theme="light"] { }` block with light overrides
- Add `:root { transition: ... }` rule

### `src/App.jsx`

- Replace all hardcoded color hex values that map to a theme token with `var(--token-name)` references in inline styles
- Add `isDark` state to `UiPathCourse` with lazy initializer (localStorage + OS preference)
- Add `rootRef` (React ref) on the outermost `<div>` to set/remove `data-theme`
- Add `useEffect` that syncs `isDark` → `data-theme` attribute + localStorage on every toggle
- Add pill toggle JSX to the header, between the title block and the mobile hamburger button

No changes to `QuizSection` — CSS variables resolve automatically without prop changes.

---

## Out of Scope

- Animating the pill thumb position with JS (CSS transition handles it)
- System-level listening for OS theme changes after initial load
- Any per-topic accent color adjustments
