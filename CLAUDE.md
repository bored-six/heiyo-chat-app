# CLAUDE.md — Chat App

## Project Overview

Real-time multi-user chat application. Users connect anonymously, receive a generated identity, and can chat in shared rooms or via direct messages. No authentication, no database — ephemeral in-memory state only.

**Status:** Server complete. Client scaffolded (Vite + React + socket.io-client installed; Zustand + Tailwind pending).

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
└── client/                       ← Vite + React frontend (scaffolded, in progress)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM — `"type": "module"`) |
| Server framework | Express 4 |
| Real-time | Socket.IO 4 |
| Client framework | Vite + React 18 |
| Client state | Zustand |
| Socket client | socket.io-client 4.x |
| Styling | Tailwind CSS |
| Database | None — in-memory only |
| Dev runner | `concurrently` (root), `node --watch` (server) |

---

## Client Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Bundler | Vite 6 | Already installed (`client/package.json`) |
| Framework | React 18 | Already installed |
| State | Zustand | Decided — not yet installed |
| Socket client | socket.io-client 4.7.4 | Already installed — matches server Socket.IO 4 |
| Styling | Tailwind CSS | Decided — not yet installed |

**Install remaining dependencies:**
```bash
cd client
npm install zustand
npm install -D tailwindcss @tailwindcss/vite
```

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

**Users are anonymous — no login, auto-assigned `AdjectiveAnimal` username + color** *(current phase only — auth planned)*
On connect, the server generates a random username (e.g. `"SilentOtter"`) and a hex color for the avatar. There's no registration, no login flow, and no way for a user to choose their name. The client just displays whatever the server sends in the `connected` event. When auth is added, this entire identity model will be replaced — along with the `socket.id`-as-identity and reconnect gotchas above.

**Default room "General" always exists (seeded on startup)**
The server creates "General" on boot and never deletes it. The client can assume at least one room always exists — no need to handle an empty room list state. Don't allow users to delete "General" in the UI.

**Messages capped at 100 per channel (room or DM)**
The server stores only the last 100 messages per room or DM thread. When a new message arrives and the cap is hit, the oldest drops off. The client should not paginate or fetch history beyond what's delivered in `room:joined` — that's all there is.

**Messages max 2000 characters**
Enforced server-side. The client should validate and block send if `text.length > 2000` to give immediate feedback, but the server will silently drop oversized messages anyway.

**DM thread ID is deterministic: `[userIdA, userIdB].sort().join('--')`**
Both sides of a DM share the same thread ID, computed by sorting the two socket IDs alphabetically and joining with `--`. The client doesn't need to compute this — the server sends `dm:opened` with the `dm` object which includes the ID. But knowing the formula helps debug duplicate thread issues.

**State is ephemeral — all data lost on server restart**
No database. Restarting the server clears all users, rooms (except "General" which is re-seeded), messages, and DM threads. Don't build any persistence layer or "load from server" logic — there's nothing to load.

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

## MANDATORY: Commit After Every Completed Task

After completing any task, you MUST commit immediately — before reporting done to the user.

**Commit format:**
```
{type}({scope}): {description}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:** `feat` | `fix` | `refactor` | `test` | `docs` | `chore`

**Rules:**
- One commit per task — never batch multiple tasks into one commit
- Stage only files changed by the task (avoid `git add .` if unrelated files are dirty)
- Commit BEFORE updating docs or reporting completion
- Never skip the commit — it is required even for small changes

**Example commits:**
```
feat(client): add socket connection hook
fix(server): guard against empty room name on create
docs(claude): update architecture map with client structure
```

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
