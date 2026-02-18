# PRD: Unread Badge Counts

**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

Unread message counts appear as number bubbles wherever navigation to a conversation exists. Room unread counts were already implemented (on `RoomBubble`). This feature adds **DM unread counts** shown as yellow badges on the DM button in `OnlineUsersPanel`.

## Requirements

### Original Requirements
- Show a number bubble on rooms/DMs when new messages arrive while in a different room

### Discovered Requirements
- Room unread tracking already existed in the reducer (`MESSAGE_RECEIVED` → `unread[roomId]++`, `SET_ACTIVE_ROOM` → `unread[roomId] = 0`)
- Only DM unread tracking was missing
- `dmId` is computable client-side from `[me.id, user.id].sort().join('--')` — no server lookup needed to find a user's DM unread count in the panel

## Architecture

### Design Decisions

**Symmetric with room unread:** Added `dmUnread: {}` to state, incremented in `DM_RECEIVED` when `activeDmId !== dmId`, cleared in `SET_ACTIVE_DM`. Mirrors the existing room pattern exactly.

**DM ID computed in panel:** `OnlineUsersPanel` computes `dmId` inline per user row using the same deterministic formula the server uses. No new socket event or store lookup needed.

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| `ChatContext.jsx` | Context | `client/src/context/ChatContext.jsx` | `dmUnread: {}` in initial state; `DM_RECEIVED` increments when DM not active; `SET_ACTIVE_DM` clears to 0; `dmUnread` exposed in context value |
| `OnlineUsersPanel.jsx` | Component | `client/src/components/OnlineUsersPanel.jsx` | Reads `dmUnread` from context; computes `dmId` per user row; renders yellow badge on DM button when `unread > 0` |

## Business Rules

- Count increments only when the DM is NOT the active conversation
- Count resets to 0 when the user opens the DM (`SET_ACTIVE_DM`)
- Badge shows raw number up to 99, then "99+"
- Badge is yellow (#FFE600) with dark text for contrast
- Room unread was already implemented — this PRD only covers DMs

## Changelog

### [FEAT] DM unread tracking — 2026-02-18
- `ChatContext`: added `dmUnread` state, updated `DM_RECEIVED` and `SET_ACTIVE_DM` cases
- `OnlineUsersPanel`: destructured `dmUnread`, compute `dmId` per row, render badge
- Commit: (see git log)
