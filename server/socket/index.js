import { addUser, removeUser, getAllRooms, joinRoom } from '../store/index.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerMessageHandlers } from './messageHandlers.js';
import { registerDmHandlers } from './dmHandlers.js';

const GENERAL_ROOM_ID = 'general';

// Track per-room typing state: roomId → Set<socketId>
const typing = {};

export function initSocket(io) {
  io.on('connection', (socket) => {
    // Use identity provided by client auth handshake
    const { username, color, avatar } = socket.handshake.auth ?? {};
    const user = addUser(socket.id, { username, color, avatar });

    // Auto-join General
    socket.join(GENERAL_ROOM_ID);
    joinRoom(GENERAL_ROOM_ID, socket.id);

    // Send initial state to the connecting client
    socket.emit('connected', {
      user,
      rooms: getAllRooms(),
    });

    // Notify everyone that a new user is online
    io.emit('user:online', { user });

    // Register feature handlers
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerDmHandlers(io, socket);

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
