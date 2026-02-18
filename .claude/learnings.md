# Learnings — Chat App

## [2026-02-19] - 3-orbit redesign + orbit customizer

- **3 named orbits** replace the active/quiet room split: Friends (inner, cap 10), Echoes (middle, cap 6, under construction), Rooms (outer, cap 5 + 1 for "+").
- **Cap logic**: smaller ring → smaller bubbles → higher cap. Inner has the smallest bubbles so gets the highest cap.
- **"+" button in outer ring**: always occupies the last orbital slot (never an overflow bubble for outer). Clicking opens OrbitCustomizerModal.
- **OrbitCustomizerModal** is defined inline in BubbleUniverse.jsx (no separate file). Takes `rooms`, `hiddenRooms` (Set), `onToggle`, `onClose` as props.
- **`hiddenRooms` state**: a `Set<roomId>` persisted to `localStorage` key `heiyo_orbit_hidden`. Rooms in the set are filtered out of outer ring. The customizer modal still shows all rooms so the user can re-add them.
- **Echoes orbit (orbit 2)**: 4 ghost placeholder bubbles from `ECHO_PLACEHOLDERS` constant. No click handler. Dashed border, 🚧 badge, low opacity — clearly communicates "coming soon".
- **Zone labels updated**: rooms / echoes / friends (previously channels / direct).
- **Hub panel ring labels updated**: Friends (orbit 1), Echoes (orbit 2), Rooms (orbit 3).

## [2026-02-18] - Bootstrap

- Server is fully implemented and functional. Client is the only remaining work.
- `node --watch` is used for server dev — no nodemon dependency needed.
- All socket handler files receive `(io, socket)` — `io` for broadcasting to all, `socket` for the current connection.
- DM routing uses `socket.to(recipientSocketId).emit(...)` since DMs don't use Socket.IO rooms.
- Typing indicators only exist for rooms, not DMs.
- `server/store/index.js` is the single source of truth — import from here, never duplicate state.
- Message trimming (keeping last 100) happens inside the store on every `addMessage` call.

## [2026-02-18] - Quick-win features batch (search, reply, online panel, room desc)

- **Message search is purely client-side** — no new socket events; just filter `roomMessages[roomId]` on `searchQuery` before passing to `MessageList`. Works identically for DMs.
- **Text highlighting** requires splitting on a regex with a capture group so React can wrap matches in `<mark>` elements. Pattern: `text.split(new RegExp('(query)', 'gi'))`.
- **Reply/quote is a two-layer concern** — the quoted block is stored as `replyTo: { id, text, senderName }` on the message; the server sanitizes it server-side (cap text, cast to string) before persisting. Client only holds `replyingTo` in local state, not global context.
- **DB migrations follow the existing try/catch ALTER TABLE pattern** — add new nullable columns that way; never change the `CREATE TABLE` definition (breaks existing DBs).
- **`replyTo` must be serialized as plain fields** in the DB (reply_to_id, reply_to_text, reply_to_sender) — SQLite can't store objects; reconstruct the object in `dbRowToMessage`.
- **Online users panel in BubbleUniverse** reuses `onlineUsers` from context directly — no new socket events needed.
- **Room description** flows through the full stack: client form → `room:create` payload → roomHandlers → `createRoom(name, desc)` → `serializeRoom` includes it → `room:created` broadcast → RoomBubble renders it.
- **Escape key to cancel reply** is a good UX pattern — handled in MessageInput's `onKeyDown`.
- **`Esc` to cancel reply info hint** shown conditionally in the footer hint line — only when `replyingTo` is active.

## [2026-02-19] - BubbleUniverse enhancements (heat, lurkers, tooltip, seen receipts)

- **Ephemeral activity state belongs in the store as module-level Maps**, not in the `state` object — `roomSpeakers` and `messageSeen` are declared outside `state` so they aren't serialized or hydrated.
- **`serializeRoom` is the single chokepoint** for all room data sent to clients — adding new computed fields there (lurkerCount, lastMessageAt, lastMessage) automatically updates all room list events.
- **`io.emit('room:updated', ...)` broadcasts to ALL connected sockets** — the right pattern when BubbleUniverse users (not in any room's Socket.IO channel) need to see live room stats.
- **`stateRef` pattern in useSocket**: pass a `ref` (not the state value) from ChatProvider into useSocket so socket event closures always read the current `activeRoomId` without stale closure bugs.
- **Heat tier is computed on render** from `lastMessageAt` timestamp — no server-side timer needed. A 30 s `setInterval` forces re-render so bubbles cool down gradually even without new messages.
- **Lurker count = members who haven't spoken in 5+ min OR never spoke** — computed in `serializeRoom` by checking `roomSpeakers` against `room.members`. Automatically correct after join/leave since both emit `room:updated`.
- **Seen receipts are ephemeral only** — tracked in `messageSeen` Map (server) and `message.seenBy` (client state). Not persisted to SQLite. Fits the app's "state lost on restart" model.
- **Emit `message:seen` from two places in useSocket**: on `room:joined` (last historical message) and on `message:received` when the room is active — covers both entering a room and receiving live messages.

## [2026-02-19] - Constellation view (spatial message layout)

- **SVG + DOM hybrid is the right call for interactive node graphs** — SVG handles all lines (crisp at any size, pointer-events: none), DOM divs handle interactive nodes (hover state, tooltips, React state). Avoids canvas API entirely.
- **ResizeObserver is the cleanest way to size a canvas to its flex container** — measure `contentRect.{width,height}` and feed into layout calculations via state. The canvas div is then `width: W, height: H` and the outer container is `overflow: hidden`.
- **Concentric ring clustering** packs nodes tightly around an anchor: ring r holds `min(6*(r+1), 20)` nodes at `radius = 60 + r*44`. Deterministic start angle per sender (`hashStr(senderId) % 628 / 100`) prevents all senders' rings from pointing the same way.
- **Constellation uses the full (unfiltered) message set** — search filtering should not apply since node positions depend on the complete history. Pass `allMessages` not the filtered `messages` array to ConstellationView.
- **View mode resets belong in a `useEffect`** on `[activeRoomId, activeDmId]` changes — this also clears search state and replyingTo cleanly, avoiding stale UI across room switches.
- **Tooltip direction based on canvas position** — check `pos.y > H * 0.55` to decide show-above vs show-below; prevents cards from going off the bottom of the container.

## [2026-02-18] - Client UI (Step 4)

- Tailwind CSS v4 uses `@import "tailwindcss"` in CSS + `@tailwindcss/vite` plugin — no `tailwind.config.js` needed.
- Server auto-socket-joins the user to General but does NOT emit `room:joined` for it — client must explicitly emit `room:join` to receive message history. App.jsx does this on connect.
- Message objects on the wire use `senderId/senderName/senderColor`, not `userId/username/color`.
- DM `participants` are raw socket IDs (strings). Resolve to display names via `onlineUsers` map in context; fall back to a truncated ID if user is offline.
- Textarea auto-grow: set `height: auto` then `height: scrollHeight + 'px'` on each change, capped at 160 px.
- Typing stop is emitted after 2 s of no keystrokes AND on every send — prevents stuck indicators.
- `TypingIndicator` reserves 20 px height even when empty so the layout doesn't jump.
