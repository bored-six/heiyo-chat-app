import { useChat } from '../context/ChatContext.jsx';

export default function TypingIndicator({ roomId }) {
  const { me, typing, roomMembers } = useChat();
  const typerIds = (typing[roomId] ?? []).filter((id) => id !== me.id);

  if (typerIds.length === 0) {
    return <div className="h-6 flex-shrink-0" />;
  }

  const members = roomMembers[roomId] ?? [];
  const firstTyperColor = members.find((m) => m.id === typerIds[0])?.color ?? '#FF3AF2';

  function nameOf(id) {
    return members.find((m) => m.id === id)?.username ?? id.slice(0, 8);
  }

  let label;
  if (typerIds.length === 1)      label = `${nameOf(typerIds[0])} transmitting…`;
  else if (typerIds.length === 2) label = `${nameOf(typerIds[0])} + ${nameOf(typerIds[1])} transmitting…`;
  else                            label = `${typerIds.length} beings transmitting…`;

  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-2 px-5">
      {/* Breathing orb */}
      <div
        className="animate-orb-breathe h-5 w-5 flex-shrink-0 rounded-full"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${firstTyperColor}60, ${firstTyperColor}18)`,
          border: `1.5px solid ${firstTyperColor}88`,
          boxShadow: `0 0 8px ${firstTyperColor}55`,
        }}
      />
      <span className="font-heading text-[10px] font-black tracking-widest" style={{ color: `${firstTyperColor}88` }}>
        {label}
      </span>
    </div>
  );
}
