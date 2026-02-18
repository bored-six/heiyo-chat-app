import { useChat } from '../context/ChatContext.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function ChatArea() {
  const { me, rooms, dms, activeRoomId, activeDmId, roomMessages, onlineUsers } = useChat();

  // ── No selection ──────────────────────────────────────────────────────────
  if (!activeRoomId && !activeDmId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#313338] text-[#6d6f78]">
        <p>Select a room or DM to start chatting.</p>
      </div>
    );
  }

  // ── Active room ───────────────────────────────────────────────────────────
  if (activeRoomId) {
    const room = rooms.find((r) => r.id === activeRoomId);
    const messages = roomMessages[activeRoomId] ?? [];

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={`# ${room?.name ?? activeRoomId}`} />
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

function Header({ title, color }) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
      <span className="font-semibold text-[#dcddde]" style={color ? { color } : undefined}>
        {title}
      </span>
    </div>
  );
}
