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
  dbAddRoomMember,
  dbIsRoomMember,
  dbGetRoomsForUser,
  dbSetRoomInviteCode,
  dbGetRoomByInviteCode,
  dbDeleteRoom,
} from '../db/index.js';

const MAX_MESSAGES = 100;

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  users: {},  // socketId → { id, username, color, connectedAt }
  rooms: {},  // roomId  → { id, name, type:'room', members:Set, messages:[], createdAt }
  dms: {},    // dmId    → { id, type:'dm', participants:[], messages:[], createdAt }
};

// ─── Ephemeral activity tracking (not persisted) ──────────────────────────────

// roomId → Map<userId → lastSpokeAt (timestamp)>
const roomSpeakers = new Map();

// messageId → Map<userId → { id, username, color, avatar }>
const messageSeen = new Map();

// ─── Hydration (call once on boot, after initDb()) ───────────────────────────

export function hydrateFromDb() {
  // Load rooms + their messages
  for (const row of dbLoadRooms()) {
    const messages = dbGetMessages(row.id).map(dbRowToMessage);

    // Generate + persist invite code for any room that doesn't have one yet
    let inviteCode = row.invite_code ?? null;
    if (!inviteCode && row.id !== 'general') {
      inviteCode = uuidv4().replace(/-/g, '').slice(0, 10);
      dbSetRoomInviteCode(row.id, inviteCode);
    }

    state.rooms[row.id] = {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      type: 'room',
      members: new Set(),
      messages,
      createdAt: row.created_at,
      createdBy: row.created_by ?? null,
      visibility: row.visibility ?? 'public',
      inviteCode,
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
    senderAvatar: row.sender_avatar ?? 'Stargazer',
    senderTag: row.sender_tag ?? '',
    text: row.text,
    timestamp: row.timestamp,
    reactions: {},
    replyTo: row.reply_to_id
      ? { id: row.reply_to_id, text: row.reply_to_text ?? '', senderName: row.reply_to_sender ?? '' }
      : null,
  };
}

function serializeReactions(reactions) {
  const result = {};
  for (const [emoji, users] of Object.entries(reactions)) {
    result[emoji] = [...users];
  }
  return result;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function addUser(socketId, { username, color, avatar = 'Stargazer', tag = '', bio = '', statusEmoji = '', statusText = '', presenceStatus = 'online', displayName = '', bannerColor = '' }) {
  const user = { id: socketId, username, color, avatar, tag, bio, statusEmoji, statusText, presenceStatus, displayName, bannerColor, connectedAt: Date.now() };
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

export function updateUserAvatar(socketId, avatar) {
  const user = state.users[socketId];
  if (!user) return null;
  user.avatar = avatar;
  return user;
}

export function updateUserProfile(socketId, { bio, statusEmoji, statusText, presenceStatus, displayName, bannerColor }) {
  const user = state.users[socketId];
  if (!user) return null;
  user.bio = bio;
  user.statusEmoji = statusEmoji;
  user.statusText = statusText;
  user.presenceStatus = presenceStatus;
  user.displayName = displayName;
  user.bannerColor = bannerColor ?? '';
  return user;
}

export function setUserPresenceStatus(socketId, status) {
  const user = state.users[socketId];
  if (!user) return null;
  user.presenceStatus = status;
  return user;
}

export function getAllUsers() {
  return Object.values(state.users);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function createRoom(name, description = '', createdBy = null) {
  const id = uuidv4();
  const inviteCode = uuidv4().replace(/-/g, '').slice(0, 10);
  const createdAt = Date.now();
  const room = {
    id,
    name,
    description,
    type: 'room',
    members: new Set(),
    messages: [],
    createdAt,
    createdBy,
    visibility: 'private',
    inviteCode,
  };
  state.rooms[id] = room;
  dbCreateRoom(id, name, createdAt, description, createdBy, 'private', inviteCode); // persist
  // Immediately add creator to room_members so they can join
  if (createdBy) dbAddRoomMember(id, createdBy);
  return room;
}

export function getRoomByInviteCode(code) {
  const row = dbGetRoomByInviteCode(code);
  if (!row) return null;
  return state.rooms[row.id] ?? null;
}

export function getRoom(roomId) {
  return state.rooms[roomId] || null;
}

export function getAllRoomsForUser(username) {
  // General is always included (everyone is implicitly a member)
  const general = state.rooms['general'] ? [serializeRoom(state.rooms['general'])] : [];
  if (!username) return general;

  // Rooms where this user is an explicit member (from DB)
  const memberRooms = dbGetRoomsForUser(username)
    .filter(row => row.id !== 'general')
    .map(row => state.rooms[row.id])
    .filter(Boolean)
    .map(serializeRoom);

  return [...general, ...memberRooms];
}

export function addRoomMember(roomId, username) {
  dbAddRoomMember(roomId, username);
}

export function isRoomMember(roomId, username) {
  if (roomId === 'general') return true;
  if (!username) return false;
  return dbIsRoomMember(roomId, username);
}

export function getUserByUsername(username) {
  return Object.values(state.users).find(u => u.username === username) ?? null;
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

export function addMessage(roomId, { senderId, senderName, senderColor, senderAvatar, senderTag, text, replyTo }) {
  const room = state.rooms[roomId];
  if (!room) return null;

  const message = {
    id: uuidv4(),
    senderId,
    senderName,
    senderColor,
    senderAvatar: senderAvatar ?? 'Stargazer',
    senderTag: senderTag ?? '',
    text,
    timestamp: Date.now(),
    reactions: {},
    replyTo: replyTo ?? null,
  };

  room.messages.push(message);
  if (room.messages.length > MAX_MESSAGES) room.messages.shift();

  dbAddMessage(roomId, message); // persist
  return message;
}

export function getMessages(roomId) {
  return state.rooms[roomId]?.messages ?? [];
}

export function toggleReaction(roomId, messageId, userId, emoji) {
  const room = state.rooms[roomId];
  if (!room) return null;
  const msg = room.messages.find((m) => m.id === messageId);
  if (!msg) return null;
  if (!msg.reactions[emoji]) msg.reactions[emoji] = new Set();
  if (msg.reactions[emoji].has(userId)) {
    msg.reactions[emoji].delete(userId);
    if (msg.reactions[emoji].size === 0) delete msg.reactions[emoji];
  } else {
    msg.reactions[emoji].add(userId);
  }
  return serializeReactions(msg.reactions);
}

export function toggleDmReaction(dmId, messageId, userId, emoji) {
  const dm = state.dms[dmId];
  if (!dm) return null;
  const msg = dm.messages.find((m) => m.id === messageId);
  if (!msg) return null;
  if (!msg.reactions[emoji]) msg.reactions[emoji] = new Set();
  if (msg.reactions[emoji].has(userId)) {
    msg.reactions[emoji].delete(userId);
    if (msg.reactions[emoji].size === 0) delete msg.reactions[emoji];
  } else {
    msg.reactions[emoji].add(userId);
  }
  return serializeReactions(msg.reactions);
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

export function addDmMessage(dmId, { senderId, senderName, senderColor, senderAvatar, senderTag, text, replyTo }) {
  const dm = state.dms[dmId];
  if (!dm) return null;

  const message = {
    id: uuidv4(),
    senderId,
    senderName,
    senderColor,
    senderAvatar: senderAvatar ?? 'Stargazer',
    senderTag: senderTag ?? '',
    text,
    timestamp: Date.now(),
    reactions: {},
    replyTo: replyTo ?? null,
  };

  dm.messages.push(message);
  if (dm.messages.length > MAX_MESSAGES) dm.messages.shift();

  dbAddDmMessage(dmId, message); // persist
  return message;
}

// ─── Activity helpers ─────────────────────────────────────────────────────────

const LURKER_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function recordSpeaker(roomId, userId) {
  if (!roomSpeakers.has(roomId)) roomSpeakers.set(roomId, new Map());
  roomSpeakers.get(roomId).set(userId, Date.now());
}

export function recordMessageSeen(messageId, userId, userObj) {
  if (!messageSeen.has(messageId)) messageSeen.set(messageId, new Map());
  messageSeen.get(messageId).set(userId, userObj);
}

export function getMessageSeenBy(messageId) {
  const seen = messageSeen.get(messageId);
  if (!seen) return [];
  return [...seen.values()];
}

// ─── Room expiry ──────────────────────────────────────────────────────────────

const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity

export function getExpiredRooms() {
  const now = Date.now();
  return Object.values(state.rooms).filter((room) => {
    if (room.id === 'general') return false; // protected — never expires
    const lastActivity = room.messages.at(-1)?.timestamp ?? room.createdAt;
    return now - lastActivity > ROOM_EXPIRY_MS;
  });
}

export function deleteRoom(roomId) {
  delete state.rooms[roomId];
  roomSpeakers.delete(roomId);
  dbDeleteRoom(roomId);
}

// ─── Echoes ───────────────────────────────────────────────────────────────────
// Ephemeral short-lived signals users can pulse. Not persisted to DB.

const echoes = {}; // echoId → echo object

export function addEcho(echoData) {
  echoes[echoData.id] = echoData;
}

export function removeEcho(echoId) {
  const had = !!echoes[echoId];
  delete echoes[echoId];
  return had;
}

export function getActiveEchoes() {
  const now = Date.now();
  return Object.values(echoes).filter(e => e.expiresAt > now);
}

// ─── Serializers ──────────────────────────────────────────────────────────────

export function serializeRoom(room) {
  const now = Date.now();
  const speakers = roomSpeakers.get(room.id) ?? new Map();

  let lurkerCount = 0;
  for (const memberId of room.members) {
    const lastSpoke = speakers.get(memberId);
    if (!lastSpoke || now - lastSpoke > LURKER_THRESHOLD_MS) lurkerCount++;
  }

  const msgs = room.messages;
  const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;

  return {
    id: room.id,
    name: room.name,
    description: room.description ?? '',
    type: room.type,
    memberCount: room.members.size,
    createdAt: room.createdAt,
    createdBy: room.createdBy ?? null,
    visibility: room.visibility ?? 'public',
    lastMessageAt: last?.timestamp ?? null,
    lurkerCount,
    lastMessage: last
      ? { text: last.text.slice(0, 80), senderName: last.senderName, timestamp: last.timestamp }
      : null,
  };
}
