import { useState, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import RoomBubble from './RoomBubble.jsx';
import { useRoomOrder } from '../hooks/useRoomOrder.js';

// Ambient particle field — 20 tiny slow-rising dots spread across the bg.
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

// Floating decorative shapes — exported so AuthScreen can reuse them
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

// ── Orbital ring system ────────────────────────────────────────────────────────
//
//  Hub sits at (CX%, CY%) in the viewport. Three concentric elliptical orbits
//  radiate outward. Positions are percentage-based so they scale with any window.
//
//  Inner  — DMs (your personal conversations, closest to you)
//  Middle — Active rooms (rooms that have had at least one message)
//  Outer  — Quiet rooms (freshly created rooms with no messages yet)
//
//  When a quiet room gets its first message it migrates from outer → middle.

const CX = 50;   // hub center — % from left
const CY = 52;   // hub center — % from top (slightly below true center for control clearance)

const RING = {
  inner:  { rX: 13, rY:  9.5 },   // DMs
  middle: { rX: 26, rY: 19   },   // active rooms
  outer:  { rX: 40, rY: 27   },   // quiet rooms
};

// Distribute `count` items evenly around an ellipse, starting from 12 o'clock.
function orbitalPositions(count, rX, rY) {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2;
    return {
      left: `${CX + rX * Math.cos(angle)}%`,
      top:  `${CY + rY * Math.sin(angle)}%`,
    };
  });
}

export default function BubbleUniverse() {
  const { rooms, socket, dispatch, unread, dms, dmUnread, onlineUsers, me } = useChat();
  const { sortedRooms, pinnedId, togglePin } = useRoomOrder(rooms);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showOnline, setShowOnline] = useState(true);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
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

  // ── Categorise rooms by activity ──────────────────────────────────────────
  const activeRooms = sortedRooms.filter(r => r.lastMessageAt != null);
  const quietRooms  = sortedRooms.filter(r => r.lastMessageAt == null);

  // ── DMs sorted by most recent message ─────────────────────────────────────
  const dmList = Object.values(dms ?? {}).sort((a, b) => {
    const aLast = a.messages.at(-1)?.timestamp ?? 0;
    const bLast = b.messages.at(-1)?.timestamp ?? 0;
    return bLast - aLast;
  });

  // ── Orbital positions ──────────────────────────────────────────────────────
  const innerPos  = orbitalPositions(dmList.length,      RING.inner.rX,  RING.inner.rY);
  const middlePos = orbitalPositions(activeRooms.length, RING.middle.rX, RING.middle.rY);
  const outerPos  = orbitalPositions(quietRooms.length,  RING.outer.rX,  RING.outer.rY);

  return (
    <div className="relative h-full w-full overflow-hidden" onMouseMove={handleMouseMove}>

      {/* ── SVG orbital ring guides ─────────────────────────────────────────── */}
      {/* viewBox 0 0 100 100 + preserveAspectRatio="none" maps coords directly  */}
      {/* to viewport %, so rX/rY values match the CSS-positioned bubbles exactly */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 1 }}
      >
        <defs>
          {/* Soft hub glow gradient */}
          <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0.18" />
            <stop offset="100%" stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* Hub ambient glow blob */}
        <ellipse cx={CX} cy={CY} rx="10" ry="7" fill="url(#hub-glow)" />

        {/* Outer ring — quiet rooms */}
        <ellipse
          cx={CX} cy={CY}
          rx={RING.outer.rX}  ry={RING.outer.rY}
          fill="none"
          stroke="rgba(0,245,212,0.08)"
          strokeWidth="0.3"
          strokeDasharray="2 5"
        />
        {/* Middle ring — active rooms */}
        <ellipse
          cx={CX} cy={CY}
          rx={RING.middle.rX} ry={RING.middle.rY}
          fill="none"
          stroke="rgba(255,58,242,0.12)"
          strokeWidth="0.3"
          strokeDasharray="2 4"
        />
        {/* Inner ring — DMs */}
        <ellipse
          cx={CX} cy={CY}
          rx={RING.inner.rX}  ry={RING.inner.rY}
          fill="none"
          stroke="rgba(255,230,0,0.10)"
          strokeWidth="0.3"
          strokeDasharray="1.5 4"
        />
      </svg>

      {/* ── Zone labels (faint watermarks above each ring) ─────────────────── */}
      <div
        className="absolute pointer-events-none select-none z-10"
        style={{ top: `${CY - RING.outer.rY - 3.5}%`, left: '50%', transform: 'translateX(-50%)' }}
      >
        <span className="font-heading text-[8px] font-black uppercase tracking-[0.55em] text-[#00F5D4]/22">
          channels
        </span>
      </div>
      {dmList.length > 0 && (
        <div
          className="absolute pointer-events-none select-none z-10"
          style={{ top: `${CY - RING.inner.rY - 3}%`, left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="font-heading text-[8px] font-black uppercase tracking-[0.55em] text-[#FFE600]/22">
            direct
          </span>
        </div>
      )}

      {/* ── Universe title ──────────────────────────────────────────────────── */}
      <div className="absolute top-7 left-1/2 z-10 -translate-x-1/2 text-center">
        <h1 className="font-heading text-6xl font-black uppercase tracking-tighter text-gradient">
          HEIYO
        </h1>
        <p className="mt-1 font-heading text-xs font-black uppercase tracking-[0.3em] text-[#FF3AF2]/50">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
          {dmList.length > 0 ? ` · ${dmList.length} dm${dmList.length !== 1 ? 's' : ''}` : ''}
          {' · click to enter'}
        </p>
      </div>

      {/* ── Decorative floating elements ────────────────────────────────────── */}
      {DECORATIONS.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute select-none ${d.anim} ${d.size}`}
          style={{ top: d.top, left: d.left, animationDelay: d.delay, color: d.color, opacity: 0.45 }}
        >
          {d.char}
        </span>
      ))}

      {/* ── Ambient particle field ──────────────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <div
          key={`p${i}`}
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${p.cls} ${p.anim}`}
          style={{ top: p.top, left: p.left, backgroundColor: p.color, opacity: 0.2, animationDelay: p.delay, filter: 'blur(0.5px)' }}
        />
      ))}

      {/* ── Center hub (pulsing vortex = you) ──────────────────────────────── */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ left: `${CX}%`, top: `${CY}%`, transform: 'translate(-50%, -50%)' }}
      >
        {/* Wide ambient glow */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '-36px',
            background: `radial-gradient(circle, ${me?.color ?? '#FF3AF2'}1A, transparent 70%)`,
          }}
        />
        {/* Slow-spinning outer ring */}
        <div
          className="absolute rounded-full border animate-spin-slow"
          style={{
            inset: '-12px',
            borderColor: `${me?.color ?? '#FF3AF2'}33`,
          }}
        />
        {/* Static inner ring */}
        <div
          className="absolute rounded-full border"
          style={{
            inset: '-4px',
            borderColor: `${me?.color ?? '#00F5D4'}22`,
            borderStyle: 'dashed',
          }}
        />
        {/* Core orb */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${me?.color ?? '#FF3AF2'}77 0%, transparent 72%)`,
            boxShadow: `0 0 18px ${me?.color ?? '#FF3AF2'}55, 0 0 44px ${me?.color ?? '#FF3AF2'}1A`,
          }}
        />
      </div>

      {/* ── DM bubbles — inner ring ─────────────────────────────────────────── */}
      {dmList.map((dm, i) => {
        const other       = dm.participants?.find(p => p.id !== me?.id);
        const unreadCount = dmUnread?.[dm.id] ?? 0;
        const lastMsg     = dm.messages.at(-1);
        const pos         = innerPos[i];
        const parallaxX   = (mouse.x - 0.5) * 5 * -1;
        const parallaxY   = (mouse.y - 0.5) * 5 * -1;
        const color       = other?.color ?? '#FFE600';

        return (
          <button
            key={dm.id}
            className="absolute z-20 flex flex-col items-center gap-1 group animate-float-slow"
            style={{
              left: pos.left,
              top: pos.top,
              transform: `translate(calc(-50% + ${parallaxX}px), calc(-50% + ${parallaxY}px))`,
              transition: 'transform 0.12s ease-out',
              animationDelay: `${i * 0.9}s`,
            }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_DM', dmId: dm.id })}
            title={lastMsg ? `${other?.username}: ${lastMsg.text}` : other?.username}
          >
            {/* Rounded-square avatar bubble */}
            <div
              className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                width: '78px',
                height: '78px',
                background: `${color}18`,
                border: `3px solid ${color}88`,
                borderRadius: '28%',
                boxShadow: `0 0 16px ${color}44, 0 0 40px ${color}18`,
              }}
            >
              <span className="font-heading text-xl font-black text-white select-none">
                {other?.username?.[0]?.toUpperCase() ?? '?'}
              </span>

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 font-heading text-[9px] font-black text-black animate-pulse"
                  style={{ backgroundColor: '#FFE600', boxShadow: '0 0 8px #FFE600' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Username label */}
            <span
              className="font-heading text-[9px] font-black uppercase tracking-widest"
              style={{ color: `${color}cc` }}
            >
              {other?.username ?? '…'}
            </span>
          </button>
        );
      })}

      {/* ── Active rooms — middle ring ──────────────────────────────────────── */}
      {activeRooms.map((room, i) => {
        const pos    = middlePos[i];
        const depth  = 9 + (i % 4) * 2.5;
        return (
          <RoomBubble
            key={room.id}
            room={room}
            index={i}
            style={{ left: pos.left, top: pos.top }}
            centered
            onEnter={() => enterRoom(room.id)}
            unread={unread[room.id] ?? 0}
            parallaxX={(mouse.x - 0.5) * depth * -1}
            parallaxY={(mouse.y - 0.5) * depth * -1}
            isPinned={pinnedId === room.id}
            onPin={() => togglePin(room.id)}
          />
        );
      })}

      {/* ── Quiet rooms — outer ring ────────────────────────────────────────── */}
      {quietRooms.map((room, i) => {
        const pos   = outerPos[i];
        const depth = 14 + (i % 4) * 2.5;
        return (
          <RoomBubble
            key={room.id}
            room={room}
            index={activeRooms.length + i}
            style={{ left: pos.left, top: pos.top }}
            centered
            onEnter={() => enterRoom(room.id)}
            unread={unread[room.id] ?? 0}
            parallaxX={(mouse.x - 0.5) * depth * -1}
            parallaxY={(mouse.y - 0.5) * depth * -1}
            isPinned={pinnedId === room.id}
            onPin={() => togglePin(room.id)}
          />
        );
      })}

      {/* ── Online users panel — top-right ─────────────────────────────────── */}
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
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: me.color, boxShadow: `0 0 6px ${me.color}` }}
                />
                <span className="flex-1 truncate font-heading text-[11px] font-black text-white">
                  {me.username}
                </span>
                <span className="font-heading text-[9px] font-black text-[#FFE600]">you</span>
              </div>
            )}
            {Object.values(onlineUsers).map((user) => (
              <div key={user.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }}
                />
                <span className="flex-1 truncate font-heading text-[11px] font-black text-white/80">
                  {user.username}
                </span>
              </div>
            ))}
            {Object.keys(onlineUsers).length === 0 && (
              <p className="px-2 py-2 text-center font-heading text-[10px] text-white/30">
                Just you so far
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Create room control — bottom-right ─────────────────────────────── */}
      <div className="absolute bottom-8 right-8 z-30">
        {creating ? (
          <form
            onSubmit={createRoom}
            className="animate-appear flex flex-col gap-3 rounded-3xl border-4 border-[#FFE600] bg-[#2D1B4E]/95 p-6 backdrop-blur-sm"
            style={{ boxShadow: '0 0 20px rgba(255,58,242,0.4)' }}
          >
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#FFE600]">
              Room name
            </label>
            <input
              autoFocus
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="SUPERNOVA…"
              maxLength={32}
              className="rounded-full border-4 border-[#FF3AF2] bg-[#0D0D1A] px-5 py-3 font-heading text-sm font-black uppercase tracking-widest text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#FF3AF2]/30"
            />
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4]">
              Description <span className="font-normal normal-case text-white/30">(optional)</span>
            </label>
            <input
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
              placeholder="What happens here…"
              maxLength={120}
              className="rounded-full border-4 border-[#00F5D4]/50 bg-[#0D0D1A] px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#00F5D4]/20"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-full border-4 border-[#FFE600] bg-gradient-to-r from-[#FF3AF2] via-[#7B2FFF] to-[#00F5D4] px-5 py-2.5 font-heading text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-105"
              >
                CREATE
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewRoomName(''); setNewRoomDesc(''); }}
                className="rounded-full border-4 border-dashed border-[#FF3AF2] px-5 py-2.5 font-heading text-sm font-black uppercase tracking-widest text-[#FF3AF2] transition-all duration-200 hover:scale-105"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="animate-pulse-glow rounded-full border-4 border-[#FFE600] bg-gradient-to-r from-[#FF3AF2] via-[#7B2FFF] to-[#00F5D4] px-8 py-4 font-heading text-base font-black uppercase tracking-widest text-white transition-all duration-300 hover:scale-110"
            style={{ boxShadow: '0 0 30px rgba(255,58,242,0.6)' }}
          >
            + NEW ROOM
          </button>
        )}
      </div>
    </div>
  );
}
