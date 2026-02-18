import { useState, useRef, useCallback, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import RoomBubble from './RoomBubble.jsx';
import AvatarPickerModal from './AvatarPickerModal.jsx';
import { useRoomOrder } from '../hooks/useRoomOrder.js';
import { avatarUrl } from '../utils/avatar.js';

// ─── Static decoration data ───────────────────────────────────────────────────

const PARTICLES = [
  { top: '94%', left: '6%',  color: '#FF3AF2', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '0s'    },
  { top: '91%', left: '19%', color: '#00F5D4', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '1.2s'  },
  { top: '89%', left: '32%', color: '#FFE600', cls: 'w-1.5 h-1.5', anim: 'animate-float',      delay: '0.4s'  },
  { top: '93%', left: '46%', color: '#7B2FFF', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '2.0s'  },
  { top: '88%', left: '60%', color: '#FF6B35', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '0.9s'  },
  { top: '92%', left: '73%', color: '#FF3AF2', cls: 'w-1.5 h-1.5', anim: 'animate-float-slow', delay: '1.6s'  },
  { top: '90%', left: '87%', color: '#00F5D4', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '2.4s'  },
  { top: '72%', left: '11%', color: '#FFE600', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '0.3s'  },
  { top: '68%', left: '24%', color: '#FF3AF2', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '1.8s'  },
  { top: '76%', left: '39%', color: '#7B2FFF', cls: 'w-1.5 h-1.5', anim: 'animate-float-slow', delay: '0.7s'  },
  { top: '63%', left: '57%', color: '#FF6B35', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '2.7s'  },
  { top: '74%', left: '81%', color: '#00F5D4', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '1.4s'  },
  { top: '47%', left: '8%',  color: '#FF3AF2', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '0.5s'  },
  { top: '42%', left: '21%', color: '#FFE600', cls: 'w-1.5 h-1.5', anim: 'animate-float-slow', delay: '2.2s'  },
  { top: '53%', left: '51%', color: '#7B2FFF', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '1.0s'  },
  { top: '44%', left: '65%', color: '#FF3AF2', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '0.2s'  },
  { top: '57%', left: '77%', color: '#00F5D4', cls: 'w-1.5 h-1.5', anim: 'animate-float',      delay: '3.1s'  },
  { top: '27%', left: '16%', color: '#FF6B35', cls: 'w-1 h-1',     anim: 'animate-float-slow', delay: '1.7s'  },
  { top: '32%', left: '49%', color: '#FFE600', cls: 'w-1 h-1',     anim: 'animate-float',      delay: '0.6s'  },
  { top: '22%', left: '71%', color: '#FF3AF2', cls: 'w-1.5 h-1.5', anim: 'animate-float-slow', delay: '2.9s'  },
];

export const DECORATIONS = [
  { char: '◆', top: '6%',  left: '30%', anim: 'animate-wiggle',        size: 'text-2xl', color: '#FF3AF2', delay: '0s'   },
  { char: '○', top: '80%', left: '84%', anim: 'animate-bounce-subtle', size: 'text-3xl', color: '#00F5D4', delay: '0.5s' },
  { char: '+', top: '44%', left: '88%', anim: 'animate-float',         size: 'text-3xl', color: '#FFE600', delay: '1s'   },
  { char: '◇', top: '88%', left: '42%', anim: 'animate-float-reverse', size: 'text-2xl', color: '#7B2FFF', delay: '0.3s' },
  { char: '△', top: '28%', left: '93%', anim: 'animate-wiggle',        size: 'text-xl',  color: '#FF3AF2', delay: '0.8s' },
  { char: '×', top: '58%', left: '93%', anim: 'animate-bounce-subtle', size: 'text-2xl', color: '#FF6B35', delay: '0.2s' },
  { char: '✦', top: '4%',  left: '4%',  anim: 'animate-spin-slow',     size: 'text-4xl', color: '#FFE600', delay: '0s'   },
  { char: '✦', top: '92%', left: '92%', anim: 'animate-spin-slow',     size: 'text-3xl', color: '#00F5D4', delay: '3s'   },
  { char: '★', top: '72%', left: '8%',  anim: 'animate-float-slow',    size: 'text-2xl', color: '#FF6B35', delay: '1.4s' },
];

// ─── Orbital ring system ──────────────────────────────────────────────────────
//
//  Hub sits at (CX%, CY%). Three concentric ellipses radiate outward.
//  Each ring has an angleOffset so items on different rings never land at
//  the same clock-position (prevents vertical stacking / overlap).
//
//  Outer  (quiet rooms)  — rX 38%, rY 27%,  starts at  0° (12 o'clock)
//  Middle (active rooms) — rX 24%, rY 17%,  starts at 45° (10:30 offset)
//  Inner  (DMs)          — rX 12%, rY  9%,  starts at 30° (11:00 offset)
//
//  MAX_PER_RING caps visible items; overflow shows a "+N" ghost bubble.

const CX = 50;
const CY = 53;

const RING = {
  outer:  { rX: 38, rY: 27, angleOffset: 0,              max: 10, color: 'rgba(0,245,212,0.08)'   },
  middle: { rX: 24, rY: 17, angleOffset: Math.PI / 4,    max:  8, color: 'rgba(255,58,242,0.12)'  },
  inner:  { rX: 12, rY:  9, angleOffset: Math.PI / 6,    max:  6, color: 'rgba(255,230,0,0.10)'   },
};

function orbitalPositions(count, rX, rY, angleOffset = 0) {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2 + angleOffset;
    return {
      left: `${CX + rX * Math.cos(angle)}%`,
      top:  `${CY + rY * Math.sin(angle)}%`,
    };
  });
}

const SCALE_KEY = 'heiyo_ring_scales';

function loadScales() {
  try { return JSON.parse(localStorage.getItem(SCALE_KEY) ?? 'null') ?? { outer: 1, middle: 1, inner: 1 }; }
  catch { return { outer: 1, middle: 1, inner: 1 }; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BubbleUniverse() {
  const { rooms, socket, dispatch, unread, dms, dmUnread, onlineUsers, me, setAuthUser } = useChat();
  const { sortedRooms, pinnedId, togglePin } = useRoomOrder(rooms);

  const [creating, setCreating]     = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showOnline, setShowOnline]  = useState(true);
  const [mouse, setMouse]            = useState({ x: 0.5, y: 0.5 });
  const [hubOpen, setHubOpen]        = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [scales, setScalesRaw]       = useState(loadScales);
  const rafRef  = useRef(null);
  const hubRef  = useRef(null);

  // Persist scales to localStorage whenever they change
  const setScales = useCallback((updater) => {
    setScalesRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(SCALE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Close hub panel on outside click
  useEffect(() => {
    if (!hubOpen) return;
    function onDown(e) {
      if (hubRef.current && !hubRef.current.contains(e.target)) setHubOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [hubOpen]);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    rafRef.current = requestAnimationFrame(() => {
      setMouse({ x, y });
      rafRef.current = null;
    });
  }, []);

  function enterRoom(roomId) {
    socket.emit('room:join', { roomId });
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId });
  }

  function createRoom(e) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    socket.emit('room:create', { name, description: newRoomDesc.trim() });
    setNewRoomName('');
    setNewRoomDesc('');
    setCreating(false);
  }

  function changeScale(ring, delta) {
    setScales((s) => ({ ...s, [ring]: Math.min(2, Math.max(0.4, +(s[ring] + delta).toFixed(2))) }));
  }

  // ── Categorise ──────────────────────────────────────────────────────────────
  const activeRooms = sortedRooms.filter(r => r.lastMessageAt != null);
  const quietRooms  = sortedRooms.filter(r => r.lastMessageAt == null);
  const dmList      = Object.values(dms ?? {}).sort((a, b) => {
    return (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0);
  });

  // ── Apply per-ring caps ──────────────────────────────────────────────────────
  const outerVisible   = quietRooms.slice(0, RING.outer.max);
  const outerOverflow  = Math.max(0, quietRooms.length  - RING.outer.max);
  const middleVisible  = activeRooms.slice(0, RING.middle.max);
  const middleOverflow = Math.max(0, activeRooms.length - RING.middle.max);
  const innerVisible   = dmList.slice(0, RING.inner.max);
  const innerOverflow  = Math.max(0, dmList.length      - RING.inner.max);

  // ── Orbital positions (include +1 slot if overflow needs a ghost bubble) ────
  const outerPos  = orbitalPositions(outerVisible.length  + (outerOverflow  > 0 ? 1 : 0), RING.outer.rX,  RING.outer.rY,  RING.outer.angleOffset);
  const middlePos = orbitalPositions(middleVisible.length + (middleOverflow > 0 ? 1 : 0), RING.middle.rX, RING.middle.rY, RING.middle.angleOffset);
  const innerPos  = orbitalPositions(innerVisible.length  + (innerOverflow  > 0 ? 1 : 0), RING.inner.rX,  RING.inner.rY,  RING.inner.angleOffset);

  function OverflowBubble({ pos, count, color }) {
    return (
      <div
        className="absolute z-10 flex items-center justify-center rounded-full border-2 border-dashed animate-pulse"
        style={{
          left: pos.left, top: pos.top,
          transform: 'translate(-50%, -50%)',
          width: '72px', height: '72px',
          borderColor: color,
          background: `${color}18`,
        }}
      >
        <span className="font-heading text-sm font-black" style={{ color }}>
          +{count}
        </span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-hidden" onMouseMove={handleMouseMove}>

      {/* ── SVG orbital ring guides ──────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0.20" />
            <stop offset="100%" stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0"    />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx="9" ry="6.5" fill="url(#hub-glow)" />

        {/* Outer ring */}
        <ellipse cx={CX} cy={CY} rx={RING.outer.rX}  ry={RING.outer.rY}
          fill="none" stroke="rgba(0,245,212,0.08)"  strokeWidth="0.35" strokeDasharray="2.5 6" />
        {/* Middle ring */}
        <ellipse cx={CX} cy={CY} rx={RING.middle.rX} ry={RING.middle.rY}
          fill="none" stroke="rgba(255,58,242,0.12)" strokeWidth="0.35" strokeDasharray="2 5"   />
        {/* Inner ring */}
        <ellipse cx={CX} cy={CY} rx={RING.inner.rX}  ry={RING.inner.rY}
          fill="none" stroke="rgba(255,230,0,0.10)"  strokeWidth="0.35" strokeDasharray="1.5 4" />
      </svg>

      {/* ── Zone labels ──────────────────────────────────────────────────────── */}
      <div className="absolute pointer-events-none select-none z-10"
        style={{ top: `${CY - RING.outer.rY - 3.5}%`, left: '50%', transform: 'translateX(-50%)' }}>
        <span className="font-heading text-[8px] font-black uppercase tracking-[0.55em] text-[#00F5D4]/25">channels</span>
      </div>
      {dmList.length > 0 && (
        <div className="absolute pointer-events-none select-none z-10"
          style={{ top: `${CY - RING.inner.rY - 3}%`, left: '50%', transform: 'translateX(-50%)' }}>
          <span className="font-heading text-[8px] font-black uppercase tracking-[0.55em] text-[#FFE600]/25">direct</span>
        </div>
      )}

      {/* ── Universe title ───────────────────────────────────────────────────── */}
      <div className="absolute top-7 left-1/2 z-10 -translate-x-1/2 text-center">
        <h1 className="font-heading text-6xl font-black uppercase tracking-tighter text-gradient">HEIYO</h1>
        <p className="mt-1 font-heading text-xs font-black uppercase tracking-[0.3em] text-[#FF3AF2]/50">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
          {dmList.length > 0 ? ` · ${dmList.length} dm${dmList.length !== 1 ? 's' : ''}` : ''}
          {' · click to enter'}
        </p>
      </div>

      {/* ── Decorative elements ──────────────────────────────────────────────── */}
      {DECORATIONS.map((d, i) => (
        <span key={i} aria-hidden="true"
          className={`pointer-events-none absolute select-none ${d.anim} ${d.size}`}
          style={{ top: d.top, left: d.left, animationDelay: d.delay, color: d.color, opacity: 0.45 }}
        >{d.char}</span>
      ))}

      {/* ── Ambient particles ────────────────────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <div key={`p${i}`} aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${p.cls} ${p.anim}`}
          style={{ top: p.top, left: p.left, backgroundColor: p.color, opacity: 0.2, animationDelay: p.delay, filter: 'blur(0.5px)' }}
        />
      ))}

      {/* ── Profile hub ──────────────────────────────────────────────────────── */}
      <div
        ref={hubRef}
        className="absolute z-30"
        style={{ left: `${CX}%`, top: `${CY}%`, transform: 'translate(-50%, -50%)' }}
      >
        {/* Outer pulse ring */}
        <div
          className="absolute rounded-full animate-spin-slow pointer-events-none"
          style={{
            inset: '-18px',
            border: `1px solid ${me?.color ?? '#FF3AF2'}44`,
          }}
        />
        {/* Inner dashed ring */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-8px',
            border: `1px dashed ${me?.color ?? '#FF3AF2'}22`,
          }}
        />
        {/* Glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-28px',
            background: `radial-gradient(circle, ${me?.color ?? '#FF3AF2'}18, transparent 70%)`,
          }}
        />

        {/* Clickable avatar card */}
        <button
          onClick={() => setHubOpen((v) => !v)}
          className="relative flex flex-col items-center gap-1.5 group"
          title="Your profile"
        >
          {/* Avatar image */}
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-110"
            style={{
              border: `3px solid ${me?.color ?? '#FF3AF2'}`,
              boxShadow: `0 0 20px ${me?.color ?? '#FF3AF2'}66, 0 0 48px ${me?.color ?? '#FF3AF2'}22`,
            }}
          >
            {me?.avatar
              ? <img src={avatarUrl(me.avatar)} alt={me.username} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center font-heading text-2xl font-black text-white">
                  {me?.username?.[0]?.toUpperCase() ?? '?'}
                </span>
            }
          </div>

          {/* Username pill */}
          <span
            className="font-heading text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              color: me?.color ?? '#FF3AF2',
              background: `${me?.color ?? '#FF3AF2'}18`,
              border: `1px solid ${me?.color ?? '#FF3AF2'}44`,
            }}
          >
            {me?.username ?? '…'}
          </span>
        </button>

        {/* ── Profile panel (open on click) ──────────────────────────────────── */}
        {hubOpen && (
          <div
            className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-64 animate-appear"
            style={{
              background: 'rgba(13,13,26,0.97)',
              border: `2px solid ${me?.color ?? '#FF3AF2'}55`,
              borderRadius: '1.25rem',
              boxShadow: `0 0 40px ${me?.color ?? '#FF3AF2'}33, 0 12px 40px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: `2px solid ${me?.color ?? '#FF3AF2'}` }}
              >
                {me?.avatar
                  ? <img src={avatarUrl(me.avatar)} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center font-heading text-lg font-black text-white">
                      {me?.username?.[0]?.toUpperCase()}
                    </span>
                }
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-black uppercase tracking-tight text-white truncate">
                  {me?.username}
                </p>
                {me?.tag && (
                  <p className="font-heading text-[10px] text-white/40">#{me.tag}</p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #34d399' }} />
                  <span className="font-heading text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            {/* ── Ring size controls ──────────────────────────────────────────── */}
            <div className="px-4 py-3 border-b border-white/8">
              <p className="font-heading text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">
                Bubble sizes
              </p>
              {[
                { key: 'outer',  label: 'Channels (outer)',  color: '#00F5D4' },
                { key: 'middle', label: 'Active (middle)',   color: '#FF3AF2' },
                { key: 'inner',  label: 'Direct (inner)',    color: '#FFE600' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-2 mb-2 last:mb-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
                  />
                  <span className="font-heading text-[10px] font-bold text-white/60 flex-1 truncate">{label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); changeScale(key, -0.15); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center font-heading text-xs font-black text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >−</button>
                    <span
                      className="w-8 text-center font-heading text-[10px] font-black"
                      style={{ color }}
                    >
                      {Math.round(scales[key] * 100)}%
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); changeScale(key, +0.15); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center font-heading text-xs font-black text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Action buttons ──────────────────────────────────────────────── */}
            <div className="flex gap-2 p-3">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingAvatar(true); setHubOpen(false); }}
                className="flex-1 rounded-full py-2 font-heading text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-all"
                style={{ background: `${me?.color ?? '#FF3AF2'}22`, border: `1px solid ${me?.color ?? '#FF3AF2'}55` }}
              >
                Edit Avatar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setAuthUser(null); }}
                className="flex-1 rounded-full py-2 font-heading text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-all border border-white/10 hover:border-white/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DM bubbles — inner ring ──────────────────────────────────────────── */}
      {innerVisible.map((dm, i) => {
        const other       = dm.participants?.find(p => p.id !== me?.id);
        const unreadCount = dmUnread?.[dm.id] ?? 0;
        const lastMsg     = dm.messages.at(-1);
        const pos         = innerPos[i];
        const color       = other?.color ?? '#FFE600';
        const pX = (mouse.x - 0.5) * 5 * -1;
        const pY = (mouse.y - 0.5) * 5 * -1;
        const sz = Math.round(78 * scales.inner);

        return (
          <button key={dm.id}
            className="absolute z-20 flex flex-col items-center gap-1 group animate-float-slow"
            style={{
              left: pos.left, top: pos.top,
              transform: `translate(calc(-50% + ${pX}px), calc(-50% + ${pY}px))`,
              transition: 'transform 0.12s ease-out',
              animationDelay: `${i * 0.9}s`,
            }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_DM', dmId: dm.id })}
            title={lastMsg ? `${other?.username}: ${lastMsg.text}` : other?.username}
          >
            <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                width: sz, height: sz,
                background: `${color}18`,
                border: `3px solid ${color}88`,
                borderRadius: '28%',
                boxShadow: `0 0 16px ${color}44`,
              }}
            >
              {other?.avatar
                ? <img src={avatarUrl(other.avatar)} alt="" className="w-full h-full object-cover rounded-[inherit]" style={{ borderRadius: '22%' }} />
                : <span className="font-heading font-black text-white select-none" style={{ fontSize: sz * 0.3 }}>
                    {other?.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
              }
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 font-heading text-[9px] font-black text-black animate-pulse"
                  style={{ backgroundColor: '#FFE600', boxShadow: '0 0 8px #FFE600' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="font-heading text-[9px] font-black uppercase tracking-widest"
              style={{ color: `${color}cc` }}>
              {other?.username ?? '…'}
            </span>
          </button>
        );
      })}
      {innerOverflow > 0 && innerPos[innerVisible.length] && (
        <OverflowBubble pos={innerPos[innerVisible.length]} count={innerOverflow} color="#FFE600" />
      )}

      {/* ── Active rooms — middle ring ───────────────────────────────────────── */}
      {middleVisible.map((room, i) => {
        const pos   = middlePos[i];
        const depth = 9 + (i % 4) * 2;
        return (
          <RoomBubble key={room.id} room={room} index={i}
            style={{ left: pos.left, top: pos.top }}
            centered
            sizeScale={scales.middle}
            onEnter={() => enterRoom(room.id)}
            unread={unread[room.id] ?? 0}
            parallaxX={(mouse.x - 0.5) * depth * -1}
            parallaxY={(mouse.y - 0.5) * depth * -1}
            isPinned={pinnedId === room.id}
            onPin={() => togglePin(room.id)}
          />
        );
      })}
      {middleOverflow > 0 && middlePos[middleVisible.length] && (
        <OverflowBubble pos={middlePos[middleVisible.length]} count={middleOverflow} color="#FF3AF2" />
      )}

      {/* ── Quiet rooms — outer ring ─────────────────────────────────────────── */}
      {outerVisible.map((room, i) => {
        const pos   = outerPos[i];
        const depth = 14 + (i % 4) * 2;
        return (
          <RoomBubble key={room.id} room={room} index={activeRooms.length + i}
            style={{ left: pos.left, top: pos.top }}
            centered
            sizeScale={scales.outer}
            onEnter={() => enterRoom(room.id)}
            unread={unread[room.id] ?? 0}
            parallaxX={(mouse.x - 0.5) * depth * -1}
            parallaxY={(mouse.y - 0.5) * depth * -1}
            isPinned={pinnedId === room.id}
            onPin={() => togglePin(room.id)}
          />
        );
      })}
      {outerOverflow > 0 && outerPos[outerVisible.length] && (
        <OverflowBubble pos={outerPos[outerVisible.length]} count={outerOverflow} color="#00F5D4" />
      )}

      {/* ── Online users panel — top-right ──────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-30 w-52">
        <button
          onClick={() => setShowOnline((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[#00F5D4]/60 bg-[#0D0D1A]/70 px-3 py-2 backdrop-blur-sm transition-all hover:border-[#00F5D4]"
        >
          <span className="font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">
            {Object.keys(onlineUsers).length + 1} online
          </span>
          <span className="font-heading text-[10px] text-[#00F5D4]/60">{showOnline ? '▴' : '▾'}</span>
        </button>
        {showOnline && (
          <div className="animate-appear mt-1 space-y-0.5 rounded-2xl border-2 border-dashed border-[#00F5D4]/40 bg-[#0D0D1A]/80 p-2 backdrop-blur-sm">
            {me && (
              <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: me.color, boxShadow: `0 0 6px ${me.color}` }} />
                <span className="flex-1 truncate font-heading text-[11px] font-black text-white">{me.username}</span>
                <span className="font-heading text-[9px] font-black text-[#FFE600]">you</span>
              </div>
            )}
            {Object.values(onlineUsers).map((user) => (
              <div key={user.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }} />
                <span className="flex-1 truncate font-heading text-[11px] font-black text-white/80">{user.username}</span>
              </div>
            ))}
            {Object.keys(onlineUsers).length === 0 && (
              <p className="px-2 py-2 text-center font-heading text-[10px] text-white/30">Just you so far</p>
            )}
          </div>
        )}
      </div>

      {/* ── Create room — bottom-right ───────────────────────────────────────── */}
      <div className="absolute bottom-8 right-8 z-30">
        {creating ? (
          <form onSubmit={createRoom}
            className="animate-appear flex flex-col gap-3 rounded-3xl border-4 border-[#FFE600] bg-[#2D1B4E]/95 p-6 backdrop-blur-sm"
            style={{ boxShadow: '0 0 20px rgba(255,58,242,0.4)' }}
          >
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#FFE600]">Room name</label>
            <input autoFocus value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="SUPERNOVA…" maxLength={32}
              className="rounded-full border-4 border-[#FF3AF2] bg-[#0D0D1A] px-5 py-3 font-heading text-sm font-black uppercase tracking-widest text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#FF3AF2]/30"
            />
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4]">
              Description <span className="font-normal normal-case text-white/30">(optional)</span>
            </label>
            <input value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)}
              placeholder="What happens here…" maxLength={120}
              className="rounded-full border-4 border-[#00F5D4]/50 bg-[#0D0D1A] px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#00F5D4]/20"
            />
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 rounded-full border-4 border-[#FFE600] bg-gradient-to-r from-[#FF3AF2] via-[#7B2FFF] to-[#00F5D4] px-5 py-2.5 font-heading text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-105">
                CREATE
              </button>
              <button type="button"
                onClick={() => { setCreating(false); setNewRoomName(''); setNewRoomDesc(''); }}
                className="rounded-full border-4 border-dashed border-[#FF3AF2] px-5 py-2.5 font-heading text-sm font-black uppercase tracking-widest text-[#FF3AF2] transition-all duration-200 hover:scale-105">
                CANCEL
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setCreating(true)}
            className="animate-pulse-glow rounded-full border-4 border-[#FFE600] bg-gradient-to-r from-[#FF3AF2] via-[#7B2FFF] to-[#00F5D4] px-8 py-4 font-heading text-base font-black uppercase tracking-widest text-white transition-all duration-300 hover:scale-110"
            style={{ boxShadow: '0 0 30px rgba(255,58,242,0.6)' }}>
            + NEW ROOM
          </button>
        )}
      </div>

      {/* ── Avatar picker modal ──────────────────────────────────────────────── */}
      {editingAvatar && (
        <AvatarPickerModal
          current={me?.avatar}
          onSave={(seed) => { socket.emit('avatar:change', { avatar: seed }); setEditingAvatar(false); }}
          onClose={() => setEditingAvatar(false)}
        />
      )}
    </div>
  );
}
