import { getUser, getUserByUsername } from '../store/index.js';
import { dbGetUser, dbAddFollow, dbRemoveFollow } from '../db/index.js';

export function registerFollowHandlers(io, socket) {
  const followerUsername = socket.handshake.auth?.username;
  const followerIsRegistered = !!dbGetUser(followerUsername);

  // user:follow — add a user to your orbit
  socket.on('user:follow', ({ userId }) => {
    if (!followerIsRegistered) return; // guests can't persist follows

    const targetUser = getUser(userId);
    if (!targetUser) return;
    if (targetUser.username === followerUsername) return; // can't follow self

    // Persist only if the followed user is also registered (has a stable username)
    const followedIsRegistered = !!dbGetUser(targetUser.username);
    if (followedIsRegistered) {
      dbAddFollow(followerUsername, targetUser.username);
    }

    socket.emit('user:followed', { user: { ...targetUser, online: true } });
  });

  // user:unfollow — release a user from your orbit
  socket.on('user:unfollow', ({ username }) => {
    if (!followerIsRegistered) return;
    dbRemoveFollow(followerUsername, username);
    socket.emit('user:unfollowed', { username });
  });
}
