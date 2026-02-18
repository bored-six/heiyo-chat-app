import { useChat } from '../context/ChatContext.jsx';

export default function TypingIndicator({ roomId }) {
  const { me, typing, roomMembers } = useChat();

  // Socket IDs currently typing in this room, excluding ourselves
  const typerIds = (typing[roomId] ?? []).filter((id) => id !== me.id);

  if (typerIds.length === 0) {
    // Reserve the height so the layout doesn't jump
    return <div className="h-5 flex-shrink-0" />;
  }

  const members = roomMembers[roomId] ?? [];

  function nameOf(socketId) {
    return members.find((m) => m.id === socketId)?.username ?? socketId.slice(0, 8);
  }

  let label;
  if (typerIds.length === 1) {
    label = `${nameOf(typerIds[0])} is typing…`;
  } else if (typerIds.length === 2) {
    label = `${nameOf(typerIds[0])} and ${nameOf(typerIds[1])} are typing…`;
  } else {
    label = `${typerIds.length} people are typing…`;
  }

  return (
    <div className="flex h-5 flex-shrink-0 items-center gap-1.5 px-4">
      <BouncingDots />
      <span className="text-xs text-[#949ba4]">{label}</span>
    </div>
  );
}

function BouncingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full bg-[#949ba4] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
