# Mobile Responsive + Collapsible Sidebar

**Date:** 2026-05-17  
**File:** `src/App.jsx`

## Goal

Make the UiPath Studio certification app usable on mobile devices, and add a collapsible left sidebar on desktop.

## Breakpoint

- Mobile: `window.innerWidth < 768`
- Desktop: `window.innerWidth >= 768`

## State

Two new state variables added to the `UiPathCourse` component:

- `sidebarOpen` (boolean) — `true` on desktop, `false` on mobile at init
- `isMobile` (boolean) — reflects current breakpoint, updated by a `resize` listener in a `useEffect` (cleaned up on unmount)

When `isMobile` transitions true (e.g. user resizes window down), sidebar auto-closes.

## Desktop Behavior (≥768px)

- Sidebar animates between `width: 200` and `width: 0` using inline `transition: "width 0.25s ease"` and `overflow: "hidden"`
- When open: a `‹` chevron button sits at the top-right corner of the sidebar
- When closed: a `›` chevron button pins to the top-left of the content area
- No hamburger in the header on desktop

## Mobile Behavior (<768px)

- Sidebar starts hidden (`width: 0`)
- A `☰` / `✕` toggle button appears on the right side of the header
- Tapping it sets `sidebarOpen` to `true`, which gives the sidebar `width: 200` and `flexShrink: 0`, pushing content right
- No chevron button on mobile

## Layout Adjustments on Mobile

- Header padding: `14px 24px` → `10px 14px`
- Main content padding: `18px 24px` → `12px 14px`

## Constraints

- No CSS files, no Tailwind — all styling via inline `style` props
- No routing or external libraries added
- Resize listener uses `window.addEventListener("resize", handler)` with cleanup
