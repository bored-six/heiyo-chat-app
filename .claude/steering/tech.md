# Tech — Chat App

## Environment

| Detail | Value |
|--------|-------|
| Runtime | Node.js with ESM (`"type": "module"` in all package.json files) |
| Server port | 3001 |
| Client port | 5173 (Vite default — not yet created) |
| Module system | ES Modules (`import`/`export`) — never use `require()` |

## Dependencies

### Server (`server/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.x | HTTP server |
| socket.io | ^4.7.x | WebSocket server |
| cors | ^2.8.x | CORS middleware |
| uuid | ^9.x | Unique IDs for rooms, messages, DMs |

### Root (`package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| concurrently | ^8.2.2 | Run server + client in parallel |

### Client (not yet created)
- Vite is implied by CORS origin `http://localhost:5173`
- Framework not yet chosen

## Key Technical Constraints

- **ESM only.** Every file uses `import`/`export`. Never use CommonJS.
- **No database.** All state is in-memory in `server/store/index.js`.
- **No auth.** Identity assigned on socket connect, keyed by `socket.id`.
- **Socket ID = user key.** Users are identified by their socket ID in the store. Disconnecting removes the user.
- **CORS.** Server allows only `http://localhost:5173`. Update if client port changes.

## Dev Commands

```bash
# From root — run both server and client
npm run dev

# Server only (uses node --watch, no nodemon needed)
npm run server

# Client only (once created)
npm run client
```

## File Paths

| Path | Role |
|------|------|
| `server/index.js` | Entry point — Express + Socket.IO setup |
| `server/socket/index.js` | Socket connection lifecycle |
| `server/socket/roomHandlers.js` | Room event handlers |
| `server/socket/messageHandlers.js` | Message event handlers |
| `server/socket/dmHandlers.js` | DM event handlers |
| `server/store/index.js` | All in-memory state + CRUD helpers |
| `server/utils/nameGenerator.js` | Username + color generator |
