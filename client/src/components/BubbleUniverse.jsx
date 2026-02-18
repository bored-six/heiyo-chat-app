import { useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import RoomBubble from './RoomBubble.jsx';

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

// Floating decorative emoji scattered across the void
const DECORATIONS = [
  { emoji: '✨', top: '6%',  left: '30%', anim: 'animate-wiggle',        size: 'text-4xl', delay: '0s'   },
  { emoji: '💫', top: '80%', left: '84%', anim: 'animate-bounce-subtle', size: 'text-5xl', delay: '0.5s' },
  { emoji: '⚡', top: '44%', left: '88%', anim: 'animate-float',         size: 'text-3xl', delay: '1s'   },
  { emoji: '🌀', top: '88%', left: '42%', anim: 'animate-float-reverse', size: 'text-4xl', delay: '0.3s' },
  { emoji: '💜', top: '28%', left: '93%', anim: 'animate-wiggle',        size: 'text-3xl', delay: '0.8s' },
  { emoji: '🔥', top: '58%', left: '93%', anim: 'animate-bounce-subtle', size: 'text-4xl', delay: '0.2s' },
  { emoji: '✦',  top: '4%',  left: '4%',  anim: 'animate-spin-slow',     size: 'text-5xl text-[#FFE600]', delay: '0s'   },
  { emoji: '✦',  top: '92%', left: '92%', anim: 'animate-spin-slow',     size: 'text-4xl text-[#00F5D4]', delay: '3s'   },
  { emoji: '★',  top: '72%', left: '8%',  anim: 'animate-float-slow',    size: 'text-3xl text-[#FF6B35]', delay: '1.4s' },
];

export default function BubbleUniverse() {
  const { rooms, socket, dispatch } = useChat();
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  function enterRoom(roomId) {
    socket.emit('room:join', { roomId });
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId });
  }

  function createRoom(e) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    socket.emit('room:create', { name });
    setNewRoomName('');
    setCreating(false);
  }

  return (
    <div className="relative h-full w-full">

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
          style={{ top: d.top, left: d.left, animationDelay: d.delay }}
        >
          {d.emoji}
        </span>
      ))}

      {/* ── Room bubbles ── */}
      {rooms.map((room, i) => {
        const pos = BUBBLE_POSITIONS[i % BUBBLE_POSITIONS.length];
        return (
          <RoomBubble
            key={room.id}
            room={room}
            index={i}
            style={{ top: pos.top, left: pos.left }}
            onEnter={() => enterRoom(room.id)}
          />
        );
      })}

      {/* ── Create room control — bottom-right ── */}
      <div className="absolute bottom-8 right-8 z-10">
        {creating ? (
          <form
            onSubmit={createRoom}
            className="animate-appear flex flex-col gap-3 rounded-3xl border-4 border-[#FFE600] bg-[#2D1B4E]/95 p-6 backdrop-blur-sm"
            style={{ boxShadow: '8px 8px 0 #FF3AF2, 16px 16px 0 #00F5D4' }}
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-full border-4 border-[#FFE600] bg-gradient-to-r from-[#FF3AF2] via-[#7B2FFF] to-[#00F5D4] px-5 py-2.5 font-heading text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-105"
              >
                CREATE
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewRoomName(''); }}
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
            style={{ boxShadow: '0 0 30px rgba(255,58,242,0.6), 8px 8px 0 #FFE600' }}
          >
            + NEW ROOM
          </button>
        )}
      </div>
    </div>
  );
}
