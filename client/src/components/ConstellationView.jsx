import { useMemo, useState, useRef, useEffect } from 'react';
import { avatarUrl } from '../utils/avatar.js';

// Anchor slot positions as fractions of (W, H)
// 8 slots — corners + midpoints, kept away from edges so node clusters don't clip
const ANCHOR_SLOTS = [
  [0.26, 0.22], [0.52, 0.13], [0.78, 0.22],
  [0.14, 0.56],               [0.86, 0.56],
  [0.26, 0.80], [0.52, 0.87], [0.78, 0.80],
];

function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildNodePositions(messages, anchors) {
  const map = new Map();
  // Group messages by sender, preserving arrival order
  const bySender = new Map();
  for (const msg of messages) {
    if (!bySender.has(msg.senderId)) bySender.set(msg.senderId, []);
    bySender.get(msg.senderId).push(msg);
  }

  for (const [senderId, msgs] of bySender) {
    const anchor = anchors.get(senderId);
    if (!anchor) continue;

    // Each sender gets a unique starting angle so rings don't all face the same direction
    const startAngle = (hashStr(senderId) % 628) / 100;

    msgs.forEach((msg, idx) => {
      // Pack into concentric rings: ring r holds min(6*(r+1), 20) nodes
      let ring = 0;
      let posInRing = idx;
      let ringCap = 6;
      while (posInRing >= ringCap) {
        posInRing -= ringCap;
        ring++;
        ringCap = Math.min(6 * (ring + 1), 20);
      }

      const radius = 60 + ring * 44;
      const angle = (posInRing / ringCap) * Math.PI * 2 + startAngle + ring * 0.55;

      map.set(msg.id, {
        x: anchor.x + radius * Math.cos(angle),
        y: anchor.y + radius * Math.sin(angle),
      });
    });
  }
  return map;
}

function buildStars(W, H, count = 45) {
  return Array.from({ length: count }, (_, i) => ({
    x: (hashStr(`sx${i}`) % 997) / 997 * W,
    y: (hashStr(`sy${i}`) % 991) / 991 * H,
    r: 0.4 + (hashStr(`sr${i}`) % 8) / 20,
    opacity: 0.06 + (hashStr(`so${i}`) % 12) / 100,
  }));
}

export default function ConstellationView({ messages, myId, accent = '#FF3AF2' }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 660, h: 440 });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setDims({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = dims;

  // Derive unique senders from message history (in order of first appearance)
  const senders = useMemo(() => {
    const seen = new Map();
    for (const msg of messages) {
      if (!seen.has(msg.senderId)) {
        seen.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          color: msg.senderColor ?? '#FF3AF2',
          avatar: msg.senderAvatar,
        });
      }
    }
    return [...seen.values()];
  }, [messages]);

  // Place each sender at one of the pre-defined anchor slots
  const anchors = useMemo(() => {
    const map = new Map();
    senders.forEach((s, i) => {
      const [fx, fy] = ANCHOR_SLOTS[i % ANCHOR_SLOTS.length];
      map.set(s.id, { ...s, x: fx * W, y: fy * H });
    });
    return map;
  }, [senders, W, H]);

  // Position every message node around its sender's anchor
  const nodePositions = useMemo(
    () => buildNodePositions(messages, anchors),
    [messages, anchors],
  );

  // Reply edges: line from reply node → original node
  const replyLines = useMemo(
    () =>
      messages
        .filter((m) => m.replyTo?.id && nodePositions.has(m.id) && nodePositions.has(m.replyTo.id))
        .map((m) => ({
          from: nodePositions.get(m.id),
          to: nodePositions.get(m.replyTo.id),
          color: anchors.get(m.senderId)?.color ?? accent,
        })),
    [messages, nodePositions, anchors, accent],
  );

  // Background star field — regenerated when canvas resizes
  const stars = useMemo(() => buildStars(W, H), [W, H]);

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <span
          className="animate-float select-none text-7xl leading-none"
          style={{ color: accent, opacity: 0.15 }}
        >
          ✦
        </span>
        <p
          className="font-heading text-xs font-black uppercase tracking-[0.3em]"
          style={{ color: accent, opacity: 0.35 }}
        >
          No signals detected
        </p>
      </div>
    );
  }

  return (
    /* Outer: flex-1 so it fills the chat area slot, overflow hidden to clip edge nodes */
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      {/* Canvas — sized to the measured container */}
      <div className="absolute inset-0">
        <div className="relative h-full w-full">
          {/* ── SVG: stars, grid lines, threads, reply edges ────────────────── */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={W}
            height={H}
            aria-hidden="true"
          >
            {/* Ambient starfield */}
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
            ))}

            {/* Faint grid: inter-anchor connector lines */}
            {[...anchors.values()].flatMap((a, i, arr) =>
              arr.slice(i + 1).map((b) => (
                <line
                  key={`grid-${a.id}-${b.id}`}
                  x1={a.x} y1={a.y}
                  x2={b.x} y2={b.y}
                  stroke="white"
                  strokeOpacity={0.025}
                  strokeWidth={1}
                />
              )),
            )}

            {/* Radial threads: anchor → each of its message nodes */}
            {messages.map((msg) => {
              const anchor = anchors.get(msg.senderId);
              const pos = nodePositions.get(msg.id);
              if (!anchor || !pos) return null;
              return (
                <line
                  key={`thread-${msg.id}`}
                  x1={anchor.x} y1={anchor.y}
                  x2={pos.x} y2={pos.y}
                  stroke={anchor.color}
                  strokeOpacity={0.07}
                  strokeWidth={1}
                />
              );
            })}

            {/* Reply connection edges (dashed) */}
            {replyLines.map((ln, i) => (
              <line
                key={`reply-${i}`}
                x1={ln.from.x} y1={ln.from.y}
                x2={ln.to.x} y2={ln.to.y}
                stroke={ln.color}
                strokeOpacity={0.6}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            ))}
          </svg>

          {/* ── Sender anchor nodes ─────────────────────────────────────────── */}
          {[...anchors.values()].map((a) => (
            <div
              key={`anchor-${a.id}`}
              className="pointer-events-none absolute flex flex-col items-center gap-1"
              style={{
                left: a.x,
                top: a.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  border: `2px solid ${a.color}`,
                  boxShadow: `0 0 14px ${a.color}aa, 0 0 30px ${a.color}44`,
                }}
              >
                <img
                  src={avatarUrl(a.avatar ?? a.name)}
                  alt={a.name}
                  className="h-full w-full rounded-full"
                />
              </div>
              <span
                className="whitespace-nowrap font-heading text-[9px] font-black tracking-widest"
                style={{
                  color: a.color,
                  textShadow: `0 0 10px ${a.color}`,
                }}
              >
                {a.name}
              </span>
            </div>
          ))}

          {/* ── Message nodes ───────────────────────────────────────────────── */}
          {messages.map((msg) => {
            const pos = nodePositions.get(msg.id);
            const anchor = anchors.get(msg.senderId);
            if (!pos || !anchor) return null;

            const isHovered = hovered === msg.id;
            const isOwn = msg.senderId === myId;
            const hasReply = !!msg.replyTo?.id;
            // Show tooltip above if node is in the lower 55% of canvas
            const showAbove = pos.y > H * 0.55;

            return (
              <div
                key={msg.id}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHovered ? 50 : 2,
                }}
                onMouseEnter={() => setHovered(msg.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Dashed orbit ring on reply nodes */}
                {hasReply && (
                  <div
                    className="animate-spin-slow absolute rounded-full border border-dashed"
                    style={{
                      inset: -7,
                      borderColor: `${anchor.color}44`,
                    }}
                  />
                )}

                {/* Node dot */}
                <div
                  className="cursor-pointer rounded-full transition-all duration-150"
                  style={{
                    width: isHovered ? 16 : 10,
                    height: isHovered ? 16 : 10,
                    background: anchor.color,
                    boxShadow: isHovered
                      ? `0 0 22px ${anchor.color}, 0 0 44px ${anchor.color}66`
                      : `0 0 8px ${anchor.color}99`,
                    ...(isOwn
                      ? { outline: '2px solid rgba(255,255,255,0.6)', outlineOffset: 2 }
                      : {}),
                  }}
                />

                {/* Hover card */}
                {isHovered && (
                  <div
                    className="animate-appear absolute left-1/2 w-56 -translate-x-1/2 rounded-2xl border p-3"
                    style={{
                      ...(showAbove ? { bottom: '100%', marginBottom: 10 } : { top: '100%', marginTop: 10 }),
                      background: 'rgba(10, 10, 22, 0.96)',
                      borderColor: `${anchor.color}66`,
                      boxShadow: `0 0 24px ${anchor.color}44, 0 4px 24px rgba(0,0,0,0.7)`,
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Sender row */}
                    <div className="mb-2 flex items-center gap-1.5">
                      <img
                        src={avatarUrl(anchor.avatar ?? anchor.name)}
                        alt={anchor.name}
                        className="h-5 w-5 flex-shrink-0 rounded-full"
                        style={{ border: `1.5px solid ${anchor.color}` }}
                      />
                      <span
                        className="font-heading text-[10px] font-black tracking-tight"
                        style={{ color: anchor.color }}
                      >
                        {anchor.name}
                      </span>
                      <span className="ml-auto flex-shrink-0 font-heading text-[8px] text-white/25">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Reply context */}
                    {msg.replyTo && (
                      <div
                        className="mb-2 rounded-lg border-l-2 py-0.5 pl-2"
                        style={{ borderColor: `${anchor.color}55` }}
                      >
                        <p className="font-heading text-[9px] text-white/35">
                          ↩ {msg.replyTo.senderName}:{' '}
                          {msg.replyTo.text.length > 60
                            ? `${msg.replyTo.text.slice(0, 60)}…`
                            : msg.replyTo.text}
                        </p>
                      </div>
                    )}

                    {/* Message text */}
                    <p className="font-heading text-[11px] leading-relaxed text-white/80">
                      {msg.text.length > 220 ? `${msg.text.slice(0, 220)}…` : msg.text}
                    </p>

                    {/* Reactions */}
                    {msg.reactions &&
                      Object.entries(msg.reactions).some(([, u]) => u.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(msg.reactions)
                            .filter(([, users]) => users.length > 0)
                            .map(([emoji, users]) => (
                              <span
                                key={emoji}
                                className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px]"
                              >
                                {emoji} {users.length}
                              </span>
                            ))}
                        </div>
                      )}

                    {/* Seen receipt count */}
                    {msg.seenBy && msg.seenBy.length > 0 && (
                      <p className="mt-1.5 font-heading text-[8px] text-white/20">
                        Seen by {msg.seenBy.length}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
