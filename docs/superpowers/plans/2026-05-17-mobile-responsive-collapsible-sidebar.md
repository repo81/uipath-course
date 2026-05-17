# Mobile Responsive + Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `src/App.jsx` mobile-responsive and add a collapsible left sidebar — desktop gets a chevron toggle, mobile gets a hamburger button in the header.

**Architecture:** All changes are in `src/App.jsx`. Two new state variables (`sidebarOpen`, `isMobile`) drive conditional rendering and dynamic inline styles. A `resize` listener keeps `isMobile` in sync. No new files, no CSS files, no libraries.

**Tech Stack:** React 19, Vite, 100% inline styles

---

### Task 1: Add `useEffect` to import + state + resize listener

**Files:**
- Modify: `src/App.jsx:1` (import)
- Modify: `src/App.jsx:838-841` (state declarations in `UiPathCourse`)

- [ ] **Step 1: Update the React import to include `useEffect`**

Replace line 1:
```jsx
import { useState, useEffect } from "react";
```

- [ ] **Step 2: Add `sidebarOpen` and `isMobile` state after line 841**

After `const [activeTab, setActiveTab] = useState("content");`, add:
```jsx
const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

- [ ] **Step 3: Add resize listener effect after the new state lines**

```jsx
useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) setSidebarOpen(false);
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

- [ ] **Step 4: Verify dev server compiles without errors**

Run: `npm run dev`
Expected: No compilation errors in terminal or browser console.

---

### Task 2: Make sidebar collapsible + add desktop chevron toggle

**Files:**
- Modify: `src/App.jsx:892-929` (sidebar + flex wrapper)

- [ ] **Step 1: Replace the sidebar `<div>` (lines 894–929) with a width-animated version**

The sidebar needs an inner `width: 200` wrapper so content doesn't shrink during the animation. Replace the entire sidebar div:

```jsx
{/* Sidebar */}
<div style={{
  width: sidebarOpen ? 200 : 0,
  background: "#0D1117",
  borderRight: "1px solid #1E293B",
  overflowY: sidebarOpen ? "auto" : "hidden",
  overflowX: "hidden",
  flexShrink: 0,
  transition: "width 0.25s ease",
}}>
  <div style={{ width: 200 }}>
    {topics.map(t => (
      <button
        key={t.id}
        onClick={() => handleTopicChange(t.id)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "11px 13px",
          background: active === t.id ? `linear-gradient(90deg, ${t.color}15, transparent)` : "transparent",
          border: "none",
          borderLeft: active === t.id ? `3px solid ${t.color}` : "3px solid transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 9
        }}
      >
        <span style={{ fontSize: 15 }}>{t.icon}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: active === t.id ? t.color : "#94A3B8", lineHeight: 1.3 }}>
            {t.title}
          </div>
          <div style={{ fontSize: 9, color: "#334155", marginTop: 1 }}>
            {t.quiz.length} questions
          </div>
        </div>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Add the desktop chevron button immediately after the closing sidebar `</div>` and before the main content `<div>`**

```jsx
{/* Desktop chevron toggle */}
{!isMobile && (
  <button
    onClick={() => setSidebarOpen(p => !p)}
    style={{
      width: 18,
      background: "#0D1117",
      border: "none",
      borderRight: "1px solid #1E293B",
      cursor: "pointer",
      color: "#94A3B8",
      fontSize: 14,
      flexShrink: 0,
      padding: "8px 0 0 0",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}
  >
    {sidebarOpen ? "‹" : "›"}
  </button>
)}
```

- [ ] **Step 3: Verify in browser**

Open the dev server URL. Click the `‹` chevron — sidebar should animate closed. Click `›` — sidebar should animate open. No layout breaks.

---

### Task 3: Add mobile hamburger button in header + adjust mobile padding

**Files:**
- Modify: `src/App.jsx:865-890` (header)
- Modify: `src/App.jsx:932` (main content padding)

- [ ] **Step 1: Update header padding to be mobile-aware and add a `flex: 1` to the title block**

Replace the header `<div>` opening style and its inner title `<div>`:

```jsx
{/* Header */}
<div style={{
  background: "linear-gradient(135deg, #0F172A, #1E293B)",
  borderBottom: "1px solid #1E3A5F",
  padding: isMobile ? "10px 14px" : "14px 24px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexShrink: 0
}}>
  <div style={{
    width: 38, height: 38,
    background: "linear-gradient(135deg, #00C6FF, #0072FF)",
    borderRadius: 9,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 900, color: "#fff",
    boxShadow: "0 0 18px rgba(0,198,255,0.35)"
  }}>U</div>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
      UiPath Studio — Certification Course
    </div>
    <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>
      Deep Dive + Exam Trap Questions
    </div>
  </div>
  {isMobile && (
    <button
      onClick={() => setSidebarOpen(p => !p)}
      style={{
        background: "none",
        border: "1px solid #334155",
        borderRadius: 6,
        color: "#94A3B8",
        cursor: "pointer",
        fontSize: 18,
        padding: "4px 8px",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {sidebarOpen ? "✕" : "☰"}
    </button>
  )}
</div>
```

- [ ] **Step 2: Update main content padding to be mobile-aware**

Replace `src/App.jsx` line ~932:
```jsx
<div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 14px" : "18px 24px" }}>
```

- [ ] **Step 3: Verify mobile layout in browser**

Resize the browser window to under 768px wide. Expected:
- Hamburger `☰` button appears in the header
- Sidebar is hidden on load
- Tapping `☰` opens sidebar (pushes content right)
- Tapping `✕` closes it
- Desktop chevron strip does not appear at this width

- [ ] **Step 4: Verify desktop layout still works**

Resize back to ≥768px. Expected:
- Hamburger disappears
- Chevron strip reappears
- Sidebar collapses/expands via chevron

---

### Task 4: Commit

**Files:** `src/App.jsx`

- [ ] **Step 1: Commit**

```bash
git add src/App.jsx
git commit -m "feat: mobile responsive layout + collapsible sidebar"
```
