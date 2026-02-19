import { addUser, removeUser, getAllRoomsForUser, joinRoom, updateUserAvatar, updateUserProfile, getActiveEchoes } from '../store/index.js';
import { dbGetUser, dbUpdateUserAvatar, dbUpdateUserProfile } from '../db/index.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerMessageHandlers } from './messageHandlers.js';
import { registerDmHandlers } from './dmHandlers.js';
import { registerEchoHandlers } from './echoHandlers.js';

const GENERAL_ROOM_ID = 'general';

// Track per-room typing state: roomId → Set<socketId>
const typing = {};

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
      pronouns: dbUser?.pronouns ?? '',
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

    // Notify everyone that a new user is online
    io.emit('user:online', { user });

    // Register feature handlers
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerDmHandlers(io, socket);
    registerEchoHandlers(io, socket);

    // ── Profile update ───────────────────────────────────────────────────────

    socket.on('profile:update', ({ bio, statusEmoji, statusText, pronouns }) => {
      const b = typeof bio === 'string' ? bio.slice(0, 160) : '';
      const se = typeof statusEmoji === 'string' ? statusEmoji.slice(0, 2) : '';
      const st = typeof statusText === 'string' ? statusText.slice(0, 60) : '';
      const pr = typeof pronouns === 'string' ? pronouns.slice(0, 20) : '';
      const user = updateUserProfile(socket.id, { bio: b, statusEmoji: se, statusText: st, pronouns: pr });
      if (!user) return;
      // Persist for registered users only (guests have no DB row)
      if (dbGetUser(user.username)) dbUpdateUserProfile(user.username, { bio: b, statusEmoji: se, statusText: st, pronouns: pr });
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
      const removedUser = removeUser(socket.id);

      // Clean up typing state
      Object.values(typing).forEach((set) => set.delete(socket.id));

      if (removedUser) {
        io.emit('user:offline', { userId: removedUser.id });
      }
    });
  });
}

function broadcastTyping(io, roomId) {
  const typers = [...(typing[roomId] ?? [])];
  io.to(roomId).emit('typing:update', { roomId, typers });
}
