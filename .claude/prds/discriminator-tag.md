# PRD: Discriminator Tag

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

---

## Summary

Add a 4-digit discriminator tag (e.g. `#4829`) to registered user accounts, similar to Discord's legacy username system. Tags are assigned randomly at registration and displayed alongside usernames throughout the UI to help distinguish users. Guest accounts receive no tag.

---

## Requirements

### Original Requirements
- Each registered account should have an ID tag to distinguish it from others
- Display format mirrors Discord: `Username#1234`

### Discovered Requirements
- Existing accounts in the DB needed a migration-safe default (`''`) rather than a generated value — retroactive tag generation was out of scope
- Guest accounts intentionally excluded; tag is only shown when non-empty
- Tag is purely cosmetic — username remains the unique primary key; tags are not guaranteed unique

---

## Architecture

### Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Tag uniqueness | Not enforced | Username is still the PK; tag is display-only |
| Tag format | 4-digit zero-padded string (`'0042'`) | Matches Discord convention, stored as TEXT |
| Guest tag | Empty string `''` | Guards in UI hide tag when empty — no special type needed |
| Tag assignment | Random on register | Simple, no lookup required |

### Data Flow

```
Register → server generates tag → dbCreateUser(tag) → returned in response
Login    → dbGetUser returns tag → returned in response
AuthScreen → onAuth({ ..., tag }) → authUser state
useSocket  → socket.auth.tag → server socket handshake
addUser    → user object stores tag
message:send → senderTag: user.tag → stored in messages table
UI         → Username#tag displayed where tag is non-empty
```

---

## Implementation

### Component Inventory

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| `users` table | DB schema | `server/db/index.js` | Added `tag TEXT NOT NULL DEFAULT ''` column |
| `messages` table | DB schema | `server/db/index.js` | Added `sender_tag TEXT NOT NULL DEFAULT ''` column |
| `dm_messages` table | DB schema | `server/db/index.js` | Added `sender_tag TEXT NOT NULL DEFAULT ''` column |
| `dbCreateUser` | DB function | `server/db/index.js` | Accepts and stores `tag` param |
| `dbAddMessage` | DB function | `server/db/index.js` | Accepts and stores `senderTag` |
| `dbAddDmMessage` | DB function | `server/db/index.js` | Accepts and stores `senderTag` |
| `/auth/register` | REST route | `server/index.js` | Generates random tag, returns in response |
| `/auth/login` | REST route | `server/index.js` | Returns `tag` from DB row |
| `addUser` | Store fn | `server/store/index.js` | Stores `tag` on user object |
| `addMessage` | Store fn | `server/store/index.js` | Passes `senderTag` through to DB |
| `addDmMessage` | Store fn | `server/store/index.js` | Passes `senderTag` through to DB |
| `dbRowToMessage` | Store helper | `server/store/index.js` | Maps `sender_tag` → `senderTag` |
| `initSocket` | Socket | `server/socket/index.js` | Reads `tag` from handshake auth |
| `registerMessageHandlers` | Socket | `server/socket/messageHandlers.js` | Passes `user.tag` as `senderTag` |
| `registerDmHandlers` | Socket | `server/socket/dmHandlers.js` | Passes `from.tag` as `senderTag` |
| `useSocket` | React hook | `client/src/hooks/useSocket.js` | Includes `tag` in `socket.auth` |
| `Message` | React component | `client/src/components/Message.jsx` | Renders `#tag` after sender name |
| `UserBadge` | React component | `client/src/components/UserBadge.jsx` | Renders `#tag` after own username |
| `OnlineUsersPanel` | React component | `client/src/components/OnlineUsersPanel.jsx` | Renders `#tag` next to each user |

### Data Model

**`users` table** — added column:
```sql
tag TEXT NOT NULL DEFAULT ''
```

**`messages` / `dm_messages` tables** — added column:
```sql
sender_tag TEXT NOT NULL DEFAULT ''
```

**Migrations** (safe on existing DBs):
```js
try { db.exec(`ALTER TABLE users ADD COLUMN tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
try { db.exec(`ALTER TABLE messages ADD COLUMN sender_tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
try { db.exec(`ALTER TABLE dm_messages ADD COLUMN sender_tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
```

### Tag Generation

```js
const tag = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
// e.g. '0042', '3891', '9999'
```

---

## Business Rules

1. Tags are assigned once at registration and never change
2. Tags are **not** unique — only username is unique (primary key)
3. Tags are only shown when non-empty — guests always show no tag
4. Existing accounts that pre-date this feature have tag `''` and show no tag in the UI
5. The tag is stored as a 4-character zero-padded string (TEXT), not an integer

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-18 | Initial implementation | User request — distinguish registered accounts like Discord |
