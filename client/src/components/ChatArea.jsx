import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import { getMutedRooms, toggleRoomMute } from '../utils/notificationSound.js';

export default function ChatArea() {
  const { me, rooms, dms, activeRoomId, activeDmId, roomMessages, onlineUsers, socket } = useChat();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [mutedRooms, setMutedRooms] = useState(() => getMutedRooms());

  // One-shot listener for invite code response
  useEffect(() => {
    if (!socket || !activeRoomId) return;

    function onInviteCode({ roomId, inviteCode }) {
      if (roomId !== activeRoomId) return;
      const url = `${window.location.origin}/?invite=${inviteCode}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    }

    socket.on('room:invite-code', onInviteCode);
    return () => socket.off('room:invite-code', onInviteCode);
  }, [socket, activeRoomId]);

  function copyInviteLink() {
    if (!activeRoomId || !socket) return;
    socket.emit('room:get-invite', { roomId: activeRoomId });
  }

  function handleToggleMute(roomId) {
    const next = toggleRoomMute(roomId);
    setMutedRooms(new Set(next));
  }

  // ── No selection ──────────────────────────────────────────────────────────
  if (!activeRoomId && !activeDmId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0D0D0D] text-white/25">
        <p>Select a room or DM to start chatting.</p>
      </div>
    );
  }

  // ── Active room ───────────────────────────────────────────────────────────
  if (activeRoomId) {
    const room = rooms.find((r) => r.id === activeRoomId);
    const messages = roomMessages[activeRoomId] ?? [];
    const isMuted = mutedRooms.has(activeRoomId);

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={`# ${room?.name ?? activeRoomId}`}
          onCopyInvite={copyInviteLink}
          inviteCopied={inviteCopied}
          isMuted={isMuted}
          onToggleMute={() => handleToggleMute(activeRoomId)}
        />
        <MessageList messages={messages} myId={me?.id} />
        <TypingIndicator roomId={activeRoomId} />
        <MessageInput roomId={activeRoomId} toUserId={null} />
      </div>
    );
  }

  // ── Active DM ─────────────────────────────────────────────────────────────
  const dm = dms[activeDmId];
  const otherId = dm?.participants.find((id) => id !== me.id);
  const other = onlineUsers[otherId] ?? { username: otherId ?? '…', color: '#6b7280' };
  const messages = dm?.messages ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title={`@ ${other.username}`} color={other.color} />
      <MessageList messages={messages} />
      {/* typing indicators are room-only in the current event contract */}
      <div className="h-5 flex-shrink-0" />
      <MessageInput roomId={null} toUserId={otherId} />
    </div>
  );
}

function Header({ title, color, onCopyInvite, inviteCopied, isMuted, onToggleMute }) {
  return (
    <div
      className="flex h-12 flex-shrink-0 items-center justify-between px-4"
      style={{
        background: 'rgba(13,13,13,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <span className="font-semibold text-[#dcddde]" style={color ? { color } : undefined}>
        {title}
      </span>

      {onCopyInvite && (
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all hover:bg-white/10"
            style={{ color: isMuted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)' }}
          >
            {isMuted ? '🔕' : '🔔'}
          </button>

          {/* Invite link */}
          <button
            onClick={onCopyInvite}
            title="Copy invite link"
            className="flex items-center gap-1.5 rounded-full px-3 py-1 font-heading text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
            style={{
              background: inviteCopied ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${inviteCopied ? 'rgba(0,245,212,0.45)' : 'rgba(255,255,255,0.1)'}`,
              color: inviteCopied ? '#00F5D4' : 'rgba(255,255,255,0.45)',
            }}
          >
            {inviteCopied ? '✓ Copied!' : '🔗 Invite'}
          </button>
        </div>
      )}
    </div>
  );
}
