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

## Client Conventions (to be established)

Client not yet built. When created, update this file with:
- Component structure
- State management approach
- Socket.IO client usage pattern
- File/folder conventions
