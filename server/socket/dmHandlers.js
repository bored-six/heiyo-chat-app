import { getUser, getOrCreateDm, getDmId, addDmMessage } from '../store/index.js';

export function registerDmHandlers(io, socket) {
  // Open (or resume) a DM thread
  socket.on('dm:open', ({ toUserId }) => {
    const from = getUser(socket.id);
    const to = getUser(toUserId);
    if (!from || !to) return;

    const dm = getOrCreateDm(socket.id, toUserId);
    socket.emit('dm:opened', { dm });
  });

  // Send a DM
  socket.on('dm:send', ({ toUserId, text, replyTo }) => {
    const from = getUser(socket.id);
    const to = getUser(toUserId);
    if (!from || !to) return;

    const trimmed = (text || '').trim().slice(0, 2000);
    if (!trimmed) return;

    const safeReplyTo = replyTo?.id
      ? { id: replyTo.id, text: String(replyTo.text ?? '').slice(0, 200), senderName: String(replyTo.senderName ?? '').slice(0, 50) }
      : null;

    const dm = getOrCreateDm(socket.id, toUserId);
    const message = addDmMessage(dm.id, {
      senderId: from.id,
      senderName: from.username,
      senderColor: from.color,
      senderAvatar: from.avatar,
      senderTag: from.tag,
      text: trimmed,
      replyTo: safeReplyTo,
    });

    const payload = { dmId: dm.id, participants: dm.participants, message };

    // Emit to sender
    socket.emit('dm:received', payload);

    // Emit to recipient (if online)
    socket.to(toUserId).emit('dm:received', payload);
  });
}
