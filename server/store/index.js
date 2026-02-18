import { v4 as uuidv4 } from 'uuid';
import {
  dbCreateRoom,
  dbLoadRooms,
  dbAddMessage,
  dbGetMessages,
  dbUpsertDm,
  dbLoadDms,
  dbAddDmMessage,
  dbGetDmMessages,
} from '../db/index.js';

const MAX_MESSAGES = 100;

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  users: {},  // socketId → { id, username, color, connectedAt }
  rooms: {},  // roomId  → { id, name, type:'room', members:Set, messages:[], createdAt }
  dms: {},    // dmId    → { id, type:'dm', participants:[], messages:[], createdAt }
};

// ─── Hydration (call once on boot, after initDb()) ───────────────────────────

export function hydrateFromDb() {
  // Load rooms + their messages
  for (const row of dbLoadRooms()) {
    const messages = dbGetMessages(row.id).map(dbRowToMessage);
    state.rooms[row.id] = {
      id: row.id,
      name: row.name,
      type: 'room',
      members: new Set(),
      messages,
      createdAt: row.created_at,
    };
  }

  // Load DM threads + their messages
  for (const row of dbLoadDms()) {
    const messages = dbGetDmMessages(row.id).map(dbRowToMessage);
    state.dms[row.id] = {
      id: row.id,
      type: 'dm',
      participants: [row.participant_a, row.participant_b],
      messages,
      createdAt: row.created_at,
    };
  }

  const roomCount = Object.keys(state.rooms).length;
  const dmCount = Object.keys(state.dms).length;
  console.log(`[store] Hydrated ${roomCount} room(s), ${dmCount} DM thread(s) from DB`);
}

// ─── Row → message object ─────────────────────────────────────────────────────

function dbRowToMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderColor: row.sender_color,
    text: row.text,
    timestamp: row.timestamp,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function addUser(socketId, { username, color, avatar = '🌟' }) {
  const user = { id: socketId, username, color, avatar, connectedAt: Date.now() };
  state.users[socketId] = user;
  return user;
}

export function removeUser(socketId) {
  const user = state.users[socketId];
  delete state.users[socketId];
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
  const createdAt = Date.now();
  const room = {
    id,
    name,
    type: 'room',
    members: new Set(),
    messages: [],
    createdAt,
  };
  state.rooms[id] = room;
  dbCreateRoom(id, name, createdAt); // persist
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
  return [...room.members].map((id) => state.users[id]).filter(Boolean);
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
  if (room.messages.length > MAX_MESSAGES) room.messages.shift();

  dbAddMessage(roomId, message); // persist
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
    const createdAt = Date.now();
    state.dms[dmId] = {
      id: dmId,
      type: 'dm',
      participants: [userIdA, userIdB],
      messages: [],
      createdAt,
    };
    dbUpsertDm(dmId, userIdA, userIdB, createdAt); // persist
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
  if (dm.messages.length > MAX_MESSAGES) dm.messages.shift();

  dbAddDmMessage(dmId, message); // persist
  return message;
}

// ─── Serializers ──────────────────────────────────────────────────────────────

export function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    memberCount: room.members.size,
    createdAt: room.createdAt,
  };
}
