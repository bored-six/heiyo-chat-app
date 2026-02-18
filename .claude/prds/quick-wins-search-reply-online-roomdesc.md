# PRD: Quick-Win Features — Search, Reply, Online Panel, Room Description

**Ticket:** None (ad-hoc batch, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

Four small independently useful features shipped as a batch. All client-side except reply/quote (which requires server + DB changes) and room description (server + DB).

## Requirements

### Original Requirements
1. **Message search** — Search bar filtering messages in the current room/DM. Client-side only.
2. **Reply / quote a message** — Click reply on a message → quoted block appears above input. Adds `replyTo: { id, text, senderName }` to the message payload. Server stores it.
3. **Online users sidebar section** — Show who's online globally. `onlineUsers` was already in state but not surfaced outside the user badge popup.
4. **Room creation with description** — Optional subtitle field when creating a room. Shown under room name in BubbleUniverse bubbles.

### Discovered Requirements
- `replyTo` must be sanitized server-side (cast to string, cap length) to prevent injection via crafted payloads.
- DB migration needed for reply fields (`reply_to_id`, `reply_to_text`, `reply_to_sender`) on both `messages` and `dm_messages` tables, and `description` on `rooms` table.
- Search state lives in `RoomPortal` (not global context) — it's UI-local and per-session.
- `replyingTo` state also lives in `RoomPortal` local state, not global context.

## Architecture

### Design Decisions

**Search is client-side only:** Messages are already in state (100 max). No server involvement needed. Filter in `RoomPortal` before passing to `MessageList`.

**`replyTo` stored on message, not as a separate relation:** The quoted content is denormalized (text + sender name copied at reply time). This avoids joins and keeps message objects self-contained. Matches Discord/Slack pattern.

**Online users panel in BubbleUniverse (not RoomPortal):** The BubbleUniverse is the "lobby" — the natural place to see who's around before entering a room. The existing popup from UserBadge still works for DM initiation.

**Room description capped at 120 chars server-side:** Short enough to fit in a bubble without overflowing the circular layout.

## Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| RoomPortal | React | `client/src/components/RoomPortal.jsx` | Added `searchQuery`, `searchOpen`, `replyingTo` state; search bar in Portal header; props wired to MessageList + MessageInput |
| Portal (inner) | React | `client/src/components/RoomPortal.jsx` | Added search toggle button + animated search input bar |
| MessageList | React | `client/src/components/MessageList.jsx` | Added `highlight` + `onReply` props, forwarded to Message |
| Message | React | `client/src/components/Message.jsx` | Added `highlight` prop → `<HighlightedText>` component; `onReply` prop → reply button in hover toolbar; renders `replyTo` quote block |
| MessageInput | React | `client/src/components/MessageInput.jsx` | Added `replyingTo` + `onCancelReply` props; shows reply preview banner; includes `replyTo` in emit payload; Esc cancels reply |
| BubbleUniverse | React | `client/src/components/BubbleUniverse.jsx` | Added online users panel (top-right); added description input to create-room form |
| RoomBubble | React | `client/src/components/RoomBubble.jsx` | Renders `room.description` subtitle if present |
| messageHandlers | Server | `server/socket/messageHandlers.js` | Extracts + sanitizes `replyTo` from `message:send` payload |
| dmHandlers | Server | `server/socket/dmHandlers.js` | Extracts + sanitizes `replyTo` from `dm:send` payload |
| roomHandlers | Server | `server/socket/roomHandlers.js` | Extracts `description` from `room:create`, capped at 120 chars |
| store/index.js | Server | `server/store/index.js` | `createRoom(name, desc)`, `addMessage` + `addDmMessage` accept `replyTo`; `serializeRoom` includes `description`; `dbRowToMessage` reads reply fields; hydration reads `description` |
| db/index.js | Server | `server/db/index.js` | Migrations for `rooms.description`, `messages.reply_to_*`, `dm_messages.reply_to_*`; updated INSERT statements |

## Business Rules

- Search is case-insensitive; matches substring anywhere in message text.
- Search filters the already-loaded message array — no server round-trip.
- Closing the search bar clears the query.
- Reply quotes are capped at 200 chars for display (enforced server-side on inbound); senderName capped at 50 chars.
- Room description is optional (empty string = no subtitle shown).
- Room description max 120 chars (server-side cap).
- `replyTo` is null for messages that are not replies.
- Online users panel shows self (labeled "you") + all others. Defaults to open; toggleable.

## Changelog

### [FEAT] Initial implementation — 2026-02-18
- Message search: `searchQuery` state in RoomPortal, text highlight in Message, works for rooms + DMs
- Reply/quote: hover toolbar button, quote preview in MessageInput, `replyTo` stored in DB + rendered
- Online panel: collapsible dot-list in BubbleUniverse top-right corner
- Room description: form field, DB column, rendered in RoomBubble
- Commit: be90dbe
