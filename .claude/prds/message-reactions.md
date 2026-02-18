# PRD: Message Reactions

**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

Users can react to any message with one of 5 emojis (👍 ❤️ 🔥 😂 😮). Clicking an emoji toggles it on/off. Reactions are shown as pill buttons below the message text with a count. Highlighted if the current user has used that emoji. Works in both rooms and DMs.

## Requirements

### Original Requirements
- Click a message → emoji picker pops up → reactions shown inline
- Thumbs up, fire, and similar emojis

### Discovered Requirements
- Reactions are **ephemeral** (in-memory only, not persisted to SQLite) — adding a DB column or reactions table was out of scope
- DM reactions broadcast to both participants using `io.to(participantA).to(participantB)` — the `dmId` encodes both socket IDs as `socketIdA--socketIdB` so no extra store lookup is needed
- The emoji picker needed to be always-visible on hover via CSS (`group-hover`) rather than a separate `useState` to avoid layout jitter

## Architecture

### Design Decisions

**Toggle model:** One `reaction:toggle` event handles both add and remove. Server checks if `userId` is already in the emoji's Set, removes if present, adds if not. Empty Sets are deleted. This keeps the client simple — just emit on every click.

**Server data structure:** `reactions` on each message is `{ [emoji]: Set<userId> }`. Sets deduplicate naturally and membership checks are O(1). Serialized to `{ [emoji]: userId[] }` for transport.

**In-memory only:** Reactions live on the message object in RAM. Messages are loaded from SQLite on hydration without reactions (all start empty). This is acceptable — reactions are social signals, not critical data.

**DM broadcast:** `dmId = [socketIdA, socketIdB].sort().join('--')`. Split on `--` to recover both socket IDs. Use `io.to(a).to(b).emit(...)` — zero extra store lookups.

### Architecture Diagram

```
Client                          Server
------                          ------
click emoji
→ socket.emit('reaction:toggle', { messageId, roomId/dmId, emoji })
                                → toggleReaction / toggleDmReaction
                                → serialize reactions Set → plain arrays
                                → io.to(room).emit / io.to(a).to(b).emit
← dispatch REACTION_UPDATE
  → reducer updates message.reactions in roomMessages or dms
Message re-renders with new pills
```

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| `server/store/index.js` | Server store | `server/store/index.js` | `toggleReaction`, `toggleDmReaction`, `serializeReactions`; `reactions: {}` field on every new message |
| `messageHandlers.js` | Server handler | `server/socket/messageHandlers.js` | `reaction:toggle` event handler; broadcasts `reaction:update` |
| `useSocket.js` | Hook | `client/src/hooks/useSocket.js` | Listens for `reaction:update`, dispatches `REACTION_UPDATE` |
| `ChatContext.jsx` | Context | `client/src/context/ChatContext.jsx` | `REACTION_UPDATE` reducer case — patches `reactions` on the matching message |
| `Message.jsx` | Component | `client/src/components/Message.jsx` | Hover emoji picker (5 buttons, CSS group-hover); reaction pills with count + mine-highlight |

## Business Rules

- 5 emojis: 👍 ❤️ 🔥 😂 😮
- Toggle: clicking your own reaction removes it
- Reactions are per-message, not per-user globally
- Reactions are NOT persisted — cleared on server restart
- Max 1 of each emoji per user per message (Set deduplication)
- Own reactions are highlighted with the sender's accent colour

## Changelog

### [FEAT] Initial implementation — 2026-02-18
- Server: `toggleReaction`, `toggleDmReaction`, `serializeReactions` added to store
- Server: `reactions: {}` field on all new room and DM messages; `reactions: {}` on hydrated DB rows
- Server: `reaction:toggle` handler in `messageHandlers.js`
- Client: `reaction:update` listener in `useSocket.js`
- Client: `REACTION_UPDATE` reducer case in `ChatContext.jsx`
- Client: `Message.jsx` rewritten with emoji picker + reaction pills
- Commit: (see git log)
