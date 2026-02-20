import { useState, useRef, useCallback, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import RoomBubble from './RoomBubble.jsx';
import AvatarPickerModal from './AvatarPickerModal.jsx';
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

// Preset emojis for the pulse picker
const PULSE_PRESETS = ['🔥','✨','💬','🎵','😎','💭','⚡','🌊','🎯','🔮','💥','🌀'];

// ─── Orbital ring system ──────────────────────────────────────────────────────
//
//  Orbit 1 — Inner  (Friends)  rX 12%, rY  9%  cap 10 — smallest bubbles → highest cap
//  Orbit 2 — Middle (Echoes)   rX 24%, rY 17%  cap  6 — ephemeral user signals
//  Orbit 3 — Outer  (Rooms)    rX 38%, rY 27%  cap  5 — largest bubbles + 1 "+" slot

const CX = 50;
const CY = 53;

const RING = {
  inner:  { rX: 12, rY:  9, angleOffset: Math.PI / 6, max: 10, color: 'rgba(255,230,0,0.10)'  },
  middle: { rX: 24, rY: 17, angleOffset: Math.PI / 4, max:  6, color: 'rgba(255,107,53,0.10)' },
  outer:  { rX: 38, rY: 27, angleOffset: 0,           max:  5, color: 'rgba(0,245,212,0.08)'  },
};

// Orbital speeds in rad/s — inner fastest (real orbital mechanics)
const ORBIT_SPEED = { inner: 0.08, middle: 0.05, outer: 0.03 };

const SCALE_KEY        = 'heiyo_ring_scales';
const ORBIT_HIDDEN_KEY = 'heiyo_orbit_hidden';

function orbitalPositions(count, rX, rY, angleOffset = 0, time = 0, speed = 0) {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2 + angleOffset + time * speed;
    return {
      left: `${CX + rX * Math.cos(angle)}%`,
      top:  `${CY + rY * Math.sin(angle)}%`,
    };
  });
}

function loadScales() {
  try { return JSON.parse(localStorage.getItem(SCALE_KEY) ?? 'null') ?? { outer: 1, middle: 1, inner: 1 }; }
  catch { return { outer: 1, middle: 1, inner: 1 }; }
}

function loadHiddenRooms() {
  try { return new Set(JSON.parse(localStorage.getItem(ORBIT_HIDDEN_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function fmtTimeLeft(ms) {
  if (ms <= 0) return 'Fading…';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Echo Profile Modal ───────────────────────────────────────────────────────

function EchoProfileModal({ echo, onClose, onDm, isOnline }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, echo.expiresAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, echo.expiresAt - Date.now());
      setTimeLeft(left);
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [echo.expiresAt]);

  const totalDuration = 10 * 60 * 1000;
  const pct = Math.max(0, (timeLeft / totalDuration) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-80 animate-appear flex flex-col items-center"
        style={{
          background: 'rgba(13,13,26,0.98)',
          border: `2px solid ${echo.color}55`,
          borderRadius: '1.75rem',
          boxShadow: `0 0 60px ${echo.color}22, 0 24px 64px rgba(0,0,0,0.85)`,
          padding: '2rem 1.5rem 1.5rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center font-heading text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >×</button>

        {/* Big echo text */}
        <div
          className="text-4xl mb-4 flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: `${echo.color}18`, border: `2px solid ${echo.color}40` }}
        >
          {echo.text}
        </div>

        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full overflow-hidden mb-3"
          style={{
            border: `3px solid ${echo.color}`,
            boxShadow: `0 0 20px ${echo.color}55`,
          }}
        >
          {echo.avatar && echo.avatar !== 'Stargazer'
            ? <img src={avatarUrl(echo.avatar)} alt="" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center font-heading text-2xl font-black text-white"
                style={{ background: `${echo.color}22` }}>
                {echo.username?.[0]?.toUpperCase() ?? '?'}
              </span>
          }
        </div>

        {/* Name + tag */}
        <p className="font-heading text-base font-black uppercase tracking-tight text-white mb-0.5">
          {echo.username}
        </p>
        {echo.tag && (
          <p className="font-heading text-[10px] text-white/35 mb-3">#{echo.tag}</p>
        )}

        {/* From room */}
        {echo.fromRoom && (
          <p className="font-heading text-[10px] text-white/40 mb-4">
            Pulsed from <span style={{ color: `${echo.color}cc` }}>{echo.fromRoom}</span>
          </p>
        )}

        {/* Time remaining */}
        <div className="w-full mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-heading text-[9px] text-white/30 uppercase tracking-widest">Fades in</span>
            <span className="font-heading text-[9px] font-black" style={{ color: echo.color }}>
              {fmtTimeLeft(timeLeft)}
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${echo.color}88, ${echo.color})`,
                boxShadow: `0 0 6px ${echo.color}`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        {isOnline && (
          <button
            onClick={() => { onDm(); onClose(); }}
            className="w-full rounded-full py-2.5 font-heading text-[11px] font-black uppercase tracking-widest text-[#0D0D1A] transition-all hover:scale-105"
            style={{ background: echo.color, boxShadow: `0 0 16px ${echo.color}88` }}
          >
            Send DM
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Pulse Picker Modal ───────────────────────────────────────────────────────

function PulsePicker({ activeRoomName, onPulse, onClose }) {
  const [selected, setSelected] = useState('');
  const [custom, setCustom]     = useState('');

  const text = custom.trim() || selected;

  function handlePulse() {
    if (!text) return;
    onPulse(text);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-start pb-24 pl-8"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-80 animate-appear flex flex-col gap-3"
        style={{
          background: 'rgba(13,13,26,0.98)',
          border: '2px solid rgba(255,107,53,0.4)',
          borderRadius: '1.5rem',
          boxShadow: '0 0 40px rgba(255,107,53,0.2), 0 20px 48px rgba(0,0,0,0.8)',
          padding: '1.25rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-sm font-black uppercase tracking-tight text-white">Pulse an Echo</p>
            {activeRoomName && (
              <p className="font-heading text-[9px] text-[#FF6B35]/60 mt-0.5">
                from <span className="text-[#FF6B35]">{activeRoomName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all font-heading"
          >×</button>
        </div>

        {/* Preset emojis */}
        <div className="grid grid-cols-6 gap-1.5">
          {PULSE_PRESETS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { setSelected(emoji); setCustom(''); }}
              className="flex items-center justify-center h-10 rounded-xl text-xl transition-all hover:scale-110"
              style={{
                background: selected === emoji && !custom ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.05)',
                border: selected === emoji && !custom ? '1.5px solid rgba(255,107,53,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: selected === emoji && !custom ? '0 0 10px rgba(255,107,53,0.3)' : 'none',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Custom text */}
        <input
          value={custom}
          onChange={e => { setCustom(e.target.value.slice(0, 20)); setSelected(''); }}
          placeholder="Or type a vibe… (20 chars)"
          maxLength={20}
          className="w-full rounded-full px-4 py-2 font-heading text-sm text-white placeholder-white/20 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: custom ? '1.5px solid rgba(255,107,53,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
          }}
        />

        {/* Pulse button */}
        <button
          onClick={handlePulse}
          disabled={!text}
          className="w-full rounded-full py-2.5 font-heading text-sm font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: text ? 'linear-gradient(135deg, #FF6B35, #FF3AF2)' : 'rgba(255,255,255,0.08)',
            color: text ? 'white' : 'rgba(255,255,255,0.3)',
            boxShadow: text ? '0 0 20px rgba(255,107,53,0.5)' : 'none',
          }}
        >
          ✦ PULSE
        </button>
      </div>
    </div>
  );
}

// ─── Orbit Customizer Modal ───────────────────────────────────────────────────

function OrbitCustomizerModal({ rooms, hiddenRooms, onToggle, onClose }) {
  const visibleCount = rooms.filter(r => !hiddenRooms.has(r.id)).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-96 max-h-[78vh] flex flex-col animate-appear"
        style={{
          background: 'rgba(13,13,26,0.98)',
          border: '2px solid rgba(0,245,212,0.35)',
          borderRadius: '1.5rem',
          boxShadow: '0 0 60px rgba(0,245,212,0.18), 0 24px 64px rgba(0,0,0,0.85)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🪐</span>
              <h2 className="font-heading text-sm font-black uppercase tracking-tight text-white">Room Orbit</h2>
            </div>
            <p className="font-heading text-[10px] text-white/35 leading-relaxed">
              Choose which rooms orbit around you.<br />
              Hidden rooms still exist — just off your radar.
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-lg text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 mt-0.5">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.length === 0 && (
            <p className="text-center font-heading text-[11px] text-white/25 py-10">No rooms yet.</p>
          )}
          {rooms.map(room => {
            const hidden = hiddenRooms.has(room.id);
            return (
              <button key={room.id} onClick={() => onToggle(room.id)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:bg-white/5 text-left"
                style={{
                  border: `1px solid ${hidden ? 'rgba(255,255,255,0.07)' : 'rgba(0,245,212,0.25)'}`,
                  background: hidden ? 'transparent' : 'rgba(0,245,212,0.04)',
                }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: hidden ? 'transparent' : '#00F5D4',
                    border: `2px solid ${hidden ? 'rgba(255,255,255,0.15)' : '#00F5D4'}`,
                    boxShadow: hidden ? 'none' : '0 0 10px #00F5D4aa',
                  }}>
                  {!hidden && <span className="font-heading text-[9px] text-[#0D0D1A] font-black leading-none">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-black uppercase tracking-tight truncate"
                    style={{ color: hidden ? 'rgba(255,255,255,0.25)' : 'white' }}>
                    {room.name}
                  </p>
                  {room.description && (
                    <p className="font-heading text-[9px] text-white/20 truncate mt-0.5">{room.description}</p>
                  )}
                </div>
                <span className="font-heading text-[10px] font-black flex-shrink-0 tabular-nums"
                  style={{ color: hidden ? 'rgba(255,255,255,0.15)' : '#00F5D4' }}>
                  {room.memberCount ?? 0} online
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
          <p className="font-heading text-[9px] text-white/25">
            <span style={{ color: 'rgba(0,245,212,0.5)' }}>{visibleCount}</span>/{rooms.length} in orbit
          </p>
          <button onClick={onClose}
            className="rounded-full px-4 py-1.5 font-heading text-[10px] font-black uppercase tracking-widest text-[#0D0D1A] transition-all hover:scale-105"
            style={{ background: '#00F5D4', boxShadow: '0 0 12px #00F5D4aa' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Heiyo geometric logo — inline SVG with gradient + glow ──────────────────

function HeiyoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7B2FBE" />
        </linearGradient>
        <filter id="logo-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer decagon ring */}
      <polygon
        points="24,3 33,7 43,17 43,31 33,41 24,45 15,41 5,31 5,17 15,7"
        stroke="url(#logo-grad)" strokeWidth="1.5" fill="none"
        filter="url(#logo-glow)" opacity="0.9"
      />
      {/* Inner rotated square */}
      <rect x="15" y="15" width="18" height="18" rx="2"
        transform="rotate(45 24 24)"
        stroke="url(#logo-grad)" strokeWidth="1" fill="rgba(0,229,255,0.05)"
      />
      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="url(#logo-grad)" />
    </svg>
  );
}

// ─── Orbit icon — mini SVG of the orbit ring, locks on when following ─────────

function OrbitIcon({ locked }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ display: 'block' }}>
      <ellipse cx="8" cy="5.5" rx="7" ry="4.5"
        stroke="currentColor" strokeWidth="1.5"
        strokeDasharray={locked ? '28' : '2.5 2'}
        style={{ transition: 'stroke-dasharray 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      />
      <circle cx="8" cy="5.5" r="2" fill="currentColor"
        style={{
          opacity: locked ? 1 : 0,
          transform: locked ? 'scale(1)' : 'scale(0)',
          transformOrigin: '8px 5.5px',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      />
    </svg>
  );
}

// ─── Offline follow modal — shown when clicking a ghost bubble in orbit 1 ──────

function OfflineFollowModal({ user, onUnfollow, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-72 animate-appear flex flex-col items-center"
        style={{
          background: 'rgba(13,13,26,0.98)',
          border: `2px solid ${user.color}33`,
          borderRadius: '1.75rem',
          boxShadow: `0 0 60px ${user.color}11, 0 24px 64px rgba(0,0,0,0.85)`,
          padding: '2rem 1.5rem 1.5rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center font-heading text-white/30 hover:text-white hover:bg-white/10 transition-all">
          ×
        </button>

        {/* Avatar — dimmed to signal offline */}
        <div className="w-16 h-16 rounded-full overflow-hidden mb-3"
          style={{ border: `3px solid ${user.color}44`, opacity: 0.45 }}>
          {user.avatar && user.avatar !== 'Stargazer'
            ? <img src={avatarUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center font-heading text-2xl font-black text-white"
                style={{ background: `${user.color}22` }}>
                {user.username?.[0]?.toUpperCase() ?? '?'}
              </span>
          }
        </div>

        <p className="font-heading text-base font-black uppercase tracking-tight text-white/40 mb-0.5">
          {user.username}
        </p>
        {user.tag && <p className="font-heading text-[10px] text-white/20 mb-4">#{user.tag}</p>}

        {/* Offline status pill */}
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="font-heading text-[8px]" style={{ color: `${user.color}66` }}>◎</span>
          <span className="font-heading text-[9px] font-black uppercase tracking-widest text-white/25">
            Drifting · Not in range
          </span>
        </div>

        <button
          onClick={() => { onUnfollow(user.username); onClose(); }}
          className="w-full rounded-full py-2 font-heading text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Release from orbit
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BubbleUniverse() {
  const { rooms, socket, dispatch, unread, dms, dmUnread, onlineUsers, me, setAuthUser, echoes, authUser, removingRooms, follows } = useChat();
  const [creating, setCreating]       = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showOnline, setShowOnline]       = useState(true);
  const [mouse, setMouse]                 = useState({ x: 0.5, y: 0.5 });
  const [hubOpen, setHubOpen]             = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [scales, setScalesRaw]            = useState(loadScales);
  const [hiddenRooms, setHiddenRooms]     = useState(loadHiddenRooms);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showPulse, setShowPulse]         = useState(false);
  const [pulseHovered, setPulseHovered]   = useState(false);
  const [rippleKey, setRippleKey]           = useState(0);
  const [viewEcho, setViewEcho]             = useState(null);
  const [viewFollow, setViewFollow]         = useState(null); // offline followed user or null
  const [outerRingPulseKey, setOuterRingPulseKey] = useState(0);
  const [orbitTime, setOrbitTime] = useState(0);
  const rafRef = useRef(null);
  const hubRef = useRef(null);
  const prevOuterUnreadRef = useRef(0);

  const setScales = useCallback((updater) => {
    setScalesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(SCALE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  function toggleRoomVisibility(roomId) {
    setHiddenRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      localStorage.setItem(ORBIT_HIDDEN_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    if (!hubOpen) return;
    function onDown(e) {
      if (hubRef.current && !hubRef.current.contains(e.target)) setHubOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [hubOpen]);

  const handleMouseMove = useCallback(e => {
    if (rafRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rafRef.current = requestAnimationFrame(() => { setMouse({ x, y }); rafRef.current = null; });
  }, []);

  function enterRoom(roomId, e) {
    let origin = null;
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    socket.emit('room:join', { roomId });
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId, origin });
  }

  function createRoom(e) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    socket.emit('room:create', { name, description: newRoomDesc.trim() });
    setNewRoomName(''); setNewRoomDesc(''); setCreating(false);
  }

  function changeScale(ring, delta) {
    setScales(s => ({ ...s, [ring]: Math.min(2, Math.max(0.4, +(s[ring] + delta).toFixed(2))) }));
  }

  function pulseEcho(text) {
    socket.emit('echo:pulse', { text, fromRoom: rooms[0]?.name ?? null });
  }

  function openDm(userId) {
    socket.emit('dm:open', { toUserId: userId });
  }

  function followUser(userId)   { socket.emit('user:follow',   { userId }); }
  function unfollowUser(username) { socket.emit('user:unfollow', { username }); }

  // ── Data ────────────────────────────────────────────────────────────────────

  // Orbit 1 — inner ring: followed users (online first, then offline ghosts)
  //           + DM partners NOT already shown as a follow (deduplicated)
  const dmList = Object.values(dms ?? {}).sort((a, b) =>
    (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0)
  );

  const followsSorted     = Object.values(follows ?? {})
    .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
  const followedSocketIds = new Set(followsSorted.filter(f => f.id).map(f => f.id));
  const dmListMerged      = dmList.filter(dm => {
    const other = dm.participants?.find(p => p.id !== me?.id);
    return !followedSocketIds.has(other?.id);
  });
  const innerItems = [
    ...followsSorted.map(u  => ({ kind: 'follow', user: u })),
    ...dmListMerged.map(dm  => ({ kind: 'dm',     dm })),
  ];

  // Orbit 2 — Echoes: real echoes only
  const realEchoes  = (echoes ?? []).slice(0, RING.middle.max);
  const totalMiddle = realEchoes.length;

  // Orbit 3 — Rooms (customizable)
  const visibleRooms  = rooms.filter(r => !hiddenRooms.has(r.id));

  // ── Caps ────────────────────────────────────────────────────────────────────
  const innerVisible  = innerItems.slice(0, RING.inner.max);
  const innerOverflow = Math.max(0, innerItems.length - RING.inner.max);
  const outerVisible  = visibleRooms.slice(0, RING.outer.max);

  // Orbit 3 unread total — drives ring pulse
  const outerUnreadTotal = outerVisible.reduce((sum, r) => sum + (unread[r.id] ?? 0), 0);
  useEffect(() => {
    if (outerUnreadTotal > prevOuterUnreadRef.current) {
      setOuterRingPulseKey(k => k + 1);
    }
    prevOuterUnreadRef.current = outerUnreadTotal;
  }, [outerUnreadTotal]);

  // Orbital motion — updates at ~30 fps (plenty smooth for slow orbital speeds)
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setOrbitTime((Date.now() - start) / 1000);
    }, 33);
    return () => clearInterval(id);
  }, []);

  // ── Orbital positions ────────────────────────────────────────────────────────
  const innerPos  = orbitalPositions(
    innerVisible.length + (innerOverflow > 0 ? 1 : 0),
    RING.inner.rX, RING.inner.rY, RING.inner.angleOffset, orbitTime, ORBIT_SPEED.inner
  );
  const middlePos = orbitalPositions(totalMiddle, RING.middle.rX, RING.middle.rY, RING.middle.angleOffset, orbitTime, ORBIT_SPEED.middle);
  // Outer always has +1 reserved for "+" button
  const outerPos  = orbitalPositions(
    outerVisible.length + 1, RING.outer.rX, RING.outer.rY, RING.outer.angleOffset, orbitTime, ORBIT_SPEED.outer
  );

  // Active room name (for pulse picker)
  const activeRoomName = rooms[0]?.name ?? null;

  function OverflowBubble({ pos, count, color }) {
    return (
      <div className="absolute z-10 flex items-center justify-center rounded-full border-2 border-dashed animate-pulse"
        style={{
          left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)',
          width: '72px', height: '72px', borderColor: color, background: `${color}18`,
        }}>
        <span className="font-heading text-sm font-black" style={{ color }}>+{count}</span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-hidden" onMouseMove={handleMouseMove}>

      {/* ── SVG orbital ring guides ──────────────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
        <defs>
          <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0.20" />
            <stop offset="100%" stopColor={me?.color ?? '#FF3AF2'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx="9" ry="6.5" fill="url(#hub-glow)" />
        {/* Orbit 3 — Rooms */}
        <ellipse cx={CX} cy={CY} rx={RING.outer.rX}  ry={RING.outer.rY}
          fill="none" stroke="rgba(0,245,212,0.08)"  strokeWidth="0.35" strokeDasharray="2.5 6" />
        {/* Orbit 3 — pulse layer (re-keyed on each new message to replay animation) */}
        {outerRingPulseKey > 0 && (
          <ellipse
            key={outerRingPulseKey}
            cx={CX} cy={CY}
            rx={RING.outer.rX} ry={RING.outer.rY}
            fill="none" stroke="rgba(0,245,212,1)" strokeWidth="0.6"
            className="animate-ring-pulse"
          />
        )}
        {/* Orbit 2 — Echoes */}
        <ellipse cx={CX} cy={CY} rx={RING.middle.rX} ry={RING.middle.rY}
          fill="none" stroke="rgba(255,107,53,0.10)" strokeWidth="0.35" strokeDasharray="2 5" />
        {/* Orbit 1 — Friends */}
        <ellipse cx={CX} cy={CY} rx={RING.inner.rX}  ry={RING.inner.rY}
          fill="none" stroke="rgba(255,230,0,0.10)"  strokeWidth="0.35" strokeDasharray="1.5 4" />
      </svg>

      {/* ── Zone labels — pill badges staggered diagonally ───────────────────── */}

      {/* Orbit 3: Rooms — top-left */}
      <div className="absolute pointer-events-none select-none z-10"
        style={{ top: `${CY - RING.outer.rY - 4}%`, left: '35%', transform: 'translateX(-50%)' }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(13,13,13,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <span className="font-heading text-[8px] font-black" style={{ color: 'rgba(0,229,255,0.5)' }}>○3</span>
          <span className="font-heading text-[7px] font-black uppercase tracking-[0.45em]" style={{ color: 'rgba(0,229,255,0.3)' }}>ROOMS</span>
        </div>
      </div>

      {/* Orbit 2: Echoes — top-center */}
      <div className="absolute pointer-events-none select-none z-10"
        style={{ top: `${CY - RING.middle.rY - 3}%`, left: '50%', transform: 'translateX(-50%)' }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(13,13,13,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <span className="font-heading text-[8px] font-black" style={{ color: 'rgba(255,107,53,0.55)' }}>○2</span>
          <span className="font-heading text-[7px] font-black uppercase tracking-[0.45em]" style={{ color: 'rgba(255,107,53,0.35)' }}>ECHOES</span>
        </div>
      </div>

      {/* Orbit 1: Friends — top-right */}
      <div className="absolute pointer-events-none select-none z-10"
        style={{ top: `${CY - RING.inner.rY - 2.5}%`, left: '65%', transform: 'translateX(-50%)' }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(13,13,13,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <span className="font-heading text-[8px] font-black" style={{ color: 'rgba(255,230,0,0.55)' }}>○1</span>
          <span className="font-heading text-[7px] font-black uppercase tracking-[0.45em]" style={{ color: 'rgba(255,230,0,0.35)' }}>FRIENDS</span>
        </div>
      </div>

      {/* ── Universe title ───────────────────────────────────────────────────── */}
      <div className="absolute top-7 left-1/2 z-10 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <HeiyoLogo size={38} />
          <h1 className="font-heading text-6xl font-black uppercase tracking-tighter text-gradient">HEIYO</h1>
          <HeiyoLogo size={38} />
        </div>
        <p className="mt-1 font-heading text-xs font-black uppercase tracking-[0.3em] text-[#FF3AF2]/50">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
          {dmList.length > 0 ? ` · ${dmList.length} friend${dmList.length !== 1 ? 's' : ''}` : ''}
          {echoes?.length > 0 ? ` · ${echoes.length} echo${echoes.length !== 1 ? 'es' : ''}` : ''}
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
      <div ref={hubRef} className="absolute z-30"
        style={{ left: `${CX}%`, top: `${CY}%`, transform: 'translate(-50%, -50%)' }}>

        {/* Radial glow */}
        <div className="absolute rounded-full pointer-events-none"
          style={{ inset: '-28px', background: `radial-gradient(circle, ${me?.color ?? '#FF3AF2'}18, transparent 70%)` }} />

        <button onClick={() => setHubOpen(v => !v)}
          className="relative flex flex-col items-center gap-1.5 group hub-button" title="Your profile">

          {/* SVG rings — centered on the 64 px avatar */}
          <svg
            className="absolute pointer-events-none"
            style={{ top: '-18px', left: 'calc(50% - 50px)', width: '100px', height: '100px', overflow: 'visible' }}
            viewBox="0 0 100 100"
          >
            {/* Outer spinning dashed ring */}
            <circle cx="50" cy="50" r="46"
              stroke={`${me?.color ?? '#FF3AF2'}44`}
              strokeWidth="1.2" strokeDasharray="6 8" fill="none"
              className="animate-spin-slow"
            />
            {/* Inner ring — expands on hover via CSS */}
            <circle cx="50" cy="50" r="36"
              stroke={`${me?.color ?? '#FF3AF2'}28`}
              strokeWidth="1" strokeDasharray="4 6" fill="none"
              className="profile-ring-inner"
            />
          </svg>
          <div className="relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-110"
            style={{ border: `3px solid ${me?.color ?? '#FF3AF2'}`, boxShadow: `0 0 20px ${me?.color ?? '#FF3AF2'}66, 0 0 48px ${me?.color ?? '#FF3AF2'}22` }}>
            {me?.avatar
              ? <img src={avatarUrl(me.avatar)} alt={me.username} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center font-heading text-2xl font-black text-white">
                  {me?.username?.[0]?.toUpperCase() ?? '?'}
                </span>
            }
          </div>
          <span className="font-heading text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              color: me?.color ?? '#FF3AF2',
              background: 'rgba(13,13,13,0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
            {me?.username ?? '…'}
          </span>
        </button>

        {hubOpen && (
          <div className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-64 animate-appear"
            style={{
              background: 'rgba(13,13,13,0.80)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '1.25rem',
              boxShadow: `0 0 40px ${me?.color ?? '#FF3AF2'}18, 0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}>
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: `2px solid ${me?.color ?? '#FF3AF2'}` }}>
                {me?.avatar
                  ? <img src={avatarUrl(me.avatar)} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center font-heading text-lg font-black text-white">
                      {me?.username?.[0]?.toUpperCase()}
                    </span>
                }
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-black uppercase tracking-tight text-white truncate">{me?.username}</p>
                {me?.tag && <p className="font-heading text-[10px] text-white/40">#{me.tag}</p>}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #34d399' }} />
                  <span className="font-heading text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-white/8">
              <p className="font-heading text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Bubble sizes</p>
              {[
                { key: 'inner',  label: 'Friends (orbit 1)', color: '#FFE600' },
                { key: 'middle', label: 'Echoes (orbit 2)',  color: '#FF6B35' },
                { key: 'outer',  label: 'Rooms (orbit 3)',   color: '#00F5D4' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-2 mb-2 last:mb-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                  <span className="font-heading text-[10px] font-bold text-white/60 flex-1 truncate">{label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); changeScale(key, -0.15); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center font-heading text-xs font-black text-white/50 hover:text-white hover:bg-white/10 transition-all">−</button>
                    <span className="w-8 text-center font-heading text-[10px] font-black" style={{ color }}>
                      {Math.round(scales[key] * 100)}%
                    </span>
                    <button onClick={e => { e.stopPropagation(); changeScale(key, +0.15); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center font-heading text-xs font-black text-white/50 hover:text-white hover:bg-white/10 transition-all">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-b border-white/8">
              <button
                onClick={e => { e.stopPropagation(); setShowCustomizer(true); setHubOpen(false); }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 font-heading text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all text-left"
              >
                <span className="text-sm">🪐</span>
                Orbit Settings
              </button>
            </div>
            <div className="flex gap-2 p-3">
              <button onClick={e => { e.stopPropagation(); setEditingAvatar(true); setHubOpen(false); }}
                className="flex-1 rounded-full py-2 font-heading text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-all"
                style={{ background: `${me?.color ?? '#FF3AF2'}22`, border: `1px solid ${me?.color ?? '#FF3AF2'}55` }}>
                Edit Avatar
              </button>
              <button onClick={e => { e.stopPropagation(); setAuthUser(null); }}
                className="flex-1 rounded-full py-2 font-heading text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-all border border-white/10 hover:border-white/20">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Orbit 1: inner ring — followed users + DM partners ───────────────── */}
      {innerVisible.map((item, i) => {
        const pos = innerPos[i];
        const pX  = (mouse.x - 0.5) * 5 * -1;
        const pY  = (mouse.y - 0.5) * 5 * -1;
        const sz  = Math.round(78 * scales.inner);

        // ── Follow bubble ──────────────────────────────────────────────────
        if (item.kind === 'follow') {
          const u      = item.user;
          const color  = u.color ?? '#FFE600';
          const isOnline = u.online;
          return (
            <button key={`follow-${u.username}`}
              className="absolute z-20 flex flex-col items-center gap-1 group"
              style={{
                left: pos.left, top: pos.top,
                transform: `translate(calc(-50% + ${pX}px), calc(-50% + ${pY}px))`,
                transition: 'transform 0.12s ease-out',
                opacity: isOnline ? 1 : 0.4,
              }}
              onClick={() => {
                if (isOnline) openDm(u.id);
                else setViewFollow(u);
              }}
              title={isOnline ? u.username : `${u.username} · offline`}
            >
              <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  width: sz, height: sz,
                  background: `${color}18`,
                  border: isOnline ? `3px solid ${color}88` : `2px dashed ${color}55`,
                  borderRadius: '28%',
                  boxShadow: isOnline ? `0 0 16px ${color}44` : 'none',
                }}>
                {u.avatar && u.avatar !== 'Stargazer'
                  ? <img src={avatarUrl(u.avatar)} alt="" className="w-full h-full object-cover rounded-[inherit]" style={{ borderRadius: '22%' }} />
                  : <span className="font-heading font-black text-white select-none" style={{ fontSize: sz * 0.3 }}>
                      {u.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                }
                {/* Orbit-locked indicator badge */}
                <div className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center rounded-full"
                  style={{
                    width: 18, height: 18,
                    background: 'rgba(13,13,13,0.9)',
                    border: `1.5px solid ${isOnline ? color : color + '55'}`,
                    color: isOnline ? color : color + '66',
                  }}>
                  <OrbitIcon locked />
                </div>
                {/* SVG hover ring */}
                <svg className="absolute pointer-events-none bubble-hover-ring"
                  style={{ top: -5, left: -5, width: sz + 10, height: sz + 10, overflow: 'visible' }}
                  viewBox={`0 0 ${sz + 10} ${sz + 10}`}
                >
                  <circle
                    cx={(sz + 10) / 2} cy={(sz + 10) / 2} r={(sz + 10) / 2 - 3}
                    stroke={color} strokeWidth="1.5" strokeDasharray="4 5"
                    fill="none" strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-heading text-[9px] font-black uppercase tracking-widest"
                style={{ color: isOnline ? `${color}cc` : `${color}55` }}>
                {u.username}
              </span>
            </button>
          );
        }

        // ── DM bubble ─────────────────────────────────────────────────────
        const dm          = item.dm;
        const other       = dm.participants?.find(p => p.id !== me?.id);
        const unreadCount = dmUnread?.[dm.id] ?? 0;
        const lastMsg     = dm.messages.at(-1);
        const color       = other?.color ?? '#FFE600';
        return (
          <button key={dm.id}
            className="absolute z-20 flex flex-col items-center gap-1 group"
            style={{
              left: pos.left, top: pos.top,
              transform: `translate(calc(-50% + ${pX}px), calc(-50% + ${pY}px))`,
              transition: 'transform 0.12s ease-out',
            }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_DM', dmId: dm.id })}
            title={lastMsg ? `${other?.username}: ${lastMsg.text}` : other?.username}
          >
            <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ width: sz, height: sz, background: `${color}18`, border: `3px solid ${color}88`, borderRadius: '28%', boxShadow: `0 0 16px ${color}44` }}>
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
              {/* SVG hover ring */}
              <svg className="absolute pointer-events-none bubble-hover-ring"
                style={{ top: -5, left: -5, width: sz + 10, height: sz + 10, overflow: 'visible' }}
                viewBox={`0 0 ${sz + 10} ${sz + 10}`}
              >
                <circle
                  cx={(sz + 10) / 2} cy={(sz + 10) / 2} r={(sz + 10) / 2 - 3}
                  stroke={color} strokeWidth="1.5" strokeDasharray="4 5"
                  fill="none" strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-heading text-[9px] font-black uppercase tracking-widest" style={{ color: `${color}cc` }}>
              {other?.username ?? '…'}
            </span>
          </button>
        );
      })}
      {innerOverflow > 0 && innerPos[innerVisible.length] && (
        <OverflowBubble pos={innerPos[innerVisible.length]} count={innerOverflow} color="#FFE600" />
      )}

      {/* ── Orbit 2: Echoes — middle ring (real echoes + ghost fill) ─────────── */}
      {realEchoes.map((echo, i) => {
        const pos = middlePos[i];
        const pX  = (mouse.x - 0.5) * 8 * -1;
        const pY  = (mouse.y - 0.5) * 8 * -1;
        const sz  = Math.round(68 * scales.middle);
        return (
          <button
            key={echo.id}
            className="absolute z-20 flex flex-col items-center gap-1 group"
            style={{
              left: pos.left, top: pos.top,
              transform: `translate(calc(-50% + ${pX}px), calc(-50% + ${pY}px))`,
              transition: 'transform 0.12s ease-out',
            }}
            onClick={() => setViewEcho(echo)}
            title={`${echo.username}: ${echo.text}`}
          >
            <div
              className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                width: sz, height: sz,
                background: `${echo.color}15`,
                border: `2.5px solid ${echo.color}70`,
                borderRadius: '50%',
                boxShadow: `0 0 18px ${echo.color}44`,
              }}
            >
              {echo.avatar && echo.avatar !== 'Stargazer'
                ? <img src={avatarUrl(echo.avatar)} alt="" className="w-full h-full object-cover rounded-full" />
                : <span className="font-heading font-black text-white select-none" style={{ fontSize: sz * 0.3 }}>
                    {echo.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
              }
              {/* Echo text badge */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full px-1.5 py-0.5"
                style={{
                  background: `${echo.color}cc`,
                  border: '1.5px solid rgba(13,13,26,0.8)',
                  minWidth: 22, fontSize: 11, lineHeight: 1,
                }}
              >
                {echo.text}
              </div>
            </div>
            <span className="font-heading text-[8px] font-black uppercase tracking-widest mt-1"
              style={{ color: `${echo.color}bb` }}>
              {echo.username}
            </span>
          </button>
        );
      })}

      {/* ── Orbit 3: Rooms — outer ring ──────────────────────────────────────── */}
      {outerVisible.map((room, i) => {
        const pos   = outerPos[i];
        const depth = 14 + (i % 4) * 2;
        return (
          <RoomBubble key={room.id} room={room} index={i}
            style={{ left: pos.left, top: pos.top }}
            centered sizeScale={scales.outer}
            onEnter={(e) => enterRoom(room.id, e)}
            unread={unread[room.id] ?? 0}
            parallaxX={(mouse.x - 0.5) * depth * -1}
            parallaxY={(mouse.y - 0.5) * depth * -1}
            imploding={removingRooms.includes(room.id)}
            isProtected={room.id === 'general'}
          />
        );
      })}

      {/* ── Ghost bubble: create new room — always last outer slot ─────────────── */}
      {outerPos[outerVisible.length] && (() => {
        const atCapacity = outerVisible.length >= RING.outer.max;
        const pos = outerPos[outerVisible.length];
        const sz  = Math.round(88 * scales.outer);
        const isGuest = authUser?.isGuest;
        return (
          <div
            key="ghost-create"
            className="absolute z-20"
            style={{
              left: pos.left, top: pos.top,
              transform: 'translate(-50%, -50%)',
              width: sz, height: sz,
            }}
          >
            <button
              onClick={() => { if (!isGuest && !atCapacity) setCreating(true); }}
              disabled={isGuest || atCapacity}
              title={isGuest ? 'Register to create rooms' : atCapacity ? 'Orbit full' : 'Create new room'}
              className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                atCapacity
                  ? 'opacity-20 scale-75 cursor-not-allowed'
                  : isGuest
                  ? 'opacity-30 cursor-not-allowed'
                  : 'animate-ghost-pulse cursor-pointer hover:opacity-100'
              }`}
              style={{
                background: 'transparent',
                border: `2px dashed rgba(255,255,255,${atCapacity ? '0.2' : '0.4'})`,
                boxShadow: atCapacity || isGuest ? 'none' : '0 0 12px rgba(123,47,255,0.3)',
              }}
            >
              <span style={{ fontSize: sz * 0.28, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>+</span>
            </button>
          </div>
        );
      })()}

      {/* ── Online users panel ───────────────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-30 w-52">
        <button onClick={() => setShowOnline(v => !v)}
          className="flex w-full items-center justify-between rounded-2xl px-3 py-2 transition-all hover:brightness-110"
          style={{
            background: 'rgba(13,13,13,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
          <span className="font-heading text-[10px] font-black uppercase tracking-widest" style={{ color: '#00E5FF' }}>
            {Object.keys(onlineUsers).length + 1} online
          </span>
          <span className="font-heading text-[10px]" style={{ color: 'rgba(0,229,255,0.5)' }}>{showOnline ? '▴' : '▾'}</span>
        </button>
        {showOnline && (
          <div className="animate-appear mt-1 space-y-0.5 rounded-2xl p-2"
            style={{
              background: 'rgba(13,13,13,0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            {me && (
              <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: me.color, boxShadow: `0 0 6px ${me.color}` }} />
                <span className="flex-1 truncate font-heading text-[11px] font-black text-white">{me.username}</span>
                <span className="font-heading text-[9px] font-black text-[#FFE600]">you</span>
              </div>
            )}
            {Object.values(onlineUsers).map(user => {
              const isFollowing = !!follows?.[user.username];
              const isGuest     = authUser?.isGuest;
              return (
                <div key={user.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }} />
                  <span className="flex-1 truncate font-heading text-[11px] font-black text-white/80">{user.username}</span>

                  {/* Orbit button */}
                  {isGuest ? (
                    <div className="group/orb relative">
                      <button disabled
                        className="flex items-center rounded-full px-1.5 py-1 cursor-not-allowed"
                        style={{ border: '1px solid rgba(255,230,0,0.12)', color: 'rgba(255,230,0,0.2)' }}>
                        <OrbitIcon locked={false} />
                      </button>
                      <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-36 rounded-xl bg-[#0D0D1A]/95 px-3 py-2 font-heading text-[9px] font-black uppercase tracking-wide text-white/40 opacity-0 group-hover/orb:opacity-100 transition-all duration-150 whitespace-nowrap"
                        style={{ border: '1px solid rgba(255,230,0,0.15)', boxShadow: '0 0 16px rgba(0,0,0,0.6)' }}>
                        Log in to orbit
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => isFollowing ? unfollowUser(user.username) : followUser(user.id)}
                      title={isFollowing ? 'Release from orbit' : 'Lock into orbit'}
                      className="flex items-center rounded-full px-1.5 py-1 transition-all duration-200 hover:scale-110"
                      style={{
                        border: `1px solid ${isFollowing ? 'rgba(255,230,0,0.55)' : 'rgba(255,230,0,0.18)'}`,
                        background: isFollowing ? 'rgba(255,230,0,0.10)' : 'transparent',
                        color: isFollowing ? '#FFE600' : 'rgba(255,230,0,0.3)',
                        boxShadow: isFollowing ? '0 0 8px rgba(255,230,0,0.25)' : 'none',
                      }}
                    >
                      <OrbitIcon locked={isFollowing} />
                    </button>
                  )}
                </div>
              );
            })}
            {Object.keys(onlineUsers).length === 0 && (
              <p className="px-2 py-2 text-center font-heading text-[10px] text-white/30">Just you so far</p>
            )}
          </div>
        )}
      </div>

      {/* ── Pulse Echo button — bottom-center ───────────────────────────────── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
        onMouseEnter={() => { setPulseHovered(true); setRippleKey(k => k + 1); }}
        onMouseLeave={() => setPulseHovered(false)}
      >
        {/* Tooltip */}
        <div
          className="pointer-events-none transition-all duration-200"
          style={{ opacity: pulseHovered ? 1 : 0, transform: pulseHovered ? 'translateY(0)' : 'translateY(4px)' }}
        >
          <span
            className="font-heading text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'rgba(255,58,242,0.8)' }}
          >
            Pulse
          </span>
        </div>

        {/* Orb wrapper — positions ripple ring relative to orb */}
        <div className="relative flex items-center justify-center">
          {/* Expanding ripple ring — re-keyed on every hover to replay animation */}
          {pulseHovered && (
            <div
              key={rippleKey}
              className="absolute animate-ripple-out rounded-full"
              style={{
                inset: 0,
                border: '1.5px solid rgba(255,58,242,0.55)',
              }}
            />
          )}

          {/* The orb button — SVG-first with breathing animation */}
          <button
            onClick={() => setShowPulse(true)}
            className="animate-orb-breathe transition-transform duration-300 hover:scale-110 focus:outline-none"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              filter: 'drop-shadow(0 0 14px rgba(255,58,242,0.55))',
            }}
            aria-label="Send a Pulse echo"
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <defs>
                <radialGradient id="pulse-orb-grad" cx="38%" cy="35%" r="65%">
                  <stop offset="0%"   stopColor="rgba(255,58,242,0.38)" />
                  <stop offset="100%" stopColor="rgba(123,47,190,0.10)" />
                </radialGradient>
              </defs>
              {/* Outer ambient ring */}
              <circle cx="32" cy="32" r="30" stroke="rgba(255,58,242,0.25)" strokeWidth="1" fill="none" />
              {/* Orb body */}
              <circle cx="32" cy="32" r="26" fill="url(#pulse-orb-grad)" stroke="rgba(255,58,242,0.55)" strokeWidth="1.5" />
              {/* Specular highlight */}
              <ellipse cx="26" cy="21" rx="8" ry="5" fill="rgba(255,255,255,0.07)" />
              {/* Sonar icon — center dot + 3 arcs */}
              <circle cx="32" cy="36" r="2.2" fill="#FF3AF2" />
              <path d="M27.5 33.5 Q32 27.5 36.5 33.5" stroke="#FF3AF2" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M23 36 Q32 24 41 36" stroke="#FF3AF2" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M18.5 38.5 Q32 20.5 45.5 38.5" stroke="#FF3AF2" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.28" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Create room form — centered overlay (triggered by ghost bubble in orbit 3) ── */}
      {creating && (
        <div className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => { setCreating(false); setNewRoomName(''); setNewRoomDesc(''); }}
        >
          <form onSubmit={createRoom}
            className="animate-appear flex flex-col gap-3 rounded-3xl border-4 border-[#FFE600] bg-[#2D1B4E]/95 p-6 backdrop-blur-sm w-80"
            style={{ boxShadow: '0 0 20px rgba(255,58,242,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#FFE600]">Room name</label>
            <input autoFocus value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
              placeholder="SUPERNOVA…" maxLength={32}
              className="rounded-full border-4 border-[#FF3AF2] bg-[#0D0D1A] px-5 py-3 font-heading text-sm font-black uppercase tracking-widest text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#FF3AF2]/30" />
            <label className="font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4]">
              Description <span className="font-normal normal-case text-white/30">(optional)</span>
            </label>
            <input value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)}
              placeholder="What happens here…" maxLength={120}
              className="rounded-full border-4 border-[#00F5D4]/50 bg-[#0D0D1A] px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-white placeholder-white/20 outline-none transition-all duration-300 focus:border-[#00F5D4] focus:ring-4 focus:ring-[#00F5D4]/20" />

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
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showPulse && (
        <PulsePicker
          activeRoomName={activeRoomName}
          onPulse={pulseEcho}
          onClose={() => setShowPulse(false)}
        />
      )}

      {viewEcho && (
        <EchoProfileModal
          echo={viewEcho}
          isOnline={!!onlineUsers[viewEcho.userId]}
          onDm={() => openDm(viewEcho.userId)}
          onClose={() => setViewEcho(null)}
        />
      )}

      {viewFollow && (
        <OfflineFollowModal
          user={viewFollow}
          onUnfollow={unfollowUser}
          onClose={() => setViewFollow(null)}
        />
      )}

      {showCustomizer && (
        <OrbitCustomizerModal
          rooms={rooms}
          hiddenRooms={hiddenRooms}
          onToggle={toggleRoomVisibility}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {editingAvatar && (
        <AvatarPickerModal
          current={me?.avatar}
          onSave={seed => { socket.emit('avatar:change', { avatar: seed }); setEditingAvatar(false); }}
          onClose={() => setEditingAvatar(false)}
        />
      )}
    </div>
  );
}
