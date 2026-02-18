# CLAUDE.md — Chat App

## Project Overview

Real-time multi-user chat application. Users connect anonymously, receive a generated identity, and can chat in shared rooms or via direct messages. No authentication, no database — ephemeral in-memory state only.

**Status:** Server complete. Client not yet built.

---

## Architecture

```
Chat app/                         ← monorepo root
├── package.json                  ← concurrently dev runner
├── server/                       ← Node.js + Socket.IO backend (COMPLETE)
│   ├── index.js                  ← Express + Socket.IO entry point (port 3001)
│   ├── socket/
│   │   ├── index.js              ← connection lifecycle, typing, disconnect
│   │   ├── roomHandlers.js       ← room events
│   │   ├── messageHandlers.js    ← message events
│   │   └── dmHandlers.js         ← DM events
│   ├── store/
│   │   └── index.js              ← in-memory state (users, rooms, DMs)
│   └── utils/
│       └── nameGenerator.js      ← random username + color
└── client/                       ← Vite frontend (NOT YET CREATED)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM — `"type": "module"`) |
| Server framework | Express 4 |
| Real-time | Socket.IO 4 |
| Client (planned) | Vite + [TBD framework] |
| Database | None — in-memory only |
| Dev runner | `concurrently` (root), `node --watch` (server) |

---

## Socket.IO Event Contract

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `{ roomId }` | Join a room |
| `room:leave` | `{ roomId }` | Leave a room |
| `room:create` | `{ name }` | Create new room |
| `room:list` | — | Request room list |
| `message:send` | `{ roomId, text }` | Send room message (max 2000 chars) |
| `dm:open` | `{ toUserId }` | Open DM thread |
| `dm:send` | `{ toUserId, text }` | Send DM |
| `typing:start` | `{ roomId }` | Typing indicator on |
| `typing:stop` | `{ roomId }` | Typing indicator off |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ user, rooms }` | Initial state on connect |
| `user:online` | `{ user }` | User connected broadcast |
| `user:offline` | `{ userId }` | User disconnected broadcast |
| `room:joined` | `{ room, messages, members }` | Sent to joining user |
| `room:members` | `{ roomId, members }` | Member list update |
| `room:created` | `{ room }` | New room broadcast |
| `room:list` | `{ rooms }` | Room list response |
| `room:left` | `{ roomId }` | Leave confirmation |
| `message:received` | `{ roomId, message }` | Room message broadcast |
| `dm:opened` | `{ dm }` | DM thread opened |
| `dm:received` | `{ dmId, participants, message }` | DM to both parties |
| `typing:update` | `{ roomId, typers }` | Typing socket IDs |

---

## Key Business Rules

- Users are anonymous — no login, auto-assigned `AdjectiveAnimal` username + color
- Default room "General" always exists (seeded on startup)
- Messages capped at 100 per channel (room or DM)
- Messages max 2000 characters
- DM thread ID is deterministic: `[userIdA, userIdB].sort().join('--')`
- State is ephemeral — all data lost on server restart

---

## Development

```bash
# Run both server and client (from root)
npm run dev

# Server only
npm run server

# Client only
npm run client
```

Server: `http://localhost:3001`
Client: `http://localhost:5173` (Vite default)

---

## Documentation

- `.claude/steering/product.md` — Business rules and feature context
- `.claude/steering/tech.md` — Tech details and constraints
- `.claude/steering/structure.md` — Code patterns and conventions
- `.claude/learnings.md` — Discovered patterns and insights
- `.claude/prds/` — Feature PRDs (one per feature)

---

## MANDATORY: Doc Updates After Every Task

After completing any task in this project, you MUST update all of the following docs to reflect what changed:

| Doc | Update when... |
|-----|---------------|
| `CLAUDE.md` | Architecture changes, new tech, new event contracts, new business rules |
| `.claude/steering/product.md` | New features, changed business rules, new non-goals |
| `.claude/steering/tech.md` | New dependencies, new files, changed ports/config, new constraints |
| `.claude/steering/structure.md` | New patterns, new conventions, new object shapes, client structure established |
| `.claude/learnings.md` | Any insight discovered during implementation — always append here |

**This is not optional.** Docs must stay in sync with the code at all times.

### What to capture in learnings.md

- New patterns discovered (e.g. "client uses X pattern for socket reconnection")
- Anti-patterns to avoid (e.g. "don't mutate store directly outside store functions")
- Framework/library quirks encountered
- Business rule clarifications
- Architecture decisions and why they were made

### After every task, explicitly tell the user

List which docs were updated and what changed. Example:
```
## Doc Updates
- CLAUDE.md: Updated architecture map (added client/ structure)
- steering/tech.md: Added React + Zustand to client dependencies
- steering/structure.md: Added client component conventions
- learnings.md: Socket reconnection uses exponential backoff
```
