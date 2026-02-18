import { getUser, getRoom, addMessage, toggleReaction, toggleDmReaction } from '../store/index.js';

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
      senderAvatar: user.avatar,
      senderTag: user.tag,
      text: trimmed,
    });

    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit('message:received', { roomId, message });
  });

  socket.on('reaction:toggle', ({ messageId, roomId, dmId, emoji }) => {
    const user = getUser(socket.id);
    if (!user || !messageId || !emoji) return;

    if (roomId) {
      const reactions = toggleReaction(roomId, messageId, user.id, emoji);
      if (reactions !== null) {
        io.to(roomId).emit('reaction:update', { messageId, roomId, reactions });
      }
    } else if (dmId) {
      const reactions = toggleDmReaction(dmId, messageId, user.id, emoji);
      if (reactions !== null) {
        // dmId is "socketIdA--socketIdB" — emit to each participant directly
        const [participantA, participantB] = dmId.split('--');
        io.to(participantA).to(participantB).emit('reaction:update', { messageId, dmId, reactions });
      }
    }
  });
}
