# Dark / Light Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent 🌙/☀️ pill toggle in the app header that switches between dark (navy) and light (slate blue-gray) themes using CSS custom properties.

**Architecture:** CSS custom properties defined in `src/index.css` under `:root` (dark defaults) and `[data-theme="light"]`. All tokenized hex values in `src/App.jsx` inline styles are replaced with `var(--token-name)`. `UiPathCourse` holds `isDark` state (lazy-initialized from localStorage/OS preference) and syncs it to a `data-theme` attribute on the root `<div>` via a ref.

**Tech Stack:** React 19, CSS custom properties, localStorage, `window.matchMedia`

---

## File Map

| File | Change |
|---|---|
| `src/index.css` | Add `:root` token block (dark defaults), `[data-theme="light"]` overrides, wildcard transition rule |
| `src/App.jsx` | Add `useRef` import; add `isDark` state + `rootRef` + `toggleTheme` + `useEffect` to `UiPathCourse`; add pill toggle JSX in header; replace all tokenized hex values in both components |

---

## Task 1: Add CSS custom property tokens to `src/index.css`

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add token blocks to index.css**

Open `src/index.css`. The current content is:
```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }
#root { height: 100vh; display: flex; flex-direction: column; }
```

Replace the entire file with:
```css
*, *::before, *::after { box-sizing: border-box; }
*, *::before, *::after { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
body { margin: 0; padding: 0; }
#root { height: 100vh; display: flex; flex-direction: column; }

:root {
  --bg-root: #0A0E1A;
  --bg-sidebar: #0D1117;
  --bg-section-header: #0F172A;
  --bg-card: #0D1117;
  --bg-code: #060A12;
  --bg-option: #060A12;
  --border-primary: #1E293B;
  --border-header: #1E3A5F;
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
  --text-muted: #475569;
  --text-faint: #334155;
}

[data-theme="light"] {
  --bg-root: #EDF2F8;
  --bg-sidebar: #E1EAF4;
  --bg-section-header: #DAE4F0;
  --bg-card: #EDF2F8;
  --bg-code: #1E293B;
  --bg-option: #F0F5FB;
  --border-primary: #B8CCE0;
  --border-header: #B8CCE0;
  --text-primary: #0F1D2E;
  --text-secondary: #3D5A74;
  --text-muted: #6B89A5;
  --text-faint: #6B89A5;
}
```

- [ ] **Step 2: Run dev server and verify no visual change**

```bash
npm run dev
```

Open the app. It should look identical to before — inline styles still have hardcoded hex values that take precedence over the CSS vars, so nothing should change visually. This just confirms the CSS file has no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add CSS custom property theme tokens"
```

---

## Task 2: Add theme state, ref, and toggle to `UiPathCourse`

**Files:**
- Modify: `src/App.jsx` (lines 1, 853–886)

- [ ] **Step 1: Add `useRef` to the React import**

Find line 1:
```jsx
import { useState, useEffect } from "react";
```

Change to:
```jsx
import { useState, useEffect, useRef } from "react";
```

- [ ] **Step 2: Add theme state, ref, handler, and sync effect inside `UiPathCourse`**

Find the opening of `UiPathCourse` (after `export default function UiPathCourse() {`). The existing state declarations start with:
```jsx
  const [active, setActive] = useState("else-if");
```

Add the following block immediately before that line:
```jsx
  const rootRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("uipath-theme");
    if (saved) return saved === "dark";
    return !window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    if (rootRef.current) {
      isDark
        ? rootRef.current.removeAttribute("data-theme")
        : rootRef.current.setAttribute("data-theme", "light");
    }
    localStorage.setItem("uipath-theme", isDark ? "dark" : "light");
  }, [isDark]);

```

- [ ] **Step 3: Attach `rootRef` to the outermost div**

Find the outermost `return (` div in `UiPathCourse`. It currently starts:
```jsx
    <div style={{
      minHeight: "100vh",
      background: "#0A0E1A",
```

Add `ref={rootRef}` to it:
```jsx
    <div ref={rootRef} style={{
      minHeight: "100vh",
      background: "#0A0E1A",
```

- [ ] **Step 4: Add pill toggle JSX to the header**

In the header section, find the block that ends with the title/subtitle div:
```jsx
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
            UiPath Studio — Certification Course
          </div>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
          </div>
        </div>
        {isMobile && (
```

Insert the pill toggle between the title div and the `{isMobile &&` block:
```jsx
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
            UiPath Studio — Certification Course
          </div>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🌙</span>
          <div
            onClick={toggleTheme}
            role="switch"
            aria-checked={!isDark}
            aria-label="Toggle light mode"
            style={{
              width: 40, height: 22,
              background: isDark ? "#1E293B" : "#0072FF",
              border: `1px solid ${isDark ? "#334155" : "#0060D0"}`,
              borderRadius: 11,
              position: "relative",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <div style={{
              width: 16, height: 16,
              background: isDark ? "#60A5FA" : "#FFFFFF",
              borderRadius: "50%",
              position: "absolute",
              top: 2,
              left: isDark ? 2 : 22,
              transition: "left 0.2s ease, background-color 0.2s ease"
            }} />
          </div>
          <span style={{ fontSize: 14 }}>☀️</span>
        </div>
        {isMobile && (
```

- [ ] **Step 5: Verify in the browser**

The toggle pill should appear in the header to the left of the hamburger button (on mobile) or to the right of the title (on desktop). Clicking it should:
- Slide the thumb between left (dark) and right (light) positions
- Set/remove `data-theme="light"` on the root div (check in DevTools → Elements)
- Write to `localStorage` key `uipath-theme` (check in DevTools → Application → Local Storage)

The app colors will NOT change yet — inline styles still have hardcoded hex values.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add theme toggle state and pill switch to header"
```

---

## Task 3: Tokenize colors in `UiPathCourse`

**Files:**
- Modify: `src/App.jsx` (the `UiPathCourse` component only, lines ~887–1159)

Make each replacement exactly as shown. Do not change any `topic.color`, `#34D399`, `#F87171`, `#FBBF24`, `#86EFAC`, `#FCA5A5`, `#052e16`, `#2d0a0a`, or `#FCD34D` values — those are accent/feedback colors that stay hardcoded.

- [ ] **Step 1: Tokenize the root div**

Find:
```jsx
    <div ref={rootRef} style={{
      minHeight: "100vh",
      background: "#0A0E1A",
      fontFamily: "'Courier New', Consolas, monospace",
      color: "#E2E8F0",
```

Replace with:
```jsx
    <div ref={rootRef} style={{
      minHeight: "100vh",
      background: "var(--bg-root)",
      fontFamily: "'Courier New', Consolas, monospace",
      color: "var(--text-primary)",
```

- [ ] **Step 2: Tokenize the header**

Find:
```jsx
        background: "linear-gradient(135deg, #0F172A, #1E293B)",
        borderBottom: "1px solid #1E3A5F",
```

Replace with:
```jsx
        background: "linear-gradient(135deg, var(--bg-section-header), var(--border-primary))",
        borderBottom: "1px solid var(--border-header)",
```

- [ ] **Step 3: Tokenize the header subtitle and mobile hamburger**

Find (subtitle text color inside the header):
```jsx
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
```

Replace `"#475569"` with `"var(--text-muted)"`:
```jsx
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Dive + Exam Trap Questions
```

Find the mobile hamburger button styles:
```jsx
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#94A3B8",
```

Replace with:
```jsx
              border: "1px solid var(--text-faint)",
              borderRadius: 6,
              color: "var(--text-secondary)",
```

- [ ] **Step 4: Tokenize the sidebar**

Find the sidebar outer div:
```jsx
          background: "#0D1117",
          overflowY: sidebarOpen ? "auto" : "hidden",
```

Replace:
```jsx
          background: "var(--bg-sidebar)",
          overflowY: sidebarOpen ? "auto" : "hidden",
```

Find the inactive topic button text color (inside the sidebar `topics.map`):
```jsx
            color: active === t.id ? t.color : "#94A3B8", lineHeight: 1.3 }}>
```

Replace:
```jsx
            color: active === t.id ? t.color : "var(--text-secondary)", lineHeight: 1.3 }}>
```

Find the topic subtitle color:
```jsx
                  <div style={{ fontSize: 9, color: "#334155", marginTop: 1 }}>
```

Replace:
```jsx
                  <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 1 }}>
```

- [ ] **Step 5: Tokenize the desktop chevron toggle**

Find:
```jsx
            background: "#0D1117",
            border: "none",
            borderRight: "1px solid #1E293B",
            cursor: "pointer",
            color: "#94A3B8",
```

Replace with:
```jsx
            background: "var(--bg-sidebar)",
            border: "none",
            borderRight: "1px solid var(--border-primary)",
            cursor: "pointer",
            color: "var(--text-secondary)",
```

- [ ] **Step 6: Tokenize the topic header card**

Find:
```jsx
            background: `linear-gradient(135deg, ${topic.color}15, #0F172A 60%)`,
```

Replace with:
```jsx
            background: `linear-gradient(135deg, ${topic.color}15, var(--bg-section-header) 60%)`,
```

- [ ] **Step 7: Tokenize the tab buttons**

Find the inactive tab button styles (there is one `style={{...}}` object on each tab button):
```jsx
              background: activeTab === tab.key ? `${topic.color}20` : "#1E293B",
              border: `1px solid ${activeTab === tab.key ? topic.color : "#334155"}`,
              ...
              color: activeTab === tab.key ? topic.color : "#64748B",
```

Replace with:
```jsx
              background: activeTab === tab.key ? `${topic.color}20` : "var(--border-primary)",
              border: `1px solid ${activeTab === tab.key ? topic.color : "var(--text-faint)"}`,
              ...
              color: activeTab === tab.key ? topic.color : "var(--text-muted)",
```

- [ ] **Step 8: Tokenize the section accordion**

Find the section outer div border and background:
```jsx
                border: "1px solid #1E293B",
                borderRadius: 10,
                overflow: "hidden",
                background: "#0D1117"
```

Replace with:
```jsx
                border: "1px solid var(--border-primary)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--bg-card)"
```

Find the accordion header button background:
```jsx
                    background: "#0F172A",
```

Replace with:
```jsx
                    background: "var(--bg-section-header)",
```

Find the section heading text color:
```jsx
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#CBD5E1" }}>
```

Replace with:
```jsx
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
```

Find the section content text color:
```jsx
                      style={{ fontSize: 16, lineHeight: 1.8, color: "#94A3B8", marginBottom: 12 }}
```

Replace with:
```jsx
                      style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", marginBottom: 12 }}
```

Find the code block background:
```jsx
                        background: "#060A12",
```

Replace with:
```jsx
                        background: "var(--bg-code)",
```

- [ ] **Step 9: Tokenize the quiz tab wrapper**

Find the quiz tab outer div (wraps `<QuizSection />`):
```jsx
              background: "#0D1117",
              border: "1px solid #1E293B",
              borderRadius: 10,
              padding: "16px"
```

Replace with:
```jsx
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: 10,
              padding: "16px"
```

---

## Task 4: Tokenize colors in `QuizSection` and commit

**Files:**
- Modify: `src/App.jsx` (the `QuizSection` component only, lines ~682–851)

- [ ] **Step 1: Tokenize the score counter badge**

Find:
```jsx
            background: "#0A0E1A",
            border: `1px solid ${color}30`,
```

Replace with:
```jsx
            background: "var(--bg-root)",
            border: `1px solid ${color}30`,
```

- [ ] **Step 2: Tokenize the question card**

Find the question card outer div:
```jsx
            border: `1px solid ${isSubmitted ? (isCorrect ? "#34D39940" : "#F8717140") : "#1E293B"}`,
            borderRadius: 10,
            overflow: "hidden",
            background: "#0A0E1A"
```

Replace with:
```jsx
            border: `1px solid ${isSubmitted ? (isCorrect ? "#34D39940" : "#F8717140") : "var(--border-primary)"}`,
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--bg-root)"
```

Find the question header separator:
```jsx
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
```

Replace with:
```jsx
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-primary)" }}>
```

Find the question number label:
```jsx
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 5, letterSpacing: 1 }}>
```

Replace with:
```jsx
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 5, letterSpacing: 1 }}>
```

Find the question text:
```jsx
              <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, fontWeight: 600 }}>
```

Replace with:
```jsx
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>
```

- [ ] **Step 3: Tokenize default option colors**

Find the three `let` declarations at the top of the options map:
```jsx
                let bg = "#060A12";
                let borderColor = "#1E293B";
                let textColor = "#94A3B8";
```

Replace with:
```jsx
                let bg = "var(--bg-option)";
                let borderColor = "var(--border-primary)";
                let textColor = "var(--text-secondary)";
```

- [ ] **Step 4: Tokenize the disabled submit button**

Find the submit button disabled state:
```jsx
                    background: selected !== undefined ? color : "#1E293B",
                    ...
                    color: selected !== undefined ? "#000" : "#475569",
```

Replace with:
```jsx
                    background: selected !== undefined ? color : "var(--border-primary)",
                    ...
                    color: selected !== undefined ? "#000" : "var(--text-muted)",
```

- [ ] **Step 5: Tokenize the feedback explanation text**

Find the explanation text at the bottom of the submitted feedback block:
```jsx
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>
                    <strong style={{ color: "#CBD5E1" }}>Why: </strong>{q.explanation}
```

Replace with:
```jsx
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text-primary)" }}>Why: </strong>{q.explanation}
```

- [ ] **Step 6: Verify both themes in the browser**

With the dev server running, test the following in both dark and light modes:

1. Toggle switches theme — background, sidebar, cards, and text all change
2. Code blocks remain dark in light mode
3. Per-topic accent colors (cyan, purple, green, etc.) are unchanged
4. Quiz: selecting an option highlights correctly in both modes
5. Quiz: submitting shows green/red feedback correctly in both modes
6. Refresh the page — theme persists from localStorage
7. (Optional) Temporarily set your OS to light mode, clear localStorage, reload — app should open in light mode

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: tokenize inline colors for dark/light theme switching"
```
