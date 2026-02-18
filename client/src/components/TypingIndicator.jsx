import { useChat } from '../context/ChatContext.jsx';

export default function TypingIndicator({ roomId }) {
  const { me, typing, roomMembers } = useChat();
  const typerIds = (typing[roomId] ?? []).filter((id) => id !== me.id);

  if (typerIds.length === 0) {
    return <div className="h-6 flex-shrink-0" />;
  }

  const members = roomMembers[roomId] ?? [];
  function nameOf(id) {
    return members.find((m) => m.id === id)?.username ?? id.slice(0, 8);
  }

  let label;
  if (typerIds.length === 1)      label = `${nameOf(typerIds[0])} transmitting…`;
  else if (typerIds.length === 2) label = `${nameOf(typerIds[0])} + ${nameOf(typerIds[1])} transmitting…`;
  else                            label = `${typerIds.length} beings transmitting…`;

  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-2 px-5">
      {/* Bouncing magenta dots */}
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-[#FF3AF2] animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              boxShadow: '0 0 6px rgba(255,58,242,0.8)',
            }}
          />
        ))}
      </span>
      <span className="font-heading text-[10px] font-black uppercase tracking-widest text-[#FF3AF2]/65">
        {label}
      </span>
    </div>
  );
}
