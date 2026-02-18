# PRD: Persistent Session (Remember Me)

**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

Returning users skip the auth screen automatically. Identity (`username`, `color`, `avatar`, `tag`) is saved to `localStorage` under the key `heiyo_session` when a user logs in, and cleared on sign-out. On next load, `ChatContext` reads the saved identity before the first render, so `authUser` is already populated and `AuthScreen` is never shown.

## Requirements

### Original Requirements
- Store `{ username, color, avatar, tag }` in localStorage so returning users skip the auth screen
- Provide a way to sign out (clear the session)

### Discovered Requirements
- `setAuthUser` needed to support function-updater form (`(prev) => next`) so `UserBadge` could do partial updates for avatar changes without breaking the persistence logic
- `authUser` needed to be exposed from context (previously not in the context value) so `App.jsx` could use it as the auth gate

## Architecture

### Design Decisions

**Where persistence lives:** Moved entirely into `ChatContext`. `authUser` is `useState`-initialised from localStorage so there is zero flash of the auth screen — the state is correct before the first render.

**Why not `App.jsx`:** `App.jsx` previously held an `authed` boolean state separate from `authUser`. Two sources of truth are a bug waiting to happen. Collapsed both into a single `authUser` check in context.

**`setAuthUser` updater form:** Because `UserBadge` calls `setAuthUser((prev) => ({ ...prev, avatar: newAvatar }))`, `setAuthUser` must support both direct values and updater functions, exactly like React's `setState`.

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| `ChatContext` | Context | `client/src/context/ChatContext.jsx` | Initialises `authUser` from localStorage; `setAuthUser` persists/clears on every call; exposes `authUser` in value |
| `App` | Component | `client/src/App.jsx` | Removed `authed` state; uses `authUser` from context as auth gate; passes `setAuthUser` directly to `AuthScreen` |
| `UserBadge` | Component | `client/src/components/UserBadge.jsx` | Added `handleSignOut` that calls `setAuthUser(null)` to clear session and return to auth screen |

## Business Rules

- Session is stored under localStorage key `heiyo_session` as JSON
- Session contains `{ username, color, avatar, tag }`
- On sign-out, localStorage is cleared and `authUser` is set to `null` — the socket hook detects this and disconnects
- If `JSON.parse` fails on the stored value, it is silently removed and the user sees the auth screen

## Changelog

### [FEAT] Initial implementation — 2026-02-18
- `ChatContext`: lazy-init `authUser` from localStorage, `setAuthUser` persists/clears
- `App`: removed `authed` bool state, uses `authUser` as single gate
- `UserBadge`: added sign-out button + `handleSignOut`
- Commit: (see git log)
