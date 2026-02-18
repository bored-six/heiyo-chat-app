import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initSocket } from './socket/index.js';
import { initDb } from './db/index.js';
import { hydrateFromDb } from './store/index.js';

const PORT = 3001;

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
