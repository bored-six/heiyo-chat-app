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
    CREATE TABLE IF NOT EXISTS rooms (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id           TEXT PRIMARY KEY,
      room_id      TEXT NOT NULL,
      sender_id    TEXT NOT NULL,
      sender_name  TEXT NOT NULL,
      sender_color TEXT NOT NULL,
      text         TEXT NOT NULL,
      timestamp    INTEGER NOT NULL,
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
      id           TEXT PRIMARY KEY,
      dm_id        TEXT NOT NULL,
      sender_id    TEXT NOT NULL,
      sender_name  TEXT NOT NULL,
      sender_color TEXT NOT NULL,
      text         TEXT NOT NULL,
      timestamp    INTEGER NOT NULL,
      FOREIGN KEY (dm_id) REFERENCES dms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_dm_messages_dm ON dm_messages(dm_id, timestamp);
  `);

  // Seed General room (upsert — safe to call on every boot)
  db.prepare(`
    INSERT OR IGNORE INTO rooms (id, name, created_at)
    VALUES (?, ?, ?)
  `).run(GENERAL_ROOM_ID, 'General', Date.now());

  console.log(`[db] SQLite ready at ${DB_PATH}`);
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function dbCreateRoom(id, name, createdAt) {
  db.prepare(`
    INSERT OR IGNORE INTO rooms (id, name, created_at) VALUES (?, ?, ?)
  `).run(id, name, createdAt);
}

export function dbLoadRooms() {
  return db.prepare('SELECT * FROM rooms ORDER BY created_at ASC').all();
}

// ─── Room messages ────────────────────────────────────────────────────────────

export function dbAddMessage(roomId, { id, senderId, senderName, senderColor, text, timestamp }) {
  db.prepare(`
    INSERT INTO messages (id, room_id, sender_id, sender_name, sender_color, text, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, roomId, senderId, senderName, senderColor, text, timestamp);

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

export function dbAddDmMessage(dmId, { id, senderId, senderName, senderColor, text, timestamp }) {
  db.prepare(`
    INSERT INTO dm_messages (id, dm_id, sender_id, sender_name, sender_color, text, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, dmId, senderId, senderName, senderColor, text, timestamp);

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
