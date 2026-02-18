import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  getMessages,
  getRoomMembers,
  getAllRooms,
  serializeRoom,
} from '../store/index.js';

export function registerRoomHandlers(io, socket) {
  // Join a room
  socket.on('room:join', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;

    // Block access to private rooms for non-owners
    if (room.visibility === 'private') {
      const requester = socket.handshake.auth?.username ?? null;
      if (room.createdBy !== requester) return;
    }

    socket.join(roomId);
    joinRoom(roomId, socket.id);

    const members = getRoomMembers(roomId);

    // Send room history + members to the joining user
    socket.emit('room:joined', {
      room: serializeRoom(room),
      messages: getMessages(roomId),
      members,
    });

    // Notify everyone else in the room of the new member list
    socket.to(roomId).emit('room:members', { roomId, members });

    // Broadcast updated room stats (lurkerCount changes on join) to all clients
    io.emit('room:updated', { room: serializeRoom(room) });
  });

  // Leave a room
  socket.on('room:leave', ({ roomId }) => {
    socket.leave(roomId);
    leaveRoom(roomId, socket.id);

    const room = getRoom(roomId);
    const members = getRoomMembers(roomId);
    io.to(roomId).emit('room:members', { roomId, members });
    socket.emit('room:left', { roomId });

    // Broadcast updated room stats (lurkerCount changes on leave) to all clients
    if (room) io.emit('room:updated', { room: serializeRoom(room) });
  });

  // Create a new room
  socket.on('room:create', ({ name, description, visibility }) => {
    const trimmed = (name || '').trim().slice(0, 50);
    if (!trimmed) return;
    const desc = (description || '').trim().slice(0, 120);
    const createdBy = socket.handshake.auth?.username ?? null;
    const vis = visibility === 'public' ? 'public' : 'private';

    const room = createRoom(trimmed, desc, createdBy, vis);
    const serialized = serializeRoom(room);

    if (vis === 'public') {
      // Broadcast to everyone
      io.emit('room:created', { room: serialized });
    } else {
      // Private: only tell the creator
      socket.emit('room:created', { room: serialized });
    }
  });

  // Send current room list on request
  socket.on('room:list', () => {
    socket.emit('room:list', { rooms: getAllRooms() });
  });
}
