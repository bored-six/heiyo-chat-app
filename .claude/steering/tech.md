# Tech — Chat App

## Environment

| Detail | Value |
|--------|-------|
| Runtime | Node.js with ESM (`"type": "module"` in all package.json files) |
| Server port | 3001 |
| Client port | 5173 (Vite default) |
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

### Client (`client/package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM renderer |
| socket.io-client | ^4.7.4 | WebSocket client |
| vite | ^6.0.0 | Dev server + bundler |
| @vitejs/plugin-react | ^4.3.4 | React fast refresh |
| tailwindcss | ^4.1.x | Styling (v4, CSS-first) |
| @tailwindcss/vite | ^4.1.x | Tailwind v4 Vite plugin |

## Key Technical Constraints

- **ESM only.** Every file uses `import`/`export`. Never use CommonJS.
- **SQLite persistence** via `better-sqlite3` at `server/db/index.js` (chat.db in `server/data/`). Registered users, rooms, messages, DMs, invite codes, and profile fields are all persisted.
- **Auth system** — register/login via REST (`/auth/register`, `/auth/login`, `/auth/guest`). Session stored in `localStorage` key `heiyo_session`. Socket handshake includes `{ username, color, avatar, tag }`.
- **Socket ID = session key.** Users are keyed by `socket.id` in-memory. Disconnecting removes the user. Registered users reconnect by logging in again.
- **Profile fields** (`bio`, `statusEmoji`, `statusText`, `pronouns`) stored in the `users` SQLite table, loaded from DB on socket connect, broadcast via `user:updated`.
- **CORS.** Server allows only `http://localhost:*`. Update if client port changes.

## Dev Commands

```bash
# From root — run both server and client
npm run dev

# Server only (uses node --watch, no nodemon needed)
npm run server

# Client only
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
| `client/src/App.jsx` | Two-column layout shell, auto-joins General |
| `client/src/context/ChatContext.jsx` | All client state (useReducer) + ChatProvider |
| `client/src/hooks/useSocket.js` | Socket lifecycle + event→dispatch wiring |
| `client/src/components/Sidebar.jsx` | Room list, DM list, user badge |
| `client/src/components/ChatArea.jsx` | Header + message area + input |
| `client/src/components/MessageList.jsx` | Scrollable list with auto-scroll |
| `client/src/components/Message.jsx` | Avatar + name + text + timestamp |
| `client/src/components/MessageInput.jsx` | Textarea, send on Enter, typing events |
| `client/src/components/TypingIndicator.jsx` | "X is typing…" with bouncing dots |
| `client/src/components/ConstellationView.jsx` | Spatial 2D message layout (SVG lines + node clusters) |
