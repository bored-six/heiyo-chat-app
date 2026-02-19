import { addUser, removeUser, getAllRoomsForUser, joinRoom, updateUserAvatar, updateUserProfile, setUserPresenceStatus, getActiveEchoes, getExpiredRooms, deleteRoom, getUserByUsername } from '../store/index.js';
import { dbGetUser, dbUpdateUserAvatar, dbUpdateUserProfile, dbGetFollowingProfiles } from '../db/index.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerMessageHandlers } from './messageHandlers.js';
import { registerDmHandlers } from './dmHandlers.js';
import { registerEchoHandlers } from './echoHandlers.js';
import { registerFollowHandlers } from './followHandlers.js';

const GENERAL_ROOM_ID = 'general';
const EXPIRY_CHECK_MS = 5 * 60 * 1000; // check every 5 minutes

// Track per-room typing state: roomId → Set<socketId>
const typing = {};

// ─── Room expiry ──────────────────────────────────────────────────────────────
// Runs on a timer; removes private rooms inactive for 2+ hours.
// General is always exempt (enforced in getExpiredRooms).

function startRoomExpiry(io) {
  setInterval(() => {
    const expired = getExpiredRooms();
    for (const room of expired) {
      console.log(`[expiry] Room "${room.name}" (${room.id}) expired — broadcasting removal`);
      io.emit('room:removed', { roomId: room.id });
      deleteRoom(room.id);
    }
  }, EXPIRY_CHECK_MS);
}

export function initSocket(io) {
  io.on('connection', (socket) => {
    // Use identity provided by client auth handshake
    const { username, color, avatar, tag } = socket.handshake.auth ?? {};
    // Load persisted profile fields for registered users
    const dbUser = dbGetUser(username);
    const user = addUser(socket.id, {
      username, color, avatar, tag,
      bio: dbUser?.bio ?? '',
      statusEmoji: dbUser?.status_emoji ?? '',
      statusText: dbUser?.status_text ?? '',
      presenceStatus: dbUser?.presence_status ?? 'online',
      displayName: dbUser?.display_name ?? '',
    });

    // Auto-join General
    socket.join(GENERAL_ROOM_ID);
    joinRoom(GENERAL_ROOM_ID, socket.id);

    // Send initial state to the connecting client — rooms filtered by visibility
    socket.emit('connected', {
      user,
      rooms: getAllRoomsForUser(username ?? null),
      echoes: getActiveEchoes(),
    });

    // Send follows list for registered users (guests have no DB row)
    if (dbUser) {
      const following = dbGetFollowingProfiles(username);
      const annotated = following.map(f => {
        const onlineUser = getUserByUsername(f.username);
        return onlineUser
          ? { ...onlineUser, online: true }
          : { username: f.username, color: f.color, avatar: f.avatar, tag: f.tag, online: false, id: null };
      });
      socket.emit('follows:list', { following: annotated });
    }

    // Notify everyone that a new user is online
    io.emit('user:online', { user });

    // Register feature handlers
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerDmHandlers(io, socket);
    registerEchoHandlers(io, socket);
    registerFollowHandlers(io, socket);

    // ── Profile update ───────────────────────────────────────────────────────

    socket.on('profile:update', ({ bio, statusEmoji, statusText, presenceStatus, displayName }) => {
      const b  = typeof bio            === 'string' ? bio.slice(0, 160)           : '';
      const se = typeof statusEmoji    === 'string' ? statusEmoji.slice(0, 2)     : '';
      const st = typeof statusText     === 'string' ? statusText.slice(0, 60)     : '';
      const ps = ['online', 'away', 'dnd', 'invisible'].includes(presenceStatus) ? presenceStatus : 'online';
      const dn = typeof displayName    === 'string' ? displayName.slice(0, 32)    : '';
      const user = updateUserProfile(socket.id, { bio: b, statusEmoji: se, statusText: st, presenceStatus: ps, displayName: dn });
      if (!user) return;
      // Persist for registered users only (guests have no DB row)
      if (dbGetUser(user.username)) dbUpdateUserProfile(user.username, { bio: b, statusEmoji: se, statusText: st, presenceStatus: ps, displayName: dn });
      io.emit('user:updated', { user });
    });

    // ── Avatar change ────────────────────────────────────────────────────────

    socket.on('avatar:change', ({ avatar }) => {
      if (!avatar || typeof avatar !== 'string') return;
      const user = updateUserAvatar(socket.id, avatar);
      if (!user) return;
      // Persist for registered users (guests have no DB row — safe to ignore)
      if (dbGetUser(user.username)) dbUpdateUserAvatar(user.username, avatar);
      // Broadcast the updated user to everyone
      io.emit('user:updated', { user });
    });

    // ── Typing indicators ────────────────────────────────────────────────────

    socket.on('typing:start', ({ roomId }) => {
      if (!typing[roomId]) typing[roomId] = new Set();
      typing[roomId].add(socket.id);
      broadcastTyping(io, roomId);
    });

    socket.on('typing:stop', ({ roomId }) => {
      typing[roomId]?.delete(socket.id);
      broadcastTyping(io, roomId);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      // Mark offline before removal so the broadcast carries the updated status
      const offlineUser = setUserPresenceStatus(socket.id, 'offline');
      if (offlineUser) io.emit('user:updated', { user: offlineUser });

      const removedUser = removeUser(socket.id);

      // Clean up typing state
      Object.values(typing).forEach((set) => set.delete(socket.id));

      if (removedUser) {
        io.emit('user:offline', { userId: removedUser.id });
      }
    });
  });

  // Start the room expiry background job (runs once per server lifetime)
  startRoomExpiry(io);
}

function broadcastTyping(io, roomId) {
  const typers = [...(typing[roomId] ?? [])];
  io.to(roomId).emit('typing:update', { roomId, typers });
}
