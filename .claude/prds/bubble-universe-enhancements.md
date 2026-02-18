# PRD: BubbleUniverse Enhancements

**Status:** Complete
**Created:** 2026-02-19
**Last Updated:** 2026-02-19

## Summary

Five social/ambient features layered onto the BubbleUniverse lobby and in-room messages.

## Already Implemented (no work needed)

- **Unread message count on bubbles** — fully done. Yellow pulsing badge on `RoomBubble`, tracked in `unread[roomId]` state.

## Features to Implement

### 1. Room Heat
Rooms that recently got messages pulse brighter/bigger. Dead rooms shrink.

**Mechanism:** `lastMessageAt` timestamp on each room. Client computes "age" and maps it to a CSS scale + glow intensity. No server timer needed — client recalculates on each render tick via a `useEffect` interval.

Heat tiers (based on minutes since last message):
- < 1 min → **HOT**: scale 1.15, bright glow pulse (fast)
- 1–5 min → **WARM**: scale 1.05, moderate glow pulse (slow)
- 5–15 min → **COOL**: scale 1.0, faint glow
- > 15 min → **COLD**: scale 0.88, very dim, no pulse

### 2. Lurker Count
Members in a room who haven't sent a message in 5+ minutes (or never) show as "X lurking".

**Mechanism:** Server tracks `roomSpeakers` Map (`roomId → Map<userId → lastSpokeAt>`). Updated on `message:send`. `serializeRoom` computes `lurkerCount` = members where `lastSpoke` is null or > 5 min ago. Sent in `room:updated` event after each message + in initial room list.

Display: small muted text under the member count badge, e.g. `3 lurking`.

### 3. Last Message Preview (tooltip)
Hovering a room bubble shows a tooltip with the last message text + sender name.

**Mechanism:** `serializeRoom` includes `lastMessage: { text, senderName, timestamp }` (truncated to 80 chars). Tooltip is a `<div>` positioned above the bubble on hover, shown via React hover state.

### 4. Seen Receipts
Users who've seen a message have their chibi avatar shown in a small row below that message.

**Mechanism:**
- Server: in-memory `messageSeen` Map (`messageId → Map<userId → { id, username, color, avatar }>`). Cleaned up when user disconnects.
- Client → Server: `message:seen` `{ roomId, messageId }` — emitted when a new message arrives in the active room, or when a room is opened (last message only).
- Server → Client: `message:seen` `{ roomId, messageId, user }` — broadcast to all room members.
- Client: `seenBy` tracked per message in `roomMessages`. `Message` renders a small row of 20px avatar circles below the message body (excluding sender, max 8 shown).

## Architecture

### New Server-Side State (`server/store/index.js`)
```js
// Ephemeral, in-memory only
const roomSpeakers = new Map(); // roomId → Map<userId → lastSpokeAt>
const messageSeen  = new Map(); // messageId → Map<userId → userObj>
```

### Updated `serializeRoom`
```js
export function serializeRoom(room) {
  const now = Date.now();
  const speakers = roomSpeakers.get(room.id) ?? new Map();
  const LURKER_THRESHOLD = 5 * 60 * 1000;

  let lurkerCount = 0;
  for (const memberId of room.members) {
    const lastSpoke = speakers.get(memberId);
    if (!lastSpoke || now - lastSpoke > LURKER_THRESHOLD) lurkerCount++;
  }

  const msgs = room.messages;
  const last = msgs[msgs.length - 1];

  return {
    id: room.id,
    name: room.name,
    description: room.description ?? '',
    type: room.type,
    memberCount: room.members.size,
    createdAt: room.createdAt,
    lastMessageAt: last?.timestamp ?? null,     // NEW
    lurkerCount,                                 // NEW
    lastMessage: last                            // NEW
      ? { text: last.text.slice(0, 80), senderName: last.senderName, timestamp: last.timestamp }
      : null,
  };
}
```

### New Socket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server → Client | `room:updated` | `{ room }` — serialized room with heat/lurker/lastMessage |
| Client → Server | `message:seen` | `{ roomId, messageId }` |
| Server → Client | `message:seen` | `{ roomId, messageId, user }` |

### `room:updated` emission
Emitted to all sockets in the room immediately after a `message:send` completes (inside `messageHandlers.js`).

### Client State Changes (`ChatContext.jsx`)

New actions:
- `ROOM_UPDATED` — merges updated room into `rooms[]` array (replaces by id)
- `MESSAGE_SEEN` — appends user to `seenBy` array on matching message in `roomMessages`

New initial state: messages gain `seenBy: []` field.

### Client Socket Changes (`useSocket.js`)

Listen for:
- `room:updated` → dispatch `ROOM_UPDATED`
- `message:seen` → dispatch `MESSAGE_SEEN`

Emit:
- `message:seen` on `MESSAGE_RECEIVED` when `activeRoomId === roomId` (last message)
- `message:seen` on `SET_ACTIVE_ROOM` for last message in room (if any)

## Component Changes

### `RoomBubble.jsx`
- Accepts `lastMessageAt`, `lurkerCount`, `lastMessage` as props (from `room.*`)
- `useEffect` with 30s interval to recompute heat tier and force re-render
- Heat drives: `transform: scale(X)` and `boxShadow` intensity on the button
- Lurker count: small text `{lurkerCount} lurking` under member badge (only when > 0)
- Hover tooltip: absolute-positioned div above bubble with last message preview

### `Message.jsx`
- Accepts `seenBy` from `message.seenBy ?? []`
- Renders row of small avatar `<img>` circles (20px) below message body
- Excludes sender, caps at 8 avatars (shows "+N" if overflow)
- Only shown when `seenBy.length > 0`

### `BubbleUniverse.jsx`
- Pass `room.lastMessageAt`, `room.lurkerCount`, `room.lastMessage` to each `RoomBubble`

## Wave Execution Plan

| Wave | Task | Files | Type |
|------|------|-------|------|
| 1 | Server store + serializer | `server/store/index.js` | auto |
| 1 | Server message handler (speaker tracking + room:updated + seen) | `server/socket/messageHandlers.js` | auto |
| 2 | Client state (ChatContext + useSocket) | `client/src/context/ChatContext.jsx`, `client/src/hooks/useSocket.js` | auto |
| 3 | RoomBubble UI (heat + lurker + tooltip) | `client/src/components/RoomBubble.jsx`, `client/src/components/BubbleUniverse.jsx` | auto |
| 3 | Message seen receipts UI | `client/src/components/Message.jsx` | auto |

Wave 1 tasks run in parallel. Wave 3 tasks run in parallel. Wave 2 waits for Wave 1.

## Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| `server/store/index.js` | Server | server/store/index.js | Add roomSpeakers, messageSeen, update serializeRoom | Pending |
| `server/socket/messageHandlers.js` | Server | server/socket/messageHandlers.js | Speaker tracking, room:updated, message:seen | Pending |
| `client/src/context/ChatContext.jsx` | Client state | client/src/context/ChatContext.jsx | ROOM_UPDATED, MESSAGE_SEEN actions | Pending |
| `client/src/hooks/useSocket.js` | Client socket | client/src/hooks/useSocket.js | New event listeners + emitters | Pending |
| `client/src/components/RoomBubble.jsx` | UI | client/src/components/RoomBubble.jsx | Heat, lurker count, hover tooltip | Pending |
| `client/src/components/BubbleUniverse.jsx` | UI | client/src/components/BubbleUniverse.jsx | Pass new room props to RoomBubble | Pending |
| `client/src/components/Message.jsx` | UI | client/src/components/Message.jsx | Seen receipt avatar row | Pending |
