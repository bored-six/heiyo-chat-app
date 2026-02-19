import { useState, useEffect } from 'react';

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
const ROTATIONS    = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0'];

// ─── Heat ────────────────────────────────────────────────────────────────────

function getHeatTier(lastMessageAt) {
  if (!lastMessageAt) return 'cold';
  const ageMin = (Date.now() - lastMessageAt) / 60_000;
  if (ageMin < 1)  return 'hot';
  if (ageMin < 5)  return 'warm';
  if (ageMin < 15) return 'cool';
  return 'cold';
}

const HEAT = {
  hot:  { sizeBoost: 28,  glowMult: 2.4, pulse: true  },
  warm: { sizeBoost: 12,  glowMult: 1.5, pulse: false },
  cool: { sizeBoost: 0,   glowMult: 1.0, pulse: false },
  cold: { sizeBoost: -12, glowMult: 0.35, pulse: false },
};

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts) {
  if (!ts) return '';
  const ageMs = Date.now() - ts;
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60)  return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RoomBubble({ room, index, style, onEnter, unread = 0, parallaxX = 0, parallaxY = 0, centered = false, sizeScale = 1 }) {
  const accent      = ACCENTS[index % ACCENTS.length];
  const borderColor = CLASH[index % CLASH.length];
  const floatAnim   = FLOAT_ANIMS[index % FLOAT_ANIMS.length];
  const rotation    = ROTATIONS[index % ROTATIONS.length];
  const delay       = `${(index * 0.65) % 3.5}s`;

  // Tick every 30 s so heat tier refreshes as rooms cool down
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const [hovered, setHovered] = useState(false);

  // Heat
  const tier = getHeatTier(room.lastMessageAt);
  const heat = HEAT[tier];

  // Base size from member count (130–200px), then apply heat boost
  const baseSize = Math.max(130, Math.min(200, 130 + (room.memberCount ?? 0) * 5));
  const size     = Math.max(80, Math.round((baseSize + heat.sizeBoost) * sizeScale));

  // Glow intensity scales with heat
  const glow = `0 0 ${Math.round(40 * heat.glowMult)}px ${accent}${Math.round(60 * heat.glowMult).toString(16).padStart(2, '0')}, 0 0 ${Math.round(200 * heat.glowMult)}px ${accent}${Math.round(14 * heat.glowMult).toString(16).padStart(2, '0')}`;

  const lurkers = room.lurkerCount ?? 0;
  const lastMsg = room.lastMessage ?? null;

  return (
    <div
      className="absolute z-10"
      style={{
        ...style,
        transform: `${centered ? 'translate(-50%, -50%) ' : ''}translate(${parallaxX}px, ${parallaxY}px)`,
        transition: 'transform 0.12s ease-out',
      }}
    >
      {/* Inner wrapper: float animation only */}
      <div
        className={`relative group ${floatAnim}`}
        style={{ animationDelay: delay }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        {/* ── Hover tooltip: last message preview ── */}
        {hovered && lastMsg && (
          <div
            className="absolute bottom-full left-1/2 mb-3 w-52 -translate-x-1/2 rounded-2xl border border-white/10 px-3 py-2 text-left backdrop-blur-md pointer-events-none z-30"
            style={{ background: 'rgba(13,13,26,0.92)', boxShadow: `0 0 20px ${accent}44` }}
          >
            <p
              className="font-heading text-[10px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: accent }}
            >
              {lastMsg.senderName}
              <span className="ml-1.5 font-normal normal-case tracking-normal text-white/30">
                {relativeTime(lastMsg.timestamp)}
              </span>
            </p>
            <p className="font-heading text-[11px] text-white/75 leading-snug line-clamp-2">
              {lastMsg.text}
            </p>
            {/* Arrow */}
            <div
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
              style={{ borderTopColor: 'rgba(13,13,26,0.92)' }}
            />
          </div>
        )}

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

        {/* Unread ring — pulses yellow when there are unread messages */}
        {unread > 0 && (
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{
              background: 'transparent',
              border: '3px solid #FFE600',
              opacity: 0.45,
            }}
          />
        )}

        {/* Hot ring — only visible when HOT */}
        {tier === 'hot' && (
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{
              background: 'transparent',
              border: `3px solid ${accent}`,
              opacity: 0.4,
            }}
          />
        )}

        <button
          onClick={onEnter}
          className={`
            ${rotation}
            flex flex-col items-center justify-center gap-2
            rounded-full
            transition-all duration-500
            hover:scale-110 hover:brightness-110
            focus:outline-none focus:ring-4 focus:ring-offset-4
            focus:ring-offset-[#0D0D1A]
          `}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: `${accent}1A`,
            border: `4px solid ${borderColor}`,
            boxShadow: glow,
            focusRingColor: accent,
            transition: 'width 0.6s ease, height 0.6s ease, box-shadow 0.6s ease',
          }}
          aria-label={`Enter room: ${room.name}`}
        >
          {/* Room name */}
          <span
            className="font-heading px-3 text-center text-sm font-black uppercase leading-tight tracking-tighter text-white"
            style={{ textShadow: `0 0 10px ${accent}99` }}
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

          {/* Lurker count — only shown when > 0 */}
          {lurkers > 0 && (
            <span
              className="font-heading text-[9px] font-bold tracking-wide"
              style={{ color: `${accent}88` }}
            >
              {lurkers} lurking
            </span>
          )}
        </button>

      </div>
    </div>
  );
}
