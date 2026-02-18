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
| 3-orbit universe layout | Complete | Friends / Echoes / Rooms rings |
| Orbit customizer | Complete | Toggle rooms in/out of orbit, persisted to localStorage |

## BubbleUniverse Orbit System

Three concentric orbits around the user hub:

| Orbit | Ring | Content | Cap | Notes |
|-------|------|---------|-----|-------|
| 1 (inner) | Friends | DM partners | 10 | Smallest bubbles → highest cap |
| 2 (middle) | Echoes | Under construction | 6 | Ghost placeholders; future: ephemeral signals |
| 3 (outer) | Rooms | Joined rooms | 5 + 1 | 1 slot always reserved for "+" customize button |

**Cap logic:** Smaller ring = smaller bubbles = more can fit = higher cap.

**Orbit customizer:** The "+" bubble in orbit 3 opens a modal to toggle room visibility. Preferences stored in `localStorage` key `heiyo_orbit_hidden`.

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
