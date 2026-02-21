# Heiyo — Spatial Real-Time Chat

A real-time multi-user chat app with a spatial bubble-orbit UI. Users and rooms orbit around you in a living, animated universe rather than a flat sidebar list.

---

## Features

- **Spatial orbit UI** — three concentric orbit rings display follows, live echoes, and joined rooms as interactive animated bubbles
- **Glassmorphic design** — aurora background, frosted-glass cards, neon presence rings, elliptical orbital motion
- **Registered + guest auth** — create a persistent account or jump in as an anonymous guest
- **Private rooms** — invite-only rooms with shareable invite links (`/?invite=<code>`)
- **Room expiry** — inactive private rooms self-destruct after 2 hours (animated implode)
- **Direct messages** — open a DM thread with any online user
- **Echoes** — ephemeral broadcast messages that appear in orbit ring 2 and expire automatically
- **Reactions** — emoji reaction strip on every message
- **Typing indicators** — real-time typing orb in chat header
- **Follows system** — follow registered users; they appear in your inner orbit
- **Profiles** — display name, banner color, avatar, presence status, transmission emoji
- **Notifications** — Web Audio ping when a message arrives and the tab is hidden; per-room mute persisted in localStorage
- **Unread badges** — glow ring + count badge on orbit bubbles

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Server runtime | Node.js (ESM) |
| HTTP / REST | Express 4 |
| Real-time | Socket.IO 4 |
| Database | SQLite via `better-sqlite3` |
| Auth | bcryptjs + UUID |
| Client bundler | Vite 6 |
| UI framework | React 18 |
| Styling | Tailwind CSS v4 |
| State | `useReducer` + Context (no external store) |
| Dev runner | concurrently + nodemon |

---

## Project Structure

```
Chat app/
├── package.json                    # root dev runner (concurrently)
├── server/
│   ├── index.js                    # Express + Socket.IO (port 3001) + auth REST routes
│   ├── socket/
│   │   ├── index.js                # connection lifecycle, typing, room expiry scheduler
│   │   ├── roomHandlers.js         # room:join/leave/create/invite/get-invite/join-by-code
│   │   ├── messageHandlers.js      # message:send/seen, reactions
│   │   ├── dmHandlers.js           # dm:open/send
│   │   ├── echoHandlers.js         # echo:send/expire
│   │   └── followHandlers.js       # user:follow/unfollow
│   ├── store/index.js              # in-memory state + DB persistence helpers
│   ├── db/index.js                 # SQLite schema: rooms, messages, DMs, users, follows
│   └── utils/nameGenerator.js      # guest name generation
└── client/
    └── src/
        ├── App.jsx                 # auth gate, reconnect banner, invite URL param
        ├── context/ChatContext.jsx # all state via useReducer
        ├── hooks/useSocket.js      # socket events → dispatch
        ├── components/
        │   ├── BubbleUniverse.jsx  # 3-orbit spatial UI (Follows / Echoes / Rooms)
        │   ├── RoomBubble.jsx      # orbit bubble with heat tier + unread badge
        │   ├── ChatArea.jsx        # header (invite + mute) + messages + input
        │   └── ...
        └── utils/
            ├── notificationSound.js # Web Audio ping + per-room mute in localStorage
            └── avatar.js
```

---

## Orbit Rings

| Ring | Contents | Max |
|------|----------|-----|
| Inner (1) | Follows (online-first) + DM partners not in follows | 10 |
| Middle (2) | Live echoes | 6 |
| Outer (3) | Joined rooms | 5 + "+" button |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
# Install all dependencies (root + server + client)
npm run install:all
```

### Run (dev)

```bash
npm run dev        # starts server (port 3001) + client (port 5173) concurrently
npm run server     # server only
npm run client     # client only
```

Open [http://localhost:5173](http://localhost:5173).

---

## Auth

Three REST endpoints on the server:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create a persistent account (stored in SQLite) |
| `/auth/login` | POST | Log in to an existing account |
| `/auth/guest` | POST | Ephemeral guest session (no DB row) |

Credentials are stored in `localStorage` and passed in the Socket.IO handshake `auth` object.

---

## Socket Events

### Client → Server

| Event | Payload |
|-------|---------|
| `room:join` | `{ roomId }` |
| `room:leave` | `{ roomId }` |
| `room:create` | `{ name, description }` |
| `room:invite` | `{ roomId, username }` |
| `room:get-invite` | `{ roomId }` |
| `room:join-by-code` | `{ code }` |
| `message:send` | `{ roomId, text, replyTo? }` |
| `message:seen` | `{ roomId, messageId }` |
| `reaction:toggle` | `{ roomId?, dmId?, messageId, emoji }` |
| `dm:open` | `{ toUserId }` |
| `dm:send` | `{ toUserId, text }` |
| `typing:start` | `{ roomId }` |
| `typing:stop` | `{ roomId }` |
| `echo:send` | `{ type, text? }` |
| `user:follow` | `{ userId }` |
| `user:unfollow` | `{ username }` |
| `profile:update` | `{ bio, statusEmoji, statusText, presenceStatus, displayName }` |
| `avatar:change` | `{ avatar }` |

### Server → Client

| Event | Payload |
|-------|---------|
| `connected` | `{ user, rooms, echoes }` |
| `follows:list` | `{ following }` |
| `user:online/offline/updated` | user object |
| `room:joined/members/created/invited/left/updated/removed` | room data |
| `room:invite-code` | `{ roomId, inviteCode }` |
| `message:received/seen` | message object |
| `reaction:update` | reaction map |
| `dm:opened/received` | DM thread |
| `typing:update` | typing users list |
| `echo:new/expire` | echo object |
| `user:followed/unfollowed` | follow state |

---

## Business Rules

- **General room** is always accessible and never expires
- **Private rooms** expire after 2 hours of inactivity — server broadcasts `room:removed`, client animates an implode
- **Invite links** — each room has a unique `inviteCode`; visiting `/?invite=<code>` auto-joins on connect
- **DM thread ID** — `[userIdA, userIdB].sort().join('--')`
- **Message limits** — max 100 messages per room/DM (oldest dropped); max 2000 chars per message
- **Follows** — registered users only; persisted in `follows` table

---

## License

MIT
