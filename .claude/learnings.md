# Learnings — Chat App

## [2026-02-18] - Bootstrap

- Server is fully implemented and functional. Client is the only remaining work.
- `node --watch` is used for server dev — no nodemon dependency needed.
- All socket handler files receive `(io, socket)` — `io` for broadcasting to all, `socket` for the current connection.
- DM routing uses `socket.to(recipientSocketId).emit(...)` since DMs don't use Socket.IO rooms.
- Typing indicators only exist for rooms, not DMs.
- `server/store/index.js` is the single source of truth — import from here, never duplicate state.
- Message trimming (keeping last 100) happens inside the store on every `addMessage` call.

## [2026-02-18] - Quick-win features batch (search, reply, online panel, room desc)

- **Message search is purely client-side** — no new socket events; just filter `roomMessages[roomId]` on `searchQuery` before passing to `MessageList`. Works identically for DMs.
- **Text highlighting** requires splitting on a regex with a capture group so React can wrap matches in `<mark>` elements. Pattern: `text.split(new RegExp('(query)', 'gi'))`.
- **Reply/quote is a two-layer concern** — the quoted block is stored as `replyTo: { id, text, senderName }` on the message; the server sanitizes it server-side (cap text, cast to string) before persisting. Client only holds `replyingTo` in local state, not global context.
- **DB migrations follow the existing try/catch ALTER TABLE pattern** — add new nullable columns that way; never change the `CREATE TABLE` definition (breaks existing DBs).
- **`replyTo` must be serialized as plain fields** in the DB (reply_to_id, reply_to_text, reply_to_sender) — SQLite can't store objects; reconstruct the object in `dbRowToMessage`.
- **Online users panel in BubbleUniverse** reuses `onlineUsers` from context directly — no new socket events needed.
- **Room description** flows through the full stack: client form → `room:create` payload → roomHandlers → `createRoom(name, desc)` → `serializeRoom` includes it → `room:created` broadcast → RoomBubble renders it.
- **Escape key to cancel reply** is a good UX pattern — handled in MessageInput's `onKeyDown`.
- **`Esc` to cancel reply info hint** shown conditionally in the footer hint line — only when `replyingTo` is active.

## [2026-02-19] - BubbleUniverse enhancements (heat, lurkers, tooltip, seen receipts)

- **Ephemeral activity state belongs in the store as module-level Maps**, not in the `state` object — `roomSpeakers` and `messageSeen` are declared outside `state` so they aren't serialized or hydrated.
- **`serializeRoom` is the single chokepoint** for all room data sent to clients — adding new computed fields there (lurkerCount, lastMessageAt, lastMessage) automatically updates all room list events.
- **`io.emit('room:updated', ...)` broadcasts to ALL connected sockets** — the right pattern when BubbleUniverse users (not in any room's Socket.IO channel) need to see live room stats.
- **`stateRef` pattern in useSocket**: pass a `ref` (not the state value) from ChatProvider into useSocket so socket event closures always read the current `activeRoomId` without stale closure bugs.
- **Heat tier is computed on render** from `lastMessageAt` timestamp — no server-side timer needed. A 30 s `setInterval` forces re-render so bubbles cool down gradually even without new messages.
- **Lurker count = members who haven't spoken in 5+ min OR never spoke** — computed in `serializeRoom` by checking `roomSpeakers` against `room.members`. Automatically correct after join/leave since both emit `room:updated`.
- **Seen receipts are ephemeral only** — tracked in `messageSeen` Map (server) and `message.seenBy` (client state). Not persisted to SQLite. Fits the app's "state lost on restart" model.
- **Emit `message:seen` from two places in useSocket**: on `room:joined` (last historical message) and on `message:received` when the room is active — covers both entering a room and receiving live messages.

## [2026-02-18] - Client UI (Step 4)

- Tailwind CSS v4 uses `@import "tailwindcss"` in CSS + `@tailwindcss/vite` plugin — no `tailwind.config.js` needed.
- Server auto-socket-joins the user to General but does NOT emit `room:joined` for it — client must explicitly emit `room:join` to receive message history. App.jsx does this on connect.
- Message objects on the wire use `senderId/senderName/senderColor`, not `userId/username/color`.
- DM `participants` are raw socket IDs (strings). Resolve to display names via `onlineUsers` map in context; fall back to a truncated ID if user is offline.
- Textarea auto-grow: set `height: auto` then `height: scrollHeight + 'px'` on each change, capped at 160 px.
- Typing stop is emitted after 2 s of no keystrokes AND on every send — prevents stuck indicators.
- `TypingIndicator` reserves 20 px height even when empty so the layout doesn't jump.
