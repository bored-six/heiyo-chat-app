import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { initSocket } from './socket/index.js';
import { initDb, dbCreateUser, dbGetUser, dbUsernameExists } from './db/index.js';
import { hydrateFromDb } from './store/index.js';
import { generateUser } from './utils/nameGenerator.js';

const PORT = 3001;

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Auth routes ──────────────────────────────────────────────────────────────

const COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
  '#607d8b', '#795548', '#4caf50', '#ff9800', '#673ab7',
];
function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

const VALID_AVATARS = new Set([
  'Blazeheart', 'Moonpetal',  'Crystalveil', 'Shadowpeak',
  'Goldenwing', 'Frostbyte',  'Cosmicray',   'Thunderpaw',
  'Stargazer',  'Pinkmochi',  'Neonrush',    'Mistwalker',
  'Voidwalker', 'Sunbeam',    'Crimsonpaw',  'Cyberwave',
  'Prismatic',  'Darknight',
]);

app.post('/auth/register', async (req, res) => {
  const { username, password, avatar } = req.body ?? {};

  if (!username || typeof username !== 'string' || username.trim().length === 0)
    return res.status(400).json({ error: 'Username is required.' });
  if (username.trim().length > 15)
    return res.status(400).json({ error: 'Username must be 15 characters or fewer.' });
  if (!password || typeof password !== 'string' || password.length < 1)
    return res.status(400).json({ error: 'Password is required.' });

  const name = username.trim();
  if (dbUsernameExists(name))
    return res.status(409).json({ error: 'Username already taken.' });

  const chosenAvatar = VALID_AVATARS.has(avatar) ? avatar : 'Stargazer';
  const hash = await bcrypt.hash(password, 10);
  const color = randomColor();
  const tag = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  dbCreateUser(name, hash, color, chosenAvatar, tag);

  return res.json({ username: name, color, avatar: chosenAvatar, tag });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  const row = dbGetUser(username.trim());
  if (!row)
    return res.status(401).json({ error: 'Invalid username or password.' });

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match)
    return res.status(401).json({ error: 'Invalid username or password.' });

  return res.json({ username: row.username, color: row.color, avatar: row.avatar ?? 'Stargazer', tag: row.tag ?? '' });
});

app.post('/auth/guest', (_req, res) => {
  const { username, color } = generateUser();
  const guestAvatars = [...VALID_AVATARS];
  const avatar = guestAvatars[Math.floor(Math.random() * guestAvatars.length)];
  return res.json({ username, color, avatar, isGuest: true });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Boot sequence: DB first, then hydrate memory, then accept connections
initDb();
hydrateFromDb();
initSocket(io);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] Port ${PORT} in use — waiting for it to free up…`);
    // Exit cleanly so node --watch retries once the previous process releases the port
    process.exit(1);
  } else {
    throw err;
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
