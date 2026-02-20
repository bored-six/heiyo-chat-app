import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import { getMutedRooms, toggleRoomMute } from '../utils/notificationSound.js';

function SoundIcon({ muted }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {muted ? (
        <>
          <rect x="1" y="7" width="3" height="2" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="6" y="7" width="3" height="2" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="11" y="7" width="3" height="2" rx="1" fill="currentColor" opacity="0.5" />
          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="1" y="6" width="3" height="4" rx="1" fill="currentColor" className="sound-bar-1" />
          <rect x="6" y="3" width="3" height="10" rx="1" fill="currentColor" className="sound-bar-2" />
          <rect x="11" y="5" width="3" height="6" rx="1" fill="currentColor" className="sound-bar-3" />
        </>
      )}
    </svg>
  );
}

function DmAvatarPair({ me, other }) {
  const getInitial = (u) => (u?.username || u?.displayName || '?')[0].toUpperCase();
  const getBg = (u) => u?.color || '#7B2FFF';

  const Avatar = ({ user, style }) => (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: getBg(user),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700,
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.15)',
      overflow: 'hidden',
      flexShrink: 0,
      ...style,
    }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        getInitial(user)
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 48, height: 28 }}>
        <Avatar user={me} style={{ position: 'absolute', left: 0, zIndex: 1 }} />
        <svg style={{ position: 'absolute', left: 0, top: 0, width: 48, height: 28, pointerEvents: 'none' }}
             viewBox="0 0 48 28">
          <path d="M 14 14 Q 24 4 34 14" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
        </svg>
        <Avatar user={other} style={{ position: 'absolute', right: 0, zIndex: 2 }} />
      </div>
      <span style={{ fontWeight: 600, fontSize: 14 }}>
        {other?.displayName || other?.username || 'Direct Message'}
      </span>
    </div>
  );
}

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
      <Header titleNode={<DmAvatarPair me={me} other={other} />} />
      <MessageList messages={messages} />
      {/* typing indicators are room-only in the current event contract */}
      <div className="h-5 flex-shrink-0" />
      <MessageInput roomId={null} toUserId={otherId} />
    </div>
  );
}

const BURST_PARTICLES = [
  { color: '#00F5D4', dx: '-22px', dy: '-30px', delay: '0ms'  },
  { color: '#FF3AF2', dx: '20px',  dy: '-34px', delay: '30ms' },
  { color: '#FFE600', dx: '-32px', dy: '-10px', delay: '15ms' },
  { color: '#00F5D4', dx: '30px',  dy: '-12px', delay: '45ms' },
  { color: '#FF3AF2', dx: '-14px', dy: '26px',  delay: '20ms' },
  { color: '#FFE600', dx: '24px',  dy: '22px',  delay: '10ms' },
  { color: '#7B2FFF', dx: '2px',   dy: '-38px', delay: '35ms' },
  { color: '#FF6B35', dx: '-28px', dy: '16px',  delay: '25ms' },
];

function Header({ title, titleNode, color, onCopyInvite, inviteCopied, isMuted, onToggleMute }) {
  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => {
    if (inviteCopied) setBurstKey(k => k + 1);
  }, [inviteCopied]);

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
      {titleNode ?? (
        <span className="font-semibold text-[#dcddde]" style={color ? { color } : undefined}>
          {title}
        </span>
      )}

      {onCopyInvite && (
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all hover:bg-white/10"
            style={{ color: isMuted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)' }}
          >
            <SoundIcon muted={isMuted} />
          </button>

          {/* Invite link + particle burst wrapper */}
          <div className="relative">
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
            {inviteCopied && (
              <div key={burstKey} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
                {BURST_PARTICLES.map((p, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full animate-burst-particle"
                    style={{
                      left: '50%',
                      top: '50%',
                      backgroundColor: p.color,
                      '--dx': p.dx,
                      '--dy': p.dy,
                      animationDelay: p.delay,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
