# Learnings — Chat App

## [2026-02-18] - Bootstrap

- Server is fully implemented and functional. Client is the only remaining work.
- `node --watch` is used for server dev — no nodemon dependency needed.
- All socket handler files receive `(io, socket)` — `io` for broadcasting to all, `socket` for the current connection.
- DM routing uses `socket.to(recipientSocketId).emit(...)` since DMs don't use Socket.IO rooms.
- Typing indicators only exist for rooms, not DMs.
- `server/store/index.js` is the single source of truth — import from here, never duplicate state.
- Message trimming (keeping last 100) happens inside the store on every `addMessage` call.

## [2026-02-18] - Client UI (Step 4)

- Tailwind CSS v4 uses `@import "tailwindcss"` in CSS + `@tailwindcss/vite` plugin — no `tailwind.config.js` needed.
- Server auto-socket-joins the user to General but does NOT emit `room:joined` for it — client must explicitly emit `room:join` to receive message history. App.jsx does this on connect.
- Message objects on the wire use `senderId/senderName/senderColor`, not `userId/username/color`.
- DM `participants` are raw socket IDs (strings). Resolve to display names via `onlineUsers` map in context; fall back to a truncated ID if user is offline.
- Textarea auto-grow: set `height: auto` then `height: scrollHeight + 'px'` on each change, capped at 160 px.
- Typing stop is emitted after 2 s of no keystrokes AND on every send — prevents stuck indicators.
- `TypingIndicator` reserves 20 px height even when empty so the layout doesn't jump.
