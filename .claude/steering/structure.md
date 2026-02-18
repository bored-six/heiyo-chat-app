# Structure — Chat App

## Server Code Patterns

### Socket Handler Registration Pattern

Each feature area (rooms, messages, DMs) is a separate module that exports a `register*Handlers` function. These are called once per socket connection in `socket/index.js`.

```js
// socket/index.js
import { registerRoomHandlers } from './roomHandlers.js';
import { registerMessageHandlers } from './messageHandlers.js';
import { registerDmHandlers } from './dmHandlers.js';

io.on('connection', (socket) => {
  // ... setup ...
  registerRoomHandlers(io, socket);
  registerMessageHandlers(io, socket);
  registerDmHandlers(io, socket);
});
```

Each handler file follows this shape:
```js
export function registerXHandlers(io, socket) {
  socket.on('event:name', (payload) => {
    // handler logic
  });
}
```

### Centralized Store Pattern

All state lives in `server/store/index.js`. Never store state in handler files or socket closures. The store exports CRUD helper functions.

```js
// store/index.js
const state = {
  users: {},   // keyed by socket.id
  rooms: {},   // keyed by room UUID
  dms: {},     // keyed by deterministic DM ID
};

export function addUser(socketId, userData) { ... }
export function removeUser(socketId) { ... }
export function getRoom(roomId) { ... }
// etc.
```

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Socket events | `noun:verb` | `room:join`, `message:send` |
| Handler files | `{feature}Handlers.js` | `roomHandlers.js` |
| Store functions | camelCase verbs | `addUser`, `getRoom`, `removeUser` |
| IDs | UUID v4 via `uuid` package | `v4()` |
| DM thread ID | sorted user IDs joined with `--` | `abc--xyz` |

### Message Object Shape

```js
{
  id: uuid,
  userId: socket.id,
  username: 'SwiftOtter',
  color: '#e74c3c',
  text: 'Hello',
  timestamp: Date.now()
}
```

### User Object Shape

```js
{
  id: socket.id,
  username: 'SwiftOtter',
  color: '#e74c3c'
}
```

### Room Object Shape

```js
{
  id: uuid,
  name: 'General',
  members: [socket.id, ...],
  messages: [/* message objects, max 100 */]
}
```

## Adding New Features

1. **New socket event** → Add handler in the relevant `socket/*.js` file (or create a new handler file and register it in `socket/index.js`)
2. **New state** → Add to `store/index.js` state object + CRUD helpers
3. **New utility** → Add to `utils/`
4. **Never** put business logic directly in `socket/index.js` — keep it in handler files

## Client Conventions

### Component Structure

```
client/src/
├── components/
│   ├── Sidebar.jsx          ← room list, DM list, user badge
│   ├── ChatArea.jsx         ← header + MessageList + TypingIndicator + MessageInput
│   ├── MessageList.jsx      ← scrollable, auto-scrolls on new message
│   ├── Message.jsx          ← avatar + name + text + timestamp
│   ├── MessageInput.jsx     ← auto-grow textarea, Enter to send, typing events
│   └── TypingIndicator.jsx  ← "Alice is typing…" with bouncing dots
├── context/
│   └── ChatContext.jsx      ← useReducer state + ChatProvider + useChat hook
├── hooks/
│   └── useSocket.js         ← creates socket, wires all server→client events
├── index.css                ← @import "tailwindcss" (Tailwind v4)
├── App.jsx                  ← two-column layout, auto-joins General on connect
└── main.jsx                 ← wraps app in <ChatProvider>
```

### State Management

- `useReducer` in `ChatContext.jsx` — all app state in one place
- `socket` ref is passed down through context (stable across renders)
- Dispatch actions: `SET_ACTIVE_ROOM`, `SET_ACTIVE_DM` for navigation

### Styling

- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no config file needed)
- Dark color palette: sidebar `#2b2d31`, main `#313338`, input `#383a40`
- User/sender colors come from the server — applied as inline `style` on avatars

### Key Patterns

- **Auto-join General:** `App.jsx` emits `room:join` + dispatches `SET_ACTIVE_ROOM` when `connected` becomes true
- **Typing debounce:** `MessageInput` emits `typing:stop` 2 s after last keystroke; also on send
- **Auto-scroll:** `MessageList` calls `scrollIntoView` on a bottom anchor whenever `messages.length` changes
- **Textarea auto-grow:** Height set from `scrollHeight` on each change, capped at 160 px
- **DM other-party lookup:** `participants` are socket IDs; resolved via `onlineUsers` map from context
