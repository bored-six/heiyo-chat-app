import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import AvatarPickerModal from './AvatarPickerModal.jsx';
import { avatarUrl } from '../utils/avatar.js';

export default function UserBadge() {
  const { me, socket, setAuthUser } = useChat();
  const [open, setOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const ref = useRef(null);

  if (!me) return null;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSaveAvatar(newAvatar) {
    socket.emit('avatar:change', { avatar: newAvatar });
    setAuthUser((prev) => ({ ...prev, avatar: newAvatar }));
  }

  function handleSignOut() {
    setOpen(false);
    setAuthUser(null);
  }

  return (
    <>
      {editingAvatar && (
        <AvatarPickerModal
          currentAvatar={me.avatar}
          onSave={handleSaveAvatar}
          onClose={() => setEditingAvatar(false)}
        />
      )}

      <div ref={ref} className="absolute bottom-6 left-6 z-30">

        {/* ── Profile toolbar ─────────────────────────────────────────── */}
        {open && (
          <div
            className="absolute bottom-full left-0 mb-3 w-64 overflow-hidden rounded-2xl border-2 border-dashed border-[#FFE600]/60 bg-[#1a0f36]/95 backdrop-blur-md animate-slide-up"
            style={{ boxShadow: '0 0 40px rgba(255,230,0,0.15), 0 8px 32px rgba(0,0,0,0.5)' }}
          >
            {/* Profile header */}
            <div
              className="flex items-center gap-3 p-4"
              style={{ background: `linear-gradient(135deg, ${me.color}22, transparent)` }}
            >
              <div
                className="relative h-14 w-14 flex-shrink-0 cursor-pointer group"
                onClick={() => { setEditingAvatar(true); setOpen(false); }}
                title="Edit avatar"
              >
                <img
                  src={avatarUrl(me.avatar)}
                  alt={me.username}
                  className="h-14 w-14 rounded-full transition-all duration-150 group-hover:brightness-75"
                  style={{ border: `2px solid ${me.color}`, boxShadow: `0 0 16px ${me.color}66` }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="text-lg drop-shadow-lg">✏️</span>
                </div>
              </div>
              <div className="min-w-0">
                <p
                  className="font-heading text-sm font-black tracking-tight text-white truncate"
                  style={{ textShadow: `1px 1px 0 ${me.color}` }}
                >
                  {me.username}
                </p>
                {me.tag && (
                  <p className="font-heading text-[10px] font-bold text-white/35">#{me.tag}</p>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00F5D4] animate-pulse" />
                  <span className="font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-white/10" />

            {/* Profile actions */}
            <div className="px-2 py-2">
              <p className="mb-1 px-3 font-heading text-[9px] font-black uppercase tracking-widest text-white/30">
                Profile
              </p>

              <button
                onClick={() => { setEditingAvatar(true); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/8 active:scale-[0.98]"
              >
                <span className="text-base">🎨</span>
                <div>
                  <p className="font-heading text-xs font-black uppercase tracking-wide text-white/80">
                    Edit Avatar
                  </p>
                  <p className="font-heading text-[9px] text-white/35">Change your chibi</p>
                </div>
              </button>

              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/8 active:scale-[0.98]"
                disabled
                title="Coming soon"
              >
                <span className="text-base opacity-40">⚙️</span>
                <div>
                  <p className="font-heading text-xs font-black uppercase tracking-wide text-white/30">
                    Settings
                  </p>
                  <p className="font-heading text-[9px] text-white/20">Coming soon</p>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-white/10" />

            {/* Account section */}
            <div className="px-2 py-2">
              <p className="mb-1 px-3 font-heading text-[9px] font-black uppercase tracking-widest text-white/30">
                Account
              </p>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-[#FF3AF2]/10 active:scale-[0.98] group/out"
              >
                <span className="text-base">🚪</span>
                <div>
                  <p className="font-heading text-xs font-black uppercase tracking-wide text-white/80 group-hover/out:text-[#FF3AF2] transition-colors">
                    Sign Out
                  </p>
                  <p className="font-heading text-[9px] text-white/35">Leave the universe</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Badge pill ──────────────────────────────────────────────── */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-full border-4 border-dashed border-[#FFE600] bg-[#2D1B4E]/90 px-4 py-2 backdrop-blur-sm animate-slide-up cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{ boxShadow: open ? '0 0 28px rgba(255,230,0,0.6)' : '0 0 20px rgba(255,230,0,0.4)' }}
          aria-label="Open profile menu"
        >
          {/* Avatar */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <img
              src={avatarUrl(me.avatar)}
              alt={me.username}
              className="h-10 w-10 rounded-full"
              style={{ border: '2px solid #FFE600', boxShadow: '0 0 14px #FF3AF288' }}
            />
          </div>

          {/* Name */}
          <div>
            <p
              className="font-heading text-sm font-black leading-none tracking-tight text-white"
              style={{ textShadow: `1px 1px 0 ${me.color}` }}
            >
              {me.username}
              {me.tag && (
                <span className="font-heading text-[10px] font-bold normal-case tracking-normal text-white/40 ml-0.5">
                  #{me.tag}
                </span>
              )}
            </p>
            <p className="mt-0.5 font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">
              Profile ▴
            </p>
          </div>

          {/* Live pulse dot */}
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#00F5D4] animate-pulse" />
        </button>

      </div>
    </>
  );
}
