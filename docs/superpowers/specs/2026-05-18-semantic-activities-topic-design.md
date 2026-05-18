# Semantic Activities Topic — Design Spec

**Date:** 2026-05-18  
**Scope:** Replace the `sedative` topic (index 1, `src/App.jsx`) with a `semantic` topic covering UiPath Semantic Activities.

---

## Topic Metadata

| Field | Value |
|---|---|
| `id` | `semantic` |
| `icon` | `✦` |
| `title` | `Semantic Activities` |
| `subtitle` | `AI-Powered UI Targeting & Form Automation` |
| `color` | `#A78BFA` |

---

## Sections

### Section 1 — What Are Semantic Activities?

Two distinct but related meanings:

1. **Semantic Action Activities** — a set of AI-powered activities in `UiPath.UIAutomation.Activities`:
   - Extract Form Data
   - Fill Form
   - Set Value
   - Close Popup
2. **Semantic Selectors** — a targeting method inside the Unified Target framework

Key fact: Semantic action activities consume **AI units** per request. Exception: Close Popup only consumes AI units when **AI-Enhanced mode** is enabled.

---

### Section 2 — Semantic Selectors vs Classic Selectors

| Dimension | Classic Selectors | Semantic Selectors |
|---|---|---|
| Matching method | XML attribute matching (tag, id, class, name) | AI functional description |
| Resilience | Brittle — breaks on UI structure changes | Resilient — matches by intent |
| Activity generation | Classic Activities (legacy) | Modern Activities / Unified Target |
| Default state | Always active | Disabled by default |

Semantic Selectors are **disabled by default** and activate only as a fallback after Computer Vision fails. They can be promoted to primary targeting method.

**Unified Target fallback order:**
```
Strict Selector → Fuzzy Selector → Computer Vision → Semantic → Image → Native Text
```

---

### Section 3 — Core Semantic Activities & Internal Components

| Activity | AI Units |
|---|---|
| Extract Form Data | 1 unit per request |
| Fill Form | 1 unit per request |
| Set Value | 1 unit per request |
| Close Popup (standard mode) | 0 units |
| Close Popup (AI-Enhanced mode) | 1 unit per request |

Internal components used under the hood:
- **DOM Extractor** — reads the page DOM structure
- **Semantic Matching** — maps elements by meaning
- **Semantic Execution** — executes the interaction

---

## Quiz Questions

### Q1
**Question:** Which Semantic Activity does NOT consume AI units by default?  
**Options:** Extract Form Data / Fill Form / Set Value / Close Popup  
**Answer:** Close Popup (index 3)  
**Trap:** Close Popup sounds equally "AI-powered" — the trap is that it only consumes AI units when AI-Enhanced mode is explicitly enabled. The other three always consume one AI unit per request.  
**Explanation:** AI-Enhanced mode on Close Popup is opt-in. In standard mode, it uses a conventional popup-close heuristic. Extract Form Data, Fill Form, and Set Value always consume AI units.

### Q2
**Question:** Where does the Semantic Selector sit in the Unified Target fallback chain?  
**Options:** Primary method / After Computer Vision fails / Only in Classic Activities / Replaces Fuzzy Selector  
**Answer:** After Computer Vision fails (index 1)  
**Trap:** "Semantic" sounds authoritative and primary, but it is disabled by default and only activates as a last resort after CV fails — unless manually promoted.  
**Explanation:** Unified Target runs: Strict → Fuzzy → CV → Semantic (fallback). Semantic can be promoted to primary by disabling the methods above it, but out of the box it is the last line of defense.

### Q3
**Question:** What is the key distinction between Classic Selectors and Semantic Selectors?  
**Options:** Classic use AI; Semantic use XML / Classic use XML attributes; Semantic use AI functional descriptions / Semantic is faster / Semantic requires no configuration  
**Answer:** Classic use XML attributes; Semantic use AI functional descriptions (index 1)  
**Trap:** Option C ("Semantic is faster") is a plausible-sounding trap — AI feels modern and fast — but Semantic selectors are actually slower (they run after CV fails as a fallback). Option D is wrong; Semantic selectors require a stored description at design time.  
**Explanation:** Classic selectors match by rigid XML attributes (aaname, class, id) which break when UI structure changes. Semantic selectors match by functional meaning (e.g., "the username field on the login screen") making them resilient to UI refactors.

---

## Implementation

- **File:** `src/App.jsx`
- **Change:** Replace lines 87–172 (the `sedative` topic object) with the `semantic` topic object following the same shape.
- **No other files change.**
