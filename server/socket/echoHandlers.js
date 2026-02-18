import { v4 as uuidv4 } from 'uuid';
import { getUser, addEcho, removeEcho } from '../store/index.js';

const ECHO_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function registerEchoHandlers(io, socket) {
  socket.on('echo:pulse', ({ text, fromRoom }) => {
    const user = getUser(socket.id);
    if (!user) return;

    const clean = String(text ?? '').trim().slice(0, 30);
    if (!clean) return;

    const echo = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      color: user.color,
      avatar: user.avatar ?? 'Stargazer',
      tag: user.tag ?? '',
      text: clean,
      fromRoom: typeof fromRoom === 'string' ? fromRoom.slice(0, 32) : null,
      createdAt: Date.now(),
      expiresAt: Date.now() + ECHO_DURATION_MS,
    };

    addEcho(echo);
    io.emit('echo:new', { echo });

    // Auto-expire: notify all clients when this echo fades
    setTimeout(() => {
      if (removeEcho(echo.id)) {
        io.emit('echo:expire', { echoId: echo.id });
      }
    }, ECHO_DURATION_MS);
  });
}
