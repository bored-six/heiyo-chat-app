import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'chat.db');

const GENERAL_ROOM_ID = 'general';
const MAX_MESSAGES = 100;

let db;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initDb() {
  mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // better concurrent read performance

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username      TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      color         TEXT NOT NULL,
      avatar        TEXT NOT NULL DEFAULT 'Stargazer',
      tag           TEXT NOT NULL DEFAULT '',
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id             TEXT PRIMARY KEY,
      room_id        TEXT NOT NULL,
      sender_id      TEXT NOT NULL,
      sender_name    TEXT NOT NULL,
      sender_color   TEXT NOT NULL,
      sender_avatar  TEXT NOT NULL DEFAULT 'Stargazer',
      sender_tag     TEXT NOT NULL DEFAULT '',
      text           TEXT NOT NULL,
      timestamp      INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, timestamp);

    CREATE TABLE IF NOT EXISTS dms (
      id            TEXT PRIMARY KEY,
      participant_a TEXT NOT NULL,
      participant_b TEXT NOT NULL,
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dm_messages (
      id             TEXT PRIMARY KEY,
      dm_id          TEXT NOT NULL,
      sender_id      TEXT NOT NULL,
      sender_name    TEXT NOT NULL,
      sender_color   TEXT NOT NULL,
      sender_avatar  TEXT NOT NULL DEFAULT 'Stargazer',
      sender_tag     TEXT NOT NULL DEFAULT '',
      text           TEXT NOT NULL,
      timestamp      INTEGER NOT NULL,
      FOREIGN KEY (dm_id) REFERENCES dms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_dm_messages_dm ON dm_messages(dm_id, timestamp);

    CREATE TABLE IF NOT EXISTS room_members (
      room_id  TEXT NOT NULL,
      username TEXT NOT NULL,
      PRIMARY KEY (room_id, username)
    );
  `);

  // Follows table (created here so it exists from first boot)
  db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      follower   TEXT NOT NULL,
      followed   TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (follower, followed)
    );
  `);

  // Migrate: add new columns if missing (safe to run on existing DBs)
  try { db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT 'Stargazer'`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  // Backfill tag for users who got the empty-string default (pre-tag accounts)
  {
    const untagged = db.prepare(`SELECT username FROM users WHERE tag = ''`).all();
    const setTag = db.prepare(`UPDATE users SET tag = ? WHERE username = ?`);
    for (const { username } of untagged) {
      const tag = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      setTag.run(tag, username);
    }
  }
  try { db.exec(`ALTER TABLE messages ADD COLUMN sender_avatar TEXT NOT NULL DEFAULT 'Stargazer'`); } catch (_) {}
  try { db.exec(`ALTER TABLE messages ADD COLUMN sender_tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE dm_messages ADD COLUMN sender_avatar TEXT NOT NULL DEFAULT 'Stargazer'`); } catch (_) {}
  try { db.exec(`ALTER TABLE dm_messages ADD COLUMN sender_tag TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE rooms ADD COLUMN description TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE rooms ADD COLUMN created_by TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE rooms ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'`); } catch (_) {}
  try { db.exec(`ALTER TABLE rooms ADD COLUMN invite_code TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE messages ADD COLUMN reply_to_id TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE messages ADD COLUMN reply_to_text TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE messages ADD COLUMN reply_to_sender TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE dm_messages ADD COLUMN reply_to_id TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE dm_messages ADD COLUMN reply_to_text TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE dm_messages ADD COLUMN reply_to_sender TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN status_emoji TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN status_text TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN pronouns TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN presence_status TEXT NOT NULL DEFAULT 'online'`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN banner_color TEXT NOT NULL DEFAULT ''`); } catch (_) {}

  // Seed General room (upsert — safe to call on every boot)
  db.prepare(`
    INSERT OR IGNORE INTO rooms (id, name, created_at)
    VALUES (?, ?, ?)
  `).run(GENERAL_ROOM_ID, 'General', Date.now());

  console.log(`[db] SQLite ready at ${DB_PATH}`);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function dbCreateRoom(id, name, createdAt, description = '', createdBy = null, visibility = 'public', inviteCode = null) {
  db.prepare(`
    INSERT OR IGNORE INTO rooms (id, name, description, created_at, created_by, visibility, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description, createdAt, createdBy, visibility, inviteCode);
}

export function dbSetRoomInviteCode(roomId, inviteCode) {
  db.prepare(`UPDATE rooms SET invite_code = ? WHERE id = ?`).run(inviteCode, roomId);
}

export function dbGetRoomByInviteCode(inviteCode) {
  return db.prepare(`SELECT * FROM rooms WHERE invite_code = ?`).get(inviteCode) ?? null;
}

export function dbLoadRooms() {
  return db.prepare('SELECT * FROM rooms ORDER BY created_at ASC').all();
}

export function dbAddRoomMember(roomId, username) {
  db.prepare(`INSERT OR IGNORE INTO room_members (room_id, username) VALUES (?, ?)`).run(roomId, username);
}

export function dbIsRoomMember(roomId, username) {
  return !!db.prepare(`SELECT 1 FROM room_members WHERE room_id = ? AND username = ?`).get(roomId, username);
}

export function dbGetRoomsForUser(username) {
  return db.prepare(`
    SELECT r.* FROM rooms r
    INNER JOIN room_members rm ON rm.room_id = r.id
    WHERE rm.username = ?
    ORDER BY r.created_at ASC
  `).all(username);
}

// ─── Room messages ────────────────────────────────────────────────────────────

export function dbAddMessage(roomId, { id, senderId, senderName, senderColor, senderAvatar, senderTag, text, timestamp, replyTo }) {
  db.prepare(`
    INSERT INTO messages (id, room_id, sender_id, sender_name, sender_color, sender_avatar, sender_tag, text, timestamp, reply_to_id, reply_to_text, reply_to_sender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, roomId, senderId, senderName, senderColor, senderAvatar ?? 'Stargazer', senderTag ?? '', text, timestamp, replyTo?.id ?? null, replyTo?.text ?? null, replyTo?.senderName ?? null);

  // Enforce 100-message cap per room
  db.prepare(`
    DELETE FROM messages
    WHERE room_id = ?
      AND id NOT IN (
        SELECT id FROM messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT ?
      )
  `).run(roomId, roomId, MAX_MESSAGES);
}

export function dbGetMessages(roomId) {
  return db.prepare(`
    SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC LIMIT ?
  `).all(roomId, MAX_MESSAGES);
}

// ─── DMs ──────────────────────────────────────────────────────────────────────

export function dbUpsertDm(id, participantA, participantB, createdAt) {
  db.prepare(`
    INSERT OR IGNORE INTO dms (id, participant_a, participant_b, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, participantA, participantB, createdAt);
}

export function dbLoadDms() {
  return db.prepare('SELECT * FROM dms ORDER BY created_at ASC').all();
}

// ─── DM messages ──────────────────────────────────────────────────────────────

export function dbAddDmMessage(dmId, { id, senderId, senderName, senderColor, senderAvatar, senderTag, text, timestamp, replyTo }) {
  db.prepare(`
    INSERT INTO dm_messages (id, dm_id, sender_id, sender_name, sender_color, sender_avatar, sender_tag, text, timestamp, reply_to_id, reply_to_text, reply_to_sender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, dmId, senderId, senderName, senderColor, senderAvatar ?? 'Stargazer', senderTag ?? '', text, timestamp, replyTo?.id ?? null, replyTo?.text ?? null, replyTo?.senderName ?? null);

  // Enforce 100-message cap per DM thread
  db.prepare(`
    DELETE FROM dm_messages
    WHERE dm_id = ?
      AND id NOT IN (
        SELECT id FROM dm_messages WHERE dm_id = ? ORDER BY timestamp DESC LIMIT ?
      )
  `).run(dmId, dmId, MAX_MESSAGES);
}

export function dbGetDmMessages(dmId) {
  return db.prepare(`
    SELECT * FROM dm_messages WHERE dm_id = ? ORDER BY timestamp ASC LIMIT ?
  `).all(dmId, MAX_MESSAGES);
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────

export function dbCreateUser(username, passwordHash, color, avatar = 'Stargazer', tag = '') {
  db.prepare(`
    INSERT INTO users (username, password_hash, color, avatar, tag, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, passwordHash, color, avatar, tag, Date.now());
}

export function dbGetUser(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) ?? null;
}

export function dbUpdateUserAvatar(username, avatar) {
  db.prepare('UPDATE users SET avatar = ? WHERE username = ?').run(avatar, username);
}

export function dbUpdateUserProfile(username, { bio, statusEmoji, statusText, presenceStatus, displayName, bannerColor }) {
  db.prepare('UPDATE users SET bio = ?, status_emoji = ?, status_text = ?, presence_status = ?, display_name = ?, banner_color = ? WHERE username = ?')
    .run(bio, statusEmoji, statusText, presenceStatus, displayName, bannerColor ?? '', username);
}

export function dbUsernameExists(username) {
  return !!db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export function dbAddFollow(follower, followed) {
  db.prepare(`INSERT OR IGNORE INTO follows (follower, followed, created_at) VALUES (?, ?, ?)`)
    .run(follower, followed, Date.now());
}

export function dbRemoveFollow(follower, followed) {
  db.prepare(`DELETE FROM follows WHERE follower = ? AND followed = ?`).run(follower, followed);
}

export function dbIsFollowing(follower, followed) {
  return !!db.prepare(`SELECT 1 FROM follows WHERE follower = ? AND followed = ?`).get(follower, followed);
}

export function dbGetFollowingProfiles(follower) {
  return db.prepare(`
    SELECT u.username, u.color, u.avatar, u.tag
    FROM follows f
    JOIN users u ON u.username = f.followed
    WHERE f.follower = ?
    ORDER BY f.created_at ASC
  `).all(follower);
}

// ─── Room deletion ─────────────────────────────────────────────────────────────

export function dbDeleteRoom(roomId) {
  db.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM room_members WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
}
