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

## MANDATORY: Task Completion Checklist

**YOU MUST complete ALL steps below before reporting a task as done. Skipping any step is a workflow violation.**

### Step 1 — Commit the code

```
{type}({scope}): {description}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Commit BEFORE touching any docs.

---

### Step 2 — Update the PRD (when required)

Use the table below to decide whether a PRD update is needed. Not every task requires one.

| Change | Record where |
|--------|-------------|
| New feature or capability | PRD — full entry (create one if it doesn't exist) |
| Architecture decision | PRD — Design Decisions section |
| New file or component | PRD — Component Inventory |
| Bug fix that changes observable behavior | PRD — changelog entry only |
| Routine bug fix (typo, wrong URL, null check, missing import) | Git commit only — no PRD needed |
| Pure visual / cosmetic change (colours, spacing, decorations) | Git commit only — no PRD needed |

**When a PRD is needed, do the following:**

1. List files in `.claude/prds/`
2. Open the PRD that covers the area you changed
3. If none exists → create one at `.claude/prds/<feature-name>.md` using the template below

#### What to update in the PRD

| Did you... | Section to update |
|---|---|
| Add or change any UI component | Component Inventory — add file path + purpose |
| Add or change any server-side logic | Component Inventory + Business Rules if behavior changed |
| Change how a socket event works | Update the relevant event description |
| Discover a new requirement during implementation | Add to "Discovered Requirements" |
| Make an architecture decision | Add to "Design Decisions" with the reason |
| Change a business rule | Update "Business Rules" section |
| Add a new file | Add to Component Inventory |

#### Append a changelog entry (for every PRD update)

```markdown
## Changelog

### [LABEL] <short description> — YYYY-MM-DD
- What changed
- Files affected
- Commit: <hash>
```

**Labels:**
| Label | Use for |
|---|---|
| `[FEAT]` | New feature or capability |
| `[FIX]` | Bug fix that changes observable behavior |
| `[REFACTOR]` | Restructured without behavior change |
| `[STYLE]` | Visual / UI-only change |
| `[CHORE]` | Config, tooling, deps |
| `[DOCS]` | Documentation only |

#### New PRD template (use when creating from scratch)

```markdown
# PRD: <Feature Name>

**Status:** In Progress | Complete
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD

## Summary
What this feature does.

## Requirements
### Original Requirements
What was requested.

### Discovered Requirements
Requirements found during implementation (add as you go).

## Architecture
### Design Decisions
Why this approach was chosen.

## Component Inventory
| Component | Type | Path | Purpose |
|-----------|------|------|---------|

## Business Rules
Rules enforced by this feature.

## Changelog
### [FEAT] Initial implementation — YYYY-MM-DD
- What was built
- Files created/changed
- Commit: <hash>
```

---

### Step 3 — Update steering docs (review each one)

| Doc | Update when... |
|-----|----------------|
| `CLAUDE.md` | Architecture changes, new tech, new event contracts, new business rules |
| `.claude/steering/product.md` | New features, changed business rules, new non-goals |
| `.claude/steering/tech.md` | New dependencies, new files, changed ports/config, new constraints |
| `.claude/steering/structure.md` | New patterns, new conventions, new object shapes |
| `.claude/learnings.md` | Any insight discovered — always append something here |

---

### Step 4 — Report to the user

Your report MUST include a doc update summary. No exceptions.

```
## Doc Updates
- prds/<name>.md: [FEAT/FIX/etc] <what changed> — <date>  ← or "no PRD update needed"
- steering/tech.md: <what changed>                         ← or "no update needed"
- steering/product.md: <what changed>                      ← or "no update needed"
- steering/structure.md: <what changed>                    ← or "no update needed"
- CLAUDE.md: <what changed>                                ← or "no update needed"
- learnings.md: <what was captured>
```
