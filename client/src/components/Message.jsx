// Message shape: { id, senderId, senderName, senderColor, senderAvatar, senderTag, text, timestamp, reactions, replyTo }
import { useState } from 'react';
import { avatarUrl } from '../utils/avatar.js';
import { useChat } from '../context/ChatContext.jsx';
import ProfileCard from './ProfileCard.jsx';

const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮'];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, highlight }) {
  if (!highlight) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(highlight)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? <mark key={i} className="rounded px-0.5" style={{ background: '#FFE600', color: '#0D0D1A' }}>{part}</mark>
          : part
      )}
    </>
  );
}

const MAX_SEEN_AVATARS = 6;

export default function Message({ message, isOwn, highlight = '', onReply }) {
  const { senderName, senderColor, senderAvatar, senderTag, text, timestamp } = message;
  const reactions = message.reactions ?? {};
  const replyTo   = message.replyTo ?? null;
  // Exclude the sender from seenBy (they obviously saw their own message)
  const seenBy    = (message.seenBy ?? []).filter((u) => u.id !== message.senderId);
  const { socket, activeRoomId, activeDmId, me, onlineUsers } = useChat();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  function openProfile() {
    // Prefer the live onlineUsers entry (has full profile fields), fall back to message snapshot
    const live = onlineUsers[message.senderId];
    setProfileUser(live ?? {
      id: message.senderId,
      username: senderName,
      color: senderColor,
      avatar: senderAvatar,
      tag: senderTag,
      bio: '', statusEmoji: '', statusText: '', presenceStatus: 'offline', displayName: '',
    });
  }

  const reactionEntries = Object.entries(reactions); // [['👍', ['id1']], ...]

  function toggleReaction(emoji) {
    socket.emit('reaction:toggle', {
      messageId: message.id,
      roomId: activeRoomId ?? undefined,
      dmId: activeDmId ?? undefined,
      emoji,
    });
  }

  return (
    <div
      className={`group relative mx-3 my-2 flex items-start gap-3 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.015] ${isOwn ? 'flex-row-reverse hover:rotate-[0.4deg]' : 'hover:-rotate-[0.4deg]'}`}
      style={{
        backgroundColor: isOwn ? `${senderColor}22` : `${senderColor}12`,
        ...(isOwn
          ? { borderRight: `4px solid ${senderColor}` }
          : { borderLeft: `4px solid ${senderColor}` }),
      }}
      onMouseLeave={() => setPickerVisible(false)}
    >
      {/* Chibi avatar */}
      <button
        onClick={openProfile}
        className="relative mt-0.5 h-9 w-9 flex-shrink-0 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-150"
      >
        <img
          src={avatarUrl(senderAvatar)}
          alt={senderName}
          className="h-9 w-9 rounded-full"
          style={{
            border: `2px solid ${senderColor}`,
            boxShadow: `0 0 10px ${senderColor}88`,
          }}
        />
        {(onlineUsers[message.senderId]?.statusEmoji) && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none pointer-events-none"
            style={{ background: '#0D0D1A', border: `1.5px solid ${senderColor}44` }}
          >
            {onlineUsers[message.senderId].statusEmoji}
          </span>
        )}
      </button>

      {/* Body */}
      <div className={`min-w-0 flex-1 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={openProfile}
            className="font-heading text-sm font-black tracking-tight hover:underline decoration-dotted cursor-pointer"
            style={{
              color: senderColor,
              textShadow: `1px 1px 0 #0D0D1A, 2px 2px 0 ${senderColor}55`,
            }}
          >
            {senderName}
            {senderTag && (
              <span className="font-heading text-[10px] font-bold normal-case tracking-normal text-white/30 ml-0.5">
                #{senderTag}
              </span>
            )}
          </button>
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-white/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Reply-to quote block */}
        {replyTo && (
          <div
            className={`mb-1.5 mt-0.5 flex items-start gap-1.5 rounded-lg border-l-2 px-2 py-1 ${isOwn ? 'flex-row-reverse border-l-0 border-r-2' : ''}`}
            style={{ borderColor: senderColor, background: `${senderColor}10` }}
          >
            <span className="flex-shrink-0 text-[10px] opacity-50">↩</span>
            <div className="min-w-0">
              <span
                className="block font-heading text-[10px] font-black tracking-tight"
                style={{ color: senderColor }}
              >
                {replyTo.senderName}
              </span>
              <p className="truncate font-heading text-[11px] text-white/50">
                {replyTo.text}
              </p>
            </div>
          </div>
        )}

        <p className="mt-0.5 break-words text-sm leading-relaxed whitespace-pre-wrap text-white/85">
          <HighlightedText text={text} highlight={highlight} />
        </p>

        {/* Reaction pills */}
        {reactionEntries.length > 0 && (
          <div className={`mt-1.5 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : ''}`}>
            {reactionEntries.map(([emoji, userIds]) => {
              const iMine = userIds.includes(me?.id);
              return (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all duration-150 hover:scale-110"
                  style={{
                    borderColor: iMine ? senderColor : 'rgba(255,255,255,0.15)',
                    backgroundColor: iMine ? `${senderColor}22` : 'rgba(255,255,255,0.05)',
                    color: iMine ? senderColor : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <span>{emoji}</span>
                  <span className="font-heading text-[10px] font-black">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Seen receipts — avatar row */}
        {seenBy.length > 0 && (
          <div className={`mt-1.5 flex items-center gap-0.5 ${isOwn ? 'justify-end' : ''}`}>
            {seenBy.slice(0, MAX_SEEN_AVATARS).map((u) => (
              <img
                key={u.id}
                src={avatarUrl(u.avatar)}
                alt={u.username}
                title={`Seen by ${u.username}`}
                className="h-4 w-4 rounded-full"
                style={{
                  border: `1.5px solid ${u.color}`,
                  boxShadow: `0 0 4px ${u.color}88`,
                }}
              />
            ))}
            {seenBy.length > MAX_SEEN_AVATARS && (
              <span
                className="font-heading text-[9px] font-black ml-0.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                +{seenBy.length - MAX_SEEN_AVATARS}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Profile card popup */}
      {profileUser && (
        <ProfileCard
          user={profileUser}
          isSelf={profileUser.id === me?.id}
          onClose={() => setProfileUser(null)}
          onDm={() => socket.emit('dm:open', { toUserId: profileUser.id })}
        />
      )}

      {/* Hover toolbar — emoji picker + reply button */}
      <div
        className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-1 z-10 flex items-center gap-1 rounded-full border-2 border-dashed border-white/20 bg-[#1a1a2e]/95 px-2 py-1 backdrop-blur-sm transition-all duration-150 ${pickerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'} group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto`}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className="text-base transition-transform duration-100 hover:scale-125"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <div className="mx-0.5 h-4 w-px bg-white/20" />
        <button
          onClick={() => onReply?.(message)}
          className="rounded px-1 font-heading text-[11px] font-black uppercase tracking-wide text-white/50 transition-colors hover:text-white"
          title="Reply"
        >
          ↩
        </button>
      </div>
    </div>
  );
}
