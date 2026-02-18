import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Creates and manages the Socket.IO connection.
 * Wires every server→client event to dispatch so ChatContext state stays current.
 * Returns the socket instance (stable ref, safe to call .emit() on).
 */
export function useSocket(dispatch, authUser, stateRef) {
  const socketRef = useRef(null);

  // Initialise synchronously so the ref is never null after first render
  if (!socketRef.current) {
    socketRef.current = io('http://localhost:3001', { autoConnect: false });
  }

  useEffect(() => {
    // Don't connect until auth is resolved
    if (!authUser) return;

    const socket = socketRef.current;

    // Pass identity in the handshake so server knows who this is
    socket.auth = { username: authUser.username, color: authUser.color, avatar: authUser.avatar, tag: authUser.tag ?? '' };

    // ── Connection lifecycle ────────────────────────────────────────────────

    socket.on('connected', ({ user, rooms, echoes }) => {
      dispatch({ type: 'CONNECTED', user, rooms, echoes: echoes ?? [] });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'DISCONNECTED' });
    });

    socket.on('connect_error', () => {
      dispatch({ type: 'DISCONNECTED' });
    });

    // ── Users ───────────────────────────────────────────────────────────────

    socket.on('user:online', ({ user }) => {
      dispatch({ type: 'USER_ONLINE', user });
    });

    socket.on('user:offline', ({ userId }) => {
      dispatch({ type: 'USER_OFFLINE', userId });
    });

    socket.on('user:updated', ({ user }) => {
      dispatch({ type: 'USER_UPDATED', user });
    });

    // ── Rooms ───────────────────────────────────────────────────────────────

    socket.on('room:list', ({ rooms }) => {
      dispatch({ type: 'SET_ROOMS', rooms });
    });

    socket.on('room:created', ({ room }) => {
      dispatch({ type: 'ROOM_CREATED', room });
    });

    socket.on('room:joined', ({ room, messages, members }) => {
      dispatch({ type: 'ROOM_JOINED', room, messages, members });
      // Mark the last message as seen when entering a room
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        socket.emit('message:seen', { roomId: room.id, messageId: last.id });
      }
    });

    socket.on('room:members', ({ roomId, members }) => {
      dispatch({ type: 'ROOM_MEMBERS', roomId, members });
    });

    socket.on('room:left', ({ roomId }) => {
      dispatch({ type: 'ROOM_LEFT', roomId });
    });

    // ── Messages ────────────────────────────────────────────────────────────

    socket.on('message:received', ({ roomId, message }) => {
      dispatch({ type: 'MESSAGE_RECEIVED', roomId, message });
      // If this room is currently open, immediately mark the message as seen
      if (stateRef?.current?.activeRoomId === roomId) {
        socket.emit('message:seen', { roomId, messageId: message.id });
      }
    });

    socket.on('reaction:update', ({ messageId, roomId, dmId, reactions }) => {
      dispatch({ type: 'REACTION_UPDATE', messageId, roomId, dmId, reactions });
    });

    socket.on('room:updated', ({ room }) => {
      dispatch({ type: 'ROOM_UPDATED', room });
    });

    socket.on('message:seen', ({ roomId, messageId, seenBy }) => {
      dispatch({ type: 'MESSAGE_SEEN', roomId, messageId, seenBy });
    });

    // ── DMs ─────────────────────────────────────────────────────────────────

    socket.on('dm:opened', ({ dm }) => {
      dispatch({ type: 'DM_OPENED', dm });
      dispatch({ type: 'SET_ACTIVE_DM', dmId: dm.id });
    });

    socket.on('dm:received', ({ dmId, participants, message }) => {
      dispatch({ type: 'DM_RECEIVED', dmId, participants, message });
    });

    // ── Echoes ──────────────────────────────────────────────────────────────

    socket.on('echo:new', ({ echo }) => {
      dispatch({ type: 'ECHO_NEW', echo });
    });

    socket.on('echo:expire', ({ echoId }) => {
      dispatch({ type: 'ECHO_EXPIRE', echoId });
    });

    // ── Typing ──────────────────────────────────────────────────────────────

    socket.on('typing:update', ({ roomId, typers }) => {
      dispatch({ type: 'TYPING_UPDATE', roomId, typers });
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [dispatch, authUser]);

  return socketRef.current;
}
