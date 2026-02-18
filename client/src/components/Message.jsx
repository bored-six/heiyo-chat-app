// Message shape from server:
//   { id, senderId, senderName, senderColor, text, timestamp }

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message }) {
  const { senderName, senderColor, text, timestamp } = message;
  const initial = senderName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="group flex items-start gap-3 rounded px-2 py-1 hover:bg-[#2e3035]">
      {/* Colored avatar circle */}
      <div
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: senderColor }}
      >
        {initial}
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: senderColor }}>
            {senderName}
          </span>
          <span className="text-xs text-[#6d6f78]">{formatTime(timestamp)}</span>
        </div>
        <p className="break-words text-sm whitespace-pre-wrap text-[#dcddde]">{text}</p>
      </div>
    </div>
  );
}
