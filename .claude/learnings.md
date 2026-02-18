# Learnings — Chat App

## [2026-02-18] - Bootstrap

- Server is fully implemented and functional. Client is the only remaining work.
- `node --watch` is used for server dev — no nodemon dependency needed.
- All socket handler files receive `(io, socket)` — `io` for broadcasting to all, `socket` for the current connection.
- DM routing uses `socket.to(recipientSocketId).emit(...)` since DMs don't use Socket.IO rooms.
- Typing indicators only exist for rooms, not DMs.
- `server/store/index.js` is the single source of truth — import from here, never duplicate state.
- Message trimming (keeping last 100) happens inside the store on every `addMessage` call.
