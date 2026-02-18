import { useState, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import RoomBubble from './RoomBubble.jsx';
import { useRoomOrder } from '../hooks/useRoomOrder.js';

// Ambient particle field — 20 tiny slow-rising dots spread across the bg.
// Opacity is very low (0.2) so they feel like space dust, not noise.
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

// Pre-defined scatter positions — spread across the viewport, avoiding
// center (portal lives there) and bottom-left (user badge lives there).
const BUBBLE_POSITIONS = [
  { top: '14%',  left: '8%'  },
  { top: '18%',  left: '56%' },
  { top: '13%',  left: '80%' },
  { top: '52%',  left: '70%' },
  { top: '62%',  left: '50%' },
  { top: '68%',  left: '20%' },
  { top: '38%',  left: '4%'  },
  { top: '35%',  left: '42%' },
  { top: '76%',  left: '74%' },
  { top: '10%',  left: '36%' },
  { top: '80%',  left: '38%' },
  { top: '50%',  left: '28%' },
];

// Floating decorative geometric shapes scattered across the void — exported so AuthScreen can reuse them
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

export default function BubbleUniverse() {
  const { rooms, socket, dispatch, unread, onlineUsers, me } = useChat();
  const { sortedRooms, pinnedId, togglePin, reorder } = useRoomOrder(rooms);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showOnline, setShowOnline] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);

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

  return (
    <div className="relative h-full w-full" onMouseMove={handleMouseMove}>

      {/* ── Universe title ── */}
      <div className="absolute top-7 left-1/2 z-10 -translate-x-1/2 text-center">
        <h1 className="font-heading text-6xl font-black uppercase tracking-tighter text-gradient">
          HEIYO
        </h1>
        <p className="mt-1 font-heading text-xs font-black uppercase tracking-[0.3em] text-[#FF3AF2]/50">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} drifting · click to enter
        </p>
      </div>

      {/* ── Decorative floating elements ── */}
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

      {/* ── Ambient particle field ── */}
      {PARTICLES.map((p, i) => (
        <div
          key={`p${i}`}
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${p.cls} ${p.anim}`}
          style={{ top: p.top, left: p.left, backgroundColor: p.color, opacity: 0.2, animationDelay: p.delay, filter: 'blur(0.5px)' }}
        />
      ))}

      {/* ── Room bubbles ── */}
      {sortedRooms.map((room, i) => {
        const pos = BUBBLE_POSITIONS[i % BUBBLE_POSITIONS.length];
        const depth = 8 + (i % 5) * 3.5;
        const parallaxX = (mouse.x - 0.5) * depth * -1;
        const parallaxY = (mouse.y - 0.5) * depth * -1;
        return (
          <RoomBubble
            key={room.id}
            room={room}
            index={i}
            style={{ top: pos.top, left: pos.left }}
            onEnter={() => enterRoom(room.id)}
            unread={unread[room.id] ?? 0}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
            isPinned={pinnedId === room.id}
            onPin={() => togglePin(room.id)}
          />
        );
      })}

      {/* ── Reorder panel ── */}
      {reordering && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-64 rounded-2xl border-2 border-dashed border-[#7B2FFF]/70 bg-[#1a0f36]/95 backdrop-blur-md animate-appear"
          style={{ boxShadow: '0 0 40px rgba(123,47,255,0.2), 0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-heading text-xs font-black uppercase tracking-widest text-[#7B2FFF]">
              Room Order
            </p>
            <button
              onClick={() => { setReordering(false); setDragOver(null); }}
              className="font-heading text-[11px] font-black text-white/40 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="px-4 pt-2 pb-1 font-heading text-[9px] font-bold uppercase tracking-widest text-white/25">
            Drag to reorder · 📌 to pin first
          </p>

          {/* Draggable room list */}
          <ul className="px-2 pb-2 space-y-0.5">
            {sortedRooms.map((room, i) => (
              <li
                key={room.id}
                draggable
                onDragStart={(e) => {
                  dragFrom.current = i;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOver(i);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) reorder(dragFrom.current, i);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className={`flex items-center gap-2 rounded-xl px-2 py-2 cursor-grab active:cursor-grabbing transition-all duration-100
                  ${dragOver === i ? 'bg-[#7B2FFF]/20 scale-[1.02]' : 'hover:bg-white/5'}`}
              >
                {/* Drag handle */}
                <span className="font-heading text-sm text-white/20 select-none">≡</span>

                {/* Position badge */}
                <span
                  className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full font-heading text-[9px] font-black"
                  style={{
                    background: pinnedId === room.id ? '#7B2FFF' : 'rgba(255,255,255,0.08)',
                    color: pinnedId === room.id ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {i + 1}
                </span>

                {/* Room name */}
                <span className="flex-1 truncate font-heading text-xs font-black uppercase tracking-tight text-white/80">
                  {room.name}
                </span>

                {/* Pin toggle */}
                <button
                  onClick={() => togglePin(room.id)}
                  title={pinnedId === room.id ? 'Unpin' : 'Pin to slot 1'}
                  className={`flex-shrink-0 text-sm transition-all duration-150 hover:scale-125
                    ${pinnedId === room.id ? 'opacity-100' : 'opacity-25 hover:opacity-80'}`}
                >
                  📌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Reorder toggle button — bottom-left area, above user badge ── */}
      <button
        onClick={() => setReordering((v) => !v)}
        title="Reorder rooms"
        className={`absolute bottom-6 left-[13rem] z-30 flex items-center gap-1.5 rounded-full border-2 border-dashed px-3 py-1.5 font-heading text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-all duration-200 hover:scale-105
          ${reordering
            ? 'border-[#7B2FFF] bg-[#7B2FFF]/20 text-[#7B2FFF]'
            : 'border-white/20 bg-[#0D0D1A]/60 text-white/40 hover:border-[#7B2FFF]/60 hover:text-[#7B2FFF]/80'
          }`}
      >
        <span>⠿</span>
        <span>Order</span>
      </button>

      {/* ── Online users panel — top-right ── */}
      <div className="absolute top-6 right-6 z-10 w-52">
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
            {/* Self */}
            {me && (
              <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: me.color, boxShadow: `0 0 6px ${me.color}` }}
                />
                <span className="flex-1 truncate font-heading text-[11px] font-black uppercase text-white">
                  {me.username}
                </span>
                <span className="font-heading text-[9px] font-black text-[#FFE600]">you</span>
              </div>
            )}
            {/* Others */}
            {Object.values(onlineUsers).map((user) => (
              <div key={user.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }}
                />
                <span className="flex-1 truncate font-heading text-[11px] font-black uppercase text-white/80">
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

      {/* ── Create room control — bottom-right ── */}
      <div className="absolute bottom-8 right-8 z-10">
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
