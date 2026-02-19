import { useEffect, useRef, useState } from 'react';
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
    roomMessages, roomMembers, onlineUsers, dispatch, socket,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [replyingTo, setReplyingTo]   = useState(null); // { id, text, senderName }

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setReplyingTo(null);
  }, [activeRoomId, activeDmId]);

  function exitToVoid() {
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId: null });
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
  }

  function handleReply(msg) {
    setReplyingTo({ id: msg.id, text: msg.text, senderName: msg.senderName });
  }

  // ── Active room ────────────────────────────────────────────────────────────
  if (activeRoomId) {
    const room        = rooms.find((r) => r.id === activeRoomId);
    const roomIndex   = rooms.findIndex((r) => r.id === activeRoomId);
    const accent      = ACCENTS[roomIndex % ACCENTS.length];
    const clash       = CLASH[roomIndex % CLASH.length];
    const allMessages = roomMessages[activeRoomId] ?? [];
    const members     = roomMembers[activeRoomId]  ?? [];

    const messages = searchQuery.trim()
      ? allMessages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
      : allMessages;

    function handleInviteSubmit(username) {
      socket.emit('room:invite', { roomId: activeRoomId, username });
    }

    return (
      <Portal
        title={room?.name ?? activeRoomId}
        accent={accent}
        clash={clash}
        onExit={exitToVoid}
        members={members}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={closeSearch}
        onSearchChange={setSearchQuery}
        onInviteSubmit={handleInviteSubmit}
      >
        <>
          <MessageList
            messages={messages}
            myId={me?.id}
            highlight={searchQuery}
            onReply={handleReply}
            label={room?.name ?? ''}
          />
          <TypingIndicator roomId={activeRoomId} />
        </>
        <MessageInput
          roomId={activeRoomId}
          toUserId={null}
          accent={accent}
          clash={clash}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </Portal>
    );
  }

  // ── Active DM ──────────────────────────────────────────────────────────────
  const dm            = dms[activeDmId];
  const otherId       = dm?.participants.find((id) => id !== me.id);
  const other         = onlineUsers[otherId] ?? { username: otherId ?? '…', color: '#FF3AF2' };
  const allDmMessages = dm?.messages ?? [];
  const accent        = other.color ?? '#FF3AF2';

  const dmMessages = searchQuery.trim()
    ? allDmMessages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : allDmMessages;

  return (
    <Portal
      title={`@ ${other.username}`}
      accent={accent}
      clash="#FFE600"
      onExit={exitToVoid}
      searchOpen={searchOpen}
      searchQuery={searchQuery}
      onSearchOpen={() => setSearchOpen(true)}
      onSearchClose={closeSearch}
      onSearchChange={setSearchQuery}
    >
      <MessageList
        messages={dmMessages}
        myId={me?.id}
        highlight={searchQuery}
        onReply={handleReply}
        label={`@ ${other.username}`}
      />
      <div className="h-6 flex-shrink-0" />
      <MessageInput
        roomId={null}
        toUserId={otherId}
        accent={accent}
        clash="#FFE600"
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </Portal>
  );
}

// ── Shared portal shell ────────────────────────────────────────────────────
const MEMBER_MAX = 5;

function Portal({
  title, accent, clash, onExit, children, members = [],
  searchOpen, searchQuery, onSearchOpen, onSearchClose, onSearchChange,
  onInviteSubmit,
}) {
  const [showMembers, setShowMembers]   = useState(false);
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [inviteInput, setInviteInput]   = useState('');
  const searchInputRef = useRef(null);
  const inviteInputRef = useRef(null);
  const visible  = members.slice(0, MEMBER_MAX);
  const overflow = members.length - MEMBER_MAX;

  function handleSearchToggle() {
    if (searchOpen) {
      onSearchClose();
    } else {
      onSearchOpen();
      setInviteOpen(false);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }

  function handleInviteToggle() {
    if (inviteOpen) {
      setInviteOpen(false);
      setInviteInput('');
    } else {
      setInviteOpen(true);
      onSearchClose?.();
      setTimeout(() => inviteInputRef.current?.focus(), 0);
    }
  }

  function handleInviteSubmit(e) {
    e.preventDefault();
    const username = inviteInput.trim();
    if (!username) return;
    onInviteSubmit?.(username);
    setInviteInput('');
    setInviteOpen(false);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
      <div
        className="animate-portal-in flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(13,13,26,0.88)',
          border: `2px solid ${accent}55`,
          boxShadow: `0 0 60px ${accent}55, 0 0 120px ${accent}22`,
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex flex-shrink-0 items-center justify-between border-b-2 px-6 py-4"
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

          {/* Right: search + invite + exit */}
          <div className="ml-4 flex flex-shrink-0 items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={handleSearchToggle}
              className="rounded-full border-2 border-dashed px-3 py-1.5 font-heading text-xs font-black uppercase tracking-widest transition-all duration-200 hover:scale-105"
              style={{
                borderColor: searchOpen ? accent : `${accent}55`,
                color: searchOpen ? accent : `${accent}88`,
                backgroundColor: searchOpen ? `${accent}15` : 'transparent',
              }}
              aria-label="Toggle search"
            >
              🔍
            </button>

            {/* Invite toggle — only when an invite handler is provided (rooms, not DMs) */}
            {onInviteSubmit && (
              <button
                onClick={handleInviteToggle}
                className="rounded-full border-2 border-dashed px-3 py-1.5 font-heading text-xs font-black uppercase tracking-widest transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: inviteOpen ? accent : `${accent}55`,
                  color: inviteOpen ? accent : `${accent}88`,
                  backgroundColor: inviteOpen ? `${accent}15` : 'transparent',
                }}
                aria-label="Invite to room"
                title="Invite someone to this room"
              >
                + invite
              </button>
            )}

            <button
              onClick={onExit}
              className="rounded-full border-4 border-dashed px-5 py-2 font-heading text-sm font-black uppercase tracking-widest transition-all duration-200 hover:scale-110 hover:brightness-125"
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
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <div
            className="flex flex-shrink-0 items-center gap-3 border-b-2 border-dashed px-5 py-2.5 animate-appear"
            style={{ borderColor: `${accent}40`, background: `${accent}08` }}
          >
            <span style={{ color: accent }} className="flex-shrink-0 text-sm">🔍</span>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search messages…"
              className="flex-1 bg-transparent font-heading text-sm font-bold uppercase tracking-wide text-white placeholder-white/25 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="flex-shrink-0 font-heading text-xs font-black text-white/40 hover:text-white/70"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* ── Invite panel ── */}
        {inviteOpen && (
          <form
            onSubmit={handleInviteSubmit}
            className="flex flex-shrink-0 items-center gap-3 border-b-2 border-dashed px-5 py-2.5 animate-appear"
            style={{ borderColor: `${accent}40`, background: `${accent}08` }}
          >
            <span style={{ color: accent }} className="flex-shrink-0 text-sm">🔗</span>
            <input
              ref={inviteInputRef}
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Username to invite…"
              className="flex-1 bg-transparent font-heading text-sm font-bold uppercase tracking-wide text-white placeholder-white/25 outline-none"
            />
            <button
              type="submit"
              disabled={!inviteInput.trim()}
              className="flex-shrink-0 rounded-full px-3 py-1 font-heading text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-30"
              style={{ background: accent, color: '#0D0D1A' }}
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => { setInviteOpen(false); setInviteInput(''); }}
              className="flex-shrink-0 font-heading text-xs font-black text-white/40 hover:text-white/70"
            >
              ✕
            </button>
          </form>
        )}

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
                  className="font-heading text-[11px] font-black tracking-tight"
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
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Top-fade: softens the header→messages transition */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-8"
            style={{ background: `linear-gradient(to bottom, ${accent}0F, transparent)` }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
