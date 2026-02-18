// Message shape: { id, senderId, senderName, senderColor, text, timestamp }

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message, isOwn }) {
  const { senderName, senderColor, text, timestamp } = message;
  const initial = senderName?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={`group mx-3 my-2 flex items-start gap-3 rounded-2xl p-3 transition-all duration-200 hover:scale-[1.015] ${isOwn ? 'flex-row-reverse hover:rotate-[0.4deg]' : 'hover:-rotate-[0.4deg]'}`}
      style={{
        backgroundColor: isOwn ? `${senderColor}22` : `${senderColor}12`,
        ...(isOwn
          ? { borderRight: `4px solid ${senderColor}`, boxShadow: `-3px 3px 0 ${senderColor}33` }
          : { borderLeft: `4px solid ${senderColor}`, boxShadow: `3px 3px 0 ${senderColor}33` }),
      }}
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-heading text-sm font-black text-white"
        style={{
          backgroundColor: senderColor,
          boxShadow: `0 0 12px ${senderColor}88`,
          border: '2px solid rgba(255,230,0,0.5)',
        }}
      >
        {initial}
      </div>

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
          </span>
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-white/25">
            {formatTime(timestamp)}
          </span>
        </div>
        <p className="mt-0.5 break-words text-sm leading-relaxed whitespace-pre-wrap text-white/85">
          {text}
        </p>
      </div>
    </div>
  );
}
