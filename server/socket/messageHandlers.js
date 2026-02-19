import {
  getUser, getRoom, addMessage, toggleReaction, toggleDmReaction,
  recordSpeaker, recordMessageSeen, getMessageSeenBy, serializeRoom,
} from '../store/index.js';

export function registerMessageHandlers(io, socket) {
  socket.on('message:send', ({ roomId, text, replyTo }) => {
    const user = getUser(socket.id);
    const room = getRoom(roomId);
    if (!user || !room) return;

    const trimmed = (text || '').trim().slice(0, 2000);
    if (!trimmed) return;

    // Sanitize replyTo — only keep safe fields, cap text length
    const safeReplyTo = replyTo?.id
      ? { id: replyTo.id, text: String(replyTo.text ?? '').slice(0, 200), senderName: String(replyTo.senderName ?? '').slice(0, 50) }
      : null;

    const message = addMessage(roomId, {
      senderId: user.id,
      senderName: user.username,
      senderColor: user.color,
      senderAvatar: user.avatar,
      senderTag: user.tag,
      text: trimmed,
      replyTo: safeReplyTo,
    });

    // Track this user as an active speaker
    recordSpeaker(roomId, socket.id);

    // Broadcast message to everyone in the room (including sender)
    io.to(roomId).emit('message:received', { roomId, message });

    // Broadcast updated room stats only to current room members
    io.to(roomId).emit('room:updated', { room: serializeRoom(room) });
  });

  // Client marks a message as seen
  socket.on('message:seen', ({ roomId, messageId }) => {
    const user = getUser(socket.id);
    if (!user || !roomId || !messageId) return;

    recordMessageSeen(messageId, socket.id, {
      id: socket.id,
      username: user.username,
      color: user.color,
      avatar: user.avatar,
    });

    io.to(roomId).emit('message:seen', {
      roomId,
      messageId,
      seenBy: getMessageSeenBy(messageId),
    });
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
