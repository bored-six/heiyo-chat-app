import { getUser, getRoom, addMessage } from '../store/index.js';

export function registerMessageHandlers(io, socket) {
  socket.on('message:send', ({ roomId, text }) => {
    const user = getUser(socket.id);
    const room = getRoom(roomId);
    if (!user || !room) return;

    const trimmed = (text || '').trim().slice(0, 2000);
    if (!trimmed) return;

    const message = addMessage(roomId, {
      senderId: user.id,
      senderName: user.username,
      senderColor: user.color,
      text: trimmed,
    });

    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit('message:received', { roomId, message });
  });
}
