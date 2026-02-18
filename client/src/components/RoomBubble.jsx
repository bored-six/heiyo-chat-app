// Five accent colors + their clashing border partners
const ACCENTS      = ['#FF3AF2', '#00F5D4', '#FFE600', '#FF6B35', '#7B2FFF'];
const CLASH        = ['#FFE600', '#FF6B35', '#FF3AF2', '#00F5D4', '#FFE600'];
const FLOAT_ANIMS  = [
  'animate-float',
  'animate-float-reverse',
  'animate-float-slow',
  'animate-float',
  'animate-float-reverse',
];
// Tailwind rotation classes — compose cleanly with hover:scale
const ROTATIONS    = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0'];

export default function RoomBubble({ room, index, style, onEnter, unread = 0, parallaxX = 0, parallaxY = 0 }) {
  const accent      = ACCENTS[index % ACCENTS.length];
  const borderColor = CLASH[index % CLASH.length];
  const floatAnim   = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const rotation    = ROTATIONS[index % ROTATIONS.length];
  const delay       = `${(index * 0.65) % 3.5}s`;

  // Scale bubble 130–200px based on member count (saturates at ~14 members)
  const size = Math.max(130, Math.min(200, 130 + (room.memberCount ?? 0) * 5));

  return (
    // Outer wrapper: absolute position + parallax translate.
    // Kept separate from the float div so CSS animation transform
    // (translateY on floatAnim) doesn't fight the inline parallax transform.
    <div
      className="absolute z-10"
      style={{
        ...style,
        transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        transition: 'transform 0.12s ease-out',
      }}
    >
      {/* Inner wrapper: float animation only */}
      <div className={`relative ${floatAnim}`} style={{ animationDelay: delay }}>

        {/* Unread badge */}
        {unread > 0 && (
          <div
            className="absolute -top-2 -right-2 z-20 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 font-heading text-xs font-black text-[#0D0D1A] animate-pulse"
            style={{
              backgroundColor: '#FFE600',
              boxShadow: '0 0 10px #FFE600, 0 0 22px #FFE60066',
              border: '2px solid #FF3AF2',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </div>
        )}

        <button
          onClick={onEnter}
          className={`
            ${rotation}
            flex flex-col items-center justify-center gap-2
            rounded-full
            transition-all duration-300
            hover:scale-110 hover:brightness-110
            focus:outline-none focus:ring-4 focus:ring-offset-4
            focus:ring-offset-[#0D0D1A]
          `}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: `${accent}1A`,
            border: `4px solid ${borderColor}`,
            boxShadow: `0 0 40px ${accent}99, 0 0 200px ${accent}22`,
            focusRingColor: accent,
          }}
          aria-label={`Enter room: ${room.name}`}
        >
          {/* Room name */}
          <span
            className="font-heading px-3 text-center text-sm font-black uppercase leading-tight tracking-tighter text-white"
            style={{
              textShadow: `0 0 10px ${accent}99`,
            }}
          >
            {room.name}
          </span>

          {/* Description */}
          {room.description && (
            <span
              className="px-4 text-center font-heading text-[9px] font-bold leading-tight tracking-wide"
              style={{ color: `${accent}cc` }}
            >
              {room.description}
            </span>
          )}

          {/* Member count badge */}
          <span
            className="rounded-full border-2 border-dashed px-3 py-0.5 font-heading text-[10px] font-black uppercase tracking-widest"
            style={{ borderColor: accent, color: accent }}
          >
            {room.memberCount ?? 0} online
          </span>
        </button>

      </div>
    </div>
  );
}
