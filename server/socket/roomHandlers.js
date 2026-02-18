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

    socket.join(roomId);
    joinRoom(roomId, socket.id);

    const members = getRoomMembers(roomId);

    // Send room history + members to the joining user
    socket.emit('room:joined', {
      room: serializeRoom(room),
      messages: getMessages(roomId),
      members,
    });

    // Notify everyone else in the room
    socket.to(roomId).emit('room:members', {
      roomId,
      members,
    });
  });

  // Leave a room
  socket.on('room:leave', ({ roomId }) => {
    socket.leave(roomId);
    leaveRoom(roomId, socket.id);

    const members = getRoomMembers(roomId);
    io.to(roomId).emit('room:members', { roomId, members });

    socket.emit('room:left', { roomId });
  });

  // Create a new room
  socket.on('room:create', ({ name, description }) => {
    const trimmed = (name || '').trim().slice(0, 50);
    if (!trimmed) return;
    const desc = (description || '').trim().slice(0, 120);

    const room = createRoom(trimmed, desc);

    // Broadcast to everyone that a new room exists
    io.emit('room:created', { room: serializeRoom(room) });
  });

  // Send current room list on request
  socket.on('room:list', () => {
    socket.emit('room:list', { rooms: getAllRooms() });
  });
}
