# Product — Chat App

## What It Is

Anonymous real-time chat. No accounts, no login, no persistence. Users connect and get an auto-generated identity. Data lives only in memory — all lost on server restart.

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Anonymous identity | Complete | Auto-assigned on connect |
| Room-based chat | Complete | Join/leave/create rooms |
| Direct messages | Complete | Peer-to-peer via socket ID |
| Typing indicators | Complete | Per-room, not per-DM |
| Client UI | Complete | All core components built |

## Business Rules

- **Identity:** Every user gets a random `AdjectiveAnimal` name + a color. No duplicates enforced (names picked randomly from fixed arrays).
- **General room:** Always exists. Seeded at startup. Cannot be deleted. All users auto-join on connect.
- **Message cap:** 100 messages max per room or DM thread. Oldest are dropped when limit is reached.
- **Message length:** Max 2000 characters. Longer messages are silently ignored (no error sent back).
- **DM ID:** Deterministic. Sorted user IDs joined with `--`. Same thread regardless of who initiates.
- **Rooms:** Any user can create a room. No ownership or moderation.
- **Ephemeral state:** Server restart clears all users, rooms (except General), messages, and DMs.

## Non-Goals

- Authentication / user accounts
- Persistent storage (database)
- Message editing or deletion
- Admin controls or moderation
- Notifications or push alerts
- File/image sharing
