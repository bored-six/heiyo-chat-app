# PRD: UX Polish — Timestamps, Char Counter, Reconnect Banner

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

Three small UX polish features to make the chat feel more polished and communicative:

1. **Message timestamps on hover** — reveal the send time when hovering a message bubble
2. **Character counter** — show `x/2000` near the send button as the user types, supplementing the existing SVG progress ring
3. **Graceful reconnect UI** — distinguish a mid-session disconnect from first load; show a slim banner instead of replacing the whole screen

---

## Requirements

### Original Requirements
- **13:** Show full datetime on hover for each message (timestamp already in payload)
- **14:** Show `x/2000` counter near the send button as user approaches the 2000-char limit
- **15:** When connection drops mid-session, show a subtle "reconnecting…" banner instead of a blank state

### Discovered Requirements
- **13** was already fully implemented (hidden by default via `opacity-0 group-hover:opacity-100` in `Message.jsx`) — no work needed
- **14:** The ring already existed. The request was for a *numeric* counter to accompany it, not replace it. Counter should be invisible when input is empty to avoid layout shift.
- **15:** "Blank state" referred to the full-screen "Entering Heiyo…" overlay. The fix required tracking whether a connection had *ever* been established so first-load and reconnect could be distinguished.

---

## Architecture

### Design Decisions

**14 — Counter placement:**
Placed below the SVG ring in a `flex-col` wrapper. Always reserves space (`opacity: 0` when empty) to prevent layout shift when the counter appears. Color mirrors the ring: white/dim → yellow at >1800 → red at >2000.

**15 — `everConnected` via `useRef`:**
Used `useRef` instead of `useState` because the value only needs to survive renders, not trigger them. A state variable would cause an unnecessary re-render on first connect. The ref is set inline (`if (connected) everConnected.current = true`) before the conditional returns, so it's always current.

**15 — Banner design:**
Slim (32px tall), pinned to the top with `fixed inset-x-0 top-0 z-50`. Semi-transparent yellow with `backdrop-blur-sm` to feel like an OS-level notification rather than app UI. Disappears automatically when the socket reconnects (`!connected` becomes false).

---

## Implementation

### Component Inventory

| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| Message | React component | `client/src/components/Message.jsx` | Timestamp on hover (pre-existing) | Complete |
| MessageInput | React component | `client/src/components/MessageInput.jsx` | Numeric x/2000 counter below ring | Complete |
| App | React component | `client/src/App.jsx` | Reconnect banner + first-load guard | Complete |

### Key Logic

**Message.jsx (pre-existing, feature 13):**
- `formatTime(timestamp)` formats to `HH:MM`
- Timestamp `<span>` has `opacity-0 group-hover:opacity-100 transition-opacity duration-200`
- Parent message bubble has `group` class to enable group-hover

**MessageInput.jsx (feature 14):**
- `nearLimit = text.length > 1800`, `overLimit = text.length > MAX_CHARS (2000)`
- Ring wrapper changed from bare `div` to `flex flex-col items-center gap-0.5` wrapper
- Counter `<span>` below ring: `opacity: text.length > 0 ? 1 : 0` (space always reserved)
- Color: `'#ff4444'` when over, `'#FFE600'` when near, `rgba(255,255,255,0.3)` otherwise

**App.jsx (feature 15):**
- `everConnected = useRef(false)` — set to `true` inline whenever `connected === true`
- `if (!connected && !everConnected.current)` → full-screen "Entering Heiyo…" (first load only)
- `if (!connected && everConnected.current)` → slim yellow banner rendered inside main UI return
- Banner: `fixed inset-x-0 top-0 z-50`, pulsing yellow dot + "RECONNECTING…" text

### Business Rules
- The full-screen loading screen only shows on first load (before any successful connection)
- Once connected, subsequent disconnects show the slim banner only — the chat remains visible and interactive (though messages won't send until reconnected)
- The character counter is invisible when the input is empty; it fades in on the first keystroke
- Counter color thresholds match the ring: yellow >1800, red >2000

---

## Changelog

### [FEAT] Numeric x/2000 character counter — 2026-02-18
- Wrapped the SVG ring + button in a `flex-col` container
- Added `{text.length}/2000` span below the ring, hidden when input empty, color-coded to match ring
- Files affected: `client/src/components/MessageInput.jsx`
- Commit: `8ef6e74`

### [FEAT] Slim reconnecting banner — 2026-02-18
- Added `everConnected` ref to distinguish first-load from mid-session disconnect
- Full-screen overlay now guarded by `!everConnected.current`
- Added slim yellow pinned banner (`fixed top-0 z-50`) that shows only during reconnects
- Files affected: `client/src/App.jsx`
- Commit: `8ef6e74`

### [DOCS] Feature 13 confirmed pre-existing — 2026-02-18
- Timestamp on hover was already implemented in `Message.jsx` via `group-hover:opacity-100`
- No code changes needed
