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
