import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import OnlineUsersPanel from './OnlineUsersPanel.jsx';
import AvatarPickerModal from './AvatarPickerModal.jsx';
import { avatarUrl } from '../utils/avatar.js';

export default function UserBadge() {
  const { me, onlineUsers, socket, setAuthUser } = useChat();
  const [open, setOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const ref = useRef(null);

  if (!me) return null;

  const count = Object.keys(onlineUsers).length + 1;

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
    // Also update authUser so the handshake stays in sync on reconnect
    setAuthUser((prev) => ({ ...prev, avatar: newAvatar }));
  }

  function handleSignOut() {
    setOpen(false);
    // Passing null clears localStorage and triggers AuthScreen
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
        {open && <OnlineUsersPanel onClose={() => setOpen(false)} />}

        {/* Badge pill */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-full border-4 border-dashed border-[#FFE600] bg-[#2D1B4E]/90 px-4 py-2 backdrop-blur-sm animate-slide-up cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{ boxShadow: open ? '0 0 28px rgba(255,230,0,0.6), 4px 4px 0 #FF3AF2' : '0 0 20px rgba(255,230,0,0.4), 4px 4px 0 #FF3AF2' }}
          aria-label="Show online users"
        >
          {/* Avatar with edit overlay on hover */}
          <div
            className="group/avatar relative h-10 w-10 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setEditingAvatar(true); }}
          >
            <img
              src={avatarUrl(me.avatar)}
              alt={me.username}
              className="h-10 w-10 rounded-full transition-all duration-150 group-hover/avatar:brightness-75"
              style={{ border: '2px solid #FFE600', boxShadow: '0 0 14px #FF3AF288' }}
            />
            {/* Pencil icon overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100">
              <span className="text-base drop-shadow-lg">✏️</span>
            </div>
          </div>

          {/* Name + count */}
          <div>
            <p
              className="font-heading text-sm font-black uppercase leading-none tracking-tight text-white"
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
              {count} online ▴
            </p>
          </div>

          {/* Live pulse dot */}
          <span
            aria-label="Online"
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#00F5D4] animate-pulse"
          />
        </button>

        {/* Sign-out link */}
        <button
          onClick={handleSignOut}
          className="mt-1.5 w-full text-center font-heading text-[9px] font-bold uppercase tracking-widest text-white/25 transition-colors hover:text-[#FF3AF2]/70"
        >
          sign out
        </button>
      </div>
    </>
  );
}
