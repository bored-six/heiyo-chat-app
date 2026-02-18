import { v4 as uuidv4 } from 'uuid';

const MAX_MESSAGES = 100;

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  users: {},   // socketId → { id, username, color, connectedAt }
  rooms: {},   // roomId  → { id, name, type:'room', members:Set, messages:[] }
  dms: {},     // dmId    → { id, type:'dm', participants:[], messages:[] }
};

// Seed default General room
state.rooms['general'] = {
  id: 'general',
  name: 'General',
  type: 'room',
  members: new Set(),
  messages: [],
  createdAt: Date.now(),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export function addUser(socketId, { username, color }) {
  const user = { id: socketId, username, color, connectedAt: Date.now() };
  state.users[socketId] = user;
  return user;
}

export function removeUser(socketId) {
  const user = state.users[socketId];
  delete state.users[socketId];
  // Remove from all room member sets
  Object.values(state.rooms).forEach((room) => room.members.delete(socketId));
  return user;
}

export function getUser(socketId) {
  return state.users[socketId] || null;
}

export function getAllUsers() {
  return Object.values(state.users);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function createRoom(name) {
  const id = uuidv4();
  const room = {
    id,
    name,
    type: 'room',
    members: new Set(),
    messages: [],
    createdAt: Date.now(),
  };
  state.rooms[id] = room;
  return room;
}

export function getRoom(roomId) {
  return state.rooms[roomId] || null;
}

export function getAllRooms() {
  return Object.values(state.rooms).map(serializeRoom);
}

export function joinRoom(roomId, socketId) {
  const room = state.rooms[roomId];
  if (!room) return null;
  room.members.add(socketId);
  return room;
}

export function leaveRoom(roomId, socketId) {
  const room = state.rooms[roomId];
  if (!room) return;
  room.members.delete(socketId);
}

export function getRoomMembers(roomId) {
  const room = state.rooms[roomId];
  if (!room) return [];
  return [...room.members]
    .map((id) => state.users[id])
    .filter(Boolean);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function addMessage(roomId, { senderId, senderName, senderColor, text }) {
  const room = state.rooms[roomId];
  if (!room) return null;
  const message = {
    id: uuidv4(),
    senderId,
    senderName,
    senderColor,
    text,
    timestamp: Date.now(),
  };
  room.messages.push(message);
  if (room.messages.length > MAX_MESSAGES) {
    room.messages.shift();
  }
  return message;
}

export function getMessages(roomId) {
  return state.rooms[roomId]?.messages ?? [];
}

// ─── DMs ──────────────────────────────────────────────────────────────────────

export function getDmId(userIdA, userIdB) {
  return [userIdA, userIdB].sort().join('--');
}

export function getOrCreateDm(userIdA, userIdB) {
  const dmId = getDmId(userIdA, userIdB);
  if (!state.dms[dmId]) {
    state.dms[dmId] = {
      id: dmId,
      type: 'dm',
      participants: [userIdA, userIdB],
      messages: [],
      createdAt: Date.now(),
    };
  }
  return state.dms[dmId];
}

export function addDmMessage(dmId, { senderId, senderName, senderColor, text }) {
  const dm = state.dms[dmId];
  if (!dm) return null;
  const message = {
    id: uuidv4(),
    senderId,
    senderName,
    senderColor,
    text,
    timestamp: Date.now(),
  };
  dm.messages.push(message);
  if (dm.messages.length > MAX_MESSAGES) {
    dm.messages.shift();
  }
  return message;
}

// ─── Serializers (convert Sets → arrays for JSON) ─────────────────────────────

export function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    memberCount: room.members.size,
    createdAt: room.createdAt,
  };
}
