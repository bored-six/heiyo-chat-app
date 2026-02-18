# PRD: Constellation View

**Status:** Complete
**Created:** 2026-02-19
**Last Updated:** 2026-02-19

## Summary

Alternate message layout that renders a room's (or DM's) messages as a spatial "constellation" — nodes plotted on a 2D field, clustered around their sender's anchor point, with SVG lines connecting reply chains. Toggled per-conversation via a ✦ button in the portal header.

## Requirements

### Original Requirements
- Toggle message list into a spatial 2D layout
- Each user has a fixed anchor point on the canvas
- Messages are nodes clustered around their sender's anchor
- Replies draw visible lines between nodes
- Completely different from standard chat UX

### Discovered Requirements
- View resets to list mode when switching rooms/DMs
- Constellation uses the full unfiltered message set (search filter only applies in list mode)
- Tooltip shows above/below node based on vertical position to avoid clipping
- Empty state matches existing app visual language (floating ✦, uppercase tracking text)

## Architecture

### Design Decisions

**SVG overlay + absolutely-positioned divs** — SVG handles all lines (grid, radial threads, reply edges); DOM divs handle interactive message nodes and user anchors. This avoids canvas API complexity while keeping lines crisp at all resolutions.

**ResizeObserver for canvas dimensions** — Canvas is sized to the measured container so the layout fills available space without a fixed pixel assumption.

**Concentric ring clustering** — Messages per sender are packed into rings of increasing radius (ring 0 = 6 nodes at r=60, ring 1 = 12 nodes at r=104, etc.). Each sender gets a deterministic start angle so rings don't align across users.

**8 pre-defined anchor slots** — Positioned as fractional coordinates to avoid edge clipping. Up to 8 unique senders get distinct positions; beyond 8 wraps via modulo.

**`hashStr()` for determinism** — All "random" offsets (star positions, sender start angles) derive from a djb2-style hash of stable identifiers so the layout is reproducible across re-renders.

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| ConstellationView | React component | `client/src/components/ConstellationView.jsx` | Full constellation canvas |
| RoomPortal | React component (modified) | `client/src/components/RoomPortal.jsx` | Added `viewMode` state + toggle + conditional render |

## Business Rules

- Constellation view is purely client-side — no new socket events
- The constellation always shows the **full** message history (not the search-filtered subset), because node position is meaningless without all messages visible
- View mode resets to `list` when switching to a different room or DM
- Works for both rooms and DMs
- Reply lines only draw when both the reply message **and** the original message are present in the current message set (max 100)

## Visual Structure

```
Canvas (sized to portal chat area)
├── SVG layer (pointer-events: none)
│   ├── Ambient starfield (45 deterministic dots)
│   ├── Inter-anchor grid lines (white, 2.5% opacity)
│   ├── Radial threads: anchor → each owned node (sender color, 7% opacity)
│   └── Reply edges: dashed lines between reply pairs (sender color, 60% opacity)
├── Sender anchor nodes (44px avatar + glowing border + username label)
└── Message nodes (10px dot, expands to 16px on hover)
    ├── Dashed spin ring on reply nodes
    └── Hover card: sender, timestamp, reply context, text, reactions, seen count
```

## Changelog

### [FEAT] Initial implementation — 2026-02-19
- Created `ConstellationView.jsx` with full spatial layout
- Updated `RoomPortal.jsx`: added `viewMode` state, reset effect, toggle function, ✦ button in Portal header, conditional render
- Files: `ConstellationView.jsx` (new), `RoomPortal.jsx` (modified)
