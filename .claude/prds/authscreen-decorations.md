# PRD: AuthScreen Floating Decorations

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

AuthScreen previously had a static background (dots pattern, stripes, and a faint "HEIYO"
watermark) that felt disconnected from the animated BubbleUniverse. The `DECORATIONS` array
from `BubbleUniverse.jsx` is now exported and reused in AuthScreen, giving the landing screen
the same floating emoji (✨ 💫 ⚡ 🌀 💜 🔥 ✦ ★) with matching animations.

## Requirements

### Original Requirements
- Add floating bubbles, emoji decorations, or movement to AuthScreen
- Reuse DECORATIONS from BubbleUniverse to unify visual language

### Discovered Requirements
- All custom animation classes (`animate-wiggle`, `animate-float`, `animate-spin-slow`, etc.)
  are Tailwind v4 global utilities — they work in any component without extra imports
- DECORATIONS positions are edge-biased (left < 10% or left > 80%) so they don't overlap
  the centered `max-w-sm` card

## Architecture

### Design Decisions
- `DECORATIONS` exported directly from `BubbleUniverse.jsx` (named export) — single source of truth
- AuthScreen imports and renders the array identically to BubbleUniverse: same `span` + `style` pattern
- No parallax on AuthScreen (mouse tracking not needed for a form screen; pure CSS animations suffice)

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| BubbleUniverse | React component | `client/src/components/BubbleUniverse.jsx` | Exports DECORATIONS | Complete |
| AuthScreen | React component | `client/src/components/AuthScreen.jsx` | Renders DECORATIONS | Complete |

## Changelog

### [FEAT] Floating emoji decorations on AuthScreen — 2026-02-18
- Added `export` to `DECORATIONS` const in BubbleUniverse.jsx
- AuthScreen imports `DECORATIONS` and renders the same floating emoji span array
- Decorations rendered between background layers and HEIYO watermark (z-index preserved)
- Files affected: `client/src/components/BubbleUniverse.jsx`, `client/src/components/AuthScreen.jsx`
