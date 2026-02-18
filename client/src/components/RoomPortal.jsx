import { useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { avatarUrl } from '../utils/avatar.js';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const ACCENTS = ['#FF3AF2', '#00F5D4', '#FFE600', '#FF6B35', '#7B2FFF'];
const CLASH   = ['#FFE600', '#FF6B35', '#FF3AF2', '#00F5D4', '#FFE600'];

export default function RoomPortal() {
  const {
    me, rooms, dms, activeRoomId, activeDmId,
    roomMessages, roomMembers, onlineUsers, dispatch,
  } = useChat();

  // Return to the Bubble Universe — SET_ACTIVE_ROOM with null clears both
  // activeRoomId and activeDmId via the reducer.
  function exitToVoid() {
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId: null });
  }

  // ── Active room ────────────────────────────────────────────────────────────
  if (activeRoomId) {
    const room      = rooms.find((r) => r.id === activeRoomId);
    const roomIndex = rooms.findIndex((r) => r.id === activeRoomId);
    const accent    = ACCENTS[roomIndex % ACCENTS.length];
    const clash     = CLASH[roomIndex % CLASH.length];
    const messages  = roomMessages[activeRoomId] ?? [];
    const members   = roomMembers[activeRoomId]  ?? [];

    return (
      <Portal
        title={room?.name ?? activeRoomId}
        accent={accent}
        clash={clash}
        onExit={exitToVoid}
        members={members}
      >
        <MessageList messages={messages} myId={me?.id} />
        <TypingIndicator roomId={activeRoomId} />
        <MessageInput roomId={activeRoomId} toUserId={null} accent={accent} clash={clash} />
      </Portal>
    );
  }

  // ── Active DM ──────────────────────────────────────────────────────────────
  const dm      = dms[activeDmId];
  const otherId = dm?.participants.find((id) => id !== me.id);
  const other   = onlineUsers[otherId] ?? { username: otherId ?? '…', color: '#FF3AF2' };
  const messages = dm?.messages ?? [];
  const accent  = other.color ?? '#FF3AF2';

  return (
    <Portal title={`@ ${other.username}`} accent={accent} clash="#FFE600" onExit={exitToVoid}>
      <MessageList messages={messages} myId={me?.id} />
      <div className="h-6 flex-shrink-0" />
      <MessageInput roomId={null} toUserId={otherId} accent={accent} clash="#FFE600" />
    </Portal>
  );
}

// ── Shared portal shell ────────────────────────────────────────────────────
const MEMBER_MAX = 5;

function Portal({ title, accent, clash, onExit, children, members = [] }) {
  const [showMembers, setShowMembers] = useState(false);
  const visible  = members.slice(0, MEMBER_MAX);
  const overflow = members.length - MEMBER_MAX;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
      <div
        className="animate-portal-in flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(13,13,26,0.88)',
          border: `4px solid ${clash}`,
          boxShadow: `
            0 0 60px ${accent}55,
            0 0 120px ${accent}22,
            12px 12px 0 ${clash},
            24px 24px 0 ${accent}66
          `,
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex flex-shrink-0 items-center justify-between border-b-4 border-dashed px-6 py-4"
          style={{
            borderColor: accent,
            background: `linear-gradient(135deg, ${accent}18, transparent)`,
          }}
        >
          {/* Left: title + member avatar row */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-gradient">
              {title}
            </h2>

            {visible.length > 0 && (
              <button
                onClick={() => setShowMembers((v) => !v)}
                className="flex items-center gap-1 transition-opacity hover:opacity-80"
                title="Toggle member list"
              >
                {visible.map((m) => (
                  <img
                    key={m.id}
                    src={avatarUrl(m.avatar ?? m.username)}
                    alt={m.username}
                    title={m.username}
                    className="h-6 w-6 rounded-full"
                    style={{
                      border: `2px solid ${m.color ?? accent}`,
                      boxShadow: `0 0 6px ${m.color ?? accent}55`,
                    }}
                  />
                ))}
                {overflow > 0 && (
                  <span className="ml-0.5 font-heading text-[10px] font-black text-white/40">
                    +{overflow}
                  </span>
                )}
                <span
                  className="ml-1 font-heading text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {members.length} {showMembers ? '▴' : '▾'}
                </span>
              </button>
            )}
          </div>

          <button
            onClick={onExit}
            className="ml-4 flex-shrink-0 rounded-full border-4 border-dashed px-5 py-2 font-heading text-sm font-black uppercase tracking-widest transition-all duration-200 hover:scale-110 hover:brightness-125"
            style={{
              borderColor: clash,
              color: clash,
              boxShadow: `0 0 12px ${clash}55`,
            }}
            aria-label="Exit to void"
          >
            ← EXIT
          </button>
        </div>

        {/* ── Member list panel ── */}
        {showMembers && members.length > 0 && (
          <div
            className="flex flex-shrink-0 flex-wrap gap-2 border-b-2 border-dashed px-6 py-3 animate-appear"
            style={{ borderColor: `${accent}44`, background: `${accent}08` }}
          >
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                <img
                  src={avatarUrl(m.avatar ?? m.username)}
                  alt={m.username}
                  className="h-5 w-5 rounded-full"
                  style={{ border: `1.5px solid ${m.color ?? accent}` }}
                />
                <span
                  className="font-heading text-[11px] font-black uppercase tracking-tight"
                  style={{ color: m.color ?? accent }}
                >
                  {m.username}
                </span>
                {m.tag && (
                  <span className="font-heading text-[9px] text-white/30">#{m.tag}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Scrollable chat area ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
