import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  getMessages,
  getRoomMembers,
  getAllRoomsForUser,
  serializeRoom,
  addRoomMember,
  isRoomMember,
  getUserByUsername,
  getRoomByInviteCode,
} from '../store/index.js';

export function registerRoomHandlers(io, socket) {
  // Join a room
  socket.on('room:join', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;

    const username = socket.handshake.auth?.username ?? null;
    if (!isRoomMember(roomId, username)) return; // silently reject non-members

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

    // Broadcast updated room stats only to current room members
    io.to(roomId).emit('room:updated', { room: serializeRoom(room) });
  });

  // Leave a room
  socket.on('room:leave', ({ roomId }) => {
    socket.leave(roomId);
    leaveRoom(roomId, socket.id);

    const room = getRoom(roomId);
    const members = getRoomMembers(roomId);
    io.to(roomId).emit('room:members', { roomId, members });
    socket.emit('room:left', { roomId });

    // Broadcast updated room stats only to remaining room members
    if (room) io.to(roomId).emit('room:updated', { room: serializeRoom(room) });
  });

  // Create a new room — always private, invite-only
  socket.on('room:create', ({ name, description }) => {
    const trimmed = (name || '').trim().slice(0, 50);
    if (!trimmed) return;
    const desc = (description || '').trim().slice(0, 120);
    const createdBy = socket.handshake.auth?.username ?? null;

    const room = createRoom(trimmed, desc, createdBy);

    // Only tell the creator — room is invisible to everyone else
    socket.emit('room:created', { room: serializeRoom(room) });
  });

  // Invite a user to a room by username
  socket.on('room:invite', ({ roomId, username }) => {
    const room = getRoom(roomId);
    if (!room || !username) return;

    const requester = socket.handshake.auth?.username ?? null;
    // Only existing members can invite
    if (!isRoomMember(roomId, requester)) return;
    // Don't invite yourself
    if (username === requester) return;

    // Persist the membership
    addRoomMember(roomId, username);

    // If the target is currently online, push the room to them immediately
    const targetUser = getUserByUsername(username);
    if (targetUser) {
      io.to(targetUser.id).emit('room:invited', { room: serializeRoom(room) });
    }

    // Confirm to the inviter
    socket.emit('room:invite:sent', { roomId, username });
  });

  // Return only rooms this user is a member of
  socket.on('room:list', () => {
    const username = socket.handshake.auth?.username ?? null;
    socket.emit('room:list', { rooms: getAllRoomsForUser(username) });
  });

  // Get invite code for a room (members only)
  socket.on('room:get-invite', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;
    const requester = socket.handshake.auth?.username ?? null;
    if (!isRoomMember(roomId, requester)) return;
    socket.emit('room:invite-code', { roomId, inviteCode: room.inviteCode });
  });

  // Join a room via invite code
  socket.on('room:join-by-code', ({ code }) => {
    if (!code) return;
    const room = getRoomByInviteCode(code);
    if (!room) {
      socket.emit('room:join-by-code:error', { error: 'Invalid invite link.' });
      return;
    }
    const username = socket.handshake.auth?.username ?? null;
    if (!username) {
      socket.emit('room:join-by-code:error', { error: 'Sign in to join via invite link.' });
      return;
    }
    if (!isRoomMember(room.id, username)) {
      addRoomMember(room.id, username);
    }
    socket.emit('room:invited', { room: serializeRoom(room) });
  });
}
