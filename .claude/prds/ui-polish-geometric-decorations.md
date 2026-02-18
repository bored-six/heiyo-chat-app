# PRD: UI Polish — Geometric Decorations & Background Cleanup

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

User found the floating emoji decorations (✨💫⚡🌀💜🔥) visually cheap and wanted the site to look more polished. Direction chosen: keep playful energy, refine execution. Replaced emoji with geometric Unicode shapes and removed the diagonal stripe background pattern.

## Requirements

### Original Requirements
- Remove floating emoji from background — they look cheap
- Make the site look more polished overall
- Keep the playful/energetic vibe (not minimal, not stripped back)

### Discovered Requirements
- `pattern-stripes` existed in 3 locations: App.jsx main bg, App.jsx loading screen, AuthScreen.jsx — all removed
- DECORATIONS array is exported from BubbleUniverse and imported by AuthScreen — single source of truth, both screens updated together
- Shapes needed explicit `color` property since they no longer rely on emoji native color rendering
- Opacity set to `0.45` (BubbleUniverse) and `0.35` (AuthScreen) so shapes read as ambient, not focal

## Architecture

### Design Decisions
- **Geometric Unicode over SVG:** Simpler implementation, same visual result. ◆ ○ + ◇ △ × render as clean design shapes, not cartoon emoji.
- **Keep ✦ ✦ ★:** These already read as design/typographic elements rather than emoji — no change needed.
- **Drop stripes, keep dots + mesh:** Dot grid and radial mesh gradients are subtle enough. Diagonal stripes were the noisiest layer.
- **Explicit color per shape:** Allows each shape to use the existing palette (magenta, cyan, yellow, purple, orange) rather than relying on OS emoji rendering which varies across platforms.

## Implementation

### Component Inventory

| Component | Type | Path | Change |
|-----------|------|------|--------|
| BubbleUniverse | JSX | `client/src/components/BubbleUniverse.jsx` | DECORATIONS array: `emoji` key → `char` + `color`; renderer updated |
| AuthScreen | JSX | `client/src/components/AuthScreen.jsx` | Updated `d.emoji` → `d.char`; added `color` to style; removed `pattern-stripes` div; reduced dot opacity 0.08→0.07 |
| App | JSX | `client/src/App.jsx` | Removed `pattern-stripes` from main bg and loading screen |

### Before / After

**DECORATIONS (before):**
```js
{ emoji: '✨', size: 'text-4xl', ... }
{ emoji: '💫', size: 'text-5xl', ... }
{ emoji: '⚡', size: 'text-3xl', ... }
{ emoji: '🌀', size: 'text-4xl', ... }
{ emoji: '💜', size: 'text-3xl', ... }
{ emoji: '🔥', size: 'text-4xl', ... }
```

**DECORATIONS (after):**
```js
{ char: '◆', size: 'text-2xl', color: '#FF3AF2', ... }
{ char: '○', size: 'text-3xl', color: '#00F5D4', ... }
{ char: '+', size: 'text-3xl', color: '#FFE600', ... }
{ char: '◇', size: 'text-2xl', color: '#7B2FFF', ... }
{ char: '△', size: 'text-xl',  color: '#FF3AF2', ... }
{ char: '×', size: 'text-2xl', color: '#FF6B35', ... }
```

**Background layers (before):** dots + stripes + mesh
**Background layers (after):** dots + mesh

### Render Style (decorations)
```jsx
style={{ top: d.top, left: d.left, animationDelay: d.delay, color: d.color, opacity: 0.45 }}
```

## Business Rules
- Decorations are purely decorative (`aria-hidden="true"`, `pointer-events-none`)
- DECORATIONS array in BubbleUniverse.jsx is the single source of truth — AuthScreen imports it
- Sizes intentionally smaller than original emoji (text-2xl vs text-4xl/5xl) — shapes should be background ambient, not competing with room bubbles

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-18 | [STYLE] Replace emoji with geometric shapes, remove stripe pattern | User feedback: emoji looked cheap; wanted polished but still playful |

## Commit
`09908ad` — style(client): replace emoji decorations with geometric shapes, remove stripe pattern
