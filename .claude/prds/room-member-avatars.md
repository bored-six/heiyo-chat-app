# PRD: Room Member Avatars in Portal Header

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

The `RoomPortal` header now shows a row of up to 5 mini chibi avatar circles (24×24px)
directly beneath the room name, each bordered in the member's personal color. When more than
5 members are present a `+N` overflow label is appended. DM portals are unaffected.

## Requirements

### Original Requirements
- Row of mini colored avatar circles in the RoomPortal header
- Shows who is currently inside the room

### Discovered Requirements
- `roomMembers` was already populated in context state from `ROOM_JOINED` / `ROOM_MEMBERS` actions — no server changes needed
- Member objects carry `{ id, username, color, avatar }` — same shape as `onlineUsers`
- `avatar` field may be undefined for guest users; fall back to `username` as DiceBear seed
- DM portals receive no `members` prop (defaults to `[]`) so the avatar row is silently omitted

## Architecture

### Design Decisions
- `Portal` receives an optional `members` prop (default `[]`); DM call sites simply omit it
- Cap at `MEMBER_MAX = 5` visible + `+N` label to avoid header overflow on large rooms
- Reuses existing `avatarUrl()` util — zero new dependencies

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| RoomPortal | React component | `client/src/components/RoomPortal.jsx` | Passes members to Portal; avatar row | Complete |

### Key Changes
- Added `roomMembers` to `useChat()` destructure
- Added `avatarUrl` import from `../utils/avatar.js`
- Portal `title` side wrapped in `flex-col` div to stack room name above avatar row
- Exit button gets `ml-4 flex-shrink-0` to prevent crowding when avatar row is wide

## Changelog

### [FEAT] Room member avatar row in portal header — 2026-02-18
- Added `roomMembers` destructure + `avatarUrl` import to RoomPortal
- Portal shell now accepts `members` prop; renders mini avatar row under room name
- Overflow capped at 5 + "+N" label
- Files affected: `client/src/components/RoomPortal.jsx`
