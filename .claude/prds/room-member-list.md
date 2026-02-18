# PRD: Room Member List

**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

A slide-down panel in the `RoomPortal` header reveals all current members of the active room. Clicking the member avatar row (which previously did nothing) toggles the panel open and closed. Each member entry shows their avatar, coloured username, and discriminator tag.

## Requirements

### Original Requirements
- Slide-out panel showing who's currently in the active room
- Data already available via `room:members` event and `roomMembers` state

### Discovered Requirements
- The existing member avatar row in the header was already rendered but not interactive — repurposing it as a toggle button required zero new UI real estate
- Panel lives inside the portal card (not a separate overlay) so it scrolls naturally with the card's flex layout

## Architecture

### Design Decisions

**Toggle on avatar row click:** The mini avatar row in the header already communicated "N members here". Wrapping it in a `<button>` with a `▾/▴` indicator adds discoverability without adding a new button to the header.

**Inline expand, not a drawer:** An expanding section inside the portal (between header and chat) keeps focus inside the card and avoids z-index/overlay complexity. The member list uses `flex-wrap` so it gracefully handles any number of members.

**State local to `Portal`:** `showMembers` is `useState` inside the `Portal` inner component. It resets when navigating between rooms (Portal remounts), which is the correct behaviour — no stale open-state from a previous room.

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| `RoomPortal.jsx` | Component | `client/src/components/RoomPortal.jsx` | `useState` for `showMembers`; avatar row wrapped in `<button>` to toggle; collapsible member panel between header and chat area |

## Business Rules

- Panel only appears for rooms (not DMs — DMs have no member list concept)
- Shows every current member: avatar, username (coloured), discriminator tag
- Count and `▾/▴` indicator on the toggle button show current state
- Panel uses `animate-appear` so it snaps in without layout jank
- Data comes from `roomMembers[activeRoomId]` already maintained by `room:members` socket events

## Changelog

### [FEAT] Initial implementation — 2026-02-18
- `RoomPortal`: imported `useState`, added `showMembers` toggle, wrapped avatar row in button, added collapsible member panel
- Commit: (see git log)
