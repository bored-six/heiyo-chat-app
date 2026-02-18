import { useChat } from '../context/ChatContext.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const ACCENTS = ['#FF3AF2', '#00F5D4', '#FFE600', '#FF6B35', '#7B2FFF'];
const CLASH   = ['#FFE600', '#FF6B35', '#FF3AF2', '#00F5D4', '#FFE600'];

export default function RoomPortal() {
  const { me, rooms, dms, activeRoomId, activeDmId, roomMessages, onlineUsers, dispatch } = useChat();

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

    return (
      <Portal title={room?.name ?? activeRoomId} accent={accent} clash={clash} onExit={exitToVoid}>
        <MessageList messages={messages} />
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
      <MessageList messages={messages} />
      <div className="h-6 flex-shrink-0" />
      <MessageInput roomId={null} toUserId={otherId} accent={accent} clash="#FFE600" />
    </Portal>
  );
}

// ── Shared portal shell ────────────────────────────────────────────────────
function Portal({ title, accent, clash, onExit, children }) {
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
          <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-gradient">
            {title}
          </h2>

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

        {/* ── Scrollable chat area ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
