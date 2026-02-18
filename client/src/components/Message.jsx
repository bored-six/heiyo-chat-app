// Message shape: { id, senderId, senderName, senderColor, senderAvatar, senderTag, text, timestamp, reactions }
import { useState } from 'react';
import { avatarUrl } from '../utils/avatar.js';
import { useChat } from '../context/ChatContext.jsx';

const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮'];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message, isOwn }) {
  const { senderName, senderColor, senderAvatar, senderTag, text, timestamp } = message;
  const reactions = message.reactions ?? {};
  const { socket, activeRoomId, activeDmId, me } = useChat();
  const [pickerVisible, setPickerVisible] = useState(false);

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
          ? { borderRight: `4px solid ${senderColor}`, boxShadow: `-3px 3px 0 ${senderColor}33` }
          : { borderLeft: `4px solid ${senderColor}`, boxShadow: `3px 3px 0 ${senderColor}33` }),
      }}
      onMouseLeave={() => setPickerVisible(false)}
    >
      {/* Chibi avatar */}
      <img
        src={avatarUrl(senderAvatar)}
        alt={senderName}
        className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-full"
        style={{
          border: `2px solid ${senderColor}`,
          boxShadow: `0 0 10px ${senderColor}88`,
        }}
      />

      {/* Body */}
      <div className={`min-w-0 flex-1 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span
            className="font-heading text-sm font-black uppercase tracking-tight"
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
          </span>
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-white/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {formatTime(timestamp)}
          </span>
        </div>
        <p className="mt-0.5 break-words text-sm leading-relaxed whitespace-pre-wrap text-white/85">
          {text}
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
      </div>

      {/* Emoji picker — appears on hover via group */}
      <div
        className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-1 z-10 flex gap-1 rounded-full border-2 border-dashed border-white/20 bg-[#1a1a2e]/95 px-2 py-1 backdrop-blur-sm transition-all duration-150 ${pickerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'} group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto`}
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
      </div>
    </div>
  );
}
