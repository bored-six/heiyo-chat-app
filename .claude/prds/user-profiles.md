# PRD: User Profiles

**Status:** Complete
**Created:** 2026-02-19
**Last Updated:** 2026-02-19

## Summary

Users can edit a personal profile with a bio, pronouns, and a "vibe status" (emoji + short text).
Profile data is persisted to SQLite for registered users and broadcast in real time via `user:updated`.
A ProfileCard popup appears when clicking any avatar or username anywhere in the app.
A status emoji badge floats on avatars wherever they appear (messages, online panel, profile card).

## Requirements

### Original Requirements
- Profile editing: bio/description and pronouns
- Something new and unique compared to Discord

### Discovered Requirements
- Status emoji badge needed to float on avatar (not just in profile card) to be visible everywhere
- Guests can set a vibe status in-session but it is not persisted (no DB row)
- `USER_UPDATED` dispatch already existed in reducer and correctly spreads all fields — no reducer change needed
- `setAuthUser` needed to be threaded through `useSocket` (new param) to sync localStorage on profile changes from other tabs

## Architecture

### Design Decisions
- Profile fields loaded from DB at socket connect time (not passed in handshake) — keeps handshake lean and authoritative
- `profile:update` handler is inline in `socket/index.js` (same pattern as `avatar:change`) rather than a separate handler file — small enough to stay co-located
- ProfileCard is a fixed centered overlay (not positioned near cursor) — simpler, avoids viewport clamping complexity, matches existing modal pattern
- Status emoji badge is 4 lines of inline JSX — not extracted to a component (single use in three places, not worth an abstraction)
- `onlineUsers[senderId]` is preferred over message snapshot for live profile data in Message.jsx

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| ProfileEditModal | Client component | `client/src/components/ProfileEditModal.jsx` | Edit own profile (bio, pronouns, vibe status) |
| ProfileCard | Client component | `client/src/components/ProfileCard.jsx` | Read-only profile popup for any user |
| UserBadge | Modified | `client/src/components/UserBadge.jsx` | "Edit Profile" button (replaces disabled Settings) |
| Message | Modified | `client/src/components/Message.jsx` | Clickable avatar+name → ProfileCard; status emoji badge |
| OnlineUsersPanel | Modified | `client/src/components/OnlineUsersPanel.jsx` | Clickable users → ProfileCard; status emoji badges |
| useSocket | Modified | `client/src/hooks/useSocket.js` | Accept `setAuthUser`, sync localStorage on `user:updated` |
| ChatContext | Modified | `client/src/context/ChatContext.jsx` | Pass `setAuthUser` into `useSocket` |
| server/db/index.js | Modified | `server/db/index.js` | Migrations + `dbUpdateUserProfile()` |
| server/store/index.js | Modified | `server/store/index.js` | `addUser()` extended; `updateUserProfile()` added |
| server/socket/index.js | Modified | `server/socket/index.js` | Load profile from DB on connect; `profile:update` handler |
| server/index.js | Modified | `server/index.js` | Login/register responses include profile fields |

## Business Rules

- Bio: max 160 characters (enforced server-side, also enforced client-side)
- Status emoji: max 2 characters (single emoji)
- Status text: max 60 characters
- Pronouns: max 20 characters
- All fields default to empty string — never null
- Guests can set profile fields in-session; not persisted to DB
- Profile fields are included in every `user:updated` broadcast — all online clients stay in sync

## Changelog

### [FEAT] Initial implementation — 2026-02-19
- SQLite migration adds bio, status_emoji, status_text, pronouns to users table
- Server loads profile from DB on socket connect and includes fields in user object
- New `profile:update` socket event + `dbUpdateUserProfile()` DB function
- New `ProfileEditModal` and `ProfileCard` client components
- Status emoji badge on avatar in messages and online panel
- Clickable avatars/usernames open ProfileCard anywhere in the app
- Commit: e4ee940
