# CLAUDE.md — Chat App

## Project Overview

Real-time multi-user chat app (Heiyo). Registered users + anonymous guests. SQLite persistence, Socket.IO, spatial bubble-orbit UI.

## Architecture

```
Chat app/
├── package.json                    ← concurrently dev runner
├── server/
│   ├── index.js                    ← Express + Socket.IO (port 3001) + auth REST routes
│   ├── socket/
│   │   ├── index.js                ← connection lifecycle, typing, room expiry scheduler
│   │   ├── roomHandlers.js         ← room:join/leave/create/invite/get-invite/join-by-code
│   │   ├── messageHandlers.js      ← message:send/seen, reactions
│   │   ├── dmHandlers.js           ← dm:open/send
│   │   ├── echoHandlers.js         ← echo:send/expire
│   │   └── followHandlers.js       ← user:follow/unfollow
│   ├── store/index.js              ← in-memory state + DB persistence helpers
│   ├── db/index.js                 ← SQLite (better-sqlite3): rooms, messages, DMs, users, follows
│   └── utils/nameGenerator.js
└── client/
    └── src/
        ├── App.jsx                 ← auth gate, reconnect banner, invite URL param
        ├── context/ChatContext.jsx ← all state via useReducer
        ├── hooks/useSocket.js      ← socket wiring → dispatch
        ├── components/
        │   ├── BubbleUniverse.jsx  ← 3-orbit spatial UI (Follows / Echoes / Rooms)
        │   ├── RoomBubble.jsx      ← orbit bubble with heat tier + unread badge
        │   ├── ChatArea.jsx        ← header (invite + mute) + messages + input
        │   └── ...
        └── utils/
            ├── notificationSound.js ← Web Audio ping + per-room mute localStorage
            └── avatar.js
```

## Tech Stack

**Server:** Node.js ESM · Express 4 · Socket.IO 4 · better-sqlite3 · bcryptjs · uuid · nodemon (dev)
**Client:** Vite 6 + React 18 · Tailwind CSS v4 · socket.io-client 4.x · useReducer (no Zustand)

## Auth

REST endpoints (`/auth/register`, `/auth/login`, `/auth/guest`) return `{ username, color, avatar, tag, bio, statusEmoji, statusText, presenceStatus, displayName }`. Client stores in localStorage and passes in socket handshake auth.

## Socket Events

**Client → Server:**
- `room:join {roomId}` · `room:leave {roomId}` · `room:create {name, description}` · `room:invite {roomId, username}` · `room:list`
- `room:get-invite {roomId}` · `room:join-by-code {code}`
- `message:send {roomId, text, replyTo?}` · `message:seen {roomId, messageId}` · `reaction:toggle {roomId?, dmId?, messageId, emoji}`
- `dm:open {toUserId}` · `dm:send {toUserId, text}`
- `typing:start {roomId}` · `typing:stop {roomId}`
- `echo:send {type, text?}`
- `user:follow {userId}` · `user:unfollow {username}`
- `profile:update {bio, statusEmoji, statusText, presenceStatus, displayName}` · `avatar:change {avatar}`

**Server → Client:**
- `connected {user, rooms, echoes}` · `follows:list {following}`
- `user:online/offline/updated`
- `room:joined/members/created/invited/left/updated/removed` · `room:invite-code {roomId, inviteCode}`
- `message:received/seen` · `reaction:update`
- `dm:opened/received`
- `typing:update`
- `echo:new/expire`
- `user:followed/unfollowed`

## Business Rules

- **Auth:** Register (persistent, stored in SQLite) or guest (ephemeral, no DB row)
- **Rooms:** Always private/invite-only. General is always accessible and never expires
- **Room expiry:** Private rooms expire after 2h of inactivity; broadcast `room:removed`, animate implode on client
- **Invite links:** Each room has a unique `inviteCode`; shareable URL `/?invite=<code>` auto-joins on connect
- **Follows:** Registered users can follow others (persisted in `follows` table); shown in orbit 1
- **DMs:** Thread ID = `[userIdA, userIdB].sort().join('--')`
- **Notifications:** Web Audio ping when `document.hidden` + not active room + not muted; per-room mute in localStorage
- **Unread:** Badge + glow ring on orbit bubble; cleared on `SET_ACTIVE_ROOM`
- **Max messages:** 100 per room/DM (oldest dropped); max 2000 chars per message

## Orbits (BubbleUniverse)

| Ring | Contents | Cap |
|------|----------|-----|
| Inner (1) | Follows (online-first) + DM partners not already in follows | 10 |
| Middle (2) | Live echoes | 6 |
| Outer (3) | Joined rooms (user-configurable visibility) | 5 + "+" button |

## Dev Commands

```bash
npm run dev      # both server + client
npm run server   # server only
npm run client   # client only
```

## Planning Workflow

**NEVER type out implementation plans directly.** Always:
1. Spawn `chat-app-planner` agent to explore the codebase and produce the plan
2. After agent completes, ask user: "Ready to build?"
3. No walls of text — just the question

**Agent:** `~/.claude/agents/chat-app-planner.md`

## Task Completion (required every task)

1. **Commit** — `{type}({scope}): {description}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
   - One commit per task, stage only changed files
2. **PRD** — update `.claude/prds/` only for: new features, arch decisions, new files, behavior-changing fixes. Skip for typos/cosmetic/routine fixes.
3. **Steering docs** — update `.claude/steering/` files if tech/patterns/rules changed. Append to `learnings.md` always.
4. **Report** — include a one-line doc update summary per doc (or "no update needed").
